import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const supabase = await createClient();
  const { data } = await supabase
    .from("works")
    .select("title, description")
    .eq("id", id)
    .maybeSingle();

  if (!data) return {};

  return {
    title: data.title,
    description: data.description || undefined,
  };
}

export default function WorkDetailLayout({ children }: { children: React.ReactNode }) {
  return children;
}
