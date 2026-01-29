"use client";

import Lottie from "lottie-react";

type Props = {
  animationData: object;
  className?: string;
  loop?: boolean;
};

export default function LottiePlayer({ animationData, className, loop = true }: Props) {
  return <Lottie animationData={animationData} loop={loop} className={className} />;
}
