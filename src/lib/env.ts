/** Cadastro público. Se desligado, `/cadastro` pode redirecionar para `/login` (após migrar Register). */
export function isSelfSignupEnabled(): boolean {
  return process.env.NEXT_PUBLIC_ENABLE_SELF_SIGNUP === "true";
}
