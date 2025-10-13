import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { CheckCircle, Circle, Lock, X, RotateCcw } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import confetti from "canvas-confetti";

interface ChecklistItem {
  id: string;
  label: string;
  icon: React.ElementType;
  status: 'completed' | 'current' | 'locked';
  description?: string;
}

interface OnboardingChecklistProps {
  items: ChecklistItem[];
  onDismiss?: () => void;
  onItemClick?: (itemId: string) => void;
}

export function OnboardingChecklist({ items, onDismiss, onItemClick }: OnboardingChecklistProps) {
  const [isVisible, setIsVisible] = useState(true);
  const [completedCount, setCompletedCount] = useState(0);
  const totalCount = items.length;
  const progress = (completedCount / totalCount) * 100;

  useEffect(() => {
    const completed = items.filter(item => item.status === 'completed').length;
    const prevCompleted = completedCount;
    setCompletedCount(completed);

    // Trigger confetti when a new item is completed
    if (completed > prevCompleted) {
      confetti({
        particleCount: 50,
        spread: 60,
        origin: { y: 0.6 },
        colors: ['#FF7A00', '#06B6D4', '#FFF']
      });
    }
  }, [items]);

  const handleDismiss = () => {
    setIsVisible(false);
    localStorage.setItem('onboarding_checklist_dismissed', 'true');
    onDismiss?.();
  };

  const handleReset = () => {
    localStorage.removeItem('onboarding_checklist_dismissed');
    setIsVisible(true);
  };

  if (!isVisible) {
    return (
      <Button
        variant="ghost"
        size="sm"
        onClick={handleReset}
        className="text-muted-foreground"
      >
        <RotateCcw className="mr-2 h-4 w-4" />
        Show Getting Started Checklist
      </Button>
    );
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        transition={{ duration: 0.3 }}
      >
        <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-transparent">
          <CardHeader className="pb-3">
            <div className="flex items-start justify-between">
              <div className="space-y-1">
                <CardTitle className="text-xl flex items-center gap-2">
                  🚀 Getting Started with SiteIntel™
                </CardTitle>
                <CardDescription>
                  Complete these steps to unlock the full power of AI feasibility
                </CardDescription>
              </div>
              {completedCount >= 3 && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleDismiss}
                  className="h-8 w-8"
                >
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>
            <div className="mt-4 space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">
                  {completedCount} of {totalCount} completed
                </span>
                <span className="font-semibold text-primary">{Math.round(progress)}%</span>
              </div>
              <Progress value={progress} className="h-2" />
            </div>
          </CardHeader>

          <CardContent className="space-y-3">
            {items.map((item, index) => {
              const Icon = item.icon;
              const isCompleted = item.status === 'completed';
              const isCurrent = item.status === 'current';
              const isLocked = item.status === 'locked';

              return (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <button
                    onClick={() => !isLocked && onItemClick?.(item.id)}
                    disabled={isLocked}
                    className={`
                      w-full flex items-start gap-3 p-3 rounded-lg transition-all
                      ${isCompleted ? 'bg-primary/10 border border-primary/20' : ''}
                      ${isCurrent ? 'bg-accent border border-accent-foreground/20 hover:bg-accent/80' : ''}
                      ${isLocked ? 'opacity-50 cursor-not-allowed' : 'hover:bg-accent/50 cursor-pointer'}
                    `}
                  >
                    <div className="flex-shrink-0 mt-0.5">
                      {isCompleted && (
                        <CheckCircle className="h-5 w-5 text-primary" />
                      )}
                      {isCurrent && (
                        <Circle className="h-5 w-5 text-accent-foreground" />
                      )}
                      {isLocked && (
                        <Lock className="h-5 w-5 text-muted-foreground" />
                      )}
                    </div>

                    <div className="flex-1 text-left">
                      <div className="flex items-center gap-2 mb-1">
                        <Icon className="h-4 w-4" />
                        <span className={`font-medium ${isCompleted ? 'text-primary' : ''}`}>
                          {item.label}
                        </span>
                        {isCurrent && (
                          <Badge variant="secondary" className="text-xs">Current</Badge>
                        )}
                      </div>
                      {item.description && (
                        <p className="text-sm text-muted-foreground">{item.description}</p>
                      )}
                    </div>
                  </button>
                </motion.div>
              );
            })}
          </CardContent>
        </Card>
      </motion.div>
    </AnimatePresence>
  );
}
