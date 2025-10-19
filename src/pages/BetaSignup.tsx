import { useState } from "react";
import { Helmet } from "react-helmet";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { motion } from "framer-motion";
import { Shield, Lock, ArrowRight, CheckCircle2 } from "lucide-react";
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useCounter } from "@/hooks/useCounter";

const betaSignupSchema = z.object({
  email: z
    .string()
    .email("Please enter a valid email address")
    .refine(
      (email) => {
        const publicDomains = ["gmail.com", "yahoo.com", "hotmail.com", "outlook.com"];
        const domain = email.split("@")[1];
        return !publicDomains.includes(domain);
      },
      { message: "Please enter a valid business email address" }
    ),
  fullName: z.string().min(2, "Full name is required").max(100),
  role: z.enum(["developer", "lender", "investor", "advisor"], {
    required_error: "Please select your role",
  }),
  company: z.string().max(100).optional(),
  primaryFocus: z
    .enum(["building", "buying", "lending", "advising"])
    .optional(),
  referralCode: z.string().max(50).optional(),
  acceptTerms: z.boolean().refine((val) => val === true, {
    message: "Please accept Beta Terms before joining",
  }),
});

type BetaSignupForm = z.infer<typeof betaSignupSchema>;

export default function BetaSignup() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const { toast } = useToast();
  const seatsClaimed = useCounter(421, 2000);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<BetaSignupForm>({
    resolver: zodResolver(betaSignupSchema),
  });

  const acceptTerms = watch("acceptTerms");

  const onSubmit = async (data: BetaSignupForm) => {
    setIsSubmitting(true);
    try {
      const { error } = await supabase.functions.invoke("submit-beta-signup", {
        body: {
          email: data.email,
          full_name: data.fullName,
          role: data.role,
          company: data.company || null,
          primary_focus: data.primaryFocus || null,
          referral_code: data.referralCode || null,
        },
      });

      if (error) throw error;

      setShowSuccessModal(true);
    } catch (error) {
      console.error("Beta signup error:", error);
      toast({
        title: "Something went wrong",
        description: "Please try again or contact support.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <Helmet>
        <title>Join Private Beta | SiteIntel™ Feasibility</title>
        <meta
          name="description"
          content="Join the founding cohort of SiteIntel™ Feasibility. Free access for verified developers, lenders, and investors."
        />
      </Helmet>

      {/* Hero Section */}
      <section className="relative min-h-[90vh] w-full overflow-hidden bg-gradient-to-br from-secondary via-[#111827] to-secondary">
        {/* Background Pattern */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(255,122,0,0.05)_0%,transparent_50%)]" />

        <div className="container relative mx-auto px-6 py-24">
          <div className="grid gap-12 lg:grid-cols-[60%_40%] lg:gap-16">
            {/* Left: Copy Block */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="flex flex-col justify-center"
            >
              {/* Top Badge */}
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.4 }}
                className="mb-6 inline-flex items-center gap-2 self-start rounded-full bg-primary/10 px-4 py-2 text-sm font-medium text-primary border border-primary/20"
              >
                Private Beta · {seatsClaimed} / 500 Seats Claimed
              </motion.div>

              {/* Headline */}
              <h1 className="text-h1 font-headline text-white mb-6">
                Know What's Buildable. What It'll Cost. What It's Worth.
              </h1>

              {/* Subheadline */}
              <p className="text-body-l text-slate-300 mb-8 max-w-2xl">
                Feasibility-as-a-Service™ for professionals who don't have weeks
                to wait. Join the founding cohort testing instant, lender-ready
                reports powered by FEMA, TxDOT, and EPA data.
              </p>

              {/* CTAs */}
              <div className="flex flex-col gap-4 sm:flex-row">
                <Button
                  size="lg"
                  variant="default"
                  className="bg-primary hover:bg-primary/90"
                  onClick={() =>
                    document
                      .getElementById("beta-form")
                      ?.scrollIntoView({ behavior: "smooth" })
                  }
                >
                  Join the Private Beta <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  className="border-accent text-accent hover:bg-accent/10"
                  onClick={() => (window.location.href = "/application?step=2")}
                >
                  Run a Free QuickCheck™
                </Button>
              </div>

              {/* Microcopy */}
              <p className="mt-6 text-sm text-slate-400">
                Free access for verified developers, lenders, and investors.
              </p>
            </motion.div>

            {/* Right: Parcel Grid Animation */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.4 }}
              className="relative hidden lg:flex items-center justify-center"
            >
              <div className="relative h-[500px] w-full max-w-md">
                {/* Animated parcel visualization placeholder */}
                <div className="absolute inset-0 rounded-2xl border border-primary/20 bg-gradient-to-br from-primary/5 to-accent/5 backdrop-blur-sm">
                  <div className="flex h-full items-center justify-center">
                    <p className="text-center text-slate-400">
                      Parcel Grid Animation
                      <br />
                      <span className="text-xs">Zoning → Flood → Cost</span>
                    </p>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Form Section */}
      <section id="beta-form" className="relative py-24 bg-secondary">
        <div className="container mx-auto px-6">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="mx-auto max-w-xl"
          >
            {/* Form Card */}
            <div className="rounded-2xl bg-white p-8 shadow-[0_4px_20px_rgba(0,0,0,0.2)] md:p-10">
              {/* Badge */}
              <div className="mb-6 inline-flex items-center gap-2 rounded-full bg-primary/10 px-4 py-2 text-sm font-medium text-primary">
                Secure Your Spot · 500 Seat Limit
              </div>

              {/* Header */}
              <h2 className="text-h2 font-headline text-secondary mb-3">
                Join the Private Beta — Feasibility, Verified.
              </h2>
              <p className="text-body text-slate-600 mb-8">
                Free for verified professionals. Limited access for 500 seats.
              </p>

              {/* Form */}
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                {/* Work Email */}
                <div className="space-y-2">
                  <Label htmlFor="email">
                    Work Email <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="name@company.com"
                    {...register("email")}
                    className={errors.email ? "border-destructive" : ""}
                  />
                  {errors.email && (
                    <p className="text-sm text-destructive">
                      {errors.email.message}
                    </p>
                  )}
                </div>

                {/* Full Name */}
                <div className="space-y-2">
                  <Label htmlFor="fullName">
                    Full Name <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="fullName"
                    placeholder="e.g., Sarah Patel"
                    {...register("fullName")}
                    className={errors.fullName ? "border-destructive" : ""}
                  />
                  {errors.fullName && (
                    <p className="text-sm text-destructive">
                      {errors.fullName.message}
                    </p>
                  )}
                </div>

                {/* Role */}
                <div className="space-y-2">
                  <Label htmlFor="role">
                    I work as a… <span className="text-destructive">*</span>
                  </Label>
                  <Select
                    onValueChange={(value) =>
                      setValue("role", value as any, { shouldValidate: true })
                    }
                  >
                    <SelectTrigger
                      className={errors.role ? "border-destructive" : ""}
                    >
                      <SelectValue placeholder="Select your role" />
                    </SelectTrigger>
                    <SelectContent className="bg-white z-50">
                      <SelectItem value="developer">Developer</SelectItem>
                      <SelectItem value="lender">Lender</SelectItem>
                      <SelectItem value="investor">Investor</SelectItem>
                      <SelectItem value="advisor">Advisor</SelectItem>
                    </SelectContent>
                  </Select>
                  {errors.role && (
                    <p className="text-sm text-destructive">
                      {errors.role.message}
                    </p>
                  )}
                </div>

                {/* Company */}
                <div className="space-y-2">
                  <Label htmlFor="company">Company / Firm</Label>
                  <Input
                    id="company"
                    placeholder="e.g., Maxx Builders"
                    {...register("company")}
                  />
                </div>

                {/* Primary Focus */}
                <div className="space-y-2">
                  <Label htmlFor="primaryFocus">Primary Interest</Label>
                  <Select
                    onValueChange={(value) =>
                      setValue("primaryFocus", value as any)
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select primary focus" />
                    </SelectTrigger>
                    <SelectContent className="bg-white z-50">
                      <SelectItem value="building">Building</SelectItem>
                      <SelectItem value="buying">Buying</SelectItem>
                      <SelectItem value="lending">Lending</SelectItem>
                      <SelectItem value="advising">Advising</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Referral Code */}
                <div className="space-y-2">
                  <Label htmlFor="referralCode">
                    Invite Code (Optional)
                  </Label>
                  <Input
                    id="referralCode"
                    placeholder="e.g., TXBETA2025"
                    {...register("referralCode")}
                  />
                </div>

                {/* Terms Checkbox */}
                <div className="flex items-start space-x-3">
                  <Checkbox
                    id="acceptTerms"
                    checked={acceptTerms}
                    onCheckedChange={(checked) =>
                      setValue("acceptTerms", checked as boolean, {
                        shouldValidate: true,
                      })
                    }
                    className={errors.acceptTerms ? "border-destructive" : ""}
                  />
                  <div className="space-y-1">
                    <Label
                      htmlFor="acceptTerms"
                      className="text-sm font-normal cursor-pointer"
                    >
                      I agree to the{" "}
                      <a
                        href="/legal/beta-nda"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary hover:underline"
                      >
                        Beta NDA and Terms
                      </a>
                    </Label>
                    {errors.acceptTerms && (
                      <p className="text-sm text-destructive">
                        {errors.acceptTerms.message}
                      </p>
                    )}
                  </div>
                </div>

                {/* Submit Button */}
                <Button
                  type="submit"
                  size="lg"
                  className="w-full bg-primary hover:bg-primary/90"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <>
                      <span className="animate-pulse">Verifying Access…</span>
                    </>
                  ) : (
                    <>
                      Join Beta Now <ArrowRight className="ml-2 h-4 w-4" />
                    </>
                  )}
                </Button>
              </form>

              {/* Microcopy */}
              <div className="mt-6 flex items-center justify-center gap-4 text-xs text-slate-500">
                <div className="flex items-center gap-1">
                  <Lock className="h-3 w-3" />
                  <span>Secure & confidential</span>
                </div>
                <span>·</span>
                <div className="flex items-center gap-1">
                  <Shield className="h-3 w-3" />
                  <span>Verified professionals</span>
                </div>
              </div>

              {/* Data Badges */}
              <div className="mt-6 flex flex-wrap items-center justify-center gap-4 text-xs text-slate-400">
                <span className="font-mono">FEMA</span>
                <span>·</span>
                <span className="font-mono">TxDOT</span>
                <span>·</span>
                <span className="font-mono">EPA</span>
                <span>·</span>
                <span className="font-mono">ArcGIS</span>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Success Modal */}
      <Dialog open={showSuccessModal} onOpenChange={setShowSuccessModal}>
        <DialogContent className="sm:max-w-md bg-white">
          <DialogHeader>
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
              <CheckCircle2 className="h-6 w-6 text-primary" />
            </div>
            <DialogTitle className="text-center text-h3 font-headline">
              Welcome to the Founding Cohort.
            </DialogTitle>
            <DialogDescription className="text-center text-body space-y-4 pt-4">
              <p>
                You're officially part of the SiteIntel™ Private Beta. Your
                access credentials and QuickStart link are on their way.
              </p>
              <div className="rounded-lg bg-slate-50 p-4 text-left text-sm space-y-2">
                <p className="font-medium text-secondary">You now have:</p>
                <ul className="space-y-1 text-slate-600">
                  <li>• 3 free feasibility report credits</li>
                  <li>• Early access to Cost & Schedule modules</li>
                  <li>• Founding Member status (Pro pricing locked)</li>
                </ul>
              </div>
              <Button
                className="w-full bg-primary hover:bg-primary/90"
                onClick={() => setShowSuccessModal(false)}
              >
                Get Started
              </Button>
            </DialogDescription>
          </DialogHeader>
        </DialogContent>
      </Dialog>
    </>
  );
}
