"use client";

import { signIn } from "next-auth/react";
import { Eye, EyeOff, Loader2, ShieldCheck } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { POST_LOGIN_POPUP_SESSION_KEY } from "@/components/PostLoginNotificacoesGate";
import { BrandLogo } from "@/components/BrandLogo";
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
    <div className="relative h-full min-h-0 w-full overflow-y-auto bg-[#030213]">
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute left-1/2 top-1/4 h-[600px] w-[600px] -translate-x-1/2 rounded-full bg-primary/10 blur-3xl" />
      </div>

      <div className="relative z-10 mx-auto flex min-h-full w-full max-w-md flex-col items-center justify-center p-4 pb-12 sm:pb-16">
        <div className="mb-10 flex flex-col items-center">
          <h1 className="m-0 mb-5 flex justify-center">
            <BrandLogo
              className="relative h-40 w-56 max-w-[min(90vw,280px)] shrink-0"
              priority
              variant="dark"
            />
          </h1>
          <p className="mt-0 max-w-sm text-center text-sm text-white/60">{BRAND_TAGLINE}</p>
        </div>

        <div className="rounded-2xl border border-white/10 bg-white/5 p-8 backdrop-blur-sm">
          <h2 className="mb-6 text-lg font-semibold text-white">Entrar na conta</h2>

          <form onSubmit={handleSubmit} className="space-y-5" id="login-form">
            <div className="space-y-2">
              <label
                htmlFor="identifier"
                className="text-xs font-semibold uppercase tracking-wider text-white/60"
              >
                E-mail ou usuário
              </label>
              <input
                id="identifier"
                type="text"
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                placeholder="seu@email.com"
                required
                className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white caret-primary transition-all outline-none focus:border-primary/50 focus:ring-2 focus:ring-primary/20"
              />
            </div>

            <div className="space-y-2">
              <label
                htmlFor="password"
                className="text-xs font-semibold uppercase tracking-wider text-white/60"
              >
                Senha
              </label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 pr-12 text-sm text-white caret-primary transition-all outline-none focus:border-primary/50 focus:ring-2 focus:ring-primary/20"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-white/60 transition-colors hover:text-white/80"
                  aria-label={showPassword ? "Ocultar senha" : "Mostrar senha"}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            {error ? (
              <div className="flex items-center gap-2 rounded-xl border border-destructive/20 bg-destructive/10 p-3">
                <ShieldCheck className="h-4 w-4 shrink-0 text-destructive" />
                <p className="text-xs text-destructive">{error}</p>
              </div>
            ) : null}

            <button
              id="login-submit"
              type="submit"
              disabled={isLoading || !identifier || !password}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary py-3 text-sm font-semibold text-primary-foreground shadow-lg shadow-primary/30 transition-all hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Entrando...
                </>
              ) : (
                "Entrar"
              )}
            </button>
          </form>
        </div>

        {isSelfSignupEnabled() ? (
          <p className="mt-6 text-center text-sm text-white/60">
            Ainda não tem conta?{" "}
            <Link href="/cadastro" className="font-semibold text-accent hover:text-accent/90">
              Criar conta
            </Link>
          </p>
        ) : null}

        <div className="mt-8 w-full max-w-md rounded-xl border border-white/10 bg-white/[0.03] px-4 py-4 text-center">
          <div className="flex flex-col items-center gap-3">
            <div className="flex items-center justify-center gap-2">
              <ShieldCheck className="h-4 w-4 shrink-0 text-primary/90" aria-hidden />
              <span className="text-[11px] font-semibold uppercase tracking-[0.12em] text-white/50">
                Acesso restrito
              </span>
            </div>
            <p className="m-0 max-w-[28ch] text-sm leading-relaxed text-white/90 sm:max-w-none">
              Esta área é exclusiva para <strong className="font-semibold text-white">operadores autorizados</strong>.
              {!isSelfSignupEnabled() ? (
                <>
                  {" "}
                  Contas criadas pelo administrador aceitam a política no primeiro acesso à aplicação.
                </>
              ) : null}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
