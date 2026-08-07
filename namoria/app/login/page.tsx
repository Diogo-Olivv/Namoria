import { LoginForm } from "@/components/LoginForm";

export default async function LoginPage({
  searchParams,
}: PageProps<"/login">) {
  const sp = await searchParams;
  const raw = sp.redirect;
  // Only allow internal redirects.
  const redirect =
    typeof raw === "string" && raw.startsWith("/") ? raw : "/";

  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-8 p-6">
      <div className="text-center">
        <h1 className="text-brand text-4xl font-bold tracking-tight">Namoria</h1>
        <p className="mt-2 text-muted-foreground">Nossos álbuns, só nossos.</p>
      </div>
      <LoginForm redirect={redirect} />
    </main>
  );
}
