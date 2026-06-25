import { redirect } from "next/navigation";

export default function NovaPromissoriaPage() {
  redirect("/financeiro?tab=receber");
}
