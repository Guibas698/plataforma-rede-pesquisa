"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import {
  AlertTriangle,
  ArrowRight,
  Briefcase,
  Building2,
  Hash,
  Home,
  Landmark,
  LockKeyhole,
  Mail,
  MapPin,
  MessageCircle,
  Phone,
  ShieldCheck,
  UserCheck,
} from "lucide-react";

import { apiFetch } from "../lib/api";

type ApoiadorMeResponse = {
  id: string;
  usuarioId?: string;
  nome: string;
  email?: string;
  telefone: string;
  fotoUrl?: string;
  municipio: string;
  bairro: string;
  zonaEleitoral: number;
  secaoEleitoral: number;
  observacao?: string;
  status: string;
  origemCadastro: string;
  consentimentoAceito: boolean;
  consentimentoData?: string;
  ativo: boolean;
  criadoEm: string;

  candidatoId: string;
  candidatoNomePublico: string;
  candidatoPartido?: string;
  candidatoNumeroUrna?: string;
  candidatoCargoPretendido: string;
  candidatoMunicipioBase: string;
};

type StatusCadastro = {
  label: string;
  value: string;
};

function textoOuPadrao(valor?: string | number | null): string {
  if (valor === null || valor === undefined || String(valor).trim() === "") {
    return "Não informado";
  }

  return String(valor);
}

function formatarData(data?: string | null): string {
  if (!data) {
    return "Não informado";
  }

  try {
    return new Intl.DateTimeFormat("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    }).format(new Date(data));
  } catch {
    return "Não informado";
  }
}

function formatarStatus(status?: string | null): string {
  const valor = (status || "").toUpperCase();

  if (valor === "ATIVO") {
    return "Cadastro ativo";
  }

  if (valor === "PENDENTE") {
    return "Cadastro pendente";
  }

  if (valor === "INATIVO") {
    return "Cadastro inativo";
  }

  return textoOuPadrao(status);
}

function formatarOrigem(origem?: string | null): string {
  const valor = (origem || "").toUpperCase();

  if (valor === "LINK_CANDIDATO") {
    return "Usuário cadastrado";
  }

  if (valor === "CADASTRO_MANUAL") {
    return "Cadastro manual";
  }

  return textoOuPadrao(origem);
}

function montarLinkWhatsApp(telefone: string) {
  const numeroLimpo = telefone.replace(/\D/g, "");

  if (!numeroLimpo) {
    return "#";
  }

  const numeroComPais = numeroLimpo.startsWith("55")
    ? numeroLimpo
    : `55${numeroLimpo}`;

  return `https://wa.me/${numeroComPais}`;
}

export default function ApoiadorHomePage() {
  const [apoiador, setApoiador] = useState<ApoiadorMeResponse | null>(null);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState("");

  useEffect(() => {
    let componenteAtivo = true;

    async function carregarApoiador() {
      setCarregando(true);
      setErro("");

      try {
        const response = await apiFetch<ApoiadorMeResponse>("/apoiador/me");

        if (!componenteAtivo) {
          return;
        }

        setApoiador(response);
      } catch (error) {
        if (!componenteAtivo) {
          return;
        }

        if (error instanceof Error) {
          setErro(error.message || "Não foi possível carregar seus dados.");
        } else {
          setErro("Não foi possível carregar seus dados.");
        }
      } finally {
        if (componenteAtivo) {
          setCarregando(false);
        }
      }
    }

    carregarApoiador();

    return () => {
      componenteAtivo = false;
    };
  }, []);

  const statusCadastro: StatusCadastro[] = useMemo(() => {
    if (!apoiador) {
      return [];
    }

    return [
      { label: "Status", value: formatarStatus(apoiador.status) },
      {
        label: "Consentimento",
        value: apoiador.consentimentoAceito ? "Aceito" : "Não aceito",
      },
      {
        label: "Data do cadastro",
        value: formatarData(apoiador.criadoEm),
      },
      {
        label: "Tipo",
        value: formatarOrigem(apoiador.origemCadastro),
      },
    ];
  }, [apoiador]);

  if (carregando) {
    return (
      <div className="space-y-6">
        <section className="rounded-2xl border border-slate-200 bg-white p-10 text-center shadow-sm">
          <div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-4 border-slate-100 border-t-emerald-500" />
          <h2 className="text-lg font-bold text-slate-900">
            Carregando seus dados...
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            Buscando as informações do seu cadastro de usuário.
          </p>
        </section>
      </div>
    );
  }

  if (erro || !apoiador) {
    return (
      <div className="space-y-6">
        <section className="rounded-2xl border border-red-100 bg-white p-8 text-center shadow-sm">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-red-50 text-red-600">
            <AlertTriangle className="h-7 w-7" />
          </div>

          <h2 className="mt-4 text-xl font-bold text-slate-900">
            Não foi possível carregar seus dados
          </h2>

          <p className="mx-auto mt-2 max-w-md text-sm text-slate-500">
            {erro || "Não foi possível carregar seus dados."}
          </p>
        </section>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
        <div className="max-w-2xl">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-100 bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-700">
            <UserCheck className="h-3.5 w-3.5" />
            Área do Usuário
          </span>

          <h1 className="mt-4 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
            Olá, {textoOuPadrao(apoiador.nome)}
          </h1>

          <p className="mt-2 text-sm leading-6 text-slate-500 sm:text-base">
            Confira seu cadastro de usuário e seus dados de vínculo.
          </p>
        </div>
      </section>

      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {statusCadastro.map((item) => (
          <div
            key={item.label}
            className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"
          >
            <p className="text-xs font-medium text-slate-500">{item.label}</p>

            <div className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-bold text-emerald-700">
              <ShieldCheck className="h-3.5 w-3.5" />
              {item.value}
            </div>
          </div>
        ))}
      </section>

      <section className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <p className="text-sm font-medium text-slate-500">
                Você está vinculado ao ADM:
              </p>

              <div className="mt-4 flex items-center gap-3">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-slate-900 text-white">
                  <UserCheck className="h-6 w-6" />
                </div>

                <div>
                  <h2 className="text-lg font-bold text-slate-900">
                    {textoOuPadrao(apoiador.candidatoNomePublico)}
                  </h2>
                  <p className="text-sm text-slate-500">
                    {textoOuPadrao(apoiador.candidatoCargoPretendido)}
                  </p>
                </div>
              </div>
            </div>

            <span className="inline-flex w-fit items-center gap-1.5 rounded-full border border-emerald-100 bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-700">
              <LockKeyhole className="h-3.5 w-3.5" />
              Vinculado pelo link
            </span>
          </div>

          <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2">
            <InfoItem
              label="Grupo/Organização"
              value={textoOuPadrao(apoiador.candidatoPartido)}
              icon={Building2}
            />
            <InfoItem
              label="Código identificador"
              value={textoOuPadrao(apoiador.candidatoNumeroUrna)}
              icon={Hash}
            />
            <InfoItem
              label="Função/Perfil"
              value={textoOuPadrao(apoiador.candidatoCargoPretendido)}
              icon={Briefcase}
            />
            <InfoItem
              label="Cidade base"
              value={textoOuPadrao(apoiador.candidatoMunicipioBase)}
              icon={MapPin}
            />
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
          <div className="flex items-center gap-2">
            <Landmark className="h-5 w-5 text-emerald-600" />
            <h2 className="font-bold text-slate-900">
              Dados de classificação
            </h2>
          </div>

          <p className="mt-1 text-sm text-slate-500">
            Informações usadas para organizar seu cadastro na plataforma.
          </p>

          <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2">
            <InfoItem
              label="Cidade"
              value={textoOuPadrao(apoiador.municipio)}
              icon={MapPin}
            />
            <InfoItem
              label="Bairro/localidade"
              value={textoOuPadrao(apoiador.bairro)}
              icon={Home}
            />
            <InfoItem
              label="Segmento"
              value={textoOuPadrao(apoiador.zonaEleitoral)}
              icon={Landmark}
            />
            <InfoItem
              label="Subsegmento"
              value={textoOuPadrao(apoiador.secaoEleitoral)}
              icon={Landmark}
            />
          </div>
        </div>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
        <div className="flex items-center gap-2">
          <UserCheck className="h-5 w-5 text-emerald-600" />
          <h2 className="font-bold text-slate-900">Dados de contato</h2>
        </div>

        <div className="mt-5 grid grid-cols-1 gap-3">
          <ContactRow
            label="Nome completo"
            value={textoOuPadrao(apoiador.nome)}
            icon={UserCheck}
          />

          <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
            <p className="flex items-center gap-1.5 text-xs font-medium text-slate-500">
              <Phone className="h-3.5 w-3.5 text-slate-400" />
              Telefone/WhatsApp
            </p>

            <div className="mt-1 flex items-center gap-2">
              <p className="text-sm font-bold text-slate-900">
                {textoOuPadrao(apoiador.telefone)}
              </p>

              {apoiador.telefone && (
                <a
                  href={montarLinkWhatsApp(apoiador.telefone)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex h-7 w-7 items-center justify-center rounded-lg text-emerald-600 transition-colors hover:bg-emerald-50 hover:text-emerald-700"
                  aria-label="Enviar mensagem no WhatsApp"
                >
                  <MessageCircle className="h-4 w-4" />
                </a>
              )}
            </div>
          </div>

          <ContactRow
            label="E-mail"
            value={textoOuPadrao(apoiador.email)}
            icon={Mail}
          />
        </div>
      </section>

      <section className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <Link
          href="/usuario/perfil"
          className="inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-emerald-600 px-5 text-sm font-bold text-white shadow-sm transition hover:bg-emerald-700"
        >
          Editar meu perfil
          <ArrowRight className="h-5 w-5" />
        </Link>

        <Link
          href="/login"
          className="inline-flex h-12 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-5 text-sm font-bold text-slate-700 shadow-sm transition hover:bg-slate-50"
        >
          <LockKeyhole className="h-5 w-5" />
          Ir para login
        </Link>
      </section>

      <section className="flex items-start gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-slate-400" />

        <p className="text-sm leading-6 text-slate-500">
          Seu cadastro representa uma participação voluntária na plataforma.
          Você pode solicitar atualização ou remoção dos dados conforme a
          política de privacidade.
        </p>
      </section>
    </div>
  );
}

type InfoItemProps = {
  label: string;
  value: string;
  icon: LucideIcon;
};

function InfoItem({ label, value, icon: Icon }: InfoItemProps) {
  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
      <p className="flex items-center gap-1.5 text-xs font-medium text-slate-500">
        <Icon className="h-3.5 w-3.5 text-slate-400" />
        {label}
      </p>
      <p className="mt-1 text-sm font-bold text-slate-900">{value}</p>
    </div>
  );
}

type ContactRowProps = {
  label: string;
  value: string;
  icon: LucideIcon;
};

function ContactRow({ label, value, icon: Icon }: ContactRowProps) {
  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
      <p className="flex items-center gap-1.5 text-xs font-medium text-slate-500">
        <Icon className="h-3.5 w-3.5 text-slate-400" />
        {label}
      </p>
      <p className="mt-1 text-sm font-bold text-slate-900">{value}</p>
    </div>
  );
}