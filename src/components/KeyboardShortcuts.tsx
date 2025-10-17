import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Keyboard } from 'lucide-react';

export const KeyboardShortcuts = () => {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger shortcuts when typing in inputs
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }

      // Open shortcuts overlay with ?
      if (e.key === '?' && !e.metaKey && !e.ctrlKey) {
        e.preventDefault();
        setOpen(true);
      }
      
      // Quick navigation shortcuts
      if (e.metaKey || e.ctrlKey) {
        switch(e.key) {
          case 'k': // Command palette (future feature)
            e.preventDefault();
            break;
          case 'n': // New application
            e.preventDefault();
            navigate('/application?step=0');
            break;
          case 'd': // Dashboard
            e.preventDefault();
            navigate('/dashboard');
            break;
          case 'h': // Home
            e.preventDefault();
            navigate('/');
            break;
        }
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [navigate]);
  
  const shortcuts = [
    { keys: ['?'], description: 'Show keyboard shortcuts' },
    { keys: ['⌘', 'K'], description: 'Open command palette (coming soon)' },
    { keys: ['⌘', 'N'], description: 'New application' },
    { keys: ['⌘', 'D'], description: 'Go to dashboard' },
    { keys: ['⌘', 'H'], description: 'Go to homepage' },
    { keys: ['ESC'], description: 'Close dialogs' },
  ];
  
  return (
    <>
      {/* Floating hint button */}
      <button
        onClick={() => setOpen(true)}
        className="fixed bottom-4 right-4 z-40 p-3 bg-primary/90 hover:bg-primary text-white rounded-full shadow-lg transition-all hover:scale-110"
        aria-label="Show keyboard shortcuts"
      >
        <Keyboard className="h-5 w-5" />
      </button>
      
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Keyboard Shortcuts</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 py-4">
            {shortcuts.map((shortcut, idx) => (
              <div key={idx} className="flex items-center justify-between p-3 border rounded-lg">
                <span className="text-sm text-muted-foreground">{shortcut.description}</span>
                <div className="flex gap-1">
                  {shortcut.keys.map((key, i) => (
                    <Badge key={i} variant="outline" className="font-mono">
                      {key}
                    </Badge>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};
