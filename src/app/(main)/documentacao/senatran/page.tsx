import { PrintOrPdfToolbar } from "@/components/documentation/PrintOrPdfToolbar";
import { SenatranClienteDoc } from "@/components/documentation/SenatranClienteDoc";

export default function SenatranDocumentacaoPage() {
  return (
    <div className="max-w-3xl pb-12">
      <PrintOrPdfToolbar />
      <SenatranClienteDoc />
    </div>
  );
}
