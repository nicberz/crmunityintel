import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { Profile } from "@/lib/types";

export type ProfileWithEmail = Profile & { email: string };

export async function requireProfile(): Promise<ProfileWithEmail> {
  const supabase = createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  if (!profile) {
    redirect("/login");
  }

  return { ...profile, email: user.email ?? "" };
}

export async function requireAgencyAdmin(): Promise<ProfileWithEmail> {
  const profile = await requireProfile();
  if (profile.role === "client_user" && profile.client_id) {
    redirect("/overview");
  }
  if (profile.role !== "agency_admin") {
    throw new Error(
      "Šim lietotājam nav derīgas lomas vai piesaistīta klienta (profiles.role / profiles.client_id). Sazinies ar sistēmas administratoru."
    );
  }
  return profile;
}

export async function requireClientUser(): Promise<ProfileWithEmail> {
  const profile = await requireProfile();
  if (profile.role === "agency_admin") {
    redirect("/dashboard");
  }
  if (profile.role !== "client_user" || !profile.client_id) {
    throw new Error(
      "Šim lietotājam nav piesaistīts neviens klients (profiles.client_id). Sazinies ar aģentūras administratoru."
    );
  }
  return profile;
}
