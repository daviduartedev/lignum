"use client";

import { signIn } from "next-auth/react";
import { Eye, EyeOff, Loader2, Lock, Mail, ShieldCheck, UserCircle } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { POST_LOGIN_POPUP_SESSION_KEY } from "@/components/PostLoginNotificacoesGate";
import { LignumMark } from "@/components/LignumMark";
import {
  sanitizeAuthReturnPath,
  setAuthReturnPathCookie,
  takeAuthReturnPathCookie,
} from "@/lib/authReturnPath";
import { BRAND_TAGLINE } from "@/lib/brand";
import { isSelfSignupEnabled } from "@/lib/env";
import { toast } from "@/lib/toast";

export default function LoginPage() {
  const router = useRouter();
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const sp = new URLSearchParams(window.location.search);
    let strip = false;

    if (sp.get("notice") === "signup_admin_only") {
      toast.info("Cadastro público desligado. Peça a um administrador para criar a sua conta.");
      sp.delete("notice");
      strip = true;
    }

    const legacyCallback = sp.get("callbackUrl");
    if (legacyCallback) {
      const safe = sanitizeAuthReturnPath(legacyCallback);
      if (safe) setAuthReturnPathCookie(safe);
      sp.delete("callbackUrl");
      strip = true;
    }

    if (strip) {
      const qs = sp.toString();
      window.history.replaceState({}, "", qs ? `/login?${qs}` : "/login");
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      const result = await signIn("credentials", {
        redirect: false,
        email: identifier.trim(),
        password,
      });

      if (result?.error) {
        const userMsg =
          result.code === "rate_limited"
            ? "Muitas tentativas de login. Aguarde alguns minutos e tente novamente."
            : result.error === "CredentialsSignin"
              ? "E-mail ou senha inválidos. Verifique e tente novamente."
              : "Não foi possível conectar. Verifique sua internet e tente novamente.";
        setError(userMsg);
        toast.error(userMsg);
        return;
      }

      toast.success("Sessão iniciada.");
      if (typeof window !== "undefined") {
        sessionStorage.setItem(POST_LOGIN_POPUP_SESSION_KEY, "1");
      }
      const returnTo = takeAuthReturnPathCookie();
      const destination = returnTo && returnTo !== "/login" ? returnTo : "/";
      router.replace(destination);
      router.refresh();
    } catch {
      const userMsg = "Não foi possível conectar. Verifique sua internet e tente novamente.";
      setError(userMsg);
      toast.error(userMsg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex h-full min-h-0 w-full overflow-hidden">

      {/* ════════════════════════════════════
          Painel esquerdo — formulário
      ════════════════════════════════════ */}
      <div className="relative flex w-full flex-col overflow-y-auto bg-white px-8 py-10 lg:w-[44%] lg:px-14 xl:px-20">

        {/* Linha decorativa azul no topo */}
        <div className="absolute inset-x-0 top-0 h-[3px] bg-gradient-to-r from-[#0234c9] via-[#046ceb] to-[#0234c9]" />

        {/* Logo */}
        <div className="mb-auto flex items-center gap-3 pt-1">
          <LignumMark className="h-9 w-9 shrink-0" />
          <div className="flex flex-col leading-none">
            <span className="text-xl font-bold tracking-tight text-[#111827]">Lignum</span>
            <span className="mt-0.5 text-[9px] font-semibold tracking-[0.3em] text-[#9ca3af]">
              GESTÃO
            </span>
          </div>
        </div>

        {/* Formulário */}
        <div className="mx-auto w-full max-w-[360px] py-12">

          {/* Cabeçalho */}
          <div className="mb-8">
            <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-[#0234c9]">
              Acesso ao sistema
            </p>
            <h1 className="text-[1.75rem] font-bold leading-tight text-[#111827]">
              Entre na sua conta
            </h1>
            <p className="mt-2 text-[13.5px] leading-relaxed text-[#6b7280]">
              Bem-vindo de volta. Insira suas credenciais para continuar.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5" id="login-form">

            {/* E-mail */}
            <div className="space-y-2">
              <label
                htmlFor="identifier"
                className="text-[10.5px] font-semibold uppercase tracking-[0.15em] text-[#374151]"
              >
                E-mail
              </label>
              <div className="group relative">
                <Mail className="pointer-events-none absolute left-4 top-1/2 h-[15px] w-[15px] -translate-y-1/2 text-[#9ca3af] transition-colors group-focus-within:text-[#0234c9]" />
                <input
                  id="identifier"
                  type="text"
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  placeholder="seu@email.com"
                  required
                  className="h-12 w-full rounded-xl border border-[#e5e7eb] bg-[#f9fafb] pl-11 pr-4 text-[14px] text-[#111827] outline-none transition-all placeholder:text-[#c0c5cf] focus:border-[#0234c9] focus:bg-white focus:ring-3 focus:ring-[#0234c9]/12"
                />
              </div>
            </div>

            {/* Senha */}
            <div className="space-y-2">
              <label
                htmlFor="password"
                className="text-[10.5px] font-semibold uppercase tracking-[0.15em] text-[#374151]"
              >
                Senha
              </label>
              <div className="group relative">
                <Lock className="pointer-events-none absolute left-4 top-1/2 h-[15px] w-[15px] -translate-y-1/2 text-[#9ca3af] transition-colors group-focus-within:text-[#0234c9]" />
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="h-12 w-full rounded-xl border border-[#e5e7eb] bg-[#f9fafb] pl-11 pr-12 text-[14px] text-[#111827] outline-none transition-all placeholder:text-[#c0c5cf] focus:border-[#0234c9] focus:bg-white focus:ring-3 focus:ring-[#0234c9]/12"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-[#9ca3af] transition-colors hover:text-[#374151]"
                  aria-label={showPassword ? "Ocultar senha" : "Mostrar senha"}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            {/* Erro */}
            {error ? (
              <div className="flex items-start gap-2.5 rounded-xl border border-red-100 bg-red-50 px-4 py-3">
                <ShieldCheck className="mt-px h-4 w-4 shrink-0 text-red-500" />
                <p className="text-[12.5px] leading-relaxed text-red-700">{error}</p>
              </div>
            ) : null}

            {/* Separador */}
            <div className="pt-1">
              <button
                id="login-submit"
                type="submit"
                disabled={isLoading || !identifier || !password}
                className="group relative flex h-12 w-full items-center justify-center gap-2 overflow-hidden rounded-xl bg-[#0234c9] text-[14px] font-semibold text-white shadow-lg shadow-[#0234c9]/30 transition-all duration-200 hover:bg-[#046ceb] hover:shadow-[#046ceb]/30 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50 disabled:shadow-none"
              >
                {/* Brilho no hover */}
                <span className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/8 to-white/0 opacity-0 transition-opacity group-hover:opacity-100" />
                {isLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Entrando…
                  </>
                ) : (
                  "Entrar"
                )}
              </button>
            </div>
          </form>

          {isSelfSignupEnabled() ? (
            <p className="mt-6 text-center text-[13px] text-[#6b7280]">
              Ainda não tem conta?{" "}
              <Link href="/cadastro" className="font-semibold text-[#0234c9] hover:text-[#046ceb]">
                Criar conta
              </Link>
            </p>
          ) : null}
        </div>

        {/* Rodapé */}
        <div className="mt-auto flex items-center gap-2 text-[12px] text-[#9ca3af]">
          <UserCircle className="h-[16px] w-[16px] shrink-0" aria-hidden />
          Precisa de ajuda?{" "}
          <a
            href="mailto:suporte@lignumgestao.com.br"
            className="font-medium text-[#0234c9] transition-colors hover:text-[#046ceb]"
          >
            Fale com o suporte
          </a>
        </div>
      </div>

      {/* ════════════════════════════════════
          Painel direito — foto premium
      ════════════════════════════════════ */}
      <div className="relative hidden overflow-hidden lg:block lg:w-[56%]">

        {/* Foto de fundo */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/login-truck.jpg"
          alt=""
          aria-hidden
          className="absolute inset-0 h-full w-full object-cover object-center"
        />

        {/* Camada de cor azul sobre a foto — controla opacidade da imagem */}
        <div className="absolute inset-0 bg-[#0a1a3d]/55" />

        {/* Gradiente adicional na base para o texto */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />

        {/* Conteúdo sobre a foto */}
        <div className="relative flex h-full flex-col justify-end p-12 xl:p-16">

          {/* Bloco de texto inferior */}
          <div className="max-w-lg">
            {/* Linha decorativa */}
            <div className="mb-5 h-[2px] w-10 rounded-full bg-[#046ceb]" />

            <h2 className="text-[2rem] font-bold leading-[1.2] tracking-tight text-white xl:text-[2.4rem]">
            Produção, vendas 
              <br />
              <span className="text-[#7eb3ff]">e gestão em um só lugar.</span>
            </h2>

            <p className="mt-4 max-w-sm text-[14px] leading-relaxed text-white/60">
              {BRAND_TAGLINE}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
