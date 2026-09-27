export default function DashboardLoading() {
  return (
    <div className="w-full h-full p-8 flex flex-col gap-6 animate-pulse">
      {/* Header skeleton */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
        <div>
          <div className="h-8 w-48 bg-gray-200 rounded-md mb-2"></div>
          <div className="h-4 w-64 bg-gray-200 rounded-md"></div>
        </div>
        <div className="h-10 w-32 bg-gray-200 rounded-md"></div>
      </div>

      {/* Cards skeleton row */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm h-32 flex flex-col justify-between">
            <div className="h-4 w-24 bg-gray-200 rounded-md"></div>
            <div className="h-8 w-16 bg-gray-200 rounded-md mt-2"></div>
            <div className="h-4 w-32 bg-gray-100 rounded-md mt-4"></div>
          </div>
        ))}
      </div>

      {/* Main content area skeleton */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6">
        <div className="lg:col-span-2 bg-white p-6 rounded-xl border border-gray-100 shadow-sm h-96">
          <div className="h-6 w-32 bg-gray-200 rounded-md mb-6"></div>
          <div className="h-full w-full bg-gray-100 rounded-md"></div>
        </div>
        <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm h-96">
          <div className="h-6 w-32 bg-gray-200 rounded-md mb-6"></div>
          <div className="flex flex-col gap-4">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="flex items-center gap-3">
                <div className="h-10 w-10 bg-gray-200 rounded-full"></div>
                <div className="flex-1">
                  <div className="h-4 w-3/4 bg-gray-200 rounded-md mb-2"></div>
                  <div className="h-3 w-1/2 bg-gray-100 rounded-md"></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
