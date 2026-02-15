export default function ProductsLoading() {
  return (
    <div className="animate-pulse">
      <div className="h-6 w-24 bg-gray-200 rounded-lg mb-6" />
      <div className="flex items-center gap-3 mb-4">
        <div className="h-9 w-36 bg-gray-200 rounded-xl" />
        <div className="h-9 w-44 bg-gray-100 rounded-xl" />
      </div>
      <div className="space-y-2">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="flex items-center gap-3 bg-white rounded-xl border border-gray-100 px-4 py-3">
            <div className="w-12 h-12 rounded-lg bg-gray-100" />
            <div className="flex-1">
              <div className="h-4 w-32 bg-gray-100 rounded mb-1.5" />
              <div className="h-4 w-20 bg-gray-200 rounded" />
            </div>
            <div className="flex gap-1">
              <div className="w-8 h-8 bg-gray-50 rounded-lg" />
              <div className="w-8 h-8 bg-gray-50 rounded-lg" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
