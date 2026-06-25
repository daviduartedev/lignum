import { redirect } from "next/navigation";

export default function PromissoriasPage() {
  redirect("/financeiro?tab=receber");
}
