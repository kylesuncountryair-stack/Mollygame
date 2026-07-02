import { redirect } from "next/navigation";
import { getCurrentSession } from "@/lib/session";
import AuthForm from "@/components/AuthForm";

export default async function HomePage() {
  const session = await getCurrentSession();
  if (session) redirect("/dashboard");

  return (
    <main className="flex min-h-screen items-center justify-center px-4 py-12">
      <AuthForm />
    </main>
  );
}
