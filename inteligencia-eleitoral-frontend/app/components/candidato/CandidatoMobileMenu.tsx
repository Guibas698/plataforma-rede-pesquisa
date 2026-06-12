"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  MapPinned,
  UserCheck,
  Link2,
  UserRound,
  X,
  Network,
} from "lucide-react";

import { obterUsuarioSalvo, type PapelUsuario } from "../../lib/auth";

interface CandidatoMobileMenuProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function CandidatoMobileMenu({
  isOpen,
  onClose,
}: CandidatoMobileMenuProps) {
  const pathname = usePathname();
  const [papel, setPapel] = useState<PapelUsuario | null>(null);

  useEffect(() => {
    setPapel(obterUsuarioSalvo()?.papel ?? null);
  }, []);

  const isAdm = papel === "ADM";

  const navLinks = [
    { href: "/candidato", icon: LayoutDashboard, label: "Dashboard" },
    ...(isAdm
      ? [{ href: "/candidato/mapa", icon: MapPinned, label: "Mapa" }]
      : []),
    { href: "/candidato/apoiadores", icon: UserCheck, label: "Usuários" },
    { href: "/candidato/link", icon: Link2, label: "Meu link" },
    { href: "/candidato/perfil", icon: UserRound, label: "Perfil" },
  ];

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 md:hidden">
      <button
        type="button"
        onClick={onClose}
        className="absolute inset-0 bg-slate-900/40"
        aria-label="Fechar menu"
      />

      <aside className="absolute left-0 top-0 flex h-full w-72 flex-col bg-white shadow-xl">
        <div className="flex h-16 items-center justify-between border-b border-slate-100 px-5">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-emerald-100 p-1.5 text-emerald-600">
              <Network className="h-5 w-5" />
            </div>

            <span className="font-bold tracking-tight text-slate-900">
              Rede Pesquisa
            </span>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-2 text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-900"
            aria-label="Fechar menu"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <nav className="flex-1 space-y-1.5 overflow-y-auto px-4 py-6">
          {navLinks.map((link) => {
            const Icon = link.icon;
            const isActive =
              pathname === link.href ||
              (pathname.startsWith(link.href) && link.href !== "/candidato");

            return (
              <Link
                key={link.href}
                href={link.href}
                onClick={onClose}
                className={`flex items-center gap-3 rounded-lg px-3 py-2.5 font-medium transition-colors ${
                  isActive
                    ? "bg-emerald-600 text-white shadow-sm"
                    : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                }`}
              >
                <Icon className="h-5 w-5" />
                {link.label}
              </Link>
            );
          })}
        </nav>
      </aside>
    </div>
  );
}