import { redirect } from "next/navigation";

export default async function JoinPage({
  params,
  searchParams,
}: {
  params: Promise<{ code: string }>;
  searchParams: Promise<{ ref?: string }>;
}) {
  const { code } = await params;
  const { ref } = await searchParams;
  const qs = new URLSearchParams({ join: code });
  if (ref?.trim()) qs.set("ref", ref.trim());
  redirect(`/?${qs.toString()}`);
}
