"use client";

import { useMemo, useState, type FormEvent } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  CheckCircle2,
  Clipboard,
  Eye,
  EyeOff,
  Loader2,
  MessageCircle,
  Save,
  ShieldCheck,
  UserPlus,
} from "lucide-react";

import { apiFetch } from "../../../lib/api";

type AdminCriarCandidatoRequest = {
  nomeCompleto: string;
  nomePublico: string;
  email: string;
  telefone: string;
  tituloEleitor: string;
  municipioBase: string;
  partido?: string;
  numeroUrna?: string;
  cargoPretendido: string;
  observacaoInterna?: string;
  senhaInicial: string;
};

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

type FormState = {
  nomeCompleto: string;
  nomePublico: string;
  email: string;
  telefone: string;
  tituloEleitor: string;
  municipioBase: string;
  partido: string;
  numeroUrna: string;
  cargoPretendido: string;
  observacaoInterna: string;
  senhaInicial: string;
};

const formInicial: FormState = {
  nomeCompleto: "",
  nomePublico: "",
  email: "",
  telefone: "",
  tituloEleitor: "",
  municipioBase: "",
  partido: "",
  numeroUrna: "",
  cargoPretendido: "",
  observacaoInterna: "",
  senhaInicial: "",
};

function normalizarOpcional(valor: string): string | undefined {
  const texto = valor.trim();
  return texto ? texto : undefined;
}

function normalizarTituloEleitor(valor: string): string {
  return valor.replace(/\D/g, "");
}

export default function NovoCandidatoPage() {
  const [form, setForm] = useState<FormState>(formInicial);
  const [mostrarSenha, setMostrarSenha] = useState(false);
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState("");
  const [candidatoCriado, setCandidatoCriado] =
    useState<AdminCandidatoDetalheResponse | null>(null);
  const [copiado, setCopiado] = useState(false);

  const linkPublico = useMemo(() => {
    if (!candidatoCriado?.linkCadastro || typeof window === "undefined") {
      return "";
    }

    return `${window.location.origin}/cadastro/${candidatoCriado.linkCadastro}`;
  }, [candidatoCriado]);

  const atualizarCampo = (campo: keyof FormState, valor: string) => {
    setForm((estadoAtual) => ({
      ...estadoAtual,
      [campo]: valor,
    }));
  };

  const validarFormulario = (): string | null => {
    const nomeCompleto = form.nomeCompleto.trim();
    const nomePublico = form.nomePublico.trim();
    const email = form.email.trim();
    const telefone = form.telefone.trim();
    const municipioBase = form.municipioBase.trim();
    const cargoPretendido = form.cargoPretendido.trim();
    const senhaInicial = form.senhaInicial.trim();
    const tituloEleitor = normalizarTituloEleitor(form.tituloEleitor);

    if (!nomeCompleto) {
      return "Informe o nome do ADM.";
    }

    if (!nomePublico) {
      return "Informe o nome de exibição.";
    }

    if (!email) {
      return "Informe o e-mail.";
    }

    if (!email.includes("@")) {
      return "Informe um e-mail válido.";
    }

    if (!telefone) {
      return "Informe o telefone.";
    }

    if (!tituloEleitor) {
      return "Informe o título de eleitor.";
    }

    if (tituloEleitor.length !== 12) {
      return "O título de eleitor deve ter 12 dígitos.";
    }

    if (!municipioBase) {
      return "Informe a cidade base.";
    }

    if (!cargoPretendido) {
      return "Informe a função/perfil.";
    }

    if (!senhaInicial) {
      return "Informe a senha inicial.";
    }

    if (senhaInicial.length < 6) {
      return "A senha inicial deve ter no mínimo 6 caracteres.";
    }

    return null;
  };

  const montarPayload = (): AdminCriarCandidatoRequest => {
    return {
      nomeCompleto: form.nomeCompleto.trim(),
      nomePublico: form.nomePublico.trim(),
      email: form.email.trim().toLowerCase(),
      telefone: form.telefone.trim(),
      tituloEleitor: normalizarTituloEleitor(form.tituloEleitor),
      municipioBase: form.municipioBase.trim(),
      partido: normalizarOpcional(form.partido),
      numeroUrna: normalizarOpcional(form.numeroUrna),
      cargoPretendido: form.cargoPretendido.trim(),
      observacaoInterna: normalizarOpcional(form.observacaoInterna),
      senhaInicial: form.senhaInicial.trim(),
    };
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    setErro("");
    setCandidatoCriado(null);
    setCopiado(false);

    const erroValidacao = validarFormulario();

    if (erroValidacao) {
      setErro(erroValidacao);
      return;
    }

    setSalvando(true);

    try {
      const candidato = await apiFetch<AdminCandidatoDetalheResponse>(
        "/admin/candidatos",
        {
          method: "POST",
          body: JSON.stringify(montarPayload()),
        }
      );

      setCandidatoCriado(candidato);

      setForm((estadoAtual) => ({
        ...estadoAtual,
        senhaInicial: "",
      }));
    } catch (error) {
      if (error instanceof Error) {
        setErro(error.message || "Não foi possível cadastrar o ADM.");
      } else {
        setErro("Não foi possível cadastrar o ADM.");
      }
    } finally {
      setSalvando(false);
    }
  };

  const copiarLink = async () => {
    if (!linkPublico) {
      return;
    }

    try {
      await navigator.clipboard.writeText(linkPublico);
      setCopiado(true);

      window.setTimeout(() => {
        setCopiado(false);
      }, 2000);
    } catch {
      setErro("Não foi possível copiar o link de convite.");
    }
  };

  const abrirWhatsApp = () => {
    if (!linkPublico) {
      return;
    }

    const mensagem = encodeURIComponent(
      `Olá! Cadastre-se como usuário pelo meu link de convite: ${linkPublico}`
    );

    window.open(`https://wa.me/?text=${mensagem}`, "_blank", "noopener,noreferrer");
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-5xl mx-auto space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <Link
            href="/admin/candidatos"
            className="inline-flex items-center gap-2 text-sm font-medium text-slate-500 hover:text-slate-700 transition-colors mb-3"
          >
            <ArrowLeft className="w-4 h-4" />
            Voltar para ADMs
          </Link>

          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            Novo ADM
          </h1>

          <p className="text-sm text-slate-500 mt-1">
            Cadastre um ADM e gere um link exclusivo de convite.
          </p>
        </div>

        <div className="hidden sm:flex w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 items-center justify-center">
          <UserPlus className="w-6 h-6" />
        </div>
      </div>

      {candidatoCriado && (
        <div className="bg-white border border-emerald-200 rounded-xl shadow-sm overflow-hidden">
          <div className="p-5 bg-emerald-50 border-b border-emerald-100 flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-white text-emerald-600 flex items-center justify-center shrink-0">
              <CheckCircle2 className="w-6 h-6" />
            </div>

            <div>
              <h2 className="font-bold text-emerald-900">
                ADM cadastrado com sucesso
              </h2>
              <p className="text-sm text-emerald-700 mt-1">
                O usuário do ADM foi criado e o link de convite foi gerado pelo
                backend.
              </p>
            </div>
          </div>

          <div className="p-5 space-y-4">
            <div>
              <p className="text-sm font-medium text-slate-500">
                ADM criado
              </p>
              <p className="text-lg font-bold text-slate-900 mt-1">
                {candidatoCriado.nomePublico}
              </p>
              <p className="text-sm text-slate-500">
                {candidatoCriado.email} • {candidatoCriado.municipioBase}
              </p>
            </div>

            {linkPublico ? (
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                <p className="text-sm font-medium text-slate-700 mb-2">
                  Link de convite
                </p>

                <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                  <code className="text-sm text-slate-700 break-all bg-white border border-slate-200 rounded-lg px-3 py-2">
                    {linkPublico}
                  </code>

                  <div className="flex flex-col sm:flex-row gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={copiarLink}
                      className="inline-flex items-center justify-center gap-2 px-3 py-2 rounded-lg bg-white border border-slate-200 text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors"
                    >
                      <Clipboard className="w-4 h-4" />
                      {copiado ? "Copiado!" : "Copiar convite"}
                    </button>

                    <button
                      type="button"
                      onClick={abrirWhatsApp}
                      className="inline-flex items-center justify-center gap-2 px-3 py-2 rounded-lg bg-emerald-600 text-sm font-medium text-white hover:bg-emerald-700 transition-colors"
                    >
                      <MessageCircle className="w-4 h-4" />
                      Compartilhar WhatsApp
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
                O ADM foi criado, mas o backend não retornou o código do link de
                convite.
              </div>
            )}

            <div className="flex flex-col sm:flex-row gap-3 pt-2">
              <Link
                href="/admin/candidatos"
                className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg border border-slate-200 bg-white text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors"
              >
                Ver ADMs
              </Link>

              <Link
                href={`/admin/candidatos/${candidatoCriado.id}`}
                className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-slate-900 text-sm font-medium text-white hover:bg-slate-800 transition-colors"
              >
                Ver detalhes
              </Link>
            </div>
          </div>
        </div>
      )}

      {erro && (
        <div className="bg-red-50 border border-red-100 text-red-700 px-4 py-3 rounded-xl text-sm font-medium">
          {erro}
        </div>
      )}

      <form
        onSubmit={handleSubmit}
        className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden"
      >
        <div className="p-5 border-b border-slate-100">
          <h2 className="text-lg font-semibold text-slate-900">
            Dados do ADM
          </h2>
          <p className="text-sm text-slate-500 mt-1">
            Preencha os dados principais para criar o acesso do ADM.
          </p>
        </div>

        <div className="p-5 grid grid-cols-1 md:grid-cols-2 gap-5">
          <div className="space-y-1.5">
            <label
              htmlFor="nomeCompleto"
              className="text-sm font-medium text-slate-700"
            >
              Nome do ADM *
            </label>
            <input
              id="nomeCompleto"
              type="text"
              value={form.nomeCompleto}
              onChange={(event) =>
                atualizarCampo("nomeCompleto", event.target.value)
              }
              disabled={salvando}
              className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent disabled:bg-slate-50"
              placeholder="Ex: Nome do responsável"
            />
          </div>

          <div className="space-y-1.5">
            <label
              htmlFor="nomePublico"
              className="text-sm font-medium text-slate-700"
            >
              Nome de exibição *
            </label>
            <input
              id="nomePublico"
              type="text"
              value={form.nomePublico}
              onChange={(event) =>
                atualizarCampo("nomePublico", event.target.value)
              }
              disabled={salvando}
              className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent disabled:bg-slate-50"
              placeholder="Ex: ADM Regional"
            />
          </div>

          <div className="space-y-1.5">
            <label htmlFor="email" className="text-sm font-medium text-slate-700">
              E-mail *
            </label>
            <input
              id="email"
              type="email"
              value={form.email}
              onChange={(event) => atualizarCampo("email", event.target.value)}
              disabled={salvando}
              className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent disabled:bg-slate-50"
              placeholder="nome@email.com"
            />
          </div>

          <div className="space-y-1.5">
            <label
              htmlFor="telefone"
              className="text-sm font-medium text-slate-700"
            >
              Telefone *
            </label>
            <input
              id="telefone"
              type="text"
              value={form.telefone}
              onChange={(event) =>
                atualizarCampo("telefone", event.target.value)
              }
              disabled={salvando}
              className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent disabled:bg-slate-50"
              placeholder="(88) 99999-1111"
            />
          </div>

          <div className="space-y-1.5">
            <label
              htmlFor="tituloEleitor"
              className="text-sm font-medium text-slate-700"
            >
              Título de eleitor *
            </label>
            <input
              id="tituloEleitor"
              type="text"
              value={form.tituloEleitor}
              onChange={(event) =>
                atualizarCampo("tituloEleitor", event.target.value)
              }
              disabled={salvando}
              maxLength={20}
              inputMode="numeric"
              className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent disabled:bg-slate-50"
              placeholder="Digite os 12 dígitos"
            />
            <p className="text-xs text-slate-500">
              Usado apenas para evitar cadastros duplicados. O sistema não armazena o
              número completo.
            </p>
          </div>

          <div className="space-y-1.5">
            <label
              htmlFor="municipioBase"
              className="text-sm font-medium text-slate-700"
            >
              Cidade base *
            </label>
            <input
              id="municipioBase"
              type="text"
              value={form.municipioBase}
              onChange={(event) =>
                atualizarCampo("municipioBase", event.target.value)
              }
              disabled={salvando}
              className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent disabled:bg-slate-50"
              placeholder="Quixadá - CE"
            />
          </div>

          <div className="space-y-1.5">
            <label
              htmlFor="cargoPretendido"
              className="text-sm font-medium text-slate-700"
            >
              Função/Perfil *
            </label>
            <input
              id="cargoPretendido"
              type="text"
              value={form.cargoPretendido}
              onChange={(event) =>
                atualizarCampo("cargoPretendido", event.target.value)
              }
              disabled={salvando}
              className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent disabled:bg-slate-50"
              placeholder="Responsável pela pesquisa"
            />
          </div>

          <div className="space-y-1.5">
            <label
              htmlFor="partido"
              className="text-sm font-medium text-slate-700"
            >
              Grupo/Organização
            </label>
            <input
              id="partido"
              type="text"
              value={form.partido}
              onChange={(event) => atualizarCampo("partido", event.target.value)}
              disabled={salvando}
              className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent disabled:bg-slate-50"
              placeholder="Ex: Equipe Norte"
            />
          </div>

          <div className="space-y-1.5">
            <label
              htmlFor="numeroUrna"
              className="text-sm font-medium text-slate-700"
            >
              Código identificador
            </label>
            <input
              id="numeroUrna"
              type="text"
              value={form.numeroUrna}
              onChange={(event) =>
                atualizarCampo("numeroUrna", event.target.value)
              }
              disabled={salvando}
              className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent disabled:bg-slate-50"
              placeholder="Ex: ADM-001"
            />
          </div>

          <div className="space-y-1.5 md:col-span-2">
            <label
              htmlFor="senhaInicial"
              className="text-sm font-medium text-slate-700"
            >
              Senha inicial *
            </label>

            <div className="relative">
              <input
                id="senhaInicial"
                type={mostrarSenha ? "text" : "password"}
                value={form.senhaInicial}
                onChange={(event) =>
                  atualizarCampo("senhaInicial", event.target.value)
                }
                disabled={salvando}
                className="w-full rounded-lg border border-slate-200 px-3 py-2.5 pr-10 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent disabled:bg-slate-50"
                placeholder="Mínimo 6 caracteres"
              />

              <button
                type="button"
                onClick={() => setMostrarSenha((valorAtual) => !valorAtual)}
                disabled={salvando}
                className="absolute inset-y-0 right-0 px-3 text-slate-400 hover:text-slate-600 transition-colors disabled:opacity-50"
                aria-label={mostrarSenha ? "Ocultar senha" : "Mostrar senha"}
              >
                {mostrarSenha ? (
                  <EyeOff className="w-5 h-5" />
                ) : (
                  <Eye className="w-5 h-5" />
                )}
              </button>
            </div>

            <div className="flex items-start gap-2 rounded-lg bg-slate-50 border border-slate-100 px-3 py-2 text-xs text-slate-500">
              <ShieldCheck className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
              <span>
                A senha é enviada apenas para criação do usuário e não será
                armazenada no navegador.
              </span>
            </div>
          </div>

          <div className="space-y-1.5 md:col-span-2">
            <label
              htmlFor="observacaoInterna"
              className="text-sm font-medium text-slate-700"
            >
              Observação interna
            </label>
            <textarea
              id="observacaoInterna"
              value={form.observacaoInterna}
              onChange={(event) =>
                atualizarCampo("observacaoInterna", event.target.value)
              }
              disabled={salvando}
              rows={4}
              className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent disabled:bg-slate-50 resize-none"
              placeholder="Observação opcional para uso interno do Admin Master."
            />
          </div>
        </div>

        <div className="p-5 border-t border-slate-100 bg-slate-50 flex flex-col sm:flex-row sm:items-center sm:justify-end gap-3">
          <Link
            href="/admin/candidatos"
            className="inline-flex items-center justify-center px-4 py-2.5 rounded-lg border border-slate-200 bg-white text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors"
          >
            Cancelar
          </Link>

          <button
            type="submit"
            disabled={salvando}
            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-emerald-600 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-70 disabled:cursor-not-allowed transition-colors"
          >
            {salvando ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Salvando...
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                Salvar ADM
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}