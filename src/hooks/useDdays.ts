"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { kstToday } from "@/lib/date";

export interface Dday {
  id: string;
  title: string;
  date: string; // YYYY-MM-DD
}

// 홈에 보여줄 가장 가까운 D-DAY(오늘 이후, D-DAY로 표시한 일정만).
// schedules는 RLS로 본인 행만 조회되므로 비로그인이면 빈 목록이 온다.
export function useDdays(limit = 3) {
  const [ddays, setDdays] = useState<Dday[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const supabase = createClient();
    supabase
      .from("schedules")
      .select("id, title, date")
      .eq("is_dday", true)
      .gte("date", kstToday())
      .order("date", { ascending: true })
      .limit(limit)
      .then(({ data, error }) => {
        if (cancelled) return;
        if (!error && data) setDdays(data as Dday[]);
        setIsLoaded(true);
      });
    return () => {
      cancelled = true;
    };
  }, [limit]);

  return { ddays, isLoaded };
}
