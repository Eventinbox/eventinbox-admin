import { redirect } from "next/navigation";

// The console lives under /admin — send the root straight there. The AuthGuard
// in the admin layout takes over from here.
export default function RootPage() {
  redirect("/admin/stats");
}
