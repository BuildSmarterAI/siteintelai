import { Calendar, ArrowRight, Clock, User, Tag } from "lucide-react";
import { SEOHead } from "@/components/seo/SEOHead";

const Blog = () => {
  const featuredArticle = {
    title: "How AI is Revolutionizing Commercial Real Estate Due Diligence",
    excerpt: "Traditional feasibility studies take weeks and cost thousands. Here's how AI-powered analysis is changing the game for developers, lenders, and investors—delivering lender-ready reports in under 10 minutes.",
    date: "January 12, 2026",
    category: "Industry Insights",
    author: "SiteIntel Research Team",
    readTime: "8 min read",
    image: "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=800&q=80",
  };

  const articles = [
    {
      title: "Understanding FEMA Flood Zones: A Developer's Complete Guide",
      excerpt: "Flood zone designations can make or break a project. Learn how to interpret FEMA data and what Zone AE, X, and VE mean for your development plans.",
      date: "January 8, 2026",
      category: "Educational",
      author: "Michael Torres",
      readTime: "6 min read",
      tags: ["Flood Risk", "FEMA", "Due Diligence"],
    },
    {
      title: "Texas Commercial Development: 2026 Market Outlook",
      excerpt: "With Houston, Dallas, and Austin leading growth, Texas remains a hotspot for CRE investment. Our analysis of key markets and emerging opportunities.",
      date: "January 5, 2026",
      category: "Market Analysis",
      author: "Sarah Chen",
      readTime: "10 min read",
      tags: ["Texas", "Market Trends", "Investment"],
    },
    {
      title: "Why Lenders Are Demanding AI-Verified Feasibility Reports",
      excerpt: "Major CRE lenders are shifting requirements. Here's why AI-generated reports with verifiable data citations are becoming the new standard.",
      date: "December 28, 2025",
      category: "Industry Insights",
      author: "James Patterson",
      readTime: "5 min read",
      tags: ["Lending", "AI", "Compliance"],
    },
    {
      title: "Soil Analysis 101: What Every Developer Needs to Know",
      excerpt: "From hydric ratings to shrink-swell potential, soil conditions dramatically impact construction costs. A deep dive into USDA data and what it means.",
      date: "December 20, 2025",
      category: "Educational",
      author: "Dr. Amanda Reyes",
      readTime: "7 min read",
      tags: ["Soil Analysis", "Construction", "Environmental"],
    },
    {
      title: "Case Study: How a $50M Project Avoided a $3M Mistake",
      excerpt: "A Fort Bend County developer used SiteIntel to discover a utility easement that would have derailed their industrial project. The full story.",
      date: "December 15, 2025",
      category: "Case Study",
      author: "SiteIntel Team",
      readTime: "4 min read",
      tags: ["Case Study", "Success Story", "Utilities"],
    },
    {
      title: "Zoning Code Deep Dive: Mixed-Use Development Considerations",
      excerpt: "Navigating PUD, MU-1, and overlay districts can be complex. We break down common zoning scenarios and what they mean for feasibility.",
      date: "December 10, 2025",
      category: "Educational",
      author: "Robert Kim",
      readTime: "9 min read",
      tags: ["Zoning", "Mixed-Use", "Regulations"],
    },
    {
      title: "The True Cost of Manual Feasibility Studies",
      excerpt: "We analyzed 200+ traditional feasibility engagements. The average cost? $12,500 and 18 days. Here's the breakdown and why it's changing.",
      date: "December 5, 2025",
      category: "Research",
      author: "SiteIntel Research Team",
      readTime: "6 min read",
      tags: ["Cost Analysis", "ROI", "Efficiency"],
    },
    {
      title: "EPA ECHO Data: Understanding Environmental Risk Factors",
      excerpt: "What happens when an EPA-regulated facility is within a mile of your site? A guide to interpreting ECHO data and mitigating environmental concerns.",
      date: "November 28, 2025",
      category: "Educational",
      author: "Jennifer Walsh",
      readTime: "8 min read",
      tags: ["EPA", "Environmental", "Risk Assessment"],
    },
  ];

  const categories = ["All", "Industry Insights", "Educational", "Market Analysis", "Case Study", "Research"];

  return (
    <>
      <SEOHead
        title="Blog - Real Estate Insights"
        description="Insights on development intelligence, data transparency, and the future of feasibility analysis from the SiteIntel team."
        keywords={["real estate blog", "feasibility insights", "PropTech articles"]}
      />
      <div className="min-h-screen bg-gradient-to-br from-[#0A0F2C] via-[#11224F] to-[#0A0F2C]">
        <div className="container mx-auto px-6 py-24">
          <div className="max-w-6xl mx-auto">
            {/* Header */}
            <div className="mb-12">
              <h1 className="text-5xl font-bold text-white mb-6">
                SiteIntel™ <span className="text-[#FF7A00]">Blog</span>
              </h1>
              <p className="text-xl text-white/80 max-w-2xl">
                Insights on development intelligence, data transparency, and the future of feasibility analysis.
              </p>
            </div>

            {/* Category Filter */}
            <div className="flex flex-wrap gap-3 mb-12">
              {categories.map((category) => (
                <button
                  key={category}
                  className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                    category === "All"
                      ? "bg-[#FF7A00] text-white"
                      : "bg-white/10 text-white/70 hover:bg-white/20 hover:text-white"
                  }`}
                >
                  {category}
                </button>
              ))}
            </div>

            {/* Featured Article */}
            <article className="mb-12 bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl overflow-hidden hover:bg-white/10 transition-all group cursor-pointer">
              <div className="grid md:grid-cols-2 gap-0">
                <div className="aspect-video md:aspect-auto">
                  <img
                    src={featuredArticle.image}
                    alt={featuredArticle.title}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="p-8 flex flex-col justify-center">
                  <div className="flex items-center gap-3 mb-4">
                    <span className="bg-[#FF7A00] text-white text-xs font-bold px-3 py-1 rounded-full">
                      Featured
                    </span>
                    <span className="text-[#06B6D4] text-sm font-semibold">
                      {featuredArticle.category}
                    </span>
                  </div>
                  <h2 className="text-2xl md:text-3xl font-bold text-white mb-4 group-hover:text-[#FF7A00] transition-colors">
                    {featuredArticle.title}
                  </h2>
                  <p className="text-white/70 mb-6 line-clamp-3">
                    {featuredArticle.excerpt}
                  </p>
                  <div className="flex items-center gap-4 text-white/50 text-sm">
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4" />
                      {featuredArticle.author}
                    </div>
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4" />
                      {featuredArticle.date}
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4" />
                      {featuredArticle.readTime}
                    </div>
                  </div>
                </div>
              </div>
            </article>

            {/* Article Grid */}
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {articles.map((article, idx) => (
                <article
                  key={idx}
                  className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-6 hover:bg-white/10 transition-all group cursor-pointer flex flex-col"
                >
                  <span className="text-[#06B6D4] text-sm font-semibold mb-3">
                    {article.category}
                  </span>
                  <h2 className="text-xl font-bold text-white mb-3 group-hover:text-[#FF7A00] transition-colors line-clamp-2">
                    {article.title}
                  </h2>
                  <p className="text-white/70 mb-4 text-sm line-clamp-3 flex-grow">
                    {article.excerpt}
                  </p>
                  
                  {/* Tags */}
                  <div className="flex flex-wrap gap-2 mb-4">
                    {article.tags.slice(0, 2).map((tag) => (
                      <span
                        key={tag}
                        className="bg-white/10 text-white/60 text-xs px-2 py-1 rounded"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>

                  <div className="flex items-center justify-between text-white/50 text-sm pt-4 border-t border-white/10">
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-1">
                        <Calendar className="h-3.5 w-3.5" />
                        {article.date}
                      </div>
                      <div className="flex items-center gap-1">
                        <Clock className="h-3.5 w-3.5" />
                        {article.readTime}
                      </div>
                    </div>
                    <ArrowRight className="h-5 w-5 text-[#FF7A00] opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                </article>
              ))}
            </div>

            {/* Newsletter CTA */}
            <div className="mt-16 bg-gradient-to-r from-[#FF7A00]/20 to-[#06B6D4]/20 border border-white/10 rounded-2xl p-8 md:p-12 text-center">
              <h3 className="text-2xl md:text-3xl font-bold text-white mb-4">
                Stay Ahead of the Market
              </h3>
              <p className="text-white/70 mb-6 max-w-xl mx-auto">
                Get weekly insights on real estate feasibility, market trends, and data-driven development strategies.
              </p>
              <div className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
                <input
                  type="email"
                  placeholder="Enter your email"
                  className="flex-1 px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder:text-white/50 focus:outline-none focus:border-[#FF7A00]"
                />
                <button className="px-6 py-3 bg-[#FF7A00] hover:bg-[#FF7A00]/90 text-white font-semibold rounded-lg transition-colors">
                  Subscribe
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default Blog;
