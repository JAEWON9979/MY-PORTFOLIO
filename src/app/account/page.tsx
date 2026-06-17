"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { useAuth } from "@/hooks/useAuth";
import { createClient } from "@/lib/supabase/client";

export default function AccountPage() {
  const router = useRouter();
  const { user, isAdmin, isLoaded, signOut } = useAuth();

  // ── password change ────────────────────────────────────────────────────────
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [pwMsg, setPwMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [isPwLoading, setIsPwLoading] = useState(false);

  // ── delete account ─────────────────────────────────────────────────────────
  const [showModal, setShowModal] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isDeleted, setIsDeleted] = useState(false);
  const [deleteError, setDeleteError] = useState("");

  useEffect(() => {
    if (isLoaded && !user) router.replace("/auth/login");
  }, [isLoaded, user, router]);

  // redirect to home after successful deletion
  useEffect(() => {
    if (!isDeleted) return;
    const t = setTimeout(() => router.push("/"), 2000);
    return () => clearTimeout(t);
  }, [isDeleted, router]);

  if (!isLoaded || !user) return null;

  const displayName =
    (user.user_metadata?.username as string | undefined) ?? user.email ?? "";

  // ── handlers ───────────────────────────────────────────────────────────────
  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setPwMsg(null);
    if (newPassword.length < 8) {
      setPwMsg({ ok: false, text: "비밀번호는 8자 이상이어야 합니다." });
      return;
    }
    if (newPassword !== confirmPassword) {
      setPwMsg({ ok: false, text: "비밀번호가 일치하지 않습니다." });
      return;
    }
    setIsPwLoading(true);
    const supabase = createClient();
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    if (error) {
      setPwMsg({ ok: false, text: error.message });
    } else {
      setPwMsg({ ok: true, text: "비밀번호가 변경되었습니다." });
      setNewPassword("");
      setConfirmPassword("");
    }
    setIsPwLoading(false);
  };

  const handleDeleteAccount = async () => {
    setIsDeleting(true);
    setDeleteError("");
    const supabase = createClient();
    const { error } = await supabase.rpc("delete_own_account");
    if (error) {
      setDeleteError(error.message || "탈퇴 처리 중 오류가 발생했습니다.");
      setIsDeleting(false);
      return;
    }
    // Account deleted server-side — clear local session and redirect
    await signOut().catch(() => {});
    setIsDeleted(true);
    setIsDeleting(false);
  };

  // ── render ─────────────────────────────────────────────────────────────────
  return (
    <div className="flex flex-1 flex-col bg-white">
      <Header />
      <main className="flex-1">
        <section className="mx-auto max-w-xl px-6 py-12">
          <h1 className="mb-2 text-2xl font-bold text-zinc-900">계정 설정</h1>
          <p className="mb-8 text-sm text-zinc-500">{displayName}</p>

          {/* ── 비밀번호 변경 ─────────────────────────────────────────────── */}
          <div className="rounded-2xl border border-zinc-200 p-6">
            <h2 className="mb-4 text-base font-semibold text-zinc-900">
              비밀번호 변경
            </h2>
            <form onSubmit={handlePasswordChange} className="space-y-3">
              <div>
                <label className="mb-1 block text-sm font-medium text-zinc-700">
                  새 비밀번호
                </label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="8자 이상"
                  required
                  className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm text-zinc-900 focus:border-zinc-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-zinc-700">
                  비밀번호 확인
                </label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm text-zinc-900 focus:border-zinc-500 focus:outline-none"
                />
              </div>
              {pwMsg && (
                <p
                  className={`text-sm ${pwMsg.ok ? "text-green-600" : "text-red-600"}`}
                >
                  {pwMsg.text}
                </p>
              )}
              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={isPwLoading}
                  className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800 disabled:opacity-50"
                >
                  {isPwLoading ? "변경 중..." : "변경"}
                </button>
              </div>
            </form>
          </div>

          {/* ── 위험 영역 ─────────────────────────────────────────────────── */}
          <div className="mt-6 rounded-2xl border border-red-200 p-6">
            <h2 className="mb-1 text-base font-semibold text-red-600">
              위험 영역
            </h2>
            <p className="mb-4 text-sm text-zinc-500">
              탈퇴하면 작성한 글, 댓글, 목표가 모두 삭제되며 복구할 수
              없습니다.
            </p>
            {isAdmin ? (
              <p className="text-sm text-zinc-400">
                관리자 계정은 탈퇴할 수 없습니다.
              </p>
            ) : (
              <button
                type="button"
                onClick={() => setShowModal(true)}
                className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700"
              >
                회원 탈퇴
              </button>
            )}
          </div>
        </section>
      </main>
      <Footer />

      {/* ── 탈퇴 확인 모달 ──────────────────────────────────────────────── */}
      {showModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4"
          onClick={() => {
            if (!isDeleting && !isDeleted) setShowModal(false);
          }}
        >
          <div
            className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            {isDeleted ? (
              <div className="text-center">
                <p className="mb-1 text-base font-semibold text-zinc-900">
                  탈퇴가 완료되었습니다.
                </p>
                <p className="text-sm text-zinc-500">
                  메인 페이지로 이동합니다...
                </p>
              </div>
            ) : (
              <>
                <h2 className="mb-2 text-lg font-bold text-zinc-900">
                  정말 탈퇴하시겠습니까?
                </h2>
                <p className="mb-4 text-sm text-zinc-600">
                  탈퇴하면 작성한 글, 댓글, 목표가 모두 삭제되며 복구할 수
                  없습니다. 계속하시겠습니까?
                </p>
                {deleteError && (
                  <p className="mb-3 text-sm text-red-600">{deleteError}</p>
                )}
                <div className="flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    disabled={isDeleting}
                    className="rounded-lg px-4 py-2 text-sm font-medium text-zinc-600 hover:bg-zinc-100 disabled:opacity-50"
                  >
                    취소
                  </button>
                  <button
                    type="button"
                    onClick={handleDeleteAccount}
                    disabled={isDeleting}
                    className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50"
                  >
                    {isDeleting ? "처리 중..." : "탈퇴 확인"}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
