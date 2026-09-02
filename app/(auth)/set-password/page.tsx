import { SetPasswordForm } from "./set-password-form";

export default function SetPasswordPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-muted px-4">
      <div className="w-full max-w-sm rounded-lg border bg-card p-8 shadow-sm">
        <h1 className="mb-1 text-xl font-semibold">UnityIntelCRM</h1>
        <p className="mb-6 text-sm text-muted-foreground">
          Iestati jaunu paroli.
        </p>
        <SetPasswordForm />
      </div>
    </div>
  );
}
