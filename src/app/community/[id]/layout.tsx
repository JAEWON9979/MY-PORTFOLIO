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
    .from("posts")
    .select("title")
    .eq("id", id)
    .maybeSingle();

  if (!data) return {};

  return {
    title: data.title,
  };
}

export default function CommunityDetailLayout({ children }: { children: React.ReactNode }) {
  return children;
}
