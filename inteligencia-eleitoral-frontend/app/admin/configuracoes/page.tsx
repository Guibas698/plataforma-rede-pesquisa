"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Settings,
  UserCog,
  ShieldCheck,
  Lock,
  Globe,
  FileText,
  Save,
  LogOut,
  AlertTriangle,
  CheckCircle2,
  Mail,
  Phone,
  BadgeCheck,
  KeyRound,
} from "lucide-react";

import { apiFetch } from "../../lib/api";
import { limparSessao } from "../../lib/auth";

type PapelUsuario = "MASTER" | "CANDIDATO" | "APOIADOR";

type UsuarioLogadoResponse = {
  id: string;
  nome: string;
  email: string;
  telefone?: string;
  papel: PapelUsuario;
  fotoUrl?: string;
  ativo: boolean;
};

type TermoConsentimentoResponse = {
  id: string;
  titulo: string;
  versao: string;
  texto: string;
  ativo: boolean;
  criadoEm: string;
  atualizadoEm?: string | null;
};

type AtualizarTermoConsentimentoRequest = {
  titulo: string;
  versao: string;
  texto: string;
};

type AlterarSenhaRequest = {
  senhaAtual: string;
  novaSenha: string;
  confirmacaoNovaSenha: string;
};

function traduzirPapel(papel?: PapelUsuario | null): string {
  if (papel === "MASTER") {
    return "Admin Master";
  }

  if (papel === "CANDIDATO") {
    return "ADM";
  }

  if (papel === "APOIADOR") {
    return "Usuário";
  }

  return "Não informado";
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

export default function ConfiguracoesPage() {
  const router = useRouter();

  const [usuario, setUsuario] = useState<UsuarioLogadoResponse | null>(null);

  const [adminData, setAdminData] = useState({
    nome: "",
    email: "",
    telefone: "",
    cargo: "",
    status: "",
  });

  const [systemData, setSystemData] = useState({
    nome: "Rede Pesquisa",
    dominio: "Carregando...",
    ambiente: "Ambiente local",
  });

  const [termoData, setTermoData] = useState({
    titulo: "",
    versao: "",
    texto: "",
    criadoEm: "",
    atualizadoEm: "",
  });

  const [senhaData, setSenhaData] = useState<AlterarSenhaRequest>({
    senhaAtual: "",
    novaSenha: "",
    confirmacaoNovaSenha: "",
  });

  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState("");
  const [sucesso, setSucesso] = useState("");

  const [isSavingAdmin, setIsSavingAdmin] = useState(false);
  const [isSavingSystem, setIsSavingSystem] = useState(false);
  const [isSavingTermo, setIsSavingTermo] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  useEffect(() => {
    let montado = true;

    async function carregarConfiguracoes() {
      setCarregando(true);
      setErro("");
      setSucesso("");

      try {
        const [usuarioResponse, termoResponse] = await Promise.all([
          apiFetch<UsuarioLogadoResponse>("/auth/me"),
          apiFetch<TermoConsentimentoResponse>(
            "/admin/termo-consentimento/ativo"
          ),
        ]);

        if (!montado) {
          return;
        }

        setUsuario(usuarioResponse);

        setAdminData({
          nome: usuarioResponse.nome ?? "",
          email: usuarioResponse.email ?? "",
          telefone: usuarioResponse.telefone ?? "",
          cargo: traduzirPapel(usuarioResponse.papel),
          status: usuarioResponse.ativo ? "Ativo" : "Inativo",
        });

        setTermoData({
          titulo: termoResponse.titulo ?? "",
          versao: termoResponse.versao ?? "",
          texto: termoResponse.texto ?? "",
          criadoEm: termoResponse.criadoEm ?? "",
          atualizadoEm: termoResponse.atualizadoEm ?? "",
        });

        if (typeof window !== "undefined") {
          setSystemData((prev) => ({
            ...prev,
            dominio: window.location.origin,
          }));
        }
      } catch (error) {
        if (!montado) {
          return;
        }

        if (error instanceof Error) {
          setErro(error.message || "Não foi possível carregar configurações.");
        } else {
          setErro("Não foi possível carregar configurações.");
        }
      } finally {
        if (montado) {
          setCarregando(false);
        }
      }
    }

    carregarConfiguracoes();

    return () => {
      montado = false;
    };
  }, []);

  const handleAdminChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;

    setAdminData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSystemChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;

    setSystemData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleTermoChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;

    setTermoData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSenhaChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;

    setSenhaData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const mostrarSucesso = (mensagem: string) => {
    setSucesso(mensagem);
    setTimeout(() => setSucesso(""), 4500);
  };

  const handleSaveAdmin = (e: FormEvent) => {
    e.preventDefault();

    setErro("");
    setSucesso("");

    if (!usuario) {
      setErro("Não foi possível identificar o Admin Master logado.");
      return;
    }

    if (!adminData.nome.trim()) {
      setErro("O nome do administrador não pode ficar vazio.");
      return;
    }

    setIsSavingAdmin(true);

    setTimeout(() => {
      setUsuario({
        ...usuario,
        nome: adminData.nome.trim(),
        telefone: adminData.telefone.trim() || undefined,
      });

      setAdminData((prev) => ({
        ...prev,
        nome: prev.nome.trim(),
        telefone: prev.telefone.trim(),
      }));

      setIsSavingAdmin(false);

      mostrarSucesso(
        "Dados atualizados visualmente. A atualização definitiva do perfil será integrada em uma próxima etapa."
      );
    }, 500);
  };

  const handleSaveSystem = (e: FormEvent) => {
    e.preventDefault();

    setErro("");
    setSucesso("");
    setIsSavingSystem(true);

    setTimeout(() => {
      setIsSavingSystem(false);
      mostrarSucesso(
        "Preferências do sistema atualizadas visualmente. A persistência será integrada em uma próxima etapa."
      );
    }, 500);
  };

  const handleSaveTermo = async (e: FormEvent) => {
    e.preventDefault();

    setErro("");
    setSucesso("");

    if (!termoData.titulo.trim()) {
      setErro("O título do termo não pode ficar vazio.");
      return;
    }

    if (!termoData.versao.trim()) {
      setErro("A versão do termo não pode ficar vazia.");
      return;
    }

    if (!termoData.texto.trim()) {
      setErro("O texto do termo não pode ficar vazio.");
      return;
    }

    setIsSavingTermo(true);

    try {
      const payload: AtualizarTermoConsentimentoRequest = {
        titulo: termoData.titulo.trim(),
        versao: termoData.versao.trim(),
        texto: termoData.texto.trim(),
      };

      const response = await apiFetch<TermoConsentimentoResponse>(
        "/admin/termo-consentimento/ativo",
        {
          method: "PUT",
          body: JSON.stringify(payload),
        }
      );

      setTermoData({
        titulo: response.titulo ?? "",
        versao: response.versao ?? "",
        texto: response.texto ?? "",
        criadoEm: response.criadoEm ?? "",
        atualizadoEm: response.atualizadoEm ?? "",
      });

      mostrarSucesso("Termo de consentimento atualizado com sucesso.");
    } catch (error) {
      if (error instanceof Error) {
        setErro(error.message || "Não foi possível atualizar o termo.");
      } else {
        setErro("Não foi possível atualizar o termo.");
      }
    } finally {
      setIsSavingTermo(false);
    }
  };

  const handleAlterarSenha = async (e: FormEvent) => {
    e.preventDefault();

    setErro("");
    setSucesso("");

    if (!senhaData.senhaAtual.trim()) {
      setErro("Informe a senha atual.");
      return;
    }

    if (!senhaData.novaSenha.trim()) {
      setErro("Informe a nova senha.");
      return;
    }

    if (senhaData.novaSenha.length < 6) {
      setErro("A nova senha deve ter pelo menos 6 caracteres.");
      return;
    }

    if (senhaData.novaSenha !== senhaData.confirmacaoNovaSenha) {
      setErro("A nova senha e a confirmação não conferem.");
      return;
    }

    setIsChangingPassword(true);

    try {
      await apiFetch<void>("/auth/senha", {
        method: "PATCH",
        body: JSON.stringify({
          senhaAtual: senhaData.senhaAtual,
          novaSenha: senhaData.novaSenha,
          confirmacaoNovaSenha: senhaData.confirmacaoNovaSenha,
        }),
      });

      setSenhaData({
        senhaAtual: "",
        novaSenha: "",
        confirmacaoNovaSenha: "",
      });

      mostrarSucesso("Senha alterada com sucesso.");
    } catch (error) {
      if (error instanceof Error) {
        setErro(error.message || "Não foi possível alterar a senha.");
      } else {
        setErro("Não foi possível alterar a senha.");
      }
    } finally {
      setIsChangingPassword(false);
    }
  };

  const handleSair = () => {
    limparSessao();
    router.push("/login");
  };

  if (carregando) {
    return (
      <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto">
        <div className="bg-white border border-slate-200 rounded-xl p-12 flex flex-col items-center justify-center text-center shadow-sm">
          <div className="w-12 h-12 border-4 border-slate-100 border-t-emerald-500 rounded-full animate-spin mb-4" />
          <h3 className="text-lg font-semibold text-slate-900">
            Carregando configurações...
          </h3>
          <p className="text-slate-500 mt-1 max-w-sm">
            Buscando as informações da conta administrativa.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6 lg:space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-200 pb-6">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-slate-900 text-white rounded-xl shadow-sm">
            <Settings className="w-6 h-6" />
          </div>

          <div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
              Configurações
            </h1>
            <p className="text-sm text-slate-500 mt-1">
              Gerencie dados do administrador, preferências do sistema e termos
              de consentimento.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={handleSair}
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-white border border-red-200 text-red-600 text-sm font-medium rounded-lg hover:bg-red-50 transition-colors shadow-sm w-full sm:w-auto"
        >
          <LogOut className="w-4 h-4" />
          Sair
        </button>
      </div>

      {erro && (
        <div className="bg-red-50 border border-red-100 text-red-700 px-4 py-3 rounded-xl text-sm font-medium flex items-start gap-2">
          <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5" />
          <span>{erro}</span>
        </div>
      )}

      {sucesso && (
        <div className="bg-emerald-50 border border-emerald-100 text-emerald-700 px-4 py-3 rounded-xl text-sm font-medium flex items-start gap-2">
          <CheckCircle2 className="w-5 h-5 shrink-0 mt-0.5" />
          <span>{sucesso}</span>
        </div>
      )}

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 lg:gap-8">
        <div className="space-y-6 lg:space-y-8">
          <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
            <div className="p-5 sm:p-6 border-b border-slate-100 flex items-center gap-2">
              <UserCog className="w-5 h-5 text-slate-500" />
              <h2 className="text-lg font-semibold text-slate-900">
                Dados do Admin Master
              </h2>
            </div>

            <form onSubmit={handleSaveAdmin} className="p-5 sm:p-6 space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div className="space-y-1.5">
                  <label
                    htmlFor="nome"
                    className="block text-sm font-medium text-slate-700"
                  >
                    Nome
                  </label>
                  <input
                    id="nome"
                    name="nome"
                    type="text"
                    value={adminData.nome}
                    onChange={handleAdminChange}
                    className="block w-full px-3 py-2.5 border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-colors sm:text-sm"
                  />
                </div>

                <div className="space-y-1.5">
                  <label
                    htmlFor="email"
                    className="block text-sm font-medium text-slate-700"
                  >
                    E-mail
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      id="email"
                      name="email"
                      type="email"
                      value={adminData.email}
                      readOnly
                      className="block w-full pl-9 pr-3 py-2.5 border border-slate-200 rounded-lg text-slate-500 bg-slate-50 sm:text-sm cursor-not-allowed"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label
                    htmlFor="telefone"
                    className="block text-sm font-medium text-slate-700"
                  >
                    Telefone
                  </label>
                  <div className="relative">
                    <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      id="telefone"
                      name="telefone"
                      type="text"
                      value={adminData.telefone}
                      onChange={handleAdminChange}
                      placeholder="Não informado"
                      className="block w-full pl-9 pr-3 py-2.5 border border-slate-200 rounded-lg text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-colors sm:text-sm"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label
                    htmlFor="cargo"
                    className="block text-sm font-medium text-slate-700"
                  >
                    Perfil de acesso
                  </label>
                  <input
                    id="cargo"
                    name="cargo"
                    type="text"
                    value={adminData.cargo}
                    readOnly
                    className="block w-full px-3 py-2.5 border border-slate-200 rounded-lg text-slate-500 bg-slate-50 sm:text-sm cursor-not-allowed"
                  />
                </div>
              </div>

              <div className="bg-slate-50 border border-slate-100 rounded-lg p-4 flex items-start gap-3">
                <BadgeCheck className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-semibold text-slate-900">
                    Conta {adminData.status.toLowerCase() || "não informada"}
                  </p>
                  <p className="text-xs text-slate-500 mt-1">
                    Estes dados são carregados da conta atualmente logada.
                  </p>
                </div>
              </div>

              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={isSavingAdmin}
                  className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-emerald-600 text-white text-sm font-medium rounded-lg hover:bg-emerald-700 transition-colors shadow-sm disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {isSavingAdmin ? (
                    <>
                      <CheckCircle2 className="w-4 h-4 animate-pulse" />
                      Salvando...
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4" />
                      Salvar alterações
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>

          <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
            <div className="p-5 sm:p-6 border-b border-slate-100 flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-slate-500" />
              <h2 className="text-lg font-semibold text-slate-900">
                Segurança
              </h2>
            </div>

            <form
              onSubmit={handleAlterarSenha}
              className="p-5 sm:p-6 space-y-5"
            >
              <div className="flex items-start gap-3 p-4 rounded-lg bg-emerald-50 border border-emerald-100">
                <Lock className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-semibold text-emerald-900">
                    Acesso protegido
                  </p>
                  <p className="text-sm text-emerald-700 mt-1">
                    Sua sessão está protegida por autenticação. Por segurança,
                    senha e token nunca são exibidos nesta tela.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
                <div className="space-y-1.5">
                  <label
                    htmlFor="senhaAtual"
                    className="block text-sm font-medium text-slate-700"
                  >
                    Senha atual
                  </label>
                  <input
                    id="senhaAtual"
                    name="senhaAtual"
                    type="password"
                    value={senhaData.senhaAtual}
                    onChange={handleSenhaChange}
                    className="block w-full px-3 py-2.5 border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-colors sm:text-sm"
                    autoComplete="current-password"
                  />
                </div>

                <div className="space-y-1.5">
                  <label
                    htmlFor="novaSenha"
                    className="block text-sm font-medium text-slate-700"
                  >
                    Nova senha
                  </label>
                  <input
                    id="novaSenha"
                    name="novaSenha"
                    type="password"
                    value={senhaData.novaSenha}
                    onChange={handleSenhaChange}
                    className="block w-full px-3 py-2.5 border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-colors sm:text-sm"
                    autoComplete="new-password"
                  />
                </div>

                <div className="space-y-1.5">
                  <label
                    htmlFor="confirmacaoNovaSenha"
                    className="block text-sm font-medium text-slate-700"
                  >
                    Confirmar senha
                  </label>
                  <input
                    id="confirmacaoNovaSenha"
                    name="confirmacaoNovaSenha"
                    type="password"
                    value={senhaData.confirmacaoNovaSenha}
                    onChange={handleSenhaChange}
                    className="block w-full px-3 py-2.5 border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-colors sm:text-sm"
                    autoComplete="new-password"
                  />
                </div>
              </div>

              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={isChangingPassword}
                  className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-white border border-slate-200 text-slate-700 text-sm font-medium rounded-lg hover:bg-slate-50 transition-colors shadow-sm disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {isChangingPassword ? (
                    <>
                      <CheckCircle2 className="w-4 h-4 animate-pulse" />
                      Alterando...
                    </>
                  ) : (
                    <>
                      <KeyRound className="w-4 h-4" />
                      Alterar senha
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>

        <div className="space-y-6 lg:space-y-8">
          <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
            <div className="p-5 sm:p-6 border-b border-slate-100 flex items-center gap-2">
              <Globe className="w-5 h-5 text-slate-500" />
              <h2 className="text-lg font-semibold text-slate-900">
                Dados do sistema
              </h2>
            </div>

            <form onSubmit={handleSaveSystem} className="p-5 sm:p-6 space-y-5">
              <div className="space-y-1.5">
                <label
                  htmlFor="systemNome"
                  className="block text-sm font-medium text-slate-700"
                >
                  Nome do sistema
                </label>
                <input
                  id="systemNome"
                  name="nome"
                  type="text"
                  value={systemData.nome}
                  onChange={handleSystemChange}
                  className="block w-full px-3 py-2.5 border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-colors sm:text-sm"
                />
              </div>

              <div className="space-y-1.5">
                <label
                  htmlFor="dominio"
                  className="block text-sm font-medium text-slate-700"
                >
                  Domínio atual
                </label>
                <input
                  id="dominio"
                  name="dominio"
                  type="text"
                  value={systemData.dominio}
                  onChange={handleSystemChange}
                  className="block w-full px-3 py-2.5 border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-colors sm:text-sm"
                />
              </div>

              <div className="space-y-1.5">
                <label
                  htmlFor="ambiente"
                  className="block text-sm font-medium text-slate-700"
                >
                  Ambiente
                </label>
                <input
                  id="ambiente"
                  name="ambiente"
                  type="text"
                  value={systemData.ambiente}
                  onChange={handleSystemChange}
                  className="block w-full px-3 py-2.5 border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-colors sm:text-sm"
                />
              </div>

              <div className="rounded-lg bg-slate-50 border border-slate-100 p-4">
                <p className="text-sm font-semibold text-slate-900">
                  Configuração local
                </p>
                <p className="text-xs text-slate-500 mt-1">
                  Estas preferências ainda são visuais. A persistência definitiva
                  será integrada em uma próxima etapa.
                </p>
              </div>

              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={isSavingSystem}
                  className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-white border border-slate-200 text-slate-700 text-sm font-medium rounded-lg hover:bg-slate-50 transition-colors shadow-sm disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {isSavingSystem ? (
                    <>
                      <CheckCircle2 className="w-4 h-4 animate-pulse" />
                      Salvando...
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4" />
                      Salvar sistema
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>

          <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
            <div className="p-5 sm:p-6 border-b border-slate-100 flex items-center gap-2">
              <FileText className="w-5 h-5 text-slate-500" />
              <h2 className="text-lg font-semibold text-slate-900">
                Termo de consentimento
              </h2>
            </div>

            <form onSubmit={handleSaveTermo} className="p-5 sm:p-6 space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
                <div className="sm:col-span-2 space-y-1.5">
                  <label
                    htmlFor="tituloTermo"
                    className="block text-sm font-medium text-slate-700"
                  >
                    Título do termo
                  </label>
                  <input
                    id="tituloTermo"
                    name="titulo"
                    type="text"
                    value={termoData.titulo}
                    onChange={handleTermoChange}
                    className="block w-full px-3 py-2.5 border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-colors sm:text-sm"
                  />
                </div>

                <div className="space-y-1.5">
                  <label
                    htmlFor="versaoTermo"
                    className="block text-sm font-medium text-slate-700"
                  >
                    Versão
                  </label>
                  <input
                    id="versaoTermo"
                    name="versao"
                    type="text"
                    value={termoData.versao}
                    onChange={handleTermoChange}
                    className="block w-full px-3 py-2.5 border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-colors sm:text-sm"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label
                  htmlFor="textoTermo"
                  className="block text-sm font-medium text-slate-700"
                >
                  Texto exibido no cadastro público
                </label>
                <textarea
                  id="textoTermo"
                  name="texto"
                  value={termoData.texto}
                  onChange={handleTermoChange}
                  rows={11}
                  className="block w-full px-3 py-2.5 border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-colors sm:text-sm resize-y"
                />
              </div>

              <div className="rounded-lg bg-slate-50 border border-slate-100 p-4">
                <p className="text-sm font-semibold text-slate-900">
                  Termo ativo
                </p>
                <p className="text-xs text-slate-500 mt-1">
                  Criado em {formatarData(termoData.criadoEm)}
                  {termoData.atualizadoEm
                    ? ` • Atualizado em ${formatarData(
                        termoData.atualizadoEm
                      )}`
                    : ""}
                </p>
              </div>

              <div className="rounded-lg bg-emerald-50 border border-emerald-100 p-4">
                <p className="text-sm font-semibold text-emerald-900">
                  Consentimento e dados pessoais
                </p>
                <p className="text-xs text-emerald-700 mt-1">
                  Use este termo para explicar a coleta, o uso e o tratamento dos
                  dados pessoais dos usuários da plataforma.
                </p>
              </div>

              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={isSavingTermo}
                  className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-emerald-600 text-white text-sm font-medium rounded-lg hover:bg-emerald-700 transition-colors shadow-sm disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {isSavingTermo ? (
                    <>
                      <CheckCircle2 className="w-4 h-4 animate-pulse" />
                      Salvando...
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4" />
                      Salvar termo
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}