import { CredentialsSignin } from "next-auth";

/** Excesso de tentativas de login, propagado como `code` na resposta do `signIn`. */
export class RateLimitedSignin extends CredentialsSignin {
  code = "rate_limited";
}
