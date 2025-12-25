// View-specific skeleton loaders for improved loading UX
import { Skeleton } from "./Skeleton";

/**
 * Dashboard skeleton - shows placeholder for cycles, cards, and sections
 */
export function DashboardSkeleton() {
  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Cycles Header */}
      <div className="flex items-center gap-3 mb-4">
        <Skeleton variant="circle" className="w-8 h-8" />
        <Skeleton className="h-6 w-40" />
      </div>

      {/* Cycle Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="bg-slate-800/30 rounded-xl p-4 border border-slate-700/50"
          >
            <Skeleton className="h-4 w-24 mb-2" />
            <Skeleton className="h-8 w-16 mb-3" />
            <Skeleton className="h-2 w-full rounded-full" />
          </div>
        ))}
      </div>

      {/* Content Sections */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {Array.from({ length: 2 }).map((_, i) => (
          <div
            key={i}
            className="bg-slate-800/30 rounded-xl p-4 border border-slate-700/50"
          >
            <Skeleton className="h-5 w-32 mb-4" />
            <div className="space-y-2">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-4 w-1/2" />
            </div>
          </div>
        ))}
      </div>

      {/* Mission Section */}
      <div className="bg-slate-800/30 rounded-xl p-4 border border-slate-700/50">
        <Skeleton className="h-6 w-40 mb-4" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="bg-slate-900/30 rounded-lg p-3">
              <Skeleton className="h-3 w-16 mb-2" />
              <Skeleton className="h-5 w-28 mb-1" />
              <Skeleton className="h-4 w-20" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/**
 * Codex/List skeleton - shows placeholder for searchable item lists
 */
export function CodexSkeleton() {
  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Skeleton variant="circle" className="w-8 h-8" />
        <Skeleton className="h-7 w-32" />
      </div>

      {/* Search + Filters */}
      <div className="flex flex-wrap gap-4">
        <Skeleton className="h-12 flex-1 min-w-[200px] rounded-lg" />
        <Skeleton className="h-12 w-40 rounded-lg" />
        <Skeleton className="h-12 w-32 rounded-lg" />
      </div>

      {/* Stats Bar */}
      <div className="flex gap-4">
        <Skeleton className="h-8 w-24 rounded-lg" />
        <Skeleton className="h-8 w-32 rounded-lg" />
      </div>

      {/* Item List */}
      <div className="space-y-2">
        {Array.from({ length: 8 }).map((_, i) => (
          <div
            key={i}
            className="flex items-center gap-3 p-3 bg-slate-800/30 rounded-lg border border-slate-700/50"
          >
            <Skeleton variant="circle" className="w-10 h-10" />
            <div className="flex-1">
              <Skeleton className="h-4 w-1/3 mb-2" />
              <Skeleton className="h-3 w-1/4" />
            </div>
            <Skeleton className="h-5 w-5" />
          </div>
        ))}
      </div>
    </div>
  );
}

/**
 * Mastery skeleton - shows placeholder for progress bars and item grids
 */
export function MasterySkeleton() {
  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* MR Overview Card */}
      <div className="bg-gradient-to-r from-cyan-900/30 to-slate-900/50 rounded-xl border border-cyan-700/30 p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <Skeleton variant="circle" className="w-7 h-7" />
            <Skeleton className="h-6 w-48" />
          </div>
          <div className="text-right">
            <Skeleton className="h-10 w-16 mb-1" />
            <Skeleton className="h-4 w-28" />
          </div>
        </div>
        <Skeleton className="h-3 w-full rounded-full mb-4" />
        <div className="grid grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="bg-slate-800/50 rounded-lg p-3 text-center">
              <Skeleton className="h-3 w-16 mx-auto mb-2" />
              <Skeleton className="h-5 w-12 mx-auto" />
            </div>
          ))}
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="flex gap-2">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-10 w-28 rounded-lg" />
        ))}
      </div>

      {/* Content Area */}
      <div className="bg-slate-900/50 rounded-xl border border-slate-700/30 p-6">
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-2 mb-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-16 rounded-lg" />
          ))}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
          {Array.from({ length: 9 }).map((_, i) => (
            <Skeleton key={i} className="h-16 rounded-lg" />
          ))}
        </div>
      </div>
    </div>
  );
}

/**
 * Generic section skeleton for simpler views
 */
export function SectionSkeleton() {
  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Skeleton variant="circle" className="w-7 h-7" />
        <Skeleton className="h-6 w-40" />
      </div>

      {/* Content Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <div
            key={i}
            className="bg-slate-800/30 rounded-lg p-4 border border-slate-700/50"
          >
            <Skeleton className="h-5 w-2/3 mb-3" />
            <Skeleton className="h-4 w-full mb-2" />
            <Skeleton className="h-4 w-3/4 mb-2" />
            <Skeleton className="h-3 w-1/2" />
          </div>
        ))}
      </div>
    </div>
  );
}
