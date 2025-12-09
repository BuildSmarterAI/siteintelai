import { ReactNode, useState } from "react";
import { Link } from "react-router-dom";
import { Menu, X, ArrowLeft } from "lucide-react";
import { DocsSidebar } from "./DocsSidebar";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import siteintelLogo from "@/assets/siteintel-ai-logo-main.png";

interface DocsLayoutProps {
  children: ReactNode;
}

export const DocsLayout = ({ children }: DocsLayoutProps) => {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="min-h-screen bg-[hsl(var(--midnight-blue))]">
      {/* Mobile Header */}
      <header className="lg:hidden fixed top-0 left-0 right-0 z-50 h-16 bg-[hsl(var(--midnight-blue))]/95 backdrop-blur-md border-b border-white/10 flex items-center px-4">
        <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon" className="text-white mr-2">
              <Menu className="h-6 w-6" />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="p-0 w-64 bg-[hsl(var(--midnight-blue))] border-white/10">
            <DocsSidebar />
          </SheetContent>
        </Sheet>
        
        <Link to="/" className="flex items-center gap-2">
          <img src={siteintelLogo} alt="SiteIntel" className="h-8" />
        </Link>
        
        <Link to="/" className="ml-auto text-sm text-white/60 hover:text-white flex items-center gap-1">
          <ArrowLeft className="h-4 w-4" />
          Back to Site
        </Link>
      </header>

      <div className="flex">
        {/* Desktop Sidebar */}
        <div className="hidden lg:block fixed left-0 top-0 bottom-0 z-40">
          <DocsSidebar />
        </div>

        {/* Main Content */}
        <main className="flex-1 lg:ml-64 min-h-screen">
          {/* Desktop Top Bar */}
          <div className="hidden lg:flex h-16 border-b border-white/10 items-center px-8 justify-between bg-[hsl(var(--midnight-blue))]/50 backdrop-blur-sm sticky top-0 z-30">
            <Link to="/" className="flex items-center gap-3">
              <img src={siteintelLogo} alt="SiteIntel" className="h-10" />
            </Link>
            <Link to="/" className="text-sm text-white/60 hover:text-white flex items-center gap-1">
              <ArrowLeft className="h-4 w-4" />
              Back to Site
            </Link>
          </div>

          {/* Page Content */}
          <div className="px-6 lg:px-12 py-8 lg:py-12 pt-24 lg:pt-12 max-w-4xl">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};
