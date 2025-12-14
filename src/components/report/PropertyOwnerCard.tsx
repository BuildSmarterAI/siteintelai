import { motion } from "framer-motion";
import { User, Copy, Check, FileText, MapPin, ShieldCheck, Hash } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface PropertyOwnerCardProps {
  parcelOwner?: string | null;
  parcelId?: string | null;
  acctNum?: string | null;
  lotSize?: number | null;
  lotSizeUnit?: string | null;
  legalDescription?: string | null;
  agUse?: boolean | null;
  homestead?: boolean | null;
  subdivision?: string | null;
  block?: string | null;
  lot?: string | null;
  updatedAt?: string | null;
  className?: string;
}

export function PropertyOwnerCard({
  parcelOwner,
  parcelId,
  acctNum,
  lotSize,
  lotSizeUnit,
  legalDescription,
  agUse,
  homestead,
  subdivision,
  block,
  lot,
  updatedAt,
  className,
}: PropertyOwnerCardProps) {
  const [copiedField, setCopiedField] = useState<string | null>(null);

  const copyToClipboard = async (value: string, fieldName: string) => {
    try {
      await navigator.clipboard.writeText(value);
      setCopiedField(fieldName);
      toast.success(`${fieldName} copied to clipboard`);
      setTimeout(() => setCopiedField(null), 2000);
    } catch {
      toast.error("Failed to copy");
    }
  };

  const CopyButton = ({ value, fieldName }: { value: string; fieldName: string }) => (
    <Button
      variant="ghost"
      size="icon"
      className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
      onClick={() => copyToClipboard(value, fieldName)}
    >
      {copiedField === fieldName ? (
        <Check className="h-3 w-3 text-[hsl(var(--status-success))]" />
      ) : (
        <Copy className="h-3 w-3 text-muted-foreground" />
      )}
    </Button>
  );

  return (
    <Card className={cn("glass-card border-l-4 border-l-[hsl(var(--data-cyan))] overflow-hidden", className)}>
      <CardHeader className="bg-gradient-to-r from-[hsl(var(--midnight-blue)/0.03)] to-transparent">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5 text-[hsl(var(--data-cyan))]" />
            Property Owner & Account Information
          </CardTitle>
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.2 }}
          >
            <Badge variant="outline" className="bg-[hsl(var(--status-success)/0.1)] border-[hsl(var(--status-success))] text-[hsl(var(--status-success))]">
              <ShieldCheck className="h-3 w-3 mr-1" />
              HCAD VERIFIED
            </Badge>
          </motion.div>
        </div>
      </CardHeader>

      <CardContent className="pt-6 space-y-6">
        {/* Hero Owner Name */}
        {parcelOwner && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-4 bg-gradient-to-r from-[hsl(var(--muted)/0.5)] to-transparent rounded-lg border group"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-full bg-[hsl(var(--data-cyan)/0.1)] border border-[hsl(var(--data-cyan)/0.3)]">
                  <User className="h-5 w-5 text-[hsl(var(--data-cyan))]" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Property Owner</p>
                  <p className="font-semibold text-xl">{parcelOwner}</p>
                </div>
              </div>
              <CopyButton value={parcelOwner} fieldName="Owner Name" />
            </div>
          </motion.div>
        )}

        {/* Data Points Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {parcelId && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.1 }}
              className="p-3 bg-[hsl(var(--muted)/0.3)] rounded-lg border group flex items-center justify-between"
            >
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Parcel ID</p>
                <p className="font-mono font-semibold text-[hsl(var(--data-cyan))]">{parcelId}</p>
              </div>
              <CopyButton value={parcelId} fieldName="Parcel ID" />
            </motion.div>
          )}

          {acctNum && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.15 }}
              className="p-3 bg-[hsl(var(--muted)/0.3)] rounded-lg border group flex items-center justify-between"
            >
              <div className="flex items-center gap-2">
                <Hash className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Account Number</p>
                  <p className="font-mono font-semibold">{acctNum}</p>
                </div>
              </div>
              <CopyButton value={acctNum} fieldName="Account Number" />
            </motion.div>
          )}

          {lotSize && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="p-3 bg-[hsl(var(--muted)/0.3)] rounded-lg border"
            >
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Lot Size</p>
                  <p className="font-semibold text-lg">
                    <span className="font-mono">{lotSize.toLocaleString()}</span>{" "}
                    <span className="text-sm text-muted-foreground">{lotSizeUnit || "acres"}</span>
                  </p>
                </div>
              </div>
            </motion.div>
          )}

          {subdivision && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.25 }}
              className="p-3 bg-[hsl(var(--muted)/0.3)] rounded-lg border"
            >
              <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Subdivision</p>
              <p className="font-semibold">{subdivision}</p>
            </motion.div>
          )}

          {block && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="p-3 bg-[hsl(var(--muted)/0.3)] rounded-lg border"
            >
              <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Block</p>
              <p className="font-mono font-semibold">{block}</p>
            </motion.div>
          )}

          {lot && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.35 }}
              className="p-3 bg-[hsl(var(--muted)/0.3)] rounded-lg border"
            >
              <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Lot</p>
              <p className="font-mono font-semibold">{lot}</p>
            </motion.div>
          )}
        </div>

        {/* Legal Description Callout */}
        {legalDescription && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="p-4 bg-[hsl(var(--muted)/0.2)] rounded-lg border-2 border-dashed border-[hsl(var(--border))]"
          >
            <div className="flex items-center gap-2 mb-2">
              <FileText className="h-4 w-4 text-muted-foreground" />
              <p className="text-xs text-muted-foreground uppercase tracking-wider">Legal Description</p>
              <Badge variant="outline" className="text-[10px]">Official Record</Badge>
            </div>
            <p className="text-sm leading-relaxed text-muted-foreground">{legalDescription}</p>
          </motion.div>
        )}

        {/* Tax Exemptions */}
        {(agUse || homestead) && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="flex flex-wrap gap-2"
          >
            <p className="text-xs text-muted-foreground uppercase tracking-wider w-full mb-2">Tax Exemptions</p>
            {agUse && (
              <Badge className="bg-[hsl(var(--status-success)/0.1)] text-[hsl(var(--status-success))] border border-[hsl(var(--status-success)/0.3)]">
                🌾 Agricultural Use Exemption
              </Badge>
            )}
            {homestead && (
              <Badge className="bg-[hsl(var(--data-cyan)/0.1)] text-[hsl(var(--data-cyan))] border border-[hsl(var(--data-cyan)/0.3)]">
                🏠 Homestead Exemption
              </Badge>
            )}
          </motion.div>
        )}

        {/* Source Attribution Footer */}
        {updatedAt && (
          <div className="pt-4 border-t flex items-center justify-between text-xs text-muted-foreground">
            <span>Source: Harris County Appraisal District (HCAD)</span>
            <span>Updated: {new Date(updatedAt).toLocaleDateString()}</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
