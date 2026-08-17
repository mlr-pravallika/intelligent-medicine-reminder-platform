import {
  ChangeEvent,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import { createFileRoute } from "@tanstack/react-router";

import {
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  Check,
  Clock3,
  Loader2,
  Pill,
  Save,
} from "lucide-react";

import { toast } from "sonner";

import {
  addMedicine,
  getMedicines,
  validateMedicineName,
} from "@/services/medicineService";

import { scanPrescription } from "@/services/ocrService";

import { SectionHeading } from "@/components/portal/stat-card";

import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "@/components/ui/alert";

import { Button } from "@/components/ui/button";

import { Card } from "@/components/ui/card";

import { Input } from "@/components/ui/input";

import { Label } from "@/components/ui/label";

import { Progress } from "@/components/ui/progress";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { Textarea } from "@/components/ui/textarea";

import { cn } from "@/lib/utils";


export const Route = createFileRoute(
  "/patient/medicines/add",
)({
  head: () => ({
    meta: [
      {
        title: "Add Medicine — MediCare AI",
      },
      {
        name: "description",
        content:
          "Add a medicine and configure its medication schedule.",
      },
    ],
  }),
  component: AddMedicinePage,
});


const steps = [
  "Medicine",
  "Dosage",
  "Schedule",
  "Quantity",
  "Instructions",
  "Confirmation",
] as const;


type FormState = {
  name: string;
  dosage: string;
  strengthUnit: string;
  instruction: string;
  frequency: string;
  times: string[];
  startDate: string;
  endDate: string;
  quantity: string;
  lowStockThreshold: string;
  notes: string;
};


type ExistingMedicine = {
  id: number;
  medicine_name: string;
  dosage: string;
  frequency: string;
  reminder_time: string;
  remaining_quantity?: number;
  low_stock_threshold?: number;
};


type ValidationResult = {
  valid: boolean;
  available: boolean;
  medicine_name: string;
  message: string;
  suggestion?: string | null;
};


const initialForm: FormState = {
  name: "",
  dosage: "",
  strengthUnit: "mg",
  instruction: "After food",
  frequency: "Once daily",
  times: ["09:00"],
  startDate: "",
  endDate: "",
  quantity: "30",
  lowStockThreshold: "5",
  notes: "",
};


function getReminderCount(
  frequency: string,
): number {
  switch (frequency) {
    case "Twice daily":
      return 2;

    case "Three times daily":
      return 3;

    default:
      return 1;
  }
}


function getDefaultTimes(
  count: number,
): string[] {
  const defaults = [
    "09:00",
    "14:00",
    "21:00",
  ];

  return Array.from(
    { length: count },
    (_, index) =>
      defaults[index] ?? "09:00",
  );
}


function synchronizeReminderTimes(
  frequency: string,
  existingTimes: string[],
): string[] {
  const count =
    getReminderCount(frequency);

  const defaults =
    getDefaultTimes(count);

  return Array.from(
    { length: count },
    (_, index) =>
      existingTimes[index] ??
      defaults[index] ??
      "09:00",
  );
}


function generateTimeOptions(): {
  value: string;
  label: string;
}[] {
  const options: {
    value: string;
    label: string;
  }[] = [];

  for (
    let hour = 0;
    hour < 24;
    hour += 1
  ) {
    for (
      const minute of [0, 30]
    ) {
      const value =
        `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`;

      const date = new Date(
        2000,
        0,
        1,
        hour,
        minute,
      );

      const label =
        date.toLocaleTimeString(
          "en-US",
          {
            hour: "2-digit",
            minute: "2-digit",
            hour12: true,
          },
        );

      options.push({
        value,
        label,
      });
    }
  }

  return options;
}


const TIME_OPTIONS =
  generateTimeOptions();


function formatReminderTime(
  value: string,
): string {
  const option =
    TIME_OPTIONS.find(
      (item) =>
        item.value === value,
    );

  return option?.label ?? value;
}


function normalizeReminderTimes(
  value: unknown,
): string[] {
  if (Array.isArray(value)) {
    return value
      .map((item) =>
        String(item).trim(),
      )
      .filter(Boolean);
  }

  if (typeof value === "string") {
    return value
      .split(",")
      .map((item) =>
        item.trim(),
      )
      .filter(Boolean);
  }

  return [];
}


function isValidDateRange(
  startDate: string,
  endDate: string,
): boolean {
  if (!startDate || !endDate) {
    return false;
  }

  return (
    new Date(startDate).getTime() <=
    new Date(endDate).getTime()
  );
}


function isValidTime(value: string) {
  return /^(?:[01]\d|2[0-3]):[0-5]\d$/.test(
    value,
  );
}


function AddMedicinePage() {
  const [step, setStep] =
    useState(0);

  const [form, setForm] =
    useState<FormState>(
      initialForm,
    );

  const [saving, setSaving] =
    useState(false);

  const [scanning, setScanning] =
    useState(false);

  const [
    existingMedicines,
    setExistingMedicines,
  ] = useState<ExistingMedicine[]>(
    [],
  );

  const [
    validatingMedicine,
    setValidatingMedicine,
  ] = useState(false);

  const [
    medicineValidation,
    setMedicineValidation,
  ] =
    useState<ValidationResult | null>(
      null,
    );

  const validationRequestId =
    useRef(0);


  useEffect(() => {
    const loadMedicines =
      async () => {
        try {
          const data =
            await getMedicines();

          setExistingMedicines(
            data as ExistingMedicine[],
          );
        } catch (error) {
          console.error(
            "Unable to load medicines:",
            error,
          );
        }
      };

    void loadMedicines();
  }, []);


  /*
   * OCR data can be passed from the OCR page
   * through localStorage.
   *
   * The first detected medicine is loaded
   * into this add-medicine form.
   */
  useEffect(() => {
    const saved =
      localStorage.getItem(
        "ocrData",
      );

    if (!saved) {
      return;
    }

    try {
      const data =
        JSON.parse(saved);

      localStorage.removeItem(
        "ocrData",
      );

      const rawMedicines =
        data?.medicines;

      const medicine =
        Array.isArray(rawMedicines)
          ? rawMedicines[0]
          : rawMedicines;

      if (!medicine) {
        return;
      }

      const frequency =
        medicine.frequency ||
        "Once daily";

      const extractedTimes =
        normalizeReminderTimes(
          medicine.reminder_time ??
            medicine.reminder_times,
        );

      const dosageText =
        String(
          medicine.dosage ?? "",
        ).trim();

      const dosageMatch =
        dosageText.match(
          /^(.+?)\s+(mg|mcg|g|ml|IU|puff)$/i,
        );

      const extractedDosage =
        dosageMatch?.[1] ??
        dosageText;

      const extractedUnit =
        dosageMatch?.[2] ??
        "mg";

      setForm((current) => ({
        ...current,

        name:
          medicine.medicine_name ??
          "",

        dosage:
          extractedDosage,

        strengthUnit:
          extractedUnit,

        frequency,

        times:
          synchronizeReminderTimes(
            frequency,
            extractedTimes,
          ),

        instruction:
          medicine.instructions ||
          "After food",

        notes:
          medicine.instructions ||
          "",

        startDate:
          medicine.start_date ||
          current.startDate,

        endDate:
          medicine.end_date ||
          current.endDate,

        quantity:
          medicine.total_quantity !=
          null
            ? String(
                medicine.total_quantity,
              )
            : current.quantity,

        lowStockThreshold:
          medicine.low_stock_threshold !=
          null
            ? String(
                medicine.low_stock_threshold,
              )
            : current.lowStockThreshold,
      }));

      setMedicineValidation({
        valid: true,
        available: true,
        medicine_name:
          medicine.medicine_name ??
          "",
        message:
          "Medicine details were imported from the prescription. Please review them before saving.",
        suggestion: null,
      });

      setStep(0);
    } catch (error) {
      console.error(
        "OCR data error:",
        error,
      );

      localStorage.removeItem(
        "ocrData",
      );
    }
  }, []);


  const updateField = <
    K extends keyof FormState
  >(
    key: K,
    value: FormState[K],
  ) => {
    setForm((current) => ({
      ...current,
      [key]: value,
    }));

    if (key === "name") {
      setMedicineValidation(
        null,
      );

      validationRequestId.current += 1;
    }
  };


  const handleFrequencyChange = (
    frequency: string,
  ) => {
    setForm((current) => ({
      ...current,
      frequency,
      times:
        synchronizeReminderTimes(
          frequency,
          current.times,
        ),
    }));
  };


  const updateReminderTime = (
    index: number,
    value: string,
  ) => {
    setForm((current) => {
      const nextTimes =
        synchronizeReminderTimes(
          current.frequency,
          current.times,
        );

      nextTimes[index] = value;

      return {
        ...current,
        times: nextTimes,
      };
    });
  };


  const reminderTimes =
    useMemo(
      () =>
        synchronizeReminderTimes(
          form.frequency,
          form.times,
        ),
      [
        form.frequency,
        form.times,
      ],
    );


  const duplicateMedicine =
    useMemo(() => {
      const enteredName =
        form.name
          .trim()
          .toLowerCase();

      if (!enteredName) {
        return null;
      }

      return (
        existingMedicines.find(
          (medicine) =>
            medicine.medicine_name
              ?.trim()
              .toLowerCase() ===
            enteredName,
        ) ?? null
      );
    }, [
      existingMedicines,
      form.name,
    ]);


  /*
   * Medicine verification is optional.
   *
   * If the backend/AI verification
   * is unavailable, the medicine can
   * still be saved.
   */
  useEffect(() => {
    const name =
      form.name.trim();

    if (name.length < 2) {
      setMedicineValidation(
        null,
      );

      setValidatingMedicine(
        false,
      );

      return;
    }

    const requestId =
      ++validationRequestId.current;

    const timer =
      window.setTimeout(
        async () => {
          try {
            setValidatingMedicine(
              true,
            );

            const result =
              await validateMedicineName(
                name,
              );

            if (
              requestId !==
              validationRequestId.current
            ) {
              return;
            }

            setMedicineValidation({
              valid:
                result?.valid !== false,

              available: true,

              medicine_name:
                result?.medicine_name ??
                name,

              message:
                result?.message ??
                "Medicine name checked successfully.",

              suggestion:
                result?.suggestion ??
                null,
            });
          } catch (error) {
            console.error(
              "Medicine validation unavailable:",
              error,
            );

            if (
              requestId !==
              validationRequestId.current
            ) {
              return;
            }

            /*
             * IMPORTANT:
             * Do not block the form when
             * AI verification is unavailable.
             */
            setMedicineValidation({
              valid: true,
              available: false,
              medicine_name: name,
              message:
                "AI medicine verification is temporarily unavailable. You can continue and save the medicine.",
              suggestion: null,
            });
          } finally {
            if (
              requestId ===
              validationRequestId.current
            ) {
              setValidatingMedicine(
                false,
              );
            }
          }
        },
        700,
      );

    return () =>
      window.clearTimeout(
        timer,
      );
  }, [form.name]);


  const isCurrentStepValid =
    (): boolean => {
      if (step === 0) {
        return (
          form.name
            .trim()
            .length >= 2 &&
          !duplicateMedicine
        );
      }

      if (step === 1) {
        return (
          form.dosage
            .trim()
            .length > 0
        );
      }

      if (step === 2) {
        const requiredCount =
          getReminderCount(
            form.frequency,
          );

        return (
          reminderTimes.length ===
            requiredCount &&
          reminderTimes.every(
            (time) =>
              Boolean(time) &&
              isValidTime(time),
          ) &&
          Boolean(form.startDate) &&
          Boolean(form.endDate) &&
          isValidDateRange(
            form.startDate,
            form.endDate,
          )
        );
      }

      if (step === 3) {
        const quantity =
          Number(form.quantity);

        const lowStockThreshold =
          Number(
            form.lowStockThreshold,
          );

        return (
          Number.isFinite(
            quantity,
          ) &&
          quantity > 0 &&
          Number.isFinite(
            lowStockThreshold,
          ) &&
          lowStockThreshold >= 1 &&
          lowStockThreshold <
            quantity
        );
      }

      return true;
    };


  const handleNext = () => {
    if (step === 0) {
      if (
        form.name
          .trim()
          .length < 2
      ) {
        toast.error(
          "Please enter a valid medicine name.",
        );

        return;
      }

      if (duplicateMedicine) {
        toast.error(
          `${duplicateMedicine.medicine_name} is already registered in your account.`,
        );

        return;
      }

      /*
       * Verification is informational.
       * It does NOT block continuation.
       */
    }

    if (
      step === 2 &&
      !isCurrentStepValid()
    ) {
      toast.error(
        isValidDateRange(
          form.startDate,
          form.endDate,
        )
          ? "Please select all required reminder times."
          : "End date must be on or after the start date.",
      );

      return;
    }

    if (
      step === 3 &&
      !isCurrentStepValid()
    ) {
      const quantity =
        Number(form.quantity);

      const lowStockThreshold =
        Number(
          form.lowStockThreshold,
        );

      if (
        !Number.isFinite(
          quantity,
        ) ||
        quantity <= 0
      ) {
        toast.error(
          "Please enter a valid quantity.",
        );

        return;
      }

      if (
        !Number.isFinite(
          lowStockThreshold,
        ) ||
        lowStockThreshold < 1
      ) {
        toast.error(
          "Low Stock Alert must be at least 1.",
        );

        return;
      }

      if (
        lowStockThreshold >=
        quantity
      ) {
        toast.error(
          "Low Stock Alert must be lower than the quantity in hand.",
        );

        return;
      }
    }

    setStep((current) =>
      Math.min(
        steps.length - 1,
        current + 1,
      ),
    );
  };


  const handleSave =
    async () => {
      if (
        form.name
          .trim()
          .length < 2
      ) {
        toast.error(
          "Please enter a medicine name.",
        );

        setStep(0);

        return;
      }

      if (duplicateMedicine) {
        toast.error(
          `${duplicateMedicine.medicine_name} is already registered.`,
        );

        setStep(0);

        return;
      }

      if (!isCurrentStepValid()) {
        toast.error(
          "Please complete all required medicine details.",
        );

        return;
      }

      if (
        reminderTimes.some(
          (time) =>
            !isValidTime(time),
        )
      ) {
        toast.error(
          "Please select valid reminder times.",
        );

        setStep(2);

        return;
      }

      try {
        setSaving(true);

        const dosage =
          `${form.dosage.trim()} ${form.strengthUnit}`.trim();

        const instructions = [
          form.instruction,
          form.notes.trim(),
        ]
          .filter(Boolean)
          .join(" — ");

        const quantity =
          Number(form.quantity);

        const lowStockThreshold =
          Number(
            form.lowStockThreshold,
          );

        await addMedicine({
          medicine_name:
            form.name.trim(),

          dosage,

          frequency:
            form.frequency,

          reminder_time:
            reminderTimes.join(","),

          start_date:
            form.startDate,

          end_date:
            form.endDate,

          instructions:
            instructions || undefined,

          total_quantity:
            quantity,

          remaining_quantity:
            quantity,

          tablets_per_day:
            getReminderCount(
              form.frequency,
            ),

          low_stock_threshold:
            lowStockThreshold,
        });

        toast.success(
          `${form.name.trim()} added successfully.`,
        );

        setForm({
          ...initialForm,
          times: [
            "09:00",
          ],
        });

        setMedicineValidation(
          null,
        );

        validationRequestId.current += 1;

        setStep(0);

        try {
          const freshMedicines =
            await getMedicines();

          setExistingMedicines(
            freshMedicines as ExistingMedicine[],
          );
        } catch (refreshError) {
          console.error(
            "Unable to refresh medicines:",
            refreshError,
          );
        }
      } catch (error) {
        console.error(
          "Save medicine error:",
          error,
        );

        const axiosError =
          error as {
            response?: {
              status?: number;
              data?: {
                detail?: unknown;
                message?: string;
              };
            };
            message?: string;
          };

        const status =
          axiosError.response
            ?.status;

        const detail =
          axiosError.response
            ?.data?.detail;

        const backendMessage =
          axiosError.response
            ?.data?.message;

        let message =
          "Unable to save the medicine.";

        if (
          typeof detail ===
          "string"
        ) {
          message = detail;
        } else if (
          Array.isArray(detail)
        ) {
          message =
            detail
              .map(
                (item: unknown) => {
                  if (
                    item &&
                    typeof item ===
                      "object" &&
                    "msg" in item
                  ) {
                    return String(
                      (
                        item as {
                          msg?: unknown;
                        }
                      ).msg ??
                        "Validation error",
                    );
                  }

                  return "Validation error";
                },
              )
              .join(", ");
        } else if (
          typeof backendMessage ===
            "string" &&
          backendMessage.trim()
        ) {
          message =
            backendMessage;
        } else if (
          typeof axiosError.message ===
            "string" &&
          axiosError.message.trim()
        ) {
          message =
            axiosError.message;
        }

        if (status === 401) {
          message =
            "Your session has expired. Please log in again.";
        } else if (
          status === 422
        ) {
          message =
            `Medicine validation failed: ${message}`;
        } else if (
          status === 500
        ) {
          message =
            `Server error while saving the medicine: ${message}`;
        }

        toast.error(message);
      } finally {
        setSaving(false);
      }
    };


  const handlePrescriptionScan =
    async (
      event: ChangeEvent<HTMLInputElement>,
    ) => {
      const file =
        event.target.files?.[0];

      if (!file) {
        return;
      }

      const allowedTypes =
        [
          "image/jpeg",
          "image/png",
          "image/webp",
          "image/bmp",
          "image/tiff",
        ];

      if (
        !allowedTypes.includes(
          file.type,
        ) &&
        !file.name
          .toLowerCase()
          .match(
            /\.(jpg|jpeg|png|webp|bmp|tif|tiff)$/i,
          )
      ) {
        toast.error(
          "Please upload a JPG, PNG, WEBP, BMP or TIFF prescription image.",
        );

        event.target.value = "";

        return;
      }

      try {
        setScanning(true);

        const data =
          await scanPrescription(
            file,
          );

        if (
          !data ||
          !Array.isArray(
            data.medicines,
          ) ||
          data.medicines.length === 0
        ) {
          toast.error(
            "No medicines were detected. Please upload a clearer prescription image.",
          );

          return;
        }

        /*
         * Store the full OCR result.
         * The OCR page can handle multiple
         * medicines. This add page loads
         * the first one for editing.
         */
        localStorage.setItem(
          "ocrData",
          JSON.stringify(data),
        );

        toast.success(
          "Prescription scanned successfully. Medicine details imported.",
        );

        window.location.reload();
      } catch (error) {
        console.error(
          "Prescription scan error:",
          error,
        );

        const axiosError =
          error as {
            response?: {
              status?: number;
              data?: {
                detail?: unknown;
                message?: string;
              };
            };
            message?: string;
          };

        const detail =
          axiosError.response
            ?.data?.detail;

        const backendMessage =
          axiosError.response
            ?.data?.message;

        let message =
          "Failed to scan prescription.";

        if (
          typeof detail ===
          "string"
        ) {
          message = detail;
        } else if (
          typeof backendMessage ===
            "string"
        ) {
          message =
            backendMessage;
        } else if (
          typeof axiosError.message ===
            "string"
        ) {
          message =
            axiosError.message;
        }

        toast.error(
          message,
        );
      } finally {
        setScanning(false);

        event.target.value = "";
      }
    };


  return (
    <div className="space-y-6">
      <SectionHeading
        title="Add Medicine"
        description="Configure your medicine, reminder schedule, quantity, low stock alert and instructions."
      />

      <div className="grid gap-5 xl:grid-cols-[1.5fr_1fr]">
        <Card className="gap-0 rounded-2xl border-border/70 p-6 shadow-soft">

          <ol className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-6">
            {steps.map(
              (
                label,
                index,
              ) => (
                <li
                  key={label}
                  className="min-w-0"
                >
                  <div
                    className={cn(
                      "flex items-center gap-2 rounded-xl px-2.5 py-2 text-xs font-semibold",
                      index ===
                        step
                        ? "bg-primary-soft text-primary"
                        : index < step
                          ? "text-accent"
                          : "text-muted-foreground",
                    )}
                  >
                    <span
                      className={cn(
                        "grid size-5 shrink-0 place-items-center rounded-full text-[10px]",
                        index < step
                          ? "bg-accent text-accent-foreground"
                          : index === step
                            ? "bg-primary text-primary-foreground"
                            : "bg-muted",
                      )}
                    >
                      {index <
                      step ? (
                        <Check className="size-3" />
                      ) : (
                        index + 1
                      )}
                    </span>

                    <span className="truncate">
                      {label}
                    </span>
                  </div>
                </li>
              ),
            )}
          </ol>


          <Progress
            value={
              ((step + 1) /
                steps.length) *
              100
            }
            className="mt-4 h-1.5"
          />


          <div className="mt-6 space-y-5">

            {step === 0 && (
              <div className="space-y-5">

                <div className="space-y-2">
                  <Label htmlFor="medicine-name">
                    Medicine name
                  </Label>

                  <div className="relative">
                    <Input
                      id="medicine-name"
                      value={
                        form.name
                      }
                      onChange={(
                        event,
                      ) =>
                        updateField(
                          "name",
                          event.target
                            .value,
                        )
                      }
                      placeholder="e.g. Paracetamol"
                      autoComplete="off"
                      className="h-11 rounded-xl pr-28"
                    />

                    {validatingMedicine && (
                      <span className="absolute right-3 top-1/2 flex -translate-y-1/2 items-center gap-1.5 text-xs text-muted-foreground">
                        <Loader2 className="size-3.5 animate-spin" />
                        Checking
                      </span>
                    )}

                    {!validatingMedicine &&
                      medicineValidation
                        ?.valid &&
                      medicineValidation
                        ?.available && (
                        <span className="absolute right-3 top-1/2 flex -translate-y-1/2 items-center gap-1 text-xs font-semibold text-emerald-500">
                          <Check className="size-3.5" />
                          Verified
                        </span>
                      )}
                  </div>
                </div>


                {medicineValidation && (
                  <Alert
                    className={cn(
                      "rounded-2xl",
                      medicineValidation
                        .available
                        ? medicineValidation.valid
                          ? "border-accent/40 bg-accent/10"
                          : "border-destructive/40 bg-destructive/10"
                        : "border-warning/40 bg-warning/10",
                    )}
                  >
                    {!medicineValidation
                      .available ? (
                      <AlertTriangle className="size-4 text-warning" />
                    ) : medicineValidation.valid ? (
                      <Check className="size-4 text-accent" />
                    ) : (
                      <AlertTriangle className="size-4 text-destructive" />
                    )}

                    <AlertTitle className="font-bold">
                      {!medicineValidation
                        .available
                        ? "AI verification unavailable"
                        : medicineValidation.valid
                          ? "Medicine verified"
                          : "Medicine not recognized"}
                    </AlertTitle>

                    <AlertDescription>
                      {medicineValidation.message}

                      {!medicineValidation.valid &&
                        medicineValidation.suggestion && (
                          <span className="mt-1 block">
                            Suggested medicine:{" "}
                            <strong>
                              {
                                medicineValidation.suggestion
                              }
                            </strong>
                          </span>
                        )}
                    </AlertDescription>
                  </Alert>
                )}


                {duplicateMedicine && (
                  <Alert className="rounded-2xl border-warning/40 bg-warning/10">
                    <AlertTriangle className="size-4 text-warning" />

                    <AlertTitle className="font-bold">
                      Medicine already registered
                    </AlertTitle>

                    <AlertDescription>
                      <strong>
                        {
                          duplicateMedicine.medicine_name
                        }
                      </strong>{" "}
                      is already in your medicine list.

                      <span className="mt-1 block">
                        Existing reminder
                        {duplicateMedicine.reminder_time.includes(
                          ",",
                        )
                          ? "s"
                          : ""}{" "}
                        :{" "}
                        {duplicateMedicine.reminder_time
                          .split(",")
                          .map(
                            (time) =>
                              formatReminderTime(
                                time.trim(),
                              ),
                          )
                          .join(
                            ", ",
                          )}
                      </span>
                    </AlertDescription>
                  </Alert>
                )}


                <p className="text-xs text-muted-foreground">
                  AI verification is helpful but not required to save a medicine. Always review the entered details before saving.
                </p>
              </div>
            )}


            {step === 1 && (
              <div className="space-y-5">

                <div className="grid gap-4 sm:grid-cols-[1fr_140px]">

                  <div className="space-y-2">
                    <Label>
                      Dosage / Strength
                    </Label>

                    <Input
                      value={
                        form.dosage
                      }
                      onChange={(
                        event,
                      ) =>
                        updateField(
                          "dosage",
                          event.target
                            .value,
                        )
                      }
                      placeholder="500"
                      className="h-11 rounded-xl"
                    />
                  </div>


                  <div className="space-y-2">
                    <Label>
                      Unit
                    </Label>

                    <Select
                      value={
                        form.strengthUnit
                      }
                      onValueChange={(
                        value,
                      ) =>
                        updateField(
                          "strengthUnit",
                          value,
                        )
                      }
                    >
                      <SelectTrigger className="h-11 rounded-xl">
                        <SelectValue />
                      </SelectTrigger>

                      <SelectContent>
                        {[
                          "mg",
                          "mcg",
                          "g",
                          "ml",
                          "IU",
                          "puff",
                        ].map(
                          (unit) => (
                            <SelectItem
                              key={unit}
                              value={unit}
                            >
                              {unit}
                            </SelectItem>
                          ),
                        )}
                      </SelectContent>
                    </Select>
                  </div>

                </div>


                <div className="space-y-2">
                  <Label>
                    Intake instruction
                  </Label>

                  <Select
                    value={
                      form.instruction
                    }
                    onValueChange={(
                      value,
                    ) =>
                      updateField(
                        "instruction",
                        value,
                      )
                    }
                  >
                    <SelectTrigger className="h-11 rounded-xl">
                      <SelectValue />
                    </SelectTrigger>

                    <SelectContent>
                      {[
                        "Before food",
                        "After food",
                        "With food",
                        "Empty stomach",
                        "Before sleep",
                      ].map(
                        (instruction) => (
                          <SelectItem
                            key={instruction}
                            value={
                              instruction
                            }
                          >
                            {instruction}
                          </SelectItem>
                        ),
                      )}
                    </SelectContent>
                  </Select>
                </div>

              </div>
            )}


            {step === 2 && (
              <div className="space-y-6">

                <div className="space-y-2">
                  <Label>
                    Frequency
                  </Label>

                  <Select
                    value={
                      form.frequency
                    }
                    onValueChange={
                      handleFrequencyChange
                    }
                  >
                    <SelectTrigger className="h-11 rounded-xl">
                      <SelectValue />
                    </SelectTrigger>

                    <SelectContent>
                      {[
                        "Once daily",
                        "Twice daily",
                        "Three times daily",
                        "Every other day",
                        "Weekly",
                        "As needed",
                      ].map(
                        (frequency) => (
                          <SelectItem
                            key={frequency}
                            value={
                              frequency
                            }
                          >
                            {frequency}
                          </SelectItem>
                        ),
                      )}
                    </SelectContent>
                  </Select>
                </div>


                <div className="space-y-3">

                  <div>
                    <Label>
                      Reminder times
                    </Label>

                    <p className="mt-1 text-xs text-muted-foreground">
                      {
                        getReminderCount(
                          form.frequency,
                        )
                      }{" "}
                      reminder{" "}
                      {getReminderCount(
                        form.frequency,
                      ) === 1
                        ? "time"
                        : "times"}{" "}
                      required.
                    </p>
                  </div>


                  <div className="space-y-3">
                    {Array.from(
                      {
                        length:
                          getReminderCount(
                            form.frequency,
                          ),
                      },
                    ).map(
                      (_, index) => (
                        <div
                          key={`${form.frequency}-${index}`}
                          className="rounded-2xl border border-border/60 bg-muted/20 p-4"
                        >
                          <div className="mb-2 flex items-center justify-between">
                            <Label className="text-xs font-semibold text-muted-foreground">
                              Reminder time{" "}
                              {index + 1}
                            </Label>

                            <span className="inline-flex items-center gap-1 text-[11px] text-muted-foreground">
                              <Clock3 className="size-3" />
                              Select time
                            </span>
                          </div>

                          <Select
                            value={
                              reminderTimes[
                                index
                              ] ??
                              "09:00"
                            }
                            onValueChange={(
                              value,
                            ) =>
                              updateReminderTime(
                                index,
                                value,
                              )
                            }
                          >
                            <SelectTrigger className="h-11 rounded-xl bg-background">
                              <SelectValue placeholder="Select reminder time" />
                            </SelectTrigger>

                            <SelectContent className="max-h-72">
                              {TIME_OPTIONS.map(
                                (
                                  option,
                                ) => (
                                  <SelectItem
                                    key={
                                      option.value
                                    }
                                    value={
                                      option.value
                                    }
                                  >
                                    {
                                      option.label
                                    }
                                  </SelectItem>
                                ),
                              )}
                            </SelectContent>
                          </Select>
                        </div>
                      ),
                    )}
                  </div>


                  <Alert className="rounded-2xl border-primary/20 bg-primary/5">
                    <Pill className="size-4 text-primary" />

                    <AlertTitle>
                      Reminder schedule
                    </AlertTitle>

                    <AlertDescription>
                      <div className="mt-1 flex flex-wrap gap-2">
                        {reminderTimes.map(
                          (
                            time,
                            index,
                          ) => (
                            <span
                              key={index}
                              className="inline-flex items-center gap-1 rounded-full border border-border/70 bg-background px-3 py-1.5 text-xs font-semibold"
                            >
                              <Clock3 className="size-3.5" />
                              {formatReminderTime(
                                time,
                              )}
                            </span>
                          ),
                        )}
                      </div>
                    </AlertDescription>
                  </Alert>

                </div>


                <div className="grid gap-4 sm:grid-cols-2">

                  <div className="space-y-2">
                    <Label>
                      Start date
                    </Label>

                    <Input
                      type="date"
                      value={
                        form.startDate
                      }
                      onChange={(
                        event,
                      ) =>
                        updateField(
                          "startDate",
                          event.target
                            .value,
                        )
                      }
                      className="h-11 rounded-xl"
                    />
                  </div>


                  <div className="space-y-2">
                    <Label>
                      End date
                    </Label>

                    <Input
                      type="date"
                      value={
                        form.endDate
                      }
                      onChange={(
                        event,
                      ) =>
                        updateField(
                          "endDate",
                          event.target
                            .value,
                        )
                      }
                      className="h-11 rounded-xl"
                    />
                  </div>

                </div>


                {form.startDate &&
                  form.endDate &&
                  !isValidDateRange(
                    form.startDate,
                    form.endDate,
                  ) && (
                    <Alert className="rounded-2xl border-destructive/40 bg-destructive/10">
                      <AlertTriangle className="size-4 text-destructive" />

                      <AlertTitle>
                        Invalid date range
                      </AlertTitle>

                      <AlertDescription>
                        End date must be on or after the start date.
                      </AlertDescription>
                    </Alert>
                  )}

              </div>
            )}


            {step === 3 && (
              <div className="space-y-5">

                <div className="space-y-2">
                  <Label htmlFor="quantity">
                    Quantity in hand
                  </Label>

                  <Input
                    id="quantity"
                    type="number"
                    min="1"
                    value={
                      form.quantity
                    }
                    onChange={(
                      event,
                    ) =>
                      updateField(
                        "quantity",
                        event.target
                          .value,
                      )
                    }
                    placeholder="Enter quantity"
                    className="h-11 rounded-xl"
                  />

                  <p className="text-xs text-muted-foreground">
                    Enter the total number of tablets available.
                  </p>
                </div>


                <div className="space-y-2">
                  <Label htmlFor="low-stock-threshold">
                    Low Stock Alert
                  </Label>

                  <Input
                    id="low-stock-threshold"
                    type="number"
                    min="1"
                    value={
                      form.lowStockThreshold
                    }
                    onChange={(
                      event,
                    ) =>
                      updateField(
                        "lowStockThreshold",
                        event.target
                          .value,
                      )
                    }
                    placeholder="e.g. 5"
                    className="h-11 rounded-xl"
                  />

                  <p className="text-xs text-muted-foreground">
                    An alert will be created when the remaining quantity reaches this value.
                  </p>
                </div>


                {Number(
                  form.lowStockThreshold,
                ) < 1 && (
                  <Alert className="rounded-2xl border-destructive/40 bg-destructive/10">
                    <AlertTriangle className="size-4 text-destructive" />

                    <AlertTitle>
                      Invalid Low Stock Alert
                    </AlertTitle>

                    <AlertDescription>
                      Low Stock Alert must be at least 1.
                    </AlertDescription>
                  </Alert>
                )}


                {Number(
                    form.quantity,
                  ) > 0 &&
                  Number(
                    form.lowStockThreshold,
                  ) >=
                    Number(
                      form.quantity,
                    ) && (
                    <Alert className="rounded-2xl border-destructive/40 bg-destructive/10">
                      <AlertTriangle className="size-4 text-destructive" />

                      <AlertTitle>
                        Invalid Low Stock Alert
                      </AlertTitle>

                      <AlertDescription>
                        Low Stock Alert must be lower than the quantity in hand.
                      </AlertDescription>
                    </Alert>
                  )}


                <Alert className="rounded-2xl border-primary/20 bg-primary/5">
                  <Pill className="size-4 text-primary" />

                  <AlertTitle>
                    Medication tracking
                  </AlertTitle>

                  <AlertDescription>
                    Remaining quantity is used for refill and low-stock tracking.
                  </AlertDescription>
                </Alert>

              </div>
            )}


            {step === 4 && (
              <div className="space-y-5">
                <div className="space-y-2">
                  <Label>
                    Additional instructions
                  </Label>

                  <Textarea
                    value={
                      form.notes
                    }
                    onChange={(
                      event,
                    ) =>
                      updateField(
                        "notes",
                        event.target
                          .value,
                      )
                    }
                    placeholder="Add any additional instructions from your prescription..."
                    className="min-h-28 rounded-xl"
                  />
                </div>
              </div>
            )}


            {step === 5 && (
              <div className="space-y-5">

                <dl className="grid gap-4 rounded-2xl border border-border/70 p-5 sm:grid-cols-2">

                  <PreviewItem
                    label="Medicine"
                    value={
                      form.name ||
                      "—"
                    }
                  />

                  <PreviewItem
                    label="Dosage"
                    value={
                      form.dosage
                        ? `${form.dosage} ${form.strengthUnit}`
                        : "—"
                    }
                  />

                  <PreviewItem
                    label="Frequency"
                    value={
                      form.frequency
                    }
                  />

                  <div>
                    <dt className="text-xs text-muted-foreground">
                      Reminder times
                    </dt>

                    <dd className="mt-1 flex flex-wrap gap-2">
                      {reminderTimes.map(
                        (
                          time,
                          index,
                        ) => (
                          <span
                            key={index}
                            className="inline-flex items-center gap-1 rounded-full border border-border/70 px-2.5 py-1 text-xs font-semibold"
                          >
                            <Clock3 className="size-3" />
                            {formatReminderTime(
                              time,
                            )}
                          </span>
                        ),
                      )}
                    </dd>
                  </div>

                  <PreviewItem
                    label="Start date"
                    value={
                      form.startDate ||
                      "—"
                    }
                  />

                  <PreviewItem
                    label="End date"
                    value={
                      form.endDate ||
                      "—"
                    }
                  />

                  <PreviewItem
                    label="Quantity"
                    value={`${form.quantity} tablets`}
                  />

                  <PreviewItem
                    label="Low Stock Alert"
                    value={`At ${form.lowStockThreshold} tablets`}
                  />

                  <PreviewItem
                    label="Instruction"
                    value={
                      form.instruction
                    }
                  />

                </dl>


                {!medicineValidation?.available &&
                  form.name.trim() && (
                    <Alert className="rounded-2xl border-warning/40 bg-warning/10">
                      <AlertTriangle className="size-4 text-warning" />

                      <AlertTitle>
                        AI verification unavailable
                      </AlertTitle>

                      <AlertDescription>
                        The medicine can still be saved. Please manually review all details before saving.
                      </AlertDescription>
                    </Alert>
                  )}

              </div>
            )}

          </div>


          <div className="mt-7 flex flex-wrap items-center justify-between gap-3">

            <Button
              type="button"
              variant="outline"
              className="rounded-full font-semibold"
              disabled={
                step === 0 ||
                saving
              }
              onClick={() =>
                setStep(
                  (current) =>
                    Math.max(
                      0,
                      current - 1,
                    ),
                )
              }
            >
              <ArrowLeft className="size-4" />
              Back
            </Button>


            {step <
            steps.length - 1 ? (
              <Button
                type="button"
                className="bg-brand-gradient rounded-full font-semibold shadow-glow"
                disabled={
                  saving ||
                  (step !== 0 &&
                    !isCurrentStepValid())
                }
                onClick={
                  handleNext
                }
              >
                Continue
                <ArrowRight className="size-4" />
              </Button>
            ) : (
              <Button
                type="button"
                className="bg-brand-gradient rounded-full font-semibold shadow-glow"
                disabled={
                  saving ||
                  !isCurrentStepValid()
                }
                onClick={
                  handleSave
                }
              >
                <Save className="size-4" />

                {saving
                  ? "Saving..."
                  : "Save medicine"}
              </Button>
            )}

          </div>

        </Card>


        <Card className="h-fit gap-0 rounded-2xl border-border/70 p-6 shadow-soft">

          <SectionHeading
            title="Live preview"
            description="This is how the medicine will appear in your medicine list."
          />

          <div className="mt-5 rounded-2xl border border-border/70 bg-muted/40 p-5">

            <div className="flex items-center gap-3">
              <span className="grid size-12 shrink-0 place-items-center rounded-2xl bg-primary-soft text-primary">
                <Pill className="size-6" />
              </span>

              <div className="min-w-0">
                <p className="truncate text-base font-bold">
                  {form.name ||
                    "Medicine name"}
                </p>

                <p className="text-xs text-muted-foreground">
                  {form.dosage
                    ? `${form.dosage} ${form.strengthUnit}`
                    : "Dosage"}
                </p>
              </div>
            </div>


            <div className="mt-5 space-y-4">

              <PreviewItem
                label="Frequency"
                value={
                  form.frequency
                }
              />


              <div>
                <p className="text-xs text-muted-foreground">
                  Reminder times
                </p>

                <div className="mt-2 flex flex-wrap gap-2">
                  {reminderTimes.map(
                    (
                      time,
                      index,
                    ) => (
                      <span
                        key={index}
                        className="inline-flex items-center gap-1.5 rounded-full border border-border/70 bg-background px-3 py-1.5 text-sm font-semibold"
                      >
                        <Clock3 className="size-3.5" />
                        {formatReminderTime(
                          time,
                        )}
                      </span>
                    ),
                  )}
                </div>
              </div>


              <PreviewItem
                label="Instruction"
                value={
                  form.instruction
                }
              />

              <PreviewItem
                label="Quantity"
                value={`${form.quantity} tablets`}
              />

              <PreviewItem
                label="Low Stock Alert"
                value={`At ${form.lowStockThreshold} tablets`}
              />

              <PreviewItem
                label="Duration"
                value={
                  form.startDate &&
                  form.endDate
                    ? `${form.startDate} → ${form.endDate}`
                    : "Not set"
                }
              />

            </div>
          </div>


          {duplicateMedicine && (
            <Alert className="mt-4 rounded-2xl border-warning/40 bg-warning/10">
              <AlertTriangle className="size-4 text-warning" />

              <AlertTitle>
                Already registered
              </AlertTitle>

              <AlertDescription>
                This medicine is already present in your account.
              </AlertDescription>
            </Alert>
          )}

        </Card>
      </div>


      <Card className="rounded-2xl border-border/70 p-5 shadow-soft">

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">

          <div>
            <p className="font-semibold">
              Import from prescription
            </p>

            <p className="text-xs text-muted-foreground">
              OCR can prefill the medicine form. Always review extracted information before saving.
            </p>
          </div>


          <label className="inline-flex">
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp,image/bmp,image/tiff,.jpg,.jpeg,.png,.webp,.bmp,.tif,.tiff"
              className="hidden"
              onChange={
                handlePrescriptionScan
              }
            />

            <Button
              type="button"
              asChild
              variant="outline"
              disabled={
                scanning
              }
              className="cursor-pointer rounded-xl"
            >
              <span>
                {scanning
                  ? "Scanning..."
                  : "Scan prescription"}
              </span>
            </Button>
          </label>

        </div>

      </Card>

    </div>
  );
}


function PreviewItem({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div>
      <dt className="text-xs text-muted-foreground">
        {label}
      </dt>

      <dd className="font-semibold text-foreground">
        {value}
      </dd>
    </div>
  );
}