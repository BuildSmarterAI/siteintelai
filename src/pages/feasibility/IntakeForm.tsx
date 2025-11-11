import { useState } from "react";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, Loader2 } from "lucide-react";
import { IntentBadge } from "@/components/IntentBadge";
import { useToast } from "@/hooks/use-toast";

// Dynamic schema based on intent
const buildSchema = z.object({
  projectName: z.string().min(1, "Project name is required"),
  notes: z.string().max(2000).optional(),
  projectType: z.string().optional(),
  schedule: z.string().optional(),
});

const dealSchema = z.object({
  projectName: z.string().min(1, "Project name is required"),
  notes: z.string().max(2000).optional(),
  askingPrice: z.string().optional(),
  roiTarget: z.string().optional(),
  holdYears: z.string().optional(),
});

const capacitySchema = z.object({
  projectName: z.string().min(1, "Project name is required"),
  notes: z.string().max(2000).optional(),
  far: z.string().optional(),
  maxHeight: z.string().optional(),
  setbacks: z.string().optional(),
});

export default function IntakeForm() {
  const navigate = useNavigate();
  const location = useLocation();
  const { intent } = useParams<{ intent: 'build' | 'deal' | 'capacity' }>();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const { geometry, method } = location.state || {};

  if (!geometry || !intent) {
    navigate('/feasibility/start');
    return null;
  }

  // Select schema based on intent
  const getSchema = () => {
    switch (intent) {
      case 'build': return buildSchema;
      case 'deal': return dealSchema;
      case 'capacity': return capacitySchema;
      default: return buildSchema;
    }
  };

  const form = useForm<z.infer<typeof buildSchema> | z.infer<typeof dealSchema> | z.infer<typeof capacitySchema>>({
    resolver: zodResolver(getSchema()),
    defaultValues: {
      projectName: '',
      notes: '',
      ...(intent === 'build' && { projectType: '', schedule: '' }),
      ...(intent === 'deal' && { askingPrice: '', roiTarget: '', holdYears: '' }),
      ...(intent === 'capacity' && { far: '', maxHeight: '', setbacks: '' }),
    } as any,
  });

  const onSubmit = async (data: any) => {
    setIsSubmitting(true);
    try {
      // TODO: Call supabase.functions.invoke('orchestrate-application', ...)
      toast({
        title: "Analysis Started",
        description: "Your feasibility report is being generated.",
      });
      
      // Navigate to progress/dashboard
      setTimeout(() => {
        navigate('/dashboard');
      }, 1000);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to start analysis. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background pt-24 pb-16">
      <div className="container mx-auto px-4">
        <div className="max-w-3xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <Button
              variant="ghost"
              onClick={() => navigate('/feasibility/type', { state: { geometry, method } })}
              className="mb-4"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
            
            <div className="flex items-center gap-3 mb-3">
              <h1 className="text-4xl font-headline font-bold text-foreground">
                {intent === 'build' && 'Build Feasibility'}
                {intent === 'deal' && 'Deal Check'}
                {intent === 'capacity' && 'Capacity Analysis'}
              </h1>
              <IntentBadge intentType={intent === 'build' || intent === 'deal' || intent === 'capacity' ? 'build' : 'buy'} />
            </div>
            <p className="text-lg text-muted-foreground">
              Provide additional details for your analysis
            </p>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Project Details</CardTitle>
              <CardDescription>
                Help us understand your project to provide more accurate insights
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                  <FormField
                    control={form.control}
                    name="projectName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Project Name *</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g., Downtown Mixed-Use Development" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Intent-specific fields */}
                  {intent === 'build' && (
                    <>
                      <FormField
                        control={form.control}
                        name={"projectType" as any}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Project Type</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select type" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="retail">Retail</SelectItem>
                                <SelectItem value="office">Office</SelectItem>
                                <SelectItem value="industrial">Industrial</SelectItem>
                                <SelectItem value="multifamily">Multifamily</SelectItem>
                                <SelectItem value="mixed-use">Mixed-Use</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={form.control}
                        name={"schedule" as any}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Development Timeline</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select timeline" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="0-6m">0-6 months</SelectItem>
                                <SelectItem value="6-12m">6-12 months</SelectItem>
                                <SelectItem value="12-24m">12-24 months</SelectItem>
                                <SelectItem value="24m+">24+ months</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </>
                  )}

                  {intent === 'deal' && (
                    <>
                      <FormField
                        control={form.control}
                        name={"askingPrice" as any}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Asking Price</FormLabel>
                            <FormControl>
                              <Input type="number" placeholder="e.g., 2500000" {...field} />
                            </FormControl>
                            <FormDescription>Enter amount in USD</FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={form.control}
                        name={"roiTarget" as any}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Target ROI (%)</FormLabel>
                            <FormControl>
                              <Input type="number" placeholder="e.g., 15" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </>
                  )}

                  {intent === 'capacity' && (
                    <>
                      <FormField
                        control={form.control}
                        name={"far" as any}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Floor Area Ratio (FAR)</FormLabel>
                            <FormControl>
                              <Input placeholder="e.g., 2.5" {...field} />
                            </FormControl>
                            <FormDescription>Leave blank to auto-calculate from zoning</FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={form.control}
                        name={"maxHeight" as any}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Max Building Height (ft)</FormLabel>
                            <FormControl>
                              <Input type="number" placeholder="e.g., 85" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </>
                  )}

                  <FormField
                    control={form.control}
                    name="notes"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Additional Notes</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Any specific requirements, concerns, or questions..."
                            className="min-h-[100px]"
                            {...field}
                          />
                        </FormControl>
                        <FormDescription>Optional: Up to 2000 characters</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="flex gap-3 pt-4">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => navigate('/feasibility/type', { state: { geometry, method } })}
                      disabled={isSubmitting}
                    >
                      <ArrowLeft className="w-4 h-4 mr-2" />
                      Back
                    </Button>
                    
                    <Button type="submit" className="flex-1" disabled={isSubmitting}>
                      {isSubmitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                      {isSubmitting ? 'Starting Analysis...' : 'Start Feasibility Analysis'}
                    </Button>
                  </div>
                </form>
              </Form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
