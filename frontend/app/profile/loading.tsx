import { Spinner } from "@/components/ui/spinner";

export default function ProfileLoading() {
  return (
    <div className="min-h-screen flex flex-col bg-[#FAFAFA]">
      {/* Header skeleton */}
      <div className="bg-[#0046C1] pt-12 pb-20 px-4">
        <div className="container-page">
          <div className="flex items-end gap-6">
            {/* Avatar */}
            <div className="w-24 h-24 rounded-full bg-white/20 animate-pulse flex-shrink-0" />
            {/* Info */}
            <div className="pb-1 space-y-2">
              <div className="h-8 w-48 bg-white/20 rounded animate-pulse" />
              <div className="flex items-center gap-3">
                <div className="h-4 w-40 bg-white/20 rounded animate-pulse" />
                <div className="h-5 w-24 bg-white/20 rounded-full animate-pulse" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Content skeleton */}
      <div className="container-page -mt-10 pb-16">
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Left */}
          <div className="lg:col-span-2 space-y-6">
            {/* Profile card */}
            <div className="bg-white rounded-xl border border-[#DDDDDD] overflow-hidden">
              <div className="flex items-center justify-between px-6 py-4 border-b border-[#DDDDDD]">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 bg-[#D9EEFF] rounded-xl animate-pulse" />
                  <div className="space-y-2">
                    <div className="h-4 w-32 bg-[#D9EEFF] rounded animate-pulse" />
                    <div className="h-3 w-40 bg-[#D9EEFF] rounded animate-pulse" />
                  </div>
                </div>
                <div className="h-8 w-24 bg-[#D9EEFF] rounded-lg animate-pulse" />
              </div>
              <div className="p-6 space-y-4">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="flex items-start gap-4 py-3 border-b border-[#F3F4F6] last:border-0">
                    <div className="w-9 h-9 bg-[#D9EEFF] rounded-xl animate-pulse" />
                    <div className="flex-1 space-y-2">
                      <div className="h-3 w-20 bg-[#D9EEFF] rounded animate-pulse" />
                      <div className="h-4 w-36 bg-[#D9EEFF] rounded animate-pulse" />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Password card */}
            <div className="bg-white rounded-xl border border-[#FEE2E2] overflow-hidden">
              <div className="px-6 py-4 border-b border-[#FEE2E2] bg-[#FEF2F2]">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 bg-[#FEE2E2] rounded-xl animate-pulse" />
                  <div className="space-y-2">
                    <div className="h-4 w-32 bg-[#FEE2E2] rounded animate-pulse" />
                    <div className="h-3 w-48 bg-[#FEE2E2] rounded animate-pulse" />
                  </div>
                </div>
              </div>
              <div className="p-6 space-y-4">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="space-y-1.5">
                    <div className="h-3 w-32 bg-[#D9EEFF] rounded animate-pulse" />
                    <div className="h-11 bg-[#D9EEFF] rounded-xl animate-pulse" />
                  </div>
                ))}
                <div className="h-11 bg-[#0046C1]/20 rounded-xl animate-pulse" />
              </div>
            </div>
          </div>

          {/* Right */}
          <div className="space-y-6">
            {/* Account card */}
            <div className="bg-white rounded-xl border border-[#DDDDDD] overflow-hidden">
              <div className="px-6 py-4 border-b border-[#DDDDDD]">
                <div className="h-4 w-20 bg-[#DDDDDD]/50 rounded animate-pulse" />
              </div>
              <div className="p-6 space-y-4">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="flex items-center justify-between">
                    <div className="h-4 w-20 bg-[#D9EEFF] rounded animate-pulse" />
                    <div className="h-5 w-20 bg-[#D9EEFF] rounded-full animate-pulse" />
                  </div>
                ))}
              </div>
            </div>

            {/* Quick actions */}
            <div className="bg-white rounded-xl border border-[#DDDDDD] overflow-hidden">
              <div className="px-6 py-4 border-b border-[#DDDDDD]">
                <div className="h-4 w-24 bg-[#DDDDDD]/50 rounded animate-pulse" />
              </div>
              <div className="p-4 space-y-2">
                {[...Array(2)].map((_, i) => (
                  <div key={i} className="flex items-center gap-3 px-4 py-3">
                    <div className="w-5 h-5 bg-[#D9EEFF] rounded animate-pulse" />
                    <div className="h-4 w-36 bg-[#D9EEFF] rounded animate-pulse" />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
