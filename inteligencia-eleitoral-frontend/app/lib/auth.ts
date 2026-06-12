import { setToken, removeToken } from "./api";

export type PapelUsuario = "MASTER" | "ADM" | "LIDER" | "USUARIO";

export type UsuarioLogado = {
  id: string;
  nome: string;
  email: string;
  telefone?: string;
  papel: PapelUsuario;
  fotoUrl?: string;
  ativo: boolean;
};

export type LoginResponse = {
  token: string;
  tipoToken: string;
  usuarioId: string;
  nome: string;
  email: string;
  papel: PapelUsuario;
};

export type LoginRequest = {
  email: string;
  senha: string;
};

export const TOKEN_KEY = "mapa_eleitoral_token";
export const USER_KEY = "mapa_eleitoral_usuario";

export function salvarSessao(loginResponse: LoginResponse): void {
  if (typeof window === "undefined") {
    return;
  }

  setToken(loginResponse.token);

  const usuario: UsuarioLogado = {
    id: loginResponse.usuarioId,
    nome: loginResponse.nome,
    email: loginResponse.email,
    papel: loginResponse.papel,
    ativo: true,
  };

  localStorage.setItem(USER_KEY, JSON.stringify(usuario));
}

export function obterUsuarioSalvo(): UsuarioLogado | null {
  if (typeof window === "undefined") {
    return null;
  }

  const usuarioSalvo = localStorage.getItem(USER_KEY);

  if (!usuarioSalvo) {
    return null;
  }

  try {
    return JSON.parse(usuarioSalvo) as UsuarioLogado;
  } catch {
    localStorage.removeItem(USER_KEY);
    return null;
  }
}

export function limparSessao(): void {
  if (typeof window === "undefined") {
    return;
  }

  removeToken();
  localStorage.removeItem(USER_KEY);
}

export function obterRotaPorPapel(papel: PapelUsuario): string {
  switch (papel) {
    case "MASTER":
      return "/admin";

    case "ADM":
      return "/adm";

    case "LIDER":
      return "/adm";

    case "USUARIO":
      return "/usuario";

    default:
      return "/login";
  }
}