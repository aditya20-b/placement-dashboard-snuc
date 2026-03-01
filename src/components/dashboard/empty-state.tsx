import { Inbox } from "lucide-react";

interface EmptyStateProps {
  title?: string;
  message?: string;
}

export function EmptyState({
  title = "No data available",
  message = "There's nothing to display yet.",
}: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center gap-3 py-12 text-center">
      <div className="rounded-full bg-gray-100 p-3">
        <Inbox className="h-8 w-8 text-gray-400" />
      </div>
      <div>
        <h3 className="font-heading text-lg font-medium text-gray-700">{title}</h3>
        <p className="mt-1 text-sm text-muted-foreground">{message}</p>
      </div>
    </div>
  );
}
