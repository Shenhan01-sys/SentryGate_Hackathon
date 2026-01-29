"use client";

import LottiePlayer from "./LottiePlayer";
import pay from "@/public/lottie/payment-required.json";

export default function PaymentRequiredLottie() {
  return (
    <div className="mx-auto h-36 w-36">
      <LottiePlayer animationData={pay as unknown as object} />
    </div>
  );
}
