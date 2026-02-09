import Link from "next/link";
import { notFound } from "next/navigation";
import { getNoteById } from "@/lib/actions/notes";
import { NoteRenderer } from "@/app/components/NoteRenderer";

type Params = Promise<{ id: string }>;

export default async function NoteViewerPage({ params }: { params: Params }) {
  const { id } = await params;
  const note = await getNoteById(id);

  if (!note) {
    notFound();
  }

  return (
    <div className="max-w-3xl mx-auto">
      <Link
        href="/notes"
        className="text-blue-600 hover:underline mb-6 inline-block"
      >
        &larr; Back to notes
      </Link>

      <article>
        <h1 className="text-3xl font-bold mb-6">{note.title}</h1>
        <NoteRenderer contentJson={note.content_json} />
      </article>
    </div>
  );
}
