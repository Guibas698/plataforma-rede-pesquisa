"use client";

import { useState, useEffect, useMemo } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  UserCheck,
  MapPinned,
  Map as MapIcon,
  Landmark,
  Mail,
  Phone,
  Calendar,
  Copy,
  Send,
  ShieldCheck,
  AlertTriangle,
  Power,
  FileBarChart,
  Check,
  Building2,
  FileText,
  Loader2,
} from "lucide-react";

import { apiFetch } from "../../../lib/api";

type AdminCandidatoDetalheResponse = {
  id: string;
  usuarioId: string;
  nomeCompleto: string;
  nomePublico: string;
  email: string;
  telefone: string;
  tituloEleitorUltimos4?: string | null;
  municipioBase: string;
  partido?: string;
  numeroUrna?: string;
  cargoPretendido: string;
  observacaoInterna?: string;
  ativo: boolean;
  criadoEm: string;
  atualizadoEm?: string;
  linkCadastro?: string;
  totalApoiadores: number;
  municipiosAlcancados: number;
  zonasCadastradas: number;
  secoesCadastradas: number;
  cadastrosHoje: number;
};

type AdminAtualizarCandidatoRequest = {
  nomeCompleto: string;
  nomePublico: string;
  telefone: string;
  municipioBase: string;
  partido?: string;
  numeroUrna?: string;
  cargoPretendido: string;
  observacaoInterna?: string;
};

// TODO Backend/Frontend: implementar edição visual usando PUT /admin/candidatos/{id}.
// O type AdminAtualizarCandidatoRequest foi mantido para a próxima etapa.

function formatarNumero(valor?: number | null): string {
  return (valor ?? 0).toLocaleString("pt-BR");
}

function formatarTituloUltimos4(valor?: string | null): string {
  const texto = valor?.trim();

  if (!texto) {
    return "Não informado";
  }

  return `****${texto}`;
}

function formatarTexto(valor?: string | null): string {
  const texto = valor?.trim();
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

export default function CandidatoDetailsPage() {
  const params = useParams();

  const id = useMemo(() => {
    const paramId = params?.id;

    if (Array.isArray(paramId)) {
      return paramId[0] ?? "";
    }

    return typeof paramId === "string" ? paramId : "";
  }, [params]);

  const [candidato, setCandidato] =
    useState<AdminCandidatoDetalheResponse | null>(null);

  const [isLoading, setIsLoading] = useState(true);
  const [isCopied, setIsCopied] = useState(false);
  const [erro, setErro] = useState("");
  const [sucesso, setSucesso] = useState("");
  const [alterandoStatus, setAlterandoStatus] = useState(false);

  const linkPublico = useMemo(() => {
    if (!candidato?.linkCadastro || typeof window === "undefined") {
      return "";
    }

    return `${window.location.origin}/cadastro/${candidato.linkCadastro}`;
  }, [candidato]);

  useEffect(() => {
    let montado = true;

    async function carregarCandidato() {
      if (!id) {
        setErro("Identificador do ADM não encontrado.");
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      setErro("");
      setSucesso("");

      try {
        const response = await apiFetch<AdminCandidatoDetalheResponse>(
          `/admin/candidatos/${id}`
        );

        if (!montado) {
          return;
        }

        setCandidato(response);
      } catch (error) {
        if (!montado) {
          return;
        }

        if (error instanceof Error) {
          setErro(error.message || "Não foi possível carregar o ADM.");
        } else {
          setErro("Não foi possível carregar o ADM.");
        }

        setCandidato(null);
      } finally {
        if (montado) {
          setIsLoading(false);
        }
      }
    }

    carregarCandidato();

    return () => {
      montado = false;
    };
  }, [id]);

  const mostrarSucesso = (mensagem: string) => {
    setSucesso(mensagem);

    window.setTimeout(() => {
      setSucesso("");
    }, 3000);
  };

  const handleCopyLink = async () => {
    if (!linkPublico) {
      return;
    }

    try {
      await navigator.clipboard.writeText(linkPublico);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    } catch {
      setErro("Não foi possível copiar o link de convite.");
    }
  };

  const handleWhatsAppShare = () => {
    if (!linkPublico) {
      return;
    }

    const message = `Olá! Cadastre-se como usuário pelo link de convite: ${linkPublico}`;
    const url = `https://wa.me/?text=${encodeURIComponent(message)}`;
    window.open(url, "_blank", "noopener,noreferrer");
  };

  const handleToggleStatus = async () => {
    if (!candidato) {
      return;
    }

    setErro("");
    setSucesso("");
    setAlterandoStatus(true);

    try {
      const response = await apiFetch<AdminCandidatoDetalheResponse>(
        `/admin/candidatos/${candidato.id}/status`,
        {
          method: "PATCH",
        }
      );

      setCandidato(response);
      mostrarSucesso("Status atualizado com sucesso.");
    } catch (error) {
      if (error instanceof Error) {
        setErro(error.message || "Não foi possível atualizar o status.");
      } else {
        setErro("Não foi possível atualizar o status.");
      }
    } finally {
      setAlterandoStatus(false);
    }
  };

  if (isLoading) {
    return (
      <div className="p-4 sm:p-6 lg:p-8 max-w-3xl mx-auto mt-10">
        <div className="bg-white border border-slate-200 rounded-2xl p-8 sm:p-12 flex flex-col items-center text-center shadow-sm">
          <div className="w-12 h-12 border-4 border-slate-100 border-t-emerald-500 rounded-full animate-spin mb-6" />
          <h2 className="text-xl font-bold text-slate-900">
            Carregando detalhes do ADM...
          </h2>
          <p className="text-slate-500 mt-2 max-w-md">
            Buscando os dados reais no backend.
          </p>
        </div>
      </div>
    );
  }

  if (!candidato) {
    return (
      <div className="p-4 sm:p-6 lg:p-8 max-w-3xl mx-auto mt-10">
        <div className="bg-white border border-slate-200 rounded-2xl p-8 sm:p-12 flex flex-col items-center text-center shadow-sm">
          <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mb-6">
            <AlertTriangle className="w-8 h-8 text-red-500" />
          </div>

          <h2 className="text-2xl font-bold text-slate-900">
            ADM não encontrado
          </h2>

          <p className="text-slate-500 mt-2 max-w-md">
            {erro ||
              "Verifique se o link está correto ou se este ADM foi removido do sistema."}
          </p>

          <div className="mt-8">
            <Link
              href="/admin/candidatos"
              className="inline-flex items-center justify-center gap-2 px-6 py-2.5 bg-slate-900 text-white text-sm font-medium rounded-lg hover:bg-slate-800 transition-colors shadow-sm"
            >
              <ArrowLeft className="w-4 h-4" />
              Voltar para ADMs
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6 lg:space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            Detalhes do ADM
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Consulte dados, indicadores e link de convite do ADM.
          </p>
        </div>

        <Link
          href="/admin/candidatos"
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-white border border-slate-200 text-slate-700 text-sm font-medium rounded-lg hover:bg-slate-50 transition-colors shadow-sm w-full sm:w-auto"
        >
          <ArrowLeft className="w-4 h-4" />
          Voltar
        </Link>
      </div>

      {erro && (
        <div className="bg-red-50 border border-red-100 text-red-700 px-4 py-3 rounded-xl text-sm font-medium">
          {erro}
        </div>
      )}

      {sucesso && (
        <div className="bg-emerald-50 border border-emerald-100 text-emerald-700 px-4 py-3 rounded-xl text-sm font-medium">
          {sucesso}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white border border-slate-200 rounded-xl shadow-sm p-6 relative overflow-hidden">
            <div
              className={`absolute top-0 left-0 w-1 h-full ${
                candidato.ativo ? "bg-emerald-500" : "bg-slate-300"
              }`}
            />

            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
              <div>
                <h2 className="text-2xl font-bold text-slate-900">
                  {formatarTexto(candidato.nomePublico)}
                </h2>

                <p className="text-sm text-slate-500 mt-1">
                  {formatarTexto(candidato.nomeCompleto)}
                </p>

                <div className="mt-4 flex flex-wrap items-center gap-3">
                  <span
                    className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold border ${
                      candidato.ativo
                        ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                        : "bg-slate-50 text-slate-600 border-slate-200"
                    }`}
                  >
                    {candidato.ativo ? "Ativo" : "Inativo"}
                  </span>

                  {candidato.partido && (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium bg-slate-100 text-slate-700">
                      <Building2 className="w-3.5 h-3.5 text-slate-500" />
                      {candidato.partido}
                    </span>
                  )}

                  {candidato.numeroUrna && (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium bg-slate-100 text-slate-700">
                      Código {candidato.numeroUrna}
                    </span>
                  )}

                  {candidato.cargoPretendido && (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium bg-blue-50 text-blue-700 border border-blue-100">
                      {candidato.cargoPretendido}
                    </span>
                  )}
                </div>
              </div>

              <div className="text-left sm:text-right">
                <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">
                  Cadastrado em
                </p>
                <p className="text-sm font-semibold text-slate-700 mt-1 flex items-center sm:justify-end gap-1.5">
                  <Calendar className="w-4 h-4 text-slate-400" />
                  {formatarData(candidato.criadoEm)}
                </p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white border border-slate-200 rounded-xl shadow-sm p-4 flex flex-col justify-between">
              <div className="flex justify-between items-start mb-2">
                <p className="text-xs font-medium text-slate-500">
                  Total de usuários
                </p>
                <UserCheck className="w-4 h-4 text-emerald-600" />
              </div>
              <h3 className="text-xl font-bold text-slate-900">
                {formatarNumero(candidato.totalApoiadores)}
              </h3>
              {candidato.cadastrosHoje > 0 && (
                <p className="text-xs text-emerald-600 font-medium mt-1">
                  +{formatarNumero(candidato.cadastrosHoje)} hoje
                </p>
              )}
            </div>

            <div className="bg-white border border-slate-200 rounded-xl shadow-sm p-4 flex flex-col justify-between">
              <div className="flex justify-between items-start mb-2">
                <p className="text-xs font-medium text-slate-500">
                  Cidades
                </p>
                <MapPinned className="w-4 h-4 text-purple-600" />
              </div>
              <h3 className="text-xl font-bold text-slate-900">
                {formatarNumero(candidato.municipiosAlcancados)}
              </h3>
            </div>

            <div className="bg-white border border-slate-200 rounded-xl shadow-sm p-4 flex flex-col justify-between">
              <div className="flex justify-between items-start mb-2">
                <p className="text-xs font-medium text-slate-500">
                  Segmentos
                </p>
                <MapIcon className="w-4 h-4 text-blue-600" />
              </div>
              <h3 className="text-xl font-bold text-slate-900">
                {formatarNumero(candidato.zonasCadastradas)}
              </h3>
            </div>

            <div className="bg-white border border-slate-200 rounded-xl shadow-sm p-4 flex flex-col justify-between">
              <div className="flex justify-between items-start mb-2">
                <p className="text-xs font-medium text-slate-500">
                  Subsegmentos
                </p>
                <Landmark className="w-4 h-4 text-amber-600" />
              </div>
              <h3 className="text-xl font-bold text-slate-900">
                {formatarNumero(candidato.secoesCadastradas)}
              </h3>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div className="bg-white border border-slate-200 rounded-xl shadow-sm p-6">
              <h3 className="text-sm font-semibold text-slate-900 border-b border-slate-100 pb-3 mb-4">
                Informações de contato
              </h3>

              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <Mail className="w-5 h-5 text-slate-400 mt-0.5" />
                  <div className="min-w-0">
                    <p className="text-xs font-medium text-slate-500">
                      E-mail
                    </p>
                    <p className="text-sm text-slate-900 mt-0.5 truncate">
                      {formatarTexto(candidato.email)}
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Phone className="w-5 h-5 text-slate-400 mt-0.5" />
                  <div>
                    <p className="text-xs font-medium text-slate-500">
                      Telefone / WhatsApp
                    </p>
                    <p className="text-sm text-slate-900 mt-0.5">
                      {formatarTexto(candidato.telefone)}
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <ShieldCheck className="w-5 h-5 text-slate-400 mt-0.5" />
                  <div>
                    <p className="text-xs font-medium text-slate-500">
                      Título cadastrado
                    </p>
                    <p className="text-sm text-slate-900 mt-0.5">
                      {formatarTituloUltimos4(candidato.tituloEleitorUltimos4)}
                    </p>
                  </div>
                </div>


                <div className="flex items-start gap-3">
                  <MapPinned className="w-5 h-5 text-slate-400 mt-0.5" />
                  <div>
                    <p className="text-xs font-medium text-slate-500">
                      Cidade base
                    </p>
                    <p className="text-sm text-slate-900 mt-0.5">
                      {formatarTexto(candidato.municipioBase)}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white border border-slate-200 rounded-xl shadow-sm p-6">
              <h3 className="text-sm font-semibold text-slate-900 border-b border-slate-100 pb-3 mb-4 flex items-center gap-2">
                <FileText className="w-4 h-4 text-slate-400" />
                Observação interna
              </h3>

              {candidato.observacaoInterna ? (
                <p className="text-sm text-slate-700 leading-relaxed bg-amber-50/50 p-3 rounded-lg border border-amber-100">
                  {candidato.observacaoInterna}
                </p>
              ) : (
                <p className="text-sm text-slate-400 italic">
                  Nenhuma observação interna cadastrada.
                </p>
              )}
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-white border border-slate-200 rounded-xl shadow-sm p-6">
            <h3 className="text-sm font-semibold text-slate-900 mb-2">
              Link de convite
            </h3>

            <p className="text-xs text-slate-500 mb-4 leading-relaxed">
              Compartilhe este link com o ADM para que novos usuários possam se
              cadastrar.
            </p>

            {linkPublico ? (
              <>
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg break-all mb-4">
                  <span className="text-sm text-slate-700 font-medium select-all">
                    {linkPublico}
                  </span>
                </div>

                <div className="flex flex-col gap-2.5">
                  <button
                    type="button"
                    onClick={handleCopyLink}
                    className={`flex items-center justify-center gap-2 w-full px-4 py-2 rounded-lg text-sm font-medium transition-all shadow-sm ${
                      isCopied
                        ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                        : "bg-white text-slate-700 border border-slate-200 hover:bg-slate-50"
                    }`}
                  >
                    {isCopied ? (
                      <Check className="w-4 h-4" />
                    ) : (
                      <Copy className="w-4 h-4" />
                    )}
                    {isCopied ? "Copiado!" : "Copiar convite"}
                  </button>

                  <button
                    type="button"
                    onClick={handleWhatsAppShare}
                    className="flex items-center justify-center gap-2 w-full px-4 py-2 bg-[#25D366] hover:bg-[#22bf5b] text-white rounded-lg text-sm font-medium transition-colors shadow-sm"
                  >
                    <Send className="w-4 h-4" />
                    WhatsApp
                  </button>
                </div>
              </>
            ) : (
              <div className="rounded-lg border border-amber-100 bg-amber-50 p-3 text-sm font-medium text-amber-800">
                Link de convite ainda não disponível.
              </div>
            )}
          </div>

          <div className="bg-white border border-slate-200 rounded-xl shadow-sm p-6">
            <h3 className="text-sm font-semibold text-slate-900 mb-4 border-b border-slate-100 pb-3">
              Ações administrativas
            </h3>

            <div className="space-y-3">
              <Link
                href={`/admin/apoiadores?candidato=${candidato.id}`}
                className="flex items-center gap-3 w-full px-4 py-2.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 rounded-lg text-sm font-medium transition-colors"
              >
                <UserCheck className="w-4 h-4 text-slate-500" />
                Ver usuários
              </Link>

              <Link
                href={`/admin/relatorios?candidato=${candidato.id}`}
                className="flex items-center gap-3 w-full px-4 py-2.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 rounded-lg text-sm font-medium transition-colors"
              >
                <FileBarChart className="w-4 h-4 text-slate-500" />
                Ver relatório
              </Link>

              <div className="pt-3 mt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={handleToggleStatus}
                  disabled={alterandoStatus}
                  className={`flex items-center justify-center gap-2 w-full px-4 py-2.5 rounded-lg text-sm font-medium transition-colors border disabled:opacity-70 disabled:cursor-not-allowed ${
                    candidato.ativo
                      ? "bg-white border-red-200 text-red-600 hover:bg-red-50"
                      : "bg-white border-emerald-200 text-emerald-600 hover:bg-emerald-50"
                  }`}
                >
                  {alterandoStatus ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Atualizando...
                    </>
                  ) : (
                    <>
                      <Power className="w-4 h-4" />
                      {candidato.ativo ? "Desativar ADM" : "Ativar ADM"}
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-center gap-2 text-xs text-slate-500 pt-8 mt-8 border-t border-slate-200 text-center">
        <ShieldCheck className="w-4 h-4 shrink-0 text-slate-400" />
        <p>
          Os dados exibidos representam cadastros voluntários de usuários e devem
          ser tratados conforme a política de privacidade e a LGPD.
        </p>
      </div>
    </div>
  );
}