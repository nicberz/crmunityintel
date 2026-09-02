"use client";

import { useState } from "react";
import { updateCommissionAction } from "@/app/(agency)/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import type { CommissionType } from "@/lib/types";

export function CommissionSettingsForm({
  clientId,
  commissionType,
  commissionAmountEur,
  commissionPercentage,
}: {
  clientId: string;
  commissionType: CommissionType;
  commissionAmountEur: number;
  commissionPercentage: number | null;
}) {
  const [type, setType] = useState<CommissionType>(commissionType);

  return (
    <form action={updateCommissionAction} className="flex flex-wrap items-end gap-3">
      <input type="hidden" name="clientId" value={clientId} />
      <div className="space-y-1.5">
        <Label htmlFor="commissionType">Komisijas veids</Label>
        <Select
          id="commissionType"
          name="commissionType"
          value={type}
          onChange={(e) => setType(e.target.value as CommissionType)}
          className="w-52"
        >
          <option value="flat">Fiksēta summa par leadu</option>
          <option value="percentage">Procenti no izmaksām</option>
        </Select>
      </div>
      {type === "flat" ? (
        <div className="space-y-1.5">
          <Label htmlFor="commission_amount_eur">€ par leadu</Label>
          <Input
            id="commission_amount_eur"
            name="commission_amount_eur"
            type="number"
            step="0.01"
            min="0"
            required
            defaultValue={commissionAmountEur}
            className="w-32"
          />
        </div>
      ) : (
        <div className="space-y-1.5">
          <Label htmlFor="commission_percentage">% no izmaksām</Label>
          <Input
            id="commission_percentage"
            name="commission_percentage"
            type="number"
            step="0.01"
            min="0"
            max="100"
            required
            defaultValue={commissionPercentage ?? 0}
            className="w-32"
          />
        </div>
      )}
      <Button type="submit">Saglabāt</Button>
    </form>
  );
}
