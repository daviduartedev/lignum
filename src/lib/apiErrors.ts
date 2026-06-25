export const API_ERROR_CODES = [
  "UNAUTHENTICATED",
  "FORBIDDEN",
  "NOT_FOUND",
  "VALIDATION_ERROR",
  "CONFLICT",
  "INTERNAL_ERROR",
  "RATE_LIMITED",
  "BAD_REQUEST",
] as const;

export type ApiErrorCode = (typeof API_ERROR_CODES)[number];

const DEFAULT_MESSAGES: Record<ApiErrorCode, string> = {
  UNAUTHENTICATED: "Sessão expirada. Faça login novamente.",
  FORBIDDEN: "Você não tem permissão para executar esta ação.",
  NOT_FOUND: "Registro não encontrado.",
  VALIDATION_ERROR: "Há campos com valores inválidos. Revise o formulário.",
  CONFLICT: "Já existe um registro com estes dados.",
  INTERNAL_ERROR: "Erro inesperado no servidor. Tente novamente.",
  RATE_LIMITED: "Muitas tentativas. Tente novamente em alguns minutos.",
  BAD_REQUEST: "Requisição inválida.",
};

export function defaultMessageFor(code: ApiErrorCode): string {
  return DEFAULT_MESSAGES[code];
}

export class ApiError extends Error {
  constructor(
    public readonly code: ApiErrorCode,
    message: string,
    public readonly status: number,
    public readonly details?: unknown,
  ) {
    super(message);
    this.name = "ApiError";
  }

  static isApiError(e: unknown): e is ApiError {
    return e instanceof ApiError;
  }
}
