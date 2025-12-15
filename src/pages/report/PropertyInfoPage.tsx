import { useReportContext } from "@/contexts/ReportContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MapPin, Copy, Building2, DollarSign, FileText, Home } from "lucide-react";
import { toast } from "sonner";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";

export default function PropertyInfoPage() {
  const { report } = useReportContext();

  if (!report) return null;

  const app = report.applications;
  
  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`${label} copied to clipboard`);
  };

  const formatCurrency = (value: number | null | undefined) => {
    if (value == null) return "—";
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(value);
  };

  const formatNumber = (value: number | null | undefined, decimals = 2) => {
    if (value == null) return "—";
    return value.toLocaleString('en-US', { maximumFractionDigits: decimals });
  };

  // Valuation data for pie chart
  const valuationData = [
    { name: 'Land Value', value: app?.land_val || 0, color: 'hsl(var(--feasibility-orange))' },
    { name: 'Improvement Value', value: app?.imprv_val || 0, color: 'hsl(var(--data-cyan))' },
  ].filter(d => d.value > 0);

  return (
    <div className="space-y-6" id="section-property">
      {/* Property Overview Hero */}
      <Card className="bg-[hsl(var(--midnight-blue)/0.3)] border-white/10">
        <CardHeader className="pb-4">
          <div className="flex items-start justify-between">
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-lg bg-[hsl(var(--feasibility-orange)/0.2)]">
                <MapPin className="h-6 w-6 text-[hsl(var(--feasibility-orange))]" />
              </div>
              <div>
              <CardTitle className="text-xl text-white">
                {app?.formatted_address || "Property Address"}
              </CardTitle>
              <p className="text-white/60 text-sm mt-1">
                {app?.city}, {app?.county} County, TX
              </p>
              </div>
            </div>
            <Badge variant="outline" className="border-[hsl(var(--data-cyan))] text-[hsl(var(--data-cyan))]">
              {app?.county || "Harris"} County
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {/* Parcel ID */}
            <div className="bg-white/5 rounded-lg p-3">
              <p className="text-white/50 text-xs uppercase tracking-wide mb-1">Parcel ID</p>
              <div className="flex items-center gap-2">
                <span className="text-white font-mono text-sm truncate">
                  {app?.parcel_id || "—"}
                </span>
                {app?.parcel_id && (
                  <button 
                    onClick={() => copyToClipboard(app.parcel_id!, "Parcel ID")}
                    className="text-white/40 hover:text-white transition-colors"
                  >
                    <Copy className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>
            </div>

            {/* Account Number */}
            <div className="bg-white/5 rounded-lg p-3">
              <p className="text-white/50 text-xs uppercase tracking-wide mb-1">Account #</p>
              <div className="flex items-center gap-2">
                <span className="text-white font-mono text-sm truncate">
                  {app?.acct_num || "—"}
                </span>
                {app?.acct_num && (
                  <button 
                    onClick={() => copyToClipboard(app.acct_num!, "Account Number")}
                    className="text-white/40 hover:text-white transition-colors"
                  >
                    <Copy className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>
            </div>

            {/* Coordinates */}
            <div className="bg-white/5 rounded-lg p-3">
              <p className="text-white/50 text-xs uppercase tracking-wide mb-1">Coordinates</p>
              <span className="text-white font-mono text-sm">
                {app?.geo_lat?.toFixed(4)}, {app?.geo_lng?.toFixed(4)}
              </span>
            </div>

            {/* Lot Size */}
            <div className="bg-white/5 rounded-lg p-3">
              <p className="text-white/50 text-xs uppercase tracking-wide mb-1">Lot Size</p>
              <span className="text-white text-sm font-medium">
                {app?.acreage_cad 
                  ? `${formatNumber(app.acreage_cad)} acres`
                  : app?.lot_size_value 
                    ? `${formatNumber(app.lot_size_value)} ${app.lot_size_unit || 'sqft'}`
                    : "—"
                }
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Property Details Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Property Classification */}
        <Card className="bg-[hsl(var(--midnight-blue)/0.3)] border-white/10">
          <CardHeader className="pb-3">
            <CardTitle className="text-base text-white flex items-center gap-2">
              <Building2 className="h-4 w-4 text-[hsl(var(--data-cyan))]" />
              Property Classification
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between items-center py-2 border-b border-white/5">
              <span className="text-white/60 text-sm">Property Type</span>
              <span className="text-white text-sm font-medium">{app?.prop_type || "—"}</span>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-white/5">
              <span className="text-white/60 text-sm">State Class</span>
              <span className="text-white text-sm font-medium">{app?.state_class || "—"}</span>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-white/5">
              <span className="text-white/60 text-sm">Land Use Code</span>
              <span className="text-white text-sm font-mono">{app?.land_use_code || "—"}</span>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-white/5">
              <span className="text-white/60 text-sm">Zoning Code</span>
              <Badge variant="outline" className="text-[hsl(var(--feasibility-orange))] border-[hsl(var(--feasibility-orange))]">
                {app?.zoning_code || "—"}
              </Badge>
            </div>
            <div className="flex justify-between items-center py-2">
              <span className="text-white/60 text-sm">Neighborhood</span>
              <span className="text-white text-sm">{app?.neighborhood || app?.submarket_enriched || "—"}</span>
            </div>
          </CardContent>
        </Card>

        {/* Valuation */}
        <Card className="bg-[hsl(var(--midnight-blue)/0.3)] border-white/10">
          <CardHeader className="pb-3">
            <CardTitle className="text-base text-white flex items-center gap-2">
              <DollarSign className="h-4 w-4 text-[hsl(var(--feasibility-orange))]" />
              Valuation
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-4">
              {/* Pie Chart */}
              {valuationData.length > 0 && (
                <div className="w-24 h-24 shrink-0">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={valuationData}
                        cx="50%"
                        cy="50%"
                        innerRadius={20}
                        outerRadius={40}
                        paddingAngle={2}
                        dataKey="value"
                      >
                        {valuationData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip 
                        formatter={(value: number) => formatCurrency(value)}
                        contentStyle={{ 
                          backgroundColor: 'hsl(var(--midnight-blue))', 
                          border: '1px solid rgba(255,255,255,0.1)',
                          borderRadius: '8px'
                        }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              )}
              
              {/* Values */}
              <div className="flex-1 space-y-2">
                <div className="flex justify-between items-center py-2 border-b border-white/5">
                  <span className="text-white/60 text-sm">Total Market Value</span>
                  <span className="text-white text-sm font-semibold">{formatCurrency(app?.tot_market_val)}</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-white/5">
                  <span className="text-white/60 text-sm">Appraised Value</span>
                  <span className="text-white text-sm">{formatCurrency(app?.tot_appr_val)}</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-white/5">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-[hsl(var(--feasibility-orange))]" />
                    <span className="text-white/60 text-sm">Land Value</span>
                  </div>
                  <span className="text-white text-sm">{formatCurrency(app?.land_val)}</span>
                </div>
                <div className="flex justify-between items-center py-2">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-[hsl(var(--data-cyan))]" />
                    <span className="text-white/60 text-sm">Improvement Value</span>
                  </div>
                  <span className="text-white text-sm">{formatCurrency(app?.imprv_val)}</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Legal & Tax Info */}
        <Card className="bg-[hsl(var(--midnight-blue)/0.3)] border-white/10">
          <CardHeader className="pb-3">
            <CardTitle className="text-base text-white flex items-center gap-2">
              <FileText className="h-4 w-4 text-[hsl(var(--data-cyan))]" />
              Legal & Tax Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="py-2 border-b border-white/5">
              <span className="text-white/60 text-xs uppercase tracking-wide">Legal Description</span>
              <p className="text-white text-sm mt-1 font-mono leading-relaxed">
                {app?.legal_dscr_1 || "—"}
              </p>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-white/5">
              <span className="text-white/60 text-sm">Subdivision</span>
              <span className="text-white text-sm">{app?.subdivision || "—"}</span>
            </div>
            <div className="grid grid-cols-2 gap-4 py-2 border-b border-white/5">
              <div>
                <span className="text-white/60 text-sm block">Block</span>
                <span className="text-white text-sm font-mono">{app?.block || "—"}</span>
              </div>
              <div>
                <span className="text-white/60 text-sm block">Lot</span>
                <span className="text-white text-sm font-mono">{app?.lot || "—"}</span>
              </div>
            </div>
            <div className="flex gap-3 pt-2">
              <Badge variant={app?.ag_use ? "default" : "outline"} className={app?.ag_use ? "bg-green-600/20 text-green-400 border-green-500/30" : "text-white/40 border-white/20"}>
                {app?.ag_use ? "Ag Use" : "No Ag Use"}
              </Badge>
              <Badge variant={app?.homestead ? "default" : "outline"} className={app?.homestead ? "bg-blue-600/20 text-blue-400 border-blue-500/30" : "text-white/40 border-white/20"}>
                {app?.homestead ? "Homestead" : "No Homestead"}
              </Badge>
            </div>
          </CardContent>
        </Card>

        {/* Building Characteristics */}
        <Card className="bg-[hsl(var(--midnight-blue)/0.3)] border-white/10">
          <CardHeader className="pb-3">
            <CardTitle className="text-base text-white flex items-center gap-2">
              <Home className="h-4 w-4 text-[hsl(var(--feasibility-orange))]" />
              Building Characteristics
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between items-center py-2 border-b border-white/5">
              <span className="text-white/60 text-sm">Year Built</span>
              <span className="text-white text-sm font-medium">{app?.year_built || "—"}</span>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-white/5">
              <span className="text-white/60 text-sm">Building Size</span>
              <span className="text-white text-sm font-medium">
                {app?.bldg_sqft ? `${formatNumber(app.bldg_sqft, 0)} sqft` : "—"}
              </span>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-white/5">
              <span className="text-white/60 text-sm">Stories</span>
              <span className="text-white text-sm font-medium">{app?.num_stories || "—"}</span>
            </div>
            <div className="flex justify-between items-center py-2">
              <span className="text-white/60 text-sm">Owner</span>
              <span className="text-white text-sm truncate max-w-[200px]">{app?.parcel_owner || "—"}</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Source Attribution */}
      <div className="flex items-center justify-end gap-2 text-white/40 text-xs">
        <span>Source:</span>
        <Badge variant="outline" className="text-[hsl(var(--data-cyan))] border-[hsl(var(--data-cyan))/0.3] text-xs">
          {app?.county || "Harris"} CAD Verified
        </Badge>
      </div>
    </div>
  );
}
