import { requireAuth } from "@/lib/session";

export default async function NotesPage() {
  await requireAuth();

  return (
    <div className="flex min-h-screen items-center justify-center p-8">
      <div className="text-center">
        <h1 className="text-2xl font-bold">Notes List</h1>
        <p className="text-gray-600 mt-2">Your notes will appear here</p>
      </div>
    </div>
  );
}
