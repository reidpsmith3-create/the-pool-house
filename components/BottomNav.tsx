"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export default function BottomNav() {
  const pathname = usePathname();

  const isActive = (href: string) => {
    if (href === "/") {
      return pathname === "/";
    }

    return pathname.startsWith(href);
  };

  const navClass = (href: string) =>
    isActive(href) ? "text-amber-300" : "text-zinc-500";

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-zinc-800 bg-[#0d0f12]/95 px-4 py-3 backdrop-blur">
      <div className="mx-auto grid max-w-md grid-cols-4 text-center text-[11px] font-semibold">
        <Link href="/" className={navClass("/")}>
          Home
        </Link>

        <Link href="/pools" className={navClass("/pools")}>
          Pools
        </Link>

        <Link href="/live" className={navClass("/live")}>
          Live
        </Link>

        <Link href="/history" className={navClass("/history")}>
          History
        </Link>
      </div>
    </nav>
  );
}