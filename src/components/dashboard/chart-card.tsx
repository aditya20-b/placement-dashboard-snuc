import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

interface ChartCardProps {
  title: string;
  description?: string;
  children: ReactNode;
  className?: string;
}

export function ChartCard({
  title,
  description,
  children,
  className,
}: ChartCardProps) {
  return (
    <Card className={cn("overflow-hidden", className)}>
      <div className="h-1 bg-gradient-to-r from-blue-500 to-gold-400" />
      <CardHeader className="pb-2">
        <CardTitle className="font-heading text-lg">{title}</CardTitle>
        {description && (
          <p className="text-sm text-muted-foreground">{description}</p>
        )}
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  );
}
