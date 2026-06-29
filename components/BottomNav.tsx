"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

export default function BottomNav() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  const isActive = (href: string) => {
    if (href === "/") return pathname === "/";
    return pathname.startsWith(href);
  };

  const navClass = (href: string) =>
    isActive(href)
      ? "text-amber-300"
      : "text-zinc-500 hover:text-zinc-300";

  return (
    <>
      {open && (
        <>
          <button
            className="fixed inset-0 z-40 bg-black/40"
            onClick={() => setOpen(false)}
          />

          <div className="fixed bottom-20 left-1/2 z-50 w-[92%] max-w-md -translate-x-1/2 rounded-3xl border border-zinc-700 bg-zinc-900 p-4 shadow-2xl">
            <Link
              href="/me"
              onClick={() => setOpen(false)}
              className="block rounded-2xl px-4 py-3 font-bold hover:bg-zinc-800"
            >
              My Entries
            </Link>

            <Link
              href="/history"
              onClick={() => setOpen(false)}
              className="block rounded-2xl px-4 py-3 font-bold hover:bg-zinc-800"
            >
              History
            </Link>

            <Link
              href="/admin"
              onClick={() => setOpen(false)}
              className="block rounded-2xl px-4 py-3 font-bold hover:bg-zinc-800"
            >
              Admin
            </Link>
          </div>
        </>
      )}

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

          <button
            onClick={() => setOpen(true)}
            className="text-zinc-500 hover:text-zinc-300"
          >
            More
          </button>
        </div>
      </nav>
    </>
  );
}