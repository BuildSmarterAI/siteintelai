import { useState } from 'react';
import { motion } from 'framer-motion';
import { Shield, Clock, FileCheck, ChevronDown, ChevronUp } from 'lucide-react';
import { Header } from '@/components/navigation/Header';
import { Footer } from '@/components/navigation/Footer';
import { BillingToggle } from '@/components/subscription/BillingToggle';
import { SubscriptionTierCard } from '@/components/subscription/SubscriptionTierCard';
import { FeatureComparisonTable } from '@/components/subscription/FeatureComparisonTable';
import { SUBSCRIPTION_TIERS, TIER_ORDER, BillingCycle } from '@/config/subscription-tiers';
import { Button } from '@/components/ui/button';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { useSubscription } from '@/contexts/SubscriptionContext';

const FAQ_ITEMS = [
  {
    question: 'Can I change plans at any time?',
    answer: 'Yes, you can upgrade or downgrade your plan at any time. When upgrading, you\'ll be charged the prorated difference. When downgrading, the change takes effect at the end of your current billing cycle.',
  },
  {
    question: 'What happens to my unused reports?',
    answer: 'Unused reports do not roll over to the next month. We recommend choosing a plan that matches your typical monthly usage.',
  },
  {
    question: 'How does the annual billing work?',
    answer: 'Annual billing is charged upfront for the full year at a 17% discount compared to monthly billing. You can cancel anytime, but refunds are not provided for the unused portion.',
  },
  {
    question: 'What payment methods do you accept?',
    answer: 'We accept all major credit cards (Visa, Mastercard, American Express) and ACH bank transfers for annual Enterprise plans.',
  },
  {
    question: 'Is there a free trial?',
    answer: 'We offer a free QuickCheck for any address so you can experience the platform before committing. Contact sales for extended trial options.',
  },
];

export default function SubscriptionPricing() {
  const [billingCycle, setBillingCycle] = useState<BillingCycle>('quarterly');
  const [showComparison, setShowComparison] = useState(false);
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(null);
  const { subscribed } = useSubscription();

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      
      <main className="flex-1 pt-24">
        {/* Hero Section */}
        <section className="py-16 px-4">
          <div className="container max-w-6xl mx-auto text-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-4">
                Choose Your SiteIntel Plan
              </h1>
              <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-8">
                From kill-or-keep screening to enterprise-grade feasibility infrastructure
              </p>
              
              {subscribed && (
                <div className="mb-8 p-4 bg-green-500/10 border border-green-500/20 rounded-lg inline-block">
                  <p className="text-green-600 font-medium">
                    ✓ You have an active subscription
                  </p>
                </div>
              )}

              <BillingToggle value={billingCycle} onChange={setBillingCycle} />
            </motion.div>
          </div>
        </section>

        {/* Pricing Cards */}
        <section className="py-8 px-4">
          <div className="container max-w-7xl mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {TIER_ORDER.map((tierId, index) => (
                <motion.div
                  key={tierId}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                >
                  <SubscriptionTierCard
                    tier={SUBSCRIPTION_TIERS[tierId]}
                    billingCycle={billingCycle}
                  />
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Feature Comparison Table */}
        <section className="py-12 px-4">
          <div className="container max-w-6xl mx-auto">
            <Collapsible open={showComparison} onOpenChange={setShowComparison}>
              <CollapsibleTrigger asChild>
                <Button variant="ghost" className="w-full flex items-center justify-center gap-2 text-lg">
                  {showComparison ? 'Hide' : 'View'} Full Feature Comparison
                  {showComparison ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
                </Button>
              </CollapsibleTrigger>
              <CollapsibleContent className="mt-8">
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                >
                  <div className="bg-card border rounded-xl p-6 shadow-sm">
                    <FeatureComparisonTable />
                  </div>
                </motion.div>
              </CollapsibleContent>
            </Collapsible>
          </div>
        </section>

        {/* Trust Indicators */}
        <section className="py-12 px-4 bg-muted/30">
          <div className="container max-w-4xl mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
              <div className="flex flex-col items-center gap-3">
                <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center">
                  <FileCheck className="h-7 w-7 text-primary" />
                </div>
                <h3 className="font-semibold">Professional Reports</h3>
                <p className="text-sm text-muted-foreground">
                  Every report meets institutional underwriting standards
                </p>
              </div>
              <div className="flex flex-col items-center gap-3">
                <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center">
                  <Clock className="h-7 w-7 text-primary" />
                </div>
                <h3 className="font-semibold">60-Second Delivery</h3>
                <p className="text-sm text-muted-foreground">
                  From address to actionable intelligence in under a minute
                </p>
              </div>
              <div className="flex flex-col items-center gap-3">
                <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center">
                  <Shield className="h-7 w-7 text-primary" />
                </div>
                <h3 className="font-semibold">Authoritative Data</h3>
                <p className="text-sm text-muted-foreground">
                  FEMA, EPA, TxDOT, and county appraisal sources
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* FAQ Section */}
        <section className="py-16 px-4">
          <div className="container max-w-3xl mx-auto">
            <h2 className="text-3xl font-bold text-center mb-8">Frequently Asked Questions</h2>
            <div className="space-y-4">
              {FAQ_ITEMS.map((faq, index) => (
                <Collapsible
                  key={index}
                  open={openFaqIndex === index}
                  onOpenChange={() => setOpenFaqIndex(openFaqIndex === index ? null : index)}
                >
                  <div className="border rounded-lg">
                    <CollapsibleTrigger className="w-full p-4 flex items-center justify-between text-left hover:bg-muted/50 transition-colors rounded-lg">
                      <span className="font-medium">{faq.question}</span>
                      {openFaqIndex === index ? (
                        <ChevronUp className="h-5 w-5 text-muted-foreground" />
                      ) : (
                        <ChevronDown className="h-5 w-5 text-muted-foreground" />
                      )}
                    </CollapsibleTrigger>
                    <CollapsibleContent className="px-4 pb-4">
                      <p className="text-muted-foreground">{faq.answer}</p>
                    </CollapsibleContent>
                  </div>
                </Collapsible>
              ))}
            </div>
          </div>
        </section>

        {/* Final CTA */}
        <section className="py-16 px-4 bg-primary/5">
          <div className="container max-w-2xl mx-auto text-center">
            <h2 className="text-2xl font-bold mb-4">Still have questions?</h2>
            <p className="text-muted-foreground mb-6">
              Our team is happy to walk you through the platform and help you choose the right plan.
            </p>
            <Button size="lg" variant="outline" asChild>
              <a href="/contact?subject=Pricing">Talk to Sales</a>
            </Button>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
