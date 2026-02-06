import Link from "next/link";

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-8">
      <h1 className="text-4xl font-bold mb-4">Notes App</h1>
      <p className="text-gray-600 mb-8">A local-first, self-hosted note-taking app</p>
      <div className="flex gap-4">
        <Link
          href="/auth"
          className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          Sign In
        </Link>
        <Link
          href="/auth?mode=signup"
          className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
        >
          Sign Up
        </Link>
      </div>
    </div>
  );
}
