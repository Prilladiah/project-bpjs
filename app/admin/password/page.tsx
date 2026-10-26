import PasswordForm from "@/components/passwordform";

export const metadata = { title: "Ubah password" };

export default function Password() {
  return (
    <div className="mx-auto flex min-h-[calc(100dvh-3.5rem)] w-full max-w-md flex-col items-center justify-center px-5 py-10 text-center">
      <h1 className="text-3xl font-extrabold">Ubah password</h1>
      <p className="mb-6 mt-1 text-sm text-muted">Password disimpan dalam bentuk terenkripsi (hash), bukan teks biasa.</p>
      <PasswordForm />
    </div>
  );
}