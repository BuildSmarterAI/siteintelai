import { useState } from 'react';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Mail, Megaphone } from 'lucide-react';

interface EmailPreferencesProps {
  userId: string;
  reportNotifications: boolean;
  marketingEmails: boolean;
  onUpdate: (field: string, value: boolean) => void;
}

export const EmailPreferences = ({ 
  userId, 
  reportNotifications, 
  marketingEmails, 
  onUpdate 
}: EmailPreferencesProps) => {
  const [isUpdating, setIsUpdating] = useState<string | null>(null);

  const handleToggle = async (field: 'email_report_notifications' | 'email_marketing', value: boolean) => {
    setIsUpdating(field);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ [field]: value })
        .eq('id', userId);

      if (error) throw error;

      onUpdate(field, value);
      toast.success('Email preferences updated');
    } catch (error) {
      console.error('Error updating email preferences:', error);
      toast.error('Failed to update preferences');
    } finally {
      setIsUpdating(null);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-xl">Email Preferences</CardTitle>
        <CardDescription>Manage how we communicate with you</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-start gap-3">
            <Mail className="h-5 w-5 text-muted-foreground mt-0.5" />
            <div className="space-y-1">
              <Label htmlFor="report-notifications" className="font-medium">
                Report Completion Notifications
              </Label>
              <p className="text-sm text-muted-foreground">
                Receive an email when your feasibility reports are ready
              </p>
            </div>
          </div>
          <Switch
            id="report-notifications"
            checked={reportNotifications}
            onCheckedChange={(checked) => handleToggle('email_report_notifications', checked)}
            disabled={isUpdating === 'email_report_notifications'}
          />
        </div>
        
        <div className="flex items-center justify-between">
          <div className="flex items-start gap-3">
            <Megaphone className="h-5 w-5 text-muted-foreground mt-0.5" />
            <div className="space-y-1">
              <Label htmlFor="marketing-emails" className="font-medium">
                Marketing Updates
              </Label>
              <p className="text-sm text-muted-foreground">
                Receive product updates, tips, and special offers
              </p>
            </div>
          </div>
          <Switch
            id="marketing-emails"
            checked={marketingEmails}
            onCheckedChange={(checked) => handleToggle('email_marketing', checked)}
            disabled={isUpdating === 'email_marketing'}
          />
        </div>
      </CardContent>
    </Card>
  );
};
