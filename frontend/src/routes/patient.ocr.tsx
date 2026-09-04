import {
  ChangeEvent,
  useEffect,
  useRef,
  useState,
} from "react";

import { createFileRoute } from "@tanstack/react-router";

import {
  CheckCircle2,
  FileScan,
  Loader2,
  Save,
  Upload,
  X,
} from "lucide-react";

import { toast } from "sonner";

import api from "@/services/api";

import { SectionHeading } from "@/components/portal/stat-card";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";


export const Route = createFileRoute(
  "/patient/ocr",
)({
  head: () => ({
    meta: [
      {
        title: "Prescription OCR — MediCare AI",
      },
      {
        name: "description",
        content:
          "Scan a prescription, review detected medicines and save them together.",
      },
    ],
  }),
  component: PrescriptionOcrPage,
});


type ApiMedicine = {
  medicine_name?: string;
  dosage?: string;
  frequency?: string;
  duration?: string;
  instructions?: string | null;
  reminder_time?: string;
  reminder_times?: string[] | string;
  quantity?: number | null;
  total_quantity?: number | null;
  remaining_quantity?: number | null;
  start_date?: string;
  end_date?: string;
  low_stock_threshold?: number;
};


type OcrResponse = {
  medicines?: ApiMedicine[];
  doctor_name?: string;
  hospital?: string;
  patient_name?: string;
  date?: string;
};


type EditableMedicine = {
  medicine_name: string;
  dosage: string;
  frequency: string;
  duration: string;
  instructions: string;
  reminder_times: string[];
  quantity: string;
  start_date: string;
  end_date: string;
  low_stock_threshold: string;
};


const EMPTY_RESULT: OcrResponse = {
  medicines: [],
  doctor_name: "",
  hospital: "",
  patient_name: "",
  date: "",
};


function todayString(): string {
  return new Date()
    .toISOString()
    .slice(0, 10);
}


function addDays(
  start: string,
  days: number,
): string {
  const date = new Date(
    `${start}T00:00:00`,
  );

  date.setDate(
    date.getDate() + days,
  );

  return date
    .toISOString()
    .slice(0, 10);
}


function getDurationDays(
  duration: string,
): number {
  const value =
    duration.trim().toLowerCase();

  const numberMatch =
    value.match(/\d+/);

  const number =
    numberMatch
      ? Number(numberMatch[0])
      : 1;

  if (value.includes("week")) {
    return Math.max(
      1,
      number * 7,
    );
  }

  if (value.includes("month")) {
    return Math.max(
      1,
      number * 30,
    );
  }

  return Math.max(
    1,
    number,
  );
}


function frequencyDefaults(
  frequency: string,
): string[] {
  const lower =
    frequency
      .trim()
      .toLowerCase();

  if (
    lower.includes("three") ||
    lower.includes("3")
  ) {
    return [
      "09:00",
      "14:00",
      "21:00",
    ];
  }

  if (
    lower.includes("twice") ||
    lower.includes("2")
  ) {
    return [
      "09:00",
      "21:00",
    ];
  }

  return ["09:00"];
}


function normalizeReminderTimes(
  value:
    | string[]
    | string
    | undefined,
  frequency: string,
): string[] {
  let times: string[] = [];

  if (Array.isArray(value)) {
    times = value
      .map((item) =>
        String(item).trim(),
      )
      .filter(Boolean);
  } else if (
    typeof value === "string"
  ) {
    times = value
      .split(",")
      .map((item) =>
        item.trim(),
      )
      .filter(Boolean);
  }

  if (times.length > 0) {
    return times.slice(0, 3);
  }

  return frequencyDefaults(
    frequency,
  );
}


function toEditableMedicine(
  medicine: ApiMedicine,
): EditableMedicine {
  const start =
    medicine.start_date ||
    todayString();

  const frequency =
    medicine.frequency?.trim() ||
    "Once daily";

  const duration =
    medicine.duration?.trim() ||
    "";

  const reminderTimes =
    normalizeReminderTimes(
      medicine.reminder_times ??
        medicine.reminder_time,
      frequency,
    );

  const quantityValue =
    medicine.total_quantity ??
    medicine.quantity ??
    30;

  const quantity =
    Number(quantityValue) > 0
      ? String(quantityValue)
      : "30";

  const lowStockValue =
    medicine.low_stock_threshold ??
    5;

  return {
    medicine_name:
      medicine.medicine_name?.trim() ||
      "",

    dosage:
      medicine.dosage?.trim() ||
      "",

    frequency,

    duration,

    instructions:
      medicine.instructions?.trim() ||
      "",

    reminder_times:
      reminderTimes,

    quantity,

    start_date:
      start,

    end_date:
      medicine.end_date ||
      addDays(
        start,
        getDurationDays(
          duration,
        ),
      ),

    low_stock_threshold:
      String(
        Math.max(
          1,
          Math.min(
            Number(lowStockValue) || 5,
            Math.max(
              1,
              Number(quantity) - 1,
            ),
          ),
        ),
      ),
  };
}


function getErrorMessage(
  error: unknown,
): string {
  const axiosError =
    error as {
      response?: {
        status?: number;
        data?: {
          detail?: unknown;
          message?: unknown;
        };
      };
      message?: string;
    };

  const responseData =
    axiosError.response?.data;

  const detail =
    responseData?.detail;

  if (
    typeof detail ===
    "string"
  ) {
    return detail;
  }

  if (
    Array.isArray(detail)
  ) {
    const messages =
      detail
        .map(
          (item) => {
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
                  "",
              );
            }

            return "";
          },
        )
        .filter(Boolean);

    if (messages.length) {
      return messages.join(
        " ",
      );
    }
  }

  if (
    typeof responseData?.message ===
    "string"
  ) {
    return responseData.message;
  }

  return (
    axiosError.message ||
    "Something went wrong."
  );
}


function PrescriptionOcrPage() {
  const inputRef =
    useRef<HTMLInputElement>(
      null,
    );

  const [
    file,
    setFile,
  ] = useState<File | null>(
    null,
  );

  const [
    preview,
    setPreview,
  ] = useState<string | null>(
    null,
  );

  const [
    scanning,
    setScanning,
  ] = useState(false);

  const [
    saving,
    setSaving,
  ] = useState(false);

  const [
    result,
    setResult,
  ] = useState<OcrResponse>(
    EMPTY_RESULT,
  );

  const [
    medicines,
    setMedicines,
  ] = useState<
    EditableMedicine[]
  >([]);


  useEffect(() => {
    return () => {
      if (preview) {
        URL.revokeObjectURL(
          preview,
        );
      }
    };
  }, [preview]);


  const chooseFile =
    async (
      selectedFile: File,
    ) => {
      if (
        !selectedFile.type.startsWith(
          "image/",
        )
      ) {
        toast.error(
          "Please select a prescription image.",
        );
        return;
      }

      if (preview) {
        URL.revokeObjectURL(
          preview,
        );
      }

      setFile(
        selectedFile,
      );

      setPreview(
        URL.createObjectURL(
          selectedFile,
        ),
      );

      setResult(
        EMPTY_RESULT,
      );

      setMedicines([]);

      try {
        setScanning(true);

        const formData =
          new FormData();

        formData.append(
          "file",
          selectedFile,
        );

        const response =
          await api.post<OcrResponse>(
            "/ocr/prescription",
            formData,
            {
              timeout: 120000,
            },
          );

        const safeResult =
          response.data ?? {
            ...EMPTY_RESULT,
          };

        const extracted =
          Array.isArray(
            safeResult.medicines,
          )
            ? safeResult.medicines
                .map(
                  toEditableMedicine,
                )
            : [];

        setResult(
          safeResult,
        );

        setMedicines(
          extracted,
        );

        if (
          extracted.length === 0
        ) {
          toast.warning(
            "The prescription was read, but no medicines were detected.",
          );
          return;
        }

        toast.success(
          `${extracted.length} medicine${
            extracted.length === 1
              ? ""
              : "s"
          } detected.`,
        );
      } catch (error) {
        console.error(
          "Prescription OCR error:",
          error,
        );

        toast.error(
          getErrorMessage(
            error,
          ),
        );
      } finally {
        setScanning(false);
      }
    };


  const handleFileChange =
    (
      event:
        ChangeEvent<HTMLInputElement>,
    ) => {
      const selected =
        event.target.files?.[0];

      if (selected) {
        void chooseFile(
          selected,
        );
      }

      event.target.value = "";
    };


  const updateMedicine = (
    index: number,
    field:
      keyof EditableMedicine,
    value: string,
  ) => {
    setMedicines(
      (current) =>
        current.map(
          (
            medicine,
            medicineIndex,
          ) =>
            medicineIndex === index
              ? {
                  ...medicine,
                  [field]: value,
                }
              : medicine,
        ),
    );
  };


  const updateReminderTime =
    (
      medicineIndex: number,
      timeIndex: number,
      value: string,
    ) => {
      setMedicines(
        (current) =>
          current.map(
            (
              medicine,
              index,
            ) => {
              if (
                index !==
                medicineIndex
              ) {
                return medicine;
              }

              const times = [
                ...medicine.reminder_times,
              ];

              times[
                timeIndex
              ] = value;

              return {
                ...medicine,
                reminder_times:
                  times,
              };
            },
          ),
      );
    };


  const addReminderTime = (
    medicineIndex: number,
  ) => {
    setMedicines(
      (current) =>
        current.map(
          (
            medicine,
            index,
          ) => {
            if (
              index !==
              medicineIndex
            ) {
              return medicine;
            }

            if (
              medicine.reminder_times
                .length >= 3
            ) {
              return medicine;
            }

            return {
              ...medicine,
              reminder_times: [
                ...medicine.reminder_times,
                "09:00",
              ],
            };
          },
        ),
    );
  };


  const removeReminderTime = (
    medicineIndex: number,
    timeIndex: number,
  ) => {
    setMedicines(
      (current) =>
        current.map(
          (
            medicine,
            index,
          ) => {
            if (
              index !==
              medicineIndex
            ) {
              return medicine;
            }

            if (
              medicine.reminder_times
                .length <= 1
            ) {
              return medicine;
            }

            return {
              ...medicine,
              reminder_times:
                medicine.reminder_times.filter(
                  (
                    _,
                    currentIndex,
                  ) =>
                    currentIndex !==
                    timeIndex,
                ),
            };
          },
        ),
    );
  };


  const saveAll =
    async () => {
      if (
        medicines.length === 0
      ) {
        toast.error(
          "No extracted medicines to save.",
        );
        return;
      }

      const preparedMedicines =
        medicines.map(
          (medicine) => {
            const name =
              medicine.medicine_name.trim();

            const dosage =
              medicine.dosage.trim();

            const frequency =
              medicine.frequency.trim() ||
              "Once daily";

            const times =
              medicine.reminder_times
                .map((time) =>
                  time.trim(),
                )
                .filter(Boolean);

            const quantity =
              Number(
                medicine.quantity,
              );

            const lowStock =
              Number(
                medicine.low_stock_threshold,
              );

            return {
              medicine,
              name,
              dosage,
              frequency,
              times,
              quantity,
              lowStock,
            };
          },
        );


      for (
        const item of
        preparedMedicines
      ) {
        if (
          item.name.length < 2
        ) {
          toast.error(
            "Every medicine must have a valid name.",
          );
          return;
        }

        if (
          !item.dosage
        ) {
          toast.error(
            `Enter dosage for ${item.name}.`,
          );
          return;
        }

        if (
          !item.times.length
        ) {
          toast.error(
            `Add at least one reminder time for ${item.name}.`,
          );
          return;
        }

        const invalidTime =
          item.times.some(
            (time) =>
              !/^(?:[01]\d|2[0-3]):[0-5]\d$/.test(
                time,
              ),
          );

        if (invalidTime) {
          toast.error(
            `Invalid reminder time for ${item.name}.`,
          );
          return;
        }

        if (
          item.times.length >
          3
        ) {
          toast.error(
            `A maximum of 3 reminder times is allowed for ${item.name}.`,
          );
          return;
        }

        if (
          item.times.length !==
          new Set(
            item.times,
          ).size
        ) {
          toast.error(
            `Reminder times for ${item.name} must be unique.`,
          );
          return;
        }

        if (
          !Number.isFinite(
            item.quantity,
          ) ||
          item.quantity < 1
        ) {
          toast.error(
            `Enter a valid quantity for ${item.name}.`,
          );
          return;
        }

        if (
          !Number.isFinite(
            item.lowStock,
          ) ||
          item.lowStock < 1 ||
          item.lowStock >=
            item.quantity
        ) {
          toast.error(
            `Low Stock Alert for ${item.name} must be lower than the quantity.`,
          );
          return;
        }

        if (
          !item.medicine.start_date ||
          !item.medicine.end_date
        ) {
          toast.error(
            `Start and end dates are required for ${item.name}.`,
          );
          return;
        }
      }


      try {
        setSaving(true);

        const payload =
          preparedMedicines.map(
            (item) => ({
              medicine_name:
                item.name,

              dosage:
                item.dosage,

              frequency:
                item.frequency,

              reminder_time:
                item.times.join(","),

              reminder_times:
                item.times,

              duration:
                item.medicine
                  .duration
                  .trim(),

              quantity:
                item.quantity,

              total_quantity:
                item.quantity,

              remaining_quantity:
                item.quantity,

              tablets_per_day:
                item.times.length,

              low_stock_threshold:
                item.lowStock,

              start_date:
                item.medicine
                  .start_date,

              end_date:
                item.medicine
                  .end_date,

              instructions:
                item.medicine
                  .instructions
                  .trim() ||
                null,
            }),
          );

        /*
         * IMPORTANT:
         * Use the production backend endpoint directly.
         *
         * POST /ocr/save-prescription
         */
        const response =
          await api.post(
            "/ocr/save-prescription",
            {
              medicines:
                payload,
            },
            {
              timeout: 120000,
            },
          );

        const data =
          response.data;

        toast.success(
          `${data.saved_count ?? payload.length} medicine${
            (data.saved_count ?? payload.length) ===
            1
              ? ""
              : "s"
          } saved successfully.`,
        );

        if (
          Number(
            data.skipped_count ?? 0,
          ) > 0
        ) {
          toast.info(
            `${data.skipped_count} duplicate medicine${
              data.skipped_count === 1
                ? ""
                : "s"
            } skipped.`,
          );
        }

        setMedicines([]);

        setResult(
          EMPTY_RESULT,
        );

      } catch (error) {
        console.error(
          "Save OCR medicines error:",
          error,
        );

        toast.error(
          getErrorMessage(
            error,
          ),
        );
      } finally {
        setSaving(false);
      }
    };


  const clearScan = () => {
    if (preview) {
      URL.revokeObjectURL(
        preview,
      );
    }

    setPreview(null);
    setFile(null);
    setResult(
      EMPTY_RESULT,
    );
    setMedicines([]);

    if (inputRef.current) {
      inputRef.current.value =
        "";
    }
  };


  return (
    <div className="space-y-6">

      <SectionHeading
        title="Prescription OCR"
        description="Scan a prescription, review every detected medicine, edit missing details, and save all medicines together."
      />

      <Card className="rounded-2xl border-border/70 p-6 shadow-soft">

        <input
          ref={inputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/bmp,image/tiff,.jpg,.jpeg,.png,.webp,.bmp,.tif,.tiff"
          hidden
          onChange={
            handleFileChange
          }
        />

        <div className="rounded-2xl border-2 border-dashed border-border p-8 text-center">

          <div className="mx-auto grid size-14 place-items-center rounded-2xl bg-primary-soft text-primary">

            {scanning ? (
              <Loader2 className="size-7 animate-spin" />
            ) : (
              <FileScan className="size-7" />
            )}

          </div>

          <h3 className="mt-4 text-lg font-bold">
            Scan prescription
          </h3>

          <p className="mt-2 text-sm text-muted-foreground">
            Upload a clear prescription image. All detected medicines will appear below.
          </p>

          <Button
            type="button"
            className="mt-5 rounded-full"
            disabled={
              scanning
            }
            onClick={() =>
              inputRef.current?.click()
            }
          >
            <Upload className="size-4" />

            {scanning
              ? "Scanning..."
              : "Upload prescription"}
          </Button>

        </div>
      </Card>


      {preview && (
        <Card className="rounded-2xl border-border/70 p-5 shadow-soft">

          <div className="flex items-center justify-between">

            <div>
              <p className="font-semibold">
                Prescription preview
              </p>

              <p className="text-xs text-muted-foreground">
                {file?.name}
              </p>
            </div>

            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={
                clearScan
              }
            >
              Clear
            </Button>

          </div>

          <div className="mt-4 overflow-hidden rounded-2xl border border-border/70 bg-black/20">

            <img
              src={preview}
              alt="Prescription preview"
              className="max-h-[520px] w-full object-contain"
            />

          </div>

        </Card>
      )}


      {medicines.length > 0 && (
        <Card className="rounded-2xl border-border/70 p-6 shadow-soft">

          <div className="flex items-center justify-between gap-4">

            <div>
              <p className="text-lg font-bold">
                Detected medicines
              </p>

              <p className="mt-1 text-sm text-muted-foreground">
                Review every medicine before saving.
              </p>
            </div>

            <CheckCircle2 className="size-5 text-accent" />

          </div>


          <div className="mt-6 space-y-5">

            {medicines.map(
              (
                medicine,
                index,
              ) => (
                <Card
                  key={`${medicine.medicine_name}-${index}`}
                  className="rounded-2xl border-border/70 bg-muted/20 p-5"
                >

                  <div className="mb-4 flex items-center justify-between">

                    <p className="font-bold">
                      Medicine{" "}
                      {index + 1}
                    </p>

                    <span className="rounded-full bg-primary-soft px-3 py-1 text-xs font-semibold text-primary">
                      OCR detected
                    </span>

                  </div>


                  <div className="grid gap-4 sm:grid-cols-2">

                    <div className="space-y-2">
                      <Label>
                        Medicine name
                      </Label>

                      <Input
                        value={
                          medicine.medicine_name
                        }
                        onChange={(
                          event,
                        ) =>
                          updateMedicine(
                            index,
                            "medicine_name",
                            event.target
                              .value,
                          )
                        }
                      />
                    </div>


                    <div className="space-y-2">
                      <Label>
                        Dosage
                      </Label>

                      <Input
                        value={
                          medicine.dosage
                        }
                        onChange={(
                          event,
                        ) =>
                          updateMedicine(
                            index,
                            "dosage",
                            event.target
                              .value,
                          )
                        }
                      />
                    </div>


                    <div className="space-y-2">
                      <Label>
                        Frequency
                      </Label>

                      <Input
                        value={
                          medicine.frequency
                        }
                        onChange={(
                          event,
                        ) =>
                          updateMedicine(
                            index,
                            "frequency",
                            event.target
                              .value,
                          )
                        }
                      />
                    </div>


                    <div className="space-y-2">
                      <Label>
                        Duration
                      </Label>

                      <Input
                        value={
                          medicine.duration
                        }
                        onChange={(
                          event,
                        ) =>
                          updateMedicine(
                            index,
                            "duration",
                            event.target
                              .value,
                          )
                        }
                      />
                    </div>

                  </div>


                  <div className="mt-5 space-y-3">

                    <div className="flex items-center justify-between">

                      <Label>
                        Reminder times
                      </Label>

                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        disabled={
                          medicine
                            .reminder_times
                            .length >=
                          3
                        }
                        onClick={() =>
                          addReminderTime(
                            index,
                          )
                        }
                      >
                        Add time
                      </Button>

                    </div>


                    <div className="grid gap-3 sm:grid-cols-3">

                      {medicine.reminder_times.map(
                        (
                          time,
                          timeIndex,
                        ) => (
                          <div
                            key={timeIndex}
                            className="flex gap-2"
                          >

                            <Input
                              type="time"
                              value={time}
                              onChange={(
                                event,
                              ) =>
                                updateReminderTime(
                                  index,
                                  timeIndex,
                                  event.target
                                    .value,
                                )
                              }
                            />

                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              disabled={
                                medicine
                                  .reminder_times
                                  .length <=
                                1
                              }
                              onClick={() =>
                                removeReminderTime(
                                  index,
                                  timeIndex,
                                )
                              }
                            >
                              <X className="size-4" />
                            </Button>

                          </div>
                        ),
                      )}

                    </div>

                    <p className="text-xs text-muted-foreground">
                      If the prescription gives a schedule instead of exact clock times, review and adjust the suggested times.
                    </p>

                  </div>


                  <div className="mt-5 grid gap-4 sm:grid-cols-3">

                    <div className="space-y-2">
                      <Label>
                        Start date
                      </Label>

                      <Input
                        type="date"
                        value={
                          medicine.start_date
                        }
                        onChange={(
                          event,
                        ) =>
                          updateMedicine(
                            index,
                            "start_date",
                            event.target
                              .value,
                          )
                        }
                      />
                    </div>


                    <div className="space-y-2">
                      <Label>
                        End date
                      </Label>

                      <Input
                        type="date"
                        value={
                          medicine.end_date
                        }
                        onChange={(
                          event,
                        ) =>
                          updateMedicine(
                            index,
                            "end_date",
                            event.target
                              .value,
                          )
                        }
                      />
                    </div>


                    <div className="space-y-2">
                      <Label>
                        Quantity
                      </Label>

                      <Input
                        type="number"
                        min="1"
                        value={
                          medicine.quantity
                        }
                        onChange={(
                          event,
                        ) =>
                          updateMedicine(
                            index,
                            "quantity",
                            event.target
                              .value,
                          )
                        }
                      />
                    </div>

                  </div>


                  <div className="mt-4 grid gap-4 sm:grid-cols-2">

                    <div className="space-y-2">
                      <Label>
                        Low Stock Alert
                      </Label>

                      <Input
                        type="number"
                        min="1"
                        value={
                          medicine.low_stock_threshold
                        }
                        onChange={(
                          event,
                        ) =>
                          updateMedicine(
                            index,
                            "low_stock_threshold",
                            event.target
                              .value,
                          )
                        }
                      />
                    </div>


                    <div className="space-y-2">
                      <Label>
                        Instructions
                      </Label>

                      <Textarea
                        value={
                          medicine.instructions
                        }
                        onChange={(
                          event,
                        ) =>
                          updateMedicine(
                            index,
                            "instructions",
                            event.target
                              .value,
                          )
                        }
                        placeholder="Instructions from prescription"
                      />
                    </div>

                  </div>

                </Card>
              ),
            )}

          </div>


          <div className="mt-6 flex justify-end">

            <Button
              type="button"
              className="rounded-full bg-brand-gradient font-semibold shadow-glow"
              disabled={
                saving ||
                scanning ||
                medicines.length === 0
              }
              onClick={
                saveAll
              }
            >
              <Save className="size-4" />

              {saving
                ? "Saving medicines..."
                : `Save all ${medicines.length} medicine${
                    medicines.length ===
                    1
                      ? ""
                      : "s"
                  }`}
            </Button>

          </div>

        </Card>
      )}


      {file &&
        !scanning &&
        medicines.length ===
          0 && (
          <Card className="rounded-2xl border-warning/30 bg-warning/5 p-5">

            <p className="font-semibold">
              No medicines detected
            </p>

            <p className="mt-1 text-sm text-muted-foreground">
              Please use a clearer prescription image with medicine names and dosage visible.
            </p>

          </Card>
        )}

    </div>
  );
}