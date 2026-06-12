"use client";

import {
  User,
  Mail,
  Lock,
  Camera,
  Building,
  Hash,
  Phone,
  Save,
  Shield,
  Briefcase,
  Eye,
  EyeOff,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";
import { useEffect, useRef, useState, type ChangeEvent } from "react";
import { apiFetch } from "../../lib/api";
import { obterUsuarioSalvo } from "../../lib/auth";

type CandidatoPerfilResponse = {
  id?: string;
  nome?: string;
  nomePublico?: string | null;
  email: string;
  telefone?: string | null;
  tituloEleitorUltimos4?: string | null;
  partido?: string | null;
  numeroUrna?: string | number | null;
  numero_urna?: string | number | null;
  cargoPretendido?: string | null;
  cargo?: string | null;
  municipioBase?: string | null;
  municipio?: string | null;
  fotoUrl?: string | null;
  observacaoInterna?: string | null;
};

type AtualizarPerfilRequest = {
  nomeCompleto: string;
  nomePublico: string;
  telefone: string;
  municipioBase: string;
  partido: string;
  numeroUrna: string;
  cargoPretendido: string;
  observacaoInterna: string;
};

type AlterarSenhaRequest = {
  senhaAtual: string;
  novaSenha: string;
  confirmacaoNovaSenha: string;
};

function obterNumeroUrna(perfil: CandidatoPerfilResponse): string {
  const numero = perfil.numeroUrna ?? perfil.numero_urna;

  if (numero === null || numero === undefined || String(numero).trim() === "") {
    return "Não informado";
  }

  return String(numero);
}

function obterCargoPretendido(perfil: CandidatoPerfilResponse): string {
  return perfil.cargoPretendido || perfil.cargo || "Não informado";
}

function formatarTituloUltimos4(valor?: string | null): string {
  const texto = valor?.trim();

  if (!texto) {
    return "Identificador obrigatório pendente.";
  }

  return `****${texto}`;
}


export default function PerfilPage() {
  const [nome, setNome] = useState("");
  const [telefone, setTelefone] = useState("");
  const [email, setEmail] = useState("");
  const [tituloEleitorUltimos4, setTituloEleitorUltimos4] = useState<string | null>(null);
  const [municipioBase, setMunicipioBase] = useState("");
  const usuario = obterUsuarioSalvo();
  const isLider = usuario?.papel === "LIDER";
  const nomePapel = isLider ? "líder" : "ADM";

  const [partido, setPartido] = useState("Não informado");
  const [numeroUrna, setNumeroUrna] = useState("Não informado");
  const [cargoPretendido, setCargoPretendido] = useState("Não informado");
  const [observacaoInterna, setObservacaoInterna] = useState("");

  const [carregandoPerfil, setCarregandoPerfil] = useState(true);

  const [imagemPerfil, setImagemPerfil] = useState<string | null>(null);
  const [mensagemImagem, setMensagemImagem] = useState("");

  const [senhaAtual, setSenhaAtual] = useState("");
  const [novaSenha, setNovaSenha] = useState("");
  const [confirmarSenha, setConfirmarSenha] = useState("");

  const [mostrarSenhaAtual, setMostrarSenhaAtual] = useState(false);
  const [mostrarNovaSenha, setMostrarNovaSenha] = useState(false);
  const [mostrarConfirmarSenha, setMostrarConfirmarSenha] = useState(false);

  const [erro, setErro] = useState("");
  const [sucesso, setSucesso] = useState("");
  const [salvando, setSalvando] = useState(false);


  const inputImagemRef = useRef<HTMLInputElement | null>(null);

  const inputBaseClass =
    "h-11 w-full rounded-xl border border-slate-200 bg-white px-4 text-sm text-slate-900 placeholder:text-slate-400 outline-none transition focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100 disabled:bg-slate-50 disabled:text-slate-500";

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
          "Imagem selecionada. Ela será enviada ao backend quando a integração estiver pronta."
        );
        setErro("");
      }
    };

    reader.readAsDataURL(arquivo);
  }

  useEffect(() => {
    let componenteAtivo = true;

    async function carregarPerfil() {
      setCarregandoPerfil(true);
      setErro("");

      try {
        const response = await apiFetch<CandidatoPerfilResponse>(
          "/candidato/perfil"
        );

        if (!componenteAtivo) {
          return;
        }

        setNome(response.nomePublico || response.nome || "");
        setTelefone(response.telefone ?? "");
        setEmail(response.email ?? "");
        setTituloEleitorUltimos4(response.tituloEleitorUltimos4 ?? null);
        setMunicipioBase(response.municipioBase || response.municipio || "");

        setPartido(response.partido || "Não informado");
        setNumeroUrna(obterNumeroUrna(response));
        setCargoPretendido(obterCargoPretendido(response));
        setObservacaoInterna(response.observacaoInterna ?? "");

        if (response.fotoUrl) {
          setImagemPerfil(response.fotoUrl);
        }
      } catch (error) {
        if (!componenteAtivo) {
          return;
        }

        if (error instanceof Error) {
          setErro(error.message || "Não foi possível carregar o perfil.");
        } else {
          setErro("Não foi possível carregar o perfil.");
        }
      } finally {
        if (componenteAtivo) {
          setCarregandoPerfil(false);
        }
      }
    }

    carregarPerfil();

    return () => {
      componenteAtivo = false;
    };
  }, []);

  async function handleSalvarAlteracoes() {
    setErro("");
    setSucesso("");

    if (!nome.trim()) {
      setErro("O nome é obrigatório.");
      return;
    }

    if (!telefone.trim()) {
      setErro("O telefone é obrigatório.");
      return;
    }

    if (!municipioBase.trim()) {
      setErro("A cidade base é obrigatória.");
      return;
    }

    if (!cargoPretendido.trim() || cargoPretendido === "Não informado") {
      setErro("A função/perfil é obrigatória.");
      return;
    }

    const algumCampoSenhaPreenchido =
      senhaAtual.trim() || novaSenha.trim() || confirmarSenha.trim();

    if (algumCampoSenhaPreenchido) {
      if (!senhaAtual.trim() || !novaSenha.trim() || !confirmarSenha.trim()) {
        setErro("Para trocar a senha, preencha os três campos de senha.");
        return;
      }

      if (novaSenha.length < 6) {
        setErro("A nova senha deve ter no mínimo 6 caracteres.");
        return;
      }

      if (novaSenha !== confirmarSenha) {
        setErro("A nova senha e a confirmação não são iguais.");
        return;
      }
    }

    setSalvando(true);

    try {
      const payloadPerfil: AtualizarPerfilRequest = {
        nomeCompleto: nome.trim(),
        nomePublico: nome.trim(),
        telefone: telefone.trim(),
        municipioBase: municipioBase.trim(),
        partido: partido === "Não informado" ? "" : partido.trim(),
        numeroUrna: numeroUrna === "Não informado" ? "" : numeroUrna.trim(),
        cargoPretendido: cargoPretendido.trim(),
        observacaoInterna: observacaoInterna.trim(),
      };

      await apiFetch<CandidatoPerfilResponse>("/candidato/perfil", {
        method: "PATCH",
        body: JSON.stringify(payloadPerfil),
      });

      if (algumCampoSenhaPreenchido) {
        const payloadSenha: AlterarSenhaRequest = {
          senhaAtual,
          novaSenha,
          confirmacaoNovaSenha: confirmarSenha,
        };

        await apiFetch<void>("/candidato/senha", {
          method: "PATCH",
          body: JSON.stringify(payloadSenha),
        });

        setSenhaAtual("");
        setNovaSenha("");
        setConfirmarSenha("");
      }

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

  if (carregandoPerfil) {
    return (
      <div className="p-4 sm:p-6 lg:p-8 max-w-4xl mx-auto">
        <div className="bg-white border border-slate-200 rounded-xl p-12 flex flex-col items-center justify-center text-center shadow-sm">
          <div className="w-12 h-12 border-4 border-slate-100 border-t-emerald-500 rounded-full animate-spin mb-4" />
          <h3 className="text-lg font-semibold text-slate-900">
            Carregando perfil...
          </h3>
          <p className="text-slate-500 mt-1 max-w-sm">
            Buscando suas informações no sistema.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-4xl mx-auto space-y-6 lg:space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <User className="w-6 h-6 text-emerald-600" />
            Meu perfil
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Gerencie suas informações de {nomePapel} e credenciais de acesso.
          </p>
        </div>

        <button
          type="button"
          onClick={handleSalvarAlteracoes}
          disabled={salvando}
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-emerald-600 text-white text-sm font-medium rounded-lg hover:bg-emerald-700 transition-colors shadow-sm w-full sm:w-auto disabled:opacity-70 disabled:cursor-not-allowed"
        >
          <Save className="w-4 h-4" />
          {salvando ? "Salvando..." : "Salvar alterações"}
        </button>
      </div>

      {erro && (
        <div className="bg-red-50 border border-red-100 text-red-700 rounded-xl px-4 py-3 flex items-start gap-2 text-sm">
          <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
          <span>{erro}</span>
        </div>
      )}

      {sucesso && (
        <div className="bg-emerald-50 border border-emerald-100 text-emerald-700 rounded-xl px-4 py-3 flex items-start gap-2 text-sm">
          <CheckCircle2 className="w-5 h-5 shrink-0 mt-0.5" />
          <span>{sucesso}</span>
        </div>
      )}

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-5 sm:p-6 border-b border-slate-100 flex flex-col sm:flex-row gap-6 items-center sm:items-start">
          <div className="relative shrink-0">
            <div className="w-24 h-24 rounded-full bg-slate-100 border-4 border-white shadow-md flex items-center justify-center text-slate-400 overflow-hidden">
              {imagemPerfil ? (
                <img
                  src={imagemPerfil}
                  alt="Foto do perfil"
                  className="w-full h-full object-cover"
                />
              ) : (
                <User className="w-10 h-10" />
              )}
            </div>

            <input
              ref={inputImagemRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleSelecionarImagem}
            />

            <button
              type="button"
              onClick={() => inputImagemRef.current?.click()}
              className="absolute bottom-0 right-0 p-1.5 bg-white border border-slate-200 rounded-full text-slate-600 hover:text-emerald-600 shadow-sm transition-colors"
              aria-label="Selecionar imagem de perfil"
            >
              <Camera className="w-4 h-4" />
            </button>
          </div>

          <div className="flex-1 w-full space-y-4">
            <div>
              <h3 className="text-lg font-semibold text-slate-900 text-center sm:text-left">
                Dados da operação
              </h3>

              <p className="text-xs text-slate-500 mt-1 text-center sm:text-left">
                Esses dados identificam seu perfil dentro da plataforma.
              </p>

              {mensagemImagem && (
                <p className="text-xs text-emerald-600 mt-1 text-center sm:text-left">
                  {mensagemImagem}
                </p>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="bg-slate-50 p-4 rounded-lg border border-slate-100">
                <p className="text-xs font-medium text-slate-500 flex items-center gap-1.5 mb-1">
                  <Building className="w-3.5 h-3.5" /> Grupo/Organização
                </p>
                <p className="font-semibold text-slate-900">{partido}</p>
              </div>

              <div className="bg-slate-50 p-4 rounded-lg border border-slate-100">
                <p className="text-xs font-medium text-slate-500 flex items-center gap-1.5 mb-1">
                  <Hash className="w-3.5 h-3.5" /> Código identificador
                </p>
                <p className="font-semibold text-slate-900">{numeroUrna}</p>
              </div>

              <div className="bg-slate-50 p-4 rounded-lg border border-slate-100">
                <p className="text-xs font-medium text-slate-500 flex items-center gap-1.5 mb-1">
                  <Briefcase className="w-3.5 h-3.5" /> Função/Perfil
                </p>
                <p className="font-semibold text-slate-900">
                  {cargoPretendido}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100 flex items-center gap-2">
            <User className="w-5 h-5 text-slate-400" />
            <h3 className="font-bold text-slate-900">
              Informações do perfil
            </h3>
          </div>

          <div className="p-5 space-y-4">
            <div>
              <label
                htmlFor="nome"
                className="block text-sm font-medium text-slate-700 mb-1"
              >
                Nome
              </label>
              <input
                id="nome"
                type="text"
                value={nome}
                onChange={(e) => setNome(e.target.value)}
                placeholder="Digite seu nome"
                className={inputBaseClass}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">
                Cidade base
              </label>
              <input
                type="text"
                value={municipioBase}
                onChange={(event) => setMunicipioBase(event.target.value)}
                placeholder="Ex: Quixadá"
                className={inputBaseClass}
              />
            </div>

            <div>
              <label
                htmlFor="telefone"
                className="block text-sm font-medium text-slate-700 mb-1"
              >
                Telefone
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Phone className="h-4 w-4 text-slate-400" />
                </div>
                <input
                  id="telefone"
                  type="text"
                  value={telefone}
                  onChange={(e) => setTelefone(e.target.value)}
                  placeholder="(85) 99999-0000"
                  className={`${inputBaseClass} pl-10`}
                />
              </div>
            </div>

            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium text-slate-700 mb-1"
              >
                E-mail de acesso
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail className="h-4 w-4 text-slate-400" />
                </div>
                <input
                  id="email"
                  type="email"
                  value={email}
                  disabled
                  className={`${inputBaseClass} pl-10 cursor-not-allowed`}
                />
              </div>
              <p className="mt-1.5 text-xs text-slate-500">
                O e-mail é utilizado para login e não pode ser alterado por aqui.
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
          <div className="px-5 py-4 border-b border-slate-100 flex items-center gap-2">
            <Shield className="w-5 h-5 text-slate-400" />
            <h3 className="font-bold text-slate-900">Segurança</h3>
          </div>
            
<div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
  <p className="text-xs font-medium text-slate-500 flex items-center gap-1.5 mb-1">
    <Shield className="w-3.5 h-3.5" />
    Título cadastrado
  </p>

  <p className="font-semibold text-slate-900">
    {formatarTituloUltimos4(tituloEleitorUltimos4)}
  </p>

  {!tituloEleitorUltimos4 && (
    <p className="text-xs text-amber-700 mt-1">
      Identificador obrigatório pendente.
    </p>
  )}
</div>

          <div className="p-5 space-y-4 flex-1">
            <div>
              <label
                htmlFor="senhaAtual"
                className="block text-sm font-medium text-slate-700 mb-1"
              >
                Senha atual
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-4 w-4 text-slate-400" />
                </div>
                <input
                  id="senhaAtual"
                  type={mostrarSenhaAtual ? "text" : "password"}
                  value={senhaAtual}
                  onChange={(e) => setSenhaAtual(e.target.value)}
                  placeholder="••••••••"
                  className={`${inputBaseClass} pl-10 pr-10`}
                />
                <button
                  type="button"
                  onClick={() => setMostrarSenhaAtual((valor) => !valor)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 transition-colors"
                  aria-label="Mostrar ou ocultar senha atual"
                >
                  {mostrarSenhaAtual ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
            </div>

            <div>
              <label
                htmlFor="novaSenha"
                className="block text-sm font-medium text-slate-700 mb-1"
              >
                Nova senha
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-4 w-4 text-slate-400" />
                </div>
                <input
                  id="novaSenha"
                  type={mostrarNovaSenha ? "text" : "password"}
                  value={novaSenha}
                  onChange={(e) => setNovaSenha(e.target.value)}
                  placeholder="Mínimo de 6 caracteres"
                  className={`${inputBaseClass} pl-10 pr-10`}
                />
                <button
                  type="button"
                  onClick={() => setMostrarNovaSenha((valor) => !valor)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 transition-colors"
                  aria-label="Mostrar ou ocultar nova senha"
                >
                  {mostrarNovaSenha ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
            </div>

            <div>
              <label
                htmlFor="confirmarSenha"
                className="block text-sm font-medium text-slate-700 mb-1"
              >
                Confirmar nova senha
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-4 w-4 text-slate-400" />
                </div>
                <input
                  id="confirmarSenha"
                  type={mostrarConfirmarSenha ? "text" : "password"}
                  value={confirmarSenha}
                  onChange={(e) => setConfirmarSenha(e.target.value)}
                  placeholder="Repita a nova senha"
                  className={`${inputBaseClass} pl-10 pr-10`}
                />
                <button
                  type="button"
                  onClick={() => setMostrarConfirmarSenha((valor) => !valor)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 transition-colors"
                  aria-label="Mostrar ou ocultar confirmação de senha"
                >
                  {mostrarConfirmarSenha ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}