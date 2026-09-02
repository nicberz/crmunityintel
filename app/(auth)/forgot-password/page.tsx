import Link from "next/link";
import { ForgotPasswordForm } from "./forgot-password-form";

export default function ForgotPasswordPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-muted px-4">
      <div className="w-full max-w-sm rounded-lg border bg-card p-8 shadow-sm">
        <h1 className="mb-1 text-xl font-semibold">UnityIntelCRM</h1>
        <p className="mb-6 text-sm text-muted-foreground">
          Ievadi savu e-pastu un nosūtīsim saiti paroles maiņai.
        </p>
        <ForgotPasswordForm />
        <p className="mt-6 text-sm text-muted-foreground">
          <Link href="/login" className="underline hover:text-foreground">
            Atpakaļ uz pieteikšanos
          </Link>
        </p>
      </div>
    </div>
  );
}
