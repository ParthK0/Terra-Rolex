export default function DashboardSkeleton() {
  return (
    <div className="min-h-screen bg-[#F7F9FB] animate-pulse">
      {/* Sky Hero Section Skeleton */}
      <div className="bg-sky-200/50 border-b border-sky-100 py-12 px-6 relative">
        <div className="max-w-6xl mx-auto space-y-8">
          {/* Welcome User Header */}
          <div className="space-y-2">
            <div className="h-8 w-64 bg-gray-300 rounded-lg" />
            <div className="h-4 w-48 bg-gray-300 rounded" />
          </div>

          {/* 3-Column Glassmorphic Cards Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Card 1: Circular Budget */}
            <div className="bg-white/40 border border-white/40 rounded-2xl p-5 h-64 flex flex-col justify-between items-center">
              <div className="h-4 w-32 bg-gray-300 rounded self-start" />
              <div className="w-28 h-28 rounded-full border-8 border-gray-300" />
              <div className="h-3 w-40 bg-gray-300 rounded" />
            </div>

            {/* Card 2: Status */}
            <div className="bg-white/40 border border-white/40 rounded-2xl p-5 h-64 flex flex-col justify-between">
              <div className="space-y-2">
                <div className="h-3 w-28 bg-gray-300 rounded" />
                <div className="h-5 w-40 bg-gray-300 rounded" />
              </div>
              <div className="space-y-2">
                <div className="h-3 w-full bg-gray-300 rounded" />
                <div className="h-2 w-full bg-gray-200 rounded-full" />
              </div>
              <div className="h-4 w-3/4 bg-gray-300 rounded" />
            </div>

            {/* Card 3: Interactive Map */}
            <div className="bg-white/40 border border-white/40 rounded-2xl p-5 h-64 flex flex-col justify-between">
              <div className="flex justify-between items-center">
                <div className="space-y-1">
                  <div className="h-2 w-16 bg-gray-300 rounded" />
                  <div className="h-3.5 w-24 bg-gray-300 rounded" />
                </div>
                <div className="h-4 w-12 bg-gray-300 rounded" />
              </div>
              <div className="flex-grow bg-gray-200/60 rounded-xl mt-3 flex items-center justify-center">
                <div className="h-6 w-6 rounded-full bg-gray-300" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Below-Fold Content Area */}
      <div className="max-w-6xl mx-auto px-6 py-10 space-y-10">
        
        {/* Stats and Quick Log Section */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Chart Card (col-span-8) */}
          <div className="lg:col-span-8 bg-white border border-gray-200/50 rounded-2xl p-6 h-72 space-y-4 shadow-sm">
            <div className="h-4 w-36 bg-gray-300 rounded" />
            <div className="flex justify-between items-end h-48 pt-2">
              <div className="space-y-2 w-1/3">
                <div className="h-10 w-24 bg-gray-300 rounded" />
                <div className="h-3 w-16 bg-gray-300 rounded" />
              </div>
              <div className="w-1/2 h-36 bg-gray-100 rounded-lg flex items-end p-2 gap-2">
                {Array.from({ length: 7 }).map((_, i) => (
                  <div key={i} className="flex-1 bg-gray-300 rounded-t" style={{ height: `${20 + Math.random() * 60}%` }} />
                ))}
              </div>
            </div>
          </div>

          {/* Quick Log Card (col-span-4) */}
          <div className="lg:col-span-4 bg-white border border-gray-200/50 rounded-2xl p-6 h-72 flex flex-col justify-between shadow-sm">
            <div className="space-y-4">
              <div className="h-4 w-24 bg-gray-300 rounded" />
              <div className="h-8 w-16 bg-gray-300 rounded" />
            </div>
            <div className="space-y-2">
              <div className="h-8 w-full bg-gray-300 rounded-xl" />
              <div className="h-8 w-full bg-gray-300 rounded-xl" />
            </div>
          </div>
        </div>

        {/* AI Recommendations Header */}
        <div className="space-y-2">
          <div className="h-5 w-48 bg-gray-300 rounded" />
          <div className="h-3 w-72 bg-gray-200 rounded" />
        </div>

        {/* AI Recommendations Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {Array.from({ length: 3 }).map((_, idx) => (
            <div key={idx} className="bg-white border border-gray-200/50 rounded-2xl p-5 h-44 flex flex-col justify-between shadow-sm">
              <div className="space-y-3">
                <div className="h-6 w-6 bg-gray-300 rounded-full" />
                <div className="h-4 w-full bg-gray-300 rounded" />
                <div className="h-3 w-5/6 bg-gray-200 rounded" />
              </div>
              <div className="h-3 w-1/3 bg-gray-300 rounded" />
            </div>
          ))}
        </div>

      </div>
    </div>
  );
}
