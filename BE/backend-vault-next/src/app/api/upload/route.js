import { ethers } from "ethers";
import axios from "axios";
import { NextResponse } from "next/server";
import db from "@/lib/db"; // Import koneksi manual kita

export async function POST(req) {
    try {
        const formData = await req.formData();
        const file = formData.get("file");
        const walletAddress = formData.get("wallet_address");

        if (!file || !walletAddress) {
            return NextResponse.json({ message: "Data tidak lengkap" }, { status: 400 });
        }

        // 1. Verifikasi Onchain (x402)
        const provider = new ethers.JsonRpcProvider(process.env.BASE_RPC_URL);
        const abi = ["function accessStatus(address user) view returns (bool canUpload, bool, uint256, uint32)"];
        const contract = new ethers.Contract(process.env.VAULT_CONTRACT_ADDRESS, abi, provider);

        const [canUpload] = await contract.accessStatus(walletAddress);

        if (!canUpload) {
            return NextResponse.json({ message: "Akses Ditolak: Belum Bayar" }, { status: 402 });
        }

        // 2. Upload ke Pinata IPFS
        const pinataFormData = new FormData();
        pinataFormData.append("file", file);

        const pinataRes = await axios.post("https://api.pinata.cloud/pinning/pinFileToIPFS", pinataFormData, {
            headers: { Authorization: `Bearer ${process.env.PINATA_JWT}` },
        });

        const cid = pinataRes.data.IpfsHash;

        // 3. Simpan ke Database secara MANUAL (SQL Raw Query)
        const query = "INSERT INTO filemetadata (wallet_address, file_name, ipfs_cid) VALUES (?, ?, ?)";
        const values = [walletAddress, file.name, cid];

        const [result] = await db.execute(query, values);

        return NextResponse.json({
            message: "Berhasil disimpan secara manual ke DB & IPFS!",
            db_id: result.insertId, // Mendapatkan ID yang baru saja dibuat
            ipfs_cid: cid
        }, { status: 201 });

    } catch (error) {
        console.error("Database/Server Error:", error);
        return NextResponse.json({ 
            message: "Gagal memproses", 
            error: error.message 
        }, { status: 500 });
    }
}