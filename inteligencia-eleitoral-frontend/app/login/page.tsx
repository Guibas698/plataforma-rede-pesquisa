"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { ShieldCheck, Mail, Lock, Eye, EyeOff } from "lucide-react";

import { apiFetch, ApiError } from "../lib/api";
import {
  salvarSessao,
  obterRotaPorPapel,
  type LoginRequest,
  type LoginResponse,
} from "../lib/auth";

export default function LoginPage() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [mostrarSenha, setMostrarSenha] = useState(false);
  const [erro, setErro] = useState("");
  const [carregando, setCarregando] = useState(false);

  const handleLogin = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setErro("");

    const emailNormalizado = email.trim().toLowerCase();
    const senhaNormalizada = senha.trim();

    if (!emailNormalizado) {
      setErro("Informe o e-mail.");
      return;
    }

    if (!senhaNormalizada) {
      setErro("Informe a senha.");
      return;
    }

    setCarregando(true);

    try {
      const payload: LoginRequest = {
        email: emailNormalizado,
        senha: senhaNormalizada,
      };

      const response = await apiFetch<LoginResponse>("/auth/login", {
        method: "POST",
        body: JSON.stringify(payload),
      });

      salvarSessao(response);

      const rotaDestino = obterRotaPorPapel(response.papel);
      router.push(rotaDestino);
    } catch (error) {
      if (error instanceof ApiError) {
        setErro(
          error.data?.mensagem ??
            error.message ??
            "Não foi possível realizar login."
        );
        return;
      }

      setErro("Não foi possível realizar login.");
    } finally {
      setCarregando(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center items-center p-4 font-sans">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="p-6 sm:p-8 pb-6 flex flex-col items-center text-center">
          <div className="w-14 h-14 bg-slate-900 rounded-xl flex items-center justify-center mb-4 shadow-sm">
            <ShieldCheck className="text-white w-8 h-8" />
          </div>

          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            Rede Pesquisa
          </h1>

          <p className="text-sm text-slate-500 mt-1">
            Acesso à plataforma de gestão e pesquisa
          </p>
        </div>

        <div className="px-6 sm:px-8 pb-8">
          <form onSubmit={handleLogin} className="space-y-5">
            <div className="space-y-1.5">
              <label
                htmlFor="email"
                className="block text-sm font-medium text-slate-700"
              >
                E-mail
              </label>

              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail className="h-5 w-5 text-slate-400" />
                </div>

                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="seu@email.com"
                  className="block w-full pl-10 pr-3 py-2.5 border border-slate-200 rounded-lg text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-colors sm:text-sm"
                  disabled={carregando}
                  autoComplete="email"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label
                  htmlFor="senha"
                  className="block text-sm font-medium text-slate-700"
                >
                  Senha
                </label>

                <a
                  href="#"
                  className="text-sm font-medium text-emerald-600 hover:text-emerald-700 transition-colors"
                  onClick={(e) => e.preventDefault()}
                >
                  Esqueci a senha
                </a>
              </div>

              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-slate-400" />
                </div>

                <input
                  id="senha"
                  type={mostrarSenha ? "text" : "password"}
                  value={senha}
                  onChange={(e) => setSenha(e.target.value)}
                  placeholder="••••••••"
                  className="block w-full pl-10 pr-10 py-2.5 border border-slate-200 rounded-lg text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-colors sm:text-sm"
                  disabled={carregando}
                  autoComplete="current-password"
                />

                <button
                  type="button"
                  onClick={() => setMostrarSenha((valorAtual) => !valorAtual)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 transition-colors focus:outline-none"
                  aria-label={mostrarSenha ? "Ocultar senha" : "Mostrar senha"}
                  disabled={carregando}
                >
                  {mostrarSenha ? (
                    <EyeOff className="h-5 w-5" />
                  ) : (
                    <Eye className="h-5 w-5" />
                  )}
                </button>
              </div>
            </div>

            {erro && (
              <div className="p-3 rounded-lg bg-red-50 text-red-600 text-sm font-medium text-center border border-red-100">
                {erro}
              </div>
            )}

            <button
              type="submit"
              disabled={carregando}
              className="w-full flex justify-center py-2.5 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-emerald-600 hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 disabled:opacity-70 disabled:cursor-not-allowed transition-all"
            >
              {carregando ? "Entrando..." : "Entrar"}
            </button>
          </form>
        </div>

        <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 text-center">
          <p className="text-xs text-slate-500 font-medium">
            Acesso restrito a Admins, ADMs, líderes e usuários autorizados.
          </p>
        </div>
      </div>
    </div>
  );
}