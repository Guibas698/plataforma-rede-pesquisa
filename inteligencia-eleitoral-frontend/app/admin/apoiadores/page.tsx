"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Search,
  UserCheck,
  UsersRound,
  MapPinned,
  TrendingUp,
  Phone,
  MapPin,
  Calendar,
  ShieldCheck,
  MessageCircle,
  Mail,
} from "lucide-react";

import { apiFetch } from "../../lib/api";

type AdminApoiadorResumoResponse = {
  id: string;
  nome: string;
  email?: string;
  telefone: string;
  candidatoNome: string;
  municipio: string;
  bairro: string;
  zonaEleitoral: number;
  secaoEleitoral: number;
  status: string;
  criadoEm: string;
};

type AdminRankingItemResponse = {
  nome: string;
  total: number;
};

type AdminRelatorioResumoResponse = {
  totalApoiadores: number;
  totalCandidatos: number;
  municipiosAlcancados: number;
  cadastrosHoje: number;
  rankingCandidatos: AdminRankingItemResponse[];
};

type PageResponse<T> = {
  content: T[];
  totalElements: number;
  totalPages: number;
  number: number;
  size: number;
};

function formatarNumero(valor?: number | null): string {
  return (valor ?? 0).toLocaleString("pt-BR");
}

function formatarTexto(valor?: string | number | null): string {
  if (valor === null || valor === undefined) {
    return "Não informado";
  }

  const texto = String(valor).trim();

  return texto ? texto : "Não informado";
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

function montarLinkWhatsApp(telefone: string) {
  const numeroLimpo = telefone.replace(/\D/g, "");
  return `https://wa.me/55${numeroLimpo}`;
}

function gerarOpcoesUnicas(
  apoiadores: AdminApoiadorResumoResponse[],
  campo: "candidatoNome" | "municipio" | "status"
) {
  return Array.from(
    new Set(
      apoiadores
        .map((apoiador) => apoiador[campo])
        .filter((valor) => valor && String(valor).trim())
    )
  ).sort((a, b) => String(a).localeCompare(String(b), "pt-BR"));
}

function obterClassesStatus(status?: string | null) {
  const statusNormalizado = String(status ?? "").toUpperCase();

  if (statusNormalizado === "ATIVO") {
    return "bg-emerald-50 text-emerald-700 border border-emerald-100";
  }

  if (statusNormalizado === "PENDENTE") {
    return "bg-amber-50 text-amber-700 border border-amber-100";
  }

  return "bg-slate-100 text-slate-600 border border-slate-200";
}

function obterTextoStatus(status?: string | null) {
  const statusNormalizado = String(status ?? "").toUpperCase();

  if (statusNormalizado === "ATIVO") {
    return "Ativo";
  }

  if (statusNormalizado === "PENDENTE") {
    return "Pendente";
  }

  if (statusNormalizado === "INATIVO") {
    return "Inativo";
  }

  return formatarTexto(status);
}

export default function ApoiadoresPage() {
  const [apoiadores, setApoiadores] = useState<AdminApoiadorResumoResponse[]>(
    []
  );

  const [relatorio, setRelatorio] =
    useState<AdminRelatorioResumoResponse | null>(null);

  const [busca, setBusca] = useState("");
  const [filtroCandidato, setFiltroCandidato] = useState("TODOS");
  const [filtroMunicipio, setFiltroMunicipio] = useState("TODOS");
  const [filtroStatus, setFiltroStatus] = useState("TODOS");

  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState("");

  const [page, setPage] = useState(0);
  const [size] = useState(20);
  const [totalElements, setTotalElements] = useState(0);
  const [totalPages, setTotalPages] = useState(0);

  useEffect(() => {
    let montado = true;

    async function carregarDados() {
      setCarregando(true);
      setErro("");

      try {
        const [apoiadoresResponse, relatorioResponse] = await Promise.all([
          apiFetch<PageResponse<AdminApoiadorResumoResponse>>(
            `/admin/apoiadores?page=${page}&size=${size}`
          ),
          apiFetch<AdminRelatorioResumoResponse>("/admin/relatorios").catch(
            () => null
          ),
        ]);

        if (!montado) {
          return;
        }

        setApoiadores(apoiadoresResponse.content ?? []);
        setTotalElements(apoiadoresResponse.totalElements ?? 0);
        setTotalPages(apoiadoresResponse.totalPages ?? 0);

        if (relatorioResponse) {
          setRelatorio({
            totalApoiadores: relatorioResponse.totalApoiadores ?? 0,
            totalCandidatos: relatorioResponse.totalCandidatos ?? 0,
            municipiosAlcancados: relatorioResponse.municipiosAlcancados ?? 0,
            cadastrosHoje: relatorioResponse.cadastrosHoje ?? 0,
            rankingCandidatos: relatorioResponse.rankingCandidatos ?? [],
          });
        }
      } catch (error) {
        if (!montado) {
          return;
        }

        if (error instanceof Error) {
          setErro(error.message || "Não foi possível carregar usuários.");
        } else {
          setErro("Não foi possível carregar usuários.");
        }
      } finally {
        if (montado) {
          setCarregando(false);
        }
      }
    }

    carregarDados();

    return () => {
      montado = false;
    };
  }, [page, size]);

  const candidatosDisponiveis = useMemo(() => {
    return gerarOpcoesUnicas(apoiadores, "candidatoNome");
  }, [apoiadores]);

  const municipiosDisponiveis = useMemo(() => {
    return gerarOpcoesUnicas(apoiadores, "municipio");
  }, [apoiadores]);

  const statusDisponiveis = useMemo(() => {
    return gerarOpcoesUnicas(apoiadores, "status");
  }, [apoiadores]);

  const apoiadoresFiltrados = useMemo(() => {
    const termo = busca.trim().toLowerCase();

    return apoiadores.filter((apoiador) => {
      const zona = String(apoiador.zonaEleitoral ?? "");
      const secao = String(apoiador.secaoEleitoral ?? "");

      const matchBusca =
        !termo ||
        apoiador.nome?.toLowerCase().includes(termo) ||
        apoiador.email?.toLowerCase().includes(termo) ||
        apoiador.telefone?.toLowerCase().includes(termo) ||
        apoiador.candidatoNome?.toLowerCase().includes(termo) ||
        apoiador.municipio?.toLowerCase().includes(termo) ||
        apoiador.bairro?.toLowerCase().includes(termo) ||
        zona.includes(termo) ||
        secao.includes(termo);

      const matchCandidato =
        filtroCandidato === "TODOS" ||
        apoiador.candidatoNome === filtroCandidato;

      const matchMunicipio =
        filtroMunicipio === "TODOS" || apoiador.municipio === filtroMunicipio;

      const matchStatus =
        filtroStatus === "TODOS" || apoiador.status === filtroStatus;

      return matchBusca && matchCandidato && matchMunicipio && matchStatus;
    });
  }, [apoiadores, busca, filtroCandidato, filtroMunicipio, filtroStatus]);

  const resumoLocal = useMemo(() => {
    const candidatosComApoiadores = new Set(
      apoiadores.map((apoiador) => apoiador.candidatoNome).filter(Boolean)
    ).size;

    const municipiosAlcancados = new Set(
      apoiadores.map((apoiador) => apoiador.municipio).filter(Boolean)
    ).size;

    const hoje = new Date();

    const cadastrosHoje = apoiadores.filter((apoiador) => {
      if (!apoiador.criadoEm) {
        return false;
      }

      const data = new Date(apoiador.criadoEm);

      return (
        data.getDate() === hoje.getDate() &&
        data.getMonth() === hoje.getMonth() &&
        data.getFullYear() === hoje.getFullYear()
      );
    }).length;

    return {
      candidatosComApoiadores,
      municipiosAlcancados,
      cadastrosHoje,
    };
  }, [apoiadores]);

  const resumo = {
    totalApoiadores: relatorio?.totalApoiadores ?? totalElements,
    candidatosComApoiadores:
      relatorio?.rankingCandidatos?.length ??
      resumoLocal.candidatosComApoiadores,
    municipiosAlcancados:
      relatorio?.municipiosAlcancados ?? resumoLocal.municipiosAlcancados,
    cadastrosHoje: relatorio?.cadastrosHoje ?? resumoLocal.cadastrosHoje,
  };

  function limparFiltros() {
    setBusca("");
    setFiltroCandidato("TODOS");
    setFiltroMunicipio("TODOS");
    setFiltroStatus("TODOS");
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6 lg:space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
          Usuários
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          Consulte os usuários cadastrados por ADM, cidade, segmento e
          subsegmento.
        </p>
      </div>

      <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 flex items-start gap-3 shadow-sm">
        <ShieldCheck className="w-5 h-5 text-slate-500 shrink-0 mt-0.5" />
        <p className="text-sm text-slate-600 leading-relaxed">
          Os dados exibidos representam cadastros voluntários de usuários e
          devem ser tratados conforme a política de privacidade.
        </p>
      </div>

      {erro && (
        <div className="bg-red-50 border border-red-100 text-red-700 px-4 py-3 rounded-xl text-sm font-medium">
          {erro}
        </div>
      )}

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white border border-slate-200 rounded-xl shadow-sm p-5 flex flex-col justify-between">
          <div className="flex justify-between items-start mb-2">
            <p className="text-xs font-medium text-slate-500">
              Total de usuários
            </p>
            <UserCheck className="w-4 h-4 text-emerald-600" />
          </div>
          <h3 className="text-2xl font-bold text-slate-900">
            {carregando ? "..." : formatarNumero(resumo.totalApoiadores)}
          </h3>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl shadow-sm p-5 flex flex-col justify-between">
          <div className="flex justify-between items-start mb-2">
            <p className="text-xs font-medium text-slate-500">Com usuários</p>
            <UsersRound className="w-4 h-4 text-blue-600" />
          </div>
          <h3 className="text-2xl font-bold text-slate-900">
            {carregando ? "..." : formatarNumero(resumo.candidatosComApoiadores)}
            <span className="text-sm font-medium text-slate-500"> ADMs</span>
          </h3>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl shadow-sm p-5 flex flex-col justify-between">
          <div className="flex justify-between items-start mb-2">
            <p className="text-xs font-medium text-slate-500">
              Cidades alcançadas
            </p>
            <MapPinned className="w-4 h-4 text-purple-600" />
          </div>
          <h3 className="text-2xl font-bold text-slate-900">
            {carregando ? "..." : formatarNumero(resumo.municipiosAlcancados)}
          </h3>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl shadow-sm p-5 flex flex-col justify-between">
          <div className="flex justify-between items-start mb-2">
            <p className="text-xs font-medium text-slate-500">
              Cadastros hoje
            </p>
            <TrendingUp className="w-4 h-4 text-amber-600" />
          </div>
          <h3 className="text-2xl font-bold text-slate-900">
            {carregando ? "..." : formatarNumero(resumo.cadastrosHoje)}
          </h3>
        </div>
      </div>

      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col lg:flex-row gap-4">
        <div className="relative flex-1">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-5 w-5 text-slate-400" />
          </div>
          <input
            type="text"
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            placeholder="Buscar por nome, telefone, cidade, segmento ou subsegmento..."
            className="block w-full pl-10 pr-3 py-2.5 border border-slate-200 rounded-lg text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent sm:text-sm transition-colors"
          />
        </div>

        <div className="flex flex-col sm:flex-row gap-4 lg:w-auto">
          <select
            value={filtroCandidato}
            onChange={(e) => setFiltroCandidato(e.target.value)}
            className="block w-full sm:w-48 px-3 py-2.5 border border-slate-200 rounded-lg text-slate-700 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-colors sm:text-sm"
          >
            <option value="TODOS">Todos os ADMs</option>
            {candidatosDisponiveis.map((candidato) => (
              <option key={candidato} value={candidato}>
                {candidato}
              </option>
            ))}
          </select>

          <select
            value={filtroMunicipio}
            onChange={(e) => setFiltroMunicipio(e.target.value)}
            className="block w-full sm:w-48 px-3 py-2.5 border border-slate-200 rounded-lg text-slate-700 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-colors sm:text-sm"
          >
            <option value="TODOS">Todas as cidades</option>
            {municipiosDisponiveis.map((municipio) => (
              <option key={municipio} value={municipio}>
                {municipio}
              </option>
            ))}
          </select>

          <select
            value={filtroStatus}
            onChange={(e) => setFiltroStatus(e.target.value)}
            className="block w-full sm:w-40 px-3 py-2.5 border border-slate-200 rounded-lg text-slate-700 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-colors sm:text-sm"
          >
            <option value="TODOS">Todos os status</option>
            {statusDisponiveis.map((status) => (
              <option key={status} value={status}>
                {obterTextoStatus(status)}
              </option>
            ))}
          </select>
        </div>
      </div>

      {carregando ? (
        <div className="bg-white border border-slate-200 rounded-xl p-12 flex flex-col items-center justify-center text-center shadow-sm">
          <div className="w-12 h-12 border-4 border-slate-100 border-t-emerald-500 rounded-full animate-spin mb-4" />
          <h3 className="text-lg font-semibold text-slate-900">
            Carregando usuários...
          </h3>
          <p className="text-slate-500 mt-1 max-w-sm">
            Buscando os dados reais no backend.
          </p>
        </div>
      ) : apoiadoresFiltrados.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-xl p-12 flex flex-col items-center justify-center text-center shadow-sm">
          <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-4">
            <Search className="w-8 h-8 text-slate-400" />
          </div>
          <h3 className="text-lg font-semibold text-slate-900">
            Nenhum usuário encontrado
          </h3>
          <p className="text-slate-500 mt-1 max-w-sm">
            Tente ajustar a sua busca ou remover os filtros aplicados.
          </p>
          <button
            type="button"
            onClick={limparFiltros}
            className="mt-6 text-sm font-medium text-emerald-600 hover:text-emerald-700 transition-colors"
          >
            Limpar filtros
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 lg:gap-6">
          {apoiadoresFiltrados.map((apoiador) => (
            <div
              key={apoiador.id}
              className="bg-white border border-slate-200 rounded-xl shadow-sm hover:shadow-md transition-shadow flex flex-col overflow-hidden"
            >
              <div className="p-4 sm:p-5 border-b border-slate-100 flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <h3
                    className="font-bold text-slate-900 text-lg truncate pr-2"
                    title={apoiador.nome}
                  >
                    {formatarTexto(apoiador.nome)}
                  </h3>

                  <div className="flex items-center gap-1.5 mt-1">
                    <UsersRound className="w-3.5 h-3.5 text-slate-400" />
                    <p className="text-sm font-medium text-slate-600 truncate">
                      ADM:{" "}
                      <span className="text-emerald-600">
                        {formatarTexto(apoiador.candidatoNome)}
                      </span>
                    </p>
                  </div>
                </div>

                <span
                  className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold shrink-0 ${obterClassesStatus(
                    apoiador.status
                  )}`}
                >
                  {obterTextoStatus(apoiador.status)}
                </span>
              </div>

              <div className="p-4 sm:p-5 flex-1 space-y-4">
                <div className="bg-slate-50 border border-slate-100 rounded-lg p-3">
                  <div className="flex items-start gap-2.5">
                    <MapPinned className="w-4 h-4 text-emerald-600 mt-0.5 shrink-0" />
                    <div>
                      <p className="text-sm font-semibold text-slate-900 leading-tight">
                        {formatarTexto(apoiador.municipio)}
                      </p>
                      <p className="text-xs text-slate-500 mt-1 font-medium">
                        Segmento {formatarTexto(apoiador.zonaEleitoral)} •{" "}
                        Subsegmento {formatarTexto(apoiador.secaoEleitoral)}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="space-y-2.5">
                  <div className="flex items-center gap-2.5 text-sm text-slate-600">
                    <Phone className="w-4 h-4 text-slate-400 shrink-0" />
                    <span>{formatarTexto(apoiador.telefone)}</span>

                    {apoiador.telefone && (
                      <a
                        href={montarLinkWhatsApp(apoiador.telefone)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex h-7 w-7 items-center justify-center rounded-lg text-emerald-600 transition-colors hover:bg-emerald-50 hover:text-emerald-700"
                        aria-label={`Enviar WhatsApp para ${apoiador.nome}`}
                      >
                        <MessageCircle className="w-4 h-4" />
                      </a>
                    )}
                  </div>

                  {apoiador.email && (
                    <div className="flex items-center gap-2.5 text-sm text-slate-600">
                      <Mail className="w-4 h-4 text-slate-400 shrink-0" />
                      <span className="truncate">{apoiador.email}</span>
                    </div>
                  )}

                  <div className="flex items-center gap-2.5 text-sm text-slate-600">
                    <MapPin className="w-4 h-4 text-slate-400 shrink-0" />
                    <span className="truncate">
                      {formatarTexto(apoiador.bairro)}
                    </span>
                  </div>
                </div>
              </div>

              <div className="px-4 py-3 bg-slate-50 border-t border-slate-100 flex items-center justify-between gap-3">
                <div className="flex items-center gap-2 text-xs text-slate-500 font-medium">
                  <Calendar className="w-3.5 h-3.5" />
                  <span>Cadastrado em {formatarData(apoiador.criadoEm)}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="flex flex-col sm:flex-row items-center justify-between border-t border-slate-200 pt-6 gap-4">
        <p className="text-sm text-slate-500">
          Mostrando{" "}
          <span className="font-medium text-slate-900">
            {apoiadoresFiltrados.length}
          </span>{" "}
          de{" "}
          <span className="font-medium text-slate-900">
            {formatarNumero(totalElements)}
          </span>{" "}
          usuários
        </p>

        <div className="flex gap-2 w-full sm:w-auto">
          <button
            type="button"
            disabled={page <= 0 || carregando}
            onClick={() => setPage((paginaAtual) => Math.max(paginaAtual - 1, 0))}
            className="flex-1 sm:flex-none px-4 py-2 border border-slate-200 rounded-lg text-sm font-medium text-slate-700 bg-white hover:bg-slate-50 disabled:text-slate-400 disabled:bg-slate-50 disabled:cursor-not-allowed"
          >
            Anterior
          </button>

          <button
            type="button"
            disabled={page + 1 >= totalPages || carregando}
            onClick={() => setPage((paginaAtual) => paginaAtual + 1)}
            className="flex-1 sm:flex-none px-4 py-2 border border-slate-200 rounded-lg text-sm font-medium text-slate-700 bg-white hover:bg-slate-50 disabled:text-slate-400 disabled:bg-slate-50 disabled:cursor-not-allowed"
          >
            Próxima
          </button>
        </div>
      </div>
    </div>
  );
}