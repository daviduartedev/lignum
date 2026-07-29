import fs from "fs";
import path from "path";

const commercial = [
  "clients/route.ts",
  "clients/[id]/route.ts",
  "sales/route.ts",
  "sales/[id]/route.ts",
  "contracts/route.ts",
  "contracts/[id]/route.ts",
  "contracts/[id]/pdf/route.ts",
  "suppliers/route.ts",
  "suppliers/[id]/route.ts",
  "warranties/route.ts",
  "warranties/[id]/route.ts",
  "warranties/summary/route.ts",
  "evaluations/route.ts",
  "evaluations/[id]/route.ts",
  "purchase-evaluations/route.ts",
  "purchase-evaluations/[id]/route.ts",
  "client-documents/route.ts",
  "client-documents/[id]/route.ts",
  "vehicles/route.ts",
  "vehicles/[id]/route.ts",
  "vehicles/[id]/confirm-purchase/route.ts",
  "leads/route.ts",
  "leads/[id]/route.ts",
  "crm-summary/route.ts",
  "dashboard/summary/route.ts",
  "senatran/lookup/route.ts",
  "upload/route.ts",
  "inbox/stock-attention/route.ts",
  "sellers/route.ts",
];

const finance = [
  "payables/route.ts",
  "payables/[id]/route.ts",
  "promissory-notes/route.ts",
  "promissory-notes/[id]/route.ts",
  "promissory-notes/summary/route.ts",
  "finance/dispatch-notifications/route.ts",
];

const production = ["service-orders/route.ts", "service-orders/[id]/route.ts"];

const readOnly = [
  "user-notifications/route.ts",
  "user-notifications/[id]/route.ts",
  "user-notifications/summary/route.ts",
  "inbox/summary/route.ts",
  "user/inbox-preferences/route.ts",
  "erp-setting/route.ts",
];

function patch(file, importLine, getRole, mutRole) {
  const p = path.join("src/app/api", file);
  if (!fs.existsSync(p)) {
    console.log("skip", file);
    return;
  }
  let c = fs.readFileSync(p, "utf8");
  if (!c.includes("staffRoles")) {
    console.log("no staffRoles", file);
    return;
  }
  c = c.replace(/import \{ staffRoles \} from "@\/lib\/apiRoles";/, importLine);
  c = c.replace(/withRole\(staffRoles,/g, `withRole(${getRole},`);
  if (mutRole && mutRole !== getRole) {
    c = c.replace(/export const POST = withRole\([^,]+,/g, `export const POST = withRole(${mutRole},`);
    c = c.replace(/export const PUT = withRole\([^,]+,/g, `export const PUT = withRole(${mutRole},`);
    c = c.replace(/export const PATCH = withRole\([^,]+,/g, `export const PATCH = withRole(${mutRole},`);
    c = c.replace(/export const DELETE = withRole\([^,]+,/g, `export const DELETE = withRole(${mutRole},`);
  }
  fs.writeFileSync(p, c);
  console.log("patched", file);
}

for (const f of commercial) {
  patch(
    f,
    'import { allStaffReadRoles, commercialWriteRoles } from "@/lib/apiRoles";',
    "allStaffReadRoles",
    "commercialWriteRoles",
  );
}
for (const f of finance) {
  patch(
    f,
    'import { allStaffReadRoles, financeWriteRoles } from "@/lib/apiRoles";',
    "allStaffReadRoles",
    "financeWriteRoles",
  );
}
for (const f of production) {
  patch(
    f,
    'import { allStaffReadRoles, productionWriteRoles } from "@/lib/apiRoles";',
    "allStaffReadRoles",
    "productionWriteRoles",
  );
}

for (const f of readOnly) {
  if (f.includes("inbox-preferences") || f.includes("user-notifications")) {
    patch(
      f,
      'import { allStaffReadRoles, staffPreferencesWriteRoles } from "@/lib/apiRoles";',
      "allStaffReadRoles",
      "staffPreferencesWriteRoles",
    );
  } else if (f === "erp-setting/route.ts") {
    patch(f, 'import { allStaffReadRoles } from "@/lib/apiRoles";', "allStaffReadRoles", null);
  } else {
    patch(f, 'import { allStaffReadRoles } from "@/lib/apiRoles";', "allStaffReadRoles", null);
  }
}
