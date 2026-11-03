export function emailSiap() {
  return !!(process.env.APPS_SCRIPT_URL && process.env.APPS_SCRIPT_SECRET);
}

export async function kirimEmail(to: string[], subject: string, text: string, html: string) {
  const res = await fetch(process.env.APPS_SCRIPT_URL!, {
    method: "POST",
    headers: { "Content-Type": "text/plain;charset=utf-8" },
    body: JSON.stringify({ secret: process.env.APPS_SCRIPT_SECRET, to, subject, text, html }),
    redirect: "follow",
    signal: AbortSignal.timeout(20_000),
  });
  const body = await res.json().catch(() => null);
  if (!res.ok || !body?.ok) {
    throw new Error(
      body?.error ?? `Apps Script error ${res.status}. Cek akses deployment (Siapa saja) dan izin akun.`
    );
  }
}