export default function AnalyticsLoading() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="h-6 w-24 bg-gray-200 rounded-lg" />

      <div className="h-9 w-52 bg-gray-100 rounded-xl" />

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="bg-white rounded-2xl border border-gray-100 p-4">
            <div className="h-4 w-16 bg-gray-100 rounded mb-3" />
            <div className="h-7 w-28 bg-gray-200 rounded" />
          </div>
        ))}
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 p-5">
        <div className="h-4 w-36 bg-gray-100 rounded mb-4" />
        <div className="h-40 bg-gray-50 rounded-xl" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-white rounded-2xl border border-gray-100 p-5">
          <div className="h-4 w-40 bg-gray-100 rounded mb-4" />
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-8 bg-gray-50 rounded" />
            ))}
          </div>
        </div>
        <div className="bg-white rounded-2xl border border-gray-100 p-5">
          <div className="h-4 w-24 bg-gray-100 rounded mb-4" />
          <div className="h-32 bg-gray-50 rounded-xl" />
        </div>
      </div>
    </div>
  );
}
