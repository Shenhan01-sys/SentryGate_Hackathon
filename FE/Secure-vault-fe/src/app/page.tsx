import AuthGate from "@/components/AuthGate";

export default function Home() {
  return (
    <main className="min-h-screen bg-black text-white pt-[env(safe-area-inset-top)] pb-[env(safe-area-inset-bottom)]">
      <div className="mx-auto max-w-3xl px-6 py-10">
        <div className="rounded-3xl border border-white/10 bg-white/5 p-8 shadow-2xl">
          <h1 className="text-2xl font-semibold">Secure Onchain Vault</h1>
          <p className="mt-2 text-sm text-gray-400">
            Scan dokumen → encrypt di device → upload terenkripsi → simpan CID onchain.
          </p>

          <AuthGate />
        </div>

        <p className="mt-6 text-xs text-gray-500">
          Base Sepolia • Mock status API • FE-only build
        </p>
      </div>
    </main>
  );
}
