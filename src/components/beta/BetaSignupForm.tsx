import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

const betaSignupSchema = z.object({
  email: z
    .string()
    .email("Valid email required")
    .refine(
      (email) => !email.endsWith("@gmail.com") && !email.endsWith("@yahoo.com") && !email.endsWith("@hotmail.com"),
      "Please use a work email address"
    ),
  role: z.string().min(1, "Please select your role"),
  company: z.string().optional(),
  interests: z.array(z.string()).min(1, "Select at least one area of interest"),
});

type BetaSignupForm = z.infer<typeof betaSignupSchema>;

const roles = [
  "Developer",
  "Lender / Underwriter",
  "City Planner / Municipal Reviewer",
  "Broker / Agent",
  "Architect / Design-Build",
  "Other",
];

const interests = [
  { id: "residential", label: "Residential feasibility (single-family / multifamily)" },
  { id: "commercial", label: "Commercial feasibility (retail / office / industrial)" },
  { id: "infrastructure", label: "Infrastructure analysis (utilities / access)" },
  { id: "lender", label: "Lender integration / underwriting workflow" },
  { id: "api", label: "API / enterprise integration" },
];

export const BetaSignupForm = () => {
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [selectedInterests, setSelectedInterests] = useState<string[]>([]);
  const { toast } = useToast();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    setValue,
    watch,
  } = useForm<BetaSignupForm>({
    resolver: zodResolver(betaSignupSchema),
    defaultValues: {
      interests: [],
    },
  });

  const email = watch("email");
  const role = watch("role");

  const onSubmit = async (data: BetaSignupForm) => {
    try {
      const { data: insertData, error } = await supabase.functions.invoke("submit-beta-signup", {
        body: data,
      });

      if (error) throw error;

      setIsSubmitted(true);
      toast({
        title: "Success!",
        description: "You're on the list. Check your inbox for next steps.",
      });
    } catch (error) {
      console.error("Beta signup error:", error);
      toast({
        title: "Submission failed",
        description: "Please try again or contact beta@siteintel.com",
        variant: "destructive",
      });
    }
  };

  const handleInterestChange = (interestId: string, checked: boolean) => {
    let updated: string[];
    if (checked) {
      updated = [...selectedInterests, interestId];
    } else {
      updated = selectedInterests.filter((id) => id !== interestId);
    }
    setSelectedInterests(updated);
    setValue("interests", updated);
  };

  if (isSubmitted) {
    return (
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="text-center p-8 bg-card/50 backdrop-blur-sm rounded-xl border border-border"
      >
        <CheckCircle2 className="w-16 h-16 text-success mx-auto mb-4" />
        <h3 className="text-2xl font-semibold text-foreground mb-2">
          You're confirmed!
        </h3>
        <p className="text-muted-foreground mb-6">
          Beta invites roll out in waves — watch your inbox for next steps.
        </p>
        <Button variant="outline" asChild>
          <a href="/sample-report.pdf" target="_blank" rel="noopener noreferrer">
            Download Sample Report →
          </a>
        </Button>
      </motion.div>
    );
  }

  return (
    <motion.form
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      onSubmit={handleSubmit(onSubmit)}
      className="space-y-6 p-8 bg-card/50 backdrop-blur-sm rounded-xl border border-border"
    >
      {/* Email */}
      <div className="space-y-2">
        <Label htmlFor="email">Work Email *</Label>
        <Input
          id="email"
          type="email"
          placeholder="you@company.com"
          {...register("email")}
          className={errors.email ? "border-destructive" : ""}
        />
        {errors.email && (
          <p className="text-sm text-destructive">{errors.email.message}</p>
        )}
      </div>

      <AnimatePresence>
        {email && email.includes("@") && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="space-y-6"
          >
            {/* Role */}
            <div className="space-y-2">
              <Label htmlFor="role">Your Role *</Label>
              <Select onValueChange={(value) => setValue("role", value)}>
                <SelectTrigger id="role" className={errors.role ? "border-destructive" : ""}>
                  <SelectValue placeholder="Select your role" />
                </SelectTrigger>
                <SelectContent>
                  {roles.map((role) => (
                    <SelectItem key={role} value={role}>
                      {role}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.role && (
                <p className="text-sm text-destructive">{errors.role.message}</p>
              )}
            </div>

            {/* Company */}
            <div className="space-y-2">
              <Label htmlFor="company">Company (Optional)</Label>
              <Input
                id="company"
                type="text"
                placeholder="Your company name"
                {...register("company")}
              />
            </div>

            {/* Interests */}
            <div className="space-y-3">
              <Label>What you'd like to test *</Label>
              <div className="space-y-3">
                {interests.map((interest) => (
                  <div key={interest.id} className="flex items-start space-x-3">
                    <Checkbox
                      id={interest.id}
                      checked={selectedInterests.includes(interest.id)}
                      onCheckedChange={(checked) =>
                        handleInterestChange(interest.id, checked as boolean)
                      }
                    />
                    <Label
                      htmlFor={interest.id}
                      className="text-sm font-normal leading-relaxed cursor-pointer"
                    >
                      {interest.label}
                    </Label>
                  </div>
                ))}
              </div>
              {errors.interests && (
                <p className="text-sm text-destructive">{errors.interests.message}</p>
              )}
            </div>

            {/* Submit Button */}
            <Button
              type="submit"
              className="w-full"
              size="lg"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Submitting...
                </>
              ) : (
                <>Join the Private Beta →</>
              )}
            </Button>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.form>
  );
};
