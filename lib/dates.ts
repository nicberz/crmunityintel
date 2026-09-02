export function formatDate(value: string | Date): string {
  const date = typeof value === "string" ? new Date(value) : value;
  return date.toLocaleDateString("lv-LV", { day: "2-digit", month: "2-digit", year: "numeric" });
}

export function parseDatesInput(input: string): string[] {
  const dates = input
    .split(",")
    .map((d) => d.trim())
    .filter((d) => d.length > 0);

  for (const d of dates) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(d)) {
      throw new Error(`Nederīgs datuma formāts: "${d}". Lieto GGGG-MM-DD, atdalot ar komatu.`);
    }
  }

  return dates;
}
