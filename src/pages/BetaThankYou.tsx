import { useEffect } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { Helmet } from "react-helmet";
import { motion } from "framer-motion";
import { CheckCircle2, ArrowRight, Mail, Calendar, FileText, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import ShaderBackground from "@/components/ui/shader-background";
import { useIsMobile } from "@/hooks/use-mobile";

const BetaThankYou = () => {
  const [searchParams] = useSearchParams();
  const isMobile = useIsMobile();
  
  const userName = searchParams.get('name') || 'there';
  const userEmail = searchParams.get('email') || '';
  const userRole = searchParams.get('role') || '';
  const userCompany = searchParams.get('company') || '';

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const shouldDisableAnimations = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  return (
    <>
      <Helmet>
        <title>Welcome to Beta | SiteIntel™ Feasibility</title>
        <meta name="description" content="You're officially part of the SiteIntel™ Private Beta. Access credentials on the way." />
        <meta name="robots" content="noindex, nofollow" />
      </Helmet>

      <div className="relative min-h-screen overflow-hidden">
        {/* Animated Background */}
        {!shouldDisableAnimations && (
          <div className="absolute inset-0 z-0">
            <ShaderBackground pixelRatio={isMobile ? 1.0 : 1.5} />
          </div>
        )}

        {/* Orange Accent Overlay */}
        <div className="absolute inset-0 z-[1] bg-gradient-to-br from-primary/5 via-transparent to-transparent pointer-events-none" />

        {/* Content */}
        <div className="relative z-10 container mx-auto px-4 py-16 md:py-24">
          {/* Success Hero */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center mb-12"
          >
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
              className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-green-500/10 mb-6"
            >
              <CheckCircle2 className="w-12 h-12 text-green-500" />
            </motion.div>
            
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-4 text-foreground">
              Welcome to the Founding Cohort
            </h1>
            
            <p className="text-xl md:text-2xl text-muted-foreground max-w-2xl mx-auto">
              You're officially part of the SiteIntel™ Private Beta
            </p>

            <div className="flex items-center justify-center gap-2 mt-6">
              <Badge variant="secondary" className="text-sm px-4 py-1">
                Beta Founding Member
              </Badge>
              <Badge variant="outline" className="text-sm px-4 py-1">
                Pro Pricing Locked
              </Badge>
            </div>
          </motion.div>

          {/* Confirmation Card */}
          {userEmail && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.6 }}
              className="max-w-2xl mx-auto mb-12"
            >
              <Card className="bg-card/80 backdrop-blur-sm border-border/50">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Mail className="w-5 h-5 text-primary" />
                    Your Beta Access Details
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-muted-foreground mb-1">Name</p>
                      <p className="font-medium text-foreground">{userName}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground mb-1">Email</p>
                      <p className="font-medium text-foreground break-all">{userEmail}</p>
                    </div>
                    {userRole && (
                      <div>
                        <p className="text-muted-foreground mb-1">Role</p>
                        <p className="font-medium text-foreground capitalize">{userRole}</p>
                      </div>
                    )}
                    {userCompany && (
                      <div>
                        <p className="text-muted-foreground mb-1">Company</p>
                        <p className="font-medium text-foreground">{userCompany}</p>
                      </div>
                    )}
                  </div>

                  <div className="border-t border-border/50 pt-4 mt-4">
                    <p className="font-semibold mb-3 text-foreground">What You'll Receive:</p>
                    <ul className="space-y-2 text-sm text-muted-foreground">
                      <li className="flex items-start gap-2">
                        <CheckCircle2 className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                        <span>3 free feasibility report credits ($2,385 value)</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <CheckCircle2 className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                        <span>Early access to Cost & Schedule Intelligence modules</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <CheckCircle2 className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                        <span>Founding Member status with locked Pro pricing</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <CheckCircle2 className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                        <span>Access credentials via email within 24 hours</span>
                      </li>
                    </ul>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {/* Next Steps Timeline */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.6 }}
            className="max-w-3xl mx-auto mb-12"
          >
            <h2 className="text-2xl md:text-3xl font-bold text-center mb-8 text-foreground">
              What Happens Next
            </h2>

            <div className="space-y-4">
              {[
                {
                  step: "1",
                  title: "Email Verification",
                  description: "Check your inbox for verification email",
                  time: "Within 1 hour",
                  icon: Mail,
                },
                {
                  step: "2",
                  title: "Access Credentials",
                  description: "Receive login details and beta onboarding guide",
                  time: "Within 24 hours",
                  icon: FileText,
                },
                {
                  step: "3",
                  title: "QuickStart Tutorial",
                  description: "Interactive walkthrough of platform features",
                  time: "At your pace",
                  icon: Users,
                },
                {
                  step: "4",
                  title: "Optional Onboarding Call",
                  description: "Schedule 1-on-1 demo with our team",
                  time: "Your choice",
                  icon: Calendar,
                },
              ].map((item, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.5 + index * 0.1 }}
                >
                  <Card className="bg-card/80 backdrop-blur-sm border-border/50">
                    <CardContent className="flex items-start gap-4 p-6">
                      <div className="flex-shrink-0 w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                        <item.icon className="w-5 h-5 text-primary" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-1">
                          <h3 className="font-semibold text-foreground">{item.title}</h3>
                          <Badge variant="outline" className="text-xs">
                            {item.time}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">{item.description}</p>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* Action Cards Grid */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8, duration: 0.6 }}
            className="max-w-4xl mx-auto mb-12"
          >
            <h2 className="text-2xl md:text-3xl font-bold text-center mb-8 text-foreground">
              Get Started Right Away
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card className="bg-card/80 backdrop-blur-sm border-border/50 hover:border-primary/50 transition-colors">
                <CardContent className="p-6 text-center">
                  <FileText className="w-12 h-12 text-primary mx-auto mb-4" />
                  <h3 className="font-semibold mb-2 text-foreground">Start Your First Report</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Run a feasibility analysis right now
                  </p>
                  <Button asChild className="w-full">
                    <Link to="/application">
                      Run Analysis <ArrowRight className="w-4 h-4 ml-2" />
                    </Link>
                  </Button>
                </CardContent>
              </Card>

              <Card className="bg-card/80 backdrop-blur-sm border-border/50 hover:border-primary/50 transition-colors">
                <CardContent className="p-6 text-center">
                  <Users className="w-12 h-12 text-primary mx-auto mb-4" />
                  <h3 className="font-semibold mb-2 text-foreground">Explore Beta Program</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Learn about exclusive benefits
                  </p>
                  <Button asChild variant="outline" className="w-full">
                    <Link to="/beta">
                      View Program <ArrowRight className="w-4 h-4 ml-2" />
                    </Link>
                  </Button>
                </CardContent>
              </Card>

              <Card className="bg-card/80 backdrop-blur-sm border-border/50 hover:border-primary/50 transition-colors">
                <CardContent className="p-6 text-center">
                  <Calendar className="w-12 h-12 text-primary mx-auto mb-4" />
                  <h3 className="font-semibold mb-2 text-foreground">Schedule Demo Call</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Book a personalized walkthrough
                  </p>
                  <Button asChild variant="outline" className="w-full">
                    <Link to="/contact">
                      Book Call <ArrowRight className="w-4 h-4 ml-2" />
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            </div>
          </motion.div>

          {/* Trust Signals */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1, duration: 0.6 }}
            className="max-w-3xl mx-auto text-center"
          >
            <p className="text-sm text-muted-foreground mb-4">
              Powered by authoritative data sources
            </p>
            <div className="flex flex-wrap items-center justify-center gap-6">
              {["FEMA", "TxDOT", "EPA ECHO", "ArcGIS", "USFWS"].map((source) => (
                <Badge key={source} variant="secondary" className="text-xs">
                  {source}
                </Badge>
              ))}
            </div>
            <p className="text-xs text-muted-foreground mt-6">
              🔒 Your data is encrypted and NDA-protected
            </p>
          </motion.div>
        </div>
      </div>
    </>
  );
};

export default BetaThankYou;
