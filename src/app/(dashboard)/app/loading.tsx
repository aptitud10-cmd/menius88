export default function DashboardLoading() {
  return (
    <div className="space-y-6 animate-pulse">
      {/* Header skeleton */}
      <div className="flex items-center justify-between">
        <div>
          <div className="h-6 w-32 bg-gray-200 rounded-lg" />
          <div className="h-4 w-48 bg-gray-100 rounded-lg mt-2" />
        </div>
        <div className="h-9 w-24 bg-gray-200 rounded-lg" />
      </div>

      {/* Stats skeleton */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="rounded-2xl border border-gray-100 bg-white p-4">
            <div className="h-4 w-20 bg-gray-100 rounded mb-3" />
            <div className="h-7 w-28 bg-gray-200 rounded" />
          </div>
        ))}
      </div>

      {/* Content skeleton */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-100 p-5">
          <div className="h-4 w-40 bg-gray-100 rounded mb-4" />
          <div className="h-32 bg-gray-50 rounded-xl" />
        </div>
        <div className="bg-white rounded-2xl border border-gray-100 p-5">
          <div className="h-4 w-28 bg-gray-100 rounded mb-4" />
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-10 bg-gray-50 rounded-xl" />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
