import { requireSession } from "@/lib/session";
import Navbar from "@/components/Navbar";

export default async function Layout({ children }: { children: React.ReactNode }) {
  const session = await requireSession();
  return (
    <>
      <Navbar name={session.name} role={session.role} />
      <main className="mx-auto max-w-6xl px-6 py-8">{children}</main>
    </>
  );
}
