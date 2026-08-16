import { createFileRoute } from '@tanstack/react-router'

import {
  Bell,
  CheckCircle2,
  Clock3,
  RefreshCw,
} from "lucide-react";

import {
  useEffect,
  useState,
} from "react";

import {
  AxiosError,
} from "axios";

import {
  toast,
} from "sonner";

import api from "@/services/api";

import {
  SectionHeading,
} from "@/components/portal/stat-card";

import {
  Button,
} from "@/components/ui/button";

import {
  Card,
} from "@/components/ui/card";


type Notification = {
  id: number;
  title: string;
  message: string;
  notification_type: string;
  channel: string;
  is_read: boolean;
  created_at: string;
};


export const Route = createFileRoute(
  "/admin/notifications"
)({
  head: () => ({
    meta: [
      {
        title:
          "Admin Notifications — MediCare AI",
      },
      {
        name: "description",
        content:
          "View notifications for the MediCare AI administrator account.",
      },
    ],
  }),

  component:
    AdminNotificationsPage,
});


function AdminNotificationsPage() {

  const [
    notifications,
    setNotifications,
  ] = useState<Notification[]>([]);


  const [
    loading,
    setLoading,
  ] = useState(true);


  const [
    error,
    setError,
  ] = useState("");


  const loadNotifications =
    async () => {

      try {

        setLoading(true);
        setError("");

        const response =
          await api.get<Notification[]>(
            "/notifications/"
          );

        setNotifications(
          response.data
        );

      } catch (error) {

        console.error(
          "ADMIN NOTIFICATIONS ERROR:",
          error
        );

        const err =
          error as AxiosError<{
            detail?: string;
          }>;

        const message =
          err.response?.data?.detail ||
          "Unable to load notifications.";

        setError(message);

        toast.error(message);

      } finally {

        setLoading(false);
      }
    };


  useEffect(() => {

    loadNotifications();

  }, []);


  const markAsRead =
    async (
      notificationId: number
    ) => {

      try {

        await api.put(
          `/notifications/${notificationId}/read`
        );

        setNotifications(
          (current) =>
            current.map(
              (notification) =>
                notification.id === notificationId
                  ? {
                      ...notification,
                      is_read: true,
                    }
                  : notification
            )
        );

        toast.success(
          "Notification marked as read."
        );

      } catch (error) {

        console.error(error);

        toast.error(
          "Unable to update notification."
        );
      }
    };


  const markAllAsRead =
    async () => {

      try {

        await api.patch(
          "/notifications/read-all"
        );

        setNotifications(
          (current) =>
            current.map(
              (notification) => ({
                ...notification,
                is_read: true,
              })
            )
        );

        toast.success(
          "All notifications marked as read."
        );

      } catch (error) {

        console.error(error);

        toast.error(
          "Unable to mark all notifications as read."
        );
      }
    };


  const unreadCount =
    notifications.filter(
      (notification) =>
        !notification.is_read
    ).length;


  return (
    <div className="space-y-6">

      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">

        <SectionHeading
          title="Notifications"
          description="Notifications related to your administrator account."
        />

        {unreadCount > 0 && (
          <Button
            variant="outline"
            onClick={markAllAsRead}
            className="rounded-xl"
          >
            Mark all as read
          </Button>
        )}

      </div>


      {loading ? (

        <Card className="rounded-2xl border-border/70 p-10 shadow-soft">

          <div className="flex items-center justify-center gap-3">

            <RefreshCw className="size-5 animate-spin" />

            <span className="text-sm text-muted-foreground">
              Loading notifications...
            </span>

          </div>

        </Card>

      ) : error ? (

        <Card className="rounded-2xl border-destructive/30 p-8">

          <div className="text-center">

            <Bell className="mx-auto size-9 text-destructive" />

            <h2 className="mt-4 font-bold">
              Unable to load notifications
            </h2>

            <p className="mt-2 text-sm text-muted-foreground">
              {error}
            </p>

            <Button
              className="mt-5 rounded-xl"
              onClick={loadNotifications}
            >
              Try again
            </Button>

          </div>

        </Card>

      ) : notifications.length === 0 ? (

        <Card className="rounded-2xl border-border/70 p-10 text-center shadow-soft">

          <div className="mx-auto grid size-12 place-items-center rounded-full bg-primary/10 text-primary">

            <Bell className="size-6" />

          </div>

          <h2 className="mt-4 text-lg font-bold">
            No notifications
          </h2>

          <p className="mt-2 text-sm text-muted-foreground">
            You are all caught up.
          </p>

        </Card>

      ) : (

        <div className="space-y-3">

          {notifications.map(
            (notification) => (

              <Card
                key={notification.id}
                className={`rounded-2xl border-border/70 p-5 shadow-soft ${
                  notification.is_read
                    ? ""
                    : "border-primary/30 bg-primary/5"
                }`}
              >

                <div className="flex gap-4">

                  <div className="grid size-10 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary">

                    {notification.is_read ? (
                      <CheckCircle2 className="size-5" />
                    ) : (
                      <Bell className="size-5" />
                    )}

                  </div>


                  <div className="min-w-0 flex-1">

                    <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">

                      <div>

                        <h3 className="font-bold">
                          {notification.title}
                        </h3>

                        <p className="mt-1 text-sm text-muted-foreground">
                          {notification.message}
                        </p>

                      </div>


                      {!notification.is_read && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="shrink-0"
                          onClick={() =>
                            markAsRead(
                              notification.id
                            )
                          }
                        >
                          Mark as read
                        </Button>
                      )}

                    </div>


                    <div className="mt-3 flex flex-wrap items-center gap-3 text-[11px] text-muted-foreground">

                      <span>
                        {notification.notification_type}
                      </span>

                      <span>
                        {notification.channel}
                      </span>

                      <span className="flex items-center gap-1.5">

                        <Clock3 className="size-3.5" />

                        {new Date(
                          notification.created_at
                        ).toLocaleString(
                          "en-IN"
                        )}

                      </span>

                    </div>

                  </div>

                </div>

              </Card>
            )
          )}

        </div>

      )}

    </div>
  );
}