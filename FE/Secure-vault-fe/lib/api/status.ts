export type PaymentStatus =
  | { status: "active"; expiry: number }
  | { status: "inactive" };

function getStatusUrl(address: string) {
  const useMock = process.env.NEXT_PUBLIC_USE_MOCK_API === "true";
  if (useMock) return `/api/status/${address}`;

  const base = process.env.NEXT_PUBLIC_BACKEND_URL;
  if (!base) return `/api/status/${address}`; // fallback
  return `${base}/status/${address}`;
}

export async function fetchPaymentStatus(address: string): Promise<PaymentStatus> {
  const res = await fetch(getStatusUrl(address), {
    method: "GET",
    cache: "no-store",
  });

  if (!res.ok) {
    throw new Error(`Status fetch failed: ${res.status}`);
  }

  return res.json();
}
