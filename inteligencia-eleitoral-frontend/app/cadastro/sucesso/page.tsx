"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  ArrowRight,
  CheckCircle2,
  Home,
  ShieldCheck,
  UserCheck,
} from "lucide-react";

type ResumoCadastro = {
  status: string;
  consentimento: string;
  tipo: string;
};

const resumoCadastro: ResumoCadastro = {
  status: "Cadastro registrado",
  consentimento: "Consentimento aceito",
  tipo: "Usuário cadastrado",
};

export default function CadastroSucessoPage() {
  const searchParams = useSearchParams();
  const candidato = searchParams.get("candidato");

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto flex w-full max-w-3xl flex-col gap-6">
        <header className="text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-600 text-white shadow-sm">
            <ShieldCheck className="h-7 w-7" />
          </div>

          <h1 className="mt-4 text-2xl font-bold tracking-tight text-slate-900">
            Rede Pesquisa
          </h1>

          <p className="mt-1 text-sm font-medium text-slate-500">
            Cadastro de usuário
          </p>
        </header>

        <section className="rounded-2xl border border-slate-200 bg-white p-6 text-center shadow-sm sm:p-8">
          <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
            <CheckCircle2 className="h-11 w-11" />
          </div>

          <h2 className="mt-5 text-2xl font-bold tracking-tight text-slate-900">
            Cadastro realizado com sucesso!
          </h2>

          <p className="mx-auto mt-3 max-w-xl text-sm leading-6 text-slate-500 sm:text-base">
            Seu cadastro foi registrado com sucesso e vinculado automaticamente
            à rede responsável por este convite.
          </p>

          <p className="mx-auto mt-2 max-w-xl text-sm leading-6 text-slate-500 sm:text-base">
            Você poderá acessar sua área pessoal utilizando as credenciais
            cadastradas.
          </p>
        </section>

        {candidato && (
          <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
            <div className="flex items-center gap-2">
              <UserCheck className="h-5 w-5 text-emerald-600" />
              <h3 className="font-bold text-slate-900">Rede vinculada</h3>
            </div>

            <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 p-4">
              <p className="text-xs font-medium text-slate-500">
                Seu cadastro foi vinculado à rede de
              </p>
              <p className="mt-1 text-base font-bold text-slate-900">
                {candidato}
              </p>
            </div>
          </section>
        )}

        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
          <div className="flex items-center gap-2">
            <UserCheck className="h-5 w-5 text-emerald-600" />
            <h3 className="font-bold text-slate-900">Resumo do cadastro</h3>
          </div>

          <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
            <ResumoItem label="Status" value={resumoCadastro.status} />
            <ResumoItem
              label="Consentimento"
              value={resumoCadastro.consentimento}
            />
            <ResumoItem label="Tipo" value={resumoCadastro.tipo} />
          </div>
        </section>

        <section className="flex items-start gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-slate-400" />

          <p className="text-sm leading-6 text-slate-500">
            Os dados informados serão utilizados apenas para os fins autorizados
            durante o cadastro e conforme a política de privacidade.
          </p>
        </section>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <Link
            href="/login"
            className="inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-emerald-600 px-5 text-sm font-bold text-white shadow-sm transition hover:bg-emerald-700"
          >
            Ir para login
            <ArrowRight className="h-5 w-5" />
          </Link>

          <Link
            href="/"
            className="inline-flex h-12 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-5 text-sm font-bold text-slate-700 shadow-sm transition hover:bg-slate-50"
          >
            <Home className="h-5 w-5" />
            Voltar ao início
          </Link>
        </div>
      </div>
    </main>
  );
}

type ResumoItemProps = {
  label: string;
  value: string;
};

function ResumoItem({ label, value }: ResumoItemProps) {
  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
      <p className="text-xs font-medium text-slate-500">{label}</p>
      <p className="mt-1 text-sm font-bold text-slate-900">{value}</p>
    </div>
  );
}