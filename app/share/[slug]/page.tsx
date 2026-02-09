type Params = Promise<{ slug: string }>;

export default async function SharedNotePage({ params }: { params: Params }) {
  const { slug } = await params;

  return (
    <div className='flex min-h-screen items-center justify-center p-8'>
      <div className='text-center'>
        <h1 className='text-2xl font-bold'>Shared Note - {slug}</h1>
        <p className='text-gray-600 mt-2'>Read-only note content will appear here</p>
      </div>
    </div>
  );
}
