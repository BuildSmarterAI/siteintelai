import { Helmet } from "react-helmet";

export default function Terms() {
  return (
    <>
      <Helmet>
        <title>Terms of Service | SiteIntel™ Feasibility</title>
        <meta name="description" content="SiteIntel Feasibility terms of service - legal agreement for using our platform." />
      </Helmet>

      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-6 lg:px-8 py-16 max-w-4xl">
          {/* Header */}
          <div className="mb-12">
            <h1 className="text-4xl lg:text-5xl font-bold text-foreground mb-4">
              Terms of Service
            </h1>
            <p className="text-muted-foreground">
              Last Updated: January 22, 2025
            </p>
          </div>

          {/* Content */}
          <div className="prose prose-lg max-w-none space-y-8">
            {/* Introduction */}
            <section>
              <p className="text-foreground leading-relaxed">
                These Terms of Service ("Terms") govern your access to and use of SiteIntel™ Feasibility ("SiteIntel," "we," "our," or "us"), including our website, platform, and services. By accessing or using SiteIntel, you agree to be bound by these Terms.
              </p>
              <p className="text-foreground leading-relaxed mt-4">
                <strong>IF YOU DO NOT AGREE TO THESE TERMS, DO NOT USE OUR SERVICES.</strong>
              </p>
            </section>

            {/* Acceptance of Terms */}
            <section>
              <h2 className="text-2xl font-semibold text-foreground mb-4">
                1. Acceptance of Terms
              </h2>
              <p className="text-foreground leading-relaxed">
                By creating an account, accessing our platform, or using our services, you acknowledge that you have read, understood, and agree to be bound by these Terms and our Privacy Policy. If you are using SiteIntel on behalf of an organization, you represent that you have authority to bind that organization to these Terms.
              </p>
            </section>

            {/* Services Description */}
            <section>
              <h2 className="text-2xl font-semibold text-foreground mb-4">
                2. Services Description
              </h2>
              <p className="text-foreground leading-relaxed">
                SiteIntel provides AI-powered feasibility analysis and due diligence reports for commercial real estate development projects. Our services include:
              </p>
              <ul className="list-disc pl-6 space-y-2 text-foreground mt-4">
                <li><strong>QuickCheck™:</strong> Free preliminary feasibility scoring</li>
                <li><strong>Full Feasibility Reports:</strong> Comprehensive analysis including zoning, flood risk, utilities, environmental factors, and market context</li>
                <li><strong>Pro Subscription:</strong> Unlimited reports and priority support</li>
                <li><strong>API Access:</strong> Programmatic access to feasibility data</li>
              </ul>
            </section>

            {/* User Accounts */}
            <section>
              <h2 className="text-2xl font-semibold text-foreground mb-4">
                3. User Accounts and Registration
              </h2>
              <p className="text-foreground leading-relaxed mb-4">
                To access certain features, you must create an account. You agree to:
              </p>
              <ul className="list-disc pl-6 space-y-2 text-foreground">
                <li>Provide accurate, current, and complete information during registration</li>
                <li>Maintain and update your account information</li>
                <li>Maintain the security and confidentiality of your login credentials</li>
                <li>Notify us immediately of any unauthorized access or security breaches</li>
                <li>Accept responsibility for all activities under your account</li>
              </ul>
              <p className="text-foreground leading-relaxed mt-4">
                You must be at least 18 years old to use SiteIntel. We reserve the right to suspend or terminate accounts that violate these Terms.
              </p>
            </section>

            {/* Use License and Restrictions */}
            <section>
              <h2 className="text-2xl font-semibold text-foreground mb-4">
                4. Use License and Restrictions
              </h2>
              
              <h3 className="text-xl font-semibold text-foreground mb-3">
                4.1 Permitted Use
              </h3>
              <p className="text-foreground leading-relaxed">
                We grant you a limited, non-exclusive, non-transferable license to access and use SiteIntel for lawful business purposes in accordance with these Terms.
              </p>

              <h3 className="text-xl font-semibold text-foreground mb-3 mt-6">
                4.2 Prohibited Activities
              </h3>
              <p className="text-foreground leading-relaxed mb-4">You agree NOT to:</p>
              <ul className="list-disc pl-6 space-y-2 text-foreground">
                <li>Reverse engineer, decompile, or attempt to extract source code from our platform</li>
                <li>Use automated systems (bots, scrapers) to access the service without authorization</li>
                <li>Resell, redistribute, or sublicense reports or data without written permission</li>
                <li>Submit false, misleading, or fraudulent information</li>
                <li>Interfere with or disrupt the integrity or performance of our services</li>
                <li>Attempt to gain unauthorized access to our systems or networks</li>
                <li>Use the service for illegal purposes or in violation of any applicable laws</li>
              </ul>
            </section>

            {/* Report Accuracy and Limitations */}
            <section>
              <h2 className="text-2xl font-semibold text-foreground mb-4">
                5. Report Accuracy and Limitations
              </h2>
              
              <h3 className="text-xl font-semibold text-foreground mb-3">
                5.1 Data Sources
              </h3>
              <p className="text-foreground leading-relaxed">
                Our reports are generated using data from authoritative sources including FEMA, ArcGIS, EPA, TxDOT, OpenStreetMap, and other federal, state, and local databases. While we strive for accuracy, we do not independently verify all third-party data.
              </p>

              <h3 className="text-xl font-semibold text-foreground mb-3 mt-6">
                5.2 No Guarantees
              </h3>
              <p className="text-foreground leading-relaxed">
                <strong>IMPORTANT:</strong> SiteIntel reports are for informational purposes and preliminary due diligence only. They do NOT constitute:
              </p>
              <ul className="list-disc pl-6 space-y-2 text-foreground mt-4">
                <li>Legal, financial, or professional advice</li>
                <li>Official government determinations or certifications</li>
                <li>A substitute for professional site surveys, engineering studies, or environmental assessments</li>
                <li>A guarantee of development approval or project success</li>
              </ul>

              <h3 className="text-xl font-semibold text-foreground mb-3 mt-6">
                5.3 User Responsibility
              </h3>
              <p className="text-foreground leading-relaxed">
                You are solely responsible for verifying all information, conducting appropriate due diligence, and consulting qualified professionals (engineers, attorneys, surveyors, environmental consultants) before making investment or development decisions.
              </p>
            </section>

            {/* Payment Terms */}
            <section>
              <h2 className="text-2xl font-semibold text-foreground mb-4">
                6. Payment Terms
              </h2>
              
              <h3 className="text-xl font-semibold text-foreground mb-3">
                6.1 Pricing
              </h3>
              <ul className="list-disc pl-6 space-y-2 text-foreground">
                <li><strong>QuickCheck™:</strong> Free</li>
                <li><strong>Full Feasibility Report:</strong> $795 per report</li>
                <li><strong>Pro Subscription:</strong> $1,950/month (unlimited reports)</li>
                <li><strong>API Partner Program:</strong> $9,990/month (custom terms apply)</li>
              </ul>

              <h3 className="text-xl font-semibold text-foreground mb-3 mt-6">
                6.2 Payment Processing
              </h3>
              <p className="text-foreground leading-relaxed">
                Payments are processed securely through Stripe. By providing payment information, you authorize us to charge your payment method for applicable fees. All fees are non-refundable except as required by law or as specified in our refund policy.
              </p>

              <h3 className="text-xl font-semibold text-foreground mb-3 mt-6">
                6.3 Subscriptions
              </h3>
              <p className="text-foreground leading-relaxed">
                Pro subscriptions automatically renew monthly unless canceled. You may cancel at any time through your account dashboard. Cancellations take effect at the end of the current billing period.
              </p>

              <h3 className="text-xl font-semibold text-foreground mb-3 mt-6">
                6.4 Refund Policy
              </h3>
              <p className="text-foreground leading-relaxed">
                We offer a satisfaction guarantee: if a report is not accepted by a qualified lender due to data quality issues (not project viability), contact us within 7 days for review. Refunds are issued at our sole discretion after investigation.
              </p>
            </section>

            {/* Intellectual Property */}
            <section>
              <h2 className="text-2xl font-semibold text-foreground mb-4">
                7. Intellectual Property
              </h2>
              <p className="text-foreground leading-relaxed">
                SiteIntel, our logo, trademarks, and all content, features, and functionality are owned by us or our licensors and protected by copyright, trademark, and other intellectual property laws. Reports generated for you may be used for your internal business purposes but may not be resold or publicly distributed without permission.
              </p>
            </section>

            {/* Disclaimer of Warranties */}
            <section>
              <h2 className="text-2xl font-semibold text-foreground mb-4">
                8. Disclaimer of Warranties
              </h2>
              <p className="text-foreground leading-relaxed">
                <strong>THE SERVICES ARE PROVIDED "AS IS" AND "AS AVAILABLE" WITHOUT WARRANTIES OF ANY KIND, EXPRESS OR IMPLIED.</strong> We disclaim all warranties, including but not limited to:
              </p>
              <ul className="list-disc pl-6 space-y-2 text-foreground mt-4">
                <li>Merchantability, fitness for a particular purpose, and non-infringement</li>
                <li>Accuracy, completeness, or reliability of data or reports</li>
                <li>Uninterrupted, secure, or error-free operation</li>
                <li>Results obtained from using the services</li>
              </ul>
            </section>

            {/* Limitation of Liability */}
            <section>
              <h2 className="text-2xl font-semibold text-foreground mb-4">
                9. Limitation of Liability
              </h2>
              <p className="text-foreground leading-relaxed">
                <strong>TO THE MAXIMUM EXTENT PERMITTED BY LAW, SITEINTEL AND ITS AFFILIATES SHALL NOT BE LIABLE FOR:</strong>
              </p>
              <ul className="list-disc pl-6 space-y-2 text-foreground mt-4">
                <li>Indirect, incidental, consequential, special, or punitive damages</li>
                <li>Loss of profits, revenue, data, or business opportunities</li>
                <li>Development decisions or investment losses based on reports</li>
                <li>Errors or inaccuracies in third-party data sources</li>
              </ul>
              <p className="text-foreground leading-relaxed mt-4">
                <strong>Our total liability for any claim shall not exceed the amount you paid to us in the 12 months preceding the claim, or $1,000, whichever is greater.</strong>
              </p>
            </section>

            {/* Indemnification */}
            <section>
              <h2 className="text-2xl font-semibold text-foreground mb-4">
                10. Indemnification
              </h2>
              <p className="text-foreground leading-relaxed">
                You agree to indemnify, defend, and hold harmless SiteIntel, its officers, directors, employees, and agents from any claims, liabilities, damages, losses, and expenses (including attorney fees) arising from:
              </p>
              <ul className="list-disc pl-6 space-y-2 text-foreground mt-4">
                <li>Your use or misuse of the services</li>
                <li>Violation of these Terms</li>
                <li>Infringement of any third-party rights</li>
                <li>Development or investment decisions made based on reports</li>
              </ul>
            </section>

            {/* Termination */}
            <section>
              <h2 className="text-2xl font-semibold text-foreground mb-4">
                11. Termination
              </h2>
              <p className="text-foreground leading-relaxed">
                We reserve the right to suspend or terminate your account and access to services at our sole discretion, without notice, for conduct that violates these Terms or is harmful to other users, us, or third parties. Upon termination, your right to use the services ceases immediately.
              </p>
            </section>

            {/* Governing Law */}
            <section>
              <h2 className="text-2xl font-semibold text-foreground mb-4">
                12. Governing Law and Dispute Resolution
              </h2>
              <p className="text-foreground leading-relaxed">
                These Terms are governed by the laws of the State of Texas, without regard to conflict of law principles. Any disputes shall be resolved through binding arbitration in accordance with the American Arbitration Association rules, with proceedings held in Texas. You waive any right to participate in class actions.
              </p>
            </section>

            {/* Changes to Terms */}
            <section>
              <h2 className="text-2xl font-semibold text-foreground mb-4">
                13. Changes to Terms
              </h2>
              <p className="text-foreground leading-relaxed">
                We may modify these Terms at any time. Material changes will be communicated via email or platform notification. Continued use of services after changes constitutes acceptance of the modified Terms.
              </p>
            </section>

            {/* Miscellaneous */}
            <section>
              <h2 className="text-2xl font-semibold text-foreground mb-4">
                14. Miscellaneous
              </h2>
              <ul className="list-disc pl-6 space-y-2 text-foreground">
                <li><strong>Severability:</strong> If any provision is unenforceable, the remaining provisions remain in effect</li>
                <li><strong>Entire Agreement:</strong> These Terms constitute the entire agreement between you and SiteIntel</li>
                <li><strong>No Waiver:</strong> Failure to enforce any provision does not waive our right to enforce it later</li>
                <li><strong>Assignment:</strong> You may not assign these Terms; we may assign them without restriction</li>
              </ul>
            </section>

            {/* Contact */}
            <section>
              <h2 className="text-2xl font-semibold text-foreground mb-4">
                15. Contact Us
              </h2>
              <p className="text-foreground leading-relaxed">
                For questions about these Terms, please contact us:
              </p>
              <div className="mt-4 p-6 bg-muted rounded-lg">
                <p className="text-foreground"><strong>SiteIntel™ Feasibility</strong></p>
                <p className="text-foreground mt-2">Email: legal@siteintel.ai</p>
                <p className="text-foreground">Email: support@siteintel.ai</p>
                <p className="text-foreground mt-4">Powered by Maxx Builders + Maxx Designers</p>
              </div>
            </section>
          </div>
        </div>
      </div>
    </>
  );
}
