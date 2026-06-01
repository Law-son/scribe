import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { AdminNav } from "@/components/layout/AdminNav";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const headersList = await headers();
  const role = headersList.get("x-user-role");
  const userName = headersList.get("x-user-name") ?? "Admin";

  if (role !== "admin") redirect("/dashboard");

  return (
    <div className="min-h-screen bg-cream-light">
      <AdminNav userName={userName} />
      <main className="lg:pl-64 min-h-screen">
        <div className="pt-20 lg:pt-10 max-w-6xl mx-auto px-4 sm:px-6 pb-12">
          {children}
        </div>
      </main>
    </div>
  );
}
