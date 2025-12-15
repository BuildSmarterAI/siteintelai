import { AlertTriangle, Copy, ExternalLink } from 'lucide-react';
import { OAuthError, OAUTH_ERROR_MESSAGES } from '@/hooks/useOAuthErrorHandler';

interface OAuthDebugPanelProps {
  error: OAuthError | null;
  show: boolean;
  onClose: () => void;
  onCopyDebugInfo: () => void;
}

export function OAuthDebugPanel({ error, show, onClose, onCopyDebugInfo }: OAuthDebugPanelProps) {
  if (!error || !show) return null;

  const errorInfo = OAUTH_ERROR_MESSAGES[error.code] || {
    title: 'Authentication Error',
    description: error.description,
    suggestion: 'Please try again or contact support if the issue persists.'
  };

  return (
    <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-card border rounded-lg shadow-lg max-w-2xl w-full max-h-[80vh] overflow-auto">
        <div className="p-4 border-b flex items-center justify-between">
          <h3 className="font-semibold text-lg flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-destructive" />
            OAuth Debug Information
          </h3>
          <button
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground text-xl"
          >
            ×
          </button>
        </div>
        
        <div className="p-4 space-y-4">
          <div className="grid gap-2 text-sm">
            <div className="flex justify-between py-2 border-b">
              <span className="font-medium">Error Code</span>
              <code className="bg-destructive/10 text-destructive px-2 py-0.5 rounded">{error.code}</code>
            </div>
            <div className="py-2 border-b">
              <span className="font-medium">Title</span>
              <p className="text-foreground mt-1">{errorInfo.title}</p>
            </div>
            <div className="py-2 border-b">
              <span className="font-medium">Description</span>
              <p className="text-muted-foreground mt-1">{error.description}</p>
            </div>
            <div className="py-2 border-b">
              <span className="font-medium">Suggestion</span>
              <p className="text-muted-foreground mt-1">{errorInfo.suggestion}</p>
            </div>
            <div className="py-2 border-b">
              <span className="font-medium">Current Origin</span>
              <code className="block bg-muted px-2 py-1 rounded mt-1 text-xs break-all">{error.origin}</code>
            </div>
            <div className="py-2 border-b">
              <span className="font-medium">Expected Supabase Callback</span>
              <code className="block bg-muted px-2 py-1 rounded mt-1 text-xs break-all">
                https://mcmfwlgovubpdcfiqfvk.supabase.co/auth/v1/callback
              </code>
            </div>
            <div className="py-2 border-b">
              <span className="font-medium">Timestamp</span>
              <span className="text-muted-foreground ml-2">{new Date(error.timestamp).toLocaleString()}</span>
            </div>
          </div>

          <div className="bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-lg p-4">
            <h4 className="font-semibold text-amber-800 dark:text-amber-200 mb-2">Configuration Checklist</h4>
            <ul className="text-sm space-y-2 text-amber-700 dark:text-amber-300">
              <li className="flex items-start gap-2">
                <span>•</span>
                <span>
                  <strong>Google Cloud Console</strong>: Authorized redirect URI must be{' '}
                  <code className="bg-amber-100 dark:bg-amber-900/50 px-1 rounded text-xs">
                    https://mcmfwlgovubpdcfiqfvk.supabase.co/auth/v1/callback
                  </code>
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span>•</span>
                <span>
                  <strong>Google Cloud Console</strong>: Authorized JavaScript origins should include{' '}
                  <code className="bg-amber-100 dark:bg-amber-900/50 px-1 rounded text-xs">{error.origin}</code>
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span>•</span>
                <span>
                  <strong>Supabase Dashboard</strong>: Site URL should be{' '}
                  <code className="bg-amber-100 dark:bg-amber-900/50 px-1 rounded text-xs">{error.origin}</code>
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span>•</span>
                <span>
                  <strong>Supabase Dashboard</strong>: Redirect URLs should include{' '}
                  <code className="bg-amber-100 dark:bg-amber-900/50 px-1 rounded text-xs">{error.origin}/**</code>
                </span>
              </li>
            </ul>
          </div>

          <div className="flex gap-2">
            <button
              onClick={onCopyDebugInfo}
              className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 text-sm"
            >
              <Copy className="h-4 w-4" />
              Copy Debug Info
            </button>
            <a
              href="https://supabase.com/dashboard/project/mcmfwlgovubpdcfiqfvk/auth/providers"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 px-4 py-2 bg-secondary text-secondary-foreground rounded-lg hover:bg-secondary/90 text-sm"
            >
              <ExternalLink className="h-4 w-4" />
              Open Supabase Auth
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
