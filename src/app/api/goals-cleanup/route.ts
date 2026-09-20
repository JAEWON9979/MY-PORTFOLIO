import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

const KST_OFFSET_MS = 9 * 60 * 60 * 1000;

// "오늘"은 서버가 어느 타임존에서 실행되든 한국 표준시(KST) 기준으로 계산한다.
function kstTodayString(): string {
  const kst = new Date(Date.now() + KST_OFFSET_MS);
  return kst.toISOString().slice(0, 10);
}

// 일목표는 화면에 "오늘 날짜"만 표시되고 지난 것은 다시 보이지 않으므로,
// 지난 일목표는 DB에 쌓아둘 필요 없이 정리한다. 주목표/연목표는 대상에서 제외.
export async function GET(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const today = kstTodayString();
  const supabase = createAdminClient();

  const { data, error } = await supabase
    .from("goals")
    .delete()
    .eq("category", "일목표")
    .lt("deadline", today)
    .select("id");

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ today, deleted: data?.length ?? 0 });
}
