"use client";

import { useFormState, useFormStatus } from "react-dom";
import type { ApiKeyState } from "@/app/(agency)/actions";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { LeadFieldDefinition } from "@/lib/types";

const initialState: ApiKeyState = { status: "idle", message: "" };

function SubmitButton({ hasKey }: { hasKey: boolean }) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" variant={hasKey ? "outline" : "default"} disabled={pending}>
      {pending ? "Ģenerē..." : hasKey ? "Pārģenerēt atslēgu" : "Ģenerēt atslēgu"}
    </Button>
  );
}

function customFieldPlaceholder(field: LeadFieldDefinition): string | number {
  switch (field.field_type) {
    case "number":
      return 0;
    case "date":
      return "YYYY-MM-DD";
    case "select":
      return field.options?.[0] ?? "OPTION";
    default:
      return "...";
  }
}

const DEFAULT_TEXT_EXAMPLES: Record<string, string> = {
  name: "Anna Kalniņa",
  phone: "+371 20000000",
  group_name: "Vasaras grupa",
};

function defaultFieldPlaceholder(field: LeadFieldDefinition): string | number | string[] {
  if (field.default_kind === "email") return "anna@piemers.lv";
  if (field.default_kind === "preferred_dates") return ["2026-06-01"];
  if (field.field_type === "text" && field.default_kind) return DEFAULT_TEXT_EXAMPLES[field.default_kind] ?? "...";
  return customFieldPlaceholder(field);
}

// Every field is sent under its own key, in the same order as Settings → Leadu lauki.
function buildExamplePayload(defaultFields: LeadFieldDefinition[], customFields: LeadFieldDefinition[]) {
  const example: Record<string, unknown> = {};
  for (const field of defaultFields.filter((f) => f.is_enabled)) {
    example[field.key] = defaultFieldPlaceholder(field);
  }
  for (const field of customFields.filter((f) => f.is_enabled)) {
    example[field.key] = customFieldPlaceholder(field);
  }
  return example;
}

export function ApiKeyCard({
  generateAction,
  clientId,
  apiKeyPrefix,
  defaultFields,
  customFields,
}: {
  generateAction: (prevState: ApiKeyState, formData: FormData) => Promise<ApiKeyState>;
  clientId?: string;
  apiKeyPrefix: string | null;
  defaultFields: LeadFieldDefinition[];
  customFields: LeadFieldDefinition[];
}) {
  const [state, formAction] = useFormState(generateAction, initialState);

  const examplePayload = buildExamplePayload(defaultFields, customFields);
  const requiredKeys = new Set(
    [...defaultFields, ...customFields].filter((f) => f.is_enabled && f.is_required).map((f) => f.key)
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle>API integrācija (mājaslapas anketa)</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 text-sm">
        <p>
          Anketas dati jānosūta ar <code>POST</code> uz <code>/api/leads</code> (uz jūsu CRM domēna), ar galveni{" "}
          <code>x-api-key</code>. Piemēram, Forminator vai citā formu rīkā izveido webhook uz šo adresi ar šo JSON
          body — precīzi tie lauki un atslēgas (<code>key</code>), kas šobrīd ir aktīvi &quot;Leadu lauki&quot;
          sadaļā:
        </p>
        <pre className="overflow-x-auto rounded-md border border-border bg-muted p-3 text-xs">
          {JSON.stringify(examplePayload, null, 2)}
        </pre>
        {requiredKeys.size > 0 && (
          <p className="text-xs text-muted-foreground">
            Obligāti: {Array.from(requiredKeys).map((k) => (
              <code key={k} className="mx-0.5">
                {k}
              </code>
            ))}
          </p>
        )}
        <p className="text-muted-foreground">
          Pašreizējā atslēga: {apiKeyPrefix ? <code>{apiKeyPrefix}…</code> : "nav ģenerēta"}
        </p>
        <form action={formAction}>
          {clientId && <input type="hidden" name="clientId" value={clientId} />}
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
