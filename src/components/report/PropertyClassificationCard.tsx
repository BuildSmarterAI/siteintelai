import { motion } from "framer-motion";
import { Tag, Building2, Info, HelpCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import {
  getStateClassDescription,
  getStateClassInfo,
  getLandUseDescription,
  getLandUseInfo,
  getCategoryColorClasses,
  getDevelopmentImplications,
} from "@/lib/propertyClassification";

interface PropertyClassificationCardProps {
  stateClass?: string | null;
  landUseCode?: string | null;
  propType?: string | null;
  className?: string;
}

export function PropertyClassificationCard({
  stateClass,
  landUseCode,
  propType,
  className,
}: PropertyClassificationCardProps) {
  const stateClassInfo = getStateClassInfo(stateClass);
  const landUseInfo = getLandUseInfo(landUseCode);
  const categoryColors = stateClassInfo ? getCategoryColorClasses(stateClassInfo.category) : null;
  const implications = stateClassInfo ? getDevelopmentImplications(stateClassInfo.category) : null;

  if (!stateClass && !landUseCode) return null;

  return (
    <Card className={cn("glass-card border-l-4 border-l-[hsl(var(--data-cyan))] overflow-hidden", className)}>
      <CardHeader className="bg-gradient-to-r from-[hsl(var(--data-cyan)/0.05)] to-transparent">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Tag className="h-5 w-5 text-[hsl(var(--data-cyan))]" />
            Property Classification
          </CardTitle>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger>
                <HelpCircle className="h-4 w-4 text-muted-foreground" />
              </TooltipTrigger>
              <TooltipContent side="left" className="max-w-xs">
                <p className="text-sm">
                  Property classifications determine tax treatment and permitted uses. 
                  State Class codes follow Texas Comptroller standards. 
                  Land Use codes are assigned by the local appraisal district.
                </p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      </CardHeader>

      <CardContent className="pt-6 space-y-6">
        {/* State Class Section */}
        {stateClass && stateClassInfo && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-3"
          >
            <div className="flex items-start gap-4">
              {/* Large Category Badge */}
              <div className={cn(
                "flex-shrink-0 px-4 py-3 rounded-lg border",
                categoryColors?.bg,
                categoryColors?.border
              )}>
                <p className={cn("text-2xl font-bold font-mono", categoryColors?.text)}>
                  {stateClass}
                </p>
                <p className={cn("text-xs uppercase tracking-wider mt-1", categoryColors?.text)}>
                  {stateClassInfo.category}
                </p>
              </div>

              {/* Description */}
              <div className="flex-1 space-y-2">
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wider">State Classification</p>
                  <p className="text-lg font-semibold">{stateClassInfo.description}</p>
                </div>
                
                {/* Development Implications */}
                <div className="p-3 bg-[hsl(var(--muted)/0.3)] rounded-md border">
                  <div className="flex items-start gap-2">
                    <Info className="h-4 w-4 text-muted-foreground flex-shrink-0 mt-0.5" />
                    <p className="text-sm text-muted-foreground">
                      {implications}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* Divider */}
        {stateClass && landUseCode && (
          <div className="border-t border-border/50" />
        )}

        {/* Land Use Code Section */}
        {landUseCode && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="space-y-3"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wider">Land Use Code</p>
                <div className="flex items-center gap-3 mt-1">
                  <Badge variant="outline" className="font-mono text-base px-3 py-1">
                    {landUseCode}
                  </Badge>
                  <p className="text-lg font-semibold">
                    {getLandUseDescription(landUseCode)}
                  </p>
                </div>
              </div>
              {landUseInfo?.category && (
                <Badge variant="secondary" className="text-xs">
                  {landUseInfo.category}
                </Badge>
              )}
            </div>
          </motion.div>
        )}

        {/* Property Type if Different */}
        {propType && propType !== stateClassInfo?.description && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="pt-4 border-t border-border/50"
          >
            <div className="flex items-center gap-2">
              <Building2 className="h-4 w-4 text-muted-foreground" />
              <p className="text-xs text-muted-foreground uppercase tracking-wider">Property Type</p>
            </div>
            <p className="text-base font-medium mt-1">{propType}</p>
          </motion.div>
        )}

        {/* Classification Legend (collapsed by default, could expand on click) */}
        <div className="pt-4 border-t border-border/50">
          <p className="text-xs text-muted-foreground">
            Classifications sourced from Texas Property Tax Code. State class codes determine tax category; 
            land use codes indicate specific property use per the appraisal district.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
