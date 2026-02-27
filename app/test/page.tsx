"use client"

import { LoadingSlideshow } from "../components/loading-slideshow";

export default function TestPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-surface-0 px-4">
      <div className="w-full max-w-xl">
        <LoadingSlideshow />
      </div>
    </div>
  );
}