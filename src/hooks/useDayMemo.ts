"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";

const SAVE_DEBOUNCE_MS = 600;

// 선택된 날짜의 자유 메모를 불러오고, 입력을 디바운스해서 자동 저장한다.
export function useDayMemo(date: string | null) {
  const [memo, setMemo] = useState("");
  const [isLoaded, setIsLoaded] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (timerRef.current) clearTimeout(timerRef.current);

    if (!date) {
      setMemo("");
      setIsLoaded(true);
      return;
    }

    let cancelled = false;
    setIsLoaded(false);
    const supabase = createClient();
    supabase
      .from("schedule_day_memos")
      .select("memo")
      .eq("date", date)
      .maybeSingle()
      .then(({ data, error }) => {
        if (cancelled) return;
        if (!error) setMemo(data?.memo ?? "");
        setIsLoaded(true);
      });

    return () => {
      cancelled = true;
    };
  }, [date]);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  const persist = useCallback(async (targetDate: string, value: string) => {
    const supabase = createClient();
    const {
      data: { session },
    } = await supabase.auth.getSession();
    const userId = session?.user?.id;
    if (!userId) return;

    if (value.trim() === "") {
      await supabase
        .from("schedule_day_memos")
        .delete()
        .eq("date", targetDate)
        .eq("user_id", userId);
      return;
    }

    await supabase
      .from("schedule_day_memos")
      .upsert({ user_id: userId, date: targetDate, memo: value }, { onConflict: "user_id,date" });
  }, []);

  const updateMemo = useCallback(
    (value: string) => {
      setMemo(value);
      if (!date) return;
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => {
        persist(date, value);
      }, SAVE_DEBOUNCE_MS);
    },
    [date, persist]
  );

  return { memo, isLoaded, updateMemo };
}
