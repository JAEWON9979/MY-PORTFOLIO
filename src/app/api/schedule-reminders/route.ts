import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

const KST_OFFSET_MS = 9 * 60 * 60 * 1000;

// "내일"은 서버가 어느 타임존에서 실행되든 한국 표준시(KST) 기준으로 계산한다.
function kstDateString(daysFromNow: number): string {
  const kst = new Date(Date.now() + KST_OFFSET_MS);
  kst.setUTCDate(kst.getUTCDate() + daysFromNow);
  return kst.toISOString().slice(0, 10);
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const targetDate = kstDateString(1);
  const supabase = createAdminClient();

  const { data: schedules, error } = await supabase
    .from("schedules")
    .select("id, title, description, user_id")
    .eq("date", targetDate)
    .eq("reminder_enabled", true)
    .is("reminder_sent_at", null);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  if (!schedules || schedules.length === 0) {
    return NextResponse.json({ targetDate, sent: 0 });
  }

  const userIds = [...new Set(schedules.map((s) => s.user_id))];
  const { data: profiles, error: profilesError } = await supabase
    .from("profiles")
    .select("id, email")
    .in("id", userIds);

  if (profilesError) {
    return NextResponse.json({ error: profilesError.message }, { status: 500 });
  }
  const emailByUserId = new Map(profiles?.map((p) => [p.id, p.email]) ?? []);

  const schedulesByUser = new Map<string, typeof schedules>();
  for (const s of schedules) {
    const list = schedulesByUser.get(s.user_id) ?? [];
    list.push(s);
    schedulesByUser.set(s.user_id, list);
  }

  let sentCount = 0;
  const sentScheduleIds: string[] = [];

  for (const [userId, items] of schedulesByUser) {
    const email = emailByUserId.get(userId);
    if (!email) continue;

    const listHtml = items
      .map(
        (s) =>
          `<li><strong>${escapeHtml(s.title)}</strong>${
            s.description ? ` — ${escapeHtml(s.description)}` : ""
          }</li>`
      )
      .join("");

    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: process.env.RESEND_FROM_EMAIL,
        to: email,
        subject: `내일(${targetDate}) 일정 알림`,
        html: `<p>내일 예정된 일정입니다:</p><ul>${listHtml}</ul>`,
      }),
    });

    if (res.ok) {
      sentCount += 1;
      sentScheduleIds.push(...items.map((s) => s.id));
    } else {
      const body = await res.text();
      console.error(`[schedule-reminders] Resend 발송 실패 (to: ${email}, status: ${res.status}): ${body}`);
    }
  }

  if (sentScheduleIds.length > 0) {
    await supabase
      .from("schedules")
      .update({ reminder_sent_at: new Date().toISOString() })
      .in("id", sentScheduleIds);
  }

  return NextResponse.json({ targetDate, sent: sentCount, schedules: sentScheduleIds.length });
}
