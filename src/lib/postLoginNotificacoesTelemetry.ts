/** Contrato de telemetria do popup pós-login; envio real pode ser ligado depois. */
export type PopupNotificacoesDismissMethod = "ok" | "fechar" | "esc";

export function emitPopupNotificacoesExibido(_quantidade: number): void {}

export function emitPopupNotificacoesReconhecido(_metodo: PopupNotificacoesDismissMethod): void {}

export function emitInboxDrawerOpened(): void {}

export function emitInboxDrawerClosed(): void {}

export function emitPreCommitmentToastShown(_notificationId: string): void {}
