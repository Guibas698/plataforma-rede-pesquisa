"use client";

import { useEffect, useMemo, useState } from "react";
import { apiFetch } from "../../lib/api";
import { ComposableMap, Geographies, Geography } from "react-simple-maps";
import Link from "next/link";
import { obterUsuarioSalvo } from "../../lib/auth";
import {
  Filter,
  Info,
  MapPin,
  MapPinned,
  MessageCircle,
  Phone,
  RotateCcw,
  Search,
  ShieldCheck,
  UsersRound,
  X,
  ZoomIn,
  ZoomOut,
} from "lucide-react";

type MunicipioApoio = {
  nome: string;
  apoiadores: number;
  zonas: number;
  secoes: number;
};

type Apoiador = {
  id: string;
  nome: string;
  telefone: string;
  cidade: string;
  bairro: string;
  zona: number;
  secao: number;
};

type GeoProperties = {
  name?: string;
  nome?: string;
  NM_MUN?: string;
  NM_MUNICIP?: string;
  nome_municipio?: string;
};

type GeoFeature = {
  rsmKey: string;
  properties?: GeoProperties;
};

type MunicipioMapaBackend = {
  municipio?: string;
  nome?: string;
  totalApoiadores?: number;
  apoiadores?: number;
  zonasEleitorais?: number;
  zonas?: number;
  secoesEleitorais?: number;
  secoes?: number;
};

type MapaBackendResponse =
  | MunicipioMapaBackend[]
  | {
      municipios?: MunicipioMapaBackend[];
      content?: MunicipioMapaBackend[];
      dados?: MunicipioMapaBackend[];
    };

type ApoiadorBackend = {
  id: string;
  nome: string;
  telefone: string;
  municipio?: string;
  cidade?: string;
  bairro?: string;
  zona?: number;
  secao?: number;
  zonaEleitoral?: number;
  secaoEleitoral?: number;
  zona_eleitoral?: number;
  secao_eleitoral?: number;
};

type PageBackend<T> = {
  content?: T[];
  items?: T[];
  data?: T[];
};

const MAPA_URL = "/maps/ceara-municipios.json";

const LEGENDA = [
  { label: "Sem usuários", color: "#E2E8F0" },
  { label: "1 a 50", color: "#A7F3D0" },
  { label: "51 a 150", color: "#34D399" },
  { label: "151 a 400", color: "#10B981" },
  { label: "Acima de 400", color: "#059669" },
];

function normalizarTexto(texto: string) {
  return texto
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .toLowerCase();
}

function extrairMunicipiosMapa(
  response: MapaBackendResponse
): MunicipioMapaBackend[] {
  if (Array.isArray(response)) {
    return response;
  }

  if (Array.isArray(response.municipios)) {
    return response.municipios;
  }

  if (Array.isArray(response.content)) {
    return response.content;
  }

  if (Array.isArray(response.dados)) {
    return response.dados;
  }

  return [];
}

function extrairListaPaginada<T>(response: PageBackend<T> | T[]): T[] {
  if (Array.isArray(response)) {
    return response;
  }

  if (Array.isArray(response.content)) {
    return response.content;
  }

  if (Array.isArray(response.items)) {
    return response.items;
  }

  if (Array.isArray(response.data)) {
    return response.data;
  }

  return [];
}

function normalizarMunicipioBackend(item: MunicipioMapaBackend): MunicipioApoio {
  return {
    nome: item.municipio || item.nome || "Cidade não informada",
    apoiadores: item.totalApoiadores ?? item.apoiadores ?? 0,
    zonas: item.zonasEleitorais ?? item.zonas ?? 0,
    secoes: item.secoesEleitorais ?? item.secoes ?? 0,
  };
}

function normalizarApoiadorBackend(item: ApoiadorBackend): Apoiador {
  return {
    id: item.id,
    nome: item.nome ?? "Usuário sem nome",
    telefone: item.telefone ?? "",
    cidade: item.municipio || item.cidade || "Cidade não informada",
    bairro: item.bairro ?? "Bairro não informado",
    zona: item.zonaEleitoral ?? item.zona_eleitoral ?? item.zona ?? 0,
    secao: item.secaoEleitoral ?? item.secao_eleitoral ?? item.secao ?? 0,
  };
}

function obterNomeMunicipio(geo: GeoFeature) {
  return (
    geo.properties?.name ||
    geo.properties?.nome ||
    geo.properties?.NM_MUN ||
    geo.properties?.NM_MUNICIP ||
    geo.properties?.nome_municipio ||
    ""
  );
}

function buscarDadosMunicipio(
  nomeMunicipio: string,
  municipios: MunicipioApoio[]
) {
  const nomeNormalizado = normalizarTexto(nomeMunicipio);

  return municipios.find(
    (municipio) => normalizarTexto(municipio.nome) === nomeNormalizado
  );
}

function getMunicipioFill(
  nomeMunicipio: string,
  cidadeSelecionada: string | null,
  municipios: MunicipioApoio[]
) {
  const dados = buscarDadosMunicipio(nomeMunicipio, municipios);

  if (
    cidadeSelecionada &&
    normalizarTexto(cidadeSelecionada) === normalizarTexto(nomeMunicipio)
  ) {
    return "#047857";
  }

  if (!dados) {
    return "#E2E8F0";
  }

  if (dados.apoiadores <= 50) {
    return "#A7F3D0";
  }

  if (dados.apoiadores <= 150) {
    return "#34D399";
  }

  if (dados.apoiadores <= 400) {
    return "#10B981";
  }

  return "#059669";
}

function montarLinkWhatsApp(telefone: string) {
  const numeroLimpo = telefone.replace(/\D/g, "");
  return `https://wa.me/55${numeroLimpo}`;
}

export default function MapaPage() {
  const [zoom, setZoom] = useState(1);
  const [cidadeSelecionada, setCidadeSelecionada] = useState<string | null>(
    null
  );
  const [cidadeEmFoco, setCidadeEmFoco] = useState<string | null>(null);
  const [busca, setBusca] = useState("");
  const [geoData, setGeoData] = useState<Record<string, unknown> | null>(null);
  const [mapaCarregando, setMapaCarregando] = useState(true);
  const [mapaErro, setMapaErro] = useState(false);
  const [municipiosComApoiadores, setMunicipiosComApoiadores] = useState<
    MunicipioApoio[]
  >([]);

  const [apoiadores, setApoiadores] = useState<Apoiador[]>([]);
  const [dadosCarregando, setDadosCarregando] = useState(true);
  const [dadosErro, setDadosErro] = useState("");

  const usuario = obterUsuarioSalvo();
  const acessoBloqueado = usuario?.papel === "LIDER";


  
  useEffect(() => {

    if (acessoBloqueado) {
      setMapaCarregando(false);
      return;
    }

    let componenteAtivo = true;

    async function carregarMapa() {
      try {
        const resposta = await fetch(MAPA_URL);

        if (!resposta.ok) {
          throw new Error("Mapa não encontrado.");
        }

        const dados = (await resposta.json()) as Record<string, unknown>;

        if (componenteAtivo) {
          setGeoData(dados);
          setMapaErro(false);
        }
      } catch {
        if (componenteAtivo) {
          setMapaErro(true);
        }
      } finally {
        if (componenteAtivo) {
          setMapaCarregando(false);
        }
      }
    }

    carregarMapa();

    return () => {
      componenteAtivo = false;
    };
  }, [acessoBloqueado]);

  useEffect(() => {

    if (acessoBloqueado) {
      setDadosCarregando(false);
      return;
    }

    let componenteAtivo = true;

    async function carregarDadosBackend() {
      setDadosCarregando(true);
      setDadosErro("");

      try {
        const [mapaResponse, apoiadoresResponse] = await Promise.all([
          apiFetch<MapaBackendResponse>("/candidato/mapa"),
          apiFetch<PageBackend<ApoiadorBackend> | ApoiadorBackend[]>(
            "/candidato/apoiadores?page=0&size=200"
          ),
        ]);

        if (!componenteAtivo) {
          return;
        }

        const municipios = extrairMunicipiosMapa(mapaResponse).map(
          normalizarMunicipioBackend
        );

        const listaApoiadores = extrairListaPaginada(apoiadoresResponse).map(
          normalizarApoiadorBackend
        );

        setMunicipiosComApoiadores(municipios);
        setApoiadores(listaApoiadores);
      } catch (error) {
        if (!componenteAtivo) {
          return;
        }

        if (error instanceof Error) {
          setDadosErro(
            error.message || "Não foi possível carregar os dados do mapa."
          );
        } else {
          setDadosErro("Não foi possível carregar os dados do mapa.");
        }
      } finally {
        if (componenteAtivo) {
          setDadosCarregando(false);
        }
      }
    }

    carregarDadosBackend();

    return () => {
      componenteAtivo = false;
    };
  }, [acessoBloqueado]);

  const handleZoomIn = () => setZoom((prev) => Math.min(prev + 0.25, 2.5));
  const handleZoomOut = () => setZoom((prev) => Math.max(prev - 0.25, 1));
  const handleZoomReset = () => setZoom(1);

  const municipioResumo = useMemo(() => {
    if (cidadeEmFoco) {
      return buscarDadosMunicipio(cidadeEmFoco, municipiosComApoiadores);
    }

    if (cidadeSelecionada) {
      return buscarDadosMunicipio(cidadeSelecionada, municipiosComApoiadores);
    }

    return null;
  }, [cidadeEmFoco, cidadeSelecionada, municipiosComApoiadores]);

  const apoiadoresFiltrados = useMemo(() => {
    const termo = normalizarTexto(busca);

    return apoiadores.filter((apoiador) => {
      const correspondeCidade = cidadeSelecionada
        ? normalizarTexto(apoiador.cidade) === normalizarTexto(cidadeSelecionada)
        : true;

      const correspondeBusca =
        !termo ||
        normalizarTexto(apoiador.nome).includes(termo) ||
        normalizarTexto(apoiador.telefone).includes(termo) ||
        normalizarTexto(apoiador.cidade).includes(termo) ||
        normalizarTexto(apoiador.bairro).includes(termo) ||
        String(apoiador.zona).includes(termo) ||
        String(apoiador.secao).includes(termo);

      return correspondeCidade && correspondeBusca;
    });
  }, [busca, cidadeSelecionada, apoiadores]);

  function selecionarMunicipio(nomeMunicipio: string) {
    const dados = buscarDadosMunicipio(
      nomeMunicipio,
      municipiosComApoiadores
    );

    if (!dados) {
      return;
    }

    setCidadeSelecionada((cidadeAtual) =>
      cidadeAtual && normalizarTexto(cidadeAtual) === normalizarTexto(dados.nome)
        ? null
        : dados.nome
    );

    setCidadeEmFoco(dados.nome);
  }

if (acessoBloqueado) {
  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-3xl mx-auto">
      <div className="bg-white border border-slate-200 rounded-2xl p-8 text-center shadow-sm">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-50 text-amber-600">
          <MapPinned className="h-7 w-7" />
        </div>

        <h1 className="text-xl font-bold text-slate-900">
          Mapa disponível apenas para ADMs.
        </h1>

        <p className="mt-2 text-sm text-slate-500">
          Como líder, você pode acompanhar sua lista de usuários e sua rede em cascata.
        </p>

        <Link
          href="/adm"
          className="mt-6 inline-flex items-center justify-center rounded-xl bg-slate-900 px-5 py-3 text-sm font-bold text-white transition hover:bg-slate-800"
        >
          Voltar ao dashboard
        </Link>
      </div>
    </div>
  );
}

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <MapPinned className="w-6 h-6 text-emerald-600" />
            Mapa de Usuários
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Visualize as cidades onde há usuários cadastrados.
          </p>
        </div>

        <div className="inline-flex items-center justify-center gap-2 px-3 py-2 bg-emerald-50 border border-emerald-100 text-emerald-700 rounded-xl text-sm font-bold w-fit">
          <UsersRound className="w-4 h-4" />
          {municipiosComApoiadores.length} cidades ativas
        </div>
      </div>

      {dadosErro && (
        <div className="bg-red-50 border border-red-100 text-red-700 px-4 py-3 rounded-xl text-sm font-medium">
          {dadosErro}
        </div>
      )}

      {dadosCarregando && (
        <div className="bg-white border border-slate-200 rounded-xl p-4 text-sm text-slate-500 shadow-sm">
          Carregando dados dos usuários...
        </div>
      )}

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50">
          <div>
            <span className="text-sm font-bold text-slate-900">
              Mapa de regiões
            </span>
            <p className="text-xs text-slate-500 mt-0.5">
              Clique em uma cidade colorida para filtrar a lista.
            </p>
          </div>

          <div className="flex bg-white border border-slate-200 rounded-lg shadow-sm overflow-hidden w-fit">
            <button
              type="button"
              onClick={handleZoomOut}
              disabled={zoom <= 1}
              className="p-2 text-slate-600 hover:bg-slate-50 hover:text-emerald-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors border-r border-slate-200"
              title="Diminuir zoom"
            >
              <ZoomOut className="w-5 h-5" />
            </button>

            <button
              type="button"
              onClick={handleZoomReset}
              className="p-2 text-slate-600 hover:bg-slate-50 hover:text-emerald-600 transition-colors border-r border-slate-200"
              title="Resetar zoom"
            >
              <RotateCcw className="w-5 h-5" />
            </button>

            <button
              type="button"
              onClick={handleZoomIn}
              disabled={zoom >= 2.5}
              className="p-2 text-slate-600 hover:bg-slate-50 hover:text-emerald-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              title="Aumentar zoom"
            >
              <ZoomIn className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div
          className={`relative h-[430px] sm:h-[520px] w-full bg-slate-50 ${
            zoom > 1 ? "overflow-auto" : "overflow-hidden"
          }`}
        >
          {mapaCarregando && (
            <div className="h-full flex flex-col items-center justify-center text-center p-6">
              <MapPinned className="w-10 h-10 text-slate-300 mb-3" />
              <p className="text-sm font-medium text-slate-600">
                Carregando mapa de regiões...
              </p>
            </div>
          )}

          {!mapaCarregando && (mapaErro || !geoData) && (
            <div className="h-full flex flex-col items-center justify-center text-center p-6">
              <Info className="w-10 h-10 text-slate-300 mb-3" />
              <p className="text-sm font-semibold text-slate-900">
                Mapa ainda não carregado.
              </p>
              <p className="text-sm text-slate-500 mt-1 max-w-md">
                Adicione o arquivo{" "}
                <span className="font-mono text-slate-700">
                  public/maps/ceara-municipios.json
                </span>
                .
              </p>
            </div>
          )}

          {!mapaCarregando && geoData && !mapaErro && (
            <div
              className="transition-transform duration-300 ease-out origin-center"
              style={{
                transform: `scale(${zoom})`,
                transformOrigin: "center center",
                minWidth: zoom > 1 ? `${zoom * 100}%` : "100%",
                minHeight: zoom > 1 ? `${zoom * 430}px` : "100%",
              }}
            >
              <ComposableMap
                projection="geoMercator"
                projectionConfig={{
                  center: [-39.5, -5.2],
                  scale: 4700,
                }}
                width={720}
                height={520}
                className="w-full h-[430px] sm:h-[520px]"
              >
                <Geographies geography={geoData}>
                  {({ geographies }) =>
                    geographies.map((geo: GeoFeature) => {
                      const nomeMunicipio = obterNomeMunicipio(geo);
                      const dadosMunicipio = buscarDadosMunicipio(
                        nomeMunicipio,
                        municipiosComApoiadores
                      );
                      const selecionado =
                        cidadeSelecionada &&
                        normalizarTexto(cidadeSelecionada) ===
                          normalizarTexto(nomeMunicipio);

                      return (
                        <Geography
                          key={geo.rsmKey}
                          geography={geo}
                          onMouseEnter={() => {
                            if (dadosMunicipio) {
                              setCidadeEmFoco(dadosMunicipio.nome);
                            }
                          }}
                          onMouseLeave={() => setCidadeEmFoco(null)}
                          onClick={() => selecionarMunicipio(nomeMunicipio)}
                          style={{
                            default: {
                              fill: getMunicipioFill(
                                nomeMunicipio,
                                cidadeSelecionada,
                                municipiosComApoiadores
                              ),
                              stroke: selecionado ? "#064E3B" : "#FFFFFF",
                              strokeWidth: selecionado ? 1.4 : 0.6,
                              outline: "none",
                              cursor: dadosMunicipio ? "pointer" : "default",
                            },
                            hover: {
                              fill: dadosMunicipio ? "#065F46" : "#CBD5E1",
                              stroke: "#FFFFFF",
                              strokeWidth: 1,
                              outline: "none",
                              cursor: dadosMunicipio ? "pointer" : "default",
                            },
                            pressed: {
                              fill: "#047857",
                              stroke: "#064E3B",
                              strokeWidth: 1.4,
                              outline: "none",
                            },
                          }}
                        />
                      );
                    })
                  }
                </Geographies>
              </ComposableMap>
            </div>
          )}
        </div>

        {municipioResumo && (
          <div className="border-t border-slate-100 bg-white p-4">
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
              <div>
                <p className="text-xs font-medium text-slate-500">Cidade</p>
                <p className="font-bold text-slate-900 mt-0.5">
                  {municipioResumo.nome}
                </p>
              </div>

              <div>
                <p className="text-xs font-medium text-slate-500">
                  Total de usuários
                </p>
                <p className="font-bold text-emerald-600 mt-0.5">
                  {municipioResumo.apoiadores.toLocaleString("pt-BR")}
                </p>
              </div>

              <div>
                <p className="text-xs font-medium text-slate-500">Segmentos</p>
                <p className="font-bold text-slate-900 mt-0.5">
                  {municipioResumo.zonas}
                </p>
              </div>

              <div>
                <p className="text-xs font-medium text-slate-500">
                  Subsegmentos
                </p>
                <p className="font-bold text-slate-900 mt-0.5">
                  {municipioResumo.secoes}
                </p>
              </div>
            </div>

            <p className="text-xs text-slate-500 mt-3">
              Clique para filtrar a lista.
            </p>
          </div>
        )}

        {!dadosCarregando &&
          !municipioResumo &&
          municipiosComApoiadores.length === 0 && (
            <div className="border-t border-slate-100 bg-white p-4">
              <p className="text-sm font-medium text-slate-600">
                Nenhuma cidade com usuários ainda.
              </p>
            </div>
          )}

        <div className="border-t border-slate-100 bg-slate-50 p-4">
          <div className="flex flex-wrap gap-3">
            {LEGENDA.map((item) => (
              <div key={item.label} className="flex items-center gap-2">
                <span
                  className="w-4 h-4 rounded border border-white shadow-sm"
                  style={{ backgroundColor: item.color }}
                />
                <span className="text-xs font-medium text-slate-600">
                  {item.label}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
        <div className="p-5 border-b border-slate-100 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <h3 className="font-bold text-slate-900 flex items-center gap-2">
              <UsersRound className="w-5 h-5 text-emerald-600" />
              Usuários na região
            </h3>
            <p className="text-sm text-slate-500 mt-0.5">
              {cidadeSelecionada
                ? `Mostrando usuários de ${cidadeSelecionada}`
                : "Mostrando todos os usuários"}
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            {cidadeSelecionada && (
              <button
                type="button"
                onClick={() => setCidadeSelecionada(null)}
                className="inline-flex items-center justify-center gap-1.5 px-3 py-2 bg-red-50 text-red-600 border border-red-100 text-sm font-medium rounded-lg hover:bg-red-100 transition-colors"
              >
                <X className="w-4 h-4" />
                Limpar filtro
              </button>
            )}

            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-4 w-4 text-slate-400" />
              </div>

              <input
                type="text"
                placeholder="Buscar na lista..."
                value={busca}
                onChange={(e) => setBusca(e.target.value)}
                className="h-11 w-full sm:w-72 rounded-xl border border-slate-200 bg-white pl-10 pr-4 text-sm text-slate-900 placeholder:text-slate-400 outline-none transition focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100"
              />
            </div>
          </div>
        </div>

        <div className="divide-y divide-slate-100 max-h-[460px] overflow-y-auto">
          {apoiadoresFiltrados.length > 0 ? (
            apoiadoresFiltrados.map((apoiador) => (
              <div
                key={apoiador.id}
                className="p-4 hover:bg-slate-50 transition-colors flex flex-col lg:flex-row lg:items-center justify-between gap-4"
              >
                <div className="min-w-0">
                  <p className="font-semibold text-slate-900">
                    {apoiador.nome}
                  </p>

                  <div className="flex items-center gap-2 text-sm text-slate-500 mt-1">
                    <Phone className="w-4 h-4 text-slate-400 shrink-0" />
                    <span>{apoiador.telefone}</span>

                    <a
                      href={montarLinkWhatsApp(apoiador.telefone)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center justify-center w-7 h-7 rounded-md text-emerald-600 hover:bg-emerald-50 hover:text-emerald-700 transition-colors"
                      aria-label={`Enviar WhatsApp para ${apoiador.nome}`}
                    >
                      <MessageCircle className="w-4 h-4" />
                    </a>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-2 sm:items-center">
                  <div className="flex items-center gap-1.5 text-sm font-medium text-slate-600 bg-slate-100 px-3 py-1.5 rounded-md w-fit">
                    <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span className="truncate">
                      {apoiador.cidade} - {apoiador.bairro}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-xs font-medium text-slate-600 bg-emerald-50 text-emerald-700 px-2.5 py-1.5 rounded-md">
                      Segmento {apoiador.zona}
                    </span>
                    <span className="text-xs font-medium text-slate-600 bg-blue-50 text-blue-700 px-2.5 py-1.5 rounded-md">
                      Subsegmento {apoiador.secao}
                    </span>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="p-10 text-center flex flex-col items-center justify-center">
              <Filter className="w-10 h-10 text-slate-300 mb-3" />
              <p className="text-slate-900 font-semibold">
                Nenhum usuário encontrado
              </p>
              <p className="text-sm text-slate-500 mt-1">
                {cidadeSelecionada
                  ? "Nenhum usuário encontrado para a cidade selecionada."
                  : "Nenhum usuário cadastrado ainda."}
              </p>
            </div>
          )}
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4 flex items-start gap-3">
        <ShieldCheck className="w-5 h-5 text-slate-400 shrink-0 mt-0.5" />
        <p className="text-sm text-slate-500">
          O mapa representa cadastros voluntários de usuários e serve apenas
          para visualização interna.
        </p>
      </div>
    </div>
  );
}