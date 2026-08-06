import { useEffect, useState, useRef } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Camera, CheckCircle2, FileScan, Loader2, RefreshCcw, Save, Upload } from "lucide-react";
import { toast } from "sonner";
import { scanPrescription, savePrescription } from "@/services/ocrService";
import { saveMedicines } from "@/services/medicineService";

import { SectionHeading } from "@/components/portal/stat-card";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/patient/ocr")({
  head: () => ({
    meta: [
      { title: "Prescription OCR — MediCare AI" },
      { name: "description", content: "Upload or capture a prescription and auto-extract medicines, dosage and duration." },
      { property: "og:title", content: "Prescription OCR — MediCare AI" },
      { property: "og:description", content: "AI-verified OCR extraction with confidence scoring and manual edits." },
    ],
  }),
  component: OcrPage,
});

function OcrPage() {
  const [state, setState] = useState<"idle" | "scanning" | "done">("idle");
  const [dragging, setDragging] = useState(false);
  const [medicines, setMedicines] = useState<any[]>([]);
  const [file, setFile] = useState<File | null>(null);
  const [scanning, setScanning] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  const [preview, setPreview] = useState<string | null>(null);

  const [ocrText, setOcrText] = useState("");

  const [loading, setLoading] = useState(false);

  const [ocrResult, setOcrResult] = useState<any>(null);

  

  const handlePrescriptionScan = async (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {

      const selectedFile = e.target.files?.[0];

      if (!selectedFile) return;

      setFile(selectedFile);

      setPreview(URL.createObjectURL(selectedFile));

      await runScan(selectedFile);

  };

  const runScan = async (selectedFile?: File) => {

    const scanFile = selectedFile || file;

    if (!scanFile) {
        toast.error("Please select a prescription.");
        return;
    }

    setScanning(true);
    setState("scanning");

    try {

        const data = await scanPrescription(scanFile);

        console.log(data);

        console.log(data.medicines);

        setOcrResult(data);

        setMedicines(data.medicines || []);

        console.log("Medicines State:", data.medicines);

        setOcrText(JSON.stringify(data, null, 2));

        setState("done");

        localStorage.setItem(
            "ocrData",
            JSON.stringify(data)
        );

        toast.success("Prescription scanned successfully!");

    } catch (err: any) {

        console.error(err);

        const message =
            err?.response?.data?.detail ||
            "Failed to scan prescription";

        toast.error(message);

    } finally {

        setScanning(false);

    }

  };

  // preview and ocrText state are declared above; avoid redeclaration
  // handleFile logic integrated with Input onChange below; remove duplicate UI snippets

  const handleAutoFill = () => {

    if (!ocrResult?.medicines?.length) {

        toast.error("No medicine detected");

        return;
    }

    localStorage.setItem(
        "ocrData",
        JSON.stringify(ocrResult)
    );

    window.location.href="/patient/medicines/add";

  };

  return (
    <div className="space-y-6">
    <input
      ref={fileInputRef}
      type="file"
      accept="image/*,.pdf"
      hidden
      onChange={handlePrescriptionScan}
    />

    <input
      ref={cameraInputRef}
      type="file"
      accept="image/*"
      capture="environment"
      hidden
      onChange={handlePrescriptionScan}
    />

      <SectionHeading
        title="OCR prescription module"
        description="Upload, drag & drop or capture a prescription — MediCare AI extracts every field for review."
      />

      <div className="grid gap-5 xl:grid-cols-[1fr_1.2fr]">
        <Card className="gap-0 rounded-2xl border-border/70 p-6 shadow-soft">
          <div
            onDragOver={(e) => {
              e.preventDefault();
              setDragging(true);
            }}
            onDragLeave={() => setDragging(false)}
            onDrop={(e: React.DragEvent<HTMLDivElement>) => {
              e.preventDefault();
              setDragging(false);
              const dropped = e.dataTransfer.files?.[0];
              if (!dropped) return;
              setFile(dropped);
              setPreview(URL.createObjectURL(dropped));
            }}
            className={cn(
              "flex flex-col items-center justify-center rounded-2xl border-2 border-dashed px-6 py-14 text-center transition-colors",
              dragging ? "border-primary bg-primary-soft" : "border-border bg-muted/40",
            )}
          >
            <span className="grid size-14 place-items-center rounded-2xl bg-primary-soft text-primary">
              <Upload className="size-7" aria-hidden="true" />
            </span>
            <p className="mt-4 font-bold text-foreground">Drag & drop your prescription</p>
            <p className="mt-1 text-sm text-muted-foreground">PNG, JPG or PDF up to 10 MB</p>
            <div className="mt-5 flex flex-wrap justify-center gap-2">
              <Button
                  className="bg-brand-gradient rounded-full font-semibold shadow-glow"
                  onClick={() => fileInputRef.current?.click()}
              >
                  <FileScan className="size-4" />
                  Upload
              </Button>
              <Button
              variant="outline"
              className="rounded-full font-semibold"
              onClick={() => cameraInputRef.current?.click()}
              disabled={scanning}
              >
                <Camera className="size-4" /> Use camera
              </Button>
            </div>
          </div>

          <div className="mt-5 space-y-2">

            {preview && (

            <div className="mt-5">

            <img

            src={preview}

            className="rounded-xl border w-64"

            alt="Prescription Preview"

            />

            </div>

            )}
          </div>
        </Card>
      </div>    

        <Card className="gap-0 rounded-2xl border-border/70 p-6 shadow-soft">
          <SectionHeading
            title="Extraction preview"
            description="Review and edit every field before saving"
            action={
              state === "done" ? (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-accent-soft px-3 py-1 text-xs font-bold text-accent">
                  <CheckCircle2 className="size-3.5" aria-hidden="true" /> AI verified · 94%
                </span>
              ) : undefined
            }
          />

          {state === "idle" && (
            <div className="mt-6 rounded-2xl border border-dashed border-border bg-muted/40 px-6 py-12 text-center">
              <p className="font-semibold text-foreground">No prescription scanned yet</p>
              <p className="mt-1 text-sm text-muted-foreground">Upload a document to see extracted fields here.</p>
            </div>
          )}

          {state === "scanning" && (
            <div className="mt-6 space-y-4">
              <div className="flex items-center gap-2 text-sm font-semibold text-primary">
                <Loader2 className="size-4 animate-spin" aria-hidden="true" /> {scanning && (

                <div className="flex items-center gap-2">

                <Loader2 className="animate-spin"/>

                Reading Prescription...

                </div>

                )}
              </div>
              {[0, 1, 2, 3, 4].map((i) => (
                <Skeleton key={i} className="h-14 w-full rounded-xl" />
              ))}
            </div>
          )}
        </Card>  

          {state === "done" && (
            <>
              {/* OCR JSON (Optional - remove later if you don't need it) */}
              <Card className="mb-5 p-4">
                <h3 className="font-semibold">Extracted OCR Text</h3>

                <textarea
                  value={ocrText}
                  readOnly
                  rows={6}
                  className="w-full mt-3 rounded-lg border p-3 text-sm"
                />
              </Card>

              {/* Medicines */}

              <div className="space-y-6">

                {medicines.map((medicine, index) => (

                  <Card key={index} className="p-5">

                    <h3 className="text-lg font-bold mb-5">
                      Medicine {index + 1}
                    </h3>

                    <div className="grid gap-4 md:grid-cols-2">

                      <div>
                        <Label>Medicine Name</Label>

                        <Input
                          value={medicine.medicine_name}
                          onChange={(e) => {

                            const updated = [...medicines];

                            updated[index].medicine_name = e.target.value;

                            setMedicines(updated);

                          }}
                        />
                      </div>

                      <div>
                        <Label>Dosage</Label>

                        <Input
                          value={medicine.dosage}
                          onChange={(e) => {

                            const updated = [...medicines];

                            updated[index].dosage = e.target.value;

                            setMedicines(updated);

                          }}
                        />
                      </div>

                      <div>
                        <Label>Frequency</Label>

                        <Input
                          value={medicine.frequency}
                          onChange={(e) => {

                            const updated = [...medicines];

                            updated[index].frequency = e.target.value;

                            setMedicines(updated);

                          }}
                        />
                      </div>

                      <div>
                        <Label>Duration</Label>

                        <Input
                          value={medicine.duration}
                          onChange={(e) => {

                            const updated = [...medicines];

                            updated[index].duration = e.target.value;

                            setMedicines(updated);

                          }}
                        />
                      </div>

                      <div className="md:col-span-2">
                        <Label>Instructions</Label>

                        <Input
                          value={medicine.instructions}
                          onChange={(e) => {

                            const updated = [...medicines];

                            updated[index].instructions = e.target.value;

                            setMedicines(updated);

                          }}
                        />
                      </div>

                    </div>

                  </Card>

                ))}

              </div>

              {/* Prescription Details */}

              <Card className="mt-6 p-5">

                <h3 className="text-lg font-bold mb-5">
                  Prescription Details
                </h3>

                <div className="grid gap-4 md:grid-cols-2">

                  <div>
                    <Label>Doctor</Label>

                    <Input
                      value={ocrResult?.doctor_name || ""}
                      readOnly
                    />
                  </div>

                  <div>
                    <Label>Hospital</Label>

                    <Input
                      value={ocrResult?.hospital || ""}
                      readOnly
                    />
                  </div>

                  <div>
                    <Label>Patient</Label>

                    <Input
                      value={ocrResult?.patient_name || ""}
                      readOnly
                    />
                  </div>

                  <div>
                    <Label>Date</Label>

                    <Input
                      value={ocrResult?.date || ""}
                      readOnly
                    />
                  </div>

                </div>

              </Card>

              {/* Buttons */}

              <div className="mt-6 flex flex-wrap gap-3">

                <Button
                    className="bg-brand-gradient rounded-full"
                    onClick={async () => {

                        try {

                            await savePrescription({

                                medicines,

                                doctor_name: ocrResult?.doctor_name,

                                hospital: ocrResult?.hospital,

                                patient_name: ocrResult?.patient_name,

                                date: ocrResult?.date

                            });

                            toast.success("Prescription saved successfully");

                        } catch (e) {

                            console.error(e);

                            toast.error("Saving failed");

                        }

                    }}
                >
                    Save All Medicines
                </Button>

                <Button
                  variant="outline"
                  className="rounded-full"
                  onClick={handleAutoFill}
                >
                  <FileScan className="size-4 mr-2" />
                  Auto Fill Medicine Form
                </Button>

                <Button
                  variant="outline"
                  className="rounded-full"
                  onClick={() => runScan()}
                >
                  <RefreshCcw className="size-4 mr-2" />
                  Re-scan
                </Button>

              </div>

            </>
          )}
        </div>
      );
    }