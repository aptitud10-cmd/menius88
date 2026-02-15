export default function OrdersLoading() {
  return (
    <div className="space-y-5 animate-pulse">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="h-6 w-24 bg-gray-200 rounded-lg" />
          <div className="h-4 w-40 bg-gray-100 rounded-lg mt-1.5" />
        </div>
        <div className="flex gap-2">
          <div className="h-9 w-9 bg-gray-100 rounded-lg" />
          <div className="h-9 w-40 bg-gray-100 rounded-lg" />
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-3">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="rounded-xl border border-gray-100 bg-white p-3">
            <div className="h-3 w-16 bg-gray-100 rounded mb-2" />
            <div className="h-6 w-12 bg-gray-200 rounded" />
          </div>
        ))}
      </div>

      {/* Kanban columns */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[...Array(4)].map((_, col) => (
          <div key={col}>
            <div className="flex items-center gap-2 mb-3 pb-2 border-b border-gray-100">
              <div className="w-6 h-6 bg-gray-100 rounded-lg" />
              <div className="h-4 w-20 bg-gray-100 rounded" />
            </div>
            <div className="space-y-2.5">
              {[...Array(col === 0 ? 3 : col === 2 ? 2 : 1)].map((_, i) => (
                <div key={i} className="bg-white rounded-xl border border-gray-100 p-3.5">
                  <div className="h-4 w-16 bg-gray-100 rounded mb-2" />
                  <div className="h-3 w-24 bg-gray-50 rounded mb-2" />
                  <div className="flex gap-1 mb-2">
                    <div className="h-5 w-20 bg-gray-50 rounded" />
                    <div className="h-5 w-16 bg-gray-50 rounded" />
                  </div>
                  <div className="h-8 bg-gray-50 rounded-lg" />
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
