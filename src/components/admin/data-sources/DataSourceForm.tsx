import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DataSourceFormData } from '@/hooks/useDataSources';
import { ReliabilityBadge } from './ReliabilityBadge';

const formSchema = z.object({
  server_key: z.string().min(1, 'Server key is required').regex(/^[a-z0-9_]+$/, 'Use lowercase letters, numbers, and underscores only'),
  provider: z.string().min(1, 'Provider name is required'),
  base_url: z.string().url('Must be a valid URL'),
  service_type: z.string().min(1, 'Source type is required'),
  jurisdiction: z.string().min(1, 'Jurisdiction is required'),
  is_active: z.boolean(),
  dataset_family: z.string().nullable(),
  agency: z.string().nullable(),
  update_frequency: z.string().nullable(),
  accuracy_tier: z.string().nullable(),
  reliability_score: z.number().min(0).max(100).nullable(),
  notes: z.string().nullable(),
});

interface DataSourceFormProps {
  defaultValues?: Partial<DataSourceFormData>;
  onSubmit: (data: DataSourceFormData) => void;
  isSubmitting: boolean;
  submitLabel?: string;
}

const sourceTypes = [
  'mapserver',
  'featureserver',
  'wmts',
  'wms',
  'wfs',
  'geojson',
  'tile',
  'raster',
];

const datasetFamilies = [
  'parcels',
  'zoning',
  'flood',
  'wetlands',
  'utilities',
  'traffic',
  'topo',
  'environmental',
  'other',
];

const updateFrequencies = [
  'continuous',
  'daily',
  'weekly',
  'monthly',
  'quarterly',
  'annually',
  'unknown',
];

const accuracyTiers = ['T1', 'T2', 'T3'];

export function DataSourceForm({
  defaultValues,
  onSubmit,
  isSubmitting,
  submitLabel = 'Save',
}: DataSourceFormProps) {
  const form = useForm<DataSourceFormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      server_key: defaultValues?.server_key || '',
      provider: defaultValues?.provider || '',
      base_url: defaultValues?.base_url || '',
      service_type: defaultValues?.service_type || 'mapserver',
      jurisdiction: defaultValues?.jurisdiction || '',
      is_active: defaultValues?.is_active ?? true,
      dataset_family: defaultValues?.dataset_family ?? null,
      agency: defaultValues?.agency ?? null,
      update_frequency: defaultValues?.update_frequency ?? null,
      accuracy_tier: defaultValues?.accuracy_tier ?? null,
      reliability_score: defaultValues?.reliability_score ?? 80,
      notes: defaultValues?.notes ?? null,
    },
  });

  const reliabilityScore = form.watch('reliability_score');

  const handleFormSubmit = (data: DataSourceFormData) => {
    onSubmit(data);
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleFormSubmit)} className="space-y-6">
        <div className="grid gap-6 md:grid-cols-2">
          {/* Basic Information */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Basic Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <FormField
                control={form.control}
                name="provider"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Provider / Display Name</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="Houston Water Lines" 
                        {...field} 
                        value={field.value || ''} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="server_key"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Server Key</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="houston_water_lines"
                        className="font-mono"
                        {...field}
                        value={field.value || ''}
                      />
                    </FormControl>
                    <FormDescription>
                      Unique identifier (lowercase, underscores)
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="base_url"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Base URL</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="https://example.com/arcgis/rest/services/..."
                        className="font-mono text-sm"
                        {...field}
                        value={field.value || ''}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="service_type"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Source Type</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value || 'mapserver'}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {sourceTypes.map((type) => (
                            <SelectItem key={type} value={type}>
                              {type}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="jurisdiction"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Jurisdiction</FormLabel>
                      <FormControl>
                        <Input placeholder="Houston" {...field} value={field.value || ''} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="is_active"
                render={({ field }) => (
                  <FormItem className="flex items-center justify-between rounded-lg border p-3">
                    <div className="space-y-0.5">
                      <FormLabel>Active</FormLabel>
                      <FormDescription>
                        Enable ETL and queries for this source
                      </FormDescription>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          {/* Classification & Quality */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Classification & Quality</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <FormField
                control={form.control}
                name="agency"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Agency</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Houston Public Works"
                        {...field}
                        value={field.value || ''}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="dataset_family"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Dataset Family</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value || undefined}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select..." />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {datasetFamilies.map((family) => (
                            <SelectItem key={family} value={family}>
                              {family.charAt(0).toUpperCase() + family.slice(1)}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="accuracy_tier"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Accuracy Tier</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value || undefined}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select..." />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {accuracyTiers.map((tier) => (
                            <SelectItem key={tier} value={tier}>
                              {tier} - {tier === 'T1' ? 'Regulatory' : tier === 'T2' ? 'Advisory' : 'Approximate'}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="update_frequency"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Update Frequency</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value || undefined}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select..." />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {updateFrequencies.map((freq) => (
                          <SelectItem key={freq} value={freq}>
                            {freq.charAt(0).toUpperCase() + freq.slice(1)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="reliability_score"
                render={({ field }) => (
                  <FormItem>
                    <div className="flex items-center justify-between">
                      <FormLabel>Reliability Score</FormLabel>
                      <ReliabilityBadge score={reliabilityScore} />
                    </div>
                    <FormControl>
                      <Slider
                        min={0}
                        max={100}
                        step={5}
                        value={[field.value || 80]}
                        onValueChange={([value]) => field.onChange(value)}
                        className="py-2"
                      />
                    </FormControl>
                    <FormDescription>
                      0-100 scale based on uptime and data quality
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="notes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Notes</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Additional information about this source..."
                        className="resize-none"
                        rows={3}
                        {...field}
                        value={field.value || ''}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>
        </div>

        <div className="flex justify-end gap-3">
          <Button type="button" variant="outline" onClick={() => window.history.back()}>
            Cancel
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Saving...' : submitLabel}
          </Button>
        </div>
      </form>
    </Form>
  );
}
