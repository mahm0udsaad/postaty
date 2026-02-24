"use client";

import { motion } from "framer-motion";
import { Loader2 } from "lucide-react";
import type { PlatformDef } from "./platform-config";
import { PlatformIcon } from "./platform-icons";

export function PlatformCardSkeleton({ platform, index }: { platform: PlatformDef; index: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.08 }}
      className="rounded-2xl border border-card-border bg-surface-1 overflow-hidden h-full"
    >
      {/* Platform header */}
      <div className={`flex items-center gap-2 px-3 py-2 ${platform.headerBg} opacity-60`}>
        <div className={`${platform.headerText}`}><PlatformIcon id={platform.id} size={14} /></div>
        <span className={`text-xs font-bold ${platform.headerText} opacity-80`}>{platform.name}</span>
      </div>

      {/* Content skeleton */}
      <div className="p-3 space-y-3">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-full bg-surface-2 animate-pulse" />
          <div className="h-3 w-20 bg-surface-2 rounded animate-pulse" />
        </div>
        <div className="h-28 rounded-lg bg-surface-2 animate-pulse" />
        <div className="space-y-2">
          <div className="h-2.5 w-full bg-surface-2 rounded animate-pulse" />
          <div className="h-2.5 w-4/5 bg-surface-2 rounded animate-pulse" />
          <div className="h-2.5 w-3/5 bg-surface-2 rounded animate-pulse" />
        </div>
        <div className="flex gap-1.5">
          <div className="h-2 w-12 bg-surface-2 rounded animate-pulse" />
          <div className="h-2 w-10 bg-surface-2 rounded animate-pulse" />
          <div className="h-2 w-14 bg-surface-2 rounded animate-pulse" />
        </div>
      </div>

      {/* Loading indicator */}
      <div className="px-3 pb-3">
        <div className="flex items-center justify-center gap-2 py-2 text-xs text-muted">
          <Loader2 size={12} className="animate-spin" />
          <span>جاري كتابة المحتوى...</span>
        </div>
      </div>
    </motion.div>
  );
}
