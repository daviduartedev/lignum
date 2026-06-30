import React from "react";
import { Document, Page, Text, View, StyleSheet } from "@react-pdf/renderer";
import { BASE_FONT_FAMILY, BASE_FONT_FAMILY_BOLD } from "@/lib/pdf/registerFonts";
import { formatDateLong, orDash } from "@/lib/pdf/format";
import type { TechnicalSheetPdfViewModel } from "@/lib/pdf/templates/types";

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
  colSku: { width: "18%" },
  colDesc: { width: "42%" },
  colQty: { width: "15%", textAlign: "right" },
  colUnit: { width: "10%" },
  colCat: { width: "15%" },
});

export function TechnicalSheetDocument({ vm }: { vm: TechnicalSheetPdfViewModel }) {
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <View>
            <Text style={styles.issuerName}>{vm.issuer.companyName}</Text>
            <Text>CNPJ: {orDash(vm.issuer.companyTaxId)}</Text>
          </View>
          <View>
            <Text style={styles.issuerName}>{vm.sheetNumber}</Text>
            <Text>Orçamento: {vm.quoteNumber}</Text>
            <Text>Data: {formatDateLong(vm.sheetDate)}</Text>
          </View>
        </View>

        <Text style={styles.title}>Ficha técnica · lista de materiais (BOM)</Text>

        <Text style={styles.sectionTitle}>Cliente</Text>
        <Text>{vm.clientName}</Text>

        <Text style={styles.sectionTitle}>Especificação</Text>
        <Text>
          {vm.lengthM} m × {vm.widthM} m × {vm.heightM} m · {vm.coverStyle}
        </Text>

        <Text style={styles.sectionTitle}>Materiais</Text>
        <View style={styles.tableHeader}>
          <Text style={styles.colSku}>SKU</Text>
          <Text style={styles.colDesc}>Descrição</Text>
          <Text style={styles.colQty}>Qtd</Text>
          <Text style={styles.colUnit}>Un</Text>
          <Text style={styles.colCat}>Categoria</Text>
        </View>
        {vm.lines.map((line, i) => (
          <View key={i} style={styles.tableRow}>
            <Text style={styles.colSku}>{line.sku}</Text>
            <Text style={styles.colDesc}>{line.description}</Text>
            <Text style={styles.colQty}>{line.quantity}</Text>
            <Text style={styles.colUnit}>{line.unit}</Text>
            <Text style={styles.colCat}>{line.category}</Text>
          </View>
        ))}

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
