import { Helmet } from "react-helmet";

export default function Privacy() {
  return (
    <>
      <Helmet>
        <title>Privacy Policy | SiteIntel™ Feasibility</title>
        <meta name="description" content="SiteIntel Feasibility privacy policy - how we collect, use, and protect your data." />
      </Helmet>

      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-6 lg:px-8 py-16 max-w-4xl">
          {/* Header */}
          <div className="mb-12">
            <h1 className="text-4xl lg:text-5xl font-bold text-foreground mb-4">
              Privacy Policy
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
                SiteIntel™ Feasibility ("we," "our," or "us") is committed to protecting your privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our feasibility analysis platform and services.
              </p>
            </section>

            {/* Information We Collect */}
            <section>
              <h2 className="text-2xl font-semibold text-foreground mb-4">
                1. Information We Collect
              </h2>
              
              <h3 className="text-xl font-semibold text-foreground mb-3">
                1.1 Information You Provide
              </h3>
              <ul className="list-disc pl-6 space-y-2 text-foreground">
                <li><strong>Account Information:</strong> Name, email address, phone number, company name, and billing information</li>
                <li><strong>Property Data:</strong> Addresses, parcel information, and project details you submit for feasibility analysis</li>
                <li><strong>Communications:</strong> Messages, feedback, and correspondence with our support team</li>
              </ul>

              <h3 className="text-xl font-semibold text-foreground mb-3 mt-6">
                1.2 Automatically Collected Information
              </h3>
              <ul className="list-disc pl-6 space-y-2 text-foreground">
                <li><strong>Usage Data:</strong> Pages visited, features used, time spent, and interaction patterns</li>
                <li><strong>Device Information:</strong> IP address, browser type, operating system, and device identifiers</li>
                <li><strong>Cookies and Tracking:</strong> Session data and analytics through cookies and similar technologies</li>
              </ul>

              <h3 className="text-xl font-semibold text-foreground mb-3 mt-6">
                1.3 Third-Party Data Sources
              </h3>
              <p className="text-foreground leading-relaxed">
                We integrate data from authoritative sources including FEMA, ArcGIS, OpenStreetMap, EPA, TxDOT, and other federal, state, and local government databases to generate feasibility reports. This data is public record and used solely for analysis purposes.
              </p>
            </section>

            {/* How We Use Your Information */}
            <section>
              <h2 className="text-2xl font-semibold text-foreground mb-4">
                2. How We Use Your Information
              </h2>
              <ul className="list-disc pl-6 space-y-2 text-foreground">
                <li>Generate feasibility reports and property analysis</li>
                <li>Process payments and manage subscriptions</li>
                <li>Provide customer support and respond to inquiries</li>
                <li>Send service updates, security alerts, and administrative messages</li>
                <li>Improve our platform, features, and user experience</li>
                <li>Detect, prevent, and address technical issues or fraudulent activity</li>
                <li>Comply with legal obligations and enforce our Terms of Service</li>
              </ul>
            </section>

            {/* Data Security */}
            <section>
              <h2 className="text-2xl font-semibold text-foreground mb-4">
                3. Data Security
              </h2>
              <p className="text-foreground leading-relaxed">
                We implement industry-standard security measures to protect your information, including:
              </p>
              <ul className="list-disc pl-6 space-y-2 text-foreground mt-4">
                <li>Encryption of data in transit and at rest using TLS/SSL protocols</li>
                <li>Secure authentication systems with password hashing</li>
                <li>Regular security audits and vulnerability assessments</li>
                <li>Access controls and role-based permissions</li>
                <li>Secure cloud infrastructure through Supabase and industry-leading providers</li>
              </ul>
              <p className="text-foreground leading-relaxed mt-4">
                However, no method of transmission over the Internet is 100% secure. While we strive to protect your data, we cannot guarantee absolute security.
              </p>
            </section>

            {/* Information Sharing */}
            <section>
              <h2 className="text-2xl font-semibold text-foreground mb-4">
                4. Information Sharing and Disclosure
              </h2>
              <p className="text-foreground leading-relaxed mb-4">
                We do not sell your personal information. We may share information in the following circumstances:
              </p>
              <ul className="list-disc pl-6 space-y-2 text-foreground">
                <li><strong>Service Providers:</strong> Third-party vendors who perform services on our behalf (payment processing, data hosting, analytics)</li>
                <li><strong>Business Transfers:</strong> In connection with mergers, acquisitions, or sale of assets</li>
                <li><strong>Legal Requirements:</strong> When required by law, subpoena, or to protect our rights and safety</li>
                <li><strong>With Your Consent:</strong> When you explicitly authorize sharing with third parties</li>
              </ul>
            </section>

            {/* Cookies and Tracking */}
            <section>
              <h2 className="text-2xl font-semibold text-foreground mb-4">
                5. Cookies and Tracking Technologies
              </h2>
              <p className="text-foreground leading-relaxed">
                We use cookies, web beacons, and similar technologies to enhance your experience, analyze usage patterns, and deliver personalized content. You can control cookie preferences through your browser settings, though disabling cookies may affect platform functionality.
              </p>
            </section>

            {/* Your Rights */}
            <section>
              <h2 className="text-2xl font-semibold text-foreground mb-4">
                6. Your Privacy Rights
              </h2>
              <p className="text-foreground leading-relaxed mb-4">
                Depending on your jurisdiction, you may have the following rights:
              </p>
              <ul className="list-disc pl-6 space-y-2 text-foreground">
                <li><strong>Access:</strong> Request a copy of your personal information</li>
                <li><strong>Correction:</strong> Update or correct inaccurate information</li>
                <li><strong>Deletion:</strong> Request deletion of your account and data</li>
                <li><strong>Portability:</strong> Receive your data in a structured, machine-readable format</li>
                <li><strong>Opt-Out:</strong> Unsubscribe from marketing communications</li>
              </ul>
              <p className="text-foreground leading-relaxed mt-4">
                To exercise these rights, contact us at privacy@siteintel.ai
              </p>
            </section>

            {/* Data Retention */}
            <section>
              <h2 className="text-2xl font-semibold text-foreground mb-4">
                7. Data Retention
              </h2>
              <p className="text-foreground leading-relaxed">
                We retain your information for as long as necessary to provide services, comply with legal obligations, resolve disputes, and enforce agreements. Reports and analysis data are retained for audit and compliance purposes.
              </p>
            </section>

            {/* Children's Privacy */}
            <section>
              <h2 className="text-2xl font-semibold text-foreground mb-4">
                8. Children's Privacy
              </h2>
              <p className="text-foreground leading-relaxed">
                Our services are not intended for individuals under 18 years of age. We do not knowingly collect information from children. If you believe we have collected information from a child, please contact us immediately.
              </p>
            </section>

            {/* International Users */}
            <section>
              <h2 className="text-2xl font-semibold text-foreground mb-4">
                9. International Data Transfers
              </h2>
              <p className="text-foreground leading-relaxed">
                Your information may be transferred to and processed in countries other than your own. We ensure appropriate safeguards are in place to protect your data in accordance with this Privacy Policy.
              </p>
            </section>

            {/* Changes to Policy */}
            <section>
              <h2 className="text-2xl font-semibold text-foreground mb-4">
                10. Changes to This Privacy Policy
              </h2>
              <p className="text-foreground leading-relaxed">
                We may update this Privacy Policy periodically. We will notify you of material changes by posting the updated policy with a new "Last Updated" date. Continued use of our services after changes constitutes acceptance of the updated policy.
              </p>
            </section>

            {/* Contact */}
            <section>
              <h2 className="text-2xl font-semibold text-foreground mb-4">
                11. Contact Us
              </h2>
              <p className="text-foreground leading-relaxed">
                If you have questions or concerns about this Privacy Policy or our data practices, please contact us:
              </p>
              <div className="mt-4 p-6 bg-muted rounded-lg">
                <p className="text-foreground"><strong>SiteIntel™ Feasibility</strong></p>
                <p className="text-foreground mt-2">Email: privacy@siteintel.ai</p>
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
