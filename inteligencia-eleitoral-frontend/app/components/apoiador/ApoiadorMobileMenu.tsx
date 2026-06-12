"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Home,
  LogOut,
  ShieldCheck,
  User,
  UserRound,
  Network,
  X,
} from "lucide-react";
import type { ApoiadorResumoLayout } from "./ApoiadorShell";

type ApoiadorMobileMenuProps = {
  isOpen: boolean;
  onClose: () => void;
  apoiador: ApoiadorResumoLayout | null;
};

const links = [
  {
    label: "Início",
    href: "/apoiador",
    icon: Home,
  },
  {
    label: "Meu perfil",
    href: "/apoiador/perfil",
    icon: UserRound,
  },
];

function textoOuPadrao(valor?: string | null) {
  if (!valor || !valor.trim()) {
    return "Não informado";
  }

  return valor;
}

function inicialDoNome(nome?: string | null) {
  if (!nome || !nome.trim()) {
    return "U";
  }

  return nome.trim().charAt(0).toUpperCase();
}

function formatarOrigem(origem?: string | null) {
  const valor = (origem || "").toUpperCase();

  if (valor === "LINK_CANDIDATO") {
    return "Usuário cadastrado por convite";
  }

  if (valor === "CADASTRO_MANUAL") {
    return "Cadastro manual";
  }

  return "Usuário";
}

export default function ApoiadorMobileMenu({
  isOpen,
  onClose,
  apoiador,
}: ApoiadorMobileMenuProps) {
  const pathname = usePathname();
  const router = useRouter();

  if (!isOpen) {
    return null;
  }

  function handleSair() {
    onClose();
    router.push("/login");
  }

  function isActive(href: string) {
    if (href === "/apoiador") {
      return pathname === "/apoiador";
    }

    return pathname.startsWith(href);
  }

  return (
    <div className="fixed inset-0 z-50 md:hidden">
      <button
        type="button"
        onClick={onClose}
        className="absolute inset-0 bg-slate-900/40"
        aria-label="Fechar menu"
      />

      <aside className="absolute right-0 top-0 flex h-full w-full max-w-xs flex-col border-l border-slate-200 bg-white shadow-xl">
        <div className="flex items-center justify-between border-b border-slate-100 p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-emerald-600 text-white shadow-sm">
              <Network className="h-5 w-5" />
            </div>

            <div>
              <h2 className="text-sm font-bold text-slate-900">
                Rede Pesquisa
              </h2>
              <p className="text-xs text-slate-500">Área do Usuário</p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="flex h-9 w-9 items-center justify-center rounded-xl text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-900"
            aria-label="Fechar menu"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="border-b border-slate-100 p-4">
          <div className="flex items-center gap-3 rounded-2xl bg-slate-50 p-3">
            {apoiador?.fotoUrl ? (
              <img
                src={apoiador.fotoUrl}
                alt={textoOuPadrao(apoiador.nome)}
                className="h-11 w-11 rounded-full border border-emerald-200 object-cover"
              />
            ) : (
              <div className="flex h-11 w-11 items-center justify-center rounded-full border border-emerald-200 bg-emerald-100 text-sm font-bold text-emerald-700">
                {apoiador?.nome ? (
                  inicialDoNome(apoiador.nome)
                ) : (
                  <User className="h-5 w-5" />
                )}
              </div>
            )}

            <div className="min-w-0">
              <p className="truncate text-sm font-bold text-slate-900">
                {apoiador?.nome ? textoOuPadrao(apoiador.nome) : "Usuário"}
              </p>
              <p className="truncate text-xs text-slate-500">
                {formatarOrigem(apoiador?.origemCadastro)}
              </p>
            </div>
          </div>
        </div>

        <nav className="flex-1 space-y-2 p-4">
          {links.map((link) => {
            const Icon = link.icon;
            const ativo = isActive(link.href);

            return (
              <Link
                key={link.href}
                href={link.href}
                onClick={onClose}
                className={`flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium transition-colors ${
                  ativo
                    ? "bg-emerald-50 text-emerald-700"
                    : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                }`}
              >
                <Icon className="h-5 w-5" />
                {link.label}
              </Link>
            );
          })}
        </nav>

        <div className="border-t border-slate-100 p-4">
          <button
            type="button"
            onClick={handleSair}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-slate-900 px-4 py-3 text-sm font-bold text-white transition-colors hover:bg-slate-800"
          >
            <LogOut className="h-5 w-5" />
            Sair
          </button>

          <div className="mt-4 flex items-start gap-2 rounded-xl bg-slate-50 p-3">
            <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" />
            <p className="text-xs leading-5 text-slate-500">
              Seus dados são usados apenas para organização interna da rede.
            </p>
          </div>
        </div>
      </aside>
    </div>
  );
}