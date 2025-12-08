import { useState } from "react";
import { motion } from "framer-motion";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Loader2, CheckCircle, ArrowRight } from "lucide-react";

const roleOptions = [
  "Developer / Sponsor",
  "Lender / Credit",
  "Broker",
  "Franchise / Expansion",
  "Institutional Investor",
  "Other",
];

export const WaitlistForm = () => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    company: "",
    role: "",
    markets: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name || !formData.email || !formData.company || !formData.role) {
      toast.error("Please fill in all required fields");
      return;
    }

    setIsSubmitting(true);

    try {
      const { error } = await supabase.from("beta_signups").insert({
        email: formData.email,
        company: formData.company,
        role: formData.role,
        interests: formData.markets ? [formData.markets] : [],
        source: "prelaunch_waitlist",
      });

      if (error) throw error;

      setIsSubmitted(true);
      toast.success("You're on the list!");
    } catch (error) {
      console.error("Signup error:", error);
      toast.error("Something went wrong. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isSubmitted) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="p-8 bg-primary/5 border border-primary/20 rounded-2xl text-center"
      >
        <CheckCircle className="w-16 h-16 text-primary mx-auto mb-4" />
        <h3 className="font-heading text-2xl font-semibold text-foreground mb-2">
          You're on the list!
        </h3>
        <p className="text-muted-foreground">
          Thanks — we'll follow up with next steps and a sample report.
        </p>
      </motion.div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="space-y-2">
        <Label htmlFor="name" className="text-foreground">
          Full Name <span className="text-destructive">*</span>
        </Label>
        <Input
          id="name"
          type="text"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          placeholder="John Smith"
          className="bg-background"
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="email" className="text-foreground">
          Work Email <span className="text-destructive">*</span>
        </Label>
        <Input
          id="email"
          type="email"
          value={formData.email}
          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
          placeholder="john@company.com"
          className="bg-background"
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="company" className="text-foreground">
          Company <span className="text-destructive">*</span>
        </Label>
        <Input
          id="company"
          type="text"
          value={formData.company}
          onChange={(e) => setFormData({ ...formData, company: e.target.value })}
          placeholder="Acme Development"
          className="bg-background"
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="role" className="text-foreground">
          Role <span className="text-destructive">*</span>
        </Label>
        <Select
          value={formData.role}
          onValueChange={(value) => setFormData({ ...formData, role: value })}
        >
          <SelectTrigger className="bg-background">
            <SelectValue placeholder="Select your role" />
          </SelectTrigger>
          <SelectContent>
            {roleOptions.map((role) => (
              <SelectItem key={role} value={role}>
                {role}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="markets" className="text-foreground">
          Primary Markets
        </Label>
        <Input
          id="markets"
          type="text"
          value={formData.markets}
          onChange={(e) => setFormData({ ...formData, markets: e.target.value })}
          placeholder="e.g. Houston, Dallas, Austin"
          className="bg-background"
        />
      </div>

      <button
        type="submit"
        disabled={isSubmitting}
        className="w-full flex items-center justify-center gap-2 bg-primary hover:bg-primary/90 text-primary-foreground px-6 py-3 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isSubmitting ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            Joining...
          </>
        ) : (
          <>
            Join Prelaunch Waitlist
            <ArrowRight className="w-4 h-4" />
          </>
        )}
      </button>
    </form>
  );
};
