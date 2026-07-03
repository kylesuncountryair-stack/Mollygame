import Link from "next/link";
import { requireAdmin } from "@/lib/session";
import Navbar from "@/components/Navbar";
import { LayoutGrid, HelpCircle, Users } from "lucide-react";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await requireAdmin();

  return (
    <>
      <Navbar name={session.name} role={session.role} />
      <div className="mx-auto flex max-w-[1600px] gap-8 px-6 py-8">
        <aside className="w-48 shrink-0 space-y-1">
          <Link href="/admin" className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-ash-300 hover:bg-ash-900 hover:text-ash-100">
            <LayoutGrid className="h-4 w-4" /> Overview
          </Link>
          <Link href="/admin/questions" className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-ash-300 hover:bg-ash-900 hover:text-ash-100">
            <HelpCircle className="h-4 w-4" /> Questions
          </Link>
          <Link href="/admin/players" className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-ash-300 hover:bg-ash-900 hover:text-ash-100">
            <Users className="h-4 w-4" /> Players
          </Link>
        </aside>
        <main className="flex-1 space-y-6">{children}</main>
      </div>
    </>
  );
}
