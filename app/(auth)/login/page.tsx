import Link from "next/link";
import { LoginForm } from "./login-form";

export default function LoginPage({ searchParams }: { searchParams: { error?: string | string[] } }) {
  return (
    <div className="flex min-h-screen flex-col bg-muted px-4 pb-16">
      <div className="flex flex-1 items-center justify-center">
        <div className="w-full max-w-sm rounded-lg border bg-card p-8 shadow-sm">
          <h1 className="mb-1 text-xl font-semibold">UnityIntelCRM</h1>
          <p className="mb-6 text-sm text-muted-foreground">
            Piesakies, lai turpinātu.
          </p>
          {searchParams.error === "auth_link_invalid" && (
            <p className="mb-4 text-sm text-destructive">
              Saite nav derīga vai ir novecojusi. Ja tā bija ielūguma saite, lūdz administratoru nosūtīt jaunu; ja
              paroles atjaunošanas saite, mēģini vēlreiz sadaļā &quot;Aizmirsu paroli&quot;.
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
      <p className="fixed inset-x-0 bottom-0 py-4 text-center text-xs text-muted-foreground">
        <Link href="/privacy" className="underline hover:text-foreground">
          Privātuma politika
        </Link>
      </p>
    </div>
  );
}
