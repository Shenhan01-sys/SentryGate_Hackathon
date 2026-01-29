"use client";

import LottiePlayer from "./LottiePlayer";
import loading from "@/public/lottie/loading.json";

export default function LoadingLottie() {
  return (
    <div className="flex items-center gap-3">
      <div className="h-8 w-8">
        <LottiePlayer animationData={loading as unknown as object} />
      </div>
      <span className="text-sm text-gray-300">Checking subscription...</span>
    </div>
  );
}
