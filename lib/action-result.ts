import { ZodError } from "zod";

export type ActionResult = { error: string | null };

// redirect()/notFound() work by throwing; they must propagate instead of becoming error messages.
function isNextControlFlowError(err: unknown): boolean {
  const digest = (err as { digest?: unknown } | null)?.digest;
  return typeof digest === "string" && (digest.startsWith("NEXT_REDIRECT") || digest === "NEXT_NOT_FOUND");
}

export async function runAction(fn: () => Promise<void>): Promise<ActionResult> {
  try {
    await fn();
    return { error: null };
  } catch (err) {
    if (isNextControlFlowError(err)) throw err;
    if (err instanceof ZodError) return { error: err.issues[0]?.message ?? "Nederīgi dati." };
    return { error: err instanceof Error ? err.message : "Neizdevās saglabāt. Mēģini vēlreiz." };
  }
}
