"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import {
  LogOut,
  ChevronDown,
  LayoutDashboard,
  TrendingUp,
  Building2,
  Users,
  FileDown,
  KeyRound,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { navItems } from "@/config/site";
import type { Role } from "@/types/auth";
import { cn } from "@/lib/utils";

const NAV_ICONS: Record<string, typeof LayoutDashboard> = {
  "/dashboard": LayoutDashboard,
  "/dashboard/ctc": TrendingUp,
  "/dashboard/companies": Building2,
  "/dashboard/students": Users,
  "/dashboard/export": FileDown,
};

export function DashboardNav({
  userName,
  userEmail,
  userRole,
  isAuthenticated,
}: {
  userName: string;
  userEmail: string;
  userRole: Role;
  isAuthenticated: boolean;
}) {
  const pathname = usePathname();

  const visibleItems = navItems.filter(
    (item) => !item.adminOnly || userRole === "admin"
  );

  function isActive(href: string) {
    return (
      pathname === href ||
      (href !== "/dashboard" && pathname.startsWith(href))
    );
  }

  return (
    <>
      {/* Top nav bar */}
      <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-6">
            <Link href="/dashboard" className="flex items-center gap-2">
              <Image
                src="/logo_blue.png"
                alt="SNU Chennai"
                width={40}
                height={40}
                priority
              />
              <div className="flex items-center gap-1.5">
                <span className="font-heading text-base sm:text-xl font-semibold text-blue-500">
                  Placement Dashboard
                </span>
                <span className="ml-1 text-xs text-muted-foreground hidden sm:inline">
                  Batch 2022-26
                </span>
              </div>
            </Link>

            {/* Desktop nav links */}
            <div className="hidden items-center gap-1 md:flex">
              {visibleItems.map((item) => {
                const Icon = NAV_ICONS[item.href];
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      "flex items-center gap-1.5 rounded-md border px-3 py-1.5 text-sm font-medium transition-all duration-150",
                      isActive(item.href)
                        ? "border-blue-500/20 bg-blue-500 text-white shadow-sm"
                        : "border-transparent text-gray-600 hover:border-gray-200 hover:bg-gray-50 hover:text-gray-900"
                    )}
                  >
                    {Icon && <Icon className="h-4 w-4" />}
                    {item.label}
                  </Link>
                );
              })}
            </div>
          </div>

          {/* User menu */}
          {!isAuthenticated ? (
            <Button asChild variant="outline" size="sm" className="gap-2">
              <Link href="/login">
                <KeyRound className="h-4 w-4" />
                <span className="hidden sm:inline">Sign in for Admin</span>
                <span className="sm:hidden">Sign in</span>
              </Link>
            </Button>
          ) : (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="gap-2">
                  <div className="flex h-7 w-7 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-blue-700 text-xs font-medium text-white">
                    {userName.charAt(0).toUpperCase()}
                  </div>
                  <span className="hidden text-sm sm:inline">{userName}</span>
                  <ChevronDown className="h-4 w-4 text-gray-400" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <div className="px-2 py-1.5">
                  <p className="text-sm font-medium">{userName}</p>
                  <p className="text-xs text-muted-foreground">{userEmail}</p>
                  <Badge
                    variant={userRole === "admin" ? "default" : "secondary"}
                    className="mt-1"
                  >
                    {userRole === "admin" ? "Admin" : "Viewer"}
                  </Badge>
                </div>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={() => signOut({ callbackUrl: "/login" })}
                  className="text-error"
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  Sign out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
        {/* Gradient accent bar */}
        <div className="h-[3px] bg-gradient-to-r from-blue-500 to-gold-400" />
      </nav>

      {/* Mobile bottom tab bar */}
      <div className="fixed bottom-0 left-0 right-0 z-50 bg-white/90 backdrop-blur-xl md:hidden">
        {/* Gradient top border */}
        <div className="h-[3px] bg-gradient-to-r from-blue-500 to-gold-400" />
        <div className="flex items-center justify-around py-1">
          {visibleItems.slice(0, 5).map((item) => {
            const Icon = NAV_ICONS[item.href] ?? LayoutDashboard;
            const active = isActive(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex flex-col items-center gap-0.5 px-2 py-1.5 text-xs transition-colors",
                  active
                    ? "text-blue-500 bg-blue-50 rounded-lg"
                    : "text-gray-500"
                )}
              >
                <Icon className="h-5 w-5" />
                <span className="truncate max-w-[60px]">
                  {item.label.split(" ")[0]}
                </span>
              </Link>
            );
          })}
        </div>
      </div>
    </>
  );
}
