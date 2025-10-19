import { Button } from "@/components/ui/button";
import { FileText, Code, Database, Download } from "lucide-react";
import { motion } from "framer-motion";

interface ExportFormat {
  id: string;
  label: string;
  icon: React.ElementType;
  color: string;
  size: string;
  description: string;
}

const formats: ExportFormat[] = [
  {
    id: "pdf",
    label: "PDF Report",
    icon: FileText,
    color: "text-red-500",
    size: "2.4 MB",
    description: "Lender-Ready Report"
  },
  {
    id: "json",
    label: "JSON Data",
    icon: Code,
    color: "text-purple-500",
    size: "156 KB",
    description: "Raw Data Export"
  },
  {
    id: "odata",
    label: "OData Query",
    icon: Database,
    color: "text-blue-500",
    size: "API",
    description: "Enterprise Query"
  },
  {
    id: "csv",
    label: "CSV Extract",
    icon: Download,
    color: "text-green-500",
    size: "89 KB",
    description: "Spreadsheet Format"
  }
];

export const ExportButtonGrid = () => {
  return (
    <div className="grid grid-cols-2 gap-4 p-4">
      {formats.map((format, index) => {
        const Icon = format.icon;
        return (
          <motion.div
            key={format.id}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: index * 0.1 }}
          >
            <Button
              variant="outline"
              className="w-full h-auto flex-col items-start p-4 gap-2 hover:border-primary/50 hover:bg-accent/5 transition-all duration-200"
            >
              <div className="flex items-center gap-2 w-full">
                <Icon className={`w-5 h-5 ${format.color}`} />
                <span className="font-semibold text-sm">{format.label}</span>
              </div>
              <div className="text-xs text-muted-foreground text-left w-full">
                {format.description}
              </div>
              <div className="text-xs font-mono text-muted-foreground/60">
                {format.size}
              </div>
            </Button>
          </motion.div>
        );
      })}
    </div>
  );
};
