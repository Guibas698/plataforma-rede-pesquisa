"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Users,
  MapPin,
  UserPlus,
  Activity,
  ChevronRight,
  Trophy,
} from "lucide-react";

import { apiFetch } from "../lib/api";
import { limparSessao } from "../lib/auth";

type AdminDashboardResponse = {
  totalCandidatos: number;
  candidatosAtivos: number;
  totalApoiadores: number;
  municipiosAlcancados: number;
  cadastrosHoje: number;
};

type AdminRankingItemResponse = {
  nome: string;
  total: number;
  municipioBase?: string;
};

type AdminRelatorioResponse = {
  totalApoiadores: number;
  totalCandidatos: number;
  municipiosAlcancados: number;
  rankingCandidatos: AdminRankingItemResponse[];
  rankingMunicipios: AdminRankingItemResponse[];
};

function formatarNumero(valor?: number | null) {
  return (valor ?? 0).toLocaleString("pt-BR");
}

function obterStatusErro(error: unknown): number | undefined {
  if (
    typeof error === "object" &&
    error !== null &&
    "status" in error &&
    typeof (error as { status?: unknown }).status === "number"
  ) {
    return (error as { status: number }).status;
  }

  return undefined;
}

function obterMensagemErro(error: unknown, fallback: string) {
  if (error instanceof Error && error.message) {
    return error.message;
  }

  return fallback;
}

function CardValor({
  carregando,
  valor,
}: {
  carregando: boolean;
  valor: string;
}) {
  if (carregando) {
    return (
      <div className="h-8 w-24 bg-slate-100 rounded-lg animate-pulse mt-2" />
    );
  }

  return <h3 className="text-2xl font-bold text-slate-900 mt-1">{valor}</h3>;
}

function TextoCard({
  carregando,
  children,
}: {
  carregando: boolean;
  children: React.ReactNode;
}) {
  if (carregando) {
    return <div className="h-4 w-40 bg-slate-100 rounded animate-pulse mt-4" />;
  }

  return <p className="text-sm text-slate-600 mt-4">{children}</p>;
}

function LinhaSkeleton() {
  return (
    <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 last:border-0">
      <div className="flex items-center gap-3 min-w-0">
        <div className="h-4 w-6 bg-slate-100 rounded animate-pulse" />
        <div>
          <div className="h-4 w-36 bg-slate-100 rounded animate-pulse" />
          <div className="h-3 w-28 bg-slate-100 rounded animate-pulse mt-2" />
        </div>
      </div>

      <div className="h-7 w-16 bg-slate-100 rounded-full animate-pulse" />
    </div>
  );
}

function EmptyRanking({ mensagem }: { mensagem: string }) {
  return (
    <div className="p-8 flex flex-col items-center justify-center text-center">
      <div className="w-11 h-11 rounded-xl bg-slate-100 flex items-center justify-center mb-3">
        <Trophy className="w-5 h-5 text-slate-400" />
      </div>

      <p className="text-sm font-medium text-slate-600">{mensagem}</p>
    </div>
  );
}

export default function AdminDashboardPage() {
  const router = useRouter();

  const [dashboard, setDashboard] = useState<AdminDashboardResponse | null>(
    null
  );
  const [relatorio, setRelatorio] = useState<AdminRelatorioResponse | null>(
    null
  );

  const [carregandoDashboard, setCarregandoDashboard] = useState(true);
  const [carregandoRelatorio, setCarregandoRelatorio] = useState(true);

  const [erro, setErro] = useState("");
  const [avisoRelatorio, setAvisoRelatorio] = useState("");

  useEffect(() => {
    let montado = true;

    async function carregarDashboard() {
      setCarregandoDashboard(true);
      setCarregandoRelatorio(true);
      setErro("");
      setAvisoRelatorio("");

      try {
        const dashboardResponse = await apiFetch<AdminDashboardResponse>(
          "/admin/dashboard"
        );

        if (!montado) {
          return;
        }

        setDashboard(dashboardResponse);
        setCarregandoDashboard(false);

        try {
          const relatorioResponse = await apiFetch<AdminRelatorioResponse>(
            "/admin/relatorios"
          );

          if (!montado) {
            return;
          }

          setRelatorio(relatorioResponse);
        } catch (errorRelatorio) {
          if (!montado) {
            return;
          }

          const statusRelatorio = obterStatusErro(errorRelatorio);

          if (statusRelatorio === 401 || statusRelatorio === 403) {
            limparSessao();
            router.replace("/login");
            return;
          }

          setRelatorio(null);
          setAvisoRelatorio(
            "Não foi possível carregar os rankings agora. Os dados principais continuam disponíveis."
          );
        } finally {
          if (montado) {
            setCarregandoRelatorio(false);
          }
        }
      } catch (errorDashboard) {
        if (!montado) {
          return;
        }

        const statusDashboard = obterStatusErro(errorDashboard);

        if (statusDashboard === 401 || statusDashboard === 403) {
          limparSessao();
          router.replace("/login");
          return;
        }

        setErro(
          obterMensagemErro(
            errorDashboard,
            "Não foi possível carregar o dashboard."
          )
        );
        setCarregandoDashboard(false);
        setCarregandoRelatorio(false);
      }
    }

    carregarDashboard();

    return () => {
      montado = false;
    };
  }, [router]);

  const resumo = {
    totalCandidatos: dashboard?.totalCandidatos ?? 0,
    candidatosAtivos: dashboard?.candidatosAtivos ?? 0,
    totalApoiadores: dashboard?.totalApoiadores ?? 0,
    municipiosAlcancados: dashboard?.municipiosAlcancados ?? 0,
    cadastrosHoje: dashboard?.cadastrosHoje ?? 0,
  };

  const rankingCandidatos = useMemo(() => {
    return [...(relatorio?.rankingCandidatos ?? [])]
      .filter((candidato) => (candidato.total ?? 0) > 0)
      .sort((a, b) => (b.total ?? 0) - (a.total ?? 0))
      .slice(0, 5);
  }, [relatorio]);

  const rankingMunicipios = useMemo(() => {
    return [...(relatorio?.rankingMunicipios ?? [])]
      .filter((municipio) => (municipio.total ?? 0) > 0)
      .sort((a, b) => (b.total ?? 0) - (a.total ?? 0))
      .slice(0, 5);
  }, [relatorio]);

  const mensagemEmptyCandidatos = (() => {
    if (resumo.totalCandidatos === 0) {
      return "Nenhum ADM cadastrado.";
    }

    if (resumo.totalApoiadores === 0) {
      return "Nenhum usuário cadastrado.";
    }

    return "O ranking será exibido quando houver dados suficientes.";
  })();

  const mensagemEmptyMunicipios = (() => {
    if (resumo.totalApoiadores === 0) {
      return "Nenhuma cidade com usuários ainda.";
    }

    return "O ranking será exibido quando houver dados suficientes.";
  })();

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            Dashboard Master
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Visão geral dos ADMs, usuários e cidades monitoradas.
          </p>
        </div>

        <Link
          href="/admin/candidatos/novo"
          className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-emerald-600 text-white text-sm font-medium rounded-lg hover:bg-emerald-700 transition-colors shadow-sm focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500"
        >
          <UserPlus className="w-4 h-4" />
          Novo ADM
        </Link>
      </div>

      {erro && (
        <div className="bg-red-50 border border-red-100 text-red-700 px-4 py-3 rounded-xl text-sm font-medium">
          {erro}
        </div>
      )}

      {avisoRelatorio && !erro && (
        <div className="bg-amber-50 border border-amber-100 text-amber-800 px-4 py-3 rounded-xl text-sm font-medium">
          {avisoRelatorio}
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm font-medium text-slate-500">ADMs</p>
              <CardValor
                carregando={carregandoDashboard}
                valor={formatarNumero(resumo.totalCandidatos)}
              />
            </div>

            <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
              <Users className="w-5 h-5" />
            </div>
          </div>

          <TextoCard carregando={carregandoDashboard}>
            <span className="font-medium text-emerald-600">
              {formatarNumero(resumo.candidatosAtivos)} ativos
            </span>{" "}
            na plataforma
          </TextoCard>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm font-medium text-slate-500">
                Usuários cadastrados
              </p>
              <CardValor
                carregando={carregandoDashboard}
                valor={formatarNumero(resumo.totalApoiadores)}
              />
            </div>

            <div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg">
              <UserPlus className="w-5 h-5" />
            </div>
          </div>

          <TextoCard carregando={carregandoDashboard}>
            Usuários cadastrados na plataforma
          </TextoCard>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm font-medium text-slate-500">
                Cidades alcançadas
              </p>
              <CardValor
                carregando={carregandoDashboard}
                valor={formatarNumero(resumo.municipiosAlcancados)}
              />
            </div>

            <div className="p-2 bg-purple-50 text-purple-600 rounded-lg">
              <MapPin className="w-5 h-5" />
            </div>
          </div>

          <TextoCard carregando={carregandoDashboard}>
            Cidades com usuários cadastrados
          </TextoCard>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm font-medium text-slate-500">
                Cadastros hoje
              </p>
              <CardValor
                carregando={carregandoDashboard}
                valor={formatarNumero(resumo.cadastrosHoje)}
              />
            </div>

            <div className="p-2 bg-amber-50 text-amber-600 rounded-lg">
              <Activity className="w-5 h-5" />
            </div>
          </div>

          <TextoCard carregando={carregandoDashboard}>
            Novos cadastros registrados hoje
          </TextoCard>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
          <div className="p-5 border-b border-slate-100 flex justify-between items-center">
            <h2 className="text-lg font-semibold text-slate-900 flex items-center gap-2">
              <Trophy className="w-5 h-5 text-amber-500" />
              Top ADMs
            </h2>

            <Link
              href="/admin/candidatos"
              className="text-sm font-medium text-emerald-600 hover:text-emerald-700 flex items-center"
            >
              Ver todos <ChevronRight className="w-4 h-4 ml-0.5" />
            </Link>
          </div>

          <div className="p-0 flex-1">
            {carregandoRelatorio ? (
              <>
                <LinhaSkeleton />
                <LinhaSkeleton />
                <LinhaSkeleton />
              </>
            ) : rankingCandidatos.length > 0 ? (
              <div className="divide-y divide-slate-100">
                {rankingCandidatos.map((candidato, index) => (
                  <div
                    key={`${candidato.nome}-${index}`}
                    className="flex items-center justify-between px-5 py-4"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <span className="text-sm font-bold text-slate-900 w-6">
                        {index + 1}º
                      </span>

                      <div className="min-w-0">
                        <p className="text-sm font-medium text-slate-900 truncate">
                          {candidato.nome}
                        </p>

                        {/*
                          TODO Backend:
                          adicionar municipioBase em cada item de rankingCandidatos
                          no endpoint GET /api/admin/relatorios.
                        */}
                        <p className="text-xs text-slate-500 truncate">
                          {candidato.municipioBase ??
                            "Cidade não informada pelo backend"}
                        </p>
                      </div>
                    </div>

                    <span className="ml-3 px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 text-xs font-bold">
                      {formatarNumero(candidato.total)}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <EmptyRanking mensagem={mensagemEmptyCandidatos} />
            )}
          </div>
        </div>

        <div className="flex flex-col gap-6">
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex-1">
            <div className="p-5 border-b border-slate-100">
              <h2 className="text-lg font-semibold text-slate-900 flex items-center gap-2">
                <MapPin className="w-5 h-5 text-purple-500" />
                Cidades com mais usuários
              </h2>
            </div>

            <div className="p-0">
              {carregandoRelatorio ? (
                <>
                  <LinhaSkeleton />
                  <LinhaSkeleton />
                  <LinhaSkeleton />
                </>
              ) : rankingMunicipios.length > 0 ? (
                <div className="divide-y divide-slate-100">
                  {rankingMunicipios.map((municipio, index) => (
                    <div
                      key={`${municipio.nome}-${index}`}
                      className="flex items-center justify-between px-5 py-4"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <span className="text-sm font-bold text-slate-900 w-6">
                          {index + 1}º
                        </span>

                        <p className="text-sm font-medium text-slate-900 truncate">
                          {municipio.nome}
                        </p>
                      </div>

                      <span className="ml-3 px-3 py-1 rounded-full bg-purple-50 text-purple-700 text-xs font-bold">
                        {formatarNumero(municipio.total)}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <EmptyRanking mensagem={mensagemEmptyMunicipios} />
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Link
              href="/admin/candidatos"
              className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between hover:border-emerald-300 hover:shadow-md transition-all group"
            >
              <div className="flex items-center gap-3">
                <div className="p-2 bg-slate-100 rounded-lg group-hover:bg-emerald-50 group-hover:text-emerald-600 transition-colors">
                  <Users className="w-5 h-5 text-slate-600 group-hover:text-emerald-600" />
                </div>

                <span className="text-sm font-medium text-slate-700 group-hover:text-slate-900">
                  Gerenciar ADMs
                </span>
              </div>
            </Link>

            <Link
              href="/admin/apoiadores"
              className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between hover:border-emerald-300 hover:shadow-md transition-all group"
            >
              <div className="flex items-center gap-3">
                <div className="p-2 bg-slate-100 rounded-lg group-hover:bg-emerald-50 group-hover:text-emerald-600 transition-colors">
                  <UserPlus className="w-5 h-5 text-slate-600 group-hover:text-emerald-600" />
                </div>

                <span className="text-sm font-medium text-slate-700 group-hover:text-slate-900">
                  Base de usuários
                </span>
              </div>
            </Link>
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-600 shadow-sm">
        Os números exibidos representam cadastros voluntários de usuários na
        plataforma.
      </div>
    </div>
  );
}