import { NextResponse } from "next/server";

export async function GET(
  _req: Request,
  { params }: { params: { address: string } }
) {
  const address = params.address?.toLowerCase();

  // Mock logic:
  // - alamat yang mengandung "bad" => inactive
  // - lainnya => active (30 hari)
  const isInactive = address?.includes("bad");

  if (isInactive) {
    return NextResponse.json({ status: "inactive" }, { status: 200 });
  }

  const now = Math.floor(Date.now() / 1000);
  const expiry = now + 30 * 24 * 60 * 60;

  return NextResponse.json(
    { status: "active", expiry },
    { status: 200 }
  );
}
