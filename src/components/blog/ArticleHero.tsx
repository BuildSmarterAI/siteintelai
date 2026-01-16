import { Calendar, Clock, Tag, User } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import type { Author } from "@/data/blogArticles";

interface ArticleHeroProps {
  title: string;
  excerpt: string;
  author: Author;
  publishedDate: string;
  readTime: string;
  category: string;
  tags: string[];
  featuredImage?: string;
}

export function ArticleHero({
  title,
  excerpt,
  author,
  publishedDate,
  readTime,
  category,
  tags,
  featuredImage,
}: ArticleHeroProps) {
  const formattedDate = new Date(publishedDate).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <header className="relative py-12 lg:py-20">
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-to-b from-muted/50 to-background -z-10" />
      
      <div className="container max-w-4xl mx-auto px-4">
        {/* Category & Tags */}
        <div className="flex flex-wrap items-center gap-2 mb-6">
          <Badge variant="default" className="bg-primary text-primary-foreground">
            {category}
          </Badge>
          {tags.slice(0, 3).map((tag) => (
            <Badge key={tag} variant="outline" className="text-muted-foreground">
              {tag}
            </Badge>
          ))}
        </div>

        {/* Title */}
        <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-foreground leading-tight mb-6">
          {title}
        </h1>

        {/* Excerpt */}
        <p className="text-lg md:text-xl text-muted-foreground leading-relaxed mb-8">
          {excerpt}
        </p>

        {/* Author & Meta */}
        <div className="flex flex-wrap items-center gap-6 pt-6 border-t border-border">
          {/* Author */}
          <div className="flex items-center gap-3">
            <Avatar className="h-12 w-12">
              <AvatarImage src={author.avatar} alt={author.name} />
              <AvatarFallback className="bg-primary/10 text-primary font-semibold">
                {author.name.split(" ").map((n) => n[0]).join("")}
              </AvatarFallback>
            </Avatar>
            <div>
              <p className="font-semibold text-foreground">{author.name}</p>
              <p className="text-sm text-muted-foreground">{author.role}</p>
            </div>
          </div>

          {/* Divider */}
          <div className="hidden sm:block h-10 w-px bg-border" />

          {/* Date */}
          <div className="flex items-center gap-2 text-muted-foreground">
            <Calendar className="h-4 w-4" />
            <span className="text-sm">{formattedDate}</span>
          </div>

          {/* Read Time */}
          <div className="flex items-center gap-2 text-muted-foreground">
            <Clock className="h-4 w-4" />
            <span className="text-sm">{readTime} read</span>
          </div>
        </div>

        {/* Featured Image */}
        {featuredImage && (
          <div className="mt-10 rounded-xl overflow-hidden border border-border shadow-lg">
            <img
              src={featuredImage}
              alt={title}
              className="w-full h-auto object-cover"
            />
          </div>
        )}
      </div>
    </header>
  );
}
