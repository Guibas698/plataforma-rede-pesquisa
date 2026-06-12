"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  Search,
  Plus,
  Copy,
  Check,
  Eye,
  UsersRound,
  MapPin,
  Phone,
  Mail,
  Calendar,
  MessageCircle,
} from "lucide-react";

import { apiFetch } from "../../lib/api";

type AdminCandidatoResumoResponse = {
  id: string;
  nomePublico: string;
  nomeUsuario: string;
  email: string;
  telefone: string;
  municipioBase: string;
  partido?: string;
  numeroUrna?: string;
  cargoPretendido: string;
  totalApoiadores: number;
  ativo: boolean;
  criadoEm: string;
  linkCadastro?: string;
};

type PageResponse<T> = {
  content: T[];
  totalElements: number;
  totalPages: number;
  number: number;
  size: number;
};

type FiltroStatus = "TODOS" | "ATIVO" | "INATIVO";

function formatarNumero(valor?: number | null): string {
  return (valor ?? 0).toLocaleString("pt-BR");
}

function formatarData(data?: string | null): string {
  if (!data) {
    return "Não informado";
  }

  try {
    return new Intl.DateTimeFormat("pt-BR").format(new Date(data));
  } catch {
    return "Não informado";
  }
}

export default function CandidatosPage() {
  const [candidatos, setCandidatos] = useState<
    AdminCandidatoResumoResponse[]
  >([]);

  const [busca, setBusca] = useState("");
  const [filtroStatus, setFiltroStatus] = useState<FiltroStatus>("TODOS");
  const [copiadoId, setCopiadoId] = useState<string | null>(null);

  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState("");

  const [page, setPage] = useState(0);
  const [size] = useState(20);
  const [totalElements, setTotalElements] = useState(0);
  const [totalPages, setTotalPages] = useState(0);

  useEffect(() => {
    let montado = true;

    async function carregarCandidatos() {
      setCarregando(true);
      setErro("");

      try {
        const response = await apiFetch<
          PageResponse<AdminCandidatoResumoResponse>
        >(`/admin/candidatos?page=${page}&size=${size}`);

        if (!montado) {
          return;
        }

        setCandidatos(response.content ?? []);
        setTotalElements(response.totalElements ?? 0);
        setTotalPages(response.totalPages ?? 0);
      } catch (error) {
        if (!montado) {
          return;
        }

        if (error instanceof Error) {
          setErro(error.message || "Não foi possível carregar os ADMs.");
        } else {
          setErro("Não foi possível carregar os ADMs.");
        }
      } finally {
        if (montado) {
          setCarregando(false);
        }
      }
    }

    carregarCandidatos();

    return () => {
      montado = false;
    };
  }, [page, size]);

  const candidatosFiltrados = useMemo(() => {
    const termoBusca = busca.trim().toLowerCase();

    return candidatos.filter((candidato) => {
      const matchBusca =
        !termoBusca ||
        candidato.nomePublico?.toLowerCase().includes(termoBusca) ||
        candidato.nomeUsuario?.toLowerCase().includes(termoBusca) ||
        candidato.email?.toLowerCase().includes(termoBusca) ||
        candidato.telefone?.toLowerCase().includes(termoBusca) ||
        candidato.municipioBase?.toLowerCase().includes(termoBusca);

      const matchStatus =
        filtroStatus === "TODOS" ||
        (filtroStatus === "ATIVO" && candidato.ativo) ||
        (filtroStatus === "INATIVO" && !candidato.ativo);

      return matchBusca && matchStatus;
    });
  }, [busca, candidatos, filtroStatus]);

  const handleCopiarLink = async (
    id: string,
    codigoLinkCadastro?: string
  ) => {
    if (!codigoLinkCadastro || typeof window === "undefined") {
      return;
    }

    const linkCompleto = `${window.location.origin}/cadastro/${codigoLinkCadastro}`;

    try {
      await navigator.clipboard.writeText(linkCompleto);
      setCopiadoId(id);
      setTimeout(() => setCopiadoId(null), 2000);
    } catch {
      setErro("Não foi possível copiar o link de convite.");
    }
  };

  const montarLinkWhatsApp = (telefone: string) => {
    const numeroLimpo = telefone.replace(/\D/g, "");
    return `https://wa.me/55${numeroLimpo}`;
  };

  const irParaPaginaAnterior = () => {
    if (page > 0) {
      setPage((paginaAtual) => paginaAtual - 1);
    }
  };

  const irParaProximaPagina = () => {
    if (page + 1 < totalPages) {
      setPage((paginaAtual) => paginaAtual + 1);
    }
  };

  const limparFiltros = () => {
    setBusca("");
    setFiltroStatus("TODOS");
  };

  const semCandidatos = !carregando && !erro && candidatos.length === 0;
  const semResultadoFiltro =
    !carregando &&
    !erro &&
    candidatos.length > 0 &&
    candidatosFiltrados.length === 0;

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6 lg:space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            ADMs
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Gerencie os ADMs cadastrados e seus links de convite.
          </p>
        </div>

        <Link
          href="/admin/candidatos/novo"
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-emerald-600 text-white text-sm font-medium rounded-lg hover:bg-emerald-700 transition-colors shadow-sm focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 w-full sm:w-auto"
        >
          <Plus className="w-4 h-4" />
          Novo ADM
        </Link>
      </div>

      <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
        <div className="relative w-full lg:max-w-md">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-5 w-5 text-slate-400" />
          </div>

          <input
            type="text"
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            placeholder="Buscar por nome, e-mail, telefone ou cidade..."
            className="block w-full pl-10 pr-3 py-2 border border-slate-200 rounded-lg text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent sm:text-sm transition-colors"
          />
        </div>

        <div className="flex items-center gap-2 w-full lg:w-auto overflow-x-auto pb-1 lg:pb-0">
          {(["TODOS", "ATIVO", "INATIVO"] as FiltroStatus[]).map((status) => (
            <button
              key={status}
              type="button"
              onClick={() => setFiltroStatus(status)}
              className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
                filtroStatus === status
                  ? "bg-slate-900 text-white shadow-sm"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              {status === "TODOS"
                ? "Todos"
                : status === "ATIVO"
                ? "Ativos"
                : "Inativos"}
            </button>
          ))}
        </div>
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
            Carregando ADMs...
          </h3>
          <p className="text-slate-500 mt-1 max-w-sm">
            Buscando os dados reais no backend.
          </p>
        </div>
      )}

      {semCandidatos && (
        <div className="bg-white border border-slate-200 rounded-xl p-12 flex flex-col items-center justify-center text-center shadow-sm">
          <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-4">
            <Search className="w-8 h-8 text-slate-400" />
          </div>

          <h3 className="text-lg font-semibold text-slate-900">
            Nenhum ADM cadastrado
          </h3>

          <p className="text-slate-500 mt-1 max-w-sm">
            Cadastre o primeiro ADM para começar.
          </p>

          <Link
            href="/admin/candidatos/novo"
            className="mt-6 inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-emerald-600 text-white text-sm font-medium rounded-lg hover:bg-emerald-700 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Novo ADM
          </Link>
        </div>
      )}

      {semResultadoFiltro && (
        <div className="bg-white border border-slate-200 rounded-xl p-12 flex flex-col items-center justify-center text-center shadow-sm">
          <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-4">
            <Search className="w-8 h-8 text-slate-400" />
          </div>

          <h3 className="text-lg font-semibold text-slate-900">
            Nenhum ADM encontrado
          </h3>

          <p className="text-slate-500 mt-1 max-w-sm">
            Tente ajustar a sua busca ou alterar os filtros aplicados para
            encontrar o que procura.
          </p>

          <button
            type="button"
            onClick={limparFiltros}
            className="mt-6 text-sm font-medium text-emerald-600 hover:text-emerald-700 transition-colors"
          >
            Limpar filtros
          </button>
        </div>
      )}

      {!carregando && !erro && candidatosFiltrados.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {candidatosFiltrados.map((candidato) => (
            <div
              key={candidato.id}
              className="bg-white border border-slate-200 rounded-xl shadow-sm hover:shadow-md transition-shadow flex flex-col overflow-hidden"
            >
              <div className="p-5 border-b border-slate-100 flex justify-between items-start">
                <div>
                  <h3
                    className="font-bold text-slate-900 text-lg truncate pr-4"
                    title={candidato.nomePublico}
                  >
                    {candidato.nomePublico}
                  </h3>

                  <p className="text-sm text-slate-500 mt-0.5">
                    {candidato.nomeUsuario}
                    {candidato.partido ? ` • ${candidato.partido}` : ""}
                  </p>
                </div>

                <span
                  className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${
                    candidato.ativo
                      ? "bg-emerald-50 text-emerald-700 border border-emerald-100"
                      : "bg-slate-100 text-slate-600 border border-slate-200"
                  }`}
                >
                  {candidato.ativo ? "Ativo" : "Inativo"}
                </span>
              </div>

              <div className="p-5 space-y-3 flex-1">
                <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg border border-slate-100 mb-4">
                  <div className="bg-emerald-100 p-2 rounded-md">
                    <UsersRound className="w-5 h-5 text-emerald-700" />
                  </div>

                  <div>
                    <p className="text-xs text-slate-500 font-medium">
                      Usuários cadastrados
                    </p>
                    <p className="text-lg font-bold text-slate-900 leading-none mt-1">
                      {formatarNumero(candidato.totalApoiadores)}
                    </p>
                  </div>
                </div>

                <div className="space-y-2.5">
                  <div className="flex items-center gap-2.5 text-sm text-slate-600">
                    <Phone className="w-4 h-4 text-slate-400 shrink-0" />
                    <span>{candidato.telefone}</span>

                    <a
                      href={montarLinkWhatsApp(candidato.telefone)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex h-7 w-7 items-center justify-center rounded-lg text-emerald-600 transition-colors hover:bg-emerald-50 hover:text-emerald-700"
                      aria-label={`Enviar WhatsApp para ${candidato.nomePublico}`}
                    >
                      <MessageCircle className="w-4 h-4" />
                    </a>
                  </div>

                  <div className="flex items-center gap-2.5 text-sm text-slate-600">
                    <MapPin className="w-4 h-4 text-slate-400 shrink-0" />
                    <span className="truncate">{candidato.municipioBase}</span>
                  </div>

                  <div className="flex items-center gap-2.5 text-sm text-slate-600">
                    <Mail className="w-4 h-4 text-slate-400 shrink-0" />
                    <span className="truncate">{candidato.email}</span>
                  </div>

                  <div className="flex items-center gap-2.5 text-sm text-slate-600">
                    <Calendar className="w-4 h-4 text-slate-400 shrink-0" />
                    <span>Cadastrado em {formatarData(candidato.criadoEm)}</span>
                  </div>
                </div>
              </div>

              <div className="p-4 border-t border-slate-100 bg-slate-50 flex gap-3">
                <Link
                  href={`/admin/candidatos/${candidato.id}`}
                  className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-white border border-slate-200 text-slate-700 text-sm font-medium rounded-lg hover:bg-slate-50 hover:text-slate-900 transition-colors shadow-sm"
                >
                  <Eye className="w-4 h-4" />
                  Detalhes
                </Link>

                <button
                  type="button"
                  onClick={() =>
                    handleCopiarLink(candidato.id, candidato.linkCadastro)
                  }
                  disabled={!candidato.linkCadastro}
                  className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 border text-sm font-medium rounded-lg transition-all shadow-sm disabled:opacity-50 disabled:cursor-not-allowed ${
                    copiadoId === candidato.id
                      ? "bg-emerald-50 border-emerald-200 text-emerald-700"
                      : "bg-white border-slate-200 text-emerald-600 hover:bg-emerald-50 hover:border-emerald-200"
                  }`}
                >
                  {copiadoId === candidato.id ? (
                    <>
                      <Check className="w-4 h-4" />
                      Copiado!
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4" />
                      Copiar convite
                    </>
                  )}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {!carregando && !erro && totalElements > 0 && (
        <div className="flex flex-col sm:flex-row items-center justify-between border-t border-slate-200 pt-6 gap-4">
          <p className="text-sm text-slate-500">
            Mostrando{" "}
            <span className="font-medium text-slate-900">
              {formatarNumero(candidatosFiltrados.length)}
            </span>{" "}
            de{" "}
            <span className="font-medium text-slate-900">
              {formatarNumero(totalElements)}
            </span>{" "}
            ADMs
          </p>

          <div className="flex gap-2">
            <button
              type="button"
              onClick={irParaPaginaAnterior}
              disabled={page <= 0}
              className="px-4 py-2 border border-slate-200 rounded-lg text-sm font-medium text-slate-700 bg-white hover:bg-slate-50 disabled:text-slate-400 disabled:bg-slate-50 disabled:cursor-not-allowed transition-colors"
            >
              Anterior
            </button>

            <button
              type="button"
              onClick={irParaProximaPagina}
              disabled={page + 1 >= totalPages}
              className="px-4 py-2 border border-slate-200 rounded-lg text-sm font-medium text-slate-700 bg-white hover:bg-slate-50 disabled:text-slate-400 disabled:bg-slate-50 disabled:cursor-not-allowed transition-colors"
            >
              Próxima
            </button>
          </div>
        </div>
      )}
    </div>
  );
}