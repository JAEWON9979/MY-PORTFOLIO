"use client";

import { useCallback, useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

export type WorkCategory = "수업과제" | "개인실습" | "팀프로젝트";
export type WorkFileType = "PDF" | "PPTX" | "DOCX" | "기타";

export interface Work {
  id: string;
  title: string;
  description: string;
  category: WorkCategory;
  techTags: string[];
  fileType: WorkFileType;
  linkUrl: string;
  fileName: string | null;
  fileSize: number | null;
  date: string;
  isPublic: boolean;
  fileIsPublic: boolean;
}

export type WorkInput = Omit<Work, "id">;

interface WorkRow {
  id: string;
  title: string;
  description: string;
  category: WorkCategory;
  tech_tags: string[];
  file_type: WorkFileType;
  link_url: string;
  file_name: string | null;
  file_size: number | null;
  work_date: string;
  is_public: boolean;
  file_is_public: boolean;
}

function fromRow(row: WorkRow): Work {
  return {
    id: row.id,
    title: row.title,
    description: row.description,
    category: row.category,
    techTags: row.tech_tags,
    fileType: row.file_type,
    linkUrl: row.link_url,
    fileName: row.file_name,
    fileSize: row.file_size,
    date: row.work_date,
    isPublic: row.is_public,
    fileIsPublic: row.file_is_public,
  };
}

export function useWorks() {
  const [works, setWorks] = useState<Work[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  const refresh = useCallback(async () => {
    const supabase = createClient();
    const { data, error } = await supabase
      .from("works")
      .select("*")
      .order("created_at", { ascending: false });
    if (!error && data) {
      setWorks((data as WorkRow[]).map(fromRow));
    }
    setIsLoaded(true);
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const addWork = useCallback(async (input: WorkInput) => {
    const supabase = createClient();
    const { data, error } = await supabase
      .from("works")
      .insert({
        title: input.title,
        description: input.description,
        category: input.category,
        tech_tags: input.techTags,
        file_type: input.fileType,
        link_url: input.linkUrl,
        file_name: input.fileName,
        file_size: input.fileSize,
        work_date: input.date,
        is_public: input.isPublic,
        file_is_public: input.fileIsPublic,
      })
      .select()
      .single();
    if (error) throw error;
    const newWork = fromRow(data as WorkRow);
    setWorks((prev) => [newWork, ...prev]);
    return newWork;
  }, []);

  const updateWork = useCallback(async (id: string, input: WorkInput) => {
    const supabase = createClient();
    const { error } = await supabase
      .from("works")
      .update({
        title: input.title,
        description: input.description,
        category: input.category,
        tech_tags: input.techTags,
        file_type: input.fileType,
        link_url: input.linkUrl,
        file_name: input.fileName,
        file_size: input.fileSize,
        work_date: input.date,
        is_public: input.isPublic,
        file_is_public: input.fileIsPublic,
      })
      .eq("id", id);
    if (error) throw error;
    setWorks((prev) =>
      prev.map((work) => (work.id === id ? { ...work, ...input } : work))
    );
  }, []);

  const deleteWork = useCallback(async (id: string) => {
    const supabase = createClient();
    const { error } = await supabase.from("works").delete().eq("id", id);
    if (error) throw error;
    setWorks((prev) => prev.filter((work) => work.id !== id));
  }, []);

  const getWorkById = useCallback(
    (id: string) => works.find((work) => work.id === id) ?? null,
    [works]
  );

  return { works, isLoaded, addWork, updateWork, deleteWork, getWorkById };
}
