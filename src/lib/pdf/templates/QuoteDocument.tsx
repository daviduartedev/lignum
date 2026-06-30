import React from "react";
import { Document, Page, Text, View, StyleSheet } from "@react-pdf/renderer";
import { BASE_FONT_FAMILY, BASE_FONT_FAMILY_BOLD } from "@/lib/pdf/registerFonts";
import { formatBRL, formatDateLong, orDash } from "@/lib/pdf/format";
import type { QuotePdfViewModel } from "@/lib/pdf/templates/types";

const styles = StyleSheet.create({
  page: {
    fontFamily: BASE_FONT_FAMILY,
    fontSize: 9.5,
    lineHeight: 1.45,
    color: "#1A1A1A",
    paddingTop: 42,
    paddingBottom: 56,
    paddingHorizontal: 48,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    borderBottomWidth: 1.5,
    borderBottomColor: "#002392",
    paddingBottom: 10,
    marginBottom: 14,
  },
  issuerName: { fontFamily: BASE_FONT_FAMILY_BOLD, fontSize: 13, color: "#002392" },
  issuerLine: { fontSize: 8.5, color: "#444" },
  docLabel: { fontFamily: BASE_FONT_FAMILY_BOLD, fontSize: 8, color: "#666" },
  title: {
    fontFamily: BASE_FONT_FAMILY_BOLD,
    fontSize: 12,
    textAlign: "center",
    marginBottom: 12,
    textTransform: "uppercase",
  },
  sectionTitle: {
    fontFamily: BASE_FONT_FAMILY_BOLD,
    fontSize: 9.5,
    marginTop: 8,
    marginBottom: 4,
    color: "#002392",
  },
  tableHeader: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: "#CCC",
    paddingBottom: 4,
    marginBottom: 4,
    fontFamily: BASE_FONT_FAMILY_BOLD,
    fontSize: 8,
  },
  tableRow: { flexDirection: "row", marginBottom: 3, fontSize: 8.5 },
  colDesc: { width: "45%" },
  colQty: { width: "12%", textAlign: "right" },
  colUnit: { width: "13%", textAlign: "right" },
  colTotal: { width: "15%", textAlign: "right" },
  totals: { marginTop: 10, alignItems: "flex-end" },
  totalLine: { flexDirection: "row", width: 180, justifyContent: "space-between", marginBottom: 2 },
  totalBold: { fontFamily: BASE_FONT_FAMILY_BOLD, fontSize: 11 },
});

export function QuoteDocument({ vm }: { vm: QuotePdfViewModel }) {
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <View>
            <Text style={styles.issuerName}>{vm.issuer.companyName}</Text>
            <Text style={styles.issuerLine}>CNPJ: {orDash(vm.issuer.companyTaxId)}</Text>
            <Text style={styles.issuerLine}>{orDash(vm.issuer.companyAddress)}</Text>
            <Text style={styles.issuerLine}>
              {orDash(vm.issuer.companyCity)} · {orDash(vm.issuer.companyState)} · CEP {orDash(vm.issuer.companyZip)}
            </Text>
            <Text style={styles.issuerLine}>
              Tel: {orDash(vm.issuer.companyPhone)} · {orDash(vm.issuer.companyEmail)}
            </Text>
          </View>
          <View>
            <Text style={styles.docLabel}>ORÇAMENTO</Text>
            <Text style={styles.issuerName}>{vm.quoteNumber}</Text>
            <Text style={styles.issuerLine}>Data: {formatDateLong(vm.quoteDate)}</Text>
            {vm.validUntil ? (
              <Text style={styles.issuerLine}>Validade: {formatDateLong(vm.validUntil)}</Text>
            ) : null}
          </View>
        </View>

        <Text style={styles.title}>Proposta comercial de carroceria</Text>

        <Text style={styles.sectionTitle}>Cliente</Text>
        <Text>{vm.clientName}</Text>
        <Text>CPF/CNPJ: {orDash(vm.clientDocument)}</Text>
        <Text>{orDash(vm.clientEmail)}</Text>

        <Text style={styles.sectionTitle}>Especificação</Text>
        <Text>
          Dimensões: {vm.lengthM} m × {vm.widthM} m × {vm.heightM} m
        </Text>
        <Text>Tampa: {vm.coverStyle}</Text>
        <Text>Assoalho: {vm.floorType}</Text>
        <Text>Acabamento: {vm.finishType}</Text>

        <Text style={styles.sectionTitle}>Itens</Text>
        <View style={styles.tableHeader}>
          <Text style={styles.colDesc}>Descrição</Text>
          <Text style={styles.colQty}>Qtd</Text>
          <Text style={styles.colUnit}>Unit.</Text>
          <Text style={styles.colTotal}>Total</Text>
        </View>
        {vm.items.map((item, i) => (
          <View key={i} style={styles.tableRow}>
            <Text style={styles.colDesc}>{item.description}</Text>
            <Text style={styles.colQty}>{item.quantity}</Text>
            <Text style={styles.colUnit}>{formatBRL(item.unitPrice)}</Text>
            <Text style={styles.colTotal}>{formatBRL(item.totalPrice)}</Text>
          </View>
        ))}

        <View style={styles.totals}>
          <View style={styles.totalLine}>
            <Text>Subtotal</Text>
            <Text>{formatBRL(vm.subtotal)}</Text>
          </View>
          {vm.discount > 0 ? (
            <View style={styles.totalLine}>
              <Text>Desconto</Text>
              <Text>- {formatBRL(vm.discount)}</Text>
            </View>
          ) : null}
          <View style={styles.totalLine}>
            <Text style={styles.totalBold}>Total</Text>
            <Text style={styles.totalBold}>{formatBRL(vm.total)}</Text>
          </View>
        </View>

        {vm.paymentTerms ? (
          <>
            <Text style={styles.sectionTitle}>Condições de pagamento</Text>
            <Text>{vm.paymentTerms}</Text>
          </>
        ) : null}
        {vm.deliveryDays != null ? (
          <Text>Prazo de entrega: {vm.deliveryDays} dias úteis</Text>
        ) : null}
        {vm.notes ? (
          <>
            <Text style={styles.sectionTitle}>Observações</Text>
            <Text>{vm.notes}</Text>
          </>
        ) : null}
      </Page>
    </Document>
  );
}
