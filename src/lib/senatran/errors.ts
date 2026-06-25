export type SenatranErrorCode =
  | "PLATE_INVALID"
  | "PLATE_NOT_FOUND"
  | "RENAVAM_LOOKUP_NOT_SUPPORTED"
  | "API_FAILURE"
  | "TIMEOUT"
  | "QUOTA_EXCEEDED";

export class SenatranLookupError extends Error {
  readonly code: SenatranErrorCode;

  constructor(code: SenatranErrorCode, message: string) {
    super(message);
    this.name = "SenatranLookupError";
    this.code = code;
  }
}
