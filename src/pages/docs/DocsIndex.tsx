import { Link } from "react-router-dom";
import { DocsLayout } from "@/components/docs/DocsLayout";
import { docsNavigation } from "@/data/docs-navigation";
import { ArrowRight } from "lucide-react";

const DocsIndex = () => {
  return (
    <DocsLayout>
      <div className="space-y-8">
        {/* Hero */}
        <div className="space-y-4">
          <h1 className="font-heading text-4xl md:text-5xl text-white">
            SiteIntel™ Documentation
          </h1>
          <p className="text-lg text-white/70 max-w-2xl">
            Technical documentation for the SiteIntel™ Feasibility-as-a-Service™ platform.
            Learn about our data architecture, ingestion pipelines, and AI engines.
          </p>
        </div>

        {/* Quick Links */}
        <div className="grid gap-4 md:grid-cols-2">
          <Link
            to="/docs/dsl-specification"
            className="group p-6 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 transition-colors"
          >
            <h3 className="font-heading text-lg text-white group-hover:text-[hsl(var(--feasibility-orange))] transition-colors flex items-center gap-2">
              transform_config DSL
              <ArrowRight className="h-4 w-4 opacity-0 group-hover:opacity-100 transition-opacity" />
            </h3>
            <p className="text-sm text-white/60 mt-2">
              Complete specification for the declarative DSL that transforms raw GIS data into canonical schema.
            </p>
          </Link>

          <Link
            to="/docs/houston-workflow"
            className="group p-6 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 transition-colors"
          >
            <h3 className="font-heading text-lg text-white group-hover:text-[hsl(var(--data-cyan))] transition-colors flex items-center gap-2">
              Houston Ingestion Workflow
              <ArrowRight className="h-4 w-4 opacity-0 group-hover:opacity-100 transition-opacity" />
            </h3>
            <p className="text-sm text-white/60 mt-2">
              End-to-end pipeline from City of Houston ArcGIS services to AI-ready vector tiles.
            </p>
          </Link>

          <Link
            to="/docs/canonical-schema"
            className="group p-6 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 transition-colors"
          >
            <h3 className="font-heading text-lg text-white group-hover:text-[hsl(var(--data-cyan))] transition-colors flex items-center gap-2">
              canonical_schema
              <ArrowRight className="h-4 w-4 opacity-0 group-hover:opacity-100 transition-opacity" />
            </h3>
            <p className="text-sm text-white/60 mt-2">
              Master data standardization model with 11 domains covering parcel, zoning, flood, utilities, and more.
            </p>
          </Link>

          <Link
            to="/docs/tile-architecture"
            className="group p-6 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 transition-colors"
          >
            <h3 className="font-heading text-lg text-white group-hover:text-[hsl(var(--feasibility-orange))] transition-colors flex items-center gap-2">
              Tile Architecture
              <ArrowRight className="h-4 w-4 opacity-0 group-hover:opacity-100 transition-opacity" />
            </h3>
            <p className="text-sm text-white/60 mt-2">
              Tileserver GL + Cloudflare CDN architecture for sub-200ms tile delivery worldwide.
            </p>
          </Link>
        </div>

        {/* All Sections */}
        <div className="space-y-6 pt-8 border-t border-white/10">
          <h2 className="font-heading text-2xl text-white">All Sections</h2>
          <div className="grid gap-6 md:grid-cols-2">
            {docsNavigation.map((section) => {
              const Icon = section.icon;
              return (
                <div key={section.title} className="space-y-3">
                  <div className="flex items-center gap-2 text-[hsl(var(--data-cyan))]">
                    <Icon className="h-5 w-5" />
                    <h3 className="font-heading text-lg">{section.title}</h3>
                  </div>
                  <ul className="space-y-1 ml-7">
                    {section.items.map((item) => (
                      <li key={item.href}>
                        <Link
                          to={item.href}
                          className="text-sm text-white/60 hover:text-white transition-colors"
                        >
                          {item.title}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </DocsLayout>
  );
};

export default DocsIndex;
