import { Skeleton } from "@/components/ui/skeleton";

export const ReportCardSkeleton = () => (
  <div className="flex items-center justify-between p-4 border rounded-lg">
    <div className="flex-1 space-y-2">
      <div className="flex items-center gap-3">
        <Skeleton className="h-5 w-5 rounded-full" />
        <Skeleton className="h-5 w-64" />
      </div>
      <Skeleton className="h-4 w-48 ml-8" />
    </div>
    <div className="flex items-center gap-4">
      <Skeleton className="h-8 w-24" />
      <Skeleton className="h-9 w-28" />
    </div>
  </div>
);

export const StatsCardSkeleton = () => (
  <div className="p-6 border rounded-lg">
    <div className="flex items-center justify-between">
      <div className="space-y-2">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-8 w-16" />
      </div>
      <Skeleton className="h-8 w-8 rounded" />
    </div>
  </div>
);
