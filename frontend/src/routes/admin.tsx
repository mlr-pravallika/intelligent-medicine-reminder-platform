import { createFileRoute } from "@tanstack/react-router";
import { PortalLayout } from "@/components/portal/portal-layout";
import ProtectedRoute from "@/components/auth/ProtectedRoute";

export const Route = createFileRoute("/admin")({
  head: () => ({
    meta: [
      {
        title: "Admin Console — MediCare AI",
      },
      {
        name: "description",
        content:
          "Enterprise administration: users, analytics, audit logs and system health.",
      },
    ],
  }),

  component: () => (
    <ProtectedRoute allowedRole="admin">
      <PortalLayout role="admin" />
    </ProtectedRoute>
  ),
});
