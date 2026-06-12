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
  LogOut,
  Network,
} from "lucide-react";

import { obterUsuarioSalvo, type PapelUsuario } from "../../lib/auth";

export default function CandidatoSidebar() {
  const pathname = usePathname();
  const [papel, setPapel] = useState<PapelUsuario | null>(null);

  useEffect(() => {
    setPapel(obterUsuarioSalvo()?.papel ?? null);
  }, []);

  const isAdm = papel === "ADM";

  const navLinks = [
    { href: "/adm", icon: LayoutDashboard, label: "Dashboard" },
    ...(isAdm
      ? [{ href: "/adm/mapa", icon: MapPinned, label: "Mapa" }]
      : []),
    { href: "/adm/usuarios", icon: UserCheck, label: "Usuários" },
    { href: "/adm/link", icon: Link2, label: "Meu link" },
    { href: "/adm/perfil", icon: UserRound, label: "Perfil" },
  ];

  return (
    <aside className="hidden md:flex flex-col w-64 bg-white border-r border-slate-200 shrink-0">
      <div className="h-16 flex items-center gap-3 px-6 border-b border-slate-100">
        <div className="p-1.5 bg-emerald-100 text-emerald-600 rounded-lg">
          <Network className="w-5 h-5" />
        </div>
        <span className="font-bold text-slate-900 tracking-tight">
          Rede Pesquisa
        </span>
      </div>

      <nav className="flex-1 px-4 py-6 space-y-1.5 overflow-y-auto">
        {navLinks.map((link) => {
          const Icon = link.icon;
          const isActive =
            pathname === link.href ||
            (pathname.startsWith(link.href) && link.href !== "/adm");

          return (
            <Link
              key={link.href}
              href={link.href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg font-medium transition-colors ${
                isActive
                  ? "bg-emerald-600 text-white shadow-sm"
                  : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
              }`}
            >
              <Icon className="w-5 h-5" />
              {link.label}
            </Link>
          );
        })}
      </nav>

      <div className="p-4 border-t border-slate-100">
        <Link
          href="/login"
          className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-slate-600 hover:bg-red-50 hover:text-red-600 transition-colors"
        >
          <LogOut className="w-5 h-5" />
          <span className="font-medium">Sair da conta</span>
        </Link>
      </div>
    </aside>
  );
}