import { motion } from "framer-motion";
import { Copy, Check } from "lucide-react";
import { SEOHead } from "@/components/seo/SEOHead";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import siteintelLogo from "@/assets/siteintel-ai-logo-main.png";

const BrandKit = () => {
  const [copiedColor, setCopiedColor] = useState<string | null>(null);

  const copyToClipboard = (value: string, label: string) => {
    navigator.clipboard.writeText(value);
    setCopiedColor(label);
    toast.success(`Copied ${label}`);
    setTimeout(() => setCopiedColor(null), 2000);
  };

  const primaryColors = [
    { name: "Feasibility Orange", hsl: "27 100% 50%", hex: "#FF7A00", usage: "Primary action, highlights, CTAs" },
    { name: "Midnight Blue", hsl: "229 67% 11%", hex: "#0A0F2C", usage: "Primary text, dark backgrounds" },
    { name: "Slate Gray", hsl: "215 19% 27%", hex: "#374151", usage: "Secondary text, borders" },
    { name: "Cloud White", hsl: "210 20% 98%", hex: "#F9FAFB", usage: "Light backgrounds, cards" },
    { name: "Data Cyan", hsl: "189 94% 43%", hex: "#06B6D4", usage: "Links, accents, data highlights" },
  ];

  const statusColors = [
    { name: "Success", hsl: "160 84% 39%", hex: "#10B981", usage: "Feasibility A band" },
    { name: "Warning", hsl: "38 92% 50%", hex: "#F59E0B", usage: "Feasibility B band" },
    { name: "Error", hsl: "0 84% 60%", hex: "#EF4444", usage: "Feasibility C band" },
    { name: "Info", hsl: "189 94% 43%", hex: "#06B6D4", usage: "Neutral annotations" },
  ];

  const typographyScale = [
    { name: "H1", class: "text-4xl md:text-5xl lg:text-6xl font-bold", sample: "Instant Feasibility Intelligence", font: "Space Grotesk" },
    { name: "H2", class: "text-3xl md:text-4xl lg:text-5xl font-bold", sample: "Data-Driven Decisions", font: "Space Grotesk" },
    { name: "H3", class: "text-2xl md:text-3xl font-semibold", sample: "Section Heading", font: "Space Grotesk" },
    { name: "Body Large", class: "text-lg leading-relaxed", sample: "Body text for important paragraphs and introductions.", font: "Inter" },
    { name: "Body", class: "text-base leading-relaxed", sample: "Standard body text for content and descriptions.", font: "Inter" },
    { name: "Caption", class: "text-sm text-muted-foreground", sample: "Captions, labels, and metadata", font: "Inter" },
    { name: "Mono", class: "font-mono text-sm", sample: "API_KEY=sk_live_1234567890", font: "JetBrains Mono" },
  ];

  const spacingTokens = [
    { name: "xs", value: "4px", class: "w-xs h-4" },
    { name: "sm", value: "8px", class: "w-sm h-4" },
    { name: "md", value: "16px", class: "w-md h-4" },
    { name: "lg", value: "32px", class: "w-lg h-4" },
  ];

  return (
    <>
      <SEOHead
        title="Brand Kit - Visual Identity"
        description="SiteIntel™ brand guidelines, logo assets, color palette, typography, and visual identity system."
        keywords={["brand kit", "press kit", "brand assets", "media resources"]}
      />
    <div className="min-h-screen bg-background">
      {/* Hero */}
      <section className="relative py-20 px-4 bg-gradient-to-b from-midnight-blue to-background">
        <div className="container mx-auto max-w-6xl text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <img src={siteintelLogo} alt="SiteIntel Logo" className="h-16 mx-auto mb-8" />
            <h1 className="font-heading text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-4">
              Brand Kit
            </h1>
            <p className="text-xl text-white/70 max-w-2xl mx-auto">
              The complete visual identity system for SiteIntel™ Feasibility
            </p>
            <p className="mt-6 text-feasibility-orange font-heading text-2xl font-semibold">
              Precision. Proof. Possibility.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Logo Section */}
      <section className="py-16 px-4">
        <div className="container mx-auto max-w-6xl">
          <h2 className="font-heading text-3xl md:text-4xl font-bold mb-8">Logo</h2>
          <div className="grid md:grid-cols-2 gap-8">
            <Card>
              <CardHeader>
                <CardTitle>Primary Logo (Light Background)</CardTitle>
              </CardHeader>
              <CardContent className="bg-white rounded-lg p-12 flex items-center justify-center border">
                <img src={siteintelLogo} alt="SiteIntel Logo" className="h-16" />
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Primary Logo (Dark Background)</CardTitle>
              </CardHeader>
              <CardContent className="bg-midnight-blue rounded-lg p-12 flex items-center justify-center">
                <img src={siteintelLogo} alt="SiteIntel Logo" className="h-16" />
              </CardContent>
            </Card>
          </div>
          <div className="mt-8 p-6 bg-muted rounded-lg">
            <h3 className="font-heading font-semibold mb-2">Usage Guidelines</h3>
            <ul className="text-muted-foreground space-y-1 text-sm">
              <li>• Minimum clear space: Height of the icon on all sides</li>
              <li>• Minimum size: 32px height for digital, 0.5" for print</li>
              <li>• Do not stretch, rotate, or alter the logo proportions</li>
              <li>• Use provided color variants only</li>
            </ul>
          </div>
        </div>
      </section>

      {/* Colors Section */}
      <section className="py-16 px-4 bg-muted/50">
        <div className="container mx-auto max-w-6xl">
          <h2 className="font-heading text-3xl md:text-4xl font-bold mb-8">Color Palette</h2>
          
          <h3 className="font-heading text-xl font-semibold mb-4">Primary Colors</h3>
          <div className="grid sm:grid-cols-2 lg:grid-cols-5 gap-4 mb-12">
            {primaryColors.map((color) => (
              <Card key={color.name} className="overflow-hidden">
                <div 
                  className="h-24 cursor-pointer relative group"
                  style={{ backgroundColor: color.hex }}
                  onClick={() => copyToClipboard(color.hex, color.name)}
                >
                  <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/20">
                    {copiedColor === color.name ? (
                      <Check className="w-6 h-6 text-white" />
                    ) : (
                      <Copy className="w-6 h-6 text-white" />
                    )}
                  </div>
                </div>
                <CardContent className="p-4">
                  <p className="font-semibold text-sm">{color.name}</p>
                  <p className="text-xs text-muted-foreground font-mono">{color.hex}</p>
                  <p className="text-xs text-muted-foreground font-mono">HSL: {color.hsl}</p>
                  <p className="text-xs text-muted-foreground mt-2">{color.usage}</p>
                </CardContent>
              </Card>
            ))}
          </div>

          <h3 className="font-heading text-xl font-semibold mb-4">Status Colors</h3>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {statusColors.map((color) => (
              <Card key={color.name} className="overflow-hidden">
                <div 
                  className="h-16 cursor-pointer relative group"
                  style={{ backgroundColor: color.hex }}
                  onClick={() => copyToClipboard(color.hex, color.name)}
                >
                  <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/20">
                    {copiedColor === color.name ? (
                      <Check className="w-5 h-5 text-white" />
                    ) : (
                      <Copy className="w-5 h-5 text-white" />
                    )}
                  </div>
                </div>
                <CardContent className="p-3">
                  <p className="font-semibold text-sm">{color.name}</p>
                  <p className="text-xs text-muted-foreground font-mono">{color.hex}</p>
                  <p className="text-xs text-muted-foreground mt-1">{color.usage}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Typography Section */}
      <section className="py-16 px-4">
        <div className="container mx-auto max-w-6xl">
          <h2 className="font-heading text-3xl md:text-4xl font-bold mb-8">Typography</h2>
          
          <div className="grid md:grid-cols-3 gap-6 mb-12">
            <Card>
              <CardHeader>
                <CardTitle className="font-heading">Space Grotesk</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="font-heading text-4xl mb-2">Aa</p>
                <p className="text-sm text-muted-foreground">Headlines, titles, section headers</p>
                <p className="text-xs font-mono mt-2">font-heading</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="font-body">Inter</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="font-body text-4xl mb-2">Aa</p>
                <p className="text-sm text-muted-foreground">Body text, paragraphs, UI elements</p>
                <p className="text-xs font-mono mt-2">font-body / font-sans</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="font-mono">JetBrains Mono</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="font-mono text-4xl mb-2">Aa</p>
                <p className="text-sm text-muted-foreground">Code, numbers, technical data</p>
                <p className="text-xs font-mono mt-2">font-mono</p>
              </CardContent>
            </Card>
          </div>

          <h3 className="font-heading text-xl font-semibold mb-4">Type Scale</h3>
          <div className="space-y-4">
            {typographyScale.map((type) => (
              <Card key={type.name}>
                <CardContent className="p-6 flex flex-col md:flex-row md:items-center gap-4">
                  <div className="w-24 shrink-0">
                    <p className="font-semibold">{type.name}</p>
                    <p className="text-xs text-muted-foreground">{type.font}</p>
                  </div>
                  <div className="flex-1">
                    <p className={`font-heading ${type.class}`}>{type.sample}</p>
                  </div>
                  <code className="text-xs bg-muted px-2 py-1 rounded shrink-0 hidden lg:block">
                    {type.class}
                  </code>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Spacing Section */}
      <section className="py-16 px-4 bg-muted/50">
        <div className="container mx-auto max-w-6xl">
          <h2 className="font-heading text-3xl md:text-4xl font-bold mb-8">Spacing</h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {spacingTokens.map((token) => (
              <Card key={token.name}>
                <CardContent className="p-6">
                  <div className="flex items-center gap-4 mb-4">
                    <div className={`${token.class} bg-feasibility-orange rounded`} />
                    <span className="font-mono text-sm">{token.value}</span>
                  </div>
                  <p className="font-semibold">--space-{token.name}</p>
                  <code className="text-xs text-muted-foreground">space-{token.name}</code>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Button Variants */}
      <section className="py-16 px-4">
        <div className="container mx-auto max-w-6xl">
          <h2 className="font-heading text-3xl md:text-4xl font-bold mb-8">Button Variants</h2>
          <div className="flex flex-wrap gap-4">
            <Button>Default</Button>
            <Button variant="secondary">Secondary</Button>
            <Button variant="destructive">Destructive</Button>
            <Button variant="outline">Outline</Button>
            <Button variant="ghost">Ghost</Button>
            <Button variant="link">Link</Button>
          </div>
          <div className="flex flex-wrap gap-4 mt-6">
            <Button size="lg">Large</Button>
            <Button size="default">Default</Button>
            <Button size="sm">Small</Button>
          </div>
        </div>
      </section>

      {/* Voice & Tone */}
      <section className="py-16 px-4 bg-muted/50">
        <div className="container mx-auto max-w-6xl">
          <h2 className="font-heading text-3xl md:text-4xl font-bold mb-8">Voice & Tone</h2>
          <div className="grid md:grid-cols-2 gap-8">
            <Card>
              <CardHeader>
                <CardTitle>Brand Attributes</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3">
                  <li className="flex items-center gap-3">
                    <span className="w-2 h-2 bg-feasibility-orange rounded-full" />
                    <span><strong>Analytical</strong> – Not abstract</span>
                  </li>
                  <li className="flex items-center gap-3">
                    <span className="w-2 h-2 bg-feasibility-orange rounded-full" />
                    <span><strong>Confident</strong> – Never boastful</span>
                  </li>
                  <li className="flex items-center gap-3">
                    <span className="w-2 h-2 bg-feasibility-orange rounded-full" />
                    <span><strong>Human</strong> – Scientific in structure</span>
                  </li>
                  <li className="flex items-center gap-3">
                    <span className="w-2 h-2 bg-feasibility-orange rounded-full" />
                    <span><strong>Data-backed</strong> – Lender-trusted</span>
                  </li>
                </ul>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Voice Principles</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3">
                  <li className="flex items-center gap-3">
                    <span className="w-2 h-2 bg-data-cyan rounded-full" />
                    <span><strong>Credible</strong> – Speak with evidence and confidence</span>
                  </li>
                  <li className="flex items-center gap-3">
                    <span className="w-2 h-2 bg-data-cyan rounded-full" />
                    <span><strong>Efficient</strong> – Clear, short sentences, active verbs</span>
                  </li>
                  <li className="flex items-center gap-3">
                    <span className="w-2 h-2 bg-data-cyan rounded-full" />
                    <span><strong>Informed</strong> – Reference data, not hype</span>
                  </li>
                  <li className="flex items-center gap-3">
                    <span className="w-2 h-2 bg-data-cyan rounded-full" />
                    <span><strong>Human</strong> – Expert guiding a client</span>
                  </li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Download Section */}
      <section className="py-16 px-4">
        <div className="container mx-auto max-w-6xl text-center">
          <h2 className="font-heading text-3xl md:text-4xl font-bold mb-4">Download Assets</h2>
          <p className="text-muted-foreground mb-8">
            Access logo files, color swatches, and brand documentation
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Button variant="outline" disabled>
              Logo Pack (Coming Soon)
            </Button>
            <Button variant="outline" disabled>
              Color Swatches (Coming Soon)
            </Button>
            <Button variant="outline" disabled>
              Brand Guidelines PDF (Coming Soon)
            </Button>
          </div>
        </div>
      </section>
    </div>
    </>
  );
};

export default BrandKit;
