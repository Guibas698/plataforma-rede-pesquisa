"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Home,
  LogOut,
  Menu,
  User,
  UserRound,
  Network,
} from "lucide-react";
import type { ApoiadorResumoLayout } from "./ApoiadorShell";

type ApoiadorHeaderProps = {
  onOpenMenu: () => void;
  apoiador: ApoiadorResumoLayout | null;
};

const links = [
  {
    label: "Início",
    href: "/usuario",
    icon: Home,
  },
  {
    label: "Meu perfil",
    href: "/usuario/perfil",
    icon: UserRound,
  },
];

function textoOuPadrao(valor?: string | null) {
  if (!valor || !valor.trim()) {
    return "Usuário";
  }

  return valor;
}

function inicialDoNome(nome?: string | null) {
  if (!nome || !nome.trim()) {
    return "U";
  }

  return nome.trim().charAt(0).toUpperCase();
}

export default function ApoiadorHeader({
  onOpenMenu,
  apoiador,
}: ApoiadorHeaderProps) {
  const pathname = usePathname();
  const router = useRouter();

  function handleSair() {
    router.push("/login");
  }

  function isActive(href: string) {
    if (href === "/usuario") {
      return pathname === "/usuario";
    }

    return pathname.startsWith(href);
  }

  return (
    <header className="sticky top-0 z-40 border-b border-slate-200 bg-white shadow-sm">
      <div className="mx-auto flex h-16 w-full max-w-5xl items-center justify-between px-4 sm:h-20 sm:px-6 lg:px-8">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-emerald-600 text-white shadow-sm">
            <Network className="h-5 w-5" />
          </div>

          <div>
            <h1 className="text-base font-bold leading-none tracking-tight text-slate-900 sm:text-lg">
              Rede Pesquisa
            </h1>
            <p className="mt-1 hidden text-xs font-medium text-slate-500 sm:block">
              Área do Usuário
            </p>
          </div>
        </div>

        <nav className="hidden items-center gap-2 md:flex">
          {links.map((link) => {
            const Icon = link.icon;
            const ativo = isActive(link.href);

            return (
              <Link
                key={link.href}
                href={link.href}
                className={`inline-flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium transition-colors ${
                  ativo
                    ? "bg-emerald-50 text-emerald-700"
                    : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                }`}
              >
                <Icon className="h-4 w-4" />
                {link.label}
              </Link>
            );
          })}
        </nav>

        <div className="hidden items-center gap-3 md:flex">
          <Link
            href="/usuario/perfil"
            className="flex items-center gap-3 rounded-full px-2 py-1 transition-colors hover:bg-slate-100"
            aria-label="Ir para meu perfil"
          >
            <span className="max-w-40 truncate text-sm font-medium text-slate-700">
              {textoOuPadrao(apoiador?.nome)}
            </span>

            {apoiador?.fotoUrl ? (
              <img
                src={apoiador.fotoUrl}
                alt={textoOuPadrao(apoiador.nome)}
                className="h-10 w-10 rounded-full border border-emerald-200 object-cover shadow-sm"
              />
            ) : (
              <div className="flex h-10 w-10 items-center justify-center rounded-full border border-emerald-200 bg-emerald-100 text-sm font-bold text-emerald-700 shadow-sm">
                {apoiador?.nome ? (
                  inicialDoNome(apoiador.nome)
                ) : (
                  <User className="h-5 w-5" />
                )}
              </div>
            )}
          </Link>

          <button
            type="button"
            onClick={handleSair}
            className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-50 hover:text-slate-900"
          >
            <LogOut className="h-4 w-4" />
            Sair
          </button>
        </div>

        <button
          type="button"
          onClick={onOpenMenu}
          className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-700 shadow-sm transition-colors hover:bg-slate-50 md:hidden"
          aria-label="Abrir menu do usuário"
        >
          <Menu className="h-5 w-5" />
        </button>
      </div>
    </header>
  );
}