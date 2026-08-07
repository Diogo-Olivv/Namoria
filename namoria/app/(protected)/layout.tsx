import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { LogoutButton } from "@/components/LogoutButton";

export default async function ProtectedLayout({
  children,
}: LayoutProps<"/">) {
  // Defense in depth: proxy.ts already guards, but never render app shell
  // without a verified user.
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  return (
    <div className="flex min-h-full flex-col">
      <header className="sticky top-0 z-20 flex items-center justify-between border-b border-border bg-background/80 px-4 py-3 backdrop-blur">
        <Link href="/" className="text-lg font-semibold tracking-tight">
          Namoria
        </Link>
        <LogoutButton />
      </header>
      <main className="flex-1">{children}</main>
    </div>
  );
}
