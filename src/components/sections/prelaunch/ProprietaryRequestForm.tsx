import { useState } from "react";
import { motion } from "framer-motion";
import { Send, Check, Loader2, Lock, Sparkles, AlertCircle, Users } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { z } from "zod";

const roleOptions = [
  "Developer / Acquisition",
  "Lender / Credit Committee",
  "Institutional Investor",
  "Franchise / Multi-site Expansion",
  "Industrial / Logistics",
  "Brokerage / Advisory",
  "Other",
];

const benefits = [
  "Access to the private computation environment",
  "CFI™ scoring",
  "Lender-ready feasibility reports",
  "Model previews & inference advancements",
  "Priority onboarding in Texas",
  "Pricing incentives",
  "Direct feedback channel with engineering team",
];

// Validation schema
const formSchema = z.object({
  name: z.string().trim().min(2, "Name must be at least 2 characters").max(100),
  email: z.string().trim().email("Please enter a valid email address").max(255),
  company: z.string().trim().min(2, "Company name is required").max(100),
  role: z.string().min(1, "Please select your role"),
  markets: z.string().max(200).optional(),
  useCase: z.string().max(1000).optional(),
});

type FormErrors = Partial<Record<keyof z.infer<typeof formSchema>, string>>;

export const ProprietaryRequestForm = () => {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    company: "",
    role: "",
    markets: "",
    useCase: "",
  });
  const [errors, setErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const validateField = (field: keyof typeof formData, value: string) => {
    try {
      formSchema.shape[field].parse(value);
      setErrors(prev => ({ ...prev, [field]: undefined }));
      return true;
    } catch (err) {
      if (err instanceof z.ZodError) {
        setErrors(prev => ({ ...prev, [field]: err.errors[0]?.message }));
      }
      return false;
    }
  };

  const handleBlur = (field: keyof typeof formData) => {
    if (formData[field]) {
      validateField(field, formData[field]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate all fields
    const result = formSchema.safeParse(formData);
    if (!result.success) {
      const fieldErrors: FormErrors = {};
      result.error.errors.forEach(err => {
        const field = err.path[0] as keyof FormErrors;
        if (!fieldErrors[field]) {
          fieldErrors[field] = err.message;
        }
      });
      setErrors(fieldErrors);
      toast.error("Please fix the errors below");
      return;
    }

    setIsSubmitting(true);

    try {
      const { error } = await supabase.from("beta_signups").insert({
        email: formData.email.trim(),
        company: formData.company.trim(),
        role: formData.role,
        full_name: formData.name.trim(),
        use_case: formData.useCase.trim() || null,
        interests: formData.markets ? formData.markets.split(",").map(m => m.trim()) : [],
        source: "proprietary_waitlist",
      });

      if (error) throw error;

      setIsSubmitted(true);
      toast.success("Application submitted successfully");
    } catch (error) {
      console.error("Submission error:", error);
      toast.error("Failed to submit. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Calculate form progress
  const requiredFields = ['name', 'email', 'company', 'role'] as const;
  const filledRequired = requiredFields.filter(f => formData[f].trim() !== '').length;
  const progress = Math.round((filledRequired / requiredFields.length) * 100);

  return (
    <section id="request-access" className="py-24 bg-background">
      <div className="max-w-6xl mx-auto px-6 md:px-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          {/* Scarcity badge */}
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary/10 border border-primary/30 rounded-full mb-6">
            <Users className="w-4 h-4 text-primary" />
            <span className="text-sm font-medium text-primary">Limited seats available for Q1 2025</span>
          </div>

          <h2 className="font-heading text-3xl md:text-4xl lg:text-5xl font-bold tracking-tight text-foreground mb-4">
            Request Access to the Proprietary Feasibility Engine
          </h2>
          <p className="text-lg text-muted-foreground">
            Enrollment is selective. Not all applicants will be approved.
          </p>
        </motion.div>

        <div className="grid lg:grid-cols-2 gap-12">
          {/* Form */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="bg-muted/30 border border-border rounded-xl p-6 md:p-8"
          >
            {isSubmitted ? (
              <div className="flex flex-col items-center justify-center py-12 space-y-4">
                <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center">
                  <Check className="w-8 h-8 text-primary" />
                </div>
                <h3 className="text-xl font-semibold text-foreground">Application Received</h3>
                <p className="text-muted-foreground text-center">
                  We'll review your application and reach out if approved.
                </p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-5">
                {/* Progress bar */}
                <div className="mb-6">
                  <div className="flex justify-between text-xs text-muted-foreground mb-1">
                    <span>Form progress</span>
                    <span>{progress}%</span>
                  </div>
                  <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                    <motion.div
                      className="h-full bg-primary rounded-full"
                      initial={{ width: 0 }}
                      animate={{ width: `${progress}%` }}
                      transition={{ duration: 0.3 }}
                    />
                  </div>
                </div>

                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name" className="flex items-center gap-1">
                      Full Name <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      onBlur={() => handleBlur('name')}
                      placeholder="John Smith"
                      required
                      className={`bg-background ${errors.name ? 'border-destructive focus-visible:ring-destructive' : ''}`}
                    />
                    {errors.name && (
                      <p className="text-xs text-destructive flex items-center gap-1">
                        <AlertCircle className="w-3 h-3" />
                        {errors.name}
                      </p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email" className="flex items-center gap-1">
                      Work Email <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      onBlur={() => handleBlur('email')}
                      placeholder="john@company.com"
                      required
                      className={`bg-background ${errors.email ? 'border-destructive focus-visible:ring-destructive' : ''}`}
                    />
                    {errors.email && (
                      <p className="text-xs text-destructive flex items-center gap-1">
                        <AlertCircle className="w-3 h-3" />
                        {errors.email}
                      </p>
                    )}
                  </div>
                </div>

                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="company" className="flex items-center gap-1">
                      Company <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      id="company"
                      value={formData.company}
                      onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                      onBlur={() => handleBlur('company')}
                      placeholder="Acme Development"
                      required
                      className={`bg-background ${errors.company ? 'border-destructive focus-visible:ring-destructive' : ''}`}
                    />
                    {errors.company && (
                      <p className="text-xs text-destructive flex items-center gap-1">
                        <AlertCircle className="w-3 h-3" />
                        {errors.company}
                      </p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="role" className="flex items-center gap-1">
                      Role <span className="text-destructive">*</span>
                    </Label>
                    <Select
                      value={formData.role}
                      onValueChange={(value) => {
                        setFormData({ ...formData, role: value });
                        setErrors(prev => ({ ...prev, role: undefined }));
                      }}
                    >
                      <SelectTrigger className={`bg-background ${errors.role ? 'border-destructive focus:ring-destructive' : ''}`}>
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
                    {errors.role && (
                      <p className="text-xs text-destructive flex items-center gap-1">
                        <AlertCircle className="w-3 h-3" />
                        {errors.role}
                      </p>
                    )}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="markets">Primary Markets</Label>
                  <Input
                    id="markets"
                    value={formData.markets}
                    onChange={(e) => setFormData({ ...formData, markets: e.target.value })}
                    placeholder="Houston, Dallas, Austin"
                    className="bg-background"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="useCase">
                    Intended Use Case{" "}
                    <span className="text-muted-foreground text-xs">(increases acceptance likelihood)</span>
                  </Label>
                  <Textarea
                    id="useCase"
                    value={formData.useCase}
                    onChange={(e) => setFormData({ ...formData, useCase: e.target.value })}
                    placeholder="Describe how you plan to use the feasibility engine..."
                    rows={3}
                    className="bg-background"
                  />
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full inline-flex items-center justify-center gap-2 bg-primary hover:bg-primary/90 text-primary-foreground px-6 py-3 rounded-lg font-semibold transition-all hover:scale-[1.01] disabled:opacity-50 disabled:hover:scale-100 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Submitting...
                    </>
                  ) : (
                    <>
                      Request Access to SiteIntel™
                      <Send className="w-4 h-4" />
                    </>
                  )}
                </button>
              </form>
            )}
          </motion.div>

          {/* Benefits */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="space-y-8"
          >
            <div>
              <p className="text-muted-foreground mb-2">If accepted, you receive:</p>
              <h3 className="font-heading text-2xl font-semibold text-foreground flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-primary" />
                Early Access Benefits
              </h3>
            </div>

            <ul className="space-y-4">
              {benefits.map((benefit, index) => (
                <motion.li
                  key={benefit}
                  initial={{ opacity: 0, x: 10 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.05 }}
                  className="flex items-start gap-3"
                >
                  <Check className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                  <span className="text-foreground/90">{benefit}</span>
                </motion.li>
              ))}
            </ul>

            <div className="p-4 bg-muted/30 border border-border rounded-lg">
              <div className="flex items-center gap-2 text-muted-foreground">
                <Lock className="w-4 h-4" />
                <span className="text-sm">Access is reviewed on a rolling basis</span>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};
