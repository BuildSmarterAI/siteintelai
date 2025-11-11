import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";
import { Calculator, DollarSign, TrendingUp, Shield, Share2 } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { toast } from 'sonner';

export const InteractiveCalculator = () => {
  const [projectValue, setProjectValue] = useState([2000000]);
  const [riskLevel, setRiskLevel] = useState([3]);
  const [showResults, setShowResults] = useState(false);

  const calculateSavings = () => {
    const baseValue = projectValue[0];
    const riskMultiplier = riskLevel[0];
    
    // Potential loss without feasibility study (3-25% based on risk level)
    const potentialLoss = baseValue * (0.03 + (riskMultiplier - 1) * 0.055);
    
    // Cost of feasibility study (typically 0.1-0.3% of project value)
    const studyCost = Math.min(Math.max(baseValue * 0.002, 15000), 75000);
    
    // Net savings
    const netSavings = potentialLoss - studyCost;
    
    return {
      potentialLoss: Math.round(potentialLoss),
      studyCost: Math.round(studyCost),
      netSavings: Math.round(netSavings),
      roi: Math.round((netSavings / studyCost) * 100)
    };
  };

  const results = calculateSavings();
  const riskLabels = ["Very Low", "Low", "Medium", "High", "Very High"];

  const shareResults = async () => {
    const shareText = 
      `💰 SiteIntel™ Feasibility Savings Calculator\n\n` +
      `Project Value: $${projectValue[0].toLocaleString()}\n` +
      `Risk Level: ${riskLabels[riskLevel[0] - 1]}\n\n` +
      `📊 Results:\n` +
      `• Potential Loss (without study): $${results.potentialLoss.toLocaleString()}\n` +
      `• Study Cost: $${results.studyCost.toLocaleString()}\n` +
      `• Net Savings: $${results.netSavings.toLocaleString()}\n` +
      `• ROI: ${results.roi}%\n\n` +
      `Calculate yours at ${window.location.origin}/`;
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'SiteIntel™ Savings Calculator Results',
          text: shareText,
          url: window.location.href
        });
        toast.success('Results shared!');
      } catch (err) {
        // User canceled share
      }
    } else {
      await navigator.clipboard.writeText(shareText);
      toast.success('Results copied to clipboard!');
    }
  };

  return (
    <section className="bg-gradient-to-br from-navy/5 to-maxx-red/5 py-20">
      <div className="container mx-auto px-6 lg:px-8">
        <div className="text-center mb-12">
          <h3 className="font-headline text-3xl md:text-4xl lg:text-5xl text-charcoal mb-4">
            Calculate Your Potential Savings
          </h3>
          <p className="font-body text-lg text-charcoal/80 max-w-3xl mx-auto">
            See how much a SiteIntel™ Feasibility study could save on your next project
          </p>
        </div>

        <div className="max-w-4xl mx-auto">
          <Card className="backdrop-blur-sm border-2 border-navy/20 shadow-2xl">
            <CardHeader className="text-center pb-6">
              <CardTitle className="flex items-center justify-center gap-3 text-2xl font-headline text-navy">
                <Calculator className="w-8 h-8" />
                Project Risk Calculator
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-8">
              {/* Project Value Slider */}
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <label className="font-body font-semibold text-charcoal">
                    Project Value
                  </label>
                  <span className="font-body font-bold text-xl text-navy">
                    ${projectValue[0].toLocaleString()}
                  </span>
                </div>
                <Slider
                  value={projectValue}
                  onValueChange={setProjectValue}
                  max={10000000}
                  min={500000}
                  step={250000}
                  className="w-full"
                />
                <div className="flex justify-between text-sm text-charcoal/60">
                  <span>$500K</span>
                  <span>$10M</span>
                </div>
              </div>

              {/* Risk Level Slider */}
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <label className="font-body font-semibold text-charcoal">
                    Risk Level
                  </label>
                  <span className="font-body font-bold text-maxx-red">
                    {riskLabels[riskLevel[0] - 1]}
                  </span>
                </div>
                <Slider
                  value={riskLevel}
                  onValueChange={setRiskLevel}
                  max={5}
                  min={1}
                  step={1}
                  className="w-full"
                />
                <div className="flex justify-between text-sm text-charcoal/60">
                  <span>Very Low</span>
                  <span>Very High</span>
                </div>
              </div>

              {/* Calculate Button */}
              <div className="text-center pt-4">
                <div className="flex gap-3 justify-center">
                  <Button 
                    onClick={() => setShowResults(true)}
                    variant="maxx-red" 
                    size="lg"
                    className="px-8 py-4 text-lg font-cta hover:scale-105 transition-all duration-300"
                  >
                    Calculate My Savings
                  </Button>
                  {showResults && (
                    <Button 
                      onClick={shareResults}
                      variant="outline" 
                      size="lg"
                      className="px-6 py-4"
                    >
                      <Share2 className="h-5 w-5 mr-2" />
                      Share
                    </Button>
                  )}
                </div>
              </div>

              {/* Results */}
              {showResults && (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-8 border-t border-charcoal/20 animate-fade-in">
                  <div className="text-center p-6 bg-maxx-red/10 rounded-lg border border-maxx-red/20">
                    <Shield className="w-8 h-8 text-maxx-red mx-auto mb-3" />
                    <div className="font-headline text-2xl font-bold text-maxx-red mb-2">
                      ${results.potentialLoss.toLocaleString()}
                    </div>
                    <div className="font-body text-sm text-charcoal/70">
                      Potential Risk Exposure
                    </div>
                  </div>

                  <div className="text-center p-6 bg-navy/10 rounded-lg border border-navy/20">
                    <DollarSign className="w-8 h-8 text-navy mx-auto mb-3" />
                    <div className="font-headline text-2xl font-bold text-navy mb-2">
                      ${results.studyCost.toLocaleString()}
                    </div>
                    <div className="font-body text-sm text-charcoal/70">
                      Feasibility Study Cost
                    </div>
                  </div>

                  <div className="text-center p-6 bg-green-500/10 rounded-lg border border-green-500/20">
                    <TrendingUp className="w-8 h-8 text-green-600 mx-auto mb-3" />
                    <div className="font-headline text-2xl font-bold text-green-600 mb-2">
                      ${results.netSavings.toLocaleString()}
                    </div>
                    <div className="font-body text-sm text-charcoal/70">
                      Potential Net Savings
                    </div>
                  </div>
                  </div>

                  {/* Chart Visualization */}
                  <div className="mt-8 space-y-6 animate-fade-in">
                    <h4 className="text-center font-headline text-xl mb-4 text-charcoal">
                      Cost-Benefit Visual Breakdown
                    </h4>
                    
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart
                        data={[
                          {
                            scenario: 'Without Study',
                            'Risk Exposure': results.potentialLoss,
                            'Study Cost': 0,
                          },
                          {
                            scenario: 'With Study',
                            'Risk Exposure': 0,
                            'Study Cost': results.studyCost,
                          }
                        ]}
                        margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                        <XAxis 
                          dataKey="scenario" 
                          tick={{ fill: '#0A0F2C', fontSize: 12 }}
                        />
                        <YAxis 
                          tick={{ fill: '#0A0F2C', fontSize: 12 }}
                          tickFormatter={(value) => `$${(value / 1000).toFixed(0)}K`}
                        />
                        <Tooltip
                          formatter={(value: number) => `$${value.toLocaleString()}`}
                          contentStyle={{ 
                            backgroundColor: 'rgba(255,255,255,0.95)', 
                            border: '1px solid #e5e7eb',
                            borderRadius: '8px',
                            padding: '12px'
                          }}
                        />
                        <Legend 
                          wrapperStyle={{ paddingTop: '20px' }}
                          iconType="square"
                        />
                        <Bar 
                          dataKey="Risk Exposure" 
                          stackId="a" 
                          fill="#EF4444" 
                          radius={[8, 8, 0, 0]}
                        />
                        <Bar 
                          dataKey="Study Cost" 
                          stackId="a" 
                          fill="#0A0F2C" 
                          radius={[8, 8, 0, 0]}
                        />
                      </BarChart>
                    </ResponsiveContainer>
                    
                    {/* Savings Highlight */}
                    <div className="relative p-6 bg-gradient-to-br from-green-50 to-green-100 border-2 border-green-300 rounded-2xl">
                      <div className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-green-600 text-white px-4 py-1 rounded-full text-xs font-bold">
                        YOUR NET SAVINGS
                      </div>
                      <div className="text-center pt-2">
                        <div className="text-5xl font-bold text-green-600 mb-3 flex items-center justify-center gap-2">
                          <TrendingUp className="h-10 w-10" />
                          ${results.netSavings.toLocaleString()}
                        </div>
                        <p className="text-sm text-green-800 font-medium">
                          That's a <span className="text-2xl font-bold">{results.roi}%</span> return on investment
                        </p>
                        <p className="text-xs text-green-700 mt-2">
                          Every $1 spent on feasibility saves you ${Math.round(results.roi/100)} in avoided risks
                        </p>
                      </div>
                    </div>
                  </div>
                </>
              )}

              {showResults && (
                <div className="text-center pt-6 animate-fade-in">
                  <div className="bg-gradient-to-r from-navy to-maxx-red text-white p-6 rounded-lg">
                    <div className="font-headline text-3xl font-bold mb-2">
                      {results.roi}% ROI
                    </div>
                    <p className="font-body text-white/90">
                      Every $1 spent on feasibility could save you ${Math.round(results.roi/100)} in avoided risks
                    </p>
                  </div>
                  <Button 
                    variant="maxx-red" 
                    size="lg"
                    className="mt-6 px-8 py-4 text-lg font-cta animate-pulse"
                    onClick={() => window.location.href = '/application?step=2'}
                  >
                    Start My Feasibility Review Now
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </section>
  );
};