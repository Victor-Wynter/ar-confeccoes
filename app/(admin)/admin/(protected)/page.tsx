import { auth, signOut } from "@/auth";
import { Button } from "@/components/ui/button";

export default async function AdminDashboardPage() {
  const session = await auth();

  return (
    <main className="mx-auto max-w-4xl p-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-primary">Painel</h1>
          <p className="text-sm text-muted-foreground">
            Logado como {session?.user?.email}
          </p>
        </div>
        <form
          action={async () => {
            "use server";
            await signOut({ redirectTo: "/admin/login" });
          }}
        >
          <Button variant="outline" type="submit">
            Sair
          </Button>
        </form>
      </div>

      <p className="mt-8 text-muted-foreground">
        Dashboard em construção (Fase 2).
      </p>
    </main>
  );
}
