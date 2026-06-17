"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { useAuth } from "@/hooks/useAuth";
import { createClient } from "@/lib/supabase/client";

interface ProfileRow {
  id: string;
  email: string | null;
  username: string | null;
  role: "admin" | "user";
  created_at: string;
}

export default function AdminUsersPage() {
  const router = useRouter();
  const { user, isAdmin, isLoaded } = useAuth();
  const [profiles, setProfiles] = useState<ProfileRow[]>([]);
  const [isFetching, setIsFetching] = useState(true);
  const [togglingId, setTogglingId] = useState<string | null>(null);

  useEffect(() => {
    if (isLoaded && (!user || !isAdmin)) {
      router.replace("/");
    }
  }, [isLoaded, user, isAdmin, router]);

  const fetchProfiles = useCallback(async () => {
    const supabase = createClient();
    const { data } = await supabase
      .from("profiles")
      .select("id, email, username, role, created_at")
      .order("created_at", { ascending: true });
    if (data) setProfiles(data as ProfileRow[]);
    setIsFetching(false);
  }, []);

  useEffect(() => {
    if (isAdmin) fetchProfiles();
  }, [isAdmin, fetchProfiles]);

  const toggleRole = async (profile: ProfileRow) => {
    if (profile.id === user?.id || togglingId) return;
    const newRole: "admin" | "user" =
      profile.role === "admin" ? "user" : "admin";
    setTogglingId(profile.id);
    const supabase = createClient();
    const { error } = await supabase
      .from("profiles")
      .update({ role: newRole })
      .eq("id", profile.id);
    if (!error) {
      setProfiles((prev) =>
        prev.map((p) => (p.id === profile.id ? { ...p, role: newRole } : p))
      );
    }
    setTogglingId(null);
  };

  if (!isLoaded || !user || !isAdmin) return null;

  return (
    <div className="flex flex-1 flex-col bg-white">
      <Header />
      <main className="flex-1">
        <section className="mx-auto max-w-4xl px-6 py-12">
          <h1 className="mb-8 text-2xl font-bold text-zinc-900">회원 관리</h1>

          {isFetching ? (
            <p className="text-sm text-zinc-400">불러오는 중...</p>
          ) : profiles.length === 0 ? (
            <p className="text-sm text-zinc-500">등록된 회원이 없습니다.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-sm">
                <thead>
                  <tr className="border-b border-zinc-200">
                    <th className="pb-3 pr-6 text-left text-xs font-medium uppercase tracking-wide text-zinc-400">
                      이메일
                    </th>
                    <th className="pb-3 pr-6 text-left text-xs font-medium uppercase tracking-wide text-zinc-400">
                      사용자명
                    </th>
                    <th className="pb-3 pr-6 text-left text-xs font-medium uppercase tracking-wide text-zinc-400">
                      역할
                    </th>
                    <th className="pb-3 pr-6 text-left text-xs font-medium uppercase tracking-wide text-zinc-400">
                      가입일
                    </th>
                    <th className="pb-3 text-left text-xs font-medium uppercase tracking-wide text-zinc-400">
                      역할 변경
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100">
                  {profiles.map((profile) => {
                    const isSelf = profile.id === user.id;
                    return (
                      <tr key={profile.id}>
                        <td className="py-3 pr-6 text-zinc-900">
                          {profile.email ?? (
                            <span className="text-zinc-400">—</span>
                          )}
                        </td>
                        <td className="py-3 pr-6 text-zinc-600">
                          {profile.username ?? (
                            <span className="text-zinc-400">—</span>
                          )}
                        </td>
                        <td className="py-3 pr-6">
                          <span
                            className={`rounded-full px-2.5 py-1 text-xs font-medium ${
                              profile.role === "admin"
                                ? "bg-zinc-900 text-white"
                                : "bg-zinc-100 text-zinc-600"
                            }`}
                          >
                            {profile.role}
                          </span>
                        </td>
                        <td className="py-3 pr-6 text-zinc-500">
                          {new Date(profile.created_at).toLocaleDateString(
                            "ko-KR"
                          )}
                        </td>
                        <td className="py-3">
                          {isSelf ? (
                            <span className="text-xs text-zinc-400">
                              본인 계정
                            </span>
                          ) : (
                            <button
                              type="button"
                              onClick={() => toggleRole(profile)}
                              disabled={togglingId === profile.id}
                              className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors disabled:opacity-50 ${
                                profile.role === "admin"
                                  ? "bg-zinc-100 text-zinc-700 hover:bg-zinc-200"
                                  : "bg-zinc-900 text-white hover:bg-zinc-800"
                              }`}
                            >
                              {profile.role === "admin"
                                ? "user로 변경"
                                : "admin으로 변경"}
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </main>
      <Footer />
    </div>
  );
}
