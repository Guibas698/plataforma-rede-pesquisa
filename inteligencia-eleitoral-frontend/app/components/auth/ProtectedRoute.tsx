"use client";

import { useEffect, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";

import {
  obterRotaPorPapel,
  obterUsuarioSalvo,
  type PapelUsuario,
} from "../../lib/auth";

type ProtectedRouteProps = {
  children: ReactNode;
  papelPermitido: PapelUsuario | PapelUsuario[];
};

export default function ProtectedRoute({
  children,
  papelPermitido,
}: ProtectedRouteProps) {
  const router = useRouter();

  const [autorizado, setAutorizado] = useState(false);
  const [verificando, setVerificando] = useState(true);

  useEffect(() => {
    const usuario = obterUsuarioSalvo();

    if (!usuario) {
      router.replace("/login");
      return;
    }

    const papeisPermitidos = Array.isArray(papelPermitido)
      ? papelPermitido
      : [papelPermitido];

    if (!papeisPermitidos.includes(usuario.papel)) {
      router.replace(obterRotaPorPapel(usuario.papel));
      return;
    }

    setAutorizado(true);
    setVerificando(false);
  }, [papelPermitido, router]);

  if (verificando || !autorizado) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <p className="text-sm font-medium text-slate-500">Carregando...</p>
      </div>
    );
  }

  return <>{children}</>;
}