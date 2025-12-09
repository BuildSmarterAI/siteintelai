import { useState } from "react";
import { Check, Copy } from "lucide-react";
import { Button } from "@/components/ui/button";

interface CodeBlockProps {
  code: string;
  language?: string;
  title?: string;
}

export const CodeBlock = ({ code, language = "json", title }: CodeBlockProps) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="rounded-lg overflow-hidden border border-white/10 bg-[hsl(var(--midnight-blue))]">
      {title && (
        <div className="flex items-center justify-between px-4 py-2 border-b border-white/10 bg-white/5">
          <span className="text-sm font-mono text-white/70">{title}</span>
          <span className="text-xs text-[hsl(var(--data-cyan))] uppercase">{language}</span>
        </div>
      )}
      <div className="relative">
        <Button
          variant="ghost"
          size="icon"
          className="absolute top-2 right-2 h-8 w-8 text-white/50 hover:text-white hover:bg-white/10"
          onClick={handleCopy}
        >
          {copied ? <Check className="h-4 w-4 text-green-400" /> : <Copy className="h-4 w-4" />}
        </Button>
        <pre className="p-4 overflow-x-auto">
          <code className="font-mono text-sm text-white/90 whitespace-pre">{code}</code>
        </pre>
      </div>
    </div>
  );
};
