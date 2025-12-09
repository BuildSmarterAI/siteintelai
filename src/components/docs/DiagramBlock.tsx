interface DiagramBlockProps {
  content: string;
  title?: string;
}

export const DiagramBlock = ({ content, title }: DiagramBlockProps) => {
  return (
    <div className="rounded-lg overflow-hidden border border-[hsl(var(--data-cyan))]/30 bg-[hsl(var(--midnight-blue))]">
      {title && (
        <div className="px-4 py-2 border-b border-[hsl(var(--data-cyan))]/20 bg-[hsl(var(--data-cyan))]/10">
          <span className="text-sm font-heading text-[hsl(var(--data-cyan))]">{title}</span>
        </div>
      )}
      <div className="p-6 overflow-x-auto">
        <pre className="font-mono text-sm text-white/90 whitespace-pre leading-relaxed">
          {content}
        </pre>
      </div>
    </div>
  );
};
