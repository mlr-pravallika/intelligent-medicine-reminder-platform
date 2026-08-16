import { useEffect, useMemo, useRef, useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
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
  getMedicine,
  getMedicines,
  updateMedicine,
  validateMedicineName,
} from "@/services/medicineService";

import { SectionHeading } from "@/components/portal/stat-card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
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

export const Route = createFileRoute("/patient/medicines/edit/$id")({
  head: () => ({
    meta: [
      { title: "Edit Medicine — MediCare AI" },
      {
        name: "description",
        content:
          "Update medicine details, reminder times, quantity, low-stock alert and instructions.",
      },
    ],
  }),
  component: EditMedicinePage,
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
  totalQuantity: string;
  quantity: string;
  lowStockThreshold: string;
  notes: string;
};

type MedicineItem = {
  id: number;
  medicine_name: string;
  dosage: string;
  frequency: string;
  reminder_time: string;
  start_date?: string;
  end_date?: string;
  instructions?: string | null;
  total_quantity?: number;
  remaining_quantity?: number;
  tablets_per_day?: number;
  low_stock_threshold?: number;
  is_active?: boolean;
};

type ValidationResult = {
  valid: boolean;
  available: boolean;
  medicine_name: string;
  message: string;
  suggestion?: string | null;
};

const initialState: FormState = {
  name: "",
  dosage: "",
  strengthUnit: "mg",
  instruction: "After food",
  frequency: "Once daily",
  times: ["09:00"],
  startDate: "",
  endDate: "",
  totalQuantity: "30",
  quantity: "30",
  lowStockThreshold: "5",
  notes: "",
};

function getTimeCount(frequency: string): number {
  switch (frequency) {
    case "Twice daily":
      return 2;
    case "Three times daily":
      return 3;
    default:
      return 1;
  }
}

function getDefaultTimes(count: number): string[] {
  const defaults = ["09:00", "14:00", "21:00"];
  return Array.from(
    { length: count },
    (_, index) => defaults[index] ?? "09:00",
  );
}

function synchronizeReminderTimes(
  frequency: string,
  existingTimes: string[],
): string[] {
  const count = getTimeCount(frequency);
  const defaults = getDefaultTimes(count);

  return Array.from(
    { length: count },
    (_, index) => existingTimes[index] ?? defaults[index] ?? "09:00",
  );
}

function parseDosage(dosage: string) {
  const match = dosage
    .trim()
    .match(/^(.+?)\s+(mg|mcg|g|ml|IU|puff)$/i);

  if (!match) {
    return { value: dosage, unit: "mg" };
  }

  return { value: match[1], unit: match[2] };
}

function generateTimeOptions() {
  const options: { value: string; label: string }[] = [];

  for (let hour = 0; hour < 24; hour += 1) {
    for (const minute of [0, 30]) {
      const value = `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`;
      const date = new Date(2000, 0, 1, hour, minute);
      const label = date.toLocaleTimeString("en-US", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: true,
      });
      options.push({ value, label });
    }
  }

  return options;
}

const TIME_OPTIONS = generateTimeOptions();

function formatReminderTime(value: string): string {
  return TIME_OPTIONS.find((option) => option.value === value)?.label ?? value;
}

function isValidDateRange(startDate: string, endDate: string): boolean {
  if (!startDate || !endDate) return false;
  return new Date(startDate).getTime() <= new Date(endDate).getTime();
}

function extractInstruction(instructions?: string | null): string {
  if (!instructions) return "After food";
  return instructions.split(" — ")[0] || "After food";
}

function extractNotes(instructions?: string | null): string {
  if (!instructions || !instructions.includes(" — ")) return "";
  return instructions.split(" — ").slice(1).join(" — ");
}

function EditMedicinePage() {
  const navigate = useNavigate();
  const { id } = Route.useParams();
  const medicineId = Number(id);

  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<FormState>(initialState);
  const [originalMedicineName, setOriginalMedicineName] = useState("");
  const [existingMedicines, setExistingMedicines] = useState<MedicineItem[]>([]);
  const [medicineValidation, setMedicineValidation] = useState<ValidationResult | null>(null);
  const [validatingMedicine, setValidatingMedicine] = useState(false);
  const validationRequestId = useRef(0);

  const medicineNameUnchanged =
    form.name.trim().toLowerCase() === originalMedicineName.trim().toLowerCase();

  const updateField = <K extends keyof FormState>(key: K, value: FormState[K]) => {
    setForm((current) => ({ ...current, [key]: value }));

    if (key === "name") {
      setMedicineValidation(null);
      validationRequestId.current += 1;
    }
  };

  const updateFrequency = (frequency: string) => {
    setForm((current) => ({
      ...current,
      frequency,
      times: synchronizeReminderTimes(frequency, current.times),
    }));
  };

  const updateReminderTime = (index: number, value: string) => {
    setForm((current) => {
      const times = synchronizeReminderTimes(current.frequency, current.times);
      times[index] = value;
      return { ...current, times };
    });
  };

  useEffect(() => {
    let active = true;

    const load = async () => {
      try {
        const [medicine, allMedicines] = await Promise.all([
          getMedicine(medicineId),
          getMedicines(),
        ]);

        if (!active) return;

        const dosage = parseDosage(medicine.dosage ?? "");
        const frequency = medicine.frequency || "Once daily";
        const times = (medicine.reminder_time || "")
          .split(",")
          .map((time: string) => time.trim())
          .filter(Boolean);

        const totalQuantity =
          medicine.total_quantity ?? medicine.remaining_quantity ?? 30;
        const remainingQuantity =
          medicine.remaining_quantity ?? medicine.total_quantity ?? 30;
        const lowStockThreshold = medicine.low_stock_threshold ?? 5;

        setOriginalMedicineName(medicine.medicine_name ?? "");

        setForm({
          name: medicine.medicine_name ?? "",
          dosage: dosage.value,
          strengthUnit: dosage.unit,
          instruction: extractInstruction(medicine.instructions),
          frequency,
          times: synchronizeReminderTimes(frequency, times),
          startDate: medicine.start_date ?? "",
          endDate: medicine.end_date ?? "",
          totalQuantity: String(totalQuantity),
          quantity: String(remainingQuantity),
          lowStockThreshold: String(lowStockThreshold),
          notes: extractNotes(medicine.instructions),
        });

        setExistingMedicines(
          (allMedicines as MedicineItem[]).filter((item) => item.id !== medicineId),
        );
      } catch (error) {
        console.error("Unable to load medicine:", error);
        toast.error("Unable to load medicine.");
        navigate({ to: "/patient/medicines" });
      } finally {
        if (active) setLoading(false);
      }
    };

    if (!Number.isFinite(medicineId) || medicineId <= 0) {
      setLoading(false);
      toast.error("Invalid medicine ID.");
      navigate({ to: "/patient/medicines" });
      return;
    }

    void load();

    return () => {
      active = false;
    };
  }, [medicineId, navigate]);

  useEffect(() => {
    if (loading || medicineNameUnchanged || form.name.trim().length < 2) {
      setValidatingMedicine(false);
      return;
    }

    const name = form.name.trim();
    const requestId = ++validationRequestId.current;

    const timer = window.setTimeout(async () => {
      try {
        setValidatingMedicine(true);
        const result = await validateMedicineName(name);

        if (requestId !== validationRequestId.current) return;

        setMedicineValidation({
          valid: Boolean(result?.valid),
          available: result?.available !== false,
          medicine_name: result?.medicine_name ?? name,
          message:
            result?.message ??
            (result?.valid
              ? "Medicine recognized."
              : "Medicine was not recognized."),
          suggestion: result?.suggestion ?? null,
        });
      } catch (error) {
        console.error("Medicine validation error:", error);

        if (requestId !== validationRequestId.current) return;

        setMedicineValidation({
          valid: false,
          available: false,
          medicine_name: name,
          message:
            "AI medicine verification is temporarily unavailable. Existing medicine details can still be updated.",
          suggestion: null,
        });
      } finally {
        if (requestId === validationRequestId.current) {
          setValidatingMedicine(false);
        }
      }
    }, 700);

    return () => window.clearTimeout(timer);
  }, [form.name, loading, medicineNameUnchanged]);

  const duplicate = useMemo(() => {
    const enteredName = form.name.trim().toLowerCase();
    if (!enteredName) return null;

    return (
      existingMedicines.find(
        (medicine) => medicine.medicine_name?.trim().toLowerCase() === enteredName,
      ) ?? null
    );
  }, [existingMedicines, form.name]);

  const reminderTimes = useMemo(
    () => synchronizeReminderTimes(form.frequency, form.times),
    [form.frequency, form.times],
  );

  const step3Valid = useMemo(() => {
    const quantity = Number(form.quantity);
    const threshold = Number(form.lowStockThreshold);

    return (
      Number.isFinite(quantity) &&
      quantity > 0 &&
      Number.isFinite(threshold) &&
      threshold >= 1 &&
      threshold < quantity
    );
  }, [form.quantity, form.lowStockThreshold]);

  const nameValid =
    medicineNameUnchanged ||
    (medicineValidation?.available === true && medicineValidation.valid === true);

  const isStepValid = (): boolean => {
    if (step === 0) {
      return form.name.trim().length >= 2 && nameValid && !duplicate;
    }

    if (step === 1) {
      return form.dosage.trim().length > 0;
    }

    if (step === 2) {
      return (
        reminderTimes.length === getTimeCount(form.frequency) &&
        reminderTimes.every(Boolean) &&
        isValidDateRange(form.startDate, form.endDate)
      );
    }

    if (step === 3) {
      return step3Valid;
    }

    return true;
  };

  const handleNext = () => {
    if (step === 0) {
      if (!medicineNameUnchanged && validatingMedicine) {
        toast.error("Please wait for medicine verification to finish.");
        return;
      }

      if (!medicineNameUnchanged && !nameValid) {
        toast.error(
          medicineValidation?.message ?? "Please verify the medicine name.",
        );
        return;
      }

      if (duplicate) {
        toast.error(`${duplicate.medicine_name} is already registered.`);
        return;
      }
    }

    if (step === 2 && !isStepValid()) {
      if (!isValidDateRange(form.startDate, form.endDate)) {
        toast.error("End date must be on or after the start date.");
      } else {
        toast.error(
          `Please select all ${getTimeCount(form.frequency)} reminder times.`,
        );
      }
      return;
    }

    if (step === 3 && !isStepValid()) {
      const quantity = Number(form.quantity);
      const threshold = Number(form.lowStockThreshold);

      if (!Number.isFinite(quantity) || quantity <= 0) {
        toast.error("Quantity must be greater than zero.");
        return;
      }

      if (!Number.isFinite(threshold) || threshold < 1) {
        toast.error("Low Stock Alert must be at least 1 tablet.");
        return;
      }

      if (threshold >= quantity) {
        toast.error("Low Stock Alert must be lower than the quantity in hand.");
        return;
      }

      return;
    }

    setStep((current) => Math.min(steps.length - 1, current + 1));
  };

  const handleUpdate = async () => {
    if (saving) return;

    if (!isStepValid() && step === 3) {
      setStep(3);
      toast.error("Please enter a valid quantity and low-stock threshold.");
      return;
    }

    if (!nameValid) {
      setStep(0);
      toast.error(
        medicineValidation?.message ?? "Please verify the medicine name.",
      );
      return;
    }

    if (duplicate) {
      setStep(0);
      toast.error(`${duplicate.medicine_name} is already registered.`);
      return;
    }

    if (!reminderTimes.every(Boolean)) {
      setStep(2);
      toast.error(
        `Please select all ${getTimeCount(form.frequency)} reminder times.`,
      );
      return;
    }

    if (!isValidDateRange(form.startDate, form.endDate)) {
      setStep(2);
      toast.error("Please enter a valid start and end date.");
      return;
    }

    const totalQuantity = Number(form.totalQuantity);
    const quantity = Number(form.quantity);
    const lowStockThreshold = Number(form.lowStockThreshold);

    if (!Number.isFinite(totalQuantity) || totalQuantity <= 0) {
      setStep(3);
      toast.error("Total quantity must be greater than zero.");
      return;
    }

    if (!Number.isFinite(quantity) || quantity <= 0) {
      setStep(3);
      toast.error("Quantity in hand must be greater than zero.");
      return;
    }

    if (!Number.isFinite(lowStockThreshold) || lowStockThreshold < 1) {
      setStep(3);
      toast.error("Low Stock Alert must be at least 1 tablet.");
      return;
    }

    if (lowStockThreshold >= quantity) {
      setStep(3);
      toast.error("Low Stock Alert must be lower than the quantity in hand.");
      return;
    }

    try {
      setSaving(true);

      await updateMedicine(medicineId, {
        medicine_name: form.name.trim(),
        dosage: `${form.dosage.trim()} ${form.strengthUnit}`.trim(),
        frequency: form.frequency,
        reminder_time: reminderTimes.join(","),
        start_date: form.startDate,
        end_date: form.endDate,
        instructions: [form.instruction, form.notes.trim()]
          .filter(Boolean)
          .join(" — "),
        total_quantity: totalQuantity,
        remaining_quantity: quantity,
        tablets_per_day: getTimeCount(form.frequency),
        low_stock_threshold: lowStockThreshold,
      });

      toast.success("Medicine updated successfully.");
      navigate({ to: "/patient/medicines" });
    } catch (error) {
      console.error("Failed to update medicine:", error);

      const axiosError = error as {
        response?: {
          status?: number;
          data?: { detail?: unknown; message?: string };
        };
        message?: string;
      };

      const status = axiosError.response?.status;
      const detail = axiosError.response?.data?.detail;
      const backendMessage = axiosError.response?.data?.message;

      console.error("Update medicine status:", status);
      console.error("Update medicine detail:", detail);

      let message = "Failed to update medicine.";

      if (typeof detail === "string") {
        message = detail;
      } else if (Array.isArray(detail)) {
        message = detail
          .map((item: unknown) => {
            if (item && typeof item === "object" && "msg" in item) {
              return String((item as { msg?: unknown }).msg ?? "Validation error");
            }
            return "Validation error";
          })
          .join(", ");
      } else if (typeof backendMessage === "string" && backendMessage.trim()) {
        message = backendMessage;
      } else if (typeof axiosError.message === "string" && axiosError.message.trim()) {
        message = axiosError.message;
      }

      if (status === 401) {
        message = "Your session has expired. Please log in again.";
      } else if (status === 404) {
        message = "Medicine was not found. Please return to My Medicines.";
      } else if (status === 422) {
        message = `Medicine validation failed: ${message}`;
      } else if (status === 500) {
        message = `Server error while updating medicine: ${message}`;
      }

      toast.error(message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-96 items-center justify-center">
        <div className="flex items-center gap-2 text-lg font-semibold">
          <Loader2 className="size-5 animate-spin" />
          Loading medicine...
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <SectionHeading
        title="Edit Medicine"
        description="Update your medicine, reminder schedule, quantity, low-stock alert and instructions."
      />

      <div className="grid gap-5 xl:grid-cols-[1.5fr_1fr]">
        <Card className="gap-0 rounded-2xl border-border/70 p-6 shadow-soft">
          <ol className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-6">
            {steps.map((label, index) => (
              <li key={label} className="min-w-0">
                <div
                  className={cn(
                    "flex items-center gap-2 rounded-xl px-2.5 py-2 text-xs font-semibold",
                    index === step
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
                    {index < step ? <Check className="size-3" /> : index + 1}
                  </span>
                  <span className="truncate">{label}</span>
                </div>
              </li>
            ))}
          </ol>

          <Progress
            value={((step + 1) / steps.length) * 100}
            className="mt-4 h-1.5"
          />

          <div className="mt-6 space-y-5">
            {step === 0 && (
              <div className="space-y-5">
                <div className="space-y-2">
                  <Label>Medicine name</Label>
                  <div className="relative">
                    <Input
                      value={form.name}
                      onChange={(event) => updateField("name", event.target.value)}
                      placeholder="e.g. Pantoprazole"
                      autoComplete="off"
                      className="h-11 rounded-xl pr-28"
                    />

                    {validatingMedicine && (
                      <span className="absolute right-3 top-1/2 flex -translate-y-1/2 items-center gap-1.5 text-xs text-muted-foreground">
                        <Loader2 className="size-3.5 animate-spin" />
                        Checking
                      </span>
                    )}

                    {!validatingMedicine && medicineNameUnchanged && (
                      <span className="absolute right-3 top-1/2 flex -translate-y-1/2 items-center gap-1 text-xs font-semibold text-emerald-500">
                        <Check className="size-3.5" />
                        Verified
                      </span>
                    )}

                    {!validatingMedicine &&
                      !medicineNameUnchanged &&
                      medicineValidation?.available &&
                      medicineValidation.valid && (
                        <span className="absolute right-3 top-1/2 flex -translate-y-1/2 items-center gap-1 text-xs font-semibold text-emerald-500">
                          <Check className="size-3.5" />
                          Verified
                        </span>
                      )}
                  </div>
                </div>

                {!medicineNameUnchanged && medicineValidation && (
                  <Alert
                    className={cn(
                      "rounded-2xl",
                      !medicineValidation.available
                        ? "border-warning/40 bg-warning/10"
                        : medicineValidation.valid
                          ? "border-accent/40 bg-accent/10"
                          : "border-destructive/40 bg-destructive/10",
                    )}
                  >
                    {!medicineValidation.available ? (
                      <Loader2 className="size-4 animate-spin text-warning" />
                    ) : medicineValidation.valid ? (
                      <Check className="size-4 text-accent" />
                    ) : (
                      <AlertTriangle className="size-4 text-destructive" />
                    )}
                    <AlertTitle>
                      {!medicineValidation.available
                        ? "Verification temporarily unavailable"
                        : medicineValidation.valid
                          ? "Medicine recognized"
                          : "Medicine not recognized"}
                    </AlertTitle>
                    <AlertDescription>
                      {medicineValidation.message}
                    </AlertDescription>
                  </Alert>
                )}

                {duplicate && (
                  <Alert className="rounded-2xl border-warning/40 bg-warning/10">
                    <AlertTriangle className="size-4 text-warning" />
                    <AlertTitle>Medicine already registered</AlertTitle>
                    <AlertDescription>
                      <strong>{duplicate.medicine_name}</strong> already exists in your account.
                    </AlertDescription>
                  </Alert>
                )}

                <p className="text-xs text-muted-foreground">
                  Generic Name is not required. Enter the medicine name shown on the prescription or package.
                </p>
              </div>
            )}

            {step === 1 && (
              <div className="space-y-5">
                <div className="grid gap-4 sm:grid-cols-[1fr_140px]">
                  <div className="space-y-2">
                    <Label>Dosage / Strength</Label>
                    <Input
                      value={form.dosage}
                      onChange={(event) => updateField("dosage", event.target.value)}
                      placeholder="500"
                      className="h-11 rounded-xl"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Unit</Label>
                    <Select
                      value={form.strengthUnit}
                      onValueChange={(value) => updateField("strengthUnit", value)}
                    >
                      <SelectTrigger className="h-11 rounded-xl">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {["mg", "mcg", "g", "ml", "IU", "puff"].map((unit) => (
                          <SelectItem key={unit} value={unit}>
                            {unit}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Intake instruction</Label>
                  <Select
                    value={form.instruction}
                    onValueChange={(value) => updateField("instruction", value)}
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
                      ].map((instruction) => (
                        <SelectItem key={instruction} value={instruction}>
                          {instruction}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            )}

            {step === 2 && (
              <div className="space-y-6">
                <div className="space-y-2">
                  <Label>Frequency</Label>
                  <Select value={form.frequency} onValueChange={updateFrequency}>
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
                      ].map((frequency) => (
                        <SelectItem key={frequency} value={frequency}>
                          {frequency}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-3">
                  <div>
                    <Label>Reminder times</Label>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {getTimeCount(form.frequency)} reminder {getTimeCount(form.frequency) === 1 ? "time" : "times"} required.
                    </p>
                  </div>

                  <div className="space-y-3">
                    {Array.from({ length: getTimeCount(form.frequency) }).map((_, index) => (
                      <div
                        key={`${form.frequency}-${index}`}
                        className="rounded-2xl border border-border/60 bg-muted/20 p-4"
                      >
                        <div className="mb-2 flex items-center justify-between">
                          <Label className="text-xs font-semibold text-muted-foreground">
                            Reminder time {index + 1}
                          </Label>
                          <span className="inline-flex items-center gap-1 text-[11px] text-muted-foreground">
                            <Clock3 className="size-3" />
                            Select time
                          </span>
                        </div>

                        <Select
                          value={reminderTimes[index] ?? "09:00"}
                          onValueChange={(value) => updateReminderTime(index, value)}
                        >
                          <SelectTrigger className="h-11 rounded-xl bg-background">
                            <SelectValue placeholder="Select reminder time" />
                          </SelectTrigger>
                          <SelectContent className="max-h-72">
                            {TIME_OPTIONS.map((option) => (
                              <SelectItem key={option.value} value={option.value}>
                                {option.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    ))}
                  </div>

                  <Alert className="rounded-2xl border-primary/20 bg-primary/5">
                    <Pill className="size-4 text-primary" />
                    <AlertTitle>Reminder schedule</AlertTitle>
                    <AlertDescription>
                      <div className="mt-1 flex flex-wrap gap-2">
                        {reminderTimes.map((time, index) => (
                          <span
                            key={index}
                            className="inline-flex items-center gap-1 rounded-full border border-border/70 bg-background px-3 py-1.5 text-xs font-semibold"
                          >
                            <Clock3 className="size-3.5" />
                            {formatReminderTime(time)}
                          </span>
                        ))}
                      </div>
                    </AlertDescription>
                  </Alert>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label>Start date</Label>
                    <Input
                      type="date"
                      value={form.startDate}
                      onChange={(event) => updateField("startDate", event.target.value)}
                      className="h-11 rounded-xl"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>End date</Label>
                    <Input
                      type="date"
                      value={form.endDate}
                      onChange={(event) => updateField("endDate", event.target.value)}
                      className="h-11 rounded-xl"
                    />
                  </div>
                </div>

                {form.startDate &&
                  form.endDate &&
                  !isValidDateRange(form.startDate, form.endDate) && (
                    <Alert className="rounded-2xl border-destructive/40 bg-destructive/10">
                      <AlertTriangle className="size-4 text-destructive" />
                      <AlertTitle>Invalid date range</AlertTitle>
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
                  <Label htmlFor="edit-quantity">Quantity in hand</Label>
                  <Input
                    id="edit-quantity"
                    type="number"
                    min="1"
                    value={form.quantity}
                    onChange={(event) => updateField("quantity", event.target.value)}
                    className="h-11 rounded-xl"
                  />
                  <p className="text-xs text-muted-foreground">
                    Current tablets available for this medicine.
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="edit-low-stock-threshold">
                    Low Stock Alert
                  </Label>
                  <Input
                    id="edit-low-stock-threshold"
                    type="number"
                    min="1"
                    value={form.lowStockThreshold}
                    onChange={(event) =>
                      updateField("lowStockThreshold", event.target.value)
                    }
                    className="h-11 rounded-xl"
                    placeholder="5"
                  />
                  <p className="text-xs text-muted-foreground">
                    Create a low-stock alert when the remaining quantity reaches this value.
                  </p>
                </div>

                {Number(form.lowStockThreshold) < 1 && (
                  <Alert className="rounded-2xl border-destructive/40 bg-destructive/10">
                    <AlertTriangle className="size-4 text-destructive" />
                    <AlertTitle>Invalid Low Stock Alert</AlertTitle>
                    <AlertDescription>
                      Low Stock Alert must be at least 1 tablet.
                    </AlertDescription>
                  </Alert>
                )}

                {Number(form.lowStockThreshold) >= Number(form.quantity) &&
                  Number(form.quantity) > 0 && (
                    <Alert className="rounded-2xl border-destructive/40 bg-destructive/10">
                      <AlertTriangle className="size-4 text-destructive" />
                      <AlertTitle>Invalid Low Stock Alert</AlertTitle>
                      <AlertDescription>
                        Low Stock Alert must be lower than the quantity in hand.
                      </AlertDescription>
                    </Alert>
                  )}

                {Number(form.quantity) > 0 &&
                  Number(form.lowStockThreshold) > 0 &&
                  Number(form.lowStockThreshold) < Number(form.quantity) &&
                  Number(form.quantity) <= Number(form.lowStockThreshold) + 2 && (
                    <Alert className="rounded-2xl border-warning/40 bg-warning/10">
                      <AlertTriangle className="size-4 text-warning" />
                      <AlertTitle>Low stock setting is close</AlertTitle>
                      <AlertDescription>
                        This medicine will reach the alert threshold after only a few doses.
                      </AlertDescription>
                    </Alert>
                  )}
              </div>
            )}

            {step === 4 && (
              <div className="space-y-2">
                <Label>Additional instructions</Label>
                <Textarea
                  value={form.notes}
                  onChange={(event) => updateField("notes", event.target.value)}
                  className="min-h-28 rounded-xl"
                  placeholder="Special instructions..."
                />
              </div>
            )}

            {step === 5 && (
              <div className="space-y-5">
                <dl className="grid gap-4 rounded-2xl border border-border/70 p-5 sm:grid-cols-2">
                  <PreviewItem label="Medicine" value={form.name} />
                  <PreviewItem
                    label="Dosage"
                    value={`${form.dosage} ${form.strengthUnit}`}
                  />
                  <PreviewItem label="Frequency" value={form.frequency} />

                  <div>
                    <dt className="text-xs text-muted-foreground">
                      Reminder times
                    </dt>
                    <dd className="mt-2 flex flex-wrap gap-2">
                      {reminderTimes.map((time, index) => (
                        <span
                          key={index}
                          className="inline-flex items-center gap-1 rounded-full border border-border/70 px-2.5 py-1 text-xs font-semibold"
                        >
                          <Clock3 className="size-3" />
                          {formatReminderTime(time)}
                        </span>
                      ))}
                    </dd>
                  </div>

                  <PreviewItem label="Start date" value={form.startDate} />
                  <PreviewItem label="End date" value={form.endDate} />
                  <PreviewItem label="Quantity" value={`${form.quantity} tablets`} />
                  <PreviewItem
                    label="Low Stock Alert"
                    value={`At ${form.lowStockThreshold} tablets`}
                  />
                  <PreviewItem label="Instruction" value={form.instruction} />
                </dl>
              </div>
            )}
          </div>

          <div className="mt-7 flex items-center justify-between gap-3">
            <Button
              type="button"
              variant="outline"
              className="rounded-full"
              disabled={step === 0 || saving}
              onClick={() => setStep((current) => Math.max(0, current - 1))}
            >
              <ArrowLeft className="size-4" />
              Back
            </Button>

            {step < steps.length - 1 ? (
              <Button
                type="button"
                className="bg-brand-gradient rounded-full font-semibold shadow-glow"
                disabled={
                  saving ||
                  validatingMedicine ||
                  (step === 0
                    ? (!medicineNameUnchanged && !nameValid) || Boolean(duplicate)
                    : !isStepValid())
                }
                onClick={handleNext}
              >
                Continue
                <ArrowRight className="size-4" />
              </Button>
            ) : (
              <Button
                type="button"
                className="bg-brand-gradient rounded-full font-semibold shadow-glow"
                disabled={saving || validatingMedicine || !nameValid || Boolean(duplicate) || !step3Valid}
                onClick={handleUpdate}
              >
                <Save className="size-4" />
                {saving ? "Updating..." : "Update medicine"}
              </Button>
            )}
          </div>
        </Card>

        <Card className="h-fit gap-0 rounded-2xl border-border/70 p-6 shadow-soft">
          <SectionHeading
            title="Live preview"
            description="Preview your updated medicine details."
          />

          <div className="mt-5 rounded-2xl border border-border/70 bg-muted/40 p-5">
            <div className="flex items-center gap-3">
              <span className="grid size-12 place-items-center rounded-2xl bg-primary-soft text-primary">
                <Pill className="size-6" />
              </span>
              <div>
                <p className="font-bold">
                  {form.name || "Medicine name"}
                </p>
                <p className="text-xs text-muted-foreground">
                  {form.dosage
                    ? `${form.dosage} ${form.strengthUnit}`
                    : "Dosage"}
                </p>
              </div>
            </div>

            <dl className="mt-5 space-y-4">
              <PreviewItem label="Frequency" value={form.frequency} />

              <div>
                <dt className="text-xs text-muted-foreground">Reminder times</dt>
                <dd className="mt-2 flex flex-wrap gap-2">
                  {reminderTimes.map((time, index) => (
                    <span
                      key={index}
                      className="inline-flex items-center gap-1.5 rounded-full border border-border/70 bg-background px-3 py-1.5 text-sm font-semibold"
                    >
                      <Clock3 className="size-3.5" />
                      {formatReminderTime(time)}
                    </span>
                  ))}
                </dd>
              </div>

              <PreviewItem label="Quantity" value={`${form.quantity} tablets`} />
              <PreviewItem
                label="Low Stock Alert"
                value={`At ${form.lowStockThreshold} tablets`}
              />
              <PreviewItem
                label="Duration"
                value={
                  form.startDate && form.endDate
                    ? `${form.startDate} → ${form.endDate}`
                    : "Not set"
                }
              />
            </dl>
          </div>

          {Number(form.lowStockThreshold) < Number(form.quantity) &&
            Number(form.quantity) > 0 &&
            Number(form.quantity) <= Number(form.lowStockThreshold) && (
              <Alert className="mt-4 rounded-2xl border-warning/40 bg-warning/10">
                <AlertTriangle className="size-4 text-warning" />
                <AlertTitle>Low stock</AlertTitle>
                <AlertDescription>
                  Only {form.quantity} tablets remain.
                </AlertDescription>
              </Alert>
            )}
        </Card>
      </div>
    </div>
  );
}

function PreviewItem({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd className="font-semibold text-foreground">{value}</dd>
    </div>
  );
}
