# Feature: Suppliers

Fornecedores (oficinas, revendas, peças).

## Modelo

`Supplier` — `companyName`, `document?`, `phone?`, `email?`, `notes?`, campos estruturados de endereço (`street`, `streetNumber`, `addressComplement`, `neighborhood`, `city`, `zipCode`, `state`, `address?`).

- **`registrationStatus?`**: situação cadastral CNPJ, preenchida por consulta externa quando disponível.

## Consulta CNPJ

- Formulário em `FornecedoresPanel`: botão **Consultar CNPJ** → `POST /api/document-lookup` com `context: "supplier"`.
- Autofill preenche campos estruturados + `registrationStatus`; **só campos vazios**.

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
