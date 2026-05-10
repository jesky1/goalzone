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
<<<<<<< HEAD
      <div className="min-h-screen flex flex-col bg-deep-900 text-foreground cyber-grid">
=======
      <div className="min-h-screen flex flex-col bg-deep-900 text-foreground">
>>>>>>> 09cf314a6a095d1a224a5ceb999d3ff2244405e0
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
