import Link from "next/link";
import { LoginForm } from "./login-form";

export default function LoginPage({ searchParams }: { searchParams: { error?: string | string[] } }) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-muted px-4">
      <div className="w-full max-w-sm rounded-lg border bg-card p-8 shadow-sm">
        <h1 className="mb-1 text-xl font-semibold">UnityIntelCRM</h1>
        <p className="mb-6 text-sm text-muted-foreground">
          Piesakies, lai turpinātu.
        </p>
        {searchParams.error === "invite_link_invalid" && (
          <p className="mb-4 text-sm text-destructive">
            Ielūguma saite nav derīga vai ir novecojusi. Lūdz aģentūras administratoru nosūtīt jaunu ielūgumu.
          </p>
        )}
        <LoginForm />
        <p className="mt-4 text-sm text-muted-foreground">
          <Link href="/forgot-password" className="underline hover:text-foreground">
            Aizmirsu paroli
          </Link>
        </p>
      </div>
    </div>
  );
}
