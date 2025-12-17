import { Target, Users, Heart, Briefcase } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

const About = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0A0F2C] via-[#11224F] to-[#0A0F2C]">
      <div className="container mx-auto px-6 py-24">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-heading font-bold text-white mb-6">
            About <span className="text-[#FF7A00]">SiteIntel™</span>
          </h1>
          <p className="text-xl text-white/80 mb-16 leading-relaxed">
            We're building the verified intelligence layer for real estate and construction—transforming
            fragmented data into decision-making clarity.
          </p>

          {/* Mission & Vision */}
          <section className="mb-16">
            <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-8">
              <Target className="h-12 w-12 text-[#06B6D4] mb-4" />
              <h2 className="text-3xl md:text-4xl lg:text-5xl font-heading font-semibold text-white mb-4">Our Mission</h2>
              <p className="text-white/80 text-lg leading-relaxed">
                To eliminate uncertainty in development decisions by fusing public, municipal, and
                construction data into a single verified source of truth. Every site. Every cost.
                Every decision—backed by intelligence you can trust.
              </p>
            </div>
          </section>

          {/* Leadership */}
          <section className="mb-16" id="team">
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-heading font-semibold text-white mb-8 flex items-center gap-3">
              <Users className="h-8 w-8 text-[#FF7A00]" />
              Leadership Team
            </h2>
            <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-8">
              <p className="text-white/80 text-lg">
                SiteIntel is led by a team of data engineers, real estate professionals, and AI
                researchers dedicated to bringing transparency and intelligence to the development process.
              </p>
            </div>
          </section>

          {/* Data Ethics */}
          <section className="mb-16" id="ethics">
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-heading font-semibold text-white mb-8 flex items-center gap-3">
              <Heart className="h-8 w-8 text-[#06B6D4]" />
              Data Ethics & Transparency
            </h2>
            <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-8">
              <div className="space-y-4 text-white/80">
                <p>
                  <strong className="text-white">Complete Transparency:</strong> Every data point in
                  our reports is traced back to its source with complete citations.
                </p>
                <p>
                  <strong className="text-white">Public Data Only:</strong> We exclusively use publicly
                  available datasets from trusted government and municipal sources.
                </p>
                <p>
                  <strong className="text-white">Privacy First:</strong> We never collect or store
                  personal information beyond what's necessary for report generation.
                </p>
                <p>
                  <strong className="text-white">Verified Quality:</strong> All data sources undergo
                  rigorous validation and freshness checks before inclusion in our intelligence engine.
                </p>
              </div>
            </div>
          </section>

          {/* Careers */}
          <section className="mb-16" id="careers">
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-heading font-semibold text-white mb-8 flex items-center gap-3">
              <Briefcase className="h-8 w-8 text-[#FF7A00]" />
              Careers
            </h2>
            <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-8">
              <p className="text-white/80 text-lg mb-6">
                Join us in building the infrastructure for verified development intelligence. We're
                looking for talented engineers, data scientists, and domain experts who want to
                transform how development decisions are made.
              </p>
              <Button
                asChild
                className="bg-gradient-to-r from-[#06B6D4] to-[#FF7A00] text-white font-semibold rounded-full"
              >
                <Link to="/contact">View Open Positions →</Link>
              </Button>
            </div>
          </section>

          {/* CTA */}
          <div className="text-center bg-gradient-to-r from-[#FF7A00]/10 to-[#06B6D4]/10 rounded-2xl p-8 border border-[#FF7A00]/20">
            <h3 className="text-2xl font-heading font-bold text-white mb-4">
              Ready to Experience Verified Intelligence?
            </h3>
            <Button
              asChild
              size="lg"
              className="bg-gradient-to-r from-[#FF7A00] to-[#FF9240] hover:shadow-[0_6px_30px_rgba(255,122,0,0.6)] text-white font-semibold rounded-full px-12 py-6"
            >
              <Link to="/application">Get Your Feasibility Report - $1,495</Link>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default About;