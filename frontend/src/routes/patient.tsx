import { createFileRoute } from "@tanstack/react-router";
import { PortalLayout } from "@/components/portal/portal-layout";
import ProtectedRoute from "@/components/auth/ProtectedRoute";

export const Route = createFileRoute("/patient")({
  head: () => ({
    meta: [
      {
        title: "Patient Portal — MediCare AI",
      },
      {
        name: "description",
        content:
          "Your medication workspace: doses, reminders, analytics and AI insights.",
      },
    ],
  }),

  component: () => (
    <ProtectedRoute allowedRole="patient">
      <PortalLayout role="patient" />
    </ProtectedRoute>
  ),
});