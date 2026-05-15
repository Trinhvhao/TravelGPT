import type { Metadata } from "next";
import { Mulish } from "next/font/google";
import "./globals.css";
import { Toaster } from "react-hot-toast";
import Providers from "./providers";

const mulish = Mulish({
  subsets: ["latin", "vietnamese"],
  weight: ["400", "500", "600", "700", "800"],
  variable: "--font-mulish",
  display: "swap",
});

export const metadata: Metadata = {
  title: "TravelGPT - AI Travel Agent",
  description: "Chatbot AI tư vấn và đặt tour du lịch tự động. Hơn 500+ tour du lịch với AI thông minh.",
  icons: {
    icon: "/favicon.ico",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="vi" suppressHydrationWarning className={mulish.variable}>
      <body className="font-sans antialiased">
        <Providers>
          {children}
        </Providers>
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 4000,
            style: {
              background: "#000E1A",
              color: "#fff",
              borderRadius: "0px",
              padding: "12px 16px",
              fontSize: "14px",
              fontWeight: "500",
            },
            success: {
              iconTheme: {
                primary: "#77DD77",
                secondary: "#fff",
              },
            },
            error: {
              iconTheme: {
                primary: "#ED1D24",
                secondary: "#fff",
              },
            },
          }}
        />
      </body>
    </html>
  );
}
