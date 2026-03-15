"use client";

import { useEffect, useRef, useState } from "react";
import { motion } from "motion/react";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { LucideIcon } from "lucide-react";

function useAnimatedNumber(target: number, duration = 1200) {
  const [value, setValue] = useState(0);
  const startTime = useRef<number | null>(null);
  const rafId = useRef<number>(0);

  useEffect(() => {
    startTime.current = null;

    function animate(timestamp: number) {
      if (!startTime.current) startTime.current = timestamp;
      const elapsed = timestamp - startTime.current;
      const progress = Math.min(elapsed / duration, 1);
      // Ease out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      setValue(Math.round(target * eased));

      if (progress < 1) {
        rafId.current = requestAnimationFrame(animate);
      }
    }

    rafId.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(rafId.current);
  }, [target, duration]);

  return value;
}

interface StatCardProps {
  title: string;
  value: number;
  suffix?: string;
  prefix?: string;
  description?: string;
  className?: string;
  icon?: LucideIcon;
  iconColor?: string;
  format?: (value: number) => string;
}

export function StatCard({
  title,
  value,
  suffix,
  prefix,
  description,
  className,
  icon: Icon,
  iconColor = "text-blue-500",
  format,
}: StatCardProps) {
  const animated = useAnimatedNumber(value);

  return (
    <motion.div
      variants={{
        hidden: { opacity: 0, y: 20, scale: 0.95 },
        visible: {
          opacity: 1,
          y: 0,
          scale: 1,
          transition: { duration: 0.4, ease: "easeOut" },
        },
      }}
    >
      <Card
        className={cn(
          "overflow-hidden border-l-4 transition-all duration-200 hover:shadow-lg hover:-translate-y-0.5",
          iconColor === "text-blue-500" && "border-l-blue-500",
          iconColor === "text-blue-400" && "border-l-blue-400",
          iconColor === "text-blue-300" && "border-l-blue-300",
          iconColor === "text-gold-500" && "border-l-gold-400",
          iconColor === "text-purple-500" && "border-l-purple-500",
          iconColor === "text-green-500" && "border-l-green-500",
          iconColor === "text-red-500" && "border-l-red-500",
          iconColor === "text-gray-500" && "border-l-gray-400",
          iconColor === "text-gray-400" && "border-l-gray-400",
          iconColor === "text-success" && "border-l-green-500",
          iconColor === "text-error" && "border-l-red-500",
          iconColor === "text-warning" && "border-l-amber-500",
          iconColor === "text-info" && "border-l-blue-500",
          className
        )}
      >
        <div className="h-0.5 bg-gradient-to-r from-blue-500 to-gold-400" />
        <CardContent className="pt-3 sm:pt-5">
          <div className="flex items-start justify-between">
            <div className="min-w-0">
              <p className="text-xs sm:text-sm font-medium text-muted-foreground truncate">
                {title}
              </p>
              <p className="mt-1 font-mono text-2xl sm:text-3xl font-semibold tracking-tight">
                {prefix}
                {format ? format(animated) : animated.toLocaleString("en-IN")}
                {suffix}
              </p>
              {description && (
                <p className="mt-1 text-xs text-muted-foreground">
                  {description}
                </p>
              )}
            </div>
            {Icon && (
              <div className={cn(
                "rounded-lg p-1.5 sm:p-2",
                iconColor === "text-blue-500" && "bg-blue-50",
                iconColor === "text-blue-400" && "bg-blue-50",
                iconColor === "text-blue-300" && "bg-blue-50",
                iconColor === "text-gold-500" && "bg-gold-50",
                iconColor === "text-purple-500" && "bg-purple-50",
                iconColor === "text-green-500" && "bg-green-50",
                iconColor === "text-red-500" && "bg-red-50",
                iconColor === "text-gray-500" && "bg-gray-100",
                iconColor === "text-gray-400" && "bg-gray-100",
                iconColor === "text-success" && "bg-green-50",
                iconColor === "text-error" && "bg-red-50",
                iconColor === "text-warning" && "bg-amber-50",
                iconColor === "text-info" && "bg-blue-50",
                iconColor
              )}>
                <Icon className="h-3.5 w-3.5 sm:h-5 sm:w-5" />
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
