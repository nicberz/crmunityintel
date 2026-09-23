export function TaskStatTiles({
  open,
  dueToday,
  done,
}: {
  open: number;
  dueToday: number;
  done: number;
}) {
  const tiles = [
    { label: "Atvērti", value: open },
    { label: "Šodien", value: dueToday },
    { label: "Pabeigti", value: done },
  ];

  return (
    <div className="grid grid-cols-3 gap-2">
      {tiles.map((t) => (
        <div key={t.label} className="rounded-lg border border-border bg-card p-3 text-center">
          <p className="text-xl font-semibold">{t.value}</p>
          <p className="text-xs text-muted-foreground">{t.label}</p>
        </div>
      ))}
    </div>
  );
}
