import connectDB from "@/lib/db";
import AttendanceRecord from "@/models/AttendanceRecord";
import { getActiveSession, serializeSession, getDayRecords, getWeeklyBreakdown, dayString } from "@/lib/attendance";
import { AttendanceControl } from "./AttendanceControl";
import { AttendanceDaySearch } from "./AttendanceDaySearch";
import { AttendanceMonthFilter } from "./AttendanceMonthFilter";
import { AttendanceChart } from "./AttendanceChart";
import { format } from "date-fns";

export const metadata = { title: "Attendance" };

export default async function AdminAttendancePage({
  searchParams,
}: {
  searchParams: Promise<{
    date?: string;
    search?: string;
    month?: string;
    year?: string;
    compareMonth?: string;
    compareYear?: string;
  }>;
}) {
  const { date, search = "", month, year, compareMonth, compareYear } = await searchParams;
  await connectDB();

  const now = new Date();
  const selectedDate = date || dayString();
  const selectedMonth = Number(month ?? now.getMonth() + 1);
  const selectedYear = Number(year ?? now.getFullYear());

  const [activeSession, dayRecords, primaryWeeks] = await Promise.all([
    getActiveSession(),
    getDayRecords(selectedDate, search.trim()),
    getWeeklyBreakdown(selectedMonth, selectedYear),
  ]);

  const activeCount = activeSession
    ? await AttendanceRecord.countDocuments({ sessionId: activeSession._id })
    : 0;

  let compareSeries: { month: number; year: number; weeks: { week: number; count: number }[] } | null = null;
  const cm = Number(compareMonth);
  const cy = Number(compareYear);
  if (compareMonth && compareYear && cm >= 1 && cm <= 12 && Number.isInteger(cy)) {
    compareSeries = { month: cm, year: cy, weeks: await getWeeklyBreakdown(cm, cy) };
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="font-heading text-3xl text-navy font-bold">Attendance</h1>
        <p className="text-navy/60 font-body mt-1">Start attendance, monitor check-ins, and review records.</p>
      </div>

      <AttendanceControl
        initialSession={activeSession ? serializeSession(activeSession) : null}
        initialCount={activeCount}
      />

      {/* Analytics */}
      <div className="bg-white border border-cream-dark rounded-xl p-6 mt-8">
        <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
          <h2 className="font-heading text-lg text-navy font-semibold">Weekly Attendance</h2>
          <AttendanceMonthFilter
            currentMonth={selectedMonth}
            currentYear={selectedYear}
            compareMonth={compareSeries?.month}
            compareYear={compareSeries?.year}
          />
        </div>
        <AttendanceChart
          primary={{ month: selectedMonth, year: selectedYear, weeks: primaryWeeks }}
          compare={compareSeries}
        />
      </div>

      {/* Day lookup */}
      <div className="bg-white border border-cream-dark rounded-xl overflow-hidden mt-8">
        <div className="p-6 pb-0">
          <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
            <h2 className="font-heading text-lg text-navy font-semibold">
              Attendance for {format(new Date(`${selectedDate}T00:00:00`), "EEEE, MMM d, yyyy")}
            </h2>
            <span className="text-sm font-body text-navy/50">{dayRecords.total} attended</span>
          </div>
          <AttendanceDaySearch initialDate={selectedDate} initialSearch={search} />
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-cream-light border-b border-cream-dark">
              <tr>
                <th className="text-left px-5 py-3 text-xs font-body font-semibold text-navy/50 uppercase">Name</th>
                <th className="text-left px-5 py-3 text-xs font-body font-semibold text-navy/50 uppercase hidden sm:table-cell">Phone</th>
                <th className="text-left px-5 py-3 text-xs font-body font-semibold text-navy/50 uppercase">Checked In</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-cream-dark">
              {dayRecords.records.map((r) => (
                <tr key={r.id} className="hover:bg-cream-light/50">
                  <td className="px-5 py-3 text-sm font-body font-medium text-navy">{r.name}</td>
                  <td className="px-5 py-3 text-sm text-navy/60 font-body hidden sm:table-cell">{r.phone}</td>
                  <td className="px-5 py-3 text-sm text-navy/50 font-body">{format(new Date(r.checkedInAt), "h:mm a")}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {dayRecords.records.length === 0 && (
            <p className="text-center text-navy/40 font-body text-sm py-8">No attendance recorded for this day.</p>
          )}
        </div>
      </div>
    </div>
  );
}
