import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const body = await req.json();

    // basic validation
    if (!body?.walletAddress || !body?.docHash || !body?.payload?.ciphertextB64) {
      return NextResponse.json({ error: "Bad request" }, { status: 400 });
    }

    // mock CID
    const cid = `bafy_mock_${Math.random().toString(16).slice(2)}_${Date.now()}`;

    return NextResponse.json(
      { cid, receivedAt: Math.floor(Date.now() / 1000) },
      { status: 200 }
    );
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
}
