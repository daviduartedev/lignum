import { MainShell } from "./MainShell";

export default async function Page({ params }: { params: Promise<{ slug?: string[] }> }) {
  const { slug } = await params;
  return <MainShell slug={slug} />;
}
