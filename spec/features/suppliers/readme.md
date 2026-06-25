# Feature: Suppliers

Fornecedores (oficinas, revendas, peças).

## Modelo

`Supplier` — `companyName`, `document?`, `phone?`, `email?`, `notes?`.

## Endpoints (`withRole(staffRoles)`)

- `GET /api/suppliers?page&pageSize&q`
- `POST /api/suppliers`
- `GET /api/suppliers/[id]`
- `PUT /api/suppliers/[id]`
- `DELETE /api/suppliers/[id]`

## UI

- Aba dentro de `/clientes` (`FornecedoresPanel.tsx`).

## Notas

- Não possui relacionamentos no schema atual; exclusão livre.
