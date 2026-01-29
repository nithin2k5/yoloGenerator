import { Inter } from "next/font/google";
import "./globals.css";
import ClientProvider from "@/components/ClientProvider";

const inter = Inter({ 
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  variable: "--font-inter"
});

export const metadata = {
  title: "YOLO Generator - ML Model Training Platform",
  description: "Train and deploy YOLO models with ease",
  icons: {
    icon: '/favicon.ico',
    apple: '/apple-touch-icon.png',
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className="dark">
      <body className={`${inter.variable} font-sans antialiased`}>
        <ClientProvider>
          {children}
        </ClientProvider>
      </body>
    </html>
  );
}
