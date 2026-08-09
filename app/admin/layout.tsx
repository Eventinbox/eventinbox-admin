import type { ReactNode } from "react";
import { AppShell } from "@/components/admin/app-shell";
import { AuthGuard } from "@/lib/auth-guard";

// Every /admin route is wrapped by the AuthGuard (authenticated + is_admin,
// confirmed against the API) and rendered inside the admin shell. The IP
// whitelist is enforced one layer up, in middleware.ts.
export default function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <AuthGuard>
      <AppShell>{children}</AppShell>
    </AuthGuard>
  );
}
