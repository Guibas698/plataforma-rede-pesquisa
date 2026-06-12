import type { ReactNode } from "react";

import ProtectedRoute from "../components/auth/ProtectedRoute";
import CandidatoShell from "../components/candidato/CandidatoShell";

export default function CandidatoLayout({ children }: { children: ReactNode }) {
  return (
    <ProtectedRoute papelPermitido={["ADM", "LIDER"]}>
      <CandidatoShell>{children}</CandidatoShell>
    </ProtectedRoute>
  );
}