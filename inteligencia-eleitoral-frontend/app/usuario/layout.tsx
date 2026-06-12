import type { ReactNode } from "react";

import ProtectedRoute from "../components/auth/ProtectedRoute";
import ApoiadorShell from "../components/apoiador/ApoiadorShell";

type ApoiadorLayoutProps = {
  children: ReactNode;
};

export default function ApoiadorLayout({ children }: ApoiadorLayoutProps) {
  return (
    <ProtectedRoute papelPermitido="USUARIO">
      <ApoiadorShell>{children}</ApoiadorShell>
    </ProtectedRoute>
  );
}