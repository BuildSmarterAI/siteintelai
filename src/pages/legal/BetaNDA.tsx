import { Helmet } from "react-helmet";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

export default function BetaNDA() {
  const navigate = useNavigate();

  return (
    <>
      <Helmet>
        <title>Beta NDA & Terms | SiteIntel™</title>
        <meta name="robots" content="noindex, nofollow" />
      </Helmet>

      <div className="min-h-screen bg-background py-16">
        <div className="container mx-auto max-w-4xl px-6">
          <Button
            variant="ghost"
            onClick={() => navigate(-1)}
            className="mb-8"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>

          <article className="prose prose-slate max-w-none">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-heading font-bold mb-8">
              SiteIntel™ Private Beta — Non-Disclosure Agreement & Terms
            </h1>

            <p className="text-body-l text-muted-foreground mb-8">
              Last Updated: January 2025
            </p>

            <section className="mb-12">
              <h2 className="text-3xl md:text-4xl lg:text-5xl font-heading font-semibold mb-4">
                1. Beta Program Overview
              </h2>
              <p className="text-body mb-4">
                By joining the SiteIntel™ Private Beta (the "Beta Program"), you
                agree to test pre-release versions of our feasibility analysis
                platform and provide feedback to help us improve the product.
              </p>
            </section>

            <section className="mb-12">
              <h2 className="text-3xl md:text-4xl lg:text-5xl font-heading font-semibold mb-4">
                2. Confidentiality
              </h2>
              <p className="text-body mb-4">
                You agree to keep confidential all information about the Beta
                Program, including but not limited to:
              </p>
              <ul className="list-disc pl-6 text-body space-y-2 mb-4">
                <li>Product features, functionality, and performance</li>
                <li>Technical specifications and architecture</li>
                <li>User interface designs and workflows</li>
                <li>Any bugs, issues, or limitations discovered</li>
              </ul>
            </section>

            <section className="mb-12">
              <h2 className="text-3xl md:text-4xl lg:text-5xl font-heading font-semibold mb-4">
                3. Data Usage & Privacy
              </h2>
              <p className="text-body mb-4">
                We collect and use your data to improve the Beta Program. This
                includes:
              </p>
              <ul className="list-disc pl-6 text-body space-y-2 mb-4">
                <li>
                  Usage analytics (searches, report generation, feature
                  interactions)
                </li>
                <li>
                  Technical diagnostics (errors, performance metrics, system
                  logs)
                </li>
                <li>Feedback submissions and support inquiries</li>
              </ul>
              <p className="text-body mb-4">
                All data is handled in accordance with our{" "}
                <a href="/legal/privacy" className="text-primary hover:underline">
                  Privacy Policy
                </a>
                .
              </p>
            </section>

            <section className="mb-12">
              <h2 className="text-3xl md:text-4xl lg:text-5xl font-heading font-semibold mb-4">
                4. Beta Credits & Limitations
              </h2>
              <p className="text-body mb-4">
                As a Beta participant, you receive:
              </p>
              <ul className="list-disc pl-6 text-body space-y-2 mb-4">
                <li>3 free feasibility report credits</li>
                <li>Early access to Cost & Schedule Intelligence modules</li>
                <li>
                  Founding Member pricing lock (when we launch commercially)
                </li>
              </ul>
              <p className="text-body mb-4">
                Beta credits are non-transferable and expire upon program
                conclusion.
              </p>
            </section>

            <section className="mb-12">
              <h2 className="text-3xl md:text-4xl lg:text-5xl font-heading font-semibold mb-4">
                5. No Warranty
              </h2>
              <p className="text-body mb-4">
                The Beta Program is provided "as is" without warranties of any
                kind. You acknowledge that:
              </p>
              <ul className="list-disc pl-6 text-body space-y-2 mb-4">
                <li>The software may contain bugs or errors</li>
                <li>Features may change or be removed without notice</li>
                <li>
                  Data accuracy is not guaranteed during the beta phase
                </li>
                <li>
                  Reports should not be used for final lending or investment
                  decisions without independent verification
                </li>
              </ul>
            </section>

            <section className="mb-12">
              <h2 className="text-3xl md:text-4xl lg:text-5xl font-heading font-semibold mb-4">
                6. Feedback & Intellectual Property
              </h2>
              <p className="text-body mb-4">
                Any feedback, suggestions, or ideas you provide become the
                property of SiteIntel™. We may use this feedback to improve our
                products without compensation or attribution.
              </p>
            </section>

            <section className="mb-12">
              <h2 className="text-3xl md:text-4xl lg:text-5xl font-heading font-semibold mb-4">
                7. Termination
              </h2>
              <p className="text-body mb-4">
                We may terminate your Beta access at any time for any reason,
                including:
              </p>
              <ul className="list-disc pl-6 text-body space-y-2 mb-4">
                <li>Violation of these terms</li>
                <li>Misuse of the platform</li>
                <li>Conclusion of the Beta Program</li>
              </ul>
            </section>

            <section className="mb-12">
              <h2 className="text-3xl md:text-4xl lg:text-5xl font-heading font-semibold mb-4">
                8. Contact
              </h2>
              <p className="text-body mb-4">
                Questions about the Beta Program or these terms? Contact us at{" "}
                <a
                  href="mailto:beta@siteintel.com"
                  className="text-primary hover:underline"
                >
                  beta@siteintel.com
                </a>
              </p>
            </section>

            <div className="mt-12 rounded-lg border border-primary/20 bg-primary/5 p-6">
              <p className="text-sm text-secondary">
                <strong>By checking the acceptance box,</strong> you acknowledge
                that you have read, understood, and agree to be bound by this
                Beta NDA and Terms.
              </p>
            </div>
          </article>
        </div>
      </div>
    </>
  );
}