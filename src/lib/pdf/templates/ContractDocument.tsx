import React from "react";
import { Document, Page, Text, View, StyleSheet } from "@react-pdf/renderer";
import type { ContractType } from "@prisma/client";
import { BASE_FONT_FAMILY, BASE_FONT_FAMILY_BOLD } from "@/lib/pdf/registerFonts";
import { formatBRL, formatDateLong, orDash } from "@/lib/pdf/format";
import { contractCopyFor, partyLabelsFor } from "@/lib/pdf/templates/clauses";
import type { ContractViewModel } from "@/lib/pdf/templates/types";

const styles = StyleSheet.create({
  page: {
    fontFamily: BASE_FONT_FAMILY,
    fontSize: 9.5,
    lineHeight: 1.5,
    color: "#1A1A1A",
    paddingTop: 42,
    paddingBottom: 56,
    paddingHorizontal: 48,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    borderBottomWidth: 1.5,
    borderBottomColor: "#0A0F0A",
    paddingBottom: 10,
    marginBottom: 14,
  },
  issuerName: { fontFamily: BASE_FONT_FAMILY_BOLD, fontSize: 13, color: "#0A0F0A" },
  issuerLine: { fontSize: 8.5, color: "#444" },
  headerRight: { alignItems: "flex-end" },
  docLabel: { fontFamily: BASE_FONT_FAMILY_BOLD, fontSize: 8, color: "#666", letterSpacing: 1 },
  docNumber: { fontFamily: BASE_FONT_FAMILY_BOLD, fontSize: 11, color: "#0A0F0A" },
  title: {
    fontFamily: BASE_FONT_FAMILY_BOLD,
    fontSize: 12,
    textAlign: "center",
    marginBottom: 12,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  sectionTitle: {
    fontFamily: BASE_FONT_FAMILY_BOLD,
    fontSize: 9.5,
    marginTop: 10,
    marginBottom: 4,
    color: "#0A0F0A",
    textTransform: "uppercase",
  },
  paragraph: { marginBottom: 6, textAlign: "justify" },
  partyBox: {
    borderWidth: 0.75,
    borderColor: "#CCC",
    borderRadius: 3,
    padding: 8,
    marginBottom: 6,
  },
  grid: { flexDirection: "row", flexWrap: "wrap" },
  cell: { width: "50%", marginBottom: 2 },
  cellFull: { width: "100%", marginBottom: 2 },
  label: { fontSize: 7.5, color: "#888", textTransform: "uppercase" },
  value: { fontSize: 9.5 },
  clause: { marginBottom: 5, textAlign: "justify" },
  draftBanner: {
    backgroundColor: "#FEF3C7",
    borderWidth: 0.75,
    borderColor: "#F59E0B",
    borderRadius: 3,
    padding: 5,
    marginBottom: 12,
  },
  draftText: { fontSize: 7.5, color: "#92400E" },
  signatures: { flexDirection: "row", justifyContent: "space-between", marginTop: 34 },
  signBlock: { width: "45%", alignItems: "center" },
  signLine: { borderTopWidth: 0.75, borderTopColor: "#333", width: "100%", marginBottom: 3, paddingTop: 3 },
  signName: { fontFamily: BASE_FONT_FAMILY_BOLD, fontSize: 8.5, textAlign: "center" },
  signRole: { fontSize: 7.5, color: "#666", textAlign: "center" },
  witnessRow: { flexDirection: "row", justifyContent: "space-between", marginTop: 24 },
  footer: {
    position: "absolute",
    bottom: 24,
    left: 48,
    right: 48,
    textAlign: "center",
    fontSize: 7,
    color: "#999",
    borderTopWidth: 0.5,
    borderTopColor: "#DDD",
    paddingTop: 4,
  },
});

function Field({ label, value, full }: { label: string; value: string; full?: boolean }) {
  return (
    <View style={full ? styles.cellFull : styles.cell}>
      <Text style={styles.label}>{label}</Text>
      <Text style={styles.value}>{value}</Text>
    </View>
  );
}

export function ContractDocument({
  vm,
  type,
}: {
  vm: ContractViewModel;
  type: ContractType;
}) {
  const copy = contractCopyFor(type);
  const roles = partyLabelsFor(type);
  const clauses = copy.clauses({ contractValue: vm.contractValue });
  const vehicleName = [vm.vehicle.brand, vm.vehicle.model, vm.vehicle.version]
    .filter(Boolean)
    .join(" ");
  const isLocacao = type === "locacao";

  return (
    <Document title={`Contrato ${vm.contractNumber}`} author={vm.issuer.companyName || "Lignum"} subject={copy.title}>
      <Page size="A4" style={styles.page} wrap>
        <View style={styles.header} fixed>
          <View>
            <Text style={styles.issuerName}>{orDash(vm.issuer.companyName)}</Text>
            <Text style={styles.issuerLine}>
              CNPJ: {orDash(vm.issuer.companyTaxId)}
              {vm.issuer.companyStateReg ? `  -  IE: ${vm.issuer.companyStateReg}` : ""}
            </Text>
            <Text style={styles.issuerLine}>
              {[vm.issuer.companyAddress, vm.issuer.companyCity, vm.issuer.companyState]
                .filter(Boolean)
                .join(", ") || "-"}
              {vm.issuer.companyZip ? `  -  CEP ${vm.issuer.companyZip}` : ""}
            </Text>
            <Text style={styles.issuerLine}>
              {[vm.issuer.companyPhone, vm.issuer.companyEmail].filter(Boolean).join("  -  ") || "-"}
            </Text>
          </View>
          <View style={styles.headerRight}>
            <Text style={styles.docLabel}>CONTRATO No</Text>
            <Text style={styles.docNumber}>{vm.contractNumber}</Text>
          </View>
        </View>

        <Text style={styles.title}>{copy.title}</Text>

        <View style={styles.draftBanner}>
          <Text style={styles.draftText}>
            MODELO PROVISORIO (RASCUNHO) - As clausulas abaixo sao um modelo de referencia e devem
            ser revisadas e validadas juridicamente antes de uso oficial.
          </Text>
        </View>

        <Text style={styles.paragraph}>{copy.intro({ contractValue: vm.contractValue })}</Text>

        <Text style={styles.sectionTitle}>{roles.issuer}</Text>
        <View style={styles.partyBox}>
          <View style={styles.grid}>
            <Field label="Razao social" value={orDash(vm.issuer.companyName)} />
            <Field label="CNPJ" value={orDash(vm.issuer.companyTaxId)} />
            <Field
              label="Endereco"
              value={[vm.issuer.companyAddress, vm.issuer.companyCity, vm.issuer.companyState]
                .filter(Boolean)
                .join(", ") || "-"}
              full
            />
          </View>
        </View>

        <Text style={styles.sectionTitle}>{roles.client}</Text>
        <View style={styles.partyBox}>
          <View style={styles.grid}>
            <Field label="Nome / Razao social" value={orDash(vm.client.fullName)} />
            <Field label="CPF / CNPJ" value={orDash(vm.client.document)} />
            <Field label="RG / Insc." value={orDash(vm.client.rg)} />
            <Field label="Telefone" value={orDash(vm.client.phone)} />
            <Field
              label="Endereco"
              value={[vm.client.address, vm.client.city].filter(Boolean).join(", ") || "-"}
              full
            />
          </View>
        </View>

        <Text style={styles.sectionTitle}>{isLocacao ? "Objeto - Veiculo locado" : "Objeto - Veiculo"}</Text>
        <View style={styles.partyBox}>
          <View style={styles.grid}>
            <Field label="Veiculo" value={orDash(vehicleName)} />
            <Field label="Ano fab./mod." value={`${vm.vehicle.yearManufacture}/${vm.vehicle.yearModel}`} />
            <Field label="Placa" value={orDash(vm.vehicle.plate)} />
            <Field label="Cor" value={orDash(vm.vehicle.color)} />
            <Field label="RENAVAM" value={orDash(vm.vehicle.renavam)} />
            <Field label="Chassi" value={orDash(vm.vehicle.chassis)} />
            <Field
              label="Quilometragem"
              value={vm.vehicle.mileage != null ? `${vm.vehicle.mileage.toLocaleString("pt-BR")} km` : "-"}
            />
            <Field label={isLocacao ? "Valor da locacao" : "Valor"} value={formatBRL(vm.contractValue)} />
          </View>
        </View>

        <Text style={styles.sectionTitle}>Clausulas</Text>
        {clauses.map((c, i) => (
          <Text key={i} style={styles.clause}>
            {c}
          </Text>
        ))}

        {vm.specialClauses?.trim() ? (
          <>
            <Text style={styles.sectionTitle}>Clausulas especiais</Text>
            <Text style={styles.paragraph}>{vm.specialClauses.trim()}</Text>
          </>
        ) : null}

        <Text style={[styles.paragraph, { marginTop: 8 }]}>
          E, por estarem assim justas e contratadas, as partes assinam o presente instrumento em duas
          vias de igual teor, na presenca das testemunhas abaixo.
        </Text>

        <Text style={[styles.paragraph, { marginTop: 6 }]}>
          {orDash(vm.issuer.companyCity)}, {formatDateLong(vm.contractDate)}.
        </Text>

        <View style={styles.signatures} wrap={false}>
          <View style={styles.signBlock}>
            <View style={styles.signLine} />
            <Text style={styles.signName}>{orDash(vm.issuer.companyName)}</Text>
            <Text style={styles.signRole}>{roles.issuer}</Text>
          </View>
          <View style={styles.signBlock}>
            <View style={styles.signLine} />
            <Text style={styles.signName}>{orDash(vm.client.fullName)}</Text>
            <Text style={styles.signRole}>{roles.client}</Text>
          </View>
        </View>

        <View style={styles.witnessRow} wrap={false}>
          <View style={styles.signBlock}>
            <View style={styles.signLine} />
            <Text style={styles.signName}>{orDash(vm.witnesses[0]?.name)}</Text>
            <Text style={styles.signRole}>
              Testemunha 1{vm.witnesses[0]?.document ? ` - ${vm.witnesses[0]?.document}` : ""}
            </Text>
          </View>
          <View style={styles.signBlock}>
            <View style={styles.signLine} />
            <Text style={styles.signName}>{orDash(vm.witnesses[1]?.name)}</Text>
            <Text style={styles.signRole}>
              Testemunha 2{vm.witnesses[1]?.document ? ` - ${vm.witnesses[1]?.document}` : ""}
            </Text>
          </View>
        </View>

        <Text
          style={styles.footer}
          fixed
          render={({ pageNumber, totalPages }) =>
            `${vm.issuer.companyName || "Lignum"} - Contrato ${vm.contractNumber} - Pagina ${pageNumber} de ${totalPages}`
          }
        />
      </Page>
    </Document>
  );
}
