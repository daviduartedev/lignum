# Feature: Audit log (acções sensíveis)

Complementa [`spec/audit/readme.md`](../audit/readme.md) (SENATRAN). Registo genérico de acções sensíveis no ERP.

## Modelo

- `AuditLog`: `userId?`, `action` (`AuditAction`), `resourceType`, `resourceId?`, `metadata` (JSON redigido), `createdAt`.
- `SenatranLookupAudit` permanece separado (snapshot pesado de consultas externas).

## Acções auditadas (0629)

- Auth: `login_success`, `login_failure`
- Utilizadores: `user_created`, `user_updated`, `user_deactivated`, `user_reactivated`, `user_role_changed`, `user_password_reset`
- Config: `erp_setting_updated`

## API

- `GET /api/audit-logs` — admin-only; paginação; filtros `userId`, `action`, `resourceType`, `from`, `to`.

## UI

- `/configuracoes/auditoria` — admin-only.

## Regras

- Metadados passam por `redactSensitive`; sem passwords/tokens.
- Falha ao gravar audit **não** falha a operação principal.
- Retenção: indefinida neste cycle.
