import { Link } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowRight, Clock } from "lucide-react";
import type { BlogArticle } from "@/data/blogArticles";

interface RelatedArticlesProps {
  articles: BlogArticle[];
}

export function RelatedArticles({ articles }: RelatedArticlesProps) {
  if (articles.length === 0) return null;

  return (
    <section className="mt-16 pt-12 border-t border-border">
      <h2 className="text-2xl font-bold text-foreground mb-8">Related Articles</h2>
      <div className="grid md:grid-cols-3 gap-6">
        {articles.map((article) => (
          <Link key={article.slug} to={`/resources/blog/${article.slug}`}>
            <Card className="h-full border-border hover:border-primary/50 hover:shadow-lg transition-all duration-300 group">
              <CardContent className="p-6">
                <Badge variant="outline" className="mb-3 text-xs">
                  {article.category}
                </Badge>
                <h3 className="font-semibold text-foreground group-hover:text-primary transition-colors line-clamp-2 mb-3">
                  {article.title}
                </h3>
                <p className="text-sm text-muted-foreground line-clamp-2 mb-4">
                  {article.excerpt}
                </p>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <Clock className="h-3.5 w-3.5" />
                    <span>{article.readTime}</span>
                  </div>
                  <span className="text-primary text-sm font-medium flex items-center gap-1 group-hover:gap-2 transition-all">
                    Read <ArrowRight className="h-3.5 w-3.5" />
                  </span>
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </section>
  );
}
