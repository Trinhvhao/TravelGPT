export default function ChatLoading() {
  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: "#F7F7F7" }}>
      {/* Header skeleton (Airbnb Style) */}
      <div
        className="px-4 py-4"
        style={{
          backgroundColor: "#FFFFFF",
          borderBottom: "1px solid #E8F4FF",
        }}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl animate-pulse" style={{ background: "linear-gradient(135deg, #0046C1, #0391FF)" }} />
            <div className="space-y-2">
              <div className="h-5 w-40 bg-gray-200 rounded animate-pulse" />
              <div className="h-3 w-24 bg-gray-100 rounded animate-pulse" />
            </div>
          </div>
        </div>
      </div>

      {/* Chat area (Airbnb Style) */}
      <div className="flex-1 flex flex-col p-6 space-y-6">
        {/* AI greeting */}
        <div className="flex gap-3">
          <div className="w-11 h-11 rounded-2xl animate-pulse" style={{ background: "linear-gradient(135deg, #0046C1, #0391FF)" }} />
          <div
            className="p-5 animate-pulse"
            style={{
              backgroundColor: "#FFFFFF",
              borderRadius: "20px 20px 20px 4px",
              boxShadow: "0 4px 20px rgba(0,70,193,0.12)",
              maxWidth: "70%",
            }}
          >
            <div className="space-y-2">
              <div className="h-4 w-64 bg-gray-100 rounded" />
              <div className="h-4 w-48 bg-gray-100 rounded" />
            </div>
          </div>
        </div>

        {/* Suggestions skeleton */}
        <div className="flex gap-2 flex-wrap pl-14">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className="h-9 w-40 animate-pulse"
              style={{
                backgroundColor: "#FFFFFF",
                borderRadius: "50px",
                boxShadow: "0 2px 8px rgba(0,70,193,0.08)",
              }}
            />
          ))}
        </div>

        {/* User message skeleton */}
        <div className="flex justify-end pl-14">
          <div
            className="h-14 w-64 animate-pulse"
            style={{
              background: "linear-gradient(135deg, #0391FF, #0046C1)",
              borderRadius: "20px 20px 4px 20px",
            }}
          />
        </div>

        {/* AI response skeleton */}
        <div className="flex gap-3">
          <div className="w-11 h-11 rounded-2xl animate-pulse" style={{ background: "linear-gradient(135deg, #0046C1, #0391FF)" }} />
          <div
            className="p-5 animate-pulse"
            style={{
              backgroundColor: "#FFFFFF",
              borderRadius: "20px 20px 20px 4px",
              boxShadow: "0 4px 20px rgba(0,70,193,0.12)",
              maxWidth: "70%",
            }}
          >
            <div className="space-y-2">
              <div className="h-4 w-72 bg-gray-100 rounded" />
              <div className="h-4 w-56 bg-gray-100 rounded" />
            </div>
          </div>
        </div>
      </div>

      {/* Input area skeleton */}
      <div
        className="p-4"
        style={{
          backgroundColor: "#FFFFFF",
          borderTop: "1px solid #E8F4FF",
        }}
      >
        <div
          className="h-12 w-full animate-pulse"
          style={{
            backgroundColor: "#F7F7F7",
            borderRadius: "24px",
          }}
        />
      </div>
    </div>
  );
}
