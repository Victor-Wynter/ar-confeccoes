import { redirect } from "next/navigation";
import { auth, signOut } from "@/auth";
import { db } from "@/db";
import { reservations } from "@/db/schema";
import { eq } from "drizzle-orm";
import { AdminSidebar } from "@/components/admin/admin-sidebar";
import { MobileHeader } from "@/components/admin/mobile-header";

export default async function ProtectedAdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  if (!session?.user) redirect("/admin/login");

  const unviewedCount = await db.$count(reservations, eq(reservations.viewed, false));

  async function handleSignOut() {
    "use server";
    await signOut({ redirectTo: "/admin/login" });
  }

  return (
    <div className="flex h-dvh bg-muted/30">
      {/* Sidebar desktop */}
      <aside className="hidden lg:flex lg:flex-col lg:w-60 lg:shrink-0 bg-background border-r">
        <AdminSidebar
          unviewedCount={unviewedCount}
          signOutAction={handleSignOut}
        />
      </aside>

      {/* Main */}
      <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
        {/* Mobile header */}
        <div className="lg:hidden">
          <MobileHeader
            unviewedCount={unviewedCount}
            signOutAction={handleSignOut}
          />
        </div>

        {/* Content */}
        <main className="flex-1 overflow-y-auto p-4 lg:p-8">
          {children}
        </main>
      </div>
    </div>
  );
}
