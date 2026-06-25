import {
  ContractStatus,
  ContractType,
  FuelType,
  PaymentMethod,
  PayableOrigin,
  PayableStatus,
  PersonType,
  PromissoryNoteStatus,
  PurchaseEvaluationOutcome,
  PurchaseEvaluationReason,
  ServiceOrderStatus,
  ServiceOrderType,
  TransmissionType,
  VehicleCautelar,
  VehicleCategoryKind,
  VehicleLegalSituation,
  VehicleStatus,
  WarrantyStatus,
  WarrantyType,
} from "@prisma/client";
import { z } from "zod";
import { zDecimal } from "@/lib/decimal";
import { POLICY_PRIVACY_VERSION } from "@/lib/lgpdPolicyMeta";
import {
  zSafeHttpUrlArrayOptional,
  zSafeHttpUrlOrEmpty,
  zTextNoHtmlBounded,
  zTextNoHtmlOptional,
  zTitleNoHtml,
} from "@/lib/zodHelpers";
import { isValidChassis } from "@/lib/senatran/normalize";

const partLine = z.object({
  descricao: zTextNoHtmlBounded(2000),
  quantidade: z.number(),
  valor_unit: z.number(),
  valor_total: z.number(),
});

const laborLine = z.object({
  descricao: zTextNoHtmlBounded(2000),
  horas: z.number(),
  valor_hora: z.number(),
  valor_total: z.number(),
});

export const vehicleCreateSchema = z.object({
  documentId: z.string().optional(),
  plate: z.string().min(1),
  brand: z.string().min(1),
  model: z.string().min(1),
  version: z.string().optional(),
  yearManufacture: z.number().int().optional().default(() => new Date().getFullYear()),
  yearModel: z.number().int().optional().default(() => new Date().getFullYear()),
  mileage: z.number().int().optional().default(0),
  color: z.string().optional(),
  fuel: z.nativeEnum(FuelType).optional(),
  transmission: z.nativeEnum(TransmissionType).optional(),
  fipePrice: zDecimal.optional(),
  purchasePrice: zDecimal.optional().default(0),
  estimatedMaintenanceCost: zDecimal.optional(),
  sellingPrice: zDecimal.optional(),
  minimumSellingPrice: zDecimal.optional(),
  status: z.nativeEnum(VehicleStatus),
  observations: zTextNoHtmlOptional(32_000),
  mainPhotoUrl: zSafeHttpUrlOrEmpty().optional(),
  galleryUrls: zSafeHttpUrlArrayOptional(),
  attachmentUrls: zSafeHttpUrlArrayOptional(),
  buyerId: z.number().int().positive().optional().nullable(),
  doorsCount: z.union([z.literal(2), z.literal(4)]).optional().nullable(),
  lastLicensingDate: z.string().optional().nullable(),
  purchaseEntryAt: z.string().optional().nullable(),
  purchaseEntryMileage: z.number().int().min(0).optional().nullable(),
  purchaseSupplierId: z.number().int().positive().optional().nullable(),
  purchasePaymentJson: z.unknown().optional().nullable(),
  renavam: z.union([z.literal(""), z.string().regex(/^\d{9,11}$/)]).optional().default(""),
  chassis: z
    .string()
    .optional()
    .default("")
    .refine((s) => !s || (s.length === 17 && isValidChassis(s)), { message: "Chassi inválido (17 caracteres, sem I, O nem Q)." }),
  legalSituation: z.nativeEnum(VehicleLegalSituation),
  categoryKind: z.nativeEnum(VehicleCategoryKind),
  cautelar: z.nativeEnum(VehicleCautelar),
  speciesCategory: z.string().optional(),
  registrationCity: z.string().optional(),
  registrationUf: z.string().max(2).optional(),
  listingTitle: z.string().optional(),
  showInStorefront: z.boolean().optional(),
  officialExtraFields: z.record(z.string(), z.string()).optional(),
  senatranFieldProvenance: z.record(z.string(), z.enum(["senatran", "manual"])).optional(),
});
export const vehicleUpdateSchema = vehicleCreateSchema.partial();

/** Restaurar veículo removido (apenas admin na rota). */
export const vehicleRestoreSchema = z.object({
  status: z.nativeEnum(VehicleStatus),
});

export const clientCreateSchema = z.object({
  documentId: z.string().optional(),
  fullName: zTitleNoHtml(255),
  document: z.string().min(1),
  personType: z.nativeEnum(PersonType).optional().nullable(),
  email: z.string().email(),
  phone: z.string().optional(),
  address: zTextNoHtmlOptional(2000),
  rg: z.string().optional(),
  maritalStatus: z.string().optional(),
  profession: z.string().optional(),
  zipCode: z.string().optional(),
  nationality: z.string().optional(),
  neighborhood: z.string().optional(),
  street: z.string().optional(),
  city: z.string().optional(),
  streetNumber: z.string().optional(),
  addressComplement: z.string().optional(),
  birthDate: z.string().optional().nullable(),
});
export const clientUpdateSchema = clientCreateSchema.partial();

export const clientDocumentCreateSchema = z.object({
  documentId: z.string().optional(),
  title: zTitleNoHtml(500),
  notes: zTextNoHtmlOptional(16_000),
  externalUrl: zSafeHttpUrlOrEmpty().optional(),
  documentFileUrl: zSafeHttpUrlOrEmpty().optional(),
  clientId: z.number().int().positive(),
});
export const clientDocumentUpdateSchema = clientDocumentCreateSchema.partial();

export const promissoryPlanSchema = z.object({
  totalInstallments: z.number().int().min(1).max(120),
  installmentAmount: zDecimal,
  firstDueDate: z.string().min(1),
  intervalMonths: z.number().int().min(1).max(12),
});

export const payableInstallmentPlanSchema = z.object({
  totalInstallments: z.number().int().min(1).max(120),
  installmentAmount: zDecimal,
  firstDueDate: z.string().min(1),
  intervalMonths: z.number().int().min(1).max(12),
});

const saleCreateBaseSchema = z.object({
  documentId: z.string().optional(),
  saleDate: z.string().min(1),
  finalPrice: zDecimal,
  paymentMethod: z.nativeEnum(PaymentMethod).optional(),
  financingBank: zTextNoHtmlOptional(255),
  notes: zTextNoHtmlOptional(16_000),
  vehicleId: z.number().int().positive(),
  clientId: z.number().int().positive(),
  sellerUserId: z.number().int().positive().optional(),
  sellerName: zTitleNoHtml(255).optional(),
  promissoryPlan: promissoryPlanSchema.optional(),
});

export const saleCreateSchema = saleCreateBaseSchema.superRefine((data, ctx) => {
  if (data.paymentMethod === PaymentMethod.promissoria && !data.promissoryPlan) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Informe o plano de promissória (parcelas e vencimentos).",
      path: ["promissoryPlan"],
    });
  }
});
export const saleUpdateSchema = saleCreateBaseSchema.partial();

export const contractCreateSchema = z.object({
  documentId: z.string().optional(),
  contractType: z.nativeEnum(ContractType),
  contractValue: zDecimal,
  contractDate: z.string().min(1),
  status: z.nativeEnum(ContractStatus),
  specialClauses: zTextNoHtmlOptional(32_000),
  witness1Name: zTextNoHtmlOptional(255),
  witness1Document: z.string().optional(),
  witness2Name: zTextNoHtmlOptional(255),
  witness2Document: z.string().optional(),
  vehicleId: z.number().int().positive(),
  clientId: z.number().int().positive(),
});
export const contractUpdateSchema = contractCreateSchema.partial();

export const evaluationCreateSchema = z.object({
  documentId: z.string().optional(),
  score: z.number().optional(),
  observations: zTextNoHtmlOptional(32_000),
  technicalNotes: zTextNoHtmlOptional(32_000),
  checklistJson: z.unknown().nullable().optional(),
  photoUrls: zSafeHttpUrlArrayOptional(),
  vehicleId: z.number().int().positive(),
});
export const evaluationUpdateSchema = evaluationCreateSchema.partial();

const purchaseEvaluationBaseSchema = z.object({
  documentId: z.string().optional(),
  vehicleId: z.number().int().positive(),
  clientId: z.number().int().positive().optional().nullable(),
  outcome: z.nativeEnum(PurchaseEvaluationOutcome),
  reasonCode: z.nativeEnum(PurchaseEvaluationReason).optional().nullable(),
  reasonDetail: z
    .string()
    .max(8000)
    .nullable()
    .optional()
    .refine((s) => s === undefined || s === null || !/<\/?[a-zA-Z!]/.test(s), {
      message: "HTML não é permitido neste campo.",
    }),
});

export const purchaseEvaluationCreateSchema = purchaseEvaluationBaseSchema.superRefine((data, ctx) => {
  if (data.outcome === PurchaseEvaluationOutcome.nao_comprado && !data.reasonCode) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Selecione o motivo da não compra.",
      path: ["reasonCode"],
    });
  }
  if (data.reasonCode === PurchaseEvaluationReason.outro && !String(data.reasonDetail ?? "").trim()) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Descreva o motivo.",
      path: ["reasonDetail"],
    });
  }
});
export const purchaseEvaluationUpdateSchema = purchaseEvaluationBaseSchema.omit({ vehicleId: true }).partial();

export const serviceOrderCreateSchema = z.object({
  documentId: z.string().optional(),
  workshopName: zTitleNoHtml(255),
  serviceType: z.nativeEnum(ServiceOrderType),
  serviceTypeOtherText: zTextNoHtmlOptional(255),
  status: z.nativeEnum(ServiceOrderStatus),
  entryDate: z.string().min(1),
  dueDate: z.string().optional().nullable(),
  responsible: zTextNoHtmlOptional(255),
  description: zTextNoHtmlOptional(16_000),
  partsJson: z.array(partLine).nullable().optional(),
  laborJson: z.array(laborLine).nullable().optional(),
  totalAmount: zDecimal,
  photoUrls: zSafeHttpUrlArrayOptional(),
  vehicleId: z.number().int().positive(),
});
export const serviceOrderUpdateSchema = serviceOrderCreateSchema.partial();

export const warrantyCreateSchema = z.object({
  documentId: z.string().optional(),
  warrantyType: z.nativeEnum(WarrantyType),
  startDate: z.string().min(1),
  endDate: z.string().min(1),
  coverageValue: zDecimal,
  status: z.nativeEnum(WarrantyStatus),
  notes: zTextNoHtmlOptional(16_000),
  vehicleId: z.number().int().positive(),
  clientId: z.number().int().positive(),
});
export const warrantyUpdateSchema = warrantyCreateSchema.partial();

export const promissoryNoteCreateSchema = z.object({
  documentId: z.string().optional(),
  installmentNumber: z.number().int().positive(),
  totalInstallments: z.number().int().positive(),
  dueDate: z.string().min(1),
  amount: zDecimal,
  status: z.nativeEnum(PromissoryNoteStatus),
  paymentDate: z.string().optional().nullable(),
  notes: zTextNoHtmlOptional(16_000),
  clientId: z.number().int().positive(),
  vehicleId: z.number().int().positive(),
});
export const promissoryNoteUpdateSchema = promissoryNoteCreateSchema.partial();

export const payableCreateSchema = z.object({
  documentId: z.string().optional(),
  origin: z.nativeEnum(PayableOrigin),
  description: zTextNoHtmlOptional(2000).default(""),
  dueDate: z.string().min(1),
  amount: zDecimal,
  status: z.nativeEnum(PayableStatus).optional(),
  paymentDate: z.string().optional().nullable(),
  notes: zTextNoHtmlOptional(16_000),
  vehicleId: z.number().int().positive().optional().nullable(),
  supplierId: z.number().int().positive().optional().nullable(),
  installmentPlan: payableInstallmentPlanSchema.optional(),
});
export const payableUpdateSchema = payableCreateSchema.partial();

export const supplierCreateSchema = z.object({
  documentId: z.string().optional(),
  companyName: zTitleNoHtml(255),
  document: z.string().optional(),
  phone: z.string().optional(),
  email: z.union([z.string().email(), z.literal("")]).optional(),
  notes: zTextNoHtmlOptional(8000),
  zipCode: z.string().optional(),
  neighborhood: z.string().optional(),
  street: z.string().optional(),
  city: z.string().optional(),
  streetNumber: z.string().optional(),
  addressComplement: z.string().optional(),
});
export const supplierUpdateSchema = supplierCreateSchema.partial();

const HTMLISH = /<\/?[a-zA-Z!]/;

const userNotificationFields = z.object({
  documentId: z.string().optional(),
  title: z.string().min(1).max(500),
  body: z.string().min(1).max(32_000),
  read: z.boolean().optional(),
  link: z.string().max(2048).optional(),
  remindAt: z.string().optional().nullable(),
  ownerUserId: z.number().int().positive().optional(),
});

export const userNotificationCreateSchema = userNotificationFields.superRefine((val, ctx) => {
  if (HTMLISH.test(val.title)) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "HTML não é permitido neste campo.",
      path: ["title"],
    });
  }
  if (HTMLISH.test(val.body)) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "HTML não é permitido neste campo.",
      path: ["body"],
    });
  }
});

export const userNotificationUpdateSchema = userNotificationFields.partial().superRefine((val, ctx) => {
  if (val.title !== undefined && HTMLISH.test(val.title)) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "HTML não é permitido neste campo.",
      path: ["title"],
    });
  }
  if (val.body !== undefined && HTMLISH.test(val.body)) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "HTML não é permitido neste campo.",
      path: ["body"],
    });
  }
});

export const erpSettingUpdateSchema = z.object({
  companyName: z.string().optional(),
  companyTaxId: z.string().optional(),
  companyStateReg: z.string().optional(),
  companyAddress: z.string().optional(),
  companyCity: z.string().optional(),
  companyState: z.string().optional(),
  companyZip: z.string().optional(),
  companyPhone: z.string().optional(),
  companyEmail: z.union([z.string().email(), z.literal("")]).optional(),
  alertGiroEnabled: z.boolean().optional(),
  alertGiroWarnDays: z.number().int().optional(),
  alertGiroCritDays: z.number().int().optional(),
  alertPromEnabled: z.boolean().optional(),
  alertPromDaysBefore: z.number().int().optional(),
  alertDocsEnabled: z.boolean().optional(),
  alertEmailDigestEnabled: z.boolean().optional(),
  financeEventNotifyDaysBefore: z.number().int().min(0).max(30).optional(),
  inboxPreEventPopupMinutes: z.number().int().min(1).max(1440).optional(),
});

export const inboxStockActionSchema = z.object({
  vehicleId: z.number().int().positive(),
  action: z.enum(["dismiss", "snooze"]),
});

export const userInboxPreferencesBodySchema = z.object({
  showDashboardAttentionStripe: z.boolean(),
  financeEventNotifyDaysBeforeOverride: z.number().int().min(0).max(30).optional().nullable(),
});

/** Criação de usuário por administrador (`POST /api/auth/register`). */
export const adminUserCreateSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  name: zTextNoHtmlOptional(255),
  role: z.enum(["admin", "authenticated", "sales", "finance", "read_only"]),
  lgpdConsentVersion: z.literal(POLICY_PRIVACY_VERSION),
});

export const sellerCreateSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  name: zTitleNoHtml(255),
});
