import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { MemberNav } from "@/components/layout/MemberNav";
import connectDB from "@/lib/db";
import User from "@/models/User";
import { isProfileComplete } from "@/lib/profileCompletion";
import DailyLoginTrigger from "./DailyLoginTrigger";

const COMPLETION_FIELDS =
  "totalPoints name dateOfBirth whatsapp email programmeOfStudy level departmentInChurch emergencyContactName emergencyContactPhone emergencyContactRelationship";

export default async function MemberLayout({ children }: { children: React.ReactNode }) {
  const headersList = await headers();
  const userId = headersList.get("x-user-id");
  const userName = headersList.get("x-user-name") ?? "Member";
  const userRole = headersList.get("x-user-role") ?? "member";

  if (!userId) redirect("/login");

  await connectDB();
  const user = await User.findById(userId).select(COMPLETION_FIELDS).lean();
  const totalPoints = user?.totalPoints ?? 0;

  // Admins aren't forced through member onboarding — a staff account has no
  // reason to hold a programme of study or a hostel year/level.
  if (userRole !== "admin" && user && !isProfileComplete(user)) redirect("/complete-profile");

  return (
    <div className="min-h-screen bg-cream-light">
      <MemberNav userName={userName} totalPoints={totalPoints} role={userRole} />

      {/* Daily login trigger (client component, fire-and-forget) */}
      <DailyLoginTrigger />

      {/* Content offset for sidebar */}
      <main className="lg:pl-64 min-h-screen">
        <div className="pt-14 lg:pt-0">
          {children}
        </div>
      </main>
    </div>
  );
}
