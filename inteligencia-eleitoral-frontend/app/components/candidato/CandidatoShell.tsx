"use client";

import { useEffect, useState, type ReactNode } from "react";
import CandidatoSidebar from "./CandidatoSidebar";
import CandidatoHeader from "./CandidatoHeader";
import CandidatoMobileMenu from "./CandidatoMobileMenu";
import { apiFetch } from "../../lib/api";

export type CandidatoResumoLayout = {
  nomeCompleto?: string | null;
  nomePublico?: string | null;
  email?: string | null;
  fotoUrl?: string | null;
};

interface CandidatoShellProps {
  children: ReactNode;
}

export default function CandidatoShell({ children }: CandidatoShellProps) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [candidato, setCandidato] = useState<CandidatoResumoLayout | null>(
    null
  );

  useEffect(() => {
    let componenteAtivo = true;

    async function carregarCandidato() {
      try {
        const response = await apiFetch<CandidatoResumoLayout>(
          "/candidato/perfil"
        );

        if (componenteAtivo) {
          setCandidato(response);
        }
      } catch {
        if (componenteAtivo) {
          setCandidato(null);
        }
      }
    }

    carregarCandidato();

    return () => {
      componenteAtivo = false;
    };
  }, []);

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50 font-sans">
      <CandidatoSidebar />

      <CandidatoMobileMenu
        isOpen={isMobileMenuOpen}
        onClose={() => setIsMobileMenuOpen(false)}
      />

      <div className="flex min-w-0 flex-1 flex-col">
        <CandidatoHeader
          onOpenMenu={() => setIsMobileMenuOpen(true)}
          candidato={candidato}
        />

        <main className="relative flex-1 overflow-auto">{children}</main>
      </div>
    </div>
  );
}