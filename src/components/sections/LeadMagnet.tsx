import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Download, CheckCircle, Clock, Shield } from "lucide-react";

export const LeadMagnet = () => {
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitted(true);
  };

  if (isSubmitted) {
    return (
      <section className="bg-gradient-to-br from-maxx-red/10 to-navy/10 py-20">
        <div className="container mx-auto px-6 lg:px-8">
          <div className="max-w-2xl mx-auto text-center animate-fade-in">
            <CheckCircle className="w-20 h-20 text-green-500 mx-auto mb-6" />
            <h3 className="font-headline text-3xl font-bold text-charcoal mb-4">
              Thank You! Your Guide is Ready
            </h3>
            <p className="font-body text-lg text-charcoal/80 mb-8">
              Check your inbox for immediate access to the Texas CRE Feasibility Guide.
            </p>
            <Button variant="maxx-red" size="lg" className="text-lg font-cta">
              <Download className="w-5 h-5 mr-2" />
              Download Guide Now
            </Button>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="bg-gradient-to-br from-maxx-red/10 to-navy/10 py-20">
      <div className="container mx-auto px-6 lg:px-8">
        <div className="text-center mb-12">
          <h3 className="font-headline text-3xl md:text-4xl lg:text-5xl text-charcoal mb-4">
            Free Texas CRE Feasibility Guide
          </h3>
          <p className="font-body text-lg text-charcoal/80 max-w-3xl mx-auto mb-8">
            Get our comprehensive guide with case studies, checklists, and expert insights.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
            <div className="flex items-center gap-3 p-4 bg-white/50 rounded-lg border border-charcoal/10 hover:scale-105 transition-transform duration-300">
              <Shield className="w-6 h-6 text-maxx-red flex-shrink-0" />
              <span className="font-body text-sm font-medium text-charcoal">Risk Identification Checklist</span>
            </div>
            <div className="flex items-center gap-3 p-4 bg-white/50 rounded-lg border border-charcoal/10 hover:scale-105 transition-transform duration-300">
              <Clock className="w-6 h-6 text-navy flex-shrink-0" />
              <span className="font-body text-sm font-medium text-charcoal">Timeline & Cost Benchmarks</span>
            </div>
            <div className="flex items-center gap-3 p-4 bg-white/50 rounded-lg border border-charcoal/10 hover:scale-105 transition-transform duration-300">
              <Download className="w-6 h-6 text-green-600 flex-shrink-0" />
              <span className="font-body text-sm font-medium text-charcoal">Real Texas Case Studies</span>
            </div>
          </div>
        </div>

        <Card className="max-w-2xl mx-auto shadow-2xl border-2 border-charcoal/20">
          <CardHeader className="bg-gradient-to-r from-maxx-red to-navy text-white">
            <CardTitle className="text-center font-headline text-2xl">
              Get Your Free Guide in 60 Seconds
            </CardTitle>
          </CardHeader>
          <CardContent className="p-8">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <Label htmlFor="name" className="font-body font-semibold">Name *</Label>
                  <Input id="name" placeholder="Your full name" required className="mt-2" />
                </div>
                <div>
                  <Label htmlFor="email" className="font-body font-semibold">Email *</Label>
                  <Input id="email" type="email" placeholder="your@email.com" required className="mt-2" />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <Label htmlFor="company" className="font-body font-semibold">Company</Label>
                  <Input id="company" placeholder="Your company" className="mt-2" />
                </div>
                <div>
                  <Label htmlFor="property-type" className="font-body font-semibold">Property Type</Label>
                  <Select>
                    <SelectTrigger className="mt-2">
                      <SelectValue placeholder="Select property type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="retail">Retail</SelectItem>
                      <SelectItem value="multifamily">Multifamily</SelectItem>
                      <SelectItem value="office">Office</SelectItem>
                      <SelectItem value="industrial">Industrial</SelectItem>
                      <SelectItem value="healthcare">Healthcare</SelectItem>
                      <SelectItem value="hospitality">Hospitality</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label htmlFor="message" className="font-body font-semibold">Project Details (optional)</Label>
                <Textarea 
                  id="message" 
                  placeholder="Briefly describe your project location, timeline, and any specific concerns..."
                  className="mt-2"
                />
              </div>

              <div className="text-center pt-4">
                <Button 
                  type="submit" 
                  variant="maxx-red" 
                  size="lg"
                  className="w-full md:w-auto px-12 py-4 text-lg font-cta hover:scale-105 transition-all duration-300"
                >
                  <Download className="w-5 h-5 mr-2" />
                  Download My Free Guide →
                </Button>
                <p className="font-body text-sm text-charcoal/60 mt-4">
                  🔒 Your information is secure and will never be shared.
                </p>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </section>
  );
};