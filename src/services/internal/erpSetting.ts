import { apiFetch } from "@/lib/apiClient";
import { flatToErpPutBody, mapErpApiRowToFlat, type ErpSettingFlat } from "@/lib/erpSettingDefaults";

export async function fetchErpSetting(): Promise<ErpSettingFlat> {
  const row = await apiFetch<Record<string, unknown>>("/api/erp-setting");
  return mapErpApiRowToFlat(row);
}

export async function saveErpSetting(flat: ErpSettingFlat): Promise<ErpSettingFlat> {
  const row = await apiFetch<Record<string, unknown>>("/api/erp-setting", {
    method: "PUT",
    body: JSON.stringify(flatToErpPutBody(flat)),
  });
  return mapErpApiRowToFlat(row);
}
