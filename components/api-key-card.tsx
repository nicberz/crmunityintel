"use client";

import { useFormState, useFormStatus } from "react-dom";
import { generateClientApiKeyAction, type ApiKeyState } from "@/app/(agency)/actions";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const initialState: ApiKeyState = { status: "idle", message: "" };

function SubmitButton({ hasKey }: { hasKey: boolean }) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" variant={hasKey ? "outline" : "default"} disabled={pending}>
      {pending ? "Ģenerē..." : hasKey ? "Pārģenerēt atslēgu" : "Ģenerēt atslēgu"}
    </Button>
  );
}

export function ApiKeyCard({ clientId, apiKeyPrefix }: { clientId: string; apiKeyPrefix: string | null }) {
  const [state, formAction] = useFormState(generateClientApiKeyAction, initialState);

  return (
    <Card>
      <CardHeader>
        <CardTitle>API integrācija (mājaslapas anketa)</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 text-sm">
        <p>
          Anketas dati jānosūta ar <code>POST</code> uz <code>/api/leads</code> (uz jūsu CRM domēna),
          ar galveni <code>x-api-key</code> un JSON body:{" "}
          <code>{"{ phone, email, group, dates: [\"YYYY-MM-DD\"] }"}</code>.
        </p>
        <p className="text-muted-foreground">
          Pašreizējā atslēga: {apiKeyPrefix ? <code>{apiKeyPrefix}…</code> : "nav ģenerēta"}
        </p>
        <form action={formAction}>
          <input type="hidden" name="clientId" value={clientId} />
          <SubmitButton hasKey={!!apiKeyPrefix} />
        </form>
        {state.status === "success" && (
          <div className="space-y-1 rounded-md border border-border bg-muted p-3">
            <p className="font-medium">{state.message}</p>
            <code className="block break-all">{state.apiKey}</code>
          </div>
        )}
        {state.status === "error" && <p className="text-destructive">{state.message}</p>}
      </CardContent>
    </Card>
  );
}
