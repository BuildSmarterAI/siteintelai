import { useNavigate, useLocation } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Building2, DollarSign, Ruler, ArrowLeft } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export default function TypeSelector() {
  const navigate = useNavigate();
  const location = useLocation();
  const { geometry, method } = location.state || {};

  if (!geometry) {
    navigate('/feasibility/start');
    return null;
  }

  const analysisTypes = [
    {
      id: 'build',
      title: 'Build Feasibility',
      description: 'Evaluate site conditions, zoning compliance, utilities, and development constraints',
      icon: Building2,
      color: 'buildRed',
      features: ['Zoning Analysis', 'Flood Risk', 'Utilities Access', 'Environmental Checks'],
    },
    {
      id: 'deal',
      title: 'Deal Check',
      description: 'Assess investment potential, ROI projections, and market comparables',
      icon: DollarSign,
      color: 'dealGreen',
      features: ['ROI Analysis', 'Market Comps', 'Risk Factors', 'Exit Strategy'],
    },
    {
      id: 'capacity',
      title: 'Capacity Analysis',
      description: 'Calculate maximum buildable area, parking requirements, and site utilization',
      icon: Ruler,
      color: 'capacityBlue',
      features: ['Max GFA', 'Parking Calc', 'Setback Analysis', 'FAR Optimization'],
    },
  ];

  const handleSelectType = (type: string) => {
    navigate(`/feasibility/${type}`, { state: { geometry, method } });
  };

  return (
    <div className="min-h-screen bg-background pt-24 pb-16">
      <div className="container mx-auto px-4">
        <div className="max-w-5xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <Button
              variant="ghost"
              onClick={() => navigate('/feasibility/confirm', { state: { geometry, method } })}
              className="mb-4"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
            
            <h1 className="text-4xl font-headline font-bold text-foreground mb-3">
              Select Analysis Type
            </h1>
            <p className="text-lg text-muted-foreground">
              Choose the type of feasibility analysis you need
            </p>
          </div>

          {/* Analysis Type Cards */}
          <div className="grid md:grid-cols-3 gap-6">
            {analysisTypes.map((type) => {
              const Icon = type.icon;
              return (
                <Card
                  key={type.id}
                  className="hover:shadow-lg transition-shadow cursor-pointer border-2 hover:border-primary"
                  onClick={() => handleSelectType(type.id)}
                >
                  <CardHeader>
                    <div className="flex items-start justify-between mb-2">
                      <Icon className="w-8 h-8" style={{ color: `var(--${type.color})` }} />
                      <Badge variant="outline">{type.id}</Badge>
                    </div>
                    <CardTitle className="text-xl">{type.title}</CardTitle>
                    <CardDescription className="text-sm">
                      {type.description}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div className="text-sm font-medium text-muted-foreground mb-2">
                        Includes:
                      </div>
                      {type.features.map((feature) => (
                        <div key={feature} className="flex items-center gap-2 text-sm">
                          <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                          {feature}
                        </div>
                      ))}
                    </div>
                    <Button className="w-full mt-4" variant="outline">
                      Select {type.title}
                    </Button>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {/* Info */}
          <Card className="mt-8 bg-muted/50">
            <CardContent className="pt-6">
              <p className="text-sm text-muted-foreground">
                💡 <strong>Tip:</strong> You can run multiple analysis types on the same parcel. Each analysis provides unique insights tailored to your specific needs.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
