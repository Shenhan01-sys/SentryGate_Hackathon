import { NextResponse } from "next/server";
import db from "@/lib/db"; // Memanggil koneksi manual mysql2

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const wallet = searchParams.get("wallet");

    if (!wallet) {
      return NextResponse.json({ message: "Wallet tidak ditemukan" }, { status: 400 });
    }

    // Mengambil data berdasarkan wallet user
    const [rows] = await db.execute(
      "SELECT * FROM filemetadata WHERE wallet_address = ? ORDER BY created_at DESC",
      [wallet]
    );

    return NextResponse.json(rows);
  } catch (error) {
    console.error("Database Error:", error);
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}