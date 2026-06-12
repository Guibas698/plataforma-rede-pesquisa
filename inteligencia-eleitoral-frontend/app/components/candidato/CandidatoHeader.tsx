"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Menu, UserRound } from "lucide-react";
import type { CandidatoResumoLayout } from "./CandidatoShell";
import { obterUsuarioSalvo, type PapelUsuario } from "../../lib/auth";

interface CandidatoHeaderProps {
  onOpenMenu: () => void;
  candidato: CandidatoResumoLayout | null;
}

function obterNomeCandidato(candidato: CandidatoResumoLayout | null) {
  return (
    candidato?.nomePublico?.trim() ||
    candidato?.nomeCompleto?.trim() ||
    "Usuário"
  );
}

function obterInicial(nome: string) {
  return nome.trim().charAt(0).toUpperCase() || "U";
}

export default function CandidatoHeader({
  onOpenMenu,
  candidato,
}: CandidatoHeaderProps) {
  const [papel, setPapel] = useState<PapelUsuario | null>(null);

  useEffect(() => {
    setPapel(obterUsuarioSalvo()?.papel ?? null);
  }, []);

  const nomeCandidato = obterNomeCandidato(candidato);
  const isLider = papel === "LIDER";

  const tituloPainel = isLider ? "Painel do Líder" : "Painel do ADM";
  const descricaoPainel = isLider
    ? "Acompanhe sua subrede e compartilhe seu link de convite."
    : "Acompanhe seus usuários, mapa e link de convite.";

  return (
    <header className="z-10 shrink-0 border-b border-slate-200 bg-white shadow-sm">
      <div className="flex h-16 items-center justify-between px-4 sm:h-20 sm:px-6">
        <div className="flex items-center gap-4">
          <button
            type="button"
            onClick={onOpenMenu}
            className="-ml-2 rounded-lg p-2 text-slate-600 transition-colors hover:bg-slate-100 md:hidden"
            aria-label="Abrir menu"
          >
            <Menu className="h-6 w-6" />
          </button>

          <div>
            <h1 className="text-base font-bold leading-none tracking-tight text-slate-900 sm:text-lg">
              {tituloPainel}
            </h1>
            <p className="mt-1 hidden text-xs text-slate-500 sm:block sm:text-sm">
              {descricaoPainel}
            </p>
          </div>
        </div>

        <Link
          href="/adm/perfil"
          className="flex items-center gap-3 rounded-full px-2 py-1 transition-colors hover:bg-slate-100"
          aria-label={isLider ? "Ir para o perfil do líder" : "Ir para o perfil do ADM"}
        >
          <span className="hidden max-w-40 truncate text-sm font-medium text-slate-700 sm:block">
            {nomeCandidato}
          </span>

          {candidato?.fotoUrl ? (
            <img
              src={candidato.fotoUrl}
              alt={nomeCandidato}
              className="h-8 w-8 rounded-full border border-emerald-200 object-cover shadow-sm sm:h-10 sm:w-10"
            />
          ) : (
            <div className="flex h-8 w-8 items-center justify-center rounded-full border border-emerald-200 bg-emerald-100 text-sm font-bold text-emerald-700 shadow-sm sm:h-10 sm:w-10">
              {nomeCandidato !== "Usuário" ? (
                obterInicial(nomeCandidato)
              ) : (
                <UserRound className="h-4 w-4 sm:h-5 sm:w-5" />
              )}
            </div>
          )}
        </Link>
      </div>
    </header>
  );
}