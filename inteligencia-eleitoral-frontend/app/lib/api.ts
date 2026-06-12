export type ApiErrorResponse = {
  timestamp?: string;
  status?: number;
  erro?: string;
  mensagem?: string;
  caminho?: string;
};

export class ApiError extends Error {
  status?: number;
  data?: ApiErrorResponse;

  constructor(message: string, status?: number, data?: ApiErrorResponse) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.data = data;
  }
}

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8080/api";

const TOKEN_KEY = "mapa_eleitoral_token";

export function getToken(): string | null {
  if (typeof window === "undefined") {
    return null;
  }

  return localStorage.getItem(TOKEN_KEY);
}

export function setToken(token: string): void {
  if (typeof window === "undefined") {
    return;
  }

  localStorage.setItem(TOKEN_KEY, token);
}

export function removeToken(): void {
  if (typeof window === "undefined") {
    return;
  }

  localStorage.removeItem(TOKEN_KEY);
}

function montarUrl(endpoint: string): string {
  const baseUrl = API_BASE_URL.replace(/\/$/, "");
  const endpointNormalizado = endpoint.startsWith("/")
    ? endpoint
    : `/${endpoint}`;

  return `${baseUrl}${endpointNormalizado}`;
}

async function tentarLerJson(response: Response): Promise<unknown> {
  const contentType = response.headers.get("content-type");

  if (!contentType?.includes("application/json")) {
    return undefined;
  }

  try {
    return await response.json();
  } catch {
    return undefined;
  }
}

export async function apiFetch<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const token = getToken();

  const headers = new Headers(options.headers);

  if (!headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  try {
    const response = await fetch(montarUrl(endpoint), {
      ...options,
      headers,
    });

    if (response.status === 204) {
      return undefined as T;
    }

    const data = (await tentarLerJson(response)) as ApiErrorResponse | T | undefined;

    if (!response.ok) {
      const erroData = data as ApiErrorResponse | undefined;

      const mensagem =
        erroData?.mensagem ?? "Erro ao comunicar com o servidor.";

      throw new ApiError(mensagem, response.status, erroData);
    }

    return data as T;
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }

    throw new ApiError("Não foi possível conectar ao servidor.");
  }
}