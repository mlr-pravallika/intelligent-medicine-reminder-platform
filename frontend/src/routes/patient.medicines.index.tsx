import { useEffect, useMemo, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import {
  Pill,
  Plus,
  Search,
  CalendarClock,
} from "lucide-react";
import { toast } from "sonner";
import { Trash2, Pencil, Power } from "lucide-react";

import {
  getMedicines,
  deleteMedicine,
  toggleMedicine,
}  from "@/services/medicineService";
import type { Medicine } from "@/types/medicine";

import {
  EmptyState,
  SectionHeading,
} from "@/components/portal/stat-card";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Tabs,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

export const Route = createFileRoute("/patient/medicines/")({
  component: MedicinesPage,
});

function MedicinesPage() {
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);
  const [updating, setUpdating] = useState(false);

  const [medicines, setMedicines] =
    useState<Medicine[]>([]);

  const [selected, setSelected] =
    useState<Medicine | null>(null);

  const [query, setQuery] = useState("");

  const [status, setStatus] =
    useState("All");

  const loadMedicines = async () => {
    try {
      const data = await getMedicines();
      setMedicines(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

const handleDelete = async (id: number) => {
  try {

    setDeleting(true);

    await deleteMedicine(id);

    toast.success("Medicine deleted successfully");

    await loadMedicines();

    setSelected(null);

  } catch {

    toast.error("Delete failed");

  } finally {

    setDeleting(false);

  }
};

const handleToggle = async (id: number) => {
  try {
    await toggleMedicine(id);

    toast.success("Medicine status updated.");

    await loadMedicines();

    if (selected?.id === id) {
      const updated = await getMedicines();

      const medicine = updated.find((m) => m.id === id);

      if (medicine) {
        setSelected(medicine);
      }
    }
  } catch (err) {
    console.error(err);

    toast.error("Unable to update status.");
  }
};

useEffect(() => {
  loadMedicines();
}, []);

  const filtered = useMemo(() => {
    return medicines.filter((medicine) => {
      const matchesSearch =
        medicine.medicine_name
          .toLowerCase()
          .includes(query.toLowerCase());

      const matchesStatus =
        status === "All"
          ? true
          : status === "Active"
          ? medicine.is_active
          : !medicine.is_active;

      return matchesSearch && matchesStatus;
    });
  }, [medicines, query, status]);

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <h2 className="text-lg font-semibold">
          Loading medicines...
        </h2>
      </div>
    );
  }

  return (
    <div className="space-y-6">

      <SectionHeading
        title="My Medicines"
        description="Manage all your medicines."
        action={
          <Button
            asChild
            className="rounded-full"
          >
            <Link to="/patient/medicines/add">
              <Plus className="mr-2 h-4 w-4" />
              Add Medicine
            </Link>
          </Button>
        }
      />

      <Card className="p-4">

        <div className="flex flex-col gap-3 lg:flex-row">

          <div className="relative flex-1">

            <Search className="absolute left-3 top-3 h-4 w-4 text-gray-500" />

            <Input
              placeholder="Search medicine..."
              value={query}
              onChange={(e) =>
                setQuery(e.target.value)
              }
              className="pl-10"
            />

          </div>

          <Tabs
            value={status}
            onValueChange={setStatus}
          >
            <TabsList>

              <TabsTrigger value="All">
                All
              </TabsTrigger>

              <TabsTrigger value="Active">
                Active
              </TabsTrigger>

              <TabsTrigger value="Inactive">
                Inactive
              </TabsTrigger>

            </TabsList>
          </Tabs>

        </div>

      </Card>
            {filtered.length === 0 ? (

        <EmptyState
          icon={<Pill className="size-6" />}
          title="No Medicines Found"
          description="Add your first medicine or change the search."
          action={
            <Button asChild>
              <Link to ="/patient/medicines/add">
                <Plus className="mr-2 h-4 w-4" />
                Add Medicine
              </Link>
            </Button>
          }
        />

      ) : (

        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">

          {filtered.map((medicine) => (

            <Card
              key={medicine.id}
              className="rounded-2xl p-5"
            >

              <div className="flex items-start justify-between">

                <div className="flex items-center gap-3">

                  <div className="rounded-xl bg-primary/10 p-3">
                    <Pill className="h-6 w-6 text-primary" />
                  </div>

                  <div>

                    <h3 className="font-bold text-lg">
                      {medicine.medicine_name}
                    </h3>

                    <p className="text-sm text-muted-foreground">
                      {medicine.dosage}
                    </p>

                  </div>

                </div>

                <span
                  className={`rounded-full px-3 py-1 text-xs font-semibold ${
                    medicine.is_active
                      ? "bg-green-100 text-green-700"
                      : "bg-red-100 text-red-700"
                  }`}
                >
                  {medicine.is_active
                    ? "Active"
                    : "Inactive"}
                </span>

              </div>

              <div className="mt-5 space-y-3">

                <div className="flex justify-between">

                  <span className="text-muted-foreground">
                    Frequency
                  </span>

                  <span className="font-semibold">
                    {medicine.frequency}
                  </span>

                </div>

                <div className="flex justify-between">

                  <span className="text-muted-foreground">
                    Reminder
                  </span>

                  <span className="font-semibold">
                    {medicine.reminder_time}
                  </span>

                </div>

                <div className="flex justify-between">

                  <span className="text-muted-foreground">
                    Start
                  </span>

                  <span className="font-semibold">
                    {medicine.start_date}
                  </span>

                </div>

                <div className="flex justify-between">

                  <span className="text-muted-foreground">
                    End
                  </span>

                  <span className="font-semibold">
                    {medicine.end_date}
                  </span>

                </div>

              </div>

              <Button
                className="mt-6 w-full"
                variant="outline"
                onClick={() => setSelected(medicine)}
              >
                View Details
              </Button>

            </Card>

          ))}

        </div>

      )}

      <Dialog
        open={!!selected}
        onOpenChange={(open) => {
          if (!open) {
            setSelected(null);
          }
        }}
      >

        <DialogContent className="max-w-lg">

          {selected && (

            <>

              <DialogHeader>

                <DialogTitle>

                  {selected.medicine_name}

                </DialogTitle>

                <DialogDescription>

                  Medicine Information

                </DialogDescription>

              </DialogHeader>

              <div className="space-y-4 mt-4">

                <div className="flex items-center gap-2">

                  <CalendarClock className="h-5 w-5 text-primary" />

                  <span className="font-semibold">

                    Reminder Time

                  </span>

                </div>

                <Card className="p-4">

                  <div className="space-y-3">
                                        <div className="flex justify-between">
                      <span className="text-muted-foreground">Dosage</span>
                      <span className="font-medium">
                        {selected.dosage}
                      </span>
                    </div>

                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Frequency</span>
                      <span className="font-medium">
                        {selected.frequency}
                      </span>
                    </div>

                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Reminder Time</span>
                      <span className="font-medium">
                        {selected.reminder_time}
                      </span>
                    </div>

                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Start Date</span>
                      <span className="font-medium">
                        {selected.start_date || "-"}
                      </span>
                    </div>

                    <div className="flex justify-between">
                      <span className="text-muted-foreground">End Date</span>
                      <span className="font-medium">
                        {selected.end_date || "-"}
                      </span>
                    </div>

                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Status</span>
                      <span
                        className={
                          selected.is_active
                            ? "text-green-600 font-semibold"
                            : "text-red-600 font-semibold"
                        }
                      >
                        {selected.is_active ? "Active" : "Inactive"}
                      </span>
                    </div>

                    {selected.instructions && (
                      <div>
                        <p className="text-muted-foreground mb-2">
                          Instructions
                        </p>

                        <p className="rounded-lg bg-muted p-3 text-sm">
                          {selected.instructions || "-"}
                        </p>
                      </div>
                    )}
                  </div>
                </Card>

                <div className="flex flex-wrap justify-end gap-3">

                  <Button
                  variant="destructive"
                  onClick={()=>{
                  if(confirm("Delete this medicine?")){
                  handleDelete(selected.id)
                  }
                  }}
                  >
                  Delete
                  </Button>

                  <Button
                    variant="secondary"
                    onClick={() => handleToggle(selected!.id)}
                  >
                    <Power className="mr-2 h-4 w-4" />

                    {selected?.is_active
                      ? "Deactivate"
                      : "Activate"}
                  </Button>

                  <Button
                    variant="outline"
                    onClick={() => setSelected(null)}
                  >
                    Close
                  </Button>

                  <Button asChild>

                    <Link
                      to="/patient/medicines/edit/$id"
                      params={{
                        id: selected!.id.toString(),
                      }}
                    >
                      <Pencil className="mr-2 h-4 w-4" />
                      Edit
                    </Link>

                  </Button>

                </div>

              </div>

            </>

          )}

        </DialogContent>

      </Dialog>

    </div>

  );

}