import { Link } from "react-router-dom";
import siteintelLogo from "@/assets/siteintel-ai-logo-main.png";

const footerLinks = [
  {
    label: "Product",
    children: [
      { label: "How It Works", href: "#how-it-works" },
      { label: "Sample Report", href: "#sample-report" },
    ],
  },
  {
    label: "Company",
    children: [
      { label: "About", href: "/about" },
      { label: "Careers", href: "/contact" },
    ],
  },
  {
    label: "Legal",
    children: [
      { label: "Privacy Policy", href: "/privacy" },
      { label: "Terms of Use", href: "/terms" },
    ],
  },
];

export const PrelaunchFooter = () => {
  return (
    <footer className="border-t border-border bg-background">
      <div className="max-w-7xl mx-auto px-6 md:px-24 py-16">
        {/* Main footer content */}
        <div className="grid md:grid-cols-4 gap-12 mb-12">
          {/* Brand column */}
          <div className="md:col-span-1">
            <Link to="/" className="inline-block mb-4">
              <img 
                src={siteintelLogo} 
                alt="SiteIntel" 
                className="h-8"
              />
            </Link>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Feasibility-as-a-Service™ for commercial real estate development.
            </p>
          </div>

          {/* Link columns */}
          {footerLinks.map((column, index) => (
            <div key={index}>
              <h4 className="font-medium text-foreground mb-4">
                {column.label}
              </h4>
              <ul className="space-y-3">
                {column.children.map((link, linkIndex) => (
                  <li key={linkIndex}>
                    {link.href.startsWith("#") ? (
                      <a
                        href={link.href}
                        className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                      >
                        {link.label}
                      </a>
                    ) : (
                      <Link
                        to={link.href}
                        className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                      >
                        {link.label}
                      </Link>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom bar */}
        <div className="pt-8 border-t border-border flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-sm text-muted-foreground">
            © {new Date().getFullYear()} SiteIntel™ Feasibility. All rights reserved.
          </p>
          
          {/* Social icons placeholder */}
          <div className="flex items-center gap-4">
            <a 
              href="https://linkedin.com" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
              </svg>
            </a>
            <a 
              href="https://twitter.com" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
              </svg>
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
};
