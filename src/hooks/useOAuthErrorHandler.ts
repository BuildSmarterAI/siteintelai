import { useEffect, useState, useCallback } from 'react';
import { useSearchParams, useLocation } from 'react-router-dom';
import { toast } from 'sonner';

// Map OAuth error codes to user-friendly messages and suggestions
export const OAUTH_ERROR_MESSAGES: Record<string, { title: string; description: string; suggestion: string }> = {
  'access_denied': {
    title: 'Access Denied',
    description: 'Google sign-in was canceled or denied by the user.',
    suggestion: 'Try signing in again and make sure to allow access when prompted.'
  },
  'redirect_uri_mismatch': {
    title: 'Redirect URI Mismatch',
    description: 'The OAuth redirect URL does not match the configured URLs.',
    suggestion: 'Check that Google Cloud Console and Supabase Dashboard have matching redirect URLs.'
  },
  'invalid_request': {
    title: 'Invalid OAuth Request',
    description: 'The OAuth request was malformed or missing required parameters.',
    suggestion: 'Verify Google Cloud Console OAuth credentials and Supabase provider settings.'
  },
  'server_error': {
    title: 'Server Error',
    description: "Google's authorization server encountered an error.",
    suggestion: 'Wait a few moments and try again. If the issue persists, check Google Cloud status.'
  },
  'temporarily_unavailable': {
    title: 'Service Temporarily Unavailable',
    description: "Google's authorization server is temporarily overloaded.",
    suggestion: 'Wait a few moments and try again.'
  },
  'invalid_client': {
    title: 'Invalid Client',
    description: 'The OAuth client ID is invalid or not found.',
    suggestion: 'Check that the Client ID in Supabase matches Google Cloud Console.'
  },
  'unauthorized_client': {
    title: 'Unauthorized Client',
    description: 'This OAuth client is not authorized for the requested operation.',
    suggestion: 'Verify OAuth consent screen and client configuration in Google Cloud Console.'
  },
  'unsupported_response_type': {
    title: 'Unsupported Response Type',
    description: 'The requested response type is not supported.',
    suggestion: 'This is usually a configuration issue. Contact support if it persists.'
  }
};

export interface OAuthError {
  code: string;
  description: string;
  fullUrl: string;
  origin: string;
  timestamp: string;
}

export function useOAuthErrorHandler() {
  const [searchParams, setSearchParams] = useSearchParams();
  const location = useLocation();
  const [error, setError] = useState<OAuthError | null>(null);
  const [showDebugPanel, setShowDebugPanel] = useState(false);

  useEffect(() => {
    // Check URL hash for OAuth errors (fragment-based)
    const hash = window.location.hash;
    const hashParams = new URLSearchParams(hash.replace('#', ''));
    
    // Check query params for errors
    const errorCode = searchParams.get('error') || hashParams.get('error');
    const errorDescription = searchParams.get('error_description') || 
                             hashParams.get('error_description') || 
                             searchParams.get('message') ||
                             '';
    
    // Special case: "requested path is invalid" from Supabase
    const pathError = searchParams.get('error_code') === 'invalid_request' ||
                      errorDescription?.includes('requested path is invalid');

    if (errorCode || pathError) {
      const oauthError: OAuthError = {
        code: errorCode || 'invalid_request',
        description: decodeURIComponent(errorDescription || 'Unknown error'),
        fullUrl: window.location.href,
        origin: window.location.origin,
        timestamp: new Date().toISOString()
      };

      setError(oauthError);

      // Get friendly message
      const errorInfo = OAUTH_ERROR_MESSAGES[errorCode || 'invalid_request'] || {
        title: 'Authentication Error',
        description: oauthError.description,
        suggestion: 'Please try again or contact support if the issue persists.'
      };

      // Log to console for debugging
      console.group('🔐 OAuth Error Detected');
      console.error('Error Code:', oauthError.code);
      console.error('Description:', oauthError.description);
      console.log('Full URL:', oauthError.fullUrl);
      console.log('Origin:', oauthError.origin);
      console.log('Timestamp:', oauthError.timestamp);
      console.log('Supabase Project:', 'mcmfwlgovubpdcfiqfvk');
      console.groupEnd();

      // Show toast with error info
      toast.error(`${errorInfo.title}: ${errorInfo.description}`, {
        description: errorInfo.suggestion,
        duration: 15000,
        action: {
          label: 'Show Debug Info',
          onClick: () => setShowDebugPanel(true)
        }
      });

      // Clean up error params from URL after processing
      const newParams = new URLSearchParams(searchParams);
      newParams.delete('error');
      newParams.delete('error_description');
      newParams.delete('error_code');
      newParams.delete('message');
      setSearchParams(newParams, { replace: true });

      // Also clean hash if it contains errors
      if (hash.includes('error')) {
        window.history.replaceState(null, '', window.location.pathname + window.location.search);
      }
    }
  }, [searchParams, location.hash, setSearchParams]);

  const copyDebugInfo = useCallback(() => {
    if (!error) return;
    
    const debugText = `
OAuth Error Debug Info
======================
Error Code: ${error.code}
Description: ${error.description}
Full URL: ${error.fullUrl}
Origin: ${error.origin}
Timestamp: ${error.timestamp}
Supabase Project: mcmfwlgovubpdcfiqfvk
Expected Callback: https://mcmfwlgovubpdcfiqfvk.supabase.co/auth/v1/callback

Checklist:
- [ ] Google Cloud Console > Authorized redirect URIs includes: https://mcmfwlgovubpdcfiqfvk.supabase.co/auth/v1/callback
- [ ] Google Cloud Console > Authorized JavaScript origins includes: ${error.origin}
- [ ] Supabase Dashboard > Auth > URL Configuration > Site URL: ${error.origin}
- [ ] Supabase Dashboard > Auth > URL Configuration > Redirect URLs includes: ${error.origin}/**
- [ ] Supabase Dashboard > Auth > Providers > Google is enabled with correct Client ID/Secret
    `.trim();
    
    navigator.clipboard.writeText(debugText);
    toast.success('Debug info copied to clipboard');
  }, [error]);

  return {
    error,
    showDebugPanel,
    setShowDebugPanel,
    copyDebugInfo
  };
}
