import { Helmet } from "react-helmet";
import { Link } from "react-router-dom";

export default function Privacy() {
  const sections = [
    { id: "introduction", title: "1. Introduction & Scope" },
    { id: "who-we-are", title: "2. Who We Are" },
    { id: "information-we-collect", title: "3. Information We Collect" },
    { id: "how-we-use-your-information", title: "4. How We Use Your Information" },
    { id: "sharing-and-disclosure", title: "5. Sharing & Disclosure" },
    { id: "ai-and-data-processing-transparency", title: "6. AI & Data Processing Transparency" },
    { id: "data-retention-and-storage", title: "7. Data Retention & Storage" },
    { id: "your-privacy-rights", title: "8. Your Privacy Rights" },
    { id: "data-security-measures", title: "9. Data Security Measures" },
    { id: "international-data-transfers", title: "10. International Data Transfers" },
    { id: "childrens-privacy", title: "11. Children's Privacy" },
    { id: "changes-to-this-policy", title: "12. Changes to This Policy" },
    { id: "contact-us", title: "13. Contact Us" },
  ];

  return (
    <>
      <Helmet>
        <title>Privacy Policy | SiteIntel™ Feasibility</title>
        <meta name="description" content="Comprehensive privacy policy for SiteIntel™ Feasibility by BuildSmarter Holdings LLC. Learn how we collect, use, and protect your data." />
      </Helmet>
      
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-16 max-w-7xl">
          {/* Header */}
          <div className="mb-12 text-center">
            <h1 className="text-4xl font-bold mb-2">Privacy Policy</h1>
            <p className="text-xl text-muted-foreground mb-1">SiteIntel™ Feasibility</p>
            <p className="text-sm text-muted-foreground">Last Updated: October 2025</p>
          </div>

          {/* Two-column layout: Content + Sidebar */}
          <div className="lg:grid lg:grid-cols-[1fr_320px] lg:gap-12">
            
            {/* Main Content */}
            <div className="prose prose-lg max-w-none">
              
              {/* Table of Contents */}
              <div className="bg-muted rounded-lg p-6 mb-8 not-prose">
                <h2 className="text-xl font-semibold mb-4">Table of Contents</h2>
                <nav className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  {sections.map((section) => (
                    <a
                      key={section.id}
                      href={`#${section.id}`}
                      className="text-sm text-foreground hover:text-primary transition-colors scroll-smooth"
                    >
                      {section.title}
                    </a>
                  ))}
                </nav>
              </div>

              {/* Section 1: Introduction & Scope */}
              <section id="introduction" className="mb-12 scroll-mt-24">
                <h2 className="text-2xl font-semibold mb-4">1. Introduction & Scope</h2>
                <p className="mb-4">
                  This Privacy Policy explains how BuildSmarter Holdings LLC ("SiteIntel™," "we," "us," or "our") collects, uses, and protects information when you use the SiteIntel™ Feasibility platform, websites, and related services.
                </p>
                <p className="mb-4">
                  By using our platform, you agree to this Privacy Policy. If you do not agree, please discontinue use of SiteIntel™.
                </p>
                <p>
                  This policy applies to all users, whether accessing the platform via web, API, or integrated partner systems.
                </p>
              </section>

              {/* Section 2: Who We Are */}
              <section id="who-we-are" className="mb-12 scroll-mt-24">
                <h2 className="text-2xl font-semibold mb-4">2. Who We Are</h2>
                <p className="mb-4">
                  SiteIntel™ Feasibility is a cloud-based AI + GIS platform operated by <strong>BuildSmarter Holdings LLC</strong>, based in Houston, Texas, USA.
                </p>
                <p className="mb-4">
                  Our mission is to make commercial real-estate feasibility fast, accurate, and accessible by automating data gathering from public sources such as FEMA, ArcGIS, and other government and environmental datasets.
                </p>
                <div className="bg-muted p-6 rounded-lg">
                  <p className="font-semibold mb-1">Contact Address:</p>
                  <p className="mb-1">BuildSmarter Holdings LLC</p>
                  <p className="mb-1">Attn: Privacy Team</p>
                  <p className="mb-1">Houston, TX, USA</p>
                  <p>Email: <a href="mailto:privacy@siteintel.ai" className="text-primary hover:underline">privacy@siteintel.ai</a></p>
                </div>
              </section>

              {/* Section 3: Information We Collect */}
              <section id="information-we-collect" className="mb-12 scroll-mt-24">
                <h2 className="text-2xl font-semibold mb-4">3. Information We Collect</h2>
                
                <h3 className="text-xl font-semibold mb-3">3.1 Account & Contact Information</h3>
                <p className="mb-4">When you register or subscribe, we collect:</p>
                <ul className="mb-4 space-y-2">
                  <li>Name, company name, and email address</li>
                  <li>Login credentials and authentication tokens</li>
                  <li>Billing and subscription information (processed via Stripe)</li>
                </ul>
                <p className="mb-6 text-sm bg-muted p-3 rounded">
                  We do not store full credit card numbers—these are handled securely by our payment processor.
                </p>

                <h3 className="text-xl font-semibold mb-3">3.2 Property & Project Data</h3>
                <p className="mb-6">
                  Users may input property addresses, parcel numbers, or project details for feasibility analysis. This project data is used exclusively to generate reports and is stored securely in our database (Supabase) for your access history and audit logs.
                </p>

                <h3 className="text-xl font-semibold mb-3">3.3 AI-Generated Reports</h3>
                <p className="mb-4">
                  SiteIntel™ generates AI-based feasibility outputs from public data sources. These reports may include zoning, floodplain, environmental, and utility details.
                </p>
                <p className="mb-6">
                  While the system uses public datasets, the generated summaries, scores, and visualizations are proprietary outputs of SiteIntel™.
                </p>

                <h3 className="text-xl font-semibold mb-3">3.4 Technical & Usage Data</h3>
                <p className="mb-4">We automatically collect:</p>
                <ul className="mb-6 space-y-2">
                  <li>Browser type, IP address, device identifiers</li>
                  <li>Pages visited, features used, and report generation history</li>
                  <li>Log files for API requests and errors (used for troubleshooting and performance)</li>
                </ul>

                <h3 className="text-xl font-semibold mb-3">3.5 Cookies & Analytics</h3>
                <p className="mb-4">
                  SiteIntel™ uses cookies and analytics tools to improve functionality and measure performance. Cookies may store preferences and login sessions. You can control cookie settings through your browser.
                </p>
                <p>
                  Analytics tools (e.g., Google Analytics) provide aggregated insights but do not expose personally identifiable information.
                </p>
              </section>

              {/* Section 4: How We Use Your Information */}
              <section id="how-we-use-your-information" className="mb-12 scroll-mt-24">
                <h2 className="text-2xl font-semibold mb-4">4. How We Use Your Information</h2>
                <p className="mb-4">We use collected information to:</p>
                <ul className="mb-4 space-y-2">
                  <li>Operate and maintain the SiteIntel™ platform</li>
                  <li>Generate feasibility and due-diligence reports</li>
                  <li>Process transactions and manage subscriptions</li>
                  <li>Improve accuracy of AI models and GIS data integration</li>
                  <li>Provide customer support and notify you of updates</li>
                  <li>Enforce our <Link to="/legal/terms" className="text-primary hover:underline">Terms of Service</Link> and prevent abuse</li>
                </ul>
                <div className="border-l-2 border-primary pl-4 bg-muted p-4 rounded">
                  <p className="font-semibold mb-2">We do not sell your personal data.</p>
                  <p>
                    All usage complies with applicable data privacy laws, including the Texas Data Privacy and Security Act (TDPSA), CCPA, and, where relevant, GDPR principles.
                  </p>
                </div>
              </section>

              {/* Section 5: Sharing & Disclosure */}
              <section id="sharing-and-disclosure" className="mb-12 scroll-mt-24">
                <h2 className="text-2xl font-semibold mb-4">5. Sharing & Disclosure</h2>
                
                <h3 className="text-xl font-semibold mb-3">5.1 Third-Party APIs & Data Sources</h3>
                <p className="mb-4">SiteIntel™ integrates external APIs such as:</p>
                <ul className="mb-4 space-y-2">
                  <li><strong>FEMA / OpenFEMA</strong> – for floodplain and disaster datasets</li>
                  <li><strong>ArcGIS Feature Services</strong> – for zoning, parcel, and utility data</li>
                  <li><strong>Google Maps APIs</strong> – for geocoding and map imagery</li>
                </ul>
                <p className="mb-6 text-sm">
                  Each provider has its own privacy and usage terms, which apply to your use of their data through our platform.
                </p>

                <h3 className="text-xl font-semibold mb-3">5.2 Service Providers & Hosting Partners</h3>
                <p className="mb-4">We use secure, trusted vendors to operate the platform:</p>
                <ul className="mb-4 space-y-2">
                  <li><strong>Supabase</strong> – database, authentication, and file storage</li>
                  <li><strong>Vercel</strong> – application hosting and Edge Functions</li>
                  <li><strong>Stripe</strong> – payment processing</li>
                  <li><strong>Google Analytics</strong> – usage analytics</li>
                </ul>
                <p className="mb-6">
                  These partners process data under contractual privacy and security obligations. We do not authorize them to use your information for their own purposes.
                </p>

                <h3 className="text-xl font-semibold mb-3">5.3 Legal Compliance & Protection</h3>
                <p className="mb-4">We may disclose information:</p>
                <ul className="space-y-2">
                  <li>To comply with lawful requests or legal process</li>
                  <li>To protect our rights, property, or users</li>
                  <li>To enforce Terms of Service or prevent fraud</li>
                </ul>
              </section>

              {/* Section 6: AI & Data Processing Transparency */}
              <section id="ai-and-data-processing-transparency" className="mb-12 scroll-mt-24">
                <h2 className="text-2xl font-semibold mb-4">6. AI & Data Processing Transparency</h2>
                <p className="mb-4">
                  Our platform uses AI models to analyze and summarize data from authoritative sources. AI-generated outputs are created programmatically without human review unless flagged for validation.
                </p>
                <div className="border-l-2 border-primary pl-4 bg-muted p-4 rounded mb-4">
                  <p className="mb-2">
                    We may retain anonymized report data to improve model performance.
                  </p>
                  <p className="font-semibold">
                    We do not use your confidential project data for training external models or third-party AI systems.
                  </p>
                </div>
              </section>

              {/* Section 7: Data Retention & Storage */}
              <section id="data-retention-and-storage" className="mb-12 scroll-mt-24">
                <h2 className="text-2xl font-semibold mb-4">7. Data Retention & Storage</h2>
                <ul className="mb-4 space-y-2">
                  <li>User account and project data are retained for the duration of your account.</li>
                  <li>Reports are stored in secure cloud storage (Supabase) for up to <strong>365 days</strong> for standard users and <strong>730 days</strong> for enterprise users.</li>
                  <li>Log and analytics data may be retained for up to <strong>12 months</strong> for operational auditing.</li>
                </ul>
                <p className="mb-4">
                  You may request deletion of your data by contacting <a href="mailto:privacy@siteintel.ai" className="text-primary hover:underline">privacy@siteintel.ai</a>.
                </p>
                <p>
                  Upon request, we will delete data unless retention is required for compliance or dispute resolution.
                </p>
              </section>

              {/* Section 8: Your Privacy Rights */}
              <section id="your-privacy-rights" className="mb-12 scroll-mt-24">
                <h2 className="text-2xl font-semibold mb-4">8. Your Privacy Rights</h2>
                <p className="mb-4">Depending on your location, you may have the right to:</p>
                <ul className="mb-4 space-y-2">
                  <li><strong>Access</strong> and obtain a copy of your personal data</li>
                  <li><strong>Request correction</strong> or deletion of inaccurate information</li>
                  <li><strong>Withdraw consent</strong> or object to processing</li>
                  <li><strong>Export or transfer</strong> your data to another provider</li>
                </ul>
                <p className="mb-4">
                  To exercise these rights, contact <a href="mailto:privacy@siteintel.ai" className="text-primary hover:underline">privacy@siteintel.ai</a>. We may verify your identity before fulfilling such requests.
                </p>
                <p>
                  Marketing communications can be unsubscribed via the "Unsubscribe" link in emails or through your account preferences.
                </p>
              </section>

              {/* Section 9: Data Security Measures */}
              <section id="data-security-measures" className="mb-12 scroll-mt-24">
                <h2 className="text-2xl font-semibold mb-4">9. Data Security Measures</h2>
                <p className="mb-4">We use industry-standard security controls to protect your data, including:</p>
                <ul className="mb-4 space-y-2">
                  <li>HTTPS encryption for all traffic</li>
                  <li>Role-based access controls and audit logs</li>
                  <li>Supabase row-level security for user data separation</li>
                  <li>Regular vulnerability scans and API monitoring</li>
                </ul>
                <p className="text-sm bg-muted p-4 rounded">
                  While we maintain strong safeguards, no digital system can be guaranteed 100% secure. You acknowledge that transmission of data via the internet carries inherent risk.
                </p>
              </section>

              {/* Section 10: International Data Transfers */}
              <section id="international-data-transfers" className="mb-12 scroll-mt-24">
                <h2 className="text-2xl font-semibold mb-4">10. International Data Transfers</h2>
                <p className="mb-4">
                  SiteIntel™ primarily stores data in the United States.
                </p>
                <p>
                  If you access the platform from outside the U.S., your information may be transferred and processed in U.S. jurisdictions under equivalent safeguards compliant with GDPR Article 46 principles.
                </p>
              </section>

              {/* Section 11: Children's Privacy */}
              <section id="childrens-privacy" className="mb-12 scroll-mt-24">
                <h2 className="text-2xl font-semibold mb-4">11. Children's Privacy</h2>
                <p className="mb-4">
                  SiteIntel™ is intended for business and professional users. We do not knowingly collect personal data from children under 18.
                </p>
                <p>
                  If you believe a child has submitted personal information, contact us immediately for deletion.
                </p>
              </section>

              {/* Section 12: Changes to This Policy */}
              <section id="changes-to-this-policy" className="mb-12 scroll-mt-24">
                <h2 className="text-2xl font-semibold mb-4">12. Changes to This Policy</h2>
                <p className="mb-4">
                  We may update this Privacy Policy periodically to reflect operational, legal, or technological changes.
                </p>
                <p className="mb-4">
                  Updates will be posted on this page with a revised "Last Updated" date.
                </p>
                <p>
                  If changes are material, we will notify users by email or dashboard notification.
                </p>
              </section>

              {/* Section 13: Contact Us */}
              <section id="contact-us" className="mb-12 scroll-mt-24">
                <h2 className="text-2xl font-semibold mb-4">13. Contact Us</h2>
                <p className="mb-4">
                  For questions, data requests, or complaints regarding this Privacy Policy, contact:
                </p>
                <div className="bg-muted p-6 rounded-lg">
                  <p className="font-semibold mb-1">BuildSmarter Holdings LLC (SiteIntel™)</p>
                  <p className="mb-1">Attn: Privacy Team</p>
                  <p className="mb-1">Houston, TX, USA</p>
                  <p>Email: <a href="mailto:privacy@siteintel.ai" className="text-primary hover:underline">privacy@siteintel.ai</a></p>
                </div>
              </section>

              {/* Copyright Footer */}
              <div className="mt-12 pt-8 border-t text-center text-sm text-muted-foreground">
                <p>© 2025 BuildSmarter Holdings LLC — All Rights Reserved.</p>
              </div>
            </div>

            {/* Sticky Sidebar (Desktop Only) */}
            <aside className="hidden lg:block">
              <div className="sticky top-24 space-y-6">
                
                {/* Last Updated Badge */}
                <div className="bg-muted rounded-lg p-4">
                  <p className="text-xs uppercase tracking-wide text-muted-foreground mb-1">Last Updated</p>
                  <p className="font-semibold">October 2025</p>
                </div>

                {/* Quick Contact Card */}
                <div className="bg-muted rounded-lg p-4">
                  <p className="text-xs uppercase tracking-wide text-muted-foreground mb-2">Privacy Contact</p>
                  <p className="text-sm mb-1">BuildSmarter Holdings LLC</p>
                  <a href="mailto:privacy@siteintel.ai" className="text-sm text-primary hover:underline">
                    privacy@siteintel.ai
                  </a>
                </div>

                {/* Request Data Deletion */}
                <a
                  href="mailto:privacy@siteintel.ai?subject=Data%20Deletion%20Request"
                  className="block w-full bg-primary text-primary-foreground hover:bg-primary/90 rounded-lg px-4 py-3 font-semibold transition-colors text-center"
                >
                  Request Data Deletion
                </a>

                {/* Download PDF */}
                <button 
                  className="w-full border border-border hover:bg-muted rounded-lg px-4 py-3 font-semibold transition-colors"
                  onClick={() => window.print()}
                >
                  Print Policy
                </button>

                {/* Jump to Top */}
                <button
                  onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
                  className="w-full border border-border hover:bg-muted rounded-lg px-4 py-3 font-semibold transition-colors"
                >
                  ↑ Back to Top
                </button>
              </div>
            </aside>

          </div>
        </div>
      </div>
    </>
  );
}
