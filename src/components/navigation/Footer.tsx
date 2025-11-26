import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import siteintelLogo from "@/assets/siteintel-ai-logo-main.png";

export const Footer = () => {
  const footerSections = [
    {
      title: "Product",
      links: [
        { label: "Feasibility Intelligence", href: "/products/feasibility" },
        { label: "Cost Intelligence", href: "/products/cost-intelligence" },
        { label: "Schedule Intelligence", href: "/products/schedule-intelligence" },
        { label: "Run Free QuickCheck", href: "/application?step=2" },
      ],
    },
    {
      title: "Resources",
      links: [
        { label: "Blog", href: "/resources/blog" },
        { label: "Documentation", href: "/resources/documentation" },
        { label: "Case Studies", href: "/resources/case-studies" },
        { label: "Developer API", href: "/resources/api" },
      ],
    },
    {
      title: "Company",
      links: [
        { label: "About", href: "/about" },
        { label: "Team", href: "/about#team" },
        { label: "Careers", href: "/about#careers" },
        { label: "Data Ethics", href: "/about#ethics" },
      ],
    },
    {
      title: "Trust & Legal",
      links: [
        { label: "Terms of Use", href: "/legal/terms" },
        { label: "Privacy Policy", href: "/legal/privacy" },
        { label: "Data Transparency", href: "/legal/transparency" },
        { label: "Contact", href: "/contact" },
      ],
    },
  ];

  const trustBadges = ["ArcGIS", "TxDOT", "USGS", "EPA", "Open Data Alliance"];

  return (
    <footer className="bg-[#0A0F2C] text-white pt-16 pb-8 border-t border-white/10">
      <div className="container mx-auto px-6">
        {/* Main Footer Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-12">
          {footerSections.map((section) => (
            <div key={section.title}>
              <h3 className="text-white font-semibold mb-4 text-sm uppercase tracking-wider border-b border-[#06B6D4] pb-2 inline-block">
                {section.title}
              </h3>
              <ul className="space-y-3">
                {section.links.map((link) => (
                  <li key={link.href}>
                    <Link
                      to={link.href}
                      className="text-white/70 hover:text-[#06B6D4] transition-colors text-sm"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Footer CTA */}
        <div className="mb-12 py-8 border-y border-white/10">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div>
              <h3 className="text-xl font-bold mb-2">
                Ready to Build with Intelligence?
              </h3>
              <p className="text-white/70 text-sm">
                Powered by proprietary AI trained on Texas commercial real estate data
              </p>
            </div>
            <Button
              asChild
              className="bg-gradient-to-r from-[#FF7A00] to-[#FF9240] hover:shadow-[0_6px_30px_rgba(255,122,0,0.5)] text-white font-semibold rounded-full px-8 py-6"
            >
              <Link to="/application?step=2">
                Start Your Verified Feasibility →
              </Link>
            </Button>
          </div>
        </div>

        {/* Trust Bar */}
        <div className="mb-8">
          <p className="text-[#06B6D4] text-sm font-semibold mb-3 text-center">
            Powered by proprietary AI trained on verified government data
          </p>
          <div className="flex flex-wrap justify-center gap-6 text-white/50 text-xs">
            {trustBadges.map((badge) => (
              <span key={badge} className="font-mono">
                {badge}
              </span>
            ))}
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-4 pt-8 border-t border-white/10">
          <div className="flex items-center gap-3">
            <img src={siteintelLogo} alt="SiteIntel AI" className="h-6 drop-shadow-[0_0_8px_rgba(255,122,0,0.5)]" />
            <span className="text-white/50 text-xs">
              © {new Date().getFullYear()} SiteIntel AI. All rights reserved.
            </span>
          </div>
          <p className="text-white/40 text-xs">
            Transforming complexity into verified clarity.
          </p>
        </div>
      </div>
    </footer>
  );
};
