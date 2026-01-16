import { Calendar, ArrowRight } from "lucide-react";
import { SEOHead } from "@/components/seo/SEOHead";

const Blog = () => {
  const articles = [
    {
      title: "The Future of Feasibility Analysis",
      excerpt: "How AI and data fusion are transforming real estate development decisions.",
      date: "March 15, 2024",
      category: "Industry Insights",
    },
    {
      title: "Understanding Construction Cost Intelligence",
      excerpt: "Breaking down the datasets that power accurate cost predictions.",
      date: "March 10, 2024",
      category: "Product Updates",
    },
    {
      title: "Data Transparency in PropTech",
      excerpt: "Why verification and source citations matter in development intelligence.",
      date: "March 5, 2024",
      category: "Thought Leadership",
    },
  ];

  return (
    <>
      <SEOHead
        title="Blog - Real Estate Insights"
        description="Insights on development intelligence, data transparency, and the future of feasibility analysis from the SiteIntel team."
        keywords={["real estate blog", "feasibility insights", "PropTech articles"]}
      />
    <div className="min-h-screen bg-gradient-to-br from-[#0A0F2C] via-[#11224F] to-[#0A0F2C]">
      <div className="container mx-auto px-6 py-24">
        <div className="max-w-5xl mx-auto">
          <h1 className="text-5xl font-bold text-white mb-6">
            SiteIntel™ <span className="text-[#FF7A00]">Blog</span>
          </h1>
          <p className="text-xl text-white/80 mb-16">
            Insights on development intelligence, data transparency, and the future of feasibility analysis.
          </p>

          <div className="space-y-6">
            {articles.map((article, idx) => (
              <article
                key={idx}
                className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-8 hover:bg-white/10 transition-all group cursor-pointer"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <span className="text-[#06B6D4] text-sm font-semibold">{article.category}</span>
                    <h2 className="text-2xl font-bold text-white mt-2 mb-3 group-hover:text-[#FF7A00] transition-colors">
                      {article.title}
                    </h2>
                    <p className="text-white/70 mb-4">{article.excerpt}</p>
                    <div className="flex items-center gap-2 text-white/50 text-sm">
                      <Calendar className="h-4 w-4" />
                      {article.date}
                    </div>
                  </div>
                  <ArrowRight className="h-6 w-6 text-[#FF7A00] opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
              </article>
            ))}
          </div>
        </div>
      </div>
    </div>
    </>
  );
};

export default Blog;
