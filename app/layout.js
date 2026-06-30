import { Manrope, Inter } from "next/font/google";
import "./globals.css";
import { Toaster } from "react-hot-toast";
import ReduxProvider from "@/components/providers/ReduxProvider";

const manrope = Manrope({
  variable: "--font-sans",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  display: "swap",
});

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  display: "swap",
});

export const metadata = {
  title: {
    default: "ShopEase — Premium E-Commerce",
    template: "%s | ShopEase",
  },
  description:
    "Discover curated premium products at ShopEase. Shop electronics, fashion, accessories and more with a seamless experience.",
  keywords: ["ShopEase", "e-commerce", "shop online", "premium products"],
  authors: [{ name: "ShopEase" }],
  creator: "ShopEase",
  openGraph: {
    type: "website",
    locale: "en_US",
    siteName: "ShopEase",
    title: "ShopEase — Premium E-Commerce",
    description:
      "Discover curated premium products at ShopEase. Shop electronics, fashion, accessories and more.",
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={`${manrope.variable} ${inter.variable}`}>
      <body className="min-h-screen flex flex-col antialiased">
        <ReduxProvider>
          {children}
          <Toaster
            position="top-right"
            toastOptions={{
              style: {
                background: "#002819",
                color: "#ffffff",
                borderRadius: "999px",
                fontFamily: "Inter, sans-serif",
                fontSize: "14px",
                padding: "12px 20px",
              },
              success: {
                iconTheme: { primary: "#9cd2b5", secondary: "#002819" },
              },
              error: {
                style: { background: "#ba1a1a" },
                iconTheme: { primary: "#fff", secondary: "#ba1a1a" },
              },
            }}
          />
        </ReduxProvider>
      </body>
    </html>
  );
}
