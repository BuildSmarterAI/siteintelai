import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent } from "@/components/ui/card";
import type { Author } from "@/data/blogArticles";

interface AuthorBioProps {
  author: Author;
}

export function AuthorBio({ author }: AuthorBioProps) {
  return (
    <Card className="border-border bg-muted/30">
      <CardContent className="p-6">
        <div className="flex flex-col sm:flex-row gap-4">
          <Avatar className="h-16 w-16 flex-shrink-0">
            <AvatarImage src={author.avatar} alt={author.name} />
            <AvatarFallback className="bg-primary/10 text-primary text-xl font-semibold">
              {author.name.split(" ").map((n) => n[0]).join("")}
            </AvatarFallback>
          </Avatar>
          <div>
            <p className="text-sm text-muted-foreground mb-1">Written by</p>
            <h3 className="text-lg font-semibold text-foreground mb-1">
              {author.name}
            </h3>
            <p className="text-sm text-primary font-medium mb-3">
              {author.role}
            </p>
            <p className="text-sm text-muted-foreground leading-relaxed">
              {author.bio}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
