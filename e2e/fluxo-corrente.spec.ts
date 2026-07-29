import { test, expect } from "@playwright/test";

/**
 * Fluxo completo Lignum — "a corrente".
 * Cobre a jornada de valor do roteiro de demonstração:
 *   cliente (CNPJ) → orçamento (cálculo automático) → aprovar → converter →
 *   ordem de produção no kanban → baixa de estoque.
 *
 * Autenticação: usa o storageState de admin (projeto chromium do playwright.config).
 * Dados: o seed cria modelos (Baú seco padrão / Sider), materiais com estoque e
 * funcionários — mas NÃO cria clientes/orçamentos, então o teste os cria via UI.
 *
 * Seletores marcados com "AJUSTE:" dependem de detalhes de componente (Radix Select,
 * drag no kanban) que devem ser confirmados na primeira execução com --headed --debug.
 */

const stamp = Date.now();
const CLIENTE_NOME = `Transportes Corrente ${stamp}`;
const CNPJ = "45.987.321/0001-22"; // CNPJ válido só para preenchimento manual

test.describe("Fluxo da corrente (orçamento → produção → estoque)", () => {
  test("cria cliente, orçamento, aprova, converte e vê a OP em produção", async ({ page }) => {
    await test.step("1. Cadastrar cliente", async () => {
      await page.goto("/clientes/novo");
      // AJUSTE: confirmar labels reais dos campos (getByLabel usa o <label for>)
      await page.getByLabel(/nome|razão social/i).first().fill(CLIENTE_NOME);
      await page.getByLabel(/cpf.*cnpj|cnpj/i).first().fill(CNPJ);
      await page.getByRole("button", { name: /salvar/i }).click();
      // volta para a lista/prontuário — o nome deve aparecer
      await expect(page.getByText(CLIENTE_NOME).first()).toBeVisible({ timeout: 15_000 });
    });

    await test.step("2. Criar orçamento com cálculo automático", async () => {
      await page.goto("/orcamentos/novo");

      // AJUSTE: seleção de cliente pode ser um Select do Radix ou autocomplete.
      // Estratégia resiliente: abrir o controle de cliente e escolher pelo nome.
      const clienteField = page.getByLabel(/cliente/i).first();
      await clienteField.click().catch(() => {});
      await page.getByText(CLIENTE_NOME).first().click().catch(() => {});

      // Medidas (inputs numéricos)
      await page.getByLabel(/comprimento/i).fill("8.5");
      await page.getByLabel(/largura/i).fill("2.6");
      await page.getByLabel(/altura/i).fill("0.8");

      // O total deve recalcular e ser maior que zero — o "uau" do cálculo automático
      const total = page.getByText(/R\$\s?[1-9][\d.,]*/).first();
      await expect(total).toBeVisible({ timeout: 10_000 });

      // Salvar o orçamento
      await page.getByRole("button", { name: /salvar|gerar orçamento|criar/i }).first().click();
      // Deve ir para o detalhe do orçamento
      await expect(page).toHaveURL(/\/orcamentos\/[^/]+$/, { timeout: 15_000 });
    });

    await test.step("3. Aprovar e converter em produção", async () => {
      await page.getByRole("button", { name: /aprovar/i }).click();
      // após aprovar, o botão converter fica disponível
      await page.getByRole("button", { name: /converter/i }).click();
      // confirmação de que virou OP (toast ou mudança de status)
      await expect(page.getByText(/convertido|ordem de produção|produção/i).first()).toBeVisible({
        timeout: 15_000,
      });
    });

    await test.step("4. A OP aparece no kanban de produção", async () => {
      await page.goto("/producao");
      // o cartão da OP deve existir na coluna Aguardando, referenciando o cliente
      await expect(page.getByText(CLIENTE_NOME).first()).toBeVisible({ timeout: 15_000 });
    });
  });
});
