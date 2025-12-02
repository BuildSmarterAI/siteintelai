import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Zap, Users, Database, Bell, ArrowRight } from "lucide-react";

export const WebhookSetup = () => {
  return (
    <section className="bg-gradient-to-br from-navy/5 to-charcoal/5 py-20">
      <div className="container mx-auto px-6 lg:px-8">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold leading-[1.1] bg-clip-text text-transparent bg-gradient-to-b from-foreground to-muted-foreground mb-4">
              Automation Integration Setup
            </h2>
            <p className="font-body text-lg text-charcoal/80 max-w-3xl mx-auto">
              Connect your application form to your CRM, database, and notification systems using Zapier or Make.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            
            {/* Setup Instructions */}
            <Card className="border-2 border-navy/20">
              <CardHeader className="bg-navy/5">
                <CardTitle className="flex items-center gap-3 text-navy">
                  <Zap className="w-6 h-6" />
                  Quick Setup Guide
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <div className="space-y-6">
                  
                  {/* Step 1 */}
                  <div className="flex items-start gap-4">
                    <div className="w-8 h-8 bg-navy rounded-full flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                      1
                    </div>
                    <div>
                      <h3 className="font-body font-semibold text-charcoal mb-2">
                        Create Zapier/Make Webhook
                      </h3>
                      <p className="font-body text-sm text-charcoal/70 mb-3">
                        Set up a webhook trigger in Zapier or Make to receive form submissions.
                      </p>
                      <Badge variant="outline" className="text-xs">
                        Trigger: Webhook → Catch Hook
                      </Badge>
                    </div>
                  </div>

                  {/* Step 2 */}
                  <div className="flex items-start gap-4">
                    <div className="w-8 h-8 bg-navy rounded-full flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                      2
                    </div>
                    <div>
                      <h3 className="font-body font-semibold text-charcoal mb-2">
                        Configure Actions
                      </h3>
                      <p className="font-body text-sm text-charcoal/70 mb-3">
                        Add actions to send data to your preferred systems.
                      </p>
                      <div className="space-y-2">
                        <Badge variant="outline" className="text-xs mr-2">
                          GoHighLevel → Create Contact
                        </Badge>
                        <Badge variant="outline" className="text-xs mr-2">
                          Airtable → Create Record
                        </Badge>
                        <Badge variant="outline" className="text-xs">
                          Slack → Send Message
                        </Badge>
                      </div>
                    </div>
                  </div>

                  {/* Step 3 */}
                  <div className="flex items-start gap-4">
                    <div className="w-8 h-8 bg-navy rounded-full flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                      3
                    </div>
                    <div>
                      <h3 className="font-body font-semibold text-charcoal mb-2">
                        Add Webhook URL
                      </h3>
                      <p className="font-body text-sm text-charcoal/70">
                        Copy the webhook URL and paste it into the application form setup.
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Data Flow Visualization */}
            <Card className="border-2 border-maxx-red/20">
              <CardHeader className="bg-maxx-red/5">
                <CardTitle className="flex items-center gap-3 text-maxx-red">
                  <Database className="w-6 h-6" />
                  Data Flow
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <div className="space-y-6">
                  
                  {/* Form Submission */}
                  <div className="flex items-center gap-4">
                    <div className="bg-charcoal/10 rounded-lg p-3 flex-shrink-0">
                      <div className="w-6 h-6 bg-charcoal rounded text-white flex items-center justify-center text-xs font-bold">
                        F
                      </div>
                    </div>
                    <div className="flex-1">
                      <h4 className="font-body font-semibold text-charcoal">Form Submission</h4>
                      <p className="font-body text-xs text-charcoal/60">User completes application</p>
                    </div>
                    <ArrowRight className="w-4 h-4 text-charcoal/40" />
                  </div>

                  {/* Webhook */}
                  <div className="flex items-center gap-4">
                    <div className="bg-navy/10 rounded-lg p-3 flex-shrink-0">
                      <Zap className="w-6 h-6 text-navy" />
                    </div>
                    <div className="flex-1">
                      <h4 className="font-body font-semibold text-charcoal">Zapier/Make</h4>
                      <p className="font-body text-xs text-charcoal/60">Processes and routes data</p>
                    </div>
                    <ArrowRight className="w-4 h-4 text-charcoal/40" />
                  </div>

                  {/* Integrations */}
                  <div className="space-y-3">
                    <div className="flex items-center gap-4">
                      <div className="bg-green-100 rounded-lg p-3 flex-shrink-0">
                        <Users className="w-6 h-6 text-green-600" />
                      </div>
                      <div className="flex-1">
                        <h4 className="font-body font-semibold text-charcoal">GoHighLevel CRM</h4>
                        <p className="font-body text-xs text-charcoal/60">Creates contact, adds to pipeline</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-4">
                      <div className="bg-blue-100 rounded-lg p-3 flex-shrink-0">
                        <Database className="w-6 h-6 text-blue-600" />
                      </div>
                      <div className="flex-1">
                        <h4 className="font-body font-semibold text-charcoal">Airtable/Sheets</h4>
                        <p className="font-body text-xs text-charcoal/60">Logs application data</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-4">
                      <div className="bg-purple-100 rounded-lg p-3 flex-shrink-0">
                        <Bell className="w-6 h-6 text-purple-600" />
                      </div>
                      <div className="flex-1">
                        <h4 className="font-body font-semibold text-charcoal">Team Notifications</h4>
                        <p className="font-body text-xs text-charcoal/60">Slack/email alerts</p>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Data Fields Reference */}
          <Card className="mt-8 border-2 border-charcoal/20">
            <CardHeader className="bg-charcoal/5">
              <CardTitle className="text-charcoal">
                Available Data Fields
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                
                <div>
                  <h4 className="font-body font-semibold text-charcoal mb-3">Contact Information</h4>
                  <ul className="space-y-1 text-sm text-charcoal/70">
                    <li>• name</li>
                    <li>• company</li>
                    <li>• email</li>
                    <li>• phone</li>
                  </ul>
                </div>

                <div>
                  <h4 className="font-body font-semibold text-charcoal mb-3">Project Details</h4>
                  <ul className="space-y-1 text-sm text-charcoal/70">
                    <li>• role</li>
                    <li>• propertyType</li>
                    <li>• budget (project_value_band)</li>
                    <li>• timeline (timeline_band)</li>
                    <li>• location</li>
                  </ul>
                </div>

                <div>
                  <h4 className="font-body font-semibold text-charcoal mb-3">Metadata</h4>
                  <ul className="space-y-1 text-sm text-charcoal/70">
                    <li>• timestamp</li>
                    <li>• source</li>
                    <li>• lead_score</li>
                    <li>• utm_source</li>
                    <li>• source_page</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </section>
  );
};