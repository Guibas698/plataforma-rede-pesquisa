"use client";

import { useCallback, useEffect, useRef, useState, type ChangeEvent } from "react";
import type { LucideIcon } from "lucide-react";
import {
  AlertCircle,
  Briefcase,
  Building2,
  Camera,
  CheckCircle2,
  Eye,
  EyeOff,
  Hash,
  Home,
  Landmark,
  Lock,
  Mail,
  MapPin,
  Phone,
  Save,
  ShieldCheck,
  Trash2,
  User,
  UserCheck,
} from "lucide-react";

import { apiFetch } from "../../lib/api";

type ApoiadorMeResponse = {
  id: string;
  usuarioId?: string;
  nome: string;
  email?: string | null;
  telefone: string;
  fotoUrl?: string | null;
  tituloEleitorUltimos4?: string | null;
  municipio: string;
  bairro: string;
  zonaEleitoral: number;
  secaoEleitoral: number;
  observacao?: string | null;
  status: string;
  origemCadastro: string;
  consentimentoAceito: boolean;
  consentimentoData?: string | null;
  ativo: boolean;
  criadoEm: string;

  candidatoId: string;
  candidatoNomePublico: string;
  candidatoPartido?: string | null;
  candidatoNumeroUrna?: string | null;
  candidatoCargoPretendido: string;
  candidatoMunicipioBase: string;
};

type PerfilApoiadorForm = {
  nomeCompleto: string;
  telefone: string;
  email: string;
  municipio: string;
  bairro: string;
  zonaEleitoral: string;
  secaoEleitoral: string;
  observacao: string;
  senhaAtual: string;
  novaSenha: string;
  confirmarNovaSenha: string;
};

type AtualizarApoiadorRequest = {
  nome: string;
  email: string | null;
  telefone: string;
  municipio: string;
  bairro: string;
  zonaEleitoral: number;
  secaoEleitoral: number;
  observacao: string | null;
};

type AlterarSenhaRequest = {
  senhaAtual: string;
  novaSenha: string;
  confirmacaoNovaSenha: string;
};

const formInicial: PerfilApoiadorForm = {
  nomeCompleto: "",
  telefone: "",
  email: "",
  municipio: "",
  bairro: "",
  zonaEleitoral: "",
  secaoEleitoral: "",
  observacao: "",
  senhaAtual: "",
  novaSenha: "",
  confirmarNovaSenha: "",
};

const inputBaseClass =
  "h-11 w-full rounded-xl border border-slate-200 bg-white px-4 text-sm text-slate-900 placeholder:text-slate-400 outline-none transition focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100 disabled:bg-slate-50 disabled:text-slate-500";

function textoOuPadrao(valor?: string | number | null) {
  if (valor === null || valor === undefined || String(valor).trim() === "") {
    return "Não informado";
  }

  return String(valor);
}

function numeroPositivo(valor: string) {
  const numero = Number(valor);
  return Number.isInteger(numero) && numero > 0;
}

function formatarStatus(status?: string | null) {
  const valor = (status || "").toUpperCase();

  if (valor === "ATIVO") return "Ativo";
  if (valor === "PENDENTE") return "Pendente";
  if (valor === "INATIVO") return "Inativo";

  return textoOuPadrao(status);
}

function formatarOrigem(origem?: string | null) {
  const valor = (origem || "").toUpperCase();

  if (valor === "LINK_CANDIDATO") return "Convite do ADM";
  if (valor === "CADASTRO_MANUAL") return "Cadastro manual";

  return textoOuPadrao(origem);
}

function formatarData(data?: string | null) {
  if (!data) return "Não informado";

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

function formatarTituloUltimos4(valor?: string | null): string {
  const texto = valor?.trim();

  if (!texto) {
    return "Não informado";
  }

  return `****${texto}`;
}

function montarFormApoiador(apoiador: ApoiadorMeResponse): PerfilApoiadorForm {
  return {
    nomeCompleto: apoiador.nome ?? "",
    telefone: apoiador.telefone ?? "",
    email: apoiador.email ?? "",
    municipio: apoiador.municipio ?? "",
    bairro: apoiador.bairro ?? "",
    zonaEleitoral: String(apoiador.zonaEleitoral ?? ""),
    secaoEleitoral: String(apoiador.secaoEleitoral ?? ""),
    observacao: apoiador.observacao ?? "",
    senhaAtual: "",
    novaSenha: "",
    confirmarNovaSenha: "",
  };
}

export default function ApoiadorPerfilPage() {
  const [apoiador, setApoiador] = useState<ApoiadorMeResponse | null>(null);
  const [form, setForm] = useState<PerfilApoiadorForm>(formInicial);
  const [imagemPerfil, setImagemPerfil] = useState<string | null>(null);
  const [mensagemImagem, setMensagemImagem] = useState("");
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState("");
  const [sucesso, setSucesso] = useState("");
  const [salvando, setSalvando] = useState(false);

  const [mostrarSenhaAtual, setMostrarSenhaAtual] = useState(false);
  const [mostrarNovaSenha, setMostrarNovaSenha] = useState(false);
  const [mostrarConfirmarNovaSenha, setMostrarConfirmarNovaSenha] =
    useState(false);

  const inputImagemRef = useRef<HTMLInputElement | null>(null);

  const carregarApoiador = useCallback(async () => {
    setCarregando(true);
    setErro("");
    setSucesso("");

    try {
      const response = await apiFetch<ApoiadorMeResponse>("/apoiador/me");

      setApoiador(response);
      setForm(montarFormApoiador(response));
      setImagemPerfil(response.fotoUrl ?? null);
    } catch (error) {
      if (error instanceof Error) {
        setErro(error.message || "Não foi possível carregar seus dados.");
      } else {
        setErro("Não foi possível carregar seus dados.");
      }
    } finally {
      setCarregando(false);
    }
  }, []);

  useEffect(() => {
    carregarApoiador();
  }, [carregarApoiador]);

  function atualizarCampo<K extends keyof PerfilApoiadorForm>(
    campo: K,
    valor: PerfilApoiadorForm[K]
  ) {
    setForm((atual) => ({
      ...atual,
      [campo]: valor,
    }));
  }

  function handleSelecionarImagem(event: ChangeEvent<HTMLInputElement>) {
    const arquivo = event.target.files?.[0];

    if (!arquivo) {
      return;
    }

    if (!arquivo.type.startsWith("image/")) {
      setErro("Selecione um arquivo de imagem válido.");
      event.target.value = "";
      return;
    }

    const reader = new FileReader();

    reader.onloadend = () => {
      if (typeof reader.result === "string") {
        setImagemPerfil(reader.result);
        setMensagemImagem(
          "Imagem selecionada. O envio real será integrado ao backend futuramente."
        );
        setErro("");
      }
    };

    reader.readAsDataURL(arquivo);
  }

  function validarFormulario() {
    if (!form.nomeCompleto.trim()) {
      return "O nome completo é obrigatório.";
    }

    if (!form.telefone.trim()) {
      return "O telefone é obrigatório.";
    }

    if (form.email.trim() && !form.email.includes("@")) {
      return "Informe um e-mail válido.";
    }

    if (!form.municipio.trim()) {
      return "A cidade é obrigatória.";
    }

    if (!form.bairro.trim()) {
      return "O bairro ou localidade é obrigatório.";
    }

    if (!numeroPositivo(form.zonaEleitoral)) {
      return "Informe um segmento válido.";
    }

    if (!numeroPositivo(form.secaoEleitoral)) {
      return "Informe um subsegmento válido.";
    }

    const algumCampoSenhaPreenchido = Boolean(
      form.senhaAtual.trim() ||
        form.novaSenha.trim() ||
        form.confirmarNovaSenha.trim()
    );

    if (algumCampoSenhaPreenchido) {
      if (
        !form.senhaAtual.trim() ||
        !form.novaSenha.trim() ||
        !form.confirmarNovaSenha.trim()
      ) {
        return "Para trocar a senha, preencha os três campos de senha.";
      }

      if (form.novaSenha.trim().length < 6) {
        return "A nova senha deve ter no mínimo 6 caracteres.";
      }

      if (form.novaSenha !== form.confirmarNovaSenha) {
        return "A nova senha e a confirmação não são iguais.";
      }
    }

    return "";
  }

  async function handleSalvarAlteracoes() {
    setErro("");
    setSucesso("");

    const erroValidacao = validarFormulario();

    if (erroValidacao) {
      setErro(erroValidacao);
      return;
    }

    const algumCampoSenhaPreenchido = Boolean(
      form.senhaAtual.trim() ||
        form.novaSenha.trim() ||
        form.confirmarNovaSenha.trim()
    );

    setSalvando(true);

    try {
      const payloadPerfil: AtualizarApoiadorRequest = {
        nome: form.nomeCompleto.trim(),
        email: form.email.trim() || null,
        telefone: form.telefone.trim(),
        municipio: form.municipio.trim(),
        bairro: form.bairro.trim(),
        zonaEleitoral: Number(form.zonaEleitoral),
        secaoEleitoral: Number(form.secaoEleitoral),
        observacao: form.observacao.trim() || null,
      };

      await apiFetch<void>("/apoiador/me", {
        method: "PATCH",
        body: JSON.stringify(payloadPerfil),
      });

      if (algumCampoSenhaPreenchido) {
        const payloadSenha: AlterarSenhaRequest = {
          senhaAtual: form.senhaAtual,
          novaSenha: form.novaSenha,
          confirmacaoNovaSenha: form.confirmarNovaSenha,
        };

        await apiFetch<void>("/apoiador/senha", {
          method: "PATCH",
          body: JSON.stringify(payloadSenha),
        });

        setForm((atual) => ({
          ...atual,
          senhaAtual: "",
          novaSenha: "",
          confirmarNovaSenha: "",
        }));
      }

      setApoiador((atual) =>
        atual
          ? {
              ...atual,
              nome: payloadPerfil.nome,
              email: payloadPerfil.email,
              telefone: payloadPerfil.telefone,
              municipio: payloadPerfil.municipio,
              bairro: payloadPerfil.bairro,
              zonaEleitoral: payloadPerfil.zonaEleitoral,
              secaoEleitoral: payloadPerfil.secaoEleitoral,
              observacao: payloadPerfil.observacao,
            }
          : atual
      );

      setSucesso(
        algumCampoSenhaPreenchido
          ? "Perfil e senha atualizados com sucesso."
          : "Perfil atualizado com sucesso."
      );
    } catch (error) {
      if (error instanceof Error) {
        setErro(error.message || "Não foi possível salvar as alterações.");
      } else {
        setErro("Não foi possível salvar as alterações.");
      }
    } finally {
      setSalvando(false);
    }
  }

  if (carregando) {
    return (
      <div className="space-y-6">
        <section className="rounded-2xl border border-slate-200 bg-white p-10 text-center shadow-sm">
          <div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-4 border-slate-100 border-t-emerald-500" />
          <h2 className="text-lg font-bold text-slate-900">
            Carregando seus dados...
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            Buscando as informações do seu perfil.
          </p>
        </section>
      </div>
    );
  }

  if (erro && !apoiador) {
    return (
      <div className="space-y-6">
        <section className="rounded-2xl border border-red-100 bg-white p-8 text-center shadow-sm">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-red-50 text-red-600">
            <AlertCircle className="h-7 w-7" />
          </div>

          <h2 className="mt-4 text-xl font-bold text-slate-900">
            Não foi possível carregar seu perfil
          </h2>

          <p className="mx-auto mt-2 max-w-md text-sm text-slate-500">
            {erro || "Não foi possível carregar seus dados."}
          </p>
        </section>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <section className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Meu perfil
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Atualize seus dados pessoais e de classificação.
          </p>
        </div>

        <button
          type="button"
          onClick={handleSalvarAlteracoes}
          disabled={salvando}
          className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 px-5 text-sm font-bold text-white shadow-sm transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-70 sm:w-auto"
        >
          <Save className="h-4 w-4" />
          {salvando ? "Salvando..." : "Salvar alterações"}
        </button>
      </section>

      {erro && (
        <div className="flex items-start gap-2 rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700">
          <AlertCircle className="mt-0.5 h-5 w-5 shrink-0" />
          <span>{erro}</span>
        </div>
      )}

      {sucesso && (
        <div className="flex items-start gap-2 rounded-2xl border border-emerald-100 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
          <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0" />
          <span>{sucesso}</span>
        </div>
      )}

      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
        <div className="flex flex-col items-center gap-4 sm:flex-row sm:items-start">
          <div className="relative shrink-0">
            <div className="flex h-24 w-24 items-center justify-center overflow-hidden rounded-full border-4 border-white bg-slate-100 text-slate-400 shadow-md">
              {imagemPerfil ? (
                <img
                  src={imagemPerfil}
                  alt="Foto do usuário"
                  className="h-full w-full object-cover"
                />
              ) : (
                <User className="h-10 w-10" />
              )}
            </div>

            <input
              ref={inputImagemRef}
              type="file"
              accept="image/*"
              onChange={handleSelecionarImagem}
              className="hidden"
            />

            <button
              type="button"
              onClick={() => inputImagemRef.current?.click()}
              className="absolute bottom-0 right-0 flex h-8 w-8 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-600 shadow-sm transition hover:text-emerald-600"
              aria-label="Selecionar imagem de perfil"
            >
              <Camera className="h-4 w-4" />
            </button>
          </div>

          <div className="w-full text-center sm:text-left">
            <h2 className="text-lg font-bold text-slate-900">
              {textoOuPadrao(form.nomeCompleto)}
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              {formatarOrigem(apoiador?.origemCadastro)} na plataforma.
            </p>

            {mensagemImagem && (
              <p className="mt-3 rounded-xl border border-emerald-100 bg-emerald-50 px-3 py-2 text-xs font-medium text-emerald-700">
                {mensagemImagem}
              </p>
            )}
          </div>
        </div>
      </section>

      <section className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
          <CardHeader
            icon={User}
            title="Dados pessoais"
            description="Informações usadas para identificar seu cadastro."
          />

          <div className="space-y-4 p-5 sm:p-6">
            <InputField
              label="Nome completo"
              icon={User}
              value={form.nomeCompleto}
              onChange={(value) => atualizarCampo("nomeCompleto", value)}
              placeholder="Digite seu nome completo"
            />

            <InputField
              label="Telefone/WhatsApp"
              icon={Phone}
              value={form.telefone}
              onChange={(value) => atualizarCampo("telefone", value)}
              placeholder="(88) 99999-9999"
              inputMode="tel"
            />

            <InputField
              label="E-mail de acesso"
              icon={Mail}
              value={form.email}
              onChange={(value) => atualizarCampo("email", value)}
              placeholder="seuemail@exemplo.com"
              type="email"
              inputMode="email"
            />
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
          <CardHeader
            icon={UserCheck}
            title="ADM vinculado"
            description="O ADM vinculado não pode ser alterado por aqui."
          />

          <div className="p-5 sm:p-6">
            <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-slate-900 text-white">
                <UserCheck className="h-6 w-6" />
              </div>

              <div>
                <h3 className="font-bold text-slate-900">
                  {textoOuPadrao(apoiador?.candidatoNomePublico)}
                </h3>
                <p className="text-sm text-slate-500">
                  {textoOuPadrao(apoiador?.candidatoCargoPretendido)}
                </p>
              </div>
            </div>

            <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
              <ReadonlyInfo
                label="Grupo/Organização"
                value={textoOuPadrao(apoiador?.candidatoPartido)}
                icon={Building2}
              />
              <ReadonlyInfo
                label="Código identificador"
                value={textoOuPadrao(apoiador?.candidatoNumeroUrna)}
                icon={Hash}
              />
              <ReadonlyInfo
                label="Função/Perfil"
                value={textoOuPadrao(apoiador?.candidatoCargoPretendido)}
                icon={Briefcase}
              />
              <ReadonlyInfo
                label="Cidade base"
                value={textoOuPadrao(apoiador?.candidatoMunicipioBase)}
                icon={MapPin}
              />
            </div>
          </div>
        </div>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white shadow-sm">
        <CardHeader
          icon={Landmark}
          title="Dados de classificação"
          description="Atualize as informações usadas para organizar seu cadastro."
        />

        <div className="grid grid-cols-1 gap-4 p-5 sm:grid-cols-2 sm:p-6">
          <InputField
            label="Cidade"
            icon={MapPin}
            value={form.municipio}
            onChange={(value) => atualizarCampo("municipio", value)}
            placeholder="Ex: Quixadá"
          />

          <InputField
            label="Bairro/localidade"
            icon={Home}
            value={form.bairro}
            onChange={(value) => atualizarCampo("bairro", value)}
            placeholder="Ex: Centro"
          />

          <InputField
            label="Segmento"
            icon={Landmark}
            value={form.zonaEleitoral}
            onChange={(value) => atualizarCampo("zonaEleitoral", value)}
            placeholder="Ex: 6"
            type="number"
            inputMode="numeric"
          />

          <InputField
            label="Subsegmento"
            icon={Landmark}
            value={form.secaoEleitoral}
            onChange={(value) => atualizarCampo("secaoEleitoral", value)}
            placeholder="Ex: 25"
            type="number"
            inputMode="numeric"
          />

          <div className="sm:col-span-2">
            <label
              htmlFor="observacao"
              className="mb-1.5 block text-sm font-medium text-slate-700"
            >
              Observação opcional
            </label>

            <textarea
              id="observacao"
              value={form.observacao}
              onChange={(event) =>
                atualizarCampo("observacao", event.target.value)
              }
              placeholder="Alguma informação adicional sobre seu cadastro?"
              rows={4}
              className="w-full resize-none rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100"
            />
          </div>
        </div>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white shadow-sm">
        <CardHeader
          icon={Lock}
          title="Segurança"
          description="Preencha apenas se quiser trocar sua senha."
        />

        <div className="grid grid-cols-1 gap-4 p-5 sm:p-6 lg:grid-cols-3">
          <PasswordField
            label="Senha atual"
            value={form.senhaAtual}
            onChange={(value) => atualizarCampo("senhaAtual", value)}
            placeholder="Digite sua senha atual"
            mostrarSenha={mostrarSenhaAtual}
            onToggleMostrarSenha={() =>
              setMostrarSenhaAtual((atual) => !atual)
            }
          />

          <PasswordField
            label="Nova senha"
            value={form.novaSenha}
            onChange={(value) => atualizarCampo("novaSenha", value)}
            placeholder="Mínimo de 6 caracteres"
            mostrarSenha={mostrarNovaSenha}
            onToggleMostrarSenha={() => setMostrarNovaSenha((atual) => !atual)}
          />

          <PasswordField
            label="Confirmar nova senha"
            value={form.confirmarNovaSenha}
            onChange={(value) => atualizarCampo("confirmarNovaSenha", value)}
            placeholder="Repita a nova senha"
            mostrarSenha={mostrarConfirmarNovaSenha}
            onToggleMostrarSenha={() =>
              setMostrarConfirmarNovaSenha((atual) => !atual)
            }
          />
        </div>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white shadow-sm">
        <CardHeader
          icon={ShieldCheck}
          title="Informações do cadastro"
          description="Esses dados são controlados pelo sistema e não podem ser alterados por aqui."
        />

        <div className="grid grid-cols-1 gap-3 p-5 sm:grid-cols-2 sm:p-6 lg:grid-cols-5">
          <ReadonlyInfo
            label="Status"
            value={formatarStatus(apoiador?.status)}
            icon={ShieldCheck}
          />
          <ReadonlyInfo
            label="Origem"
            value={formatarOrigem(apoiador?.origemCadastro)}
            icon={UserCheck}
          />
          <ReadonlyInfo
            label="Consentimento"
            value={apoiador?.consentimentoAceito ? "Aceito" : "Não aceito"}
            icon={ShieldCheck}
          />
          <ReadonlyInfo
            label="Título cadastrado"
            value={formatarTituloUltimos4(apoiador?.tituloEleitorUltimos4)}
            icon={ShieldCheck}
          />
          <ReadonlyInfo
            label="Cadastro em"
            value={formatarData(apoiador?.criadoEm)}
            icon={Landmark}
          />
        </div>
      </section>

      <section className="rounded-2xl border border-red-100 bg-white p-5 shadow-sm sm:p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <Trash2 className="h-5 w-5 text-red-600" />
              <h2 className="font-bold text-slate-900">Excluir conta</h2>
            </div>

            <p className="mt-1 text-sm leading-6 text-slate-500">
              A exclusão da conta será integrada futuramente quando houver um
              endpoint específico no backend.
            </p>
          </div>

          <button
            type="button"
            disabled
            className="inline-flex h-11 w-full cursor-not-allowed items-center justify-center gap-2 rounded-xl border border-red-100 bg-red-50 px-4 text-sm font-bold text-red-300 sm:w-auto"
          >
            <Trash2 className="h-4 w-4" />
            Indisponível
          </button>
        </div>
      </section>

      <section className="flex items-start gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-slate-400" />

        <p className="text-sm leading-6 text-slate-500">
          Seu cadastro representa uma participação voluntária na plataforma.
          Você pode solicitar atualização ou remoção dos dados conforme a
          política de privacidade.
        </p>
      </section>
    </div>
  );
}

type CardHeaderProps = {
  icon: LucideIcon;
  title: string;
  description: string;
};

function CardHeader({ icon: Icon, title, description }: CardHeaderProps) {
  return (
    <div className="border-b border-slate-100 p-5 sm:p-6">
      <div className="flex items-center gap-2">
        <Icon className="h-5 w-5 text-emerald-600" />
        <h2 className="font-bold text-slate-900">{title}</h2>
      </div>
      <p className="mt-1 text-sm text-slate-500">{description}</p>
    </div>
  );
}

type InputFieldProps = {
  label: string;
  icon: LucideIcon;
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  type?: string;
  inputMode?: "text" | "tel" | "email" | "numeric" | "decimal" | "search";
};

function InputField({
  label,
  icon: Icon,
  value,
  onChange,
  placeholder,
  type = "text",
  inputMode,
}: InputFieldProps) {
  return (
    <div>
      <label className="mb-1.5 block text-sm font-medium text-slate-700">
        {label}
      </label>

      <div className="relative">
        <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
          <Icon className="h-4 w-4 text-slate-400" />
        </div>

        <input
          type={type}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder={placeholder}
          inputMode={inputMode}
          className={`${inputBaseClass} pl-10`}
        />
      </div>
    </div>
  );
}

type PasswordFieldProps = {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  mostrarSenha: boolean;
  onToggleMostrarSenha: () => void;
};

function PasswordField({
  label,
  value,
  onChange,
  placeholder,
  mostrarSenha,
  onToggleMostrarSenha,
}: PasswordFieldProps) {
  return (
    <div>
      <label className="mb-1.5 block text-sm font-medium text-slate-700">
        {label}
      </label>

      <div className="relative">
        <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
          <Lock className="h-4 w-4 text-slate-400" />
        </div>

        <input
          type={mostrarSenha ? "text" : "password"}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder={placeholder}
          className={`${inputBaseClass} pl-10 pr-10`}
        />

        <button
          type="button"
          onClick={onToggleMostrarSenha}
          className="absolute inset-y-0 right-0 flex items-center pr-3 text-slate-400 transition hover:text-slate-600"
          aria-label="Mostrar ou ocultar senha"
        >
          {mostrarSenha ? (
            <EyeOff className="h-4 w-4" />
          ) : (
            <Eye className="h-4 w-4" />
          )}
        </button>
      </div>
    </div>
  );
}

type ReadonlyInfoProps = {
  label: string;
  value: string;
  icon: LucideIcon;
};

function ReadonlyInfo({ label, value, icon: Icon }: ReadonlyInfoProps) {
  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
      <p className="flex items-center gap-1.5 text-xs font-medium text-slate-500">
        <Icon className="h-3.5 w-3.5 text-slate-400" />
        {label}
      </p>
      <p className="mt-1 text-sm font-bold text-slate-900">{value}</p>
    </div>
  );
}