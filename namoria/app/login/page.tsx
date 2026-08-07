import { LoginForm } from "@/components/LoginForm";
import { ThemeToggle } from "@/components/ThemeToggle";

export default async function LoginPage({
  searchParams,
}: PageProps<"/login">) {
  const sp = await searchParams;
  const raw = sp.redirect;
  // Only allow internal redirects.
  const redirect =
    typeof raw === "string" && raw.startsWith("/") ? raw : "/";

  return (
    <main className="relative flex flex-1 flex-col items-center justify-center gap-8 p-6">
      <div className="absolute top-3 right-3">
        <ThemeToggle />
      </div>
      <div className="text-center">
        <h1 className="text-brand text-4xl font-bold tracking-tight">Namoria</h1>
        <p className="mt-2 text-muted-foreground">Nossos álbuns, só nossos.</p>
      </div>
      <LoginForm redirect={redirect} />
    </main>
  );
}
