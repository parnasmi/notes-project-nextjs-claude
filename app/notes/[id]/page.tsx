type Params = Promise<{ id: string }>;

export default async function NoteEditorPage({ params }: { params: Params }) {
  const { id } = await params;

  return (
    <div className="flex min-h-screen items-center justify-center p-8">
      <div className="text-center">
        <h1 className="text-2xl font-bold">Note Editor - {id}</h1>
        <p className="text-gray-600 mt-2">Editor will go here</p>
      </div>
    </div>
  );
}
