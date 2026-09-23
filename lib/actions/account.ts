"use server";

import { requireProfile } from "@/lib/auth";

export async function exportMyDataAction() {
  const profile = await requireProfile();
  return {
    exportedAt: new Date().toISOString(),
    account: {
      id: profile.id,
      fullName: profile.full_name,
      email: profile.email,
      role: profile.role,
      clientId: profile.client_id,
      createdAt: profile.created_at,
    },
  };
}
