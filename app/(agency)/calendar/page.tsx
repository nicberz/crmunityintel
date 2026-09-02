import { redirect } from "next/navigation";

// Superseded — each client's calendar now lives inline on /clients/[id].
// This route is kept only so old links/bookmarks don't 404; feel free to
// delete this whole app/(agency)/calendar/ directory.
export default function AgencyCalendarRedirect() {
  redirect("/clients");
}
