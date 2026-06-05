import { redirect } from "next/navigation";
import { auth } from "@/auth";

export default async function ProtectedAdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  if (!session?.user) {
    redirect("/admin/login");
  }

  return <div className="min-h-dvh bg-muted/30">{children}</div>;
}
