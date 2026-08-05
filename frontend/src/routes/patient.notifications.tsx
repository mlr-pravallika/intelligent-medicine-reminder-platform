import { useEffect, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import {
  Bell,
  CheckCheck,
  Mail,
  MessageSquare,
  Siren,
  Smartphone,
} from "lucide-react";
import { toast } from "sonner";

import {
  EmptyState,
  SectionHeading,
} from "@/components/portal/stat-card";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";

import {
  getNotifications,
  markNotificationRead,
  markAllRead,
} from "@/services/notificationService";

import { cn } from "@/lib/utils";

export const Route = createFileRoute("/patient/notifications")({
  component: NotificationsPage,
});

interface NotificationItem {
  id: number;
  title: string;
  message: string;
  notification_type: string;
  channel: string;
  is_read: boolean;
  created_at: string;

  read: boolean;
  time: string;
}

const channelIcon = {
  Push: Smartphone,
  SMS: MessageSquare,
  Email: Mail,
};

function NotificationsPage() {
  const [items, setItems] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    loadNotifications();
  }, []);

  const loadNotifications = async () => {
    try {
      const data = await getNotifications();

      const formatted = data.map((n: any) => ({
        ...n,
        read: n.is_read,
        time: new Date(n.created_at).toLocaleString(),
      }));

      setItems(formatted);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const unread = items.filter((n) => !n.is_read);

  const read = items.filter((n) => n.is_read);

  const markSingleRead = async (id: number) => {
    try {
      setProcessing(true);

      await markNotificationRead(id);

      await loadNotifications();

      toast.success("Notification marked as read");

    } catch (err) {

      console.error(err);

      toast.error("Unable to update notification");

    } finally {

      setProcessing(false);

    }
  };

  if (loading) {
    return (
      <div className="p-10 text-center font-semibold">
        Loading Notifications...
      </div>
    );
  }

  const List = ({ data }: { data: NotificationItem[] }) =>
    data.length === 0 ? (
      <EmptyState
        icon={<Bell className="size-6" />}
        title="Nothing here"
        description="You're all caught up."
      />
    ) : (
      <ul className="space-y-3">
        {data.map((n) => {
          const Icon =
            channelIcon[
              n.channel as keyof typeof channelIcon
            ] || Bell;

          return (
            <li
              key={n.id}
              onClick={() => {
                if (!n.is_read) {
                  markSingleRead(n.id);
                }
              }}
              className={cn(
                "cursor-pointer grid grid-cols-[auto_minmax(0,1fr)_auto] items-start gap-3 rounded-2xl border p-4",
                n.is_read
                  ? "border-border/70 bg-card"
                  : "border-primary/30 bg-primary-soft/50"
              )}
            >
              <span
                className={cn(
                  "grid size-10 place-items-center rounded-xl",
                  n.notification_type === "Emergency"
                    ? "bg-destructive/10 text-destructive"
                    : "bg-primary-soft text-primary"
                )}
              >
                {n.notification_type === "Emergency" ? (
                  <Siren className="size-5" />
                ) : (
                  <Icon className="size-5" />
                )}
              </span>

              <div>
                <p className="font-semibold">
                  {n.title}
                </p>

                <p className="text-sm text-muted-foreground">
                  {n.message}
                </p>

                <div className="mt-2 flex gap-2">
                  <span className="rounded-full bg-muted px-2 py-1 text-xs">
                    {n.notification_type}
                  </span>

                  <span className="rounded-full bg-muted px-2 py-1 text-xs">
                    {n.channel}
                  </span>
                </div>
              </div>

              <span className="text-xs text-muted-foreground">
                {n.time}
              </span>
            </li>
          );
        })}
      </ul>
    );

  return (
    <div className="space-y-6">
      <SectionHeading
        title="Notification Center"
        description={`${unread.length} unread of ${items.length} notifications`}
        action={
          <Button
              variant="outline"
              className="rounded-full"
              disabled={processing}
              onClick={async () => {
                try {

                  setProcessing(true);

                  await markAllRead();

                  await loadNotifications();

                  toast.success("All notifications marked as read");

                } catch {

                  toast.error("Unable to update notifications");

                } finally {

                  setProcessing(false);

                }
              }}
            >
              <CheckCheck className="size-4" />
              {processing ? "Updating..." : "Mark All Read"}
            </Button>
        }
      />

      <Card className="rounded-2xl p-6">
        <Tabs defaultValue="unread">
          <TabsList>
            <TabsTrigger value="unread">
              Unread ({unread.length})
            </TabsTrigger>

            <TabsTrigger value="read">
              Read ({read.length})
            </TabsTrigger>

            <TabsTrigger value="all">
              History
            </TabsTrigger>
          </TabsList>

          <TabsContent value="unread">
            <List data={unread} />
          </TabsContent>

          <TabsContent value="read">
            <List data={read} />
          </TabsContent>

          <TabsContent value="all">
            <List data={items} />
          </TabsContent>
        </Tabs>
      </Card>
    </div>
  );
}