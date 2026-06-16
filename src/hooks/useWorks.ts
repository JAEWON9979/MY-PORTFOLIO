"use client";

import { useCallback, useEffect, useState } from "react";

export type WorkCategory = "수업과제" | "개인실습" | "팀프로젝트";
export type WorkFileType = "PDF" | "PPTX" | "기타";

export interface Work {
  id: string;
  title: string;
  description: string;
  category: WorkCategory;
  techTags: string[];
  fileType: WorkFileType;
  linkUrl: string;
  date: string;
}

export type WorkInput = Omit<Work, "id">;

const STORAGE_KEY = "works";

const sampleWorks: Work[] = [
  {
    id: "sample-work-1",
    title: "엑셀 함수 활용 보고서",
    description: "VLOOKUP, 피벗테이블을 활용해 분기별 매출 데이터를 정리한 수업 과제입니다.",
    category: "수업과제",
    techTags: ["Excel", "PivotTable"],
    fileType: "PDF",
    linkUrl: "https://example.com/works/sample-1",
    date: "2026-03-15",
  },
  {
    id: "sample-work-2",
    title: "공문서 작성 실습",
    description: "행정 공문서 양식에 맞춰 작성해본 개인 실습 자료입니다.",
    category: "개인실습",
    techTags: ["한글", "공문서"],
    fileType: "PPTX",
    linkUrl: "https://example.com/works/sample-2",
    date: "2026-04-02",
  },
  {
    id: "sample-work-3",
    title: "민원 응대 프로세스 개선 프로젝트",
    description: "팀원들과 함께 민원 응대 절차를 분석하고 개선안을 제안한 팀 프로젝트입니다.",
    category: "팀프로젝트",
    techTags: ["Python", "Pandas"],
    fileType: "기타",
    linkUrl: "https://example.com/works/sample-3",
    date: "2026-05-20",
  },
];

function loadWorks(): Work[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return sampleWorks;
    return JSON.parse(raw) as Work[];
  } catch {
    return sampleWorks;
  }
}

function persistWorks(works: Work[]) {
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(works));
}

export function useWorks() {
  const [works, setWorks] = useState<Work[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    setWorks(loadWorks());
    setIsLoaded(true);
  }, []);

  useEffect(() => {
    if (isLoaded) persistWorks(works);
  }, [works, isLoaded]);

  const addWork = useCallback(async (input: WorkInput) => {
    const newWork: Work = { ...input, id: crypto.randomUUID() };
    setWorks((prev) => [newWork, ...prev]);
    return newWork;
  }, []);

  const updateWork = useCallback(async (id: string, input: WorkInput) => {
    setWorks((prev) =>
      prev.map((work) => (work.id === id ? { ...work, ...input } : work))
    );
  }, []);

  const deleteWork = useCallback(async (id: string) => {
    setWorks((prev) => prev.filter((work) => work.id !== id));
  }, []);

  return { works, isLoaded, addWork, updateWork, deleteWork };
}
