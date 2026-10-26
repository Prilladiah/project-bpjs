"use client";

export default function HapusButton({ id, nama, action }: { id: string; nama: string; action: (f: FormData) => Promise<void> }) {
  return (
    <form action={action} onSubmit={(e) => { if (!confirm(`Hapus pendaftar "${nama}" beserta berkasnya?`)) e.preventDefault(); }}>
      <input type="hidden" name="id" value={id} />
      <button className="text-sm font-semibold text-red-600 hover:underline">Hapus</button>
    </form>
  );
}