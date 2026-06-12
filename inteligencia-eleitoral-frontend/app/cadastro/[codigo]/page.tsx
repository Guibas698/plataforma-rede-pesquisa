"use client";

import { useEffect, useMemo, useState, type FormEvent } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  AlertCircle,
  Briefcase,
  Building2,
  CheckCircle2,
  FileText,
  Hash,
  Landmark,
  Lock,
  LockKeyhole,
  Mail,
  MapPin,
  Phone,
  Send,
  ShieldCheck,
  User,
  UserCheck,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

import { apiFetch } from "../../lib/api";

type LinkPublicoResponse = {
  codigo: string;
  ativo: boolean;
  candidatoId: string;
  nomePublico: string;
  partido?: string | null;
  numeroUrna?: string | null;
  cargoPretendido: string;
  municipioBase: string;
};

type FormApoiador = {
  nome: string;
  telefone: string;
  email: string;
  senha: string;
  tituloEleitor: string;
  confirmacaoSenha: string;
  municipio: string;
  bairro: string;
  zonaEleitoral: string;
  secaoEleitoral: string;
  observacao: string;
  consentimentoAceito: boolean;
};

type CadastroApoiadorPublicoRequest = {
  codigoLink: string;
  nome: string;
  email: string;
  telefone: string;
  tituloEleitor: string;
  senha: string;
  confirmacaoSenha: string;
  municipio: string;
  bairro: string;
  zonaEleitoral: number;
  secaoEleitoral: number;
  observacao: string | null;
  consentimentoAceito: boolean;
};

const formInicial: FormApoiador = {
  nome: "",
  telefone: "",
  email: "",
  senha: "",
  tituloEleitor: "",
  confirmacaoSenha: "",
  municipio: "",
  bairro: "",
  zonaEleitoral: "",
  secaoEleitoral: "",
  observacao: "",
  consentimentoAceito: false,
};

function telefoneValido(telefone: string) {
  const numeros = telefone.replace(/\D/g, "");
  return numeros.length >= 8;
}

function normalizarTituloEleitor(valor: string): string {
  return valor.replace(/\D/g, "");
}

function numeroPositivo(valor: string) {
  const numero = Number(valor);
  return Number.isInteger(numero) && numero > 0;
}

function textoOpcional(valor?: string | null) {
  if (!valor || !valor.trim()) {
    return "Não informado";
  }

  return valor;
}

export default function CadastroApoiadorPage() {
  const router = useRouter();
  const params = useParams();

  const codigo = useMemo(() => {
    const valor = params.codigo;

    if (typeof valor === "string") {
      return valor;
    }

    if (Array.isArray(valor)) {
      return valor[0] ?? "";
    }

    return "";
  }, [params.codigo]);

  const [linkPublico, setLinkPublico] = useState<LinkPublicoResponse | null>(
    null
  );
  const [form, setForm] = useState<FormApoiador>(formInicial);

  const [carregandoLink, setCarregandoLink] = useState(true);
  const [erroLink, setErroLink] = useState("");
  const [erroFormulario, setErroFormulario] = useState("");
  const [enviando, setEnviando] = useState(false);

  useEffect(() => {
    let componenteAtivo = true;

    async function carregarLinkPublico() {
      setCarregandoLink(true);
      setErroLink("");

      if (!codigo) {
        setErroLink("Código do convite não identificado.");
        setCarregandoLink(false);
        return;
      }

      try {
        const response = await apiFetch<LinkPublicoResponse>(
          `/publico/links/${codigo}`
        );

        if (!componenteAtivo) return;

        setLinkPublico(response);

        if (!response.ativo) {
          setErroLink("Este convite não está disponível no momento.");
        }
      } catch (error) {
        if (!componenteAtivo) return;

        if (error instanceof Error) {
          setErroLink(
            error.message || "Este convite não está disponível no momento."
          );
        } else {
          setErroLink("Este convite não está disponível no momento.");
        }
      } finally {
        if (componenteAtivo) {
          setCarregandoLink(false);
        }
      }
    }

    carregarLinkPublico();

    return () => {
      componenteAtivo = false;
    };
  }, [codigo]);

  function atualizarCampo<K extends keyof FormApoiador>(
    campo: K,
    valor: FormApoiador[K]
  ) {
    setForm((atual) => ({
      ...atual,
      [campo]: valor,
    }));
  }

  function validarFormulario() {
    if (!form.nome.trim()) {
      return "Informe seu nome completo.";
    }

    if (!form.telefone.trim()) {
      return "Informe seu telefone/WhatsApp.";
    }

    if (!telefoneValido(form.telefone)) {
      return "Informe um telefone válido.";
    }

    if (!form.email.trim()) {
      return "Informe seu e-mail.";
    }

    if (!form.email.includes("@")) {
      return "Informe um e-mail válido.";
    }

    const tituloEleitor = normalizarTituloEleitor(form.tituloEleitor);

    if (!tituloEleitor) {
      return "Informe seu título de eleitor.";
    }

    if (tituloEleitor.length !== 12) {
      return "O título de eleitor deve ter 12 dígitos.";
    }


    if (!form.senha.trim()) {
      return "Informe uma senha.";
    }

    if (form.senha.trim().length < 6) {
      return "A senha deve ter no mínimo 6 caracteres.";
    }

    if (!form.confirmacaoSenha.trim()) {
      return "Confirme sua senha.";
    }

    if (form.senha !== form.confirmacaoSenha) {
      return "A senha e a confirmação não são iguais.";
    }

    if (!form.municipio.trim()) {
      return "Informe sua cidade.";
    }

    if (!form.bairro.trim()) {
      return "Informe seu bairro ou localidade.";
    }

    if (!form.zonaEleitoral.trim() || !numeroPositivo(form.zonaEleitoral)) {
      return "Informe um segmento válido.";
    }

    if (!form.secaoEleitoral.trim() || !numeroPositivo(form.secaoEleitoral)) {
      return "Informe um subsegmento válido.";
    }

    if (!form.consentimentoAceito) {
      return "É necessário aceitar o termo de consentimento.";
    }

    return "";
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setErroFormulario("");

    if (!linkPublico || !linkPublico.ativo) {
      setErroFormulario("Este convite não está disponível para cadastro.");
      return;
    }

    const erroValidacao = validarFormulario();

    if (erroValidacao) {
      setErroFormulario(erroValidacao);
      return;
    }

    setEnviando(true);

    try {
      const payload: CadastroApoiadorPublicoRequest = {
        codigoLink: codigo,
        nome: form.nome.trim(),
        email: form.email.trim().toLowerCase(),
        telefone: form.telefone.trim(),
        tituloEleitor: normalizarTituloEleitor(form.tituloEleitor),
        senha: form.senha,
        confirmacaoSenha: form.confirmacaoSenha,
        municipio: form.municipio.trim(),
        bairro: form.bairro.trim(),
        zonaEleitoral: Number(form.zonaEleitoral),
        secaoEleitoral: Number(form.secaoEleitoral),
        observacao: form.observacao.trim() || null,
        consentimentoAceito: form.consentimentoAceito,
      };

      await apiFetch("/publico/apoiadores", {
        method: "POST",
        body: JSON.stringify(payload),
      });

      router.push(
        `/cadastro/sucesso?candidato=${encodeURIComponent(
          linkPublico.nomePublico
        )}`
      );
    } catch (error) {
      if (error instanceof Error) {
        setErroFormulario(
          error.message || "Não foi possível finalizar o cadastro."
        );
      } else {
        setErroFormulario("Não foi possível finalizar o cadastro.");
      }
    } finally {
      setEnviando(false);
    }
  }

  if (carregandoLink) {
    return (
      <main className="min-h-screen bg-slate-50 px-4 py-6 sm:px-6 lg:px-8">
        <div className="mx-auto flex w-full max-w-3xl flex-col gap-6">
          <HeaderCadastro />

          <section className="rounded-2xl border border-slate-200 bg-white p-10 text-center shadow-sm">
            <div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-4 border-slate-100 border-t-emerald-500" />
            <h2 className="text-lg font-bold text-slate-900">
              Carregando convite...
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              Aguarde enquanto verificamos se este convite está disponível.
            </p>
          </section>
        </div>
      </main>
    );
  }

  if (erroLink || !linkPublico || !linkPublico.ativo) {
    return (
      <main className="min-h-screen bg-slate-50 px-4 py-6 sm:px-6 lg:px-8">
        <div className="mx-auto flex w-full max-w-3xl flex-col gap-6">
          <HeaderCadastro />

          <section className="rounded-2xl border border-red-100 bg-white p-8 text-center shadow-sm">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-red-50 text-red-600">
              <AlertCircle className="h-7 w-7" />
            </div>

            <h2 className="mt-4 text-xl font-bold text-slate-900">
              Convite indisponível
            </h2>

            <p className="mx-auto mt-2 max-w-md text-sm text-slate-500">
              {erroLink || "Este convite não está disponível no momento."}
            </p>

            <p className="mx-auto mt-4 max-w-md text-sm text-slate-500">
              Entre em contato com o responsável pela rede para solicitar um
              novo convite.
            </p>

            <a
              href="/"
              className="mt-6 inline-flex items-center justify-center rounded-xl border border-slate-200 bg-white px-5 py-3 text-sm font-bold text-slate-700 shadow-sm transition hover:bg-slate-50"
            >
              Entrar em contato com o responsável
            </a>
          </section>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto flex w-full max-w-3xl flex-col gap-6">
        <HeaderCadastro />

        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <p className="text-sm font-medium text-slate-500">
                Você está entrando na rede de:
              </p>

              <div className="mt-3 flex items-center gap-3">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-slate-900 text-white">
                  <UserCheck className="h-6 w-6" />
                </div>

                <div>
                  <h2 className="text-lg font-bold text-slate-900">
                    {linkPublico.nomePublico}
                  </h2>
                  <p className="text-sm text-slate-500">
                    Responsável pela rede
                  </p>
                </div>
              </div>
            </div>

            <span className="inline-flex w-fit items-center gap-1.5 rounded-full border border-emerald-100 bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-700">
              <LockKeyhole className="h-3.5 w-3.5" />
              Vinculado pelo convite
            </span>
          </div>

          <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-4">
            <InfoCard
              label="Grupo/Organização"
              value={textoOpcional(linkPublico.partido)}
              icon={Building2}
            />

            <InfoCard
              label="Código identificador"
              value={textoOpcional(linkPublico.numeroUrna)}
              icon={Hash}
            />

            <InfoCard
              label="Função/Perfil"
              value={textoOpcional(linkPublico.cargoPretendido)}
              icon={Briefcase}
            />

            <InfoCard
              label="Cidade base"
              value={textoOpcional(linkPublico.municipioBase)}
              icon={MapPin}
            />
          </div>

          <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
            <p className="text-xs leading-5 text-slate-500">
              Código do convite:{" "}
              <span className="font-mono font-semibold text-slate-700">
                {linkPublico.codigo}
              </span>
            </p>
            <p className="mt-1 text-xs leading-5 text-slate-500">
              Seu cadastro ficará vinculado automaticamente ao responsável por
              este convite.
            </p>
          </div>
        </section>

        <form
          onSubmit={handleSubmit}
          className="rounded-2xl border border-slate-200 bg-white shadow-sm"
        >
          <div className="border-b border-slate-100 p-5 sm:p-6">
            <h2 className="text-lg font-bold text-slate-900">
              Cadastro de usuário
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              Preencha seus dados para participar da rede através deste convite.
            </p>
            <p className="mt-2 text-xs leading-5 text-slate-500">
              Todo cadastro ocorre através de um convite válido.
            </p>
          </div>

          <div className="space-y-6 p-5 sm:p-6">
            {erroFormulario && (
              <div className="flex items-start gap-2 rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700">
                <AlertCircle className="mt-0.5 h-5 w-5 shrink-0" />
                <span>{erroFormulario}</span>
              </div>
            )}

            <section>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <InputField
                  label="Nome completo"
                  required
                  icon={User}
                  value={form.nome}
                  onChange={(value) => atualizarCampo("nome", value)}
                  placeholder="Digite seu nome completo"
                />

                <InputField
                  label="Telefone/WhatsApp"
                  required
                  icon={Phone}
                  value={form.telefone}
                  onChange={(value) => atualizarCampo("telefone", value)}
                  placeholder="(85) 99999-9999"
                  inputMode="tel"
                />

                <InputField
                  label="E-mail"
                  required
                  icon={Mail}
                  value={form.email}
                  onChange={(value) => atualizarCampo("email", value)}
                  placeholder="seuemail@exemplo.com"
                  type="email"
                  inputMode="email"
                />
              </div>
            </section>

            <section className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <div className="mb-4 flex items-start gap-2">
                <Lock className="mt-0.5 h-5 w-5 text-emerald-600" />
                <div>
                  <h3 className="font-bold text-slate-900">
                    Acesso ao sistema
                  </h3>
                  <p className="text-sm text-slate-500">
                    Crie uma senha para acessar sua área de usuário depois do
                    cadastro.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <InputField
                  label="Senha"
                  required
                  icon={Lock}
                  value={form.senha}
                  onChange={(value) => atualizarCampo("senha", value)}
                  placeholder="Mínimo de 6 caracteres"
                  type="password"
                />

                <InputField
                  label="Confirmar senha"
                  required
                  icon={Lock}
                  value={form.confirmacaoSenha}
                  onChange={(value) =>
                    atualizarCampo("confirmacaoSenha", value)
                  }
                  placeholder="Repita sua senha"
                  type="password"
                />
              </div>
            </section>

            <div className="sm:col-span-2">
              <InputField
                label="Título de eleitor"
                required
                icon={ShieldCheck}
                value={form.tituloEleitor}
                onChange={(value) => atualizarCampo("tituloEleitor", value)}
                placeholder="Digite os 12 dígitos"
                inputMode="numeric"
              />

              <p className="mt-1.5 text-xs leading-5 text-slate-500">
                Usado apenas para evitar cadastros duplicados. O sistema não armazena o
                número completo.
              </p>
            </div>

            <section className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <div className="mb-4 flex items-start gap-2">
                <Landmark className="mt-0.5 h-5 w-5 text-emerald-600" />
                <div>
                  <h3 className="font-bold text-slate-900">
                    Dados de classificação
                  </h3>
                  <p className="text-sm text-slate-500">
                    Informe os dados usados para organizar seu cadastro na rede.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <InputField
                  label="Cidade"
                  required
                  icon={MapPin}
                  value={form.municipio}
                  onChange={(value) => atualizarCampo("municipio", value)}
                  placeholder="Ex: Quixadá"
                />

                <InputField
                  label="Bairro ou localidade"
                  required
                  icon={MapPin}
                  value={form.bairro}
                  onChange={(value) => atualizarCampo("bairro", value)}
                  placeholder="Ex: Centro"
                />

                <InputField
                  label="Segmento"
                  required
                  icon={Landmark}
                  value={form.zonaEleitoral}
                  onChange={(value) => atualizarCampo("zonaEleitoral", value)}
                  placeholder="Ex: 6"
                  type="number"
                  inputMode="numeric"
                />

                <InputField
                  label="Subsegmento"
                  required
                  icon={Landmark}
                  value={form.secaoEleitoral}
                  onChange={(value) => atualizarCampo("secaoEleitoral", value)}
                  placeholder="Ex: 122"
                  type="number"
                  inputMode="numeric"
                />
              </div>
            </section>

            <div>
              <label
                htmlFor="observacao"
                className="mb-1.5 block text-sm font-medium text-slate-700"
              >
                Observação
              </label>

              <textarea
                id="observacao"
                value={form.observacao}
                onChange={(event) =>
                  atualizarCampo("observacao", event.target.value)
                }
                rows={4}
                placeholder="Observação opcional sobre o cadastro"
                className="block w-full resize-y rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none transition-colors placeholder:text-slate-400 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
              />
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-4">
              <div className="flex items-start gap-3">
                <input
                  id="consentimento"
                  type="checkbox"
                  checked={form.consentimentoAceito}
                  onChange={(event) =>
                    atualizarCampo("consentimentoAceito", event.target.checked)
                  }
                  className="mt-1 h-4 w-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                />

                <label
                  htmlFor="consentimento"
                  className="text-sm leading-6 text-slate-600"
                >
                  Declaro que desejo participar voluntariamente desta rede e
                  autorizo o tratamento dos meus dados conforme a política de
                  privacidade.
                </label>
              </div>
            </div>

            <button
              type="submit"
              disabled={enviando}
              className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 px-5 py-3 text-sm font-bold text-white shadow-sm transition-colors hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {enviando ? (
                <>
                  <CheckCircle2 className="h-5 w-5 animate-pulse" />
                  Finalizando cadastro...
                </>
              ) : (
                <>
                  <Send className="h-5 w-5" />
                  Finalizar cadastro
                </>
              )}
            </button>
          </div>
        </form>

        <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex items-start gap-3">
            <FileText className="mt-0.5 h-5 w-5 shrink-0 text-slate-400" />
            <p className="text-sm leading-6 text-slate-500">
              Cada usuário fica automaticamente vinculado ao responsável pelo
              convite. Os dados coletados são utilizados apenas para organização
              e gestão da rede.
            </p>
          </div>
        </section>
      </div>
    </main>
  );
}

function HeaderCadastro() {
  return (
    <header className="text-center">
      <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-600 text-white shadow-sm">
        <ShieldCheck className="h-7 w-7" />
      </div>

      <h1 className="mt-4 text-2xl font-bold tracking-tight text-slate-900">
        Rede Pesquisa
      </h1>

      <p className="mt-1 text-sm font-medium text-slate-500">
        Cadastro por convite
      </p>
    </header>
  );
}

function InfoCard({
  label,
  value,
  icon: Icon,
}: {
  label: string;
  value: string;
  icon: LucideIcon;
}) {
  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
      <p className="mb-1 flex items-center gap-1.5 text-xs font-medium text-slate-500">
        <Icon className="h-3.5 w-3.5" />
        {label}
      </p>
      <p className="font-bold text-slate-900">{value}</p>
    </div>
  );
}

function InputField({
  label,
  value,
  onChange,
  placeholder,
  icon: Icon,
  required = false,
  type = "text",
  inputMode,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  icon: LucideIcon;
  required?: boolean;
  type?: string;
  inputMode?:
    | "text"
    | "search"
    | "email"
    | "tel"
    | "url"
    | "none"
    | "numeric"
    | "decimal";
}) {
  return (
    <div>
      <label className="mb-1.5 block text-sm font-medium text-slate-700">
        {label} {required && <span className="text-red-500">*</span>}
      </label>

      <div className="relative">
        <Icon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />

        <input
          type={type}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder={placeholder}
          inputMode={inputMode}
          className="block w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-9 pr-3 text-sm text-slate-900 outline-none transition-colors placeholder:text-slate-400 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
        />
      </div>
    </div>
  );
}