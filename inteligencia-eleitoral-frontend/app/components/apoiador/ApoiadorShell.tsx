"use client";

import { useEffect, useState, type ReactNode } from "react";
import ApoiadorHeader from "./ApoiadorHeader";
import ApoiadorMobileMenu from "./ApoiadorMobileMenu";
import { apiFetch } from "../../lib/api";

export type ApoiadorResumoLayout = {
  nome: string;
  email?: string | null;
  fotoUrl?: string | null;
  origemCadastro?: string | null;
};

type ApoiadorShellProps = {
  children: ReactNode;
};

export default function ApoiadorShell({ children }: ApoiadorShellProps) {
  const [menuAberto, setMenuAberto] = useState(false);
  const [apoiador, setApoiador] = useState<ApoiadorResumoLayout | null>(null);

  useEffect(() => {
    let componenteAtivo = true;

    async function carregarApoiador() {
      try {
        const response = await apiFetch<ApoiadorResumoLayout>("/apoiador/me");

        if (componenteAtivo) {
          setApoiador(response);
        }
      } catch {
        if (componenteAtivo) {
          setApoiador(null);
        }
      }
    }

    carregarApoiador();

    return () => {
      componenteAtivo = false;
    };
  }, []);

  return (
    <div className="min-h-screen bg-slate-50 font-sans">
      <ApoiadorHeader
        onOpenMenu={() => setMenuAberto(true)}
        apoiador={apoiador}
      />

      <ApoiadorMobileMenu
        isOpen={menuAberto}
        onClose={() => setMenuAberto(false)}
        apoiador={apoiador}
      />

      <main className="mx-auto w-full max-w-5xl p-4 sm:p-6 lg:p-8">
        {children}
      </main>
    </div>
  );
}