import { Skeleton } from "@/components/ui/skeleton";

export function StatCardSkeleton() {
  return (
    <div className="overflow-hidden rounded-lg border border-border/50 bg-white/80 shadow-md">
      <div className="h-0.5 bg-gradient-to-r from-blue-500 to-gold-400" />
      <div className="p-6">
        <div className="flex items-start justify-between">
          <div>
            <Skeleton className="h-4 w-24" />
            <Skeleton className="mt-3 h-9 w-28" />
          </div>
          <Skeleton className="h-9 w-9 rounded-lg" />
        </div>
      </div>
    </div>
  );
}

export function ChartSkeleton({ height = "h-64" }: { height?: string }) {
  return (
    <div className="overflow-hidden rounded-lg border border-border/50 bg-white/80 shadow-md">
      <div className="h-1 bg-gradient-to-r from-blue-500 to-gold-400" />
      <div className="p-6">
        <Skeleton className="h-5 w-48" />
        <Skeleton className="mt-1 h-3 w-64" />
        <Skeleton className={`mt-4 w-full ${height} rounded-md`} />
      </div>
    </div>
  );
}

export function TableSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div className="overflow-hidden rounded-lg border border-border/50 bg-white/80 shadow-md">
      <div className="h-1 bg-gradient-to-r from-blue-500 to-gold-400" />
      <div className="p-6">
        <Skeleton className="h-5 w-40" />
        <div className="mt-4 space-y-3">
          <div className="flex gap-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-4 flex-1" />
            ))}
          </div>
          {Array.from({ length: rows }).map((_, i) => (
            <div key={i} className="flex gap-4">
              {Array.from({ length: 5 }).map((_, j) => (
                <Skeleton key={j} className="h-4 flex-1" />
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export function DashboardSkeleton() {
  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div className="grid gap-4 grid-cols-2 sm:grid-cols-3 lg:grid-cols-5">
        {Array.from({ length: 5 }).map((_, i) => (
          <StatCardSkeleton key={i} />
        ))}
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        <ChartSkeleton />
        <ChartSkeleton />
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        <ChartSkeleton />
        <ChartSkeleton />
      </div>
    </div>
  );
}
