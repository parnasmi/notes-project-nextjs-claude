import { Header } from "@/app/components/Header";

export default function NotesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <Header />
      <main className="mx-auto max-w-4xl px-4 py-8">{children}</main>
    </>
  );
}
