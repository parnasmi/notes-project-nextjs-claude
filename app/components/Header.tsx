import Link from "next/link";
import { getSession } from "@/lib/session";
import { LogoutButton } from "./LogoutButton";

export async function Header() {
  const session = await getSession();

  return (
    <header className="border-b border-gray-200 bg-white">
      <nav className="mx-auto flex max-w-4xl items-center justify-between px-4 py-3">
        <Link href="/notes" className="text-xl font-bold">
          NextNotes
        </Link>
        {session?.user && (
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-600">{session.user.email}</span>
            <LogoutButton />
          </div>
        )}
      </nav>
    </header>
  );
}
