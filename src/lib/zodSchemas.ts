import {
  PayableOrigin,
  PayableStatus,
  PersonType,
  UsedBodyCondition,
  UsedBodyStatus,
  MaterialCategory,
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
  registrationStatus: z.string().optional(),
});
export const clientUpdateSchema = clientCreateSchema.partial();

const clientDocumentBaseSchema = z.object({
  documentId: z.string().optional(),
  title: zTitleNoHtml(500),
  notes: zTextNoHtmlOptional(16_000),
  externalUrl: zSafeHttpUrlOrEmpty().optional(),
  documentFileUrl: zSafeHttpUrlOrEmpty().optional(),
  clientId: z.number().int().positive(),
});

export const clientDocumentCreateSchema = clientDocumentBaseSchema.superRefine((data, ctx) => {
  const hasExternal = !!data.externalUrl?.trim();
  const hasFile = !!data.documentFileUrl?.trim();
  if (!hasExternal && !hasFile) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Informe um ficheiro ou URL externa do documento.",
      path: ["documentFileUrl"],
    });
  }
});
export const clientDocumentUpdateSchema = clientDocumentBaseSchema.partial();

export const payableInstallmentPlanSchema = z.object({
  totalInstallments: z.number().int().min(1).max(120),
  installmentAmount: zDecimal,
  firstDueDate: z.string().min(1),
  intervalMonths: z.number().int().min(1).max(12),
});

export const payableCreateSchema = z.object({
  documentId: z.string().optional(),
  origin: z.nativeEnum(PayableOrigin),
  description: zTextNoHtmlOptional(2000).default(""),
  dueDate: z.string().min(1),
  amount: zDecimal,
  status: z.nativeEnum(PayableStatus).optional(),
  paymentDate: z.string().optional().nullable(),
  notes: zTextNoHtmlOptional(16_000),
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
  registrationStatus: z.string().optional(),
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
  alertDocsEnabled: z.boolean().optional(),
  alertEmailDigestEnabled: z.boolean().optional(),
  financeEventNotifyDaysBefore: z.number().int().min(0).max(30).optional(),
  inboxPreEventPopupMinutes: z.number().int().min(1).max(1440).optional(),
  quotePricingJson: z.record(z.string(), z.unknown()).optional(),
});

const quoteParamSchema = z.object({
  lengthM: z.number().positive().max(30),
  widthM: z.number().positive().max(5),
  heightM: z.number().positive().max(4),
  coverStyle: z.enum(["tampa_plana", "tampa_arqueada", "tampa_basculante"]),
  floorType: z.enum(["assoalho_madeira", "assoalho_aco", "assoalho_aluminio"]),
  finishType: z.enum(["pintura", "verniz", "lamina_natural"]),
  options: z.array(z.string().max(64)).max(20).optional(),
  discount: z.number().min(0).optional(),
});

export const quoteCalculateSchema = quoteParamSchema.extend({
  bodyModelId: z.number().int().positive().optional(),
  basePrice: z.number().min(0).optional(),
  pricePerM2: z.number().min(0).optional(),
});

export const quoteCreateSchema = quoteParamSchema.extend({
  documentId: z.string().optional(),
  clientId: z.number().int().positive(),
  bodyModelId: z.number().int().positive().optional(),
  status: z.enum(["rascunho", "enviado"]).optional(),
  paymentTerms: z.string().max(500).optional(),
  deliveryDays: z.number().int().min(0).max(365).optional(),
  notes: z.string().max(5000).optional(),
  validUntil: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
});

export const quoteUpdateSchema = quoteParamSchema
  .partial()
  .extend({
    clientId: z.number().int().positive().optional(),
    bodyModelId: z.number().int().positive().optional().nullable(),
    status: z.enum(["rascunho", "enviado", "aprovado", "cancelado"]).optional(),
    paymentTerms: z.string().max(500).optional().nullable(),
    deliveryDays: z.number().int().min(0).max(365).optional().nullable(),
    notes: z.string().max(5000).optional().nullable(),
    validUntil: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional().nullable(),
  })
  .refine((data) => Object.keys(data).length > 0, { message: "Nenhum campo para actualizar." });

export type QuoteCreateInput = z.infer<typeof quoteCreateSchema>;
export type QuoteUpdateInput = z.infer<typeof quoteUpdateSchema>;

export const bodyModelCreateSchema = z.object({
  documentId: z.string().optional(),
  name: z.string().min(1).max(255),
  description: z.string().max(2000).optional(),
  basePrice: z.number().min(0),
  pricePerM2: z.number().min(0).optional(),
  active: z.boolean().optional(),
});

export const bodyModelUpdateSchema = bodyModelCreateSchema
  .partial()
  .refine((data) => Object.keys(data).length > 0, { message: "Nenhum campo para actualizar." });

export const userInboxPreferencesBodySchema = z.object({
  showDashboardAttentionStripe: z.boolean(),
  financeEventNotifyDaysBeforeOverride: z.number().int().min(0).max(30).optional().nullable(),
});

export const lignumRoleSchema = z.enum(["admin", "vendedor", "financeiro", "producao", "read_only"]);

/** Criação de usuário por administrador (`POST /api/auth/register`). */
export const adminUserCreateSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  name: zTextNoHtmlOptional(255),
  role: lignumRoleSchema,
  lgpdConsentVersion: z.literal(POLICY_PRIVACY_VERSION),
});

/** Actualização de usuário por administrador (`PATCH /api/users/[id]`). */
export const adminUserPatchSchema = z
  .object({
    name: zTextNoHtmlOptional(255),
    role: lignumRoleSchema,
    isActive: z.boolean(),
  })
  .refine((data) => Object.keys(data).length > 0, { message: "Nenhum campo para actualizar." });

export const adminUserResetPasswordSchema = z.object({
  password: z.string().min(8),
});

export const sellerCreateSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  name: zTitleNoHtml(255),
});

const usedBodyFields = z.object({
  documentId: z.string().optional(),
  title: zTitleNoHtml(255),
  lengthM: zDecimal,
  widthM: zDecimal,
  heightM: zDecimal.optional().nullable(),
  condition: z.nativeEnum(UsedBodyCondition),
  entryValue: zDecimal,
  saleValue: zDecimal.optional().nullable(),
  status: z.nativeEnum(UsedBodyStatus).optional(),
  observations: zTextNoHtmlOptional(8000),
  mainPhotoUrl: zSafeHttpUrlOrEmpty().optional(),
  galleryUrls: zSafeHttpUrlArrayOptional(),
  supplierId: z.number().int().positive().optional().nullable(),
});

export const usedBodyCreateSchema = usedBodyFields.extend({
  status: z.nativeEnum(UsedBodyStatus).optional().default("disponivel"),
});

export const usedBodyUpdateSchema = usedBodyFields.partial();

export const usedBodyStatusChangeSchema = z.object({
  status: z.nativeEnum(UsedBodyStatus),
  notes: zTextNoHtmlOptional(2000),
});

export const materialCreateSchema = z.object({
  documentId: z.string().optional(),
  sku: z.string().min(1).max(32).regex(/^[A-Z0-9-]+$/i, "SKU inválido."),
  name: zTitleNoHtml(255),
  category: z.nativeEnum(MaterialCategory),
  unit: z.string().min(1).max(16),
  minStock: zDecimal.optional().default(0),
  avgCost: zDecimal.optional().default(0),
  supplierId: z.number().int().positive().optional().nullable(),
});

export const materialUpdateSchema = materialCreateSchema.partial().omit({ sku: true });

export const stockMovementCreateSchema = z
  .object({
    materialId: z.number().int().positive(),
    type: z.enum(["entrada", "saida"]),
    quantity: zDecimal,
    unitCost: zDecimal.optional(),
    notes: zTextNoHtmlOptional(2000),
  })
  .superRefine((data, ctx) => {
    if (Number(data.quantity) <= 0) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Quantidade deve ser positiva.", path: ["quantity"] });
    }
    if (data.type === "entrada" && data.unitCost != null && Number(data.unitCost) < 0) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Custo unitário inválido.", path: ["unitCost"] });
    }
  });

export const productionOrderUpdateSchema = z.object({
  notes: zTextNoHtmlOptional(8000),
  photoUrls: zSafeHttpUrlArrayOptional(),
  employeeIds: z.array(z.number().int().positive()).optional(),
});

export const employeeCreateSchema = z.object({
  documentId: z.string().optional(),
  name: zTitleNoHtml(255),
  roleTitle: zTitleNoHtml(120),
  commissionPct: zDecimal.optional().nullable(),
  isActive: z.boolean().optional().default(true),
  userId: z.number().int().positive().optional().nullable(),
});

export const employeeUpdateSchema = employeeCreateSchema.partial();
