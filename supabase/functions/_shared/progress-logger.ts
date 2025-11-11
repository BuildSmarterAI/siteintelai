import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

export interface ProgressLog {
  timestamp: string;
  step: string;
  substep?: string;
  message: string;
  level: 'info' | 'success' | 'warning' | 'error';
  metadata?: Record<string, any>;
}

export class ProgressLogger {
  private supabase: any;
  private applicationId: string;
  private logs: ProgressLog[] = [];

  constructor(supabaseUrl: string, serviceKey: string, applicationId: string) {
    this.supabase = createClient(supabaseUrl, serviceKey);
    this.applicationId = applicationId;
  }

  async log(
    step: string,
    message: string,
    level: 'info' | 'success' | 'warning' | 'error' = 'info',
    substep?: string,
    metadata?: Record<string, any>
  ) {
    const logEntry: ProgressLog = {
      timestamp: new Date().toISOString(),
      step,
      substep,
      message,
      level,
      metadata
    };

    this.logs.push(logEntry);
    console.log(`[${level.toUpperCase()}] [${step}${substep ? ` > ${substep}` : ''}] ${message}`);

    // Broadcast to realtime channel
    await this.broadcast(logEntry);
  }

  private async broadcast(logEntry: ProgressLog) {
    try {
      const channel = this.supabase.channel(`app:${this.applicationId}`);
      await channel.subscribe();
      await channel.send({
        type: 'broadcast',
        event: 'progress_log',
        payload: logEntry
      });
      await channel.unsubscribe();
    } catch (err) {
      console.error('[ProgressLogger] Broadcast failed:', err);
    }
  }

  getLogs() {
    return this.logs;
  }
}
