import { notFound } from 'next/navigation';
import { getSharedNote } from '@/lib/actions/notes';
import { NoteRenderer } from '@/app/components/NoteRenderer';

type Params = Promise<{ slug: string }>;

export default async function SharedNotePage({ params }: { params: Params }) {
  const { slug } = await params;
  const note = await getSharedNote(slug);

  if (!note) {
    notFound();
  }

  return (
    <div className='max-w-3xl mx-auto p-8'>
      <p className='text-sm text-gray-500 mb-4'>Shared Note</p>
      <article>
        <h1 className='text-3xl font-bold mb-6'>{note.title}</h1>
        <NoteRenderer contentJson={note.content_json} />
      </article>
    </div>
  );
}
