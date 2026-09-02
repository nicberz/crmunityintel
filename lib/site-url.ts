import { headers } from "next/headers";

export function getSiteUrl(): string {
  const host = headers().get("host")!;
  const protocol = host.startsWith("localhost") || host.startsWith("127.0.0.1") ? "http" : "https";
  return `${protocol}://${host}`;
}
