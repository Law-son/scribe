import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { AdminNav } from "@/components/layout/AdminNav";
import connectDB from "@/lib/db";
import User from "@/models/User";
import { isProfileComplete } from "@/lib/profileCompletion";

const COMPLETION_FIELDS =
  "dateOfBirth whatsapp email isStudent programmeOfStudy level departmentInChurch emergencyContactName emergencyContactPhone emergencyContactRelationship";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const headersList = await headers();
  const role = headersList.get("x-user-role");
  const userId = headersList.get("x-user-id");
  const userName = headersList.get("x-user-name") ?? "Admin";

  if (role !== "admin") redirect("/dashboard");

  await connectDB();
  const user = userId ? await User.findById(userId).select(COMPLETION_FIELDS).lean() : null;
  if (user && !isProfileComplete(user)) redirect("/complete-profile");

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
