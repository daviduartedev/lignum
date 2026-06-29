export type DocumentLookupErrorCode =
  | "DOCUMENT_INVALID"
  | "CPF_NOT_SUPPORTED"
  | "CNPJ_NOT_FOUND"
  | "PROVIDER_ERROR"
  | "PROVIDER_TIMEOUT";

export class DocumentLookupError extends Error {
  readonly code: DocumentLookupErrorCode;

  constructor(code: DocumentLookupErrorCode, message: string) {
    super(message);
    this.name = "DocumentLookupError";
    this.code = code;
  }
}
