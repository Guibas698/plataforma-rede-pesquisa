"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Users,
  Map,
  MapPin,
  TrendingUp,
  ArrowRight,
  UserCheck,
  Link2,
  MessageCircle,
  Network,
  ShieldCheck,
} from "lucide-react";
import Link from "next/link";

import { apiFetch } from "../lib/api";
import { obterUsuarioSalvo } from "../lib/auth";

type MunicipioDestaqueResponse = {
  nome?: string;
  municipio?: string;
  total?: number;
  totalApoiadores?: number;
  zonasEleitorais?: number;
  secoesEleitorais?: number;
};

type CandidatoDashboardResponse = {
  totalApoiadores: number;
  municipiosAlcancados: number;
  zonasEleitorais: number;
  secoesEleitorais: number;
  cadastrosHoje: number;
  cadastrosUltimosSeteDias: number;
  crescimentoPercentual: number;
  linkCadastro?: string | null;
  municipiosDestaque: MunicipioDestaqueResponse[];
};

type RedeResumoDashboardResponse = {
  totalUsuarios: number;
  totalLideres: number;
  totalDiretos: number;
};

function formatarNumero(valor?: number | null): string {
  return (valor ?? 0).toLocaleString("pt-BR");
}

function formatarPercentual(valor?: number | null): string {
  const numero = valor ?? 0;

  return `${numero.toLocaleString("pt-BR", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 1,
  })}%`;
}

function obterNomeMunicipio(item: MunicipioDestaqueResponse): string {
  return item.nome || item.municipio || "Cidade não informada";
}

function obterTotalMunicipio(item: MunicipioDestaqueResponse): number {
  return item.totalApoiadores ?? item.total ?? 0;
}

function montarLinkCadastro(linkCadastro?: string | null): string {
  if (!linkCadastro) {
    return "";
  }

  if (linkCadastro.startsWith("http://") || linkCadastro.startsWith("https://")) {
    return linkCadastro;
  }

  if (typeof window === "undefined") {
    return linkCadastro;
  }

  return `${window.location.origin}/cadastro/${linkCadastro}`;
}

function CardSkeleton() {
  return (
    <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between">
      <div className="flex justify-between items-start mb-2">
        <div className="h-4 w-24 bg-slate-100 rounded animate-pulse" />
        <div className="h-4 w-4 bg-slate-100 rounded animate-pulse" />
      </div>
      <div className="h-8 w-20 bg-slate-100 rounded-lg animate-pulse" />
    </div>
  );
}

export default function DashboardCandidatoPage() {
  const [dashboard, setDashboard] =
    useState<CandidatoDashboardResponse | null>(null);
  
  const [redeResumo, setRedeResumo] =
    useState<RedeResumoDashboardResponse | null>(null);

  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState("");
  const [copiado, setCopiado] = useState(false);

  const usuario = obterUsuarioSalvo();
  const isLider = usuario?.papel === "LIDER";

  useEffect(() => {
    let montado = true;

    async function carregarDashboard() {
      setCarregando(true);
      setErro("");

      try {
        const response = await apiFetch<CandidatoDashboardResponse>(
          "/candidato/dashboard"
        );

        if (!montado) {
          return;
        }

        setDashboard({
          totalApoiadores: response.totalApoiadores ?? 0,
          municipiosAlcancados: response.municipiosAlcancados ?? 0,
          zonasEleitorais: response.zonasEleitorais ?? 0,
          secoesEleitorais: response.secoesEleitorais ?? 0,
          cadastrosHoje: response.cadastrosHoje ?? 0,
          cadastrosUltimosSeteDias:
            response.cadastrosUltimosSeteDias ?? 0,
          crescimentoPercentual: response.crescimentoPercentual ?? 0,
          linkCadastro: response.linkCadastro ?? null,
          municipiosDestaque: response.municipiosDestaque ?? [],
        });
      } catch (error) {
        if (!montado) {
          return;
        }

        if (error instanceof Error) {
          setErro(error.message || "Não foi possível carregar o dashboard.");
        } else {
          setErro("Não foi possível carregar o dashboard.");
        }
      } finally {
        if (montado) {
          setCarregando(false);
        }
      }
    }

    carregarDashboard();

    return () => {
      montado = false;
    };
  }, []);

useEffect(() => {
    if (!isLider) {
      return;
    }

    let montado = true;

    async function carregarResumoRede() {
      try {
        const response = await apiFetch<RedeResumoDashboardResponse>(
          "/candidato/rede"
        );

        if (montado) {
          setRedeResumo(response);
        }
      } catch {
        if (montado) {
          setRedeResumo(null);
        }
      }
    }

    carregarResumoRede();

    return () => {
      montado = false;
    };
  }, [isLider]);


  const linkCadastro = useMemo(() => {
    return montarLinkCadastro(dashboard?.linkCadastro);
  }, [dashboard?.linkCadastro]);

  const municipiosDestaque = useMemo(() => {
    return [...(dashboard?.municipiosDestaque ?? [])].sort(
      (a, b) => obterTotalMunicipio(b) - obterTotalMunicipio(a)
    );
  }, [dashboard]);

  async function copiarLink() {
    if (!linkCadastro) {
      return;
    }

    await navigator.clipboard.writeText(linkCadastro);
    setCopiado(true);

    setTimeout(() => {
      setCopiado(false);
    }, 2000);
  }

  const linkWhatsApp = linkCadastro
    ? `https://wa.me/?text=${encodeURIComponent(
        `Cadastre-se como usuário pelo link de convite: ${linkCadastro}`
      )}`
    : "";

  const percentualMetaVisual = Math.min(
    Math.round(((dashboard?.totalApoiadores ?? 0) / 2000) * 100),
    100
  );

  const faltamParaMeta = Math.max(2000 - (dashboard?.totalApoiadores ?? 0), 0);

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6 lg:space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            Olá, {usuario?.nome || (isLider ? "Líder" : "ADM")}!
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            {isLider
              ? "Acompanhe os usuários e líderes abaixo de você e compartilhe seu link de convite."
              : "Acompanhe seus usuários, veja as cidades alcançadas e compartilhe seu link de convite."}
          </p>
        </div>

        <Link
          href="/adm/link"
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-emerald-600 text-white text-sm font-medium rounded-lg hover:bg-emerald-700 transition-colors shadow-sm w-full sm:w-auto"
        >
          <UserCheck className="w-4 h-4" />
          Convidar usuários
        </Link>
      </div>

      {erro && (
        <div className="bg-red-50 border border-red-100 text-red-700 px-4 py-3 rounded-xl text-sm font-medium">
          {erro}
        </div>
      )}

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {carregando ? (
          <>
            <CardSkeleton />
            <CardSkeleton />
            <CardSkeleton />
            <CardSkeleton />
          </>
        ) : (
          <>
            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between">
              <div className="flex justify-between items-start mb-2">
                <p className="text-xs font-medium text-slate-500">
                  {isLider ? "Total de usuários da minha rede" : "Total de usuários"}
                </p>
                <Users className="w-4 h-4 text-emerald-600" />
              </div>
              <h3 className="text-2xl font-bold text-slate-900">
                {formatarNumero(dashboard?.totalApoiadores)}
              </h3>
            </div>

            {!isLider && (
              <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between">
                <div className="flex justify-between items-start mb-2">
                  <p className="text-xs font-medium text-slate-500">
                    Cidades alcançadas
                  </p>
                  <Map className="w-4 h-4 text-blue-600" />
                </div>
                <h3 className="text-2xl font-bold text-slate-900">
                  {formatarNumero(dashboard?.municipiosAlcancados)}
                </h3>
              </div>
            )}

            {isLider && (
              <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between">
                <div className="flex justify-between items-start mb-2">
                  <p className="text-xs font-medium text-slate-500">
                    Meu link
                  </p>
                  <Link2 className="w-4 h-4 text-blue-600" />
                </div>
                <Link
                  href="/adm/link"
                  className="text-sm font-bold text-emerald-600 hover:text-emerald-700"
                >
                  Abrir convite
                </Link>
              </div>
            )}

            {!isLider && (
              <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between">
                <div className="flex justify-between items-start mb-2">
                  <p className="text-xs font-medium text-slate-500">
                    Segmentos
                  </p>
                  <MapPin className="w-4 h-4 text-purple-600" />
                </div>
                <h3 className="text-2xl font-bold text-slate-900">
                  {formatarNumero(dashboard?.zonasEleitorais)}
                </h3>
              </div>
            )}

            {isLider && (
              <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between">
                <div className="flex justify-between items-start mb-2">
                  <p className="text-xs font-medium text-slate-500">
                    Líderes abaixo de mim
                  </p>
                  <Network className="w-4 h-4 text-purple-600" />
                </div>
                <h3 className="text-2xl font-bold text-slate-900">
                  {formatarNumero(redeResumo?.totalLideres)}
                </h3>
              </div>
            )}

            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between">
              <div className="flex justify-between items-start mb-2">
                <p className="text-xs font-medium text-slate-500">
                  {isLider ? "Usuários diretos" : "Cadastros hoje"}
                </p>
                <TrendingUp className="w-4 h-4 text-emerald-600" />
              </div>
              <h3 className="text-2xl font-bold text-slate-900">
                <span className="text-emerald-600 text-lg mr-1">+</span>
                {formatarNumero(isLider ? redeResumo?.totalDiretos : dashboard?.cadastrosHoje)}
              </h3>
            </div>
          </>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {!isLider && (
        <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
            <div>
              <h3 className="font-bold text-slate-900">
                Cidades em destaque
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Cidades com maior volume de cadastros vinculados ao seu link.
              </p>
            </div>

            <Link
              href="/adm/mapa"
              className="text-sm font-medium text-emerald-600 hover:text-emerald-700 flex items-center gap-1"
            >
              Ver mapa de regiões <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          {carregando ? (
            <div className="p-5 space-y-4">
              {[1, 2, 3, 4].map((item) => (
                <div
                  key={item}
                  className="h-14 bg-slate-50 rounded-lg animate-pulse"
                />
              ))}
            </div>
          ) : municipiosDestaque.length > 0 ? (
            <div className="divide-y divide-slate-100">
              {municipiosDestaque.map((municipio, index) => (
                <div
                  key={`${obterNomeMunicipio(municipio)}-${index}`}
                  className="px-5 py-3.5 flex items-center justify-between hover:bg-slate-50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-600 shrink-0">
                      <Network className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-slate-900">
                        {obterNomeMunicipio(municipio)}
                      </p>
                      <div className="flex items-center gap-1 text-xs text-slate-500 mt-0.5">
                        <MapPin className="w-3 h-3" />
                        {formatarNumero(obterTotalMunicipio(municipio))}{" "}
                        usuários
                      </div>
                    </div>
                  </div>

                  <div className="text-xs text-slate-400 font-medium whitespace-nowrap">
                    {formatarNumero(municipio.zonasEleitorais)} segmentos •{" "}
                    {formatarNumero(municipio.secoesEleitorais)} subsegmentos
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="px-5 py-10 text-center">
              <div className="w-12 h-12 mx-auto rounded-xl bg-slate-50 flex items-center justify-center mb-3">
                <MapPin className="w-6 h-6 text-slate-400" />
              </div>
              <p className="text-sm font-medium text-slate-600">
                Cidades aparecerão aqui quando houver usuários.
              </p>
            </div>
          )}
        </div>)}

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex flex-col">
          <h3 className="font-bold text-slate-900 mb-4">
            Evolução recente
          </h3>

          <div className="flex-1 flex flex-col justify-center">
            <div className="flex justify-between items-end mb-2">
              <div>
                <p className="text-3xl font-bold text-slate-900">
                  {formatarNumero(dashboard?.cadastrosUltimosSeteDias)}
                </p>
                <p className="text-sm text-slate-500">
                  cadastros nos últimos 7 dias
                </p>
              </div>

              <span
                className={`text-sm font-bold px-2 py-1 rounded-md ${
                  (dashboard?.crescimentoPercentual ?? 0) >= 0
                    ? "text-emerald-600 bg-emerald-50"
                    : "text-red-600 bg-red-50"
                }`}
              >
                {formatarPercentual(dashboard?.crescimentoPercentual)}
              </span>
            </div>

            <div className="w-full bg-slate-100 h-3 rounded-full overflow-hidden mt-4">
              <div
                className="bg-emerald-500 h-full rounded-full transition-all duration-1000 ease-out"
                style={{ width: `${percentualMetaVisual}%` }}
              />
            </div>

            <p className="text-xs text-slate-400 mt-3 text-center">
              {faltamParaMeta > 0
                ? `Faltam ${formatarNumero(
                    faltamParaMeta
                  )} usuários para a referência de 2.000.`
                : "A referência de 2.000 usuários foi alcançada."}
            </p>
          </div>
        </div>
      </div>

      <div className="bg-gradient-to-r from-slate-900 to-slate-800 rounded-xl p-6 sm:p-8 text-white shadow-md relative overflow-hidden mt-2">
        <div className="relative z-10 sm:w-2/3 lg:w-3/4">
          <h2 className="text-xl sm:text-2xl font-bold mb-2">
            Envie seu link de convite
          </h2>
          <p className="text-slate-300 text-sm mb-6 max-w-xl">
            Compartilhe este link para que novos usuários se cadastrem
            automaticamente vinculados ao seu perfil.
          </p>

          <div className="flex flex-col sm:flex-row gap-3 max-w-lg">
            <div className="bg-slate-950/50 border border-slate-700 rounded-lg px-4 py-3 flex items-center flex-1 text-sm font-mono text-emerald-400 overflow-hidden text-ellipsis whitespace-nowrap">
              {linkCadastro || "Link ainda não disponível"}
            </div>

            <button
              type="button"
              onClick={copiarLink}
              disabled={!linkCadastro}
              className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-6 py-3 rounded-lg transition-colors flex items-center justify-center gap-2 shrink-0 disabled:opacity-60 disabled:cursor-not-allowed"
            >
              <Link2 className="w-4 h-4" />
              {copiado ? "Copiado!" : "Copiar link"}
            </button>

            <a
              href={linkWhatsApp || "#"}
              target="_blank"
              rel="noopener noreferrer"
              className={`font-bold px-6 py-3 rounded-lg transition-colors flex items-center justify-center gap-2 shrink-0 ${
                linkWhatsApp
                  ? "bg-[#25D366] hover:bg-[#22c35e] text-white"
                  : "bg-slate-700 text-slate-400 pointer-events-none"
              }`}
            >
              <MessageCircle className="w-4 h-4" />
              WhatsApp
            </a>
          </div>
        </div>

        <div className="absolute right-0 top-0 w-1/3 h-full opacity-5 pointer-events-none hidden sm:flex items-center justify-center">
          <UserCheck className="w-48 h-48 transform translate-x-1/4" />
        </div>
      </div>

      <div className="flex items-center justify-center gap-2 text-xs text-slate-500 pt-4 text-center">
        <ShieldCheck className="w-4 h-4 shrink-0 text-slate-400" />
        <p>
          Os dados exibidos representam cadastros voluntários de usuários na
          plataforma.
        </p>
      </div>
    </div>
  );
}