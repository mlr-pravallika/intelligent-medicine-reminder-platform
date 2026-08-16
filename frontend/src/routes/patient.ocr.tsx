import axios from "axios";

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

import {
  scanPrescription,
  saveOcrMedicines,
  type OcrMedicine,
  type OcrResult,
  type SaveOcrMedicine,
} from "@/services/ocrService";

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


const EMPTY_RESULT: OcrResult = {
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


function frequencyDefaults(
  frequency: string,
): string[] {
  const lower = (
    frequency || ""
  ).toLowerCase();

  if (
    lower.includes("three") ||
    lower.includes("3")
  ) {
    return [
      "09:00",
      "14:00",
      "20:00",
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


function getDurationDays(
  duration: string,
): number {
  const match =
    (duration || "").match(
      /(\d+)\s*days?/i,
    );

  return match
    ? Number(match[1])
    : 30;
}


function toEditableMedicine(
  medicine: OcrMedicine,
): EditableMedicine {
  const start = todayString();

  const frequency =
    medicine.frequency ||
    "Once daily";

  const reminderTimes =
    medicine.reminder_times &&
    medicine.reminder_times.length > 0
      ? medicine.reminder_times
      : frequencyDefaults(
          frequency,
        );

  const quantity =
    medicine.quantity &&
    medicine.quantity > 0
      ? String(
          medicine.quantity,
        )
      : "30";

  return {
    medicine_name:
      medicine.medicine_name || "",

    dosage:
      medicine.dosage || "",

    frequency,

    duration:
      medicine.duration || "",

    instructions:
      medicine.instructions || "",

    reminder_times:
      [...reminderTimes],

    quantity,

    start_date: start,

    end_date: addDays(
      start,
      getDurationDays(
        medicine.duration || "",
      ),
    ),

    low_stock_threshold:
      "5",
  };
}


function formatTime(
  value: string,
): string {
  const match =
    value.match(
      /^(\d{2}):(\d{2})$/,
    );

  if (!match) {
    return value;
  }

  const hour =
    Number(match[1]);

  const suffix =
    hour >= 12
      ? "PM"
      : "AM";

  const hour12 =
    hour % 12 || 12;

  return `${String(
    hour12,
  ).padStart(
    2,
    "0",
  )}:${match[2]} ${suffix}`;
}


function getErrorMessage(
  error: unknown,
): string {
  const axiosError =
    error as {
      response?: {
        data?: {
          detail?: unknown;
        };
      };
      message?: string;
    };

  const detail =
    axiosError.response?.data
      ?.detail;

  if (
    typeof detail === "string"
  ) {
    return detail;
  }

  if (Array.isArray(detail)) {
    const messages = detail
      .map((item: unknown) => {
        if (
          item &&
          typeof item === "object" &&
          "msg" in item
        ) {
          return String(
            (
              item as {
                msg?: unknown;
              }
            ).msg || "",
          );
        }

        return "";
      })
      .filter(Boolean);

    if (messages.length > 0) {
      return messages.join(" ");
    }
  }

  if (
    detail &&
    typeof detail === "object" &&
    "msg" in detail
  ) {
    return String(
      (
        detail as {
          msg?: unknown;
        }
      ).msg ||
        "Something went wrong.",
    );
  }

  return (
    axiosError.message ||
    "Something went wrong."
  );
}


function PrescriptionOcrPage() {
  const inputRef =
    useRef<HTMLInputElement>(null);

  const [file, setFile] =
    useState<File | null>(null);

  const [preview, setPreview] =
    useState<string | null>(null);

  const [scanning, setScanning] =
    useState(false);

  const [saving, setSaving] =
    useState(false);

  const [
    result,
    setResult,
  ] = useState<OcrResult>(
    EMPTY_RESULT,
  );

  const [
    medicines,
    setMedicines,
  ] = useState<EditableMedicine[]>(
    [],
  );


  useEffect(() => {
    return () => {
      if (preview) {
        URL.revokeObjectURL(
          preview,
        );
      }
    };
  }, [preview]);


  const chooseFile = async (
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

    setFile(selectedFile);

    setPreview(
      URL.createObjectURL(
        selectedFile,
      ),
    );

    try {
      setScanning(true);

      const data =
        await scanPrescription(
          selectedFile,
        );

      const safeResult: OcrResult = {
        medicines:
          Array.isArray(
            data?.medicines,
          )
            ? data.medicines
            : [],
        doctor_name:
          data?.doctor_name || "",
        hospital:
          data?.hospital || "",
        patient_name:
          data?.patient_name || "",
        date:
          data?.date || "",
      };

      setResult(safeResult);

      const extracted =
        safeResult.medicines.map(
          toEditableMedicine,
        );

      setMedicines(extracted);

      if (extracted.length === 0) {
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


  const handleFileChange = (
    event: ChangeEvent<HTMLInputElement>,
  ) => {
    const selected =
      event.target.files?.[0];

    if (selected) {
      void chooseFile(selected);
    }

    event.target.value = "";
  };


  const updateMedicine = (
    index: number,
    field: keyof EditableMedicine,
    value: string,
  ) => {
    setMedicines(
      current =>
        current.map(
          (
            medicine,
            medicineIndex,
          ) =>
            medicineIndex === index
              ? {
                  ...medicine,
                  [field]:
                    value,
                }
              : medicine,
        ),
    );
  };


  const updateReminderTime = (
    medicineIndex: number,
    timeIndex: number,
    value: string,
  ) => {
    setMedicines(
      current =>
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
      current =>
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
      current =>
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


  const saveAll = async () => {
    if (medicines.length === 0) {
      toast.error(
        "No extracted medicines to save.",
      );
      return;
    }

    for (
      const medicine of medicines
    ) {
      const name =
        medicine.medicine_name.trim();

      const dosage =
        medicine.dosage.trim();

      const frequency =
        medicine.frequency.trim();

      const quantity =
        Number(
          medicine.quantity,
        );

      const lowStock =
        Number(
          medicine.low_stock_threshold,
        );

      const times =
        medicine.reminder_times;

      if (
        !name ||
        !dosage ||
        !frequency
      ) {
        toast.error(
          "Please complete medicine name, dosage and frequency for every medicine.",
        );
        return;
      }

      if (times.length === 0) {
        toast.error(
          `Add at least one reminder time for ${name}.`,
        );
        return;
      }

      const invalidTime =
        times.some(
          time =>
            !/^(?:[01]\d|2[0-3]):[0-5]\d$/.test(
              time,
            ),
        );

      if (invalidTime) {
        toast.error(
          `Please enter valid HH:MM reminder times for ${name}.`,
        );
        return;
      }

      if (
        times.length >
        new Set(times).size
      ) {
        toast.error(
          `Reminder times for ${name} must be unique.`,
        );
        return;
      }

      if (
        !Number.isFinite(
          quantity,
        ) ||
        quantity < 1
      ) {
        toast.error(
          `Enter a valid quantity for ${name}.`,
        );
        return;
      }

      if (
        !Number.isFinite(
          lowStock,
        ) ||
        lowStock < 1 ||
        lowStock >= quantity
      ) {
        toast.error(
          `Low Stock Alert for ${name} must be at least 1 and lower than the quantity.`,
        );
        return;
      }

      if (
        !medicine.start_date ||
        !medicine.end_date
      ) {
        toast.error(
          `Start and end dates are required for ${name}.`,
        );
        return;
      }
    }


    try {
      setSaving(true);

      const payload: SaveOcrMedicine[] =
        medicines.map(
          medicine => ({
            medicine_name:
              medicine.medicine_name.trim(),

            dosage:
              medicine.dosage.trim(),

            frequency:
              medicine.frequency.trim(),

            duration:
              medicine.duration.trim() ||
              "",

            reminder_time:
              medicine.reminder_times.join(
                ",",
              ),

            reminder_times:
              [...medicine.reminder_times],

            quantity:
              Number(
                medicine.quantity,
              ),

            start_date:
              medicine.start_date,

            end_date:
              medicine.end_date,

            instructions:
              (medicine.instructions ?? "")
                .trim(),

            total_quantity:
              Number(
                medicine.quantity,
              ),

            remaining_quantity:
              Number(
                medicine.quantity,
              ),

            tablets_per_day:
              medicine.reminder_times.length,

            low_stock_threshold:
              Number(
                medicine.low_stock_threshold,
              ),
          }),
        );

      /*
       * IMPORTANT FIX:
       * Call the API function saveOcrMedicines().
       * Do NOT call setMedicines(payload) here.
       */
      const response =
        await saveOcrMedicines(
          payload,
        );

      toast.success(
        `${response.saved_count} medicine${
          response.saved_count === 1
            ? ""
            : "s"
        } saved successfully.`,
      );

      if (
        response.skipped_count >
        0
      ) {
        toast.info(
          `${response.skipped_count} duplicate medicine${
            response.skipped_count === 1
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
          accept="image/jpeg,image/png,image/webp,image/bmp,image/tiff"
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
            disabled={scanning}
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
                      Medicine {index + 1}
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
                        onChange={event =>
                          updateMedicine(
                            index,
                            "medicine_name",
                            event.target.value,
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
                        onChange={event =>
                          updateMedicine(
                            index,
                            "dosage",
                            event.target.value,
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
                        onChange={event =>
                          updateMedicine(
                            index,
                            "frequency",
                            event.target.value,
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
                        readOnly
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
                          medicine.reminder_times.length >= 3
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
                              value={
                                time
                              }
                              onChange={
                                event =>
                                  updateReminderTime(
                                    index,
                                    timeIndex,
                                    event.target.value,
                                  )
                              }
                            />

                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              disabled={
                                medicine.reminder_times.length <=
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
                      When the prescription gives a schedule such as 1-0-1 instead of exact clock times, the app uses editable default times.
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
                        onChange={event =>
                          updateMedicine(
                            index,
                            "start_date",
                            event.target.value,
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
                        onChange={event =>
                          updateMedicine(
                            index,
                            "end_date",
                            event.target.value,
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
                        onChange={event =>
                          updateMedicine(
                            index,
                            "quantity",
                            event.target.value,
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
                        onChange={event =>
                          updateMedicine(
                            index,
                            "low_stock_threshold",
                            event.target.value,
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
                        onChange={event =>
                          updateMedicine(
                            index,
                            "instructions",
                            event.target.value,
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
        medicines.length === 0 && (
          <Card className="rounded-2xl border-warning/30 bg-warning/5 p-5">

            <p className="font-semibold">
              No medicines detected
            </p>

            <p className="mt-1 text-sm text-muted-foreground">
              Please use a closer, sharper image with the medicine names and dosage clearly visible.
            </p>

          </Card>
        )}

    </div>
  );
}
