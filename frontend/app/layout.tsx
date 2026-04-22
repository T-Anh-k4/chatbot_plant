import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Tanh Chatbot",
  description: "Chatbot trợ lý thông minh cho Tanh Architecture",
};

export default function RootLayout({children}: Readonly<{ children: React.ReactNode; }>) {
  return (
    <html lang="vi">
      <body>
        {children}
      </body>
    </html>
  );
}
