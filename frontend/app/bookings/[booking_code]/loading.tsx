import { Spinner } from "@/components/ui/spinner";

export default function BookingDetailLoading() {
  return (
    <div className="min-h-screen flex flex-col bg-[#FAFAFA]">
      {/* Header skeleton */}
      <div className="bg-[#0046C1] pt-12 pb-10 px-4">
        <div className="container-page">
          {/* Back link skeleton */}
          <div className="h-4 w-32 bg-white/20 rounded mb-6 animate-pulse" />
          {/* Title skeleton */}
          <div className="flex items-center gap-3 mb-2">
            <div className="h-8 w-64 bg-white/20 rounded animate-pulse" />
            <div className="h-6 w-24 bg-white/20 rounded-full animate-pulse" />
          </div>
          {/* Code skeleton */}
          <div className="h-4 w-48 bg-white/20 rounded animate-pulse" />
        </div>
      </div>

      {/* Content skeleton */}
      <div className="container-page py-8">
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Left column */}
          <div className="lg:col-span-2 space-y-6">
            {/* Image skeleton */}
            <div className="h-64 bg-[#DDDDDD]/30 rounded-xl animate-pulse" />
            {/* Tour info card */}
            <div className="bg-white rounded-xl border border-[#DDDDDD] p-6">
              <div className="h-5 w-32 bg-[#DDDDDD]/50 rounded mb-4 animate-pulse" />
              <div className="grid grid-cols-2 gap-4">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="flex items-start gap-3">
                    <div className="w-10 h-10 bg-[#D9EEFF] rounded-xl animate-pulse" />
                    <div className="space-y-2 flex-1">
                      <div className="h-3 w-20 bg-[#D9EEFF] rounded animate-pulse" />
                      <div className="h-4 w-28 bg-[#D9EEFF] rounded animate-pulse" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
            {/* Contact info card */}
            <div className="bg-white rounded-xl border border-[#DDDDDD] p-6">
              <div className="h-5 w-32 bg-[#DDDDDD]/50 rounded mb-4 animate-pulse" />
              <div className="space-y-3">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <div className="w-4 h-4 bg-[#D9EEFF] rounded animate-pulse" />
                    <div className="space-y-1">
                      <div className="h-3 w-16 bg-[#D9EEFF] rounded animate-pulse" />
                      <div className="h-4 w-40 bg-[#D9EEFF] rounded animate-pulse" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right column */}
          <div className="space-y-6">
            {/* Payment card */}
            <div className="bg-white rounded-xl border border-[#DDDDDD] overflow-hidden">
              <div className="h-12 bg-[#0046C1] animate-pulse" />
              <div className="p-6 space-y-3">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="flex justify-between">
                    <div className="h-4 w-24 bg-[#D9EEFF] rounded animate-pulse" />
                    <div className="h-4 w-20 bg-[#D9EEFF] rounded animate-pulse" />
                  </div>
                ))}
                <div className="border-t border-[#DDDDDD] pt-3 flex justify-between">
                  <div className="h-5 w-20 bg-[#D9EEFF] rounded animate-pulse" />
                  <div className="h-6 w-28 bg-[#D9EEFF] rounded animate-pulse" />
                </div>
              </div>
            </div>
            {/* Actions card */}
            <div className="bg-white rounded-xl border border-[#DDDDDD] p-6">
              <div className="h-5 w-24 bg-[#DDDDDD]/50 rounded mb-3 animate-pulse" />
              <div className="space-y-2">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="h-10 bg-[#D9EEFF] rounded-xl animate-pulse" />
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
