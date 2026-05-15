export default function BookingsLoading() {
  return (
    <div className="min-h-screen flex flex-col bg-[#FAFAFA]">
      {/* Header skeleton */}
      <div className="bg-[#0046C1] pt-12 pb-10 px-4">
        <div className="container-page space-y-3">
          <div className="h-8 w-48 bg-white/20 rounded animate-pulse" />
          <div className="h-4 w-64 bg-white/20 rounded animate-pulse" />
        </div>
      </div>

      {/* Stats skeleton */}
      <div className="container-page -mt-6 pb-8">
        <div className="grid grid-cols-3 gap-4 mb-6">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="bg-white rounded-xl border border-[#DDDDDD] p-4">
              <div className="h-3 w-16 bg-[#D9EEFF] rounded animate-pulse mb-2" />
              <div className="h-7 w-12 bg-[#D9EEFF] rounded animate-pulse" />
            </div>
          ))}
        </div>

        {/* Filter tabs */}
        <div className="flex gap-2 mb-6">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-9 w-24 bg-[#D9EEFF] rounded-xl animate-pulse" />
          ))}
        </div>

        {/* Booking cards */}
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <div
              key={i}
              className="bg-white rounded-xl border border-[#DDDDDD] overflow-hidden"
            >
              <div className="flex flex-col sm:flex-row">
                {/* Image */}
                <div className="sm:w-48 h-40 sm:h-auto bg-[#D9EEFF] animate-pulse flex-shrink-0" />
                {/* Content */}
                <div className="flex-1 p-5 space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="space-y-2 flex-1">
                      <div className="h-4 w-64 bg-[#D9EEFF] rounded animate-pulse" />
                      <div className="h-3 w-32 bg-[#D9EEFF] rounded animate-pulse" />
                    </div>
                    <div className="h-6 w-20 bg-[#D9EEFF] rounded-full animate-pulse flex-shrink-0" />
                  </div>
                  <div className="flex gap-4">
                    {[...Array(4)].map((_, j) => (
                      <div key={j} className="h-3 w-20 bg-[#D9EEFF] rounded animate-pulse" />
                    ))}
                  </div>
                  <div className="flex items-center justify-between pt-2">
                    <div className="h-6 w-32 bg-[#D9EEFF] rounded animate-pulse" />
                    <div className="h-9 w-32 bg-[#D9EEFF] rounded-xl animate-pulse" />
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
