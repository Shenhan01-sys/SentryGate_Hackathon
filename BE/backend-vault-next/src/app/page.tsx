"use client";
import { useState, useEffect } from "react";
import { ethers } from "ethers";

declare global {
  interface Window {
    ethereum?: any;
  }
}

export default function VaultUI() {
  const [account, setAccount] = useState<string | null>(null);
  const [hasAccess, setHasAccess] = useState(false); // Cek apakah sudah bayar
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState("");
  const [myFiles, setMyFiles] = useState<any[]>([]);

  // 1. Cek Jaringan & Status Akses
const checkAccess = async (wallet: string) => {
  try {
    const provider = new ethers.BrowserProvider(window.ethereum);
    // Sesuaikan ABI dengan nama fungsi di Smart Contract kamu
    const abi = ["function verifyPayment(address user) external view returns (bool isActive, uint256 expiry, uint256 credits)"];
    const contract = new ethers.Contract(process.env.NEXT_PUBLIC_CONTRACT_ADDRESS!, abi, provider);

    // Gunakan staticCall untuk mendapatkan detail error jika terjadi revert
    const [isActive] = await contract.verifyPayment.staticCall(wallet);
    setHasAccess(isActive);
  } catch (err: any) {
    // Menampilkan alasan asli kenapa kontrak menolak panggilan (revert)
    console.error("Detail Penyebab Revert:", err.reason || "Fungsi tidak ditemukan atau require failed");
    setHasAccess(false);
  }
};

  const connectWallet = async () => {
    if (!window.ethereum) return alert("Silakan install MetaMask!");
    try {
      const provider = new ethers.BrowserProvider(window.ethereum);
      const accounts = await provider.send("eth_requestAccounts", []);
      setAccount(accounts[0]);
      await checkAccess(accounts[0]); // Langsung cek akses setelah konek
    } catch (err: any) {
      setStatus("Gagal Koneksi: " + err.message);
    }
  };

  // 2. Fungsi Pembayaran dengan MockIDRX (Approve + Pay)
  const handlePaymentIDRX = async () => {
    try {
      setLoading(true);
      const provider = new ethers.BrowserProvider(window.ethereum!);
      const signer = await provider.getSigner();
      
      const idrxAddress = process.env.NEXT_PUBLIC_MOCKIDRX_ADDRESS!;
      const vaultAddress = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS!;

      const erc20Abi = ["function approve(address spender, uint256 amount) public returns (bool)"];
      const vaultAbi = ["function paySubscription(uint256 planId) public"]; // Sesuaikan nama fungsi di kontrak Anda

      const idrxContract = new ethers.Contract(idrxAddress, erc20Abi, signer);
      const vaultContract = new ethers.Contract(vaultAddress, vaultAbi, signer);

      const price = ethers.parseUnits("1000", 18); // Contoh: Harga 1000 IDRX

      // Tahap 1: Approve Token
      setStatus("Menunggu Approve MockIDRX...");
      const approveTx = await idrxContract.approve(vaultAddress, price);
      await approveTx.wait();

      // Tahap 2: Bayar Langganan
      setStatus("Memproses Pembayaran ke SentryGate...");
      const payTx = await vaultContract.paySubscription(1); // Plan ID 1
      await payTx.wait();

      setStatus("Pembayaran Berhasil!");
      checkAccess(account!); // Refresh status akses
    } catch (err: any) {
      setStatus("Gagal Bayar: " + (err.reason || err.message));
    } finally {
      setLoading(false);
    }
  };

  // 3. Fungsi Upload & Fetch Database
  const handleUpload = async () => {
    if (!file || !account) return alert("Pilih file & koneksi wallet!");
    try {
      setLoading(true);
      setStatus("Sedang Mengunggah...");
      const formData = new FormData();
      formData.append("file", file);
      formData.append("wallet_address", account);

      const res = await fetch("/api/upload", { method: "POST", body: formData });
      const result = await res.json();
      
      if (res.status === 201) {
        setStatus(`Sukses! CID: ${result.ipfs_cid}`);
        fetchFiles(); // Refresh riwayat MySQL
      } else {
        setStatus(`Gagal: ${result.message}`);
      }
    } catch (err) {
      setStatus("Error saat upload");
    } finally {
      setLoading(false);
    }
  };

  const fetchFiles = async () => {
    if (!account) return;
    try {
      const res = await fetch(`/api/my-files?wallet=${account}`);
      const data = await res.json();
      setMyFiles(data);
    } catch (err) {
      console.error("Gagal ambil riwayat");
    }
  };

  useEffect(() => {
    if (account) fetchFiles();
  }, [account]);

  return (
    <main className="p-10 flex flex-col items-center gap-6 bg-slate-900 min-h-screen text-white">
      <h1 className="text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-500">
        Secure Vault x402
      </h1>
      
      {!account ? (
        <button onClick={connectWallet} className="bg-blue-600 hover:bg-blue-700 px-8 py-3 rounded-xl font-bold transition-all shadow-lg shadow-blue-500/20">
          Hubungkan MetaMask (Base Sepolia)
        </button>
      ) : (
        <div className="flex flex-col items-center gap-2">
          <div className="bg-slate-800 px-4 py-2 rounded-full border border-blue-500/50">
            <span className="text-green-400">●</span> {account.substring(0,6)}...{account.slice(-4)}
          </div>
          <p className={`text-sm ${hasAccess ? 'text-green-400' : 'text-yellow-500'}`}>
            Status Akses: {hasAccess ? "AKTIF ✓" : "PERLU AKTIVASI ✗"}
          </p>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full max-w-4xl">
        {/* Step 1: Payment (Hanya tampil jika belum punya akses) */}
        {!hasAccess && account && (
          <div className="bg-slate-800/50 p-6 rounded-2xl border border-yellow-500/30">
            <h2 className="text-xl font-semibold mb-4 text-yellow-300">1. Aktivasi Akses (IDRX)</h2>
            <p className="text-sm text-slate-400 mb-6">Gunakan MockIDRX untuk mengaktifkan izin upload.</p>
            <button onClick={handlePaymentIDRX} disabled={loading} className="bg-yellow-600 hover:bg-yellow-700 w-full py-3 rounded-xl font-bold disabled:opacity-50">
              Approve & Bayar IDRX
            </button>
          </div>
        )}

        {/* Step 2: Upload (Hanya tampil jika sudah punya akses) */}
        <div className={`bg-slate-800/50 p-6 rounded-2xl border border-slate-700 ${!hasAccess ? 'opacity-50 grayscale' : ''}`}>
          <h2 className="text-xl font-semibold mb-4 text-green-300">2. Simpan ke Vault</h2>
          <input type="file" disabled={!hasAccess} onChange={(e) => setFile(e.target.files?.[0] || null)} className="mb-4 w-full text-sm" />
          <button onClick={handleUpload} disabled={loading || !file || !hasAccess} className="bg-green-600 hover:bg-green-700 w-full py-3 rounded-xl font-bold disabled:opacity-50">
            Upload ke IPFS & Database
          </button>
        </div>
      </div>

      {status && <div className="w-full max-w-4xl bg-blue-900/30 border border-blue-500/30 p-4 rounded-xl text-center text-sm font-mono">{status}</div>}

      {/* Riwayat Table */}
      {account && (
        <div className="w-full max-w-4xl mt-10">
          <h3 className="text-xl font-bold mb-4">File Tersimpan di MySQL</h3>
          <div className="overflow-x-auto rounded-xl border border-slate-700">
            <table className="w-full text-left bg-slate-800/30">
              <thead className="bg-slate-800">
                <tr>
                  <th className="p-4 text-slate-300">Nama File</th>
                  <th className="p-4 text-slate-300">CID IPFS</th>
                  <th className="p-4 text-slate-300">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {myFiles.map((f, i) => (
                  <tr key={i} className="border-t border-slate-700 hover:bg-slate-700/30 transition-colors">
                    <td className="p-4">{f.file_name}</td>
                    <td className="p-4 text-xs font-mono text-slate-400">{f.ipfs_cid}</td>
                    <td className="p-4">
                      <a href={`https://gateway.pinata.cloud/ipfs/${f.ipfs_cid}`} target="_blank" className="text-blue-400 hover:underline">Buka</a>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </main>
  );
}