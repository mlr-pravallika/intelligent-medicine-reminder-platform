import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { AlertTriangle, ArrowLeft, ArrowRight, Check, Pill, Save } from "lucide-react";
import { toast } from "sonner";
import { addMedicine } from "@/services/medicineService";
import { useEffect } from "react";
import { getMedicines } from "@/services/medicineService";
import { scanPrescription } from "@/services/ocrService";
import { SectionHeading } from "@/components/portal/stat-card";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/patient/medicines/add")({
  head: () => ({
    meta: [
      { title: "Add Medicine — MediCare AI" },
      { name: "description", content: "Smart six-step medicine intake with live validation and duplicate detection." },
      { property: "og:title", content: "Add Medicine — MediCare AI" },
      { property: "og:description", content: "Capture medicine, dosage, schedule, quantity and doctor details." },
    ],
  }),
  component: AddMedicinePage,
});

const steps = [
  "Medicine details",
  "Dosage",
  "Schedule",
  "Quantity",
  "Doctor information",
  "Confirmation",
];

type FormState = {
  name: string;
  generic: string;
  category: string;
  form: string;
  dosage: string;
  strengthUnit: string;
  instruction: string;
  frequency: string;
  times: string;
  startDate: string;
  endDate: string;
  quantity: string;
  refillThreshold: string;
  doctor: string;
  clinic: string;
  notes: string;
};

const initial: FormState = {
  name: "",
  generic: "",
  category: "Cardiovascular",
  form: "Tablet",
  dosage: "",
  strengthUnit: "mg",
  instruction: "After food",
  frequency: "Once daily",
  times: "09:00",
  startDate: "2026-07-29",
  endDate: "2026-10-29",
  quantity: "30",
  refillThreshold: "10",
  doctor: "",
  clinic: "",
  notes: "",
};

function AddMedicinePage() {
  const [step, setStep] = useState(0);
  const [form, setForm] = useState<FormState>(initial);
  const [saving, setSaving] = useState(false);
  const [existingMedicines, setExistingMedicines] = useState<any[]>([]);
  const [scanning, setScanning] = useState(false);
  const set = (key: keyof FormState) => (value: string) => setForm((f) => ({ ...f, [key]: value }));

  useEffect(() => {
    loadMedicines();
  }, []);

  const loadMedicines = async () => {
      try {
          const data = await getMedicines();
          setExistingMedicines(data);
      } catch (err) {
          console.error(err);
      }
  };

  useEffect(() => {

    const saved = localStorage.getItem("ocrData");

    if (!saved) return;

    const data = JSON.parse(saved);

    localStorage.removeItem("ocrData");

    const medicine = data.medicines?.map((m: any) => ({
        ...m,
        medicine_name: m.medicine_name || "",
        dosage: m.dosage || "",
        frequency: m.frequency || "",
        instructions: m.instructions || ""
    }));

    if (!medicine) return;

    setForm((prev) => ({

        ...prev,

        name: medicine.medicine_name || "",

        dosage: medicine.dosage || "",

        frequency: medicine.frequency || "",

        instruction: medicine.instructions || "",

        doctor: data.doctor_name || "",

        clinic: data.hospital || "",

        notes: medicine.instructions || "",

    }));

  }, []);

  const duplicate = existingMedicines.find(
    (m: any) =>
      m.medicine_name.toLowerCase() ===
      form.name.trim().toLowerCase()
  );
  const duplicateSchedule =
    duplicate?.reminder_time === form.times;
  const handleSaveMedicine = async () => {
  try {
    setSaving(true);

    await addMedicine({
      medicine_name: form.name,
      dosage: `${form.dosage} ${form.strengthUnit}`,
      frequency: form.frequency,
      reminder_time: form.times,
      start_date: form.startDate,
      end_date: form.endDate,
      instructions: form.notes,
      total_quantity: Number(form.quantity),
      remaining_quantity: Number(form.quantity),
      tablets_per_day:
        form.frequency === "Once daily"
          ? 1
          : form.frequency === "Twice daily"
          ? 2
          : form.frequency === "Three times daily"
          ? 3
          : 1,
    });

    toast.success("Medicine added successfully!");

    setForm(initial);
    setStep(0);
  } catch (error) {
    console.error(error);
    toast.error("Failed to save medicine.");
  } finally {
    setSaving(false);
  }


  const handlePrescriptionScan = async (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {

    const file = e.target.files?.[0];

    if (!file) return;

    try {

      setScanning(true);

      const data = await scanPrescription(file);

      console.log(data);

    } catch (err) {

      console.error(err);

      toast.error("Failed to scan prescription");

    } finally {

      setScanning(false);

    }

  };
};

  const canContinue =
    (step === 0 && form.name.trim().length > 1) ||
    (step === 1 && form.dosage.trim().length > 0) ||
    (step === 2 && form.times.trim().length > 0) ||
    step === 3 ||
    (step === 4 && form.doctor.trim().length > 1) ||
    step === 5;

  return (
    <div className="space-y-6">
      <SectionHeading
        title="Smart add medicine"
        description="Six guided steps with live validation, duplicate detection and a live preview."
      />

      <div className="grid gap-5 xl:grid-cols-[1.5fr_1fr]">
        <Card className="gap-0 rounded-2xl border-border/70 p-6 shadow-soft">
          <ol className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-6">
            {steps.map((label, i) => (
              <li key={label} className="min-w-0">
                <div
                  className={cn(
                    "flex items-center gap-2 rounded-xl px-2.5 py-2 text-xs font-semibold",
                    i === step
                      ? "bg-primary-soft text-primary"
                      : i < step
                        ? "text-accent"
                        : "text-muted-foreground",
                  )}
                >
                  <span
                    className={cn(
                      "grid size-5 shrink-0 place-items-center rounded-full text-[10px]",
                      i < step ? "bg-accent text-accent-foreground" : i === step ? "bg-primary text-primary-foreground" : "bg-muted",
                    )}
                  >
                    {i < step ? <Check className="size-3" aria-hidden="true" /> : i + 1}
                  </span>
                  <span className="truncate">{label}</span>
                </div>
              </li>
            ))}
          </ol>
          <Progress value={((step + 1) / steps.length) * 100} className="mt-4 h-1.5" />

          <div className="mt-6 space-y-5">
            {step === 0 && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="med-name">Medicine name</Label>
                  <Input id="med-name" value={form.name} onChange={(e) => set("name")(e.target.value)} placeholder="e.g. Metformin" className="h-11 rounded-xl" />
                  {form.name.trim().length > 0 && form.name.trim().length < 2 && (
                    <p className="text-xs text-destructive">Enter at least 2 characters.</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="med-generic">Generic name</Label>
                  <Input id="med-generic" value={form.generic} onChange={(e) => set("generic")(e.target.value)} placeholder="e.g. Metformin Hydrochloride" className="h-11 rounded-xl" />
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="med-category">Category</Label>
                    <Select value={form.category} onValueChange={set("category")}>
                      <SelectTrigger id="med-category" className="h-11 rounded-xl"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {["Cardiovascular", "Diabetes", "Endocrine", "Antibiotic", "Respiratory", "Supplement", "Pain relief"].map((c) => (
                          <SelectItem key={c} value={c}>{c}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="med-form">Form</Label>
                    <Select value={form.form} onValueChange={set("form")}>
                      <SelectTrigger id="med-form" className="h-11 rounded-xl"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {["Tablet", "Capsule", "Syrup", "Injection", "Inhaler", "Softgel", "Drops"].map((c) => (
                          <SelectItem key={c} value={c}>{c}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </>
            )}

            {step === 1 && (
              <>
                <div className="grid gap-4 sm:grid-cols-[1fr_140px]">
                  <div className="space-y-2">
                    <Label htmlFor="med-dosage">Strength</Label>
                    <Input id="med-dosage" value={form.dosage} onChange={(e) => set("dosage")(e.target.value)} placeholder="500" className="h-11 rounded-xl" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="med-unit">Unit</Label>
                    <Select value={form.strengthUnit} onValueChange={set("strengthUnit")}>
                      <SelectTrigger id="med-unit" className="h-11 rounded-xl"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {["mg", "mcg", "ml", "IU", "puff"].map((u) => <SelectItem key={u} value={u}>{u}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="med-instruction">Intake instruction</Label>
                  <Select value={form.instruction} onValueChange={set("instruction")}>
                    <SelectTrigger id="med-instruction" className="h-11 rounded-xl"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {["Before food", "After food", "With food", "Empty stomach", "Before sleep"].map((i) => (
                        <SelectItem key={i} value={i}>{i}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </>
            )}

            {step === 2 && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="med-frequency">Frequency</Label>
                  <Select value={form.frequency} onValueChange={set("frequency")}>
                    <SelectTrigger id="med-frequency" className="h-11 rounded-xl"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {["Once daily", "Twice daily", "Three times daily", "Every other day", "Weekly", "As needed"].map((f) => (
                        <SelectItem key={f} value={f}>{f}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="med-times">Reminder time</Label>
                  <Input id="med-times" type="time" value={form.times} onChange={(e) => set("times")(e.target.value)} className="h-11 rounded-xl" />
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="med-start">Start date</Label>
                    <Input id="med-start" type="date" value={form.startDate} onChange={(e) => set("startDate")(e.target.value)} className="h-11 rounded-xl" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="med-end">End date</Label>
                    <Input id="med-end" type="date" value={form.endDate} onChange={(e) => set("endDate")(e.target.value)} className="h-11 rounded-xl" />
                  </div>
                </div>
                {duplicate && duplicateSchedule && (
                  <Alert className="rounded-2xl border-warning/40 bg-warning/10">
                    <AlertTriangle className="size-4 text-warning" />
                    <AlertTitle className="font-bold">Duplicate schedule detected</AlertTitle>
                    <AlertDescription>
                      {duplicate.medicine_name} is already scheduled at {form.times}. Saving will merge into the existing schedule.
                    </AlertDescription>
                  </Alert>
                )}
              </>
            )}

            {step === 3 && (
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="med-qty">Quantity in hand</Label>
                  <Input id="med-qty" type="number" min="0" value={form.quantity} onChange={(e) => set("quantity")(e.target.value)} className="h-11 rounded-xl" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="med-threshold">Low stock alert at</Label>
                  <Input id="med-threshold" type="number" min="0" value={form.refillThreshold} onChange={(e) => set("refillThreshold")(e.target.value)} className="h-11 rounded-xl" />
                </div>
                <p className="text-xs text-muted-foreground sm:col-span-2">
                  MediCare AI will predict your refill date from actual consumption and alert you before stock runs out.
                </p>
              </div>
            )}

            {step === 4 && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="med-doctor">Prescribing doctor</Label>
                  <Input id="med-doctor" value={form.doctor} onChange={(e) => set("doctor")(e.target.value)} placeholder="Dr. Anita Raman" className="h-11 rounded-xl" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="med-clinic">Clinic / hospital</Label>
                  <Input id="med-clinic" value={form.clinic} onChange={(e) => set("clinic")(e.target.value)} placeholder="Northside Endocrinology" className="h-11 rounded-xl" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="med-notes">Notes</Label>
                  <Textarea id="med-notes" value={form.notes} onChange={(e) => set("notes")(e.target.value)} placeholder="Any special instructions" className="min-h-24 rounded-xl" />
                </div>
              </>
            )}

            {step === 5 && (
              <div className="space-y-4">
                {duplicate ? (
                  <Alert className="rounded-2xl border-warning/40 bg-warning/10">
                    <AlertTriangle className="size-4 text-warning" />
                    <AlertTitle className="font-bold">This medicine already exists</AlertTitle>
                    <AlertDescription>
                      {duplicate.medicine_name} ({duplicate.dosage}) is already in your register with status {duplicate.is_active ? "Active" : "Inactive"}.
                      You can update the existing record instead of creating a duplicate.
                    </AlertDescription>
                  </Alert>
                ) : (
                  <Alert className="rounded-2xl border-accent/40 bg-accent-soft">
                    <Check className="size-4 text-accent" />
                    <AlertTitle className="font-bold">Ready to save</AlertTitle>
                    <AlertDescription>No duplicate medicine or conflicting schedule was detected.</AlertDescription>
                  </Alert>
                )}
                <dl className="grid gap-3 rounded-2xl border border-border/70 p-4 sm:grid-cols-2">
                  {[
                    ["Medicine", form.name || "—"],
                    ["Dosage", form.dosage ? `${form.dosage} ${form.strengthUnit}` : "—"],
                    ["Frequency", form.frequency],
                    ["Reminder", form.times],
                    ["Quantity", `${form.quantity} units`],
                    ["Doctor", form.doctor || "—"],
                  ].map(([k, v]) => (
                    <div key={k}>
                      <dt className="text-xs text-muted-foreground">{k}</dt>
                      <dd className="text-sm font-semibold text-foreground">{v}</dd>
                    </div>
                  ))}
                </dl>
              </div>
            )}
          </div>

          <div className="mt-7 flex flex-wrap items-center justify-between gap-3">
            <Button variant="outline" className="rounded-full font-semibold" disabled={step === 0} onClick={() => setStep((s) => Math.max(0, s - 1))}>
              <ArrowLeft className="size-4" /> Back
            </Button>
            {step < steps.length - 1 ? (
              <Button className="bg-brand-gradient rounded-full font-semibold shadow-glow" disabled={!canContinue} onClick={() => setStep((s) => s + 1)}>
                Continue <ArrowRight className="size-4" />
              </Button>
            ) : (
              <div className="flex flex-wrap gap-2">
                {duplicate && (
                  <Button variant="outline" className="rounded-full font-semibold" onClick={() => toast.success(`${duplicate.medicine_name} already exists.`)}>
                    Update existing
                  </Button>
                )}
                <Button
                  className="bg-brand-gradient rounded-full font-semibold shadow-glow"
                  disabled={saving}
                  onClick={handleSaveMedicine}
                >
                  <Save className="size-4" />
                  {saving ? "Saving..." : "Save medicine"}
                </Button>
              </div>
            )}
          </div>
        </Card>

        <Card className="h-fit gap-0 rounded-2xl border-border/70 p-6 shadow-soft">
          <SectionHeading title="Live preview" description="Updates as you type" />
          <div className="mt-5 rounded-2xl border border-border/70 bg-muted/40 p-5">
            <div className="grid grid-cols-[auto_minmax(0,1fr)] items-center gap-3">
              <span className="grid size-12 shrink-0 place-items-center rounded-2xl bg-primary-soft text-primary">
                <Pill className="size-6" aria-hidden="true" />
              </span>
              <div className="min-w-0">
                <p className="truncate text-base font-bold text-foreground">{form.name || "Medicine name"}</p>
                <p className="truncate text-xs text-muted-foreground">{form.generic || "Generic name"}</p>
              </div>
            </div>
            <dl className="mt-4 grid grid-cols-2 gap-3 text-sm">
              <div><dt className="text-xs text-muted-foreground">Dosage</dt><dd className="font-semibold text-foreground">{form.dosage ? `${form.dosage} ${form.strengthUnit}` : "—"}</dd></div>
              <div><dt className="text-xs text-muted-foreground">Form</dt><dd className="font-semibold text-foreground">{form.form}</dd></div>
              <div><dt className="text-xs text-muted-foreground">Frequency</dt><dd className="font-semibold text-foreground">{form.frequency}</dd></div>
              <div><dt className="text-xs text-muted-foreground">Time</dt><dd className="font-semibold text-foreground">{form.times}</dd></div>
              <div><dt className="text-xs text-muted-foreground">Instruction</dt><dd className="font-semibold text-foreground">{form.instruction}</dd></div>
              <div><dt className="text-xs text-muted-foreground">Stock</dt><dd className="font-semibold text-foreground">{form.quantity} tablets</dd></div>
            </dl>
          </div>
          {duplicate && (
            <p className="mt-4 rounded-xl bg-warning/10 p-3 text-xs font-medium text-warning">
              Live validation: a medicine named {duplicate.medicine_name} already exists.
            </p>
          )}
        </Card>
      </div>
    </div>
  );
}
