import { ReactNode } from "react";
import { Navigate } from "@tanstack/react-router";
import { useAuth } from "@/hooks/useAuth";

interface ProtectedRouteProps {
  children: ReactNode;
  allowedRole: "patient" | "caregiver" | "admin";
}

export default function ProtectedRoute({
  children,
  allowedRole,
}: ProtectedRouteProps) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <h2 className="text-lg font-semibold">Loading...</h2>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth/login" />;
  }

  if (user.role !== allowedRole) {
    return <Navigate to="/auth/login" />;
  }

  return <>{children}</>;
}