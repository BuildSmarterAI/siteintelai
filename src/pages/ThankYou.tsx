import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { CheckCircle, Calendar, Clock, Phone, ArrowRight, Zap, Database, Users } from "lucide-react";
import { Link, useSearchParams } from "react-router-dom";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { UtilityResults } from "@/components/UtilityResults";

export default function ThankYou() {
  const [searchParams] = useSearchParams();
  const applicationId = searchParams.get('id');
  const [applicationData, setApplicationData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (applicationId) {
      const fetchApplication = async () => {
        const { data, error } = await supabase
          .from('applications')
          .select('*')
          .eq('id', applicationId)
          .maybeSingle();
        
        if (data && !error) {
          setApplicationData(data);
        }
        setLoading(false);
      };

      fetchApplication();

      // Subscribe to real-time updates for this application
      const channel = supabase
        .channel('application-updates')
        .on(
          'postgres_changes',
          {
            event: 'UPDATE',
            schema: 'public',
            table: 'applications',
            filter: `id=eq.${applicationId}`
          },
          (payload) => {
            setApplicationData(payload.new);
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    } else {
      setLoading(false);
    }
  }, [applicationId]);

  return (
    <div className="min-h-screen bg-white">
      <div className="container mx-auto px-6 lg:px-8 py-20">
        <div className="max-w-4xl mx-auto">
          
          {/* Hero Section */}
          <div className="text-center mb-12">
            <div className="mb-8">
              <CheckCircle className="w-20 h-20 text-green-500 mx-auto mb-6" />
              <h1 className="font-headline text-3xl md:text-5xl font-black text-charcoal mb-4 uppercase tracking-wide">
                Application Submitted Successfully
              </h1>
              <p className="font-body text-lg md:text-xl text-charcoal/80 max-w-3xl mx-auto leading-relaxed">
                Thank you for your comprehensive application. Our team will review your project details and contact you within 1 business day.
              </p>
            </div>
          </div>

          {/* Confirmation Details */}
          <Card className="border-2 border-green-500/30 shadow-xl mb-8">
            <CardContent className="p-8">
              <div className="flex items-center gap-3 mb-6">
                <CheckCircle className="w-8 h-8 text-green-500" />
                <h3 className="font-headline text-2xl font-bold text-charcoal">
                  Your Application Has Been Processed
                </h3>
              </div>
              
              <div className="bg-green-50 border border-green-200 rounded-lg p-6 mb-6">
                <h4 className="font-headline text-lg font-bold text-charcoal mb-3">
                  Automatic Integration Complete
                </h4>
                <p className="font-body text-sm text-charcoal/70 mb-4">
                  Your application has been automatically distributed to our systems:
                </p>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="flex items-center gap-2">
                    <Users className="w-5 h-5 text-green-600" />
                    <span className="font-body text-sm text-charcoal">GoHighLevel CRM</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Database className="w-5 h-5 text-green-600" />
                    <span className="font-body text-sm text-charcoal">Project Database</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Zap className="w-5 h-5 text-green-600" />
                    <span className="font-body text-sm text-charcoal">Sales Team Alert</span>
                  </div>
                </div>
              </div>

              {/* Next Steps */}
              <h4 className="font-headline text-xl font-bold text-charcoal mb-6">
                What Happens Next?
              </h4>
              <div className="space-y-6">
                <div className="flex items-start gap-4">
                  <div className="w-8 h-8 bg-navy rounded-full flex items-center justify-center text-white font-bold text-sm flex-shrink-0 mt-1">1</div>
                  <div>
                    <p className="font-body font-semibold text-charcoal text-lg mb-2">Initial Review (Within 24 Hours)</p>
                    <p className="font-body text-charcoal/70">
                      Our feasibility team reviews your application, property details, and project requirements. We'll assess complexity and identify any preliminary concerns.
                    </p>
                  </div>
                </div>
                
                <div className="flex items-start gap-4">
                  <div className="w-8 h-8 bg-navy rounded-full flex items-center justify-center text-white font-bold text-sm flex-shrink-0 mt-1">2</div>
                  <div>
                    <p className="font-body font-semibold text-charcoal text-lg mb-2">Discovery Call (48-72 Hours)</p>
                    <p className="font-body text-charcoal/70">
                      We'll schedule a 30-minute discovery call to discuss your timeline, budget parameters, and specific requirements. This helps us customize your feasibility package.
                    </p>
                  </div>
                </div>
                
                <div className="flex items-start gap-4">
                  <div className="w-8 h-8 bg-navy rounded-full flex items-center justify-center text-white font-bold text-sm flex-shrink-0 mt-1">3</div>
                  <div>
                    <p className="font-body font-semibold text-charcoal text-lg mb-2">Proposal & Timeline (3-5 Days)</p>
                    <p className="font-body text-charcoal/70">
                      Receive your customized feasibility proposal with scope, timeline, and investment details. We'll also provide a preliminary project assessment.
                    </p>
                  </div>
                </div>
                
                <div className="flex items-start gap-4">
                  <div className="w-8 h-8 bg-maxx-red rounded-full flex items-center justify-center text-white font-bold text-sm flex-shrink-0 mt-1">4</div>
                  <div>
                    <p className="font-body font-semibold text-charcoal text-lg mb-2">Feasibility Execution (2-4 Weeks)</p>
                    <p className="font-body text-charcoal/70">
                      Upon approval, our team conducts comprehensive feasibility analysis including zoning research, utility verification, and preliminary design concepts.
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Schedule Call Section */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
            <Card className="shadow-xl border-2 border-navy/20">
              <CardContent className="p-8 text-center">
                <Calendar className="w-12 h-12 text-navy mx-auto mb-4" />
                <h3 className="font-headline text-xl font-bold text-charcoal mb-4">
                  Schedule Your Discovery Call
                </h3>
                <p className="font-body text-charcoal/70 mb-6">
                  Prefer to schedule your call immediately? Use our calendar to book a convenient time for your discovery session.
                </p>
                <Button className="bg-navy hover:bg-navy/90 text-white w-full">
                  Schedule Call Now
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </CardContent>
            </Card>

            <Card className="shadow-xl border-2 border-maxx-red/20">
              <CardContent className="p-8 text-center">
                <Phone className="w-12 h-12 text-maxx-red mx-auto mb-4" />
                <h3 className="font-headline text-xl font-bold text-charcoal mb-4">
                  Urgent Project?
                </h3>
                <p className="font-body text-charcoal/70 mb-6">
                  Need immediate attention for a time-sensitive project? Contact our priority line for expedited review.
                </p>
                <Button variant="outline" className="border-maxx-red text-maxx-red hover:bg-maxx-red hover:text-white w-full">
                  Call Priority Line
                  <Phone className="w-4 h-4 ml-2" />
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Enriched Data Results */}
          {applicationData && (
            <div className="space-y-6 mb-8">
              {/* Utility Results */}
              <UtilityResults
                waterLines={applicationData.water_lines}
                sewerLines={applicationData.sewer_lines}
                stormLines={applicationData.storm_lines}
                dataFlags={applicationData.data_flags || []}
              />

              {/* FEMA Flood Data */}
              {(applicationData.floodplain_zone || applicationData.base_flood_elevation) && (
                <Card className="shadow-lg">
                  <CardContent className="p-6">
                    <h3 className="font-headline text-xl font-bold text-charcoal mb-4">
                      FEMA Flood Zone Information
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {applicationData.floodplain_zone && (
                        <div>
                          <p className="font-body text-sm text-charcoal/60 mb-1">Flood Zone</p>
                          <p className="font-body font-semibold text-charcoal">{applicationData.floodplain_zone}</p>
                        </div>
                      )}
                      {applicationData.base_flood_elevation && (
                        <div>
                          <p className="font-body text-sm text-charcoal/60 mb-1">Base Flood Elevation</p>
                          <p className="font-body font-semibold text-charcoal">{applicationData.base_flood_elevation} ft</p>
                        </div>
                      )}
                      {applicationData.fema_panel_id && (
                        <div>
                          <p className="font-body text-sm text-charcoal/60 mb-1">FEMA Panel ID</p>
                          <p className="font-body font-semibold text-charcoal">{applicationData.fema_panel_id}</p>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* TxDOT Traffic Data */}
              {(applicationData.traffic_aadt || applicationData.traffic_road_name) && (
                <Card className="shadow-lg">
                  <CardContent className="p-6">
                    <h3 className="font-headline text-xl font-bold text-charcoal mb-4">
                      Traffic Count Information
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                      {applicationData.traffic_road_name && (
                        <div>
                          <p className="font-body text-sm text-charcoal/60 mb-1">Road Name</p>
                          <p className="font-body font-semibold text-charcoal">{applicationData.traffic_road_name}</p>
                        </div>
                      )}
                      {applicationData.traffic_aadt && (
                        <div>
                          <p className="font-body text-sm text-charcoal/60 mb-1">AADT (Vehicles/Day)</p>
                          <p className="font-body font-semibold text-charcoal">{applicationData.traffic_aadt.toLocaleString()}</p>
                        </div>
                      )}
                      {applicationData.traffic_year && (
                        <div>
                          <p className="font-body text-sm text-charcoal/60 mb-1">Count Year</p>
                          <p className="font-body font-semibold text-charcoal">{applicationData.traffic_year}</p>
                        </div>
                      )}
                      {applicationData.traffic_distance_ft && (
                        <div>
                          <p className="font-body text-sm text-charcoal/60 mb-1">Distance from Site</p>
                          <p className="font-body font-semibold text-charcoal">{Math.round(applicationData.traffic_distance_ft)} ft</p>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* MUD District / ETJ Provider */}
              {(applicationData.mud_district || applicationData.etj_provider) && (
                <Card className="shadow-lg">
                  <CardContent className="p-6">
                    <h3 className="font-headline text-xl font-bold text-charcoal mb-4">
                      Service Provider Information
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {applicationData.mud_district && (
                        <div>
                          <p className="font-body text-sm text-charcoal/60 mb-1">MUD District</p>
                          <p className="font-body font-semibold text-charcoal">{applicationData.mud_district}</p>
                        </div>
                      )}
                      {applicationData.etj_provider && (
                        <div>
                          <p className="font-body text-sm text-charcoal/60 mb-1">ETJ Provider</p>
                          <p className="font-body font-semibold text-charcoal">{applicationData.etj_provider}</p>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Loading State */}
              {loading && (
                <Card className="shadow-lg">
                  <CardContent className="p-6 text-center">
                    <p className="font-body text-charcoal/60">Loading enrichment data...</p>
                  </CardContent>
                </Card>
              )}
            </div>
          )}

          {/* Trust Reminders */}
          <Card className="bg-navy/5 border-2 border-navy/20 mb-8">
            <CardContent className="p-8">
              <h3 className="font-headline text-xl font-bold text-navy mb-6 text-center">
                Your Project Is In Expert Hands
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="text-center">
                  <CheckCircle className="w-8 h-8 text-green-500 mx-auto mb-3" />
                  <p className="font-body font-semibold text-charcoal mb-2">100% Fee Credit</p>
                  <p className="font-body text-sm text-charcoal/70">
                    Every dollar of your feasibility fee is credited toward your project.
                  </p>
                </div>
                <div className="text-center">
                  <CheckCircle className="w-8 h-8 text-green-500 mx-auto mb-3" />
                  <p className="font-body font-semibold text-charcoal mb-2">Confidential Process</p>
                  <p className="font-body text-sm text-charcoal/70">
                    All project details remain strictly confidential with NDA protection.
                  </p>
                </div>
                <div className="text-center">
                  <CheckCircle className="w-8 h-8 text-green-500 mx-auto mb-3" />
                  <p className="font-body font-semibold text-charcoal mb-2">Proven Results</p>
                  <p className="font-body text-sm text-charcoal/70">
                    Trusted by developers managing $500M+ in Texas commercial projects.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Immediate Attention Box */}
          <Card className="bg-maxx-red/5 border-2 border-maxx-red/30">
            <CardContent className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <Clock className="w-6 h-6 text-maxx-red" />
                <h4 className="font-headline text-lg font-bold text-charcoal">
                  Need Immediate Attention?
                </h4>
              </div>
              <p className="font-body text-charcoal/70 mb-4">
                If your project has urgent deadlines or requires immediate feasibility review, our priority team can expedite your application.
              </p>
              <div className="flex flex-col sm:flex-row gap-3">
                <Button className="bg-maxx-red hover:bg-maxx-red/90 text-white">
                  Contact Priority Team
                </Button>
                <Button variant="outline" className="border-maxx-red text-maxx-red hover:bg-maxx-red hover:text-white">
                  Email Direct
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Return to Home */}
          <div className="text-center mt-12">
            <Link to="/">
              <Button variant="outline" size="lg" className="border-navy text-navy hover:bg-navy hover:text-white">
                Return to Home
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}