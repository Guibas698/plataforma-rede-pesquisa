"use client";

import { useEffect, useMemo, useState, type ElementType } from "react";
import {
  Download,
  ShieldCheck,
  UserCheck,
  UsersRound,
  MapPinned,
  TrendingUp,
  BarChart3,
  Map as MapIcon,
  Landmark,
  Activity,
  Info,
} from "lucide-react";

import { apiFetch } from "../../lib/api";

type AdminRankingItemResponse = {
  nome: string;
  total: number;
};

type AdminCrescimentoDiarioResponse = {
  dia: string;
  total: number;
};

type AdminRelatorioResponse = {
  totalApoiadores: number;
  totalCandidatos: number;
  municipiosAlcancados: number;
  cadastrosHoje: number;
  rankingCandidatos: AdminRankingItemResponse[];
  rankingMunicipios: AdminRankingItemResponse[];
  rankingZonas: AdminRankingItemResponse[];
  rankingSecoes: AdminRankingItemResponse[];
  crescimentoDiario: AdminCrescimentoDiarioResponse[];
};

function formatarNumero(valor?: number | null): string {
  return (valor ?? 0).toLocaleString("pt-BR");
}

function formatarTexto(valor?: string | null): string {
  const texto = valor?.trim();
  return texto ? texto : "Indisponível";
}

function ordenarRanking(
  ranking?: AdminRankingItemResponse[]
): AdminRankingItemResponse[] {
  return [...(ranking ?? [])]
    .filter((item) => item.nome && item.total > 0)
    .sort((a, b) => b.total - a.total);
}

function calcularPercentual(valor: number, maximo: number): number {
  if (maximo <= 0) {
    return 0;
  }

  return Math.max((valor / maximo) * 100, 4);
}

function CardSkeleton() {
  return (
    <div className="bg-white border border-slate-200 rounded-xl shadow-sm p-5 flex flex-col justify-between">
      <div className="flex justify-between items-start mb-3">
        <div className="h-4 w-28 bg-slate-100 rounded animate-pulse" />
        <div className="h-4 w-4 bg-slate-100 rounded animate-pulse" />
      </div>
      <div className="h-8 w-24 bg-slate-100 rounded-lg animate-pulse" />
    </div>
  );
}

function RankingSkeleton() {
  return (
    <div className="space-y-5">
      {[1, 2, 3, 4].map((item) => (
        <div key={item}>
          <div className="flex justify-between mb-1.5">
            <div className="h-4 w-32 bg-slate-100 rounded animate-pulse" />
            <div className="h-4 w-14 bg-slate-100 rounded animate-pulse" />
          </div>
          <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
            <div className="bg-slate-200 h-2 rounded-full w-2/3 animate-pulse" />
          </div>
        </div>
      ))}
    </div>
  );
}

function EmptyRanking({ mensagem }: { mensagem: string }) {
  return (
    <div className="py-10 flex flex-col items-center justify-center text-center">
      <div className="w-12 h-12 rounded-xl bg-slate-50 flex items-center justify-center mb-3">
        <BarChart3 className="w-6 h-6 text-slate-400" />
      </div>
      <p className="text-sm font-medium text-slate-600">{mensagem}</p>
    </div>
  );
}

function RankingCard({
  titulo,
  icon: Icon,
  carregando,
  ranking,
  maximo,
  emptyMessage,
  barClassName,
}: {
  titulo: string;
  icon: ElementType;
  carregando: boolean;
  ranking: AdminRankingItemResponse[];
  maximo: number;
  emptyMessage: string;
  barClassName: string;
}) {
  return (
    <div className="bg-white border border-slate-200 rounded-xl shadow-sm p-6">
      <h2 className="text-sm font-semibold text-slate-900 mb-6 flex items-center gap-2">
        <Icon className="w-4 h-4 text-slate-400" />
        {titulo}
      </h2>

      {carregando ? (
        <RankingSkeleton />
      ) : ranking.length > 0 ? (
        <div className="space-y-5">
          {ranking.map((item, index) => (
            <div key={`${item.nome}-${index}`}>
              <div className="flex justify-between text-sm font-medium mb-1.5 gap-3">
                <span className="text-slate-700 truncate">
                  {index + 1}º {item.nome}
                </span>
                <span className="text-slate-900 shrink-0">
                  {formatarNumero(item.total)}
                </span>
              </div>

              <div className="w-full bg-slate-100 rounded-full h-2">
                <div
                  className={`${barClassName} h-2 rounded-full transition-all duration-500`}
                  style={{
                    width: `${calcularPercentual(item.total, maximo)}%`,
                  }}
                />
              </div>
            </div>
          ))}
        </div>
      ) : (
        <EmptyRanking mensagem={emptyMessage} />
      )}
    </div>
  );
}

function formatarDataCurta(data: string): string {
  try {
    return new Intl.DateTimeFormat("pt-BR", {
      day: "2-digit",
      month: "2-digit",
    }).format(new Date(`${data}T00:00:00`));
  } catch {
    return data;
  }
}

function CrescimentoDiarioCard({
  carregando,
  crescimentoDiario,
}: {
  carregando: boolean;
  crescimentoDiario: AdminCrescimentoDiarioResponse[];
}) {
  const maximo = Math.max(...crescimentoDiario.map((item) => item.total), 0);

  return (
    <div className="bg-white border border-slate-200 rounded-xl shadow-sm p-6">
      <h2 className="text-sm font-semibold text-slate-900 mb-6 flex items-center gap-2">
        <Activity className="w-4 h-4 text-slate-400" />
        Cadastros nos últimos 7 dias
      </h2>

      {carregando ? (
        <RankingSkeleton />
      ) : crescimentoDiario.length > 0 ? (
        <div className="space-y-5">
          {crescimentoDiario.map((item) => (
            <div key={item.dia}>
              <div className="flex justify-between text-sm font-medium mb-1.5 gap-3">
                <span className="text-slate-700 truncate">
                  {formatarDataCurta(item.dia)}
                </span>

                <span className="text-slate-900 shrink-0">
                  {formatarNumero(item.total)}
                </span>
              </div>

              <div className="w-full bg-slate-100 rounded-full h-2">
                <div
                  className="bg-emerald-500 h-2 rounded-full transition-all duration-500"
                  style={{
                    width: `${calcularPercentual(item.total, maximo)}%`,
                  }}
                />
              </div>
            </div>
          ))}
        </div>
      ) : (
        <EmptyRanking mensagem="Nenhum cadastro registrado nos últimos 7 dias." />
      )}
    </div>
  );
}

export default function RelatoriosPage() {
  const [relatorio, setRelatorio] = useState<AdminRelatorioResponse | null>(
    null
  );
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState("");

  useEffect(() => {
    let montado = true;

    async function carregarRelatorios() {
      setCarregando(true);
      setErro("");

      try {
        const response = await apiFetch<AdminRelatorioResponse>(
          "/admin/relatorios"
        );

        if (!montado) {
          return;
        }

        setRelatorio({
          totalApoiadores: response.totalApoiadores ?? 0,
          totalCandidatos: response.totalCandidatos ?? 0,
          municipiosAlcancados: response.municipiosAlcancados ?? 0,
          cadastrosHoje: response.cadastrosHoje ?? 0,
          rankingCandidatos: response.rankingCandidatos ?? [],
          rankingMunicipios: response.rankingMunicipios ?? [],
          rankingZonas: response.rankingZonas ?? [],
          rankingSecoes: response.rankingSecoes ?? [],
          crescimentoDiario: response.crescimentoDiario ?? [],
        });
      } catch (error) {
        if (!montado) {
          return;
        }

        if (error instanceof Error) {
          setErro(error.message || "Não foi possível carregar relatórios.");
        } else {
          setErro("Não foi possível carregar relatórios.");
        }
      } finally {
        if (montado) {
          setCarregando(false);
        }
      }
    }

    carregarRelatorios();

    return () => {
      montado = false;
    };
  }, []);

  const rankingCandidatos = useMemo(() => {
    return ordenarRanking(relatorio?.rankingCandidatos);
  }, [relatorio]);

  const rankingMunicipios = useMemo(() => {
    return ordenarRanking(relatorio?.rankingMunicipios);
  }, [relatorio]);

  const rankingZonas = useMemo(() => {
    return ordenarRanking(relatorio?.rankingZonas);
  }, [relatorio]);

  const rankingSecoes = useMemo(() => {
    return ordenarRanking(relatorio?.rankingSecoes);
  }, [relatorio]);

  const crescimentoDiario = useMemo(() => {
    return [...(relatorio?.crescimentoDiario ?? [])];
  }, [relatorio]);

  const maxCandidatos = useMemo(() => {
    return Math.max(...rankingCandidatos.map((item) => item.total), 0);
  }, [rankingCandidatos]);

  const maxMunicipios = useMemo(() => {
    return Math.max(...rankingMunicipios.map((item) => item.total), 0);
  }, [rankingMunicipios]);

  const maxZonas = useMemo(() => {
    return Math.max(...rankingZonas.map((item) => item.total), 0);
  }, [rankingZonas]);

  const maxSecoes = useMemo(() => {
    return Math.max(...rankingSecoes.map((item) => item.total), 0);
  }, [rankingSecoes]);

  const mediaPorCandidato = useMemo(() => {
    if (!relatorio || relatorio.totalCandidatos <= 0) {
      return null;
    }

    return Math.round(relatorio.totalApoiadores / relatorio.totalCandidatos);
  }, [relatorio]);

  const municipioLider = rankingMunicipios[0]?.nome ?? null;

  const handleExportCSV = () => {
    if (!relatorio) {
      alert("Nenhum dado disponível para exportar.");
      return;
    }

    const linhas = [
      ["tipo", "nome", "total"],
      [
        "total_usuarios",
        "Total de usuários",
        String(relatorio.totalApoiadores),
      ],
      ["total_adms", "Total de ADMs", String(relatorio.totalCandidatos)],
      [
        "cidades_alcancadas",
        "Cidades alcançadas",
        String(relatorio.municipiosAlcancados),
      ],
      ...rankingCandidatos.map((item) => [
        "ranking_adm",
        item.nome,
        String(item.total),
      ]),
      ...rankingMunicipios.map((item) => [
        "ranking_cidade",
        item.nome,
        String(item.total),
      ]),
      ...rankingZonas.map((item) => [
        "ranking_segmento",
        item.nome,
        String(item.total),
      ]),
      ...rankingSecoes.map((item) => [
        "ranking_subsegmento",
        item.nome,
        String(item.total),
      ]),
      ...crescimentoDiario.map((item) => [
        "crescimento_diario",
        item.dia,
        String(item.total),
      ]),
      [
        "cadastros_hoje",
        "Cadastros hoje",
        String(relatorio.cadastrosHoje),
      ],
    ];

    const csv = linhas
      .map((linha) =>
        linha
          .map((campo) => `"${String(campo).replaceAll('"', '""')}"`)
          .join(";")
      )
      .join("\n");

    const blob = new Blob([csv], {
      type: "text/csv;charset=utf-8;",
    });

    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");

    link.href = url;
    link.download = "relatorios-admin.csv";
    link.click();

    URL.revokeObjectURL(url);
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6 lg:space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            Relatórios
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Acompanhe indicadores gerais de ADMs, usuários, cidades, segmentos
            e subsegmentos.
          </p>
        </div>

        <button
          type="button"
          onClick={handleExportCSV}
          disabled={carregando || !relatorio}
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-white border border-slate-200 text-slate-700 text-sm font-medium rounded-lg hover:bg-slate-50 transition-colors shadow-sm w-full sm:w-auto disabled:opacity-60 disabled:cursor-not-allowed"
        >
          <Download className="w-4 h-4" />
          Exportar CSV
        </button>
      </div>

      <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start gap-3 shadow-sm">
        <ShieldCheck className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
        <p className="text-sm text-amber-800 leading-relaxed font-medium">
          Os relatórios exibem cadastros voluntários de usuários na plataforma.
        </p>
      </div>

      {erro && (
        <div className="bg-red-50 border border-red-100 text-red-700 px-4 py-3 rounded-xl text-sm font-medium">
          {erro}
        </div>
      )}

      {carregando && (
        <div className="bg-white border border-slate-200 rounded-xl p-10 flex flex-col items-center justify-center text-center shadow-sm">
          <div className="w-12 h-12 border-4 border-slate-100 border-t-emerald-500 rounded-full animate-spin mb-4" />
          <h3 className="text-lg font-semibold text-slate-900">
            Carregando relatórios...
          </h3>
          <p className="text-slate-500 mt-1 max-w-sm">
            Buscando os dados reais no backend.
          </p>
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
            <div className="bg-white border border-slate-200 rounded-xl shadow-sm p-5 flex flex-col justify-between">
              <div className="flex justify-between items-start mb-2">
                <p className="text-xs font-medium text-slate-500">
                  Total de usuários
                </p>
                <UserCheck className="w-4 h-4 text-emerald-600" />
              </div>
              <h3 className="text-2xl font-bold text-slate-900">
                {formatarNumero(relatorio?.totalApoiadores)}
              </h3>
            </div>

            <div className="bg-white border border-slate-200 rounded-xl shadow-sm p-5 flex flex-col justify-between">
              <div className="flex justify-between items-start mb-2">
                <p className="text-xs font-medium text-slate-500">
                  Média por ADM
                </p>
                <UsersRound className="w-4 h-4 text-blue-600" />
              </div>

              <h3 className="text-2xl font-bold text-slate-900">
                {mediaPorCandidato !== null
                  ? formatarNumero(mediaPorCandidato)
                  : "Indisponível"}
              </h3>
            </div>

            <div className="bg-white border border-slate-200 rounded-xl shadow-sm p-5 flex flex-col justify-between">
              <div className="flex justify-between items-start mb-2">
                <p className="text-xs font-medium text-slate-500">
                  Cidade líder
                </p>
                <MapPinned className="w-4 h-4 text-purple-600" />
              </div>

              <h3 className="text-xl font-bold text-slate-900 truncate">
                {formatarTexto(municipioLider)}
              </h3>
            </div>

            <div className="bg-white border border-slate-200 rounded-xl shadow-sm p-5 flex flex-col justify-between">
              <div className="flex justify-between items-start mb-2">
                <p className="text-xs font-medium text-slate-500">
                  Cadastros hoje
                </p>
                <TrendingUp className="w-4 h-4 text-emerald-600" />
              </div>

              <h3 className="text-2xl font-bold text-slate-900">
                {formatarNumero(relatorio?.cadastrosHoje)}
              </h3>
            </div>
          </>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <RankingCard
          titulo="Ranking de ADMs por usuários"
          icon={BarChart3}
          carregando={carregando}
          ranking={rankingCandidatos}
          maximo={maxCandidatos}
          emptyMessage="Nenhum ADM com usuários ainda."
          barClassName="bg-emerald-500"
        />

        <RankingCard
          titulo="Cidades com mais usuários"
          icon={MapPinned}
          carregando={carregando}
          ranking={rankingMunicipios}
          maximo={maxMunicipios}
          emptyMessage="Nenhuma cidade com usuários ainda."
          barClassName="bg-purple-500"
        />
      </div>

      <CrescimentoDiarioCard
        carregando={carregando}
        crescimentoDiario={crescimentoDiario}
      />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <RankingCard
          titulo="Segmentos com mais cadastros"
          icon={MapIcon}
          carregando={carregando}
          ranking={rankingZonas}
          maximo={maxZonas}
          emptyMessage="Nenhum segmento com usuários ainda."
          barClassName="bg-blue-500"
        />

        <RankingCard
          titulo="Subsegmentos com mais cadastros"
          icon={Landmark}
          carregando={carregando}
          ranking={rankingSecoes}
          maximo={maxSecoes}
          emptyMessage="Nenhum subsegmento com usuários ainda."
          barClassName="bg-amber-500"
        />
      </div>

      <div className="bg-slate-900 rounded-xl shadow-sm p-6 sm:p-8 text-white relative overflow-hidden">
        <div className="absolute -right-10 -top-10 opacity-10">
          <BarChart3 className="w-48 h-48" />
        </div>

        <div className="relative z-10">
          <div className="flex items-center gap-2 mb-3">
            <Info className="w-5 h-5 text-emerald-400" />
            <h2 className="text-lg font-bold text-white">
              Análises avançadas
            </h2>
          </div>

          <p className="text-sm text-slate-300 max-w-2xl leading-relaxed mb-6">
            Futuramente, esta área poderá comparar dados coletados com bases
            externas autorizadas.
          </p>

          <div className="mb-5 rounded-xl border border-slate-700 bg-slate-800/60 p-4">
            <p className="text-sm text-slate-300">
              Este indicador será exibido quando o backend fornecer os dados
              necessários.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 sm:gap-3">
            <span className="bg-slate-800 text-slate-300 border border-slate-700 px-3 py-1.5 rounded-full text-xs font-medium">
              Diferença absoluta
            </span>
            <span className="bg-slate-800 text-slate-300 border border-slate-700 px-3 py-1.5 rounded-full text-xs font-medium">
              Taxa de aderência
            </span>
            <span className="bg-slate-800 text-slate-300 border border-slate-700 px-3 py-1.5 rounded-full text-xs font-medium">
              Comparação externa
            </span>
            <span className="bg-slate-800 text-slate-300 border border-slate-700 px-3 py-1.5 rounded-full text-xs font-medium">
              Erro médio
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}