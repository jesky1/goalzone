import { ThemeProvider } from "next-themes";
import NavbarDynamic from "@/components/football/NavbarDynamic";
import LiveScoreTicker from "@/components/football/LiveScoreTicker";
import Footer from "@/components/football/Footer";
import { Toaster } from "@/components/ui/toaster";

export default function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="dark"
      enableSystem
      disableTransitionOnChange
    >
      <div className="min-h-screen">
        <NavbarDynamic />
        <LiveScoreTicker />
        <main className="flex-1">
          {children}
        </main>
        <Footer />
      </div>
      <Toaster />
    </ThemeProvider>
  );
}
