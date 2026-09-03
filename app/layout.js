import { Plus_Jakarta_Sans } from "next/font/google";
import ThemeProvider from "@/components/theme-provider";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import "./globals.css";

const jakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-jakarta",
  weight: ["400", "500", "600", "700", "800"],
});

export const metadata = {
  metadataBase: new URL("https://strsltd.com"),
  title: {
    default: "STR Solutions Ltd. — Software, Data & Digital Engineering",
    template: "%s | STR Solutions Ltd.",
  },
  description:
    "STR Solutions Ltd. builds enterprise-grade software, data science, and digital products engineered for scale.",
  keywords: [
    "STR Solutions",
    "software development",
    "data science",
    "web development",
    "IT consultancy",
    "Bangladesh",
  ],
  openGraph: {
    type: "website",
    siteName: "STR Solutions Ltd.",
    locale: "en_US",
  },
};

export const viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f8fafc" },
    { media: "(prefers-color-scheme: dark)", color: "#0b0f17" },
  ],
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" suppressHydrationWarning className={jakarta.variable}>
      <body className="min-h-dvh antialiased" suppressHydrationWarning>
        <ThemeProvider>
          <Navbar />
          <main id="main">{children}</main>
          <Footer />
        </ThemeProvider>
      </body>
    </html>
  );
}
