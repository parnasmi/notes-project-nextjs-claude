import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getNoteById } from '@/lib/actions/notes';
import { NoteRenderer } from '@/app/components/NoteRenderer';
import { DeleteNoteButton } from '@/app/components/DeleteNoteButton';

type Params = Promise<{ id: string }>;

export default async function NoteViewerPage({ params }: { params: Params }) {
  const { id } = await params;
  const note = await getNoteById(id);

  if (!note) {
    notFound();
  }

  return (
    <div className='max-w-3xl mx-auto'>
      <div className='flex items-center justify-between mb-6'>
        <Link href='/notes' className='text-blue-600 hover:underline'>
          &larr; Back to notes
        </Link>
        <div className='flex gap-2'>
          <Link
            href={`/notes/${id}/edit`}
            className='rounded-md bg-gray-600 px-4 py-2 text-white hover:bg-gray-700'
          >
            Edit
          </Link>
          <DeleteNoteButton noteId={id} />
        </div>
      </div>

      <article>
        <h1 className='text-3xl font-bold mb-6'>{note.title}</h1>
        <NoteRenderer contentJson={note.content_json} />
      </article>
    </div>
  );
}
