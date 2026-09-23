"use client";

import { useState } from "react";
import { Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { exportMyDataAction } from "@/lib/actions/account";

export function ExportMyDataButton() {
  const [loading, setLoading] = useState(false);

  async function handleClick() {
    setLoading(true);
    try {
      const data = await exportMyDataAction();
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = "mani-dati.json";
      link.click();
      URL.revokeObjectURL(url);
    } finally {
      setLoading(false);
    }
  }

  return (
    <Button type="button" variant="outline" onClick={handleClick} disabled={loading}>
      <Download className="h-4 w-4" />
      {loading ? "Sagatavo..." : "Lejupielādēt manus datus"}
    </Button>
  );
}
