import { BuildId } from "@/components/BuildId";

export const Footer = () => {
  return (
    <footer className="bg-charcoal py-8">
      <div className="container mx-auto px-6 lg:px-8">
        <div className="text-center">
          <p className="font-body text-charcoal-foreground/70 mb-2">
            SiteIntel™ Feasibility | Powered by Maxx Builders + Maxx Designers
          </p>
          <p className="font-body text-sm text-charcoal-foreground/50 mb-2">
            © 2025 All Rights Reserved. | Privacy Policy
          </p>
          <BuildId className="text-charcoal-foreground/30" />
        </div>
      </div>
    </footer>
  );
};