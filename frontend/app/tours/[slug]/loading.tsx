export default function TourDetailLoading() {
  return (
    <div className="min-h-screen flex flex-col bg-[#FAFAFA]">
      {/* Header skeleton */}
      <div className="bg-[#0046C1] pt-12 pb-10 px-4">
        <div className="container-page space-y-3">
          <div className="h-9 w-80 bg-white/20 rounded animate-pulse" />
          <div className="flex items-center gap-4">
            <div className="h-4 w-24 bg-white/20 rounded animate-pulse" />
            <div className="h-4 w-32 bg-white/20 rounded animate-pulse" />
            <div className="h-4 w-20 bg-white/20 rounded animate-pulse" />
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="container-page py-8">
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Left */}
          <div className="lg:col-span-2 space-y-6">
            {/* Image */}
            <div className="h-80 bg-[#DDDDDD]/30 rounded-xl animate-pulse" />
            {/* Thumbnail strip */}
            <div className="flex gap-2">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="w-20 h-16 bg-[#D9EEFF] rounded-lg animate-pulse" />
              ))}
            </div>
            {/* Info tabs */}
            <div className="bg-white rounded-xl border border-[#DDDDDD] overflow-hidden">
              <div className="flex border-b border-[#DDDDDD] px-6">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="h-12 px-4 flex items-center">
                    <div className="h-4 w-20 bg-[#D9EEFF] rounded animate-pulse" />
                  </div>
                ))}
              </div>
              <div className="p-6 space-y-3">
                {[...Array(6)].map((_, i) => (
                  <div key={i} className="h-4 bg-[#D9EEFF] rounded animate-pulse" style={{ width: `${70 + Math.random() * 30}%` }} />
                ))}
              </div>
            </div>
          </div>

          {/* Right - Booking card */}
          <div className="space-y-4">
            {/* Price card */}
            <div className="bg-white rounded-xl border border-[#DDDDDD] overflow-hidden">
              <div className="bg-[#0046C1] p-5">
                <div className="h-7 w-40 bg-white/20 rounded animate-pulse" />
              </div>
              <div className="p-5 space-y-4">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="flex gap-3">
                    <div className="w-10 h-10 bg-[#D9EEFF] rounded-xl animate-pulse flex-shrink-0" />
                    <div className="flex-1 space-y-2">
                      <div className="h-3 w-20 bg-[#D9EEFF] rounded animate-pulse" />
                      <div className="h-4 w-full bg-[#D9EEFF] rounded animate-pulse" />
                    </div>
                  </div>
                ))}
                <div className="h-12 bg-[#0046C1]/20 rounded-xl animate-pulse" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
