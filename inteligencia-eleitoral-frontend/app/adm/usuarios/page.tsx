"use client";

import { useEffect, useMemo, useState, type FormEvent } from "react";
import { apiFetch } from "../../lib/api";
import {
  Search,
  Filter,
  Plus,
  MapPin,
  MoreVertical,
  Phone,
  MessageCircle,
  Eye,
  Pencil,
  Trash2,
  X,
  Save,
  ShieldCheck,
  Crown,
  Users,
  Network,
  ChevronDown,
  ChevronRight,
} from "lucide-react";

type StatusApoiador = "ATIVO" | "PENDENTE";
type StatusFiltro = "Todos" | StatusApoiador;
type CidadeFiltro = string;

type Apoiador = {
  id: string;
  usuarioId?: string | null;
  nome: string;
  email?: string;
  telefone: string;
  cidade: string;
  bairro: string;
  zonaEleitoral: number;
  secaoEleitoral: number;
  observacao?: string;
  status: StatusApoiador;
  papelUsuario?: string | null;
  superiorNome?: string | null;
  admRaizNome?: string | null;
};

type FormApoiador = Omit<Apoiador, "id"> & {
  senhaTemporaria?: string;
  tituloEleitor?: string;
};

type ApoiadorBackend = {
  id: string;
  usuarioId?: string | null;
  nome: string;
  email?: string | null;
  telefone: string;
  municipio?: string;
  cidade?: string;
  bairro: string;
  zonaEleitoral?: number;
  secaoEleitoral?: number;
  zona_eleitoral?: number;
  secao_eleitoral?: number;
  observacao?: string | null;
  status: string;
  papelUsuario?: string | null;
  superiorNome?: string | null;
  admRaizNome?: string | null;
};

type PageResponse<T> = {
  content?: T[];
  items?: T[];
  data?: T[];
  totalElements?: number;
  totalPages?: number;
  number?: number;
  size?: number;
  first?: boolean;
  last?: boolean;
};


type AbaVisualizacao = "lista" | "rede";

type RedeUsuarioNode = {
  id: string;
  nome: string;
  email?: string | null;
  telefone?: string | null;
  papel?: string | null;
  tituloEleitorUltimos4?: string | null;
  superiorId?: string | null;
  superiorNome?: string | null;
  admRaizId?: string | null;
  admRaizNome?: string | null;
  totalFilhos: number;
  filhos: RedeUsuarioNode[];
};

type RedeResumoResponse = {
  usuarioLogadoId: string;
  usuarioLogadoNome: string;
  papelLogado: string;
  totalUsuarios: number;
  totalLideres: number;
  totalDiretos: number;
  arvore: RedeUsuarioNode[];
};


const FORM_INICIAL: FormApoiador = {
  nome: "",
  email: "",
  telefone: "",
  cidade: "",
  bairro: "",
  zonaEleitoral: 0,
  secaoEleitoral: 0,
  observacao: "",
  status: "ATIVO",
  senhaTemporaria: "",
  tituloEleitor: "",
};

function montarLinkWhatsApp(telefone: string) {
  const numeroLimpo = telefone.replace(/\D/g, "");
  return `https://wa.me/55${numeroLimpo}`;
}

function extrairListaPaginada<T>(response: PageResponse<T> | T[]): T[] {
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

function normalizarTituloEleitor(valor: string): string {
  return valor.replace(/\D/g, "");
}

function normalizarStatus(status?: string): StatusApoiador {
  const statusNormalizado = (status || "ATIVO").toUpperCase();

  if (statusNormalizado === "PENDENTE") {
    return "PENDENTE";
  }

  return "ATIVO";
}

function formatarStatus(status: StatusApoiador) {
  if (status === "PENDENTE") {
    return "Pendente";
  }

  return "Ativo";
}

function formatarPapelUsuario(papel?: string | null) {
  const valor = (papel || "").toUpperCase();

  if (valor === "LIDER") {
    return "Líder";
  }

  if (valor === "USUARIO") {
    return "Usuário";
  }

  if (valor === "ADM") {
    return "ADM";
  }

  return "Usuário";
}

function podePromoverParaLider(apoiador: Apoiador) {
  return Boolean(apoiador.usuarioId) && apoiador.papelUsuario !== "LIDER";
}

function normalizarApoiadorBackend(item: ApoiadorBackend): Apoiador {
  return {
    id: item.id,
    usuarioId: item.usuarioId ?? null,
    nome: item.nome ?? "Usuário sem nome",
    email: item.email ?? "",
    telefone: item.telefone ?? "",
    cidade: item.municipio || item.cidade || "Cidade não informada",
    bairro: item.bairro ?? "Bairro não informado",
    zonaEleitoral: item.zonaEleitoral ?? item.zona_eleitoral ?? 0,
    secaoEleitoral: item.secaoEleitoral ?? item.secao_eleitoral ?? 0,
    observacao: item.observacao ?? "",
    status: normalizarStatus(item.status),
    papelUsuario: item.papelUsuario ?? null,
    superiorNome: item.superiorNome ?? null,
    admRaizNome: item.admRaizNome ?? null,
  };
}

function montarPayloadApoiador(
  formulario: FormApoiador,
  incluirSenhaTemporaria = false
) {
  const payload: Record<string, unknown> = {
    nome: formulario.nome.trim(),
    email: formulario.email?.trim() || null,
    telefone: formulario.telefone.trim(),
    municipio: formulario.cidade.trim(),
    bairro: formulario.bairro.trim(),
    zonaEleitoral: Number(formulario.zonaEleitoral),
    secaoEleitoral: Number(formulario.secaoEleitoral),
    observacao: formulario.observacao?.trim() || null,
    status: formulario.status,
  };

  if (incluirSenhaTemporaria) {
    payload.senhaTemporaria = formulario.senhaTemporaria?.trim() || "";
    payload.tituloEleitor = normalizarTituloEleitor(
      formulario.tituloEleitor ?? ""
    );
  }

  return payload;
}

export default function ApoiadoresPage() {
  const [apoiadores, setApoiadores] = useState<Apoiador[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState("");
  const [sucesso, setSucesso] = useState("");
  const [salvando, setSalvando] = useState(false);
  const [paginaAtual, setPaginaAtual] = useState(0);
  const [totalPaginas, setTotalPaginas] = useState(1);
  const [totalApoiadores, setTotalApoiadores] = useState(0);
  const [busca, setBusca] = useState("");
  const [filtrosAberto, setFiltrosAberto] = useState(false);
  const [statusFiltro, setStatusFiltro] = useState<StatusFiltro>("Todos");
  const [cidadeFiltro, setCidadeFiltro] = useState<CidadeFiltro>("Todas");
  const [menuAbertoId, setMenuAbertoId] = useState<string | null>(null);

  const [abaAtiva, setAbaAtiva] = useState<AbaVisualizacao>("lista");
  const [rede, setRede] = useState<RedeResumoResponse | null>(null);
  const [carregandoRede, setCarregandoRede] = useState(false);
  const [erroRede, setErroRede] = useState("");
  const [nodesAbertos, setNodesAbertos] = useState<Record<string, boolean>>({});


  const [modalFormularioAberto, setModalFormularioAberto] = useState(false);
  const [apoiadorEditando, setApoiadorEditando] = useState<Apoiador | null>(
    null
  );
  const [formulario, setFormulario] = useState<FormApoiador>(FORM_INICIAL);
  const [erroFormulario, setErroFormulario] = useState("");

  const [apoiadorDetalhes, setApoiadorDetalhes] = useState<Apoiador | null>(
    null
  );

  async function carregarApoiadores(pagina = paginaAtual) {
    setCarregando(true);
    setErro("");

    try {
      const response = await apiFetch<
        PageResponse<ApoiadorBackend> | ApoiadorBackend[]
      >(`/candidato/apoiadores?page=${pagina}&size=20`);

      const lista = extrairListaPaginada(response).map(normalizarApoiadorBackend);

      setApoiadores(lista);

      if (!Array.isArray(response)) {
        setTotalPaginas(response.totalPages ?? 1);
        setTotalApoiadores(response.totalElements ?? lista.length);
        setPaginaAtual(response.number ?? pagina);
      } else {
        setTotalPaginas(1);
        setTotalApoiadores(lista.length);
        setPaginaAtual(0);
      }
    } catch (error) {
      if (error instanceof Error) {
        setErro(error.message || "Não foi possível carregar os usuários.");
      } else {
        setErro("Não foi possível carregar os usuários.");
      }
    } finally {
      setCarregando(false);
    }
  }

  useEffect(() => {
    carregarApoiadores(0);
  }, []);


  useEffect(() => {
    if (abaAtiva === "rede" && !rede && !carregandoRede) {
      carregarRede();
    }
  }, [abaAtiva, rede, carregandoRede]);

  const apoiadoresFiltrados = useMemo(() => {
    const termo = busca.trim().toLowerCase();

    return apoiadores.filter((apoiador) => {
      const correspondeBusca =
        !termo ||
        apoiador.nome.toLowerCase().includes(termo) ||
        apoiador.telefone.toLowerCase().includes(termo) ||
        apoiador.cidade.toLowerCase().includes(termo) ||
        apoiador.bairro.toLowerCase().includes(termo) ||
        apoiador.status.toLowerCase().includes(termo);

      const correspondeStatus =
        statusFiltro === "Todos" || apoiador.status === statusFiltro;

      const correspondeCidade =
        cidadeFiltro === "Todas" || apoiador.cidade === cidadeFiltro;

      return correspondeBusca && correspondeStatus && correspondeCidade;
    });
  }, [apoiadores, busca, statusFiltro, cidadeFiltro]);

  const cidadesDisponiveis = useMemo(() => {
    const cidades = apoiadores
      .map((apoiador) => apoiador.cidade)
      .filter(Boolean);

    return Array.from(new Set(cidades)).sort((a, b) => a.localeCompare(b));
  }, [apoiadores]);

  function abrirNovoApoiador() {
    setApoiadorEditando(null);
    setFormulario(FORM_INICIAL);
    setErroFormulario("");
    setModalFormularioAberto(true);
  }

  function abrirEdicao(apoiador: Apoiador) {
    setApoiadorEditando(apoiador);
    setFormulario({
      nome: apoiador.nome,
      email: apoiador.email ?? "",
      telefone: apoiador.telefone,
      cidade: apoiador.cidade,
      bairro: apoiador.bairro,
      zonaEleitoral: apoiador.zonaEleitoral,
      secaoEleitoral: apoiador.secaoEleitoral,
      observacao: apoiador.observacao ?? "",
      status: apoiador.status,
      senhaTemporaria: "",
      tituloEleitor: "",
    });
    setErroFormulario("");
    setMenuAbertoId(null);
    setModalFormularioAberto(true);
  }

  function abrirDetalhes(apoiador: Apoiador) {
    setMenuAbertoId(null);
    setApoiadorDetalhes(apoiador);
  }

async function carregarRede() {
  setCarregandoRede(true);
  setErroRede("");

  try {
    const response = await apiFetch<RedeResumoResponse>("/candidato/rede");

    setRede(response);

    const abertos: Record<string, boolean> = {};

    function abrirTodos(nodes: RedeUsuarioNode[]) {
      nodes.forEach((node) => {
        abertos[node.id] = true;
        abrirTodos(node.filhos ?? []);
      });
    }

    abrirTodos(response.arvore ?? []);

    setNodesAbertos(abertos);
  } catch (error) {
    if (error instanceof Error) {
      setErroRede(error.message || "Não foi possível carregar a rede.");
    } else {
      setErroRede("Não foi possível carregar a rede.");
    }
  } finally {
    setCarregandoRede(false);
  }
}

function alternarNodeAberto(id: string) {
  setNodesAbertos((atual) => ({
    ...atual,
    [id]: !atual[id],
  }));
}

function formatarPapelRede(papel?: string | null) {
  const valor = (papel || "").toUpperCase();

  if (valor === "LIDER") return "Líder";
  if (valor === "ADM") return "ADM";

  return "Usuário";
}

function formatarTituloUltimos4(valor?: string | null) {
  const texto = valor?.trim();

  if (!texto) {
    return "Não informado";
  }

  return `****${texto}`;
}

  async function removerApoiador(apoiador: Apoiador) {
    setMenuAbertoId(null);

    const confirmou = window.confirm(
      `Deseja remover o usuário ${apoiador.nome}?`
    );

    if (!confirmou) {
      return;
    }

    setErro("");

    try {
      await apiFetch<void>(`/candidato/apoiadores/${apoiador.id}`, {
        method: "DELETE",
      });

      await carregarApoiadores(paginaAtual);
    } catch (error) {
      if (error instanceof Error) {
        setErro(error.message || "Não foi possível remover o usuário.");
      } else {
        setErro("Não foi possível remover o usuário.");
      }
    }
  }

  function limparFiltros() {
    setStatusFiltro("Todos");
    setCidadeFiltro("Todas");
  }

  function fecharModalFormulario() {
    setModalFormularioAberto(false);
    setApoiadorEditando(null);
    setFormulario(FORM_INICIAL);
    setErroFormulario("");
  }

async function promoverParaLider(apoiador: Apoiador) {
  setMenuAbertoId(null);
  setErro("");
  setSucesso("");

  if (!apoiador.usuarioId) {
    setErro("Este usuário ainda não possui vínculo de conta para promoção.");
    return;
  }

  const confirmou = window.confirm(
    `Deseja promover ${apoiador.nome} para líder?`
  );

  if (!confirmou) {
    return;
  }

  try {
    await apiFetch(`/candidato/usuarios/${apoiador.usuarioId}/promover-lider`, {
      method: "PATCH",
    });

    setSucesso("Usuário promovido para líder com sucesso.");
    await carregarApoiadores(paginaAtual);
  } catch (error) {
    if (error instanceof Error) {
      setErro(error.message || "Não foi possível promover o usuário para líder.");
    } else {
      setErro("Não foi possível promover o usuário para líder.");
    }
  }
}

  async function salvarApoiador(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

  const nome = formulario.nome.trim();
  const email = formulario.email?.trim() ?? "";
  const telefone = formulario.telefone.trim();
  const cidade = formulario.cidade.trim();
  const bairro = formulario.bairro.trim();
  const senhaTemporaria = formulario.senhaTemporaria?.trim() ?? "";
  const tituloEleitor = normalizarTituloEleitor(formulario.tituloEleitor ?? "");
  const zonaEleitoral = Number(formulario.zonaEleitoral);
  const secaoEleitoral = Number(formulario.secaoEleitoral);
    

    if (!nome || !email || !telefone || !cidade || !bairro) {
      setErroFormulario("Preencha nome, e-mail, telefone, cidade e bairro.");
      return;
    }

    if (!apoiadorEditando && tituloEleitor.length !== 12) {
      setErroFormulario("Informe um título de eleitor válido com 12 dígitos.");
      return;
    }

    if (!apoiadorEditando && senhaTemporaria.length < 6) {
      setErroFormulario("Informe uma senha temporária com no mínimo 6 caracteres.");
      return;
    }

    if (!zonaEleitoral || zonaEleitoral <= 0) {
      setErroFormulario("Informe um segmento válido.");
      return;
    }

    if (!secaoEleitoral || secaoEleitoral <= 0) {
      setErroFormulario("Informe um subsegmento válido.");
      return;
    }

    setSalvando(true);
    setErroFormulario("");
    setErro("");

    try {
      const payload = montarPayloadApoiador(
        {
          ...formulario,
          nome,
          email,
          telefone,
          cidade,
          bairro,
          zonaEleitoral,
          secaoEleitoral,
          senhaTemporaria,
          tituloEleitor,
        },
        !apoiadorEditando
      );

      if (apoiadorEditando) {
        await apiFetch<ApoiadorBackend>(
          `/candidato/apoiadores/${apoiadorEditando.id}`,
          {
            method: "PUT",
            body: JSON.stringify(payload),
          }
        );
      } else {
        await apiFetch<ApoiadorBackend>("/candidato/apoiadores", {
          method: "POST",
          body: JSON.stringify(payload),
        });
      }

      fecharModalFormulario();
      await carregarApoiadores(paginaAtual);
    } catch (error) {
      if (error instanceof Error) {
        setErroFormulario(error.message || "Não foi possível salvar o usuário.");
      } else {
        setErroFormulario("Não foi possível salvar o usuário.");
      }
    } finally {
      setSalvando(false);
    }
  }

return (
  <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
          Usuários
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          Gerencie os usuários vinculados ao seu perfil ({totalApoiadores}{" "}
          totais)
        </p>
      </div>

      <button
        type="button"
        onClick={abrirNovoApoiador}
        className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-emerald-600 text-white text-sm font-medium rounded-lg hover:bg-emerald-700 transition-colors shadow-sm w-full sm:w-auto"
      >
        <Plus className="w-4 h-4" />
        Novo usuário
      </button>
    </div>

    <div className="bg-white border border-slate-200 rounded-xl p-1 shadow-sm flex gap-1 w-full sm:w-fit">
      <button
        type="button"
        onClick={() => setAbaAtiva("lista")}
        className={`inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors flex-1 sm:flex-none ${
          abaAtiva === "lista"
            ? "bg-slate-900 text-white"
            : "text-slate-600 hover:bg-slate-50"
        }`}
      >
        <Users className="w-4 h-4" />
        Lista
      </button>

      <button
        type="button"
        onClick={() => setAbaAtiva("rede")}
        className={`inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors flex-1 sm:flex-none ${
          abaAtiva === "rede"
            ? "bg-slate-900 text-white"
            : "text-slate-600 hover:bg-slate-50"
        }`}
      >
        <Network className="w-4 h-4" />
        Líderes/Rede
      </button>
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

    {carregando && (
      <div className="bg-white border border-slate-200 rounded-xl p-4 text-sm text-slate-500 shadow-sm">
        Carregando usuários...
      </div>
    )}

    {abaAtiva === "rede" && (
      <div className="space-y-6">
        {erroRede && (
          <div className="bg-red-50 border border-red-100 text-red-700 px-4 py-3 rounded-xl text-sm font-medium">
            {erroRede}
          </div>
        )}

        {carregandoRede && (
          <div className="bg-white border border-slate-200 rounded-xl p-4 text-sm text-slate-500 shadow-sm">
            Carregando rede em cascata...
          </div>
        )}

        {rede && (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
                <p className="text-xs font-medium text-slate-500">
                  Total de usuários
                </p>
                <p className="text-2xl font-bold text-slate-900 mt-1">
                  {rede.totalUsuarios}
                </p>
              </div>

              <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
                <p className="text-xs font-medium text-slate-500">
                  Total de líderes
                </p>
                <p className="text-2xl font-bold text-slate-900 mt-1">
                  {rede.totalLideres}
                </p>
              </div>

              <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
                <p className="text-xs font-medium text-slate-500">
                  Diretos
                </p>
                <p className="text-2xl font-bold text-slate-900 mt-1">
                  {rede.totalDiretos}
                </p>
              </div>
            </div>

            <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
              <div className="p-5 border-b border-slate-100">
                <h2 className="text-lg font-bold text-slate-900">
                  Rede em cascata
                </h2>
                <p className="text-sm text-slate-500 mt-1">
                  Visualização hierárquica dos usuários vinculados abaixo de{" "}
                  <strong>{rede.usuarioLogadoNome}</strong>.
                </p>
              </div>

              <div className="p-5">
                {rede.arvore.length === 0 ? (
                  <div className="rounded-xl border border-slate-200 bg-slate-50 p-6 text-center">
                    <p className="font-semibold text-slate-900">
                      Você ainda não possui usuários vinculados diretamente à sua rede.
                    </p>
                    <p className="text-sm text-slate-500 mt-1">
                      Compartilhe seu link de convite para começar a formar a rede.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {rede.arvore.map((node) => (
                      <RedeNodeCard
                        key={node.id}
                        node={node}
                        nivel={0}
                        aberto={nodesAbertos[node.id] ?? true}
                        nodesAbertos={nodesAbertos}
                        onAlternar={alternarNodeAberto}
                        formatarPapel={formatarPapelRede}
                        formatarTitulo={formatarTituloUltimos4}
                      />
                    ))}
                  </div>
                )}
              </div>
            </div>
          </>
        )}
      </div>
    )}

    {abaAtiva === "lista" && (
      <>
        <div className="space-y-3">
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-5 w-5 text-slate-400" />
              </div>
              <input
                type="text"
                placeholder="Buscar por nome, telefone, cidade, bairro ou status..."
                value={busca}
                onChange={(e) => setBusca(e.target.value)}
                className="block w-full pl-10 pr-3 py-2 border border-slate-200 rounded-lg text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-100 focus:border-emerald-500 sm:text-sm transition-colors"
              />
            </div>

            <button
              type="button"
              onClick={() => setFiltrosAberto((aberto) => !aberto)}
              className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-white border border-slate-200 text-slate-700 text-sm font-medium rounded-lg hover:bg-slate-50 transition-colors w-full sm:w-auto shrink-0"
            >
              <Filter className="w-4 h-4" />
              Filtros
            </button>
          </div>

          {filtrosAberto && (
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1.5">
                  Status
                </label>
                <select
                  value={statusFiltro}
                  onChange={(e) => setStatusFiltro(e.target.value as StatusFiltro)}
                  className="block w-full px-3 py-2 border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-100 focus:border-emerald-500 sm:text-sm transition-colors"
                >
                  <option value="Todos">Todos</option>
                  <option value="ATIVO">Ativo</option>
                  <option value="PENDENTE">Pendente</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1.5">
                  Cidade
                </label>
                <select
                  value={cidadeFiltro}
                  onChange={(e) => setCidadeFiltro(e.target.value as CidadeFiltro)}
                  className="block w-full px-3 py-2 border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-100 focus:border-emerald-500 sm:text-sm transition-colors"
                >
                  <option value="Todas">Todas</option>
                  {cidadesDisponiveis.map((cidade) => (
                    <option key={cidade} value={cidade}>
                      {cidade}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-end">
                <button
                  type="button"
                  onClick={limparFiltros}
                  className="w-full inline-flex items-center justify-center gap-2 px-4 py-2 bg-slate-50 border border-slate-200 text-slate-700 text-sm font-medium rounded-lg hover:bg-slate-100 transition-colors"
                >
                  Limpar filtros
                </button>
              </div>
            </div>
          )}
        </div>

        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="block sm:hidden divide-y divide-slate-100">
            {apoiadoresFiltrados.length === 0 ? (
              <div className="p-6 text-center">
                <p className="font-semibold text-slate-900">
                  Nenhum usuário encontrado
                </p>
                <p className="text-sm text-slate-500 mt-1">
                  Tente ajustar a busca ou os filtros aplicados.
                </p>
              </div>
            ) : (
              apoiadoresFiltrados.map((apoiador) => (
                <div
                  key={apoiador.id}
                  className="p-4 space-y-3 hover:bg-slate-50 transition-colors"
                >
                  <div className="flex justify-between items-start gap-3">
                    <div>
                      <p className="font-semibold text-slate-900">
                        {apoiador.nome}
                      </p>
                      <div className="text-sm text-slate-500 flex items-center gap-1.5 mt-1">
                        <Phone className="w-3.5 h-3.5" />
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

                    <div className="flex items-center gap-2">
                      <span
                        className={`inline-flex items-center px-2 py-1 rounded text-xs font-semibold ${
                          apoiador.status === "ATIVO"
                            ? "bg-emerald-50 text-emerald-700"
                            : "bg-amber-50 text-amber-700"
                        }`}
                      >
                        {formatarStatus(apoiador.status)}
                      </span>

                      {apoiador.papelUsuario && (
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-semibold ${
                            apoiador.papelUsuario === "LIDER"
                              ? "bg-blue-50 text-blue-700"
                              : "bg-slate-100 text-slate-700"
                          }`}
                        >
                          {apoiador.papelUsuario === "LIDER" ? (
                            <Crown className="w-3 h-3" />
                          ) : (
                            <Users className="w-3 h-3" />
                          )}
                          {formatarPapelUsuario(apoiador.papelUsuario)}
                        </span>
                      )}

                      <div className="relative">
                        <button
                          type="button"
                          onClick={() =>
                            setMenuAbertoId((idAtual) =>
                              idAtual === apoiador.id ? null : apoiador.id
                            )
                          }
                          className="text-slate-400 hover:text-emerald-600 transition-colors p-1 rounded-md hover:bg-emerald-50"
                        >
                          <MoreVertical className="w-5 h-5" />
                        </button>

                        {menuAbertoId === apoiador.id && (
                          <div className="absolute right-0 top-8 z-20 w-40 bg-white border border-slate-200 rounded-lg shadow-lg overflow-hidden">
                            <button
                              type="button"
                              onClick={() => abrirDetalhes(apoiador)}
                              className="w-full px-3 py-2 text-left text-sm text-slate-700 hover:bg-slate-50 flex items-center gap-2"
                            >
                              <Eye className="w-4 h-4" />
                              Ver detalhes
                            </button>

                            {podePromoverParaLider(apoiador) && (
                              <button
                                type="button"
                                onClick={() => promoverParaLider(apoiador)}
                                className="w-full px-3 py-2 text-left text-sm text-blue-700 hover:bg-blue-50 flex items-center gap-2"
                              >
                                <ShieldCheck className="w-4 h-4" />
                                Promover a líder
                              </button>
                            )}

                            <button
                              type="button"
                              onClick={() => abrirEdicao(apoiador)}
                              className="w-full px-3 py-2 text-left text-sm text-slate-700 hover:bg-slate-50 flex items-center gap-2"
                            >
                              <Pencil className="w-4 h-4" />
                              Editar
                            </button>
                            <button
                              type="button"
                              onClick={() => removerApoiador(apoiador)}
                              className="w-full px-3 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
                            >
                              <Trash2 className="w-4 h-4" />
                              Remover
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="text-sm text-slate-600 flex items-center gap-1.5">
                    <MapPin className="w-4 h-4 text-slate-400 shrink-0" />
                    <span className="truncate">
                      {apoiador.cidade} - {apoiador.bairro}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>

          <div className="hidden sm:block overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-600">
              <thead className="bg-slate-50 text-slate-500 font-medium border-b border-slate-200">
                <tr>
                  <th className="px-6 py-4 whitespace-nowrap">Nome</th>
                  <th className="px-6 py-4 whitespace-nowrap">Contato</th>
                  <th className="px-6 py-4 whitespace-nowrap">Localização</th>
                  <th className="px-6 py-4 whitespace-nowrap">Status</th>
                  <th className="px-6 py-4 text-right whitespace-nowrap">
                    Ações
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {apoiadoresFiltrados.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-10 text-center">
                      <p className="font-semibold text-slate-900">
                        Nenhum usuário encontrado
                      </p>
                      <p className="text-sm text-slate-500 mt-1">
                        Tente ajustar a busca ou os filtros aplicados.
                      </p>
                    </td>
                  </tr>
                ) : (
                  apoiadoresFiltrados.map((apoiador) => (
                    <tr
                      key={apoiador.id}
                      className="hover:bg-slate-50 transition-colors"
                    >
                      <td className="px-6 py-4">
                        <div className="flex flex-col gap-1">
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-slate-900">
                              {apoiador.nome}
                            </span>

                            {apoiador.papelUsuario && (
                              <span
                                className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${
                                  apoiador.papelUsuario === "LIDER"
                                    ? "bg-blue-50 text-blue-700"
                                    : "bg-slate-100 text-slate-700"
                                }`}
                              >
                                {apoiador.papelUsuario === "LIDER" ? (
                                  <Crown className="w-3 h-3" />
                                ) : (
                                  <Users className="w-3 h-3" />
                                )}
                                {formatarPapelUsuario(apoiador.papelUsuario)}
                              </span>
                            )}
                          </div>

                          {apoiador.superiorNome && (
                            <span className="text-xs text-slate-400">
                              Responsável: {apoiador.superiorNome}
                            </span>
                          )}

                          {apoiador.admRaizNome && (
                            <span className="text-xs text-slate-400">
                              Rede principal: {apoiador.admRaizNome}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2 text-slate-500">
                          <Phone className="w-4 h-4 text-slate-400" />
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
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2 text-slate-500">
                          <MapPin className="w-4 h-4 text-slate-400 shrink-0" />
                          <span className="truncate">
                            {apoiador.cidade} ({apoiador.bairro})
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${
                            apoiador.status === "ATIVO"
                              ? "bg-emerald-50 text-emerald-700"
                              : "bg-amber-50 text-amber-700"
                          }`}
                        >
                          {formatarStatus(apoiador.status)}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right relative">
                        <button
                          type="button"
                          onClick={() =>
                            setMenuAbertoId((idAtual) =>
                              idAtual === apoiador.id ? null : apoiador.id
                            )
                          }
                          className="text-slate-400 hover:text-emerald-600 transition-colors p-1 rounded-md hover:bg-emerald-50"
                        >
                          <MoreVertical className="w-5 h-5" />
                        </button>

                        {menuAbertoId === apoiador.id && (
                          <div className="absolute right-6 top-12 z-20 w-40 bg-white border border-slate-200 rounded-lg shadow-lg overflow-hidden text-left">
                            <button
                              type="button"
                              onClick={() => abrirDetalhes(apoiador)}
                              className="w-full px-3 py-2 text-left text-sm text-slate-700 hover:bg-slate-50 flex items-center gap-2"
                            >
                              <Eye className="w-4 h-4" />
                              Ver detalhes
                            </button>

                            {podePromoverParaLider(apoiador) && (
                              <button
                                type="button"
                                onClick={() => promoverParaLider(apoiador)}
                                className="w-full px-3 py-2 text-left text-sm text-blue-700 hover:bg-blue-50 flex items-center gap-2"
                              >
                                <ShieldCheck className="w-4 h-4" />
                                Promover a líder
                              </button>
                            )}

                            <button
                              type="button"
                              onClick={() => abrirEdicao(apoiador)}
                              className="w-full px-3 py-2 text-left text-sm text-slate-700 hover:bg-slate-50 flex items-center gap-2"
                            >
                              <Pencil className="w-4 h-4" />
                              Editar
                            </button>
                            <button
                              type="button"
                              onClick={() => removerApoiador(apoiador)}
                              className="w-full px-3 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
                            >
                              <Trash2 className="w-4 h-4" />
                              Remover
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
          <p className="text-sm text-slate-500">
            Página {paginaAtual + 1} de {totalPaginas}
          </p>

          <div className="flex gap-2">
            <button
              type="button"
              disabled={paginaAtual <= 0 || carregando}
              onClick={() => carregarApoiadores(paginaAtual - 1)}
              className="px-3 py-2 text-sm font-medium rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Anterior
            </button>

            <button
              type="button"
              disabled={paginaAtual + 1 >= totalPaginas || carregando}
              onClick={() => carregarApoiadores(paginaAtual + 1)}
              className="px-3 py-2 text-sm font-medium rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Próxima
            </button>
          </div>
        </div>

        {modalFormularioAberto && (
          <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="w-full max-w-lg bg-white rounded-2xl border border-slate-200 shadow-xl overflow-hidden">
              <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
                <div>
                  <h2 className="font-bold text-slate-900">
                    {apoiadorEditando ? "Editar usuário" : "Novo usuário"}
                  </h2>
                  <p className="text-sm text-slate-500 mt-0.5">
                    Preencha os dados do usuário.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={fecharModalFormulario}
                  className="text-slate-400 hover:text-slate-600 transition-colors p-1 rounded-md hover:bg-slate-100"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={salvarApoiador} className="p-5 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">
                    Nome
                  </label>
                  <input
                    type="text"
                    value={formulario.nome}
                    onChange={(e) =>
                      setFormulario((atual) => ({
                        ...atual,
                        nome: e.target.value,
                      }))
                    }
                    className="block w-full px-3 py-2.5 border border-slate-200 rounded-lg text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-100 focus:border-emerald-500 sm:text-sm transition-colors"
                    placeholder="Nome do usuário"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">
                    E-mail
                  </label>
                  <input
                    type="email"
                    value={formulario.email ?? ""}
                    onChange={(e) =>
                      setFormulario((atual) => ({
                        ...atual,
                        email: e.target.value,
                      }))
                    }
                    className="block w-full px-3 py-2.5 border border-slate-200 rounded-lg text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-100 focus:border-emerald-500 sm:text-sm transition-colors"
                    placeholder="email@exemplo.com"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">
                    Telefone
                  </label>
                  <input
                    type="text"
                    value={formulario.telefone}
                    onChange={(e) =>
                      setFormulario((atual) => ({
                        ...atual,
                        telefone: e.target.value,
                      }))
                    }
                    className="block w-full px-3 py-2.5 border border-slate-200 rounded-lg text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-100 focus:border-emerald-500 sm:text-sm transition-colors"
                    placeholder="(85) 99999-9999"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">
                    Telefone
                  </label>
                  <input
                    type="text"
                    value={formulario.telefone}
                    onChange={(e) =>
                      setFormulario((atual) => ({
                        ...atual,
                        telefone: e.target.value,
                      }))
                    }
                    className="block w-full px-3 py-2.5 border border-slate-200 rounded-lg text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-100 focus:border-emerald-500 sm:text-sm transition-colors"
                    placeholder="(85) 99999-9999"
                  />
                </div>


                {!apoiadorEditando && (
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1.5">
                      Senha temporária
                    </label>
                    <input
                      type="password"
                      value={formulario.senhaTemporaria ?? ""}
                      onChange={(e) =>
                        setFormulario((atual) => ({
                          ...atual,
                          senhaTemporaria: e.target.value,
                        }))
                      }
                      className="block w-full px-3 py-2.5 border border-slate-200 rounded-lg text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-100 focus:border-emerald-500 sm:text-sm transition-colors"
                      placeholder="Mínimo de 6 caracteres"
                    />
                    <p className="text-xs text-slate-500 mt-1">
                      Essa senha será usada pelo usuário no primeiro acesso.
                    </p>
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1.5">
                      Cidade
                    </label>
                    <input
                      type="text"
                      value={formulario.cidade}
                      onChange={(e) =>
                        setFormulario((atual) => ({
                          ...atual,
                          cidade: e.target.value,
                        }))
                      }
                      className="block w-full px-3 py-2.5 border border-slate-200 rounded-lg text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-100 focus:border-emerald-500 sm:text-sm transition-colors"
                      placeholder="Cidade"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1.5">
                      Bairro
                    </label>
                    <input
                      type="text"
                      value={formulario.bairro}
                      onChange={(e) =>
                        setFormulario((atual) => ({
                          ...atual,
                          bairro: e.target.value,
                        }))
                      }
                      className="block w-full px-3 py-2.5 border border-slate-200 rounded-lg text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-100 focus:border-emerald-500 sm:text-sm transition-colors"
                      placeholder="Bairro"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1.5">
                      Segmento
                    </label>
                    <input
                      type="number"
                      value={formulario.zonaEleitoral || ""}
                      onChange={(e) =>
                        setFormulario((atual) => ({
                          ...atual,
                          zonaEleitoral: Number(e.target.value),
                        }))
                      }
                      className="block w-full px-3 py-2.5 border border-slate-200 rounded-lg text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-100 focus:border-emerald-500 sm:text-sm transition-colors"
                      placeholder="Ex: 6"
                      min={1}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1.5">
                      Subsegmento
                    </label>
                    <input
                      type="number"
                      value={formulario.secaoEleitoral || ""}
                      onChange={(e) =>
                        setFormulario((atual) => ({
                          ...atual,
                          secaoEleitoral: Number(e.target.value),
                        }))
                      }
                      className="block w-full px-3 py-2.5 border border-slate-200 rounded-lg text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-100 focus:border-emerald-500 sm:text-sm transition-colors"
                      placeholder="Ex: 122"
                      min={1}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">
                    Status
                  </label>
                  <select
                    value={formulario.status}
                    onChange={(e) =>
                      setFormulario((atual) => ({
                        ...atual,
                        status: e.target.value as StatusApoiador,
                      }))
                    }
                    className="block w-full px-3 py-2.5 border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-100 focus:border-emerald-500 sm:text-sm transition-colors"
                  >
                    <option value="ATIVO">Ativo</option>
                    <option value="PENDENTE">Pendente</option>
                  </select>
                </div>

                {erroFormulario && (
                  <div className="p-3 rounded-lg bg-red-50 text-red-600 text-sm font-medium border border-red-100">
                    {erroFormulario}
                  </div>
                )}

                <div className="flex flex-col sm:flex-row gap-3 pt-2">
                  <button
                    type="button"
                    onClick={fecharModalFormulario}
                    className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-white border border-slate-200 text-slate-700 text-sm font-medium rounded-lg hover:bg-slate-50 transition-colors w-full"
                  >
                    Cancelar
                  </button>

                  <button
                    type="submit"
                    disabled={salvando}
                    className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-emerald-600 text-white text-sm font-medium rounded-lg hover:bg-emerald-700 transition-colors shadow-sm w-full disabled:opacity-60 disabled:cursor-not-allowed"
                  >
                    <Save className="w-4 h-4" />
                    {salvando ? "Salvando..." : "Salvar usuário"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {apoiadorDetalhes && (
          <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="w-full max-w-md bg-white rounded-2xl border border-slate-200 shadow-xl overflow-hidden">
              <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
                <div>
                  <h2 className="font-bold text-slate-900">
                    Detalhes do usuário
                  </h2>
                  <p className="text-sm text-slate-500 mt-0.5">
                    Informações cadastradas na plataforma.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => setApoiadorDetalhes(null)}
                  className="text-slate-400 hover:text-slate-600 transition-colors p-1 rounded-md hover:bg-slate-100"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-5 space-y-4">
                <div>
                  <p className="text-xs font-medium text-slate-500">Nome</p>
                  <p className="text-sm font-semibold text-slate-900 mt-1">
                    {apoiadorDetalhes.nome}
                  </p>
                </div>

                <div>
                  <p className="text-xs font-medium text-slate-500">Telefone</p>
                  <div className="flex items-center gap-2 mt-1">
                    <p className="text-sm font-semibold text-slate-900">
                      {apoiadorDetalhes.telefone}
                    </p>
                    <a
                      href={montarLinkWhatsApp(apoiadorDetalhes.telefone)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center justify-center w-7 h-7 rounded-md text-emerald-600 hover:bg-emerald-50 hover:text-emerald-700 transition-colors"
                    >
                      <MessageCircle className="w-4 h-4" />
                    </a>
                  </div>
                </div>

                <div>
                  <p className="text-xs font-medium text-slate-500">
                    Localização
                  </p>
                  <p className="text-sm font-semibold text-slate-900 mt-1">
                    {apoiadorDetalhes.cidade} - {apoiadorDetalhes.bairro}
                  </p>
                </div>

                <div>
                  <p className="text-xs font-medium text-slate-500">Status</p>
                  <span
                    className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                      apoiadorDetalhes.status === "ATIVO"
                        ? "bg-emerald-50 text-emerald-700"
                        : "bg-amber-50 text-amber-700"
                    }`}
                  >
                    {formatarStatus(apoiadorDetalhes.status)}
                  </span>
                </div>

                {apoiadorDetalhes.papelUsuario && (
                  <div>
                    <p className="text-xs font-medium text-slate-500">Papel</p>
                    <p className="text-sm font-semibold text-slate-900 mt-1">
                      {formatarPapelUsuario(apoiadorDetalhes.papelUsuario)}
                    </p>
                  </div>
                )}

                {apoiadorDetalhes.superiorNome && (
                  <div>
                    <p className="text-xs font-medium text-slate-500">
                      Responsável direto
                    </p>
                    <p className="text-sm font-semibold text-slate-900 mt-1">
                      {apoiadorDetalhes.superiorNome}
                    </p>
                  </div>
                )}

                {apoiadorDetalhes.admRaizNome && (
                  <div>
                    <p className="text-xs font-medium text-slate-500">
                      Rede principal
                    </p>
                    <p className="text-sm font-semibold text-slate-900 mt-1">
                      {apoiadorDetalhes.admRaizNome}
                    </p>
                  </div>
                )}

                <button
                  type="button"
                  onClick={() => setApoiadorDetalhes(null)}
                  className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-slate-900 text-white text-sm font-medium rounded-lg hover:bg-slate-800 transition-colors"
                >
                  Fechar
                </button>
              </div>
            </div>
          </div>
        )}
      </>
    )}
  </div>
);
}

function RedeNodeCard({
  node,
  nivel,
  aberto,
  nodesAbertos,
  onAlternar,
  formatarPapel,
  formatarTitulo,
}: {
  node: RedeUsuarioNode;
  nivel: number;
  aberto: boolean;
  nodesAbertos: Record<string, boolean>;
  onAlternar: (id: string) => void;
  formatarPapel: (papel?: string | null) => string;
  formatarTitulo: (valor?: string | null) => string;
}) {
  const temFilhos = node.filhos && node.filhos.length > 0;
  const papel = (node.papel || "").toUpperCase();

  return (
    <div className="space-y-2">
      <div
        className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm"
        style={{ marginLeft: nivel > 0 ? `${Math.min(nivel * 20, 80)}px` : 0 }}
      >
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              {temFilhos ? (
                <button
                  type="button"
                  onClick={() => onAlternar(node.id)}
                  className="inline-flex h-7 w-7 items-center justify-center rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50"
                  aria-label="Abrir ou fechar filhos"
                >
                  {aberto ? (
                    <ChevronDown className="w-4 h-4" />
                  ) : (
                    <ChevronRight className="w-4 h-4" />
                  )}
                </button>
              ) : (
                <span className="inline-flex h-7 w-7" />
              )}

              <h3 className="font-bold text-slate-900 truncate">
                {node.nome}
              </h3>

              <span
                className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${
                  papel === "LIDER"
                    ? "bg-blue-50 text-blue-700"
                    : "bg-slate-100 text-slate-700"
                }`}
              >
                {papel === "LIDER" ? (
                  <Crown className="w-3 h-3" />
                ) : (
                  <Users className="w-3 h-3" />
                )}
                {formatarPapel(node.papel)}
              </span>
            </div>

            <div className="mt-3 grid grid-cols-1 gap-2 text-sm text-slate-500 sm:grid-cols-2 lg:grid-cols-4">
              <div>
                <span className="block text-xs font-medium text-slate-400">
                  Telefone
                </span>
                <span className="font-medium text-slate-700">
                  {node.telefone || "Não informado"}
                </span>
              </div>

              <div>
                <span className="block text-xs font-medium text-slate-400">
                  Superior
                </span>
                <span className="font-medium text-slate-700">
                  {node.superiorNome || "Não informado"}
                </span>
              </div>

              <div>
                <span className="block text-xs font-medium text-slate-400">
                  Título cadastrado
                </span>
                <span className="font-medium text-slate-700">
                  {formatarTitulo(node.tituloEleitorUltimos4)}
                </span>
              </div>

              <div>
                <span className="block text-xs font-medium text-slate-400">
                  Filhos
                </span>
                <span className="font-medium text-slate-700">
                  {node.totalFilhos ?? 0}
                </span>
              </div>
            </div>
          </div>

          <div className="text-xs text-slate-400">
            Nível {nivel + 1}
          </div>
        </div>
      </div>

      {temFilhos && aberto && (
        <div className="space-y-2">
          {node.filhos.map((filho) => (
            <RedeNodeCard
              key={filho.id}
              node={filho}
              nivel={nivel + 1}
              aberto={nodesAbertos[filho.id] ?? true}
              nodesAbertos={nodesAbertos}
              onAlternar={onAlternar}
              formatarPapel={formatarPapel}
              formatarTitulo={formatarTitulo}
            />
          ))}
        </div>
      )}
    </div>
  );
}