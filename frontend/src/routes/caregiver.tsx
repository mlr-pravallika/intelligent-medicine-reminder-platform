import { createFileRoute } from "@tanstack/react-router";
import { PortalLayout } from "@/components/portal/portal-layout";
import ProtectedRoute from "@/components/auth/ProtectedRoute";

export const Route = createFileRoute("/caregiver")({
  head: () => ({
    meta: [
      {
        title: "Caregiver Portal — MediCare AI",
      },
      {
        name: "description",
        content:
          "Monitor assigned patients, critical alerts and adherence reports.",
      },
    ],
  }),

  component: () => (
    <ProtectedRoute allowedRole="caregiver">
      <PortalLayout role="caregiver" />
    </ProtectedRoute>
  ),
});