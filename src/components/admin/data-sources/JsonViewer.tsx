import { useState } from 'react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Copy, Check, ChevronDown, ChevronRight } from 'lucide-react';
import { toast } from 'sonner';

interface JsonViewerProps {
  data: unknown;
  className?: string;
  maxHeight?: string;
  collapsible?: boolean;
}

export function JsonViewer({ 
  data, 
  className, 
  maxHeight = '400px',
  collapsible = true 
}: JsonViewerProps) {
  const [copied, setCopied] = useState(false);
  const [collapsed, setCollapsed] = useState(false);

  const jsonString = JSON.stringify(data, null, 2);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(jsonString);
    setCopied(true);
    toast.success('Copied to clipboard');
    setTimeout(() => setCopied(false), 2000);
  };

  if (!data) {
    return (
      <div className="text-muted-foreground text-sm italic p-4 bg-muted/50 rounded-lg">
        No data available
      </div>
    );
  }

  return (
    <div className={cn('relative rounded-lg border bg-muted/30', className)}>
      <div className="flex items-center justify-between p-2 border-b bg-muted/50">
        <div className="flex items-center gap-2">
          {collapsible && (
            <Button
              variant="ghost"
              size="sm"
              className="h-6 w-6 p-0"
              onClick={() => setCollapsed(!collapsed)}
            >
              {collapsed ? (
                <ChevronRight className="h-4 w-4" />
              ) : (
                <ChevronDown className="h-4 w-4" />
              )}
            </Button>
          )}
          <span className="text-xs text-muted-foreground font-mono">
            {typeof data === 'object' && data !== null
              ? Array.isArray(data)
                ? `Array[${data.length}]`
                : `Object{${Object.keys(data).length} keys}`
              : typeof data}
          </span>
        </div>
        <Button
          variant="ghost"
          size="sm"
          className="h-6 px-2 gap-1"
          onClick={handleCopy}
        >
          {copied ? (
            <Check className="h-3 w-3 text-green-500" />
          ) : (
            <Copy className="h-3 w-3" />
          )}
          <span className="text-xs">Copy</span>
        </Button>
      </div>
      
      {!collapsed && (
        <pre
          className="p-4 overflow-auto text-xs font-mono"
          style={{ maxHeight }}
        >
          <code className="text-foreground">{jsonString}</code>
        </pre>
      )}
    </div>
  );
}
