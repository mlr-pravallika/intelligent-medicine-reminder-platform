import { useEffect, useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
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
import { SectionHeading } from "@/components/portal/stat-card";
import {
    AlertTriangle,
    ArrowLeft,
    ArrowRight,
    Check,
    Pill,
    Save,
} from "lucide-react";
import { toast } from "sonner";
import { getMedicine, updateMedicine } from "@/services/medicineService";
import { medicines } from "@/lib/mock-data";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/patient/medicines/edit/$id")({
    component: EditMedicinePage,
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

const initialState: FormState = {
    name: "",
    generic: "",
    category: "Cardiovascular",
    form: "Tablet",
    dosage: "",
    strengthUnit: "mg",
    instruction: "After food",
    frequency: "Once daily",
    times: "",
    startDate: "",
    endDate: "",
    quantity: "30",
    refillThreshold: "10",
    doctor: "",
    clinic: "",
    notes: "",
};

function EditMedicinePage() {
    const navigate = useNavigate();
    const { id } = Route.useParams();

    const [step, setStep] = useState(0);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [form, setForm] = useState<FormState>(initialState);

    const set =
        (key: keyof FormState) =>
        (value: string) =>
            setForm((prev) => ({
                ...prev,
                [key]: value,
            }));

    const duplicate = medicines.find(
        (medicine) =>
            medicine.name.toLowerCase() ===
            form.name.trim().toLowerCase(),
    );
    const duplicateSchedule = duplicate?.times.includes(form.times.trim());

    useEffect(() => {
        async function loadMedicine() {
            try {
                const medicine = await getMedicine(Number(id));
                const dosageParts = medicine.dosage.split(" ");

                setForm({
                    ...initialState,
                    name: medicine.medicine_name,
                    dosage: dosageParts[0] || "",
                    strengthUnit: dosageParts[1] || "mg",
                    frequency: medicine.frequency,
                    times: medicine.reminder_time,
                    startDate: medicine.start_date,
                    endDate: medicine.end_date,
                    notes: medicine.instructions || "",
                });
            } catch (error) {
                console.error(error);
                toast.error("Unable to load medicine.");
                navigate({ to: "/patient/medicines" });
            } finally {
                setLoading(false);
            }
        }

        loadMedicine();
    }, [id, navigate]);

    async function handleUpdateMedicine() {
        try {
            setSaving(true);

            await updateMedicine(Number(id), {
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

            toast.success("Medicine updated successfully!");
            navigate({ to: "/patient/medicines" });
        } catch (error) {
            console.error(error);
            toast.error("Failed to update medicine.");
        } finally {
            setSaving(false);
        }
    }

    const canContinue =
        (step === 0 && form.name.trim().length > 1) ||
        (step === 1 && form.dosage.trim().length > 0) ||
        (step === 2 && form.times.trim().length > 0) ||
        step === 3 ||
        (step === 4 && form.doctor.trim().length > 1) ||
        step >= 5;

    if (loading) {
        return (
            <div className="flex items-center justify-center py-20">
                <p className="text-lg font-semibold">Loading medicine...</p>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <SectionHeading
                title="Edit Medicine"
                description="Update your medicine information."
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
                                        {index < step ? (
                                            <Check className="size-3" />
                                        ) : (
                                            index + 1
                                        )}
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
                            <>
                                <div className="space-y-2">
                                    <Label htmlFor="medicine-name">Medicine Name</Label>
                                    <Input
                                        id="medicine-name"
                                        value={form.name}
                                        onChange={(e) => set("name")(e.target.value)}
                                        placeholder="Medicine Name"
                                        className="h-11 rounded-xl"
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="generic-name">Generic Name</Label>
                                    <Input
                                        id="generic-name"
                                        value={form.generic}
                                        onChange={(e) => set("generic")(e.target.value)}
                                        placeholder="Generic Name"
                                        className="h-11 rounded-xl"
                                    />
                                </div>

                                <div className="grid gap-4 sm:grid-cols-2">
                                    <div className="space-y-2">
                                        <Label>Category</Label>
                                        <Select value={form.category} onValueChange={set("category")}>
                                            <SelectTrigger className="h-11 rounded-xl">
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="Cardiovascular">Cardiovascular</SelectItem>
                                                <SelectItem value="Diabetes">Diabetes</SelectItem>
                                                <SelectItem value="Endocrine">Endocrine</SelectItem>
                                                <SelectItem value="Antibiotic">Antibiotic</SelectItem>
                                                <SelectItem value="Respiratory">Respiratory</SelectItem>
                                                <SelectItem value="Supplement">Supplement</SelectItem>
                                                <SelectItem value="Pain relief">Pain Relief</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>

                                    <div className="space-y-2">
                                        <Label>Medicine Form</Label>
                                        <Select value={form.form} onValueChange={set("form")}>
                                            <SelectTrigger className="h-11 rounded-xl">
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="Tablet">Tablet</SelectItem>
                                                <SelectItem value="Capsule">Capsule</SelectItem>
                                                <SelectItem value="Syrup">Syrup</SelectItem>
                                                <SelectItem value="Injection">Injection</SelectItem>
                                                <SelectItem value="Inhaler">Inhaler</SelectItem>
                                                <SelectItem value="Softgel">Softgel</SelectItem>
                                                <SelectItem value="Drops">Drops</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>
                            </>
                        )}

                        {step === 1 && (
                            <>
                                <div className="space-y-2">
                                    <Label>Strength</Label>
                                    <Input
                                        value={form.dosage}
                                        onChange={(e) => set("dosage")(e.target.value)}
                                        placeholder="500"
                                        className="h-11 rounded-xl"
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label>Strength Unit</Label>
                                    <Select
                                        value={form.strengthUnit}
                                        onValueChange={set("strengthUnit")}
                                    >
                                        <SelectTrigger className="h-11 rounded-xl">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="mg">mg</SelectItem>
                                            <SelectItem value="mcg">mcg</SelectItem>
                                            <SelectItem value="ml">ml</SelectItem>
                                            <SelectItem value="IU">IU</SelectItem>
                                            <SelectItem value="puff">puff</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div className="space-y-2">
                                    <Label>Intake Instruction</Label>
                                    <Select
                                        value={form.instruction}
                                        onValueChange={set("instruction")}
                                    >
                                        <SelectTrigger className="h-11 rounded-xl">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="Before food">Before food</SelectItem>
                                            <SelectItem value="After food">After food</SelectItem>
                                            <SelectItem value="With food">With food</SelectItem>
                                            <SelectItem value="Empty stomach">Empty stomach</SelectItem>
                                            <SelectItem value="Before sleep">Before sleep</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </>
                        )}

                        {step === 2 && (
                            <>
                                <div className="space-y-2">
                                    <Label>Frequency</Label>
                                    <Select value={form.frequency} onValueChange={set("frequency")}>
                                        <SelectTrigger className="h-11 rounded-xl">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="Once daily">Once daily</SelectItem>
                                            <SelectItem value="Twice daily">Twice daily</SelectItem>
                                            <SelectItem value="Three times daily">Three times daily</SelectItem>
                                            <SelectItem value="Every other day">Every other day</SelectItem>
                                            <SelectItem value="Weekly">Weekly</SelectItem>
                                            <SelectItem value="As needed">As needed</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div className="space-y-2">
                                    <Label>Reminder Time</Label>
                                    <Input
                                        type="time"
                                        value={form.times}
                                        onChange={(e) => set("times")(e.target.value)}
                                        className="h-11 rounded-xl"
                                    />
                                </div>

                                <div className="grid gap-4 sm:grid-cols-2">
                                    <div className="space-y-2">
                                        <Label>Start Date</Label>
                                        <Input
                                            type="date"
                                            value={form.startDate}
                                            onChange={(e) => set("startDate")(e.target.value)}
                                            className="h-11 rounded-xl"
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <Label>End Date</Label>
                                        <Input
                                            type="date"
                                            value={form.endDate}
                                            onChange={(e) => set("endDate")(e.target.value)}
                                            className="h-11 rounded-xl"
                                        />
                                    </div>
                                </div>

                                {duplicate && duplicateSchedule && (
                                    <Alert className="rounded-2xl border-warning/40 bg-warning/10">
                                        <AlertTriangle className="size-4 text-warning" />
                                        <AlertTitle>Duplicate Schedule Detected</AlertTitle>
                                        <AlertDescription>
                                            {duplicate.name} already has a reminder at {form.times}.
                                        </AlertDescription>
                                    </Alert>
                                )}
                            </>
                        )}

                        {step === 3 && (
                            <div className="grid gap-4 sm:grid-cols-2">
                                <div className="space-y-2">
                                    <Label htmlFor="quantity">Quantity in Hand</Label>
                                    <Input
                                        id="quantity"
                                        type="number"
                                        min="0"
                                        value={form.quantity}
                                        onChange={(e) => set("quantity")(e.target.value)}
                                        className="h-11 rounded-xl"
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="threshold">Low Stock Alert</Label>
                                    <Input
                                        id="threshold"
                                        type="number"
                                        min="0"
                                        value={form.refillThreshold}
                                        onChange={(e) => set("refillThreshold")(e.target.value)}
                                        className="h-11 rounded-xl"
                                    />
                                </div>

                                <p className="text-xs text-muted-foreground sm:col-span-2">
                                    MediCare AI will automatically remind you before your medicine stock runs out.
                                </p>
                            </div>
                        )}

                        {step === 4 && (
                            <>
                                <div className="space-y-2">
                                    <Label htmlFor="doctor">Prescribing Doctor</Label>
                                    <Input
                                        id="doctor"
                                        value={form.doctor}
                                        onChange={(e) => set("doctor")(e.target.value)}
                                        placeholder="Dr. John Smith"
                                        className="h-11 rounded-xl"
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="clinic">Clinic / Hospital</Label>
                                    <Input
                                        id="clinic"
                                        value={form.clinic}
                                        onChange={(e) => set("clinic")(e.target.value)}
                                        placeholder="ABC Hospital"
                                        className="h-11 rounded-xl"
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="notes">Notes</Label>
                                    <Textarea
                                        id="notes"
                                        value={form.notes}
                                        onChange={(e) => set("notes")(e.target.value)}
                                        placeholder="Special instructions..."
                                        className="min-h-24 rounded-xl"
                                    />
                                </div>
                            </>
                        )}

                        {step === 5 && (
                            <div className="space-y-4">
                                <Alert className="rounded-2xl border-accent/40 bg-accent-soft">
                                    <Check className="size-4 text-accent" />
                                    <AlertTitle className="font-bold">Ready to Update</AlertTitle>
                                    <AlertDescription>
                                        Please review the medicine information before saving your changes.
                                    </AlertDescription>
                                </Alert>

                                <dl className="grid gap-3 rounded-2xl border border-border/70 p-4 sm:grid-cols-2">
                                    <div>
                                        <dt className="text-xs text-muted-foreground">Medicine</dt>
                                        <dd className="text-sm font-semibold">{form.name || "—"}</dd>
                                    </div>
                                    <div>
                                        <dt className="text-xs text-muted-foreground">Dosage</dt>
                                        <dd className="text-sm font-semibold">
                                            {form.dosage} {form.strengthUnit}
                                        </dd>
                                    </div>
                                    <div>
                                        <dt className="text-xs text-muted-foreground">Frequency</dt>
                                        <dd className="text-sm font-semibold">{form.frequency}</dd>
                                    </div>
                                    <div>
                                        <dt className="text-xs text-muted-foreground">Reminder Time</dt>
                                        <dd className="text-sm font-semibold">{form.times}</dd>
                                    </div>
                                    <div>
                                        <dt className="text-xs text-muted-foreground">Quantity</dt>
                                        <dd className="text-sm font-semibold">{form.quantity} units</dd>
                                    </div>
                                    <div>
                                        <dt className="text-xs text-muted-foreground">Doctor</dt>
                                        <dd className="text-sm font-semibold">{form.doctor || "—"}</dd>
                                    </div>
                                    <div>
                                        <dt className="text-xs text-muted-foreground">Start Date</dt>
                                        <dd className="text-sm font-semibold">{form.startDate}</dd>
                                    </div>
                                    <div>
                                        <dt className="text-xs text-muted-foreground">End Date</dt>
                                        <dd className="text-sm font-semibold">{form.endDate}</dd>
                                    </div>
                                </dl>
                            </div>
                        )}
                    </div>

                    <div className="mt-7 flex flex-wrap items-center justify-between gap-3">
                        <Button
                            variant="outline"
                            className="rounded-full font-semibold"
                            disabled={step === 0}
                            onClick={() => setStep((current) => Math.max(0, current - 1))}
                        >
                            <ArrowLeft className="size-4" />
                            Back
                        </Button>

                        {step < steps.length - 1 ? (
                            <Button
                                className="rounded-full bg-brand-gradient font-semibold shadow-glow"
                                disabled={!canContinue}
                                onClick={() => setStep((current) => current + 1)}
                            >
                                Continue
                                <ArrowRight className="size-4" />
                            </Button>
                        ) : (
                            <Button
                                className="rounded-full bg-brand-gradient font-semibold shadow-glow"
                                disabled={saving}
                                onClick={handleUpdateMedicine}
                            >
                                <Save className="size-4" />
                                {saving ? "Updating..." : "Update Medicine"}
                            </Button>
                        )}
                    </div>
                </Card>

                <Card className="h-fit gap-0 rounded-2xl border-border/70 p-6 shadow-soft">
                    <SectionHeading title="Live Preview" description="Preview updates while editing." />

                    <div className="mt-5 rounded-2xl border border-border/70 bg-muted/40 p-5">
                        <div className="grid grid-cols-[auto_minmax(0,1fr)] items-center gap-3">
                            <span className="grid size-12 place-items-center rounded-2xl bg-primary-soft text-primary">
                                <Pill className="size-6" />
                            </span>

                            <div>
                                <p className="text-base font-bold">{form.name || "Medicine Name"}</p>
                                <p className="text-xs text-muted-foreground">{form.generic || "Generic Name"}</p>
                            </div>
                        </div>

                        <dl className="mt-4 grid grid-cols-2 gap-3 text-sm">
                            <div>
                                <dt className="text-xs text-muted-foreground">Dosage</dt>
                                <dd className="font-semibold">
                                    {form.dosage ? `${form.dosage} ${form.strengthUnit}` : "—"}
                                </dd>
                            </div>

                            <div>
                                <dt className="text-xs text-muted-foreground">Form</dt>
                                <dd className="font-semibold">{form.form}</dd>
                            </div>

                            <div>
                                <dt className="text-xs text-muted-foreground">Frequency</dt>
                                <dd className="font-semibold">{form.frequency}</dd>
                            </div>

                            <div>
                                <dt className="text-xs text-muted-foreground">Reminder</dt>
                                <dd className="font-semibold">{form.times}</dd>
                            </div>

                            <div>
                                <dt className="text-xs text-muted-foreground">Instruction</dt>
                                <dd className="font-semibold">{form.instruction}</dd>
                            </div>

                            <div>
                                <dt className="text-xs text-muted-foreground">Quantity</dt>
                                <dd className="font-semibold">{form.quantity} units</dd>
                            </div>
                        </dl>
                    </div>

                    {duplicate && (
                        <p className="mt-4 rounded-xl bg-warning/10 p-3 text-xs font-medium text-warning">
                            Live validation: a medicine named {duplicate.name} already exists.
                        </p>
                    )}
                </Card>
            </div>
        </div>
    );
}

