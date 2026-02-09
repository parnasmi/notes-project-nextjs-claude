import Link from "next/link";
import { notFound } from "next/navigation";
import { getNoteById } from "@/lib/actions/notes";
import { NoteForm } from "@/app/components/NoteForm";

type Params = Promise<{ id: string }>;

export default async function EditNotePage({ params }: { params: Params }) {
  const { id } = await params;
  const note = await getNoteById(id);

  if (!note) {
    notFound();
  }

  const initialContent = JSON.parse(note.content_json);

  return (
    <div className="max-w-3xl mx-auto">
      <Link
        href={`/notes/${id}`}
        className="text-blue-600 hover:underline mb-6 inline-block"
      >
        &larr; Back to note
      </Link>

      <h1 className="text-2xl font-bold mb-6">Edit Note</h1>

      <NoteForm
        mode="edit"
        noteId={id}
        initialTitle={note.title}
        initialContent={initialContent}
      />
    </div>
  );
}
