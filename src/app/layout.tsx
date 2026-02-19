import type { Metadata } from "next";
import "./globals.css";
import WalletProvider from "@/providers/WalletProvider";
import ProfileProvider from "@/providers/ProfileProvider";
import { Toaster } from "sonner";

export const metadata: Metadata = {
  title: "KeySocial | Onchain Social Racing",
  description:
    "Real-time keypress racing duels on Solana. Race, compete, and climb the leaderboards in the fastest social game onchain.",
  keywords: ["solana", "racing", "social", "onchain", "typing", "game"],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&family=Plus+Jakarta+Sans:wght@500;600;700;800&family=Space+Grotesk:wght@300;400;500;600;700&display=swap"
        />
        <link rel="stylesheet" href="https://fonts.googleapis.com/icon?family=Material+Icons" />
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/icon?family=Material+Icons+Round"
        />
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/icon?family=Material+Icons+Outlined"
        />
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap"
        />
      </head>
      <body className="bg-bg-primary text-white font-body antialiased">
        <WalletProvider>
          <ProfileProvider>
            {children}
            <Toaster
              theme="dark"
              position="bottom-right"
              toastOptions={{
                style: {
                  background: "#13112A",
                  border: "1px solid rgba(139, 92, 246, 0.2)",
                  color: "#F3F4F6",
                },
              }}
            />
          </ProfileProvider>
        </WalletProvider>
      </body>
    </html>
  );
}
