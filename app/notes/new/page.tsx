import { requireAuth } from '@/lib/session';
import { NoteForm } from '@/app/components/NoteForm';

export default async function NewNotePage() {
  await requireAuth();

  return (
    <div>
      <h1 className='text-2xl font-bold mb-6'>New Note</h1>
      <NoteForm />
    </div>
  );
}
