interface WeekBucket {
  week: number;
  count: number;
}

interface MonthSeries {
  month: number;
  year: number;
  weeks: WeekBucket[];
}

interface Props {
  primary: MonthSeries;
  compare: MonthSeries | null;
}

const MONTH_NAMES = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

export function AttendanceChart({ primary, compare }: Props) {
  const maxWeeks = Math.max(primary.weeks.length, compare?.weeks.length ?? 0);
  const maxCount = Math.max(1, ...primary.weeks.map((w) => w.count), ...(compare?.weeks.map((w) => w.count) ?? []));
  const weekLabels = Array.from({ length: maxWeeks }, (_, i) => i + 1);

  return (
    <div>
      <div className="flex items-center gap-4 mb-4 text-xs font-body text-navy/60">
        <span className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-sm bg-navy inline-block" />
          {MONTH_NAMES[primary.month - 1]} {primary.year}
        </span>
        {compare && (
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-sm bg-gold inline-block" />
            {MONTH_NAMES[compare.month - 1]} {compare.year}
          </span>
        )}
      </div>

      <div className="flex items-end gap-4 h-48 border-b border-cream-dark pb-1">
        {weekLabels.map((weekNum) => {
          const primaryCount = primary.weeks.find((w) => w.week === weekNum)?.count ?? 0;
          const compareCount = compare?.weeks.find((w) => w.week === weekNum)?.count ?? 0;
          return (
            <div key={weekNum} className="flex-1 flex flex-col items-center gap-2 h-full justify-end">
              <div className="flex items-end gap-1 h-full w-full justify-center">
                <div className="flex flex-col items-center justify-end h-full w-6">
                  <span className="text-[10px] text-navy/50 font-body mb-1">{primaryCount || ""}</span>
                  <div
                    className="w-full bg-navy rounded-t-sm transition-all"
                    style={{ height: `${(primaryCount / maxCount) * 100}%`, minHeight: primaryCount > 0 ? "4px" : "0" }}
                  />
                </div>
                {compare && (
                  <div className="flex flex-col items-center justify-end h-full w-6">
                    <span className="text-[10px] text-navy/50 font-body mb-1">{compareCount || ""}</span>
                    <div
                      className="w-full bg-gold rounded-t-sm transition-all"
                      style={{ height: `${(compareCount / maxCount) * 100}%`, minHeight: compareCount > 0 ? "4px" : "0" }}
                    />
                  </div>
                )}
              </div>
              <span className="text-xs text-navy/50 font-body">Week {weekNum}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
