"use client";

import { useState, type ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  UserCheck,
  FileText,
  Settings,
  LogOut,
  Menu,
  X,
} from "lucide-react";

import ProtectedRoute from "../components/auth/ProtectedRoute";
import { limparSessao } from "../lib/auth";

export default function AdminLayout({ children }: { children: ReactNode }) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const pathname = usePathname();

  const closeMenu = () => setIsMobileMenuOpen(false);

  const handleLogout = () => {
    limparSessao();
    closeMenu();
  };

  const navLinks = [
    { href: "/admin", icon: LayoutDashboard, label: "Dashboard" },
    { href: "/admin/candidatos", icon: Users, label: "ADMs" },
    { href: "/admin/apoiadores", icon: UserCheck, label: "Usuários" },
    { href: "/admin/relatorios", icon: FileText, label: "Relatórios" },
    { href: "/admin/configuracoes", icon: Settings, label: "Configurações" },
  ];

  return (
    <ProtectedRoute papelPermitido="MASTER">
      <div className="min-h-screen bg-slate-50 flex">
        {isMobileMenuOpen && (
          <div
            className="fixed inset-0 bg-slate-900/50 z-40 md:hidden transition-opacity"
            onClick={closeMenu}
          />
        )}

        <aside
          className={`
            fixed inset-y-0 left-0 z-50 w-64 bg-slate-900 text-slate-300 flex flex-col border-r border-slate-800 transition-transform duration-300 ease-in-out
            md:relative md:translate-x-0
            ${isMobileMenuOpen ? "translate-x-0" : "-translate-x-full"}
          `}
        >
          <div className="h-16 flex items-center justify-between px-6 border-b border-slate-800 shrink-0">
            <span className="font-bold text-white tracking-tight">
              Rede Pesquisa
            </span>

            <button
              onClick={closeMenu}
              className="md:hidden p-2 -mr-2 text-slate-400 hover:text-white rounded-lg transition-colors"
              type="button"
              aria-label="Fechar menu"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <nav className="flex-1 px-4 py-6 space-y-1.5 overflow-y-auto">
            {navLinks.map((link) => {
              const Icon = link.icon;

              const isActive =
                pathname === link.href ||
                (pathname.startsWith(link.href) && link.href !== "/admin");

              return (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={closeMenu}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-lg font-medium transition-colors ${
                    isActive
                      ? "bg-emerald-600/10 text-emerald-400"
                      : "hover:bg-slate-800 hover:text-white"
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  {link.label}
                </Link>
              );
            })}
          </nav>

          <div className="p-4 border-t border-slate-800 shrink-0">
            <Link
              href="/login"
              onClick={handleLogout}
              className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-red-500/10 hover:text-red-400 transition-colors"
            >
              <LogOut className="w-5 h-5" />
              Sair
            </Link>
          </div>
        </aside>

        <main className="flex-1 flex flex-col min-w-0 overflow-hidden h-screen">
          <header className="md:hidden h-16 bg-white border-b border-slate-200 flex items-center justify-between px-4 shadow-sm z-10 shrink-0">
            <span className="font-bold text-slate-900">Rede Pesquisa</span>

            <button
              onClick={() => setIsMobileMenuOpen(true)}
              className="p-2 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
              type="button"
              aria-label="Abrir menu"
            >
              <Menu className="w-6 h-6" />
            </button>
          </header>

          <div className="flex-1 overflow-auto">{children}</div>
        </main>
      </div>
    </ProtectedRoute>
  );
}