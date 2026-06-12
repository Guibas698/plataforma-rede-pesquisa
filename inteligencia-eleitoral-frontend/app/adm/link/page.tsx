"use client";
import { obterUsuarioSalvo } from "../../lib/auth";
import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  Link2,
  Copy,
  MessageCircle,
  QrCode,
  Users,
  MapPin,
  TrendingUp,
  CheckCircle2,
  Download,
  X,
  AlertTriangle,
} from "lucide-react";

import { apiFetch } from "../../lib/api";

type CandidatoLinkResponse = {
  codigo: string;
  urlCompleta: string;
  ativo: boolean;
  totalApoiadores: number;
  cadastrosHoje: number;
  municipiosAlcancados: number;
  cadastrosUltimosSeteDias: number;
};

function formatarNumero(valor?: number | null): string {
  return (valor ?? 0).toLocaleString("pt-BR");
}

function removerProtocolo(url?: string | null): string {
  if (!url) {
    return "Link ainda não disponível";
  }

  return url.replace(/^https?:\/\//, "");
}

export default function MeuLinkPage() {
  const [dadosLink, setDadosLink] = useState<CandidatoLinkResponse | null>(
    null
  );
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState("");
  const [copiado, setCopiado] = useState(false);
  const [qrCodeAberto, setQrCodeAberto] = useState(false);
  const usuario = obterUsuarioSalvo();
  const isLider = usuario?.papel === "LIDER";

  const textoCompartilhamento = isLider
    ? "Compartilhe seu link para convidar usuários para sua subrede."
    : "Compartilhe seu link para convidar usuários para sua rede.";

  const textoVinculo = isLider
    ? "Quem acessar esse link será cadastrado como usuário vinculado à sua subrede."
    : "Quem acessar esse link será cadastrado como usuário vinculado à sua rede.";
  useEffect(() => {
    let montado = true;

    async function carregarLink() {
      setCarregando(true);
      setErro("");

      try {
        const response = await apiFetch<CandidatoLinkResponse>(
          "/candidato/link"
        );

        if (!montado) {
          return;
        }

        setDadosLink({
          codigo: response.codigo ?? "",
          urlCompleta: response.urlCompleta ?? "",
          ativo: response.ativo ?? false,
          totalApoiadores: response.totalApoiadores ?? 0,
          cadastrosHoje: response.cadastrosHoje ?? 0,
          municipiosAlcancados: response.municipiosAlcancados ?? 0,
          cadastrosUltimosSeteDias:
            response.cadastrosUltimosSeteDias ?? 0,
        });
      } catch (error) {
        if (!montado) {
          return;
        }

        if (error instanceof Error) {
          setErro(error.message || "Não foi possível carregar o link.");
        } else {
          setErro("Não foi possível carregar o link.");
        }
      } finally {
        if (montado) {
          setCarregando(false);
        }
      }
    }

    carregarLink();

    return () => {
      montado = false;
    };
  }, []);

  const linkCandidatoCompleto = dadosLink?.urlCompleta ?? "";
  const linkCandidatoExibicao = removerProtocolo(linkCandidatoCompleto);

  const linkWhatsApp = useMemo(() => {
    if (!linkCandidatoCompleto || !dadosLink?.ativo) {
      return "";
    }

    return `https://wa.me/?text=${encodeURIComponent(
      `Olá! Cadastre-se como usuário pelo meu link de convite: ${linkCandidatoCompleto}`
    )}`;
  }, [linkCandidatoCompleto, dadosLink?.ativo]);

  const qrCodeUrl = useMemo(() => {
    if (!linkCandidatoCompleto) {
      return "";
    }

    return `https://api.qrserver.com/v1/create-qr-code/?size=320x320&margin=16&data=${encodeURIComponent(
      linkCandidatoCompleto
    )}`;
  }, [linkCandidatoCompleto]);

  const handleCopiarLink = async () => {
    if (!linkCandidatoCompleto || !dadosLink?.ativo) {
      return;
    }

    await navigator.clipboard.writeText(linkCandidatoCompleto);
    setCopiado(true);
    setTimeout(() => setCopiado(false), 2000);
  };

  const handleBaixarQrCode = async () => {
    if (!qrCodeUrl) {
      return;
    }

    try {
      const response = await fetch(qrCodeUrl);

      if (!response.ok) {
        throw new Error("Erro ao baixar QR Code");
      }

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);

      const link = document.createElement("a");
      link.href = url;
      link.download = `qrcode-convite-${dadosLink?.codigo || "adm"}.png`;
      document.body.appendChild(link);
      link.click();
      link.remove();

      URL.revokeObjectURL(url);
    } catch {
      window.open(qrCodeUrl, "_blank", "noopener,noreferrer");
    }
  };

  if (carregando) {
    return (
      <div className="p-4 sm:p-6 lg:p-8 max-w-5xl mx-auto">
        <div className="bg-white border border-slate-200 rounded-xl p-12 flex flex-col items-center justify-center text-center shadow-sm">
          <div className="w-12 h-12 border-4 border-slate-100 border-t-emerald-500 rounded-full animate-spin mb-4" />
          <h3 className="text-lg font-semibold text-slate-900">
            Carregando link...
          </h3>
          <p className="text-slate-500 mt-1 max-w-sm">
            Buscando as informações reais do seu link de convite.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-5xl mx-auto space-y-6 lg:space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
          <Link2 className="w-6 h-6 text-emerald-600" />
          Meu link de convite
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          {textoCompartilhamento}
        </p>
      </div>

      {erro && (
        <div className="bg-red-50 border border-red-100 text-red-700 px-4 py-3 rounded-xl text-sm font-medium flex items-start gap-2">
          <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5" />
          <span>{erro}</span>
        </div>
      )}

      {!erro && !dadosLink && (
        <div className="bg-white border border-slate-200 rounded-xl p-8 text-center shadow-sm">
          <div className="w-12 h-12 mx-auto rounded-xl bg-slate-50 flex items-center justify-center mb-3">
            <Link2 className="w-6 h-6 text-slate-400" />
          </div>
          <h3 className="text-base font-semibold text-slate-900">
            Link ainda não disponível
          </h3>
          <p className="text-sm text-slate-500 mt-1">
            O link de convite aparecerá aqui quando estiver disponível no
            sistema.
          </p>
        </div>
      )}

      {dadosLink && (
        <>
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex flex-col md:flex-row">
            <div className="p-6 md:p-8 flex-1 flex flex-col justify-center border-b md:border-b-0 md:border-r border-slate-100">
              <div className="flex items-center gap-2 mb-4">
                <h2 className="text-lg font-bold text-slate-900">
                  Seu link exclusivo
                </h2>

                <span
                  className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                    dadosLink.ativo
                      ? "bg-emerald-50 text-emerald-700"
                      : "bg-red-50 text-red-700"
                  }`}
                >
                  {dadosLink.ativo ? "Ativo" : "Inativo"}
                </span>
              </div>

              <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                <span className="font-mono text-slate-700 text-sm sm:text-base break-all">
                  {linkCandidatoExibicao}
                </span>

                <button
                  type="button"
                  onClick={handleCopiarLink}
                  disabled={!dadosLink.ativo || !linkCandidatoCompleto}
                  className={`shrink-0 flex items-center justify-center gap-2 px-4 py-2 rounded-md font-medium text-sm transition-colors disabled:opacity-60 disabled:cursor-not-allowed ${
                    copiado
                      ? "bg-emerald-100 text-emerald-700"
                      : "bg-white border border-slate-200 text-slate-700 hover:bg-slate-50"
                  }`}
                >
                  {copiado ? (
                    <CheckCircle2 className="w-4 h-4" />
                  ) : (
                    <Copy className="w-4 h-4" />
                  )}
                  {copiado ? "Copiado!" : "Copiar"}
                </button>
              </div>

              {!dadosLink.ativo && (
                <div className="mb-6 bg-amber-50 border border-amber-100 text-amber-700 rounded-lg px-4 py-3 text-sm">
                  Este link está inativo no momento. Ative o link para
                  compartilhar com novos usuários.
                </div>
              )}

              <div className="flex flex-col sm:flex-row gap-3">
                <a
                  href={linkWhatsApp || "#"}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`flex-1 font-bold py-3 px-4 rounded-lg transition-colors flex items-center justify-center gap-2 shadow-sm ${
                    linkWhatsApp
                      ? "bg-[#25D366] hover:bg-[#22c35e] text-white shadow-[#25D366]/20"
                      : "bg-slate-100 text-slate-400 pointer-events-none"
                  }`}
                >
                  <MessageCircle className="w-5 h-5" />
                  Enviar no WhatsApp
                </a>
              </div>
            </div>

            <div className="p-6 md:p-8 md:w-72 bg-slate-50 flex flex-col items-center justify-center text-center">
              <button
                type="button"
                onClick={() => qrCodeUrl && setQrCodeAberto(true)}
                disabled={!qrCodeUrl}
                className="w-32 h-32 bg-white rounded-xl border-2 border-dashed border-slate-300 flex items-center justify-center mb-4 shadow-sm overflow-hidden hover:border-emerald-500 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
                aria-label="Expandir QR Code do convite"
              >
                {qrCodeUrl ? (
                  <img
                    src={qrCodeUrl}
                    alt="QR Code do convite"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <QrCode className="w-10 h-10 text-slate-300" />
                )}
              </button>

              <h3 className="font-semibold text-slate-900 text-sm">
                QR Code do convite
              </h3>
              <p className="text-xs text-slate-500 mt-1 mb-4">
                Aponte a câmera para acessar o link
              </p>

              <button
                type="button"
                onClick={handleBaixarQrCode}
                disabled={!qrCodeUrl}
                className="text-emerald-600 font-medium text-sm hover:text-emerald-700 transition-colors disabled:text-slate-400 disabled:cursor-not-allowed"
              >
                Baixar imagem
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center gap-4">
              <div className="w-12 h-12 rounded-lg bg-blue-50 flex items-center justify-center text-blue-600 shrink-0">
                <Users className="w-6 h-6" />
              </div>
              <div>
                <p className="text-sm font-medium text-slate-500">
                  Usuários cadastrados pelo link
                </p>
                <h3 className="text-2xl font-bold text-slate-900">
                  {formatarNumero(dadosLink.totalApoiadores)}
                </h3>
              </div>
            </div>

            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center gap-4">
              <div className="w-12 h-12 rounded-lg bg-emerald-50 flex items-center justify-center text-emerald-600 shrink-0">
                <TrendingUp className="w-6 h-6" />
              </div>
              <div>
                <p className="text-sm font-medium text-slate-500">
                  Cadastros hoje
                </p>
                <h3 className="text-2xl font-bold text-slate-900">
                  {formatarNumero(dadosLink.cadastrosHoje)}
                </h3>
              </div>
            </div>

            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center gap-4">
              <div className="w-12 h-12 rounded-lg bg-purple-50 flex items-center justify-center text-purple-600 shrink-0">
                <MapPin className="w-6 h-6" />
              </div>
              <div>
                <p className="text-sm font-medium text-slate-500">
                  Cidades alcançadas
                </p>
                <h3 className="text-2xl font-bold text-slate-900">
                  {formatarNumero(dadosLink.municipiosAlcancados)}
                </h3>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-100">
              <h3 className="font-bold text-slate-900">Como funciona</h3>
              <p className="text-sm text-slate-500 mt-0.5">
                O vínculo é feito automaticamente a partir do seu link.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 divide-y sm:divide-y-0 sm:divide-x divide-slate-100">
              <div className="p-5">
                <p className="text-sm font-semibold text-slate-900">
                  1. Você compartilha o link
                </p>
                <p className="text-xs text-slate-500 mt-1">
                  Envie pelo WhatsApp, QR Code ou outro canal autorizado.
                </p>
              </div>

              <div className="p-5">
                <p className="text-sm font-semibold text-slate-900">
                  2. O usuário preenche o cadastro
                </p>
                <p className="text-xs text-slate-500 mt-1">
                  Os dados são informados voluntariamente pelo próprio usuário.
                </p>
              </div>

              <div className="p-5">
                <p className="text-sm font-semibold text-slate-900">
                  3. O cadastro fica vinculado ao seu perfil
                </p>
                <p className="text-xs text-slate-500 mt-1">
                  {isLider
                    ? "Você acompanha os usuários diretamente no painel do líder."
                    : "Você acompanha os usuários diretamente no painel do ADM."}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-100">
              <h3 className="font-bold text-slate-900">
                Resumo do link de convite
              </h3>
              <p className="text-sm text-slate-500 mt-0.5">
                Acompanhamento real dos cadastros realizados pelo seu link.
              </p>
            </div>

            <div className="divide-y divide-slate-100">
              <div className="px-5 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-50 transition-colors">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-600 font-bold shrink-0">
                    <Users className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-slate-900">
                      Cadastros nos últimos 7 dias
                    </p>
                    <p className="text-xs text-slate-500">
                      Total recente vindo do backend
                    </p>
                  </div>
                </div>
                <div className="text-xs font-medium text-slate-500 bg-slate-100 px-2.5 py-1 rounded-md w-fit">
                  {formatarNumero(dadosLink.cadastrosUltimosSeteDias)}
                </div>
              </div>

              <div className="px-5 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-50 transition-colors">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-600 font-bold shrink-0">
                    <MapPin className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-slate-900">
                      Cidades alcançadas
                    </p>
                    <p className="text-xs text-slate-500">
                      Cidades com usuários cadastrados
                    </p>
                  </div>
                </div>
                <div className="text-xs font-medium text-slate-500 bg-slate-100 px-2.5 py-1 rounded-md w-fit">
                  {formatarNumero(dadosLink.municipiosAlcancados)}
                </div>
              </div>
            </div>

            <div className="px-5 py-3 bg-slate-50 border-t border-slate-100 text-center">
              <Link
                href="/adm/usuarios"
                className="text-sm font-medium text-emerald-600 hover:text-emerald-700 transition-colors"
              >
                Ver todos em Usuários
              </Link>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4 flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-slate-400 shrink-0 mt-0.5" />
            <p className="text-sm text-slate-500">
              {textoVinculo}
            </p>
          </div>
        </>
      )}

      {qrCodeAberto && qrCodeUrl && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-white rounded-2xl border border-slate-200 shadow-xl overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h2 className="font-bold text-slate-900 flex items-center gap-2">
                  <QrCode className="w-5 h-5 text-emerald-600" />
                  QR Code do convite
                </h2>
                <p className="text-sm text-slate-500 mt-0.5">
                  Use este QR Code para divulgar seu link de convite.
                </p>
              </div>

              <button
                type="button"
                onClick={() => setQrCodeAberto(false)}
                className="text-slate-400 hover:text-slate-600 transition-colors p-1 rounded-md hover:bg-slate-100"
                aria-label="Fechar QR Code"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 flex flex-col items-center text-center">
              <div className="w-64 h-64 bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                <img
                  src={qrCodeUrl}
                  alt="QR Code do convite expandido"
                  className="w-full h-full object-cover"
                />
              </div>

              <p className="font-mono text-sm text-slate-700 break-all mt-4">
                {linkCandidatoExibicao}
              </p>

              <button
                type="button"
                onClick={handleBaixarQrCode}
                className="mt-5 w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 px-4 rounded-lg transition-colors flex items-center justify-center gap-2"
              >
                <Download className="w-5 h-5" />
                Baixar imagem
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}