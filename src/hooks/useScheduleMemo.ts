"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";

const SAVE_DEBOUNCE_MS = 600;

// 날짜와 무관하게 사용자당 하나로 통합된 자유 메모. 입력을 디바운스해서 자동 저장한다.
export function useScheduleMemo() {
  const [memo, setMemo] = useState("");
  const [isLoaded, setIsLoaded] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    let cancelled = false;
    const supabase = createClient();
    supabase
      .from("schedule_memo")
      .select("memo")
      .maybeSingle()
      .then(({ data, error }) => {
        if (cancelled) return;
        if (!error) setMemo(data?.memo ?? "");
        setIsLoaded(true);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  const persist = useCallback(async (value: string) => {
    const supabase = createClient();
    const {
      data: { session },
    } = await supabase.auth.getSession();
    const userId = session?.user?.id;
    if (!userId) return;

    await supabase
      .from("schedule_memo")
      .upsert({ user_id: userId, memo: value }, { onConflict: "user_id" });
  }, []);

  const updateMemo = useCallback(
    (value: string) => {
      setMemo(value);
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => {
        persist(value);
      }, SAVE_DEBOUNCE_MS);
    },
    [persist]
  );

  return { memo, isLoaded, updateMemo };
}
