import { useState } from 'react';
import { MessageSquare, X, Send, Loader2, Copy } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

interface ReportChatAssistantProps {
  reportData: any;
  applicationData: any;
}

const SUGGESTED_QUESTIONS = [
  "What's the biggest risk for this property?",
  "Explain the zoning implications",
  "What utilities are available?",
  "Is this property in a flood zone?",
  "What's my development timeline?",
];

export const ReportChatAssistant = ({ reportData, applicationData }: ReportChatAssistantProps) => {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);

  const sendMessage = async (messageText: string = input) => {
    if (!messageText.trim() || loading) return;

    const userMessage: Message = { role: 'user', content: messageText };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setLoading(true);

    try {
      // Build report context for AI
      const reportContext = {
        address: applicationData.formatted_address,
        score: reportData.feasibility_score,
        scoreBand: reportData.score_band,
        zoning: applicationData.zoning_code,
        floodZone: applicationData.floodplain_zone,
        intentType: applicationData.intent_type,
        projectDetails: {
          projectType: applicationData.project_type,
          buildingSize: applicationData.building_size_value,
          budget: applicationData.desired_budget,
        },
        keyFindings: {
          traffic: applicationData.traffic_aadt,
          utilities: reportData.json_data?.utilities?.summary,
          environmental: reportData.json_data?.environmental?.sites,
        },
      };

      const { data, error } = await supabase.functions.invoke('chat-with-report', {
        body: {
          messages: [...messages, userMessage],
          reportContext,
        },
      });

      if (error) {
        if (error.message.includes('429')) {
          throw new Error('Too many requests. Please wait a moment and try again.');
        } else if (error.message.includes('402')) {
          throw new Error('AI credits exhausted. Please contact support.');
        }
        throw error;
      }

      const assistantMessage: Message = {
        role: 'assistant',
        content: data.response,
      };
      setMessages(prev => [...prev, assistantMessage]);
    } catch (error: any) {
      console.error('Chat error:', error);
      toast.error(error.message || 'Failed to get AI response. Please try again.');
      
      // Remove user message if error occurred
      setMessages(prev => prev.slice(0, -1));
    } finally {
      setLoading(false);
    }
  };

  const copyMessage = (content: string) => {
    navigator.clipboard.writeText(content);
    toast.success('Copied to clipboard');
  };

  return (
    <>
      {/* Floating Chat Button */}
      <motion.div
        className="fixed bottom-6 right-6 z-50"
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 1, duration: 0.3 }}
      >
        <Button
          data-tour="chat-assistant"
          onClick={() => setOpen(true)}
          size="lg"
          className="rounded-full h-14 w-14 shadow-2xl bg-primary hover:bg-primary/90 text-white"
        >
          <MessageSquare className="h-6 w-6" />
        </Button>
      </motion.div>

      {/* Chat Panel */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="fixed bottom-24 right-6 z-50 w-[400px] h-[550px] bg-white rounded-2xl shadow-2xl border border-charcoal/10 flex flex-col overflow-hidden"
          >
            {/* Header */}
            <div className="bg-primary text-white p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="h-8 w-8 rounded-full bg-white/20 flex items-center justify-center">
                  <MessageSquare className="h-4 w-4" />
                </div>
                <div>
                  <h3 className="font-semibold text-sm">SiteIntel™ AI Assistant</h3>
                  <p className="text-xs text-white/80">Ask about your report</p>
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setOpen(false)}
                className="text-white hover:bg-white/20 h-8 w-8 p-0"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gradient-to-b from-gray-50 to-white">
              {messages.length === 0 && (
                <div className="space-y-3">
                  <p className="text-sm text-charcoal/60 text-center mb-4">
                    💡 Ask me anything about your feasibility report
                  </p>
                  <div className="space-y-2">
                    {SUGGESTED_QUESTIONS.map((question, idx) => (
                      <Button
                        key={idx}
                        variant="outline"
                        size="sm"
                        className="w-full text-left justify-start text-xs h-auto py-2 px-3"
                        onClick={() => sendMessage(question)}
                      >
                        {question}
                      </Button>
                    ))}
                  </div>
                </div>
              )}

              {messages.map((message, idx) => (
                <div
                  key={idx}
                  className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[85%] rounded-lg p-3 ${
                      message.role === 'user'
                        ? 'bg-primary text-white'
                        : 'bg-white border border-charcoal/10 text-charcoal'
                    }`}
                  >
                    <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                    {message.role === 'assistant' && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="mt-2 h-6 text-xs"
                        onClick={() => copyMessage(message.content)}
                      >
                        <Copy className="h-3 w-3 mr-1" />
                        Copy
                      </Button>
                    )}
                  </div>
                </div>
              ))}

              {loading && (
                <div className="flex justify-start">
                  <div className="bg-white border border-charcoal/10 rounded-lg p-3 flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin text-primary" />
                    <span className="text-sm text-charcoal/60">Analyzing report...</span>
                  </div>
                </div>
              )}
            </div>

            {/* Input Area */}
            <div className="p-4 border-t border-charcoal/10 bg-white">
              <div className="flex gap-2">
                <Input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      sendMessage();
                    }
                  }}
                  placeholder="Ask a question..."
                  disabled={loading}
                  className="flex-1"
                />
                <Button
                  onClick={() => sendMessage()}
                  disabled={!input.trim() || loading}
                  size="sm"
                  className="bg-primary hover:bg-primary/90"
                >
                  <Send className="h-4 w-4" />
                </Button>
              </div>
              <p className="text-xs text-charcoal/40 mt-2 text-center">
                AI responses are experimental. Verify with report data.
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};
