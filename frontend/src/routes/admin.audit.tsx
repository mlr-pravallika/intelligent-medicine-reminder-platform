import {
  createFileRoute,
} from "@tanstack/react-router";

import {
  Activity,
  CheckCircle2,
  Clock3,
  RefreshCw,
  XCircle,
} from "lucide-react";

import {
  useEffect,
  useState,
} from "react";

import api from "@/services/api";

import {
  SectionHeading,
} from "@/components/portal/stat-card";

import {
  Card,
} from "@/components/ui/card";


type ActivityItem = {
  type: string;
  id: number;
  medicine_name: string;
  status: string;
  dosage: string;
  reminder_time: string;
  sent_at: string;
  user_id: number;
};


export const Route =
  createFileRoute(
    "/admin/audit"
  )({
    head: () => ({
      meta: [
        {
          title:
            "Activity Logs — MediCare AI",
        },
      ],
    }),

    component:
      AdminAudit,
  });


function AdminAudit() {

  const [
    activity,
    setActivity,
  ] = useState<ActivityItem[]>(
    []
  );

  const [
    loading,
    setLoading,
  ] = useState(true);


  useEffect(() => {

    const load =
      async () => {

        try {

          const response =
            await api.get<ActivityItem[]>(
              "/admin/activity"
            );

          setActivity(
            response.data
          );

        } finally {

          setLoading(false);
        }
      };


    load();

  }, []);


  return (
    <div className="space-y-6">

      <SectionHeading
        title="Activity Logs"
        description="Recent real medication activity recorded by MediCare AI."
      />


      {loading ? (

        <Card className="p-10">

          <div className="flex items-center justify-center gap-3">

            <RefreshCw className="size-5 animate-spin" />

            Loading activity...

          </div>

        </Card>

      ) : activity.length === 0 ? (

        <Card className="p-10 text-center">

          <Activity className="mx-auto size-9 text-muted-foreground" />

          <h3 className="mt-4 font-bold">
            No activity recorded
          </h3>

          <p className="mt-2 text-sm text-muted-foreground">
            Reminder activity will appear here once patients
            start recording medication events.
          </p>

        </Card>

      ) : (

        <Card className="overflow-x-auto rounded-2xl border-border/70 p-0 shadow-soft">

          <div className="min-w-[800px]">

            <div className="grid grid-cols-[1.5fr_1.5fr_1fr_1fr_1.5fr] border-b border-border px-5 py-4 text-xs font-bold uppercase tracking-wide text-muted-foreground">

              <span>Medicine</span>
              <span>Dosage</span>
              <span>Status</span>
              <span>User</span>
              <span>Time</span>

            </div>


            {activity.map(
              (item) => {

                const taken =
                  item.status
                    .toLowerCase() ===
                  "taken";


                return (
                  <div
                    key={item.id}
                    className="grid grid-cols-[1.5fr_1.5fr_1fr_1fr_1.5fr] items-center border-b border-border/60 px-5 py-4 last:border-b-0"
                  >

                    <div>

                      <p className="text-sm font-bold">
                        {item.medicine_name}
                      </p>

                      <p className="text-[11px] text-muted-foreground">
                        Reminder {item.reminder_time}
                      </p>

                    </div>


                    <p className="text-sm text-muted-foreground">
                      {item.dosage}
                    </p>


                    <span
                      className={
                        `flex w-fit items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-bold ${
                          taken
                            ? "bg-emerald-500/10 text-emerald-500"
                            : "bg-red-500/10 text-red-500"
                        }`
                      }
                    >

                      {taken ? (
                        <CheckCircle2 className="size-3.5" />
                      ) : (
                        <XCircle className="size-3.5" />
                      )}

                      {item.status}

                    </span>


                    <p className="text-xs text-muted-foreground">
                      #{item.user_id}
                    </p>


                    <p className="flex items-center gap-1.5 text-xs text-muted-foreground">

                      <Clock3 className="size-3.5" />

                      {new Date(
                        item.sent_at
                      ).toLocaleString(
                        "en-IN"
                      )}

                    </p>

                  </div>
                );
              }
            )}

          </div>

        </Card>

      )}

    </div>
  );
}