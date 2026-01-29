import VaultGallery from "@/components/VaultGallery";
import Link from "next/link";

export default function VaultPage() {
  return (
    <main className="min-h-screen bg-black text-white pt-[env(safe-area-inset-top)] pb-[env(safe-area-inset-bottom)]">
      <div className="mx-auto max-w-3xl px-4 py-6">
        <div className="flex items-center justify-between">
          <Link
            href="/"
            className="rounded-xl border border-white/15 px-3 py-2 text-sm text-white"
          >
            ← Back
          </Link>
          <div className="text-sm text-gray-400">Vault</div>
          <div className="w-[72px]" />
        </div>

        <div className="mt-4 rounded-3xl border border-white/10 bg-white/5 p-4 shadow-2xl">
          <h1 className="text-lg font-semibold">Vault Gallery</h1>
          <p className="mt-1 text-sm text-gray-400">
            Dokumen tersimpan dalam bentuk terenkripsi. Klik item untuk decrypt
            (signature diperlukan).
          </p>

          <div className="mt-4">
            <VaultGallery />
          </div>
        </div>
      </div>
    </main>
  );
}
