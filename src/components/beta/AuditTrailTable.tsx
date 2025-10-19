import { ShieldCheck } from "lucide-react";
import { motion } from "framer-motion";

interface AuditSource {
  category: string;
  sourceType: string;
  timestamp: string;
}

interface AuditTrailTableProps {
  sources?: AuditSource[];
}

const defaultSources: AuditSource[] = [
  { category: "Zoning Data", sourceType: "Municipal GIS", timestamp: "2025-01-15T14:32:18Z" },
  { category: "Flood Zone", sourceType: "FEMA NFHL", timestamp: "2025-01-15T14:32:22Z" },
  { category: "Utility Access", sourceType: "State Infrastructure DB", timestamp: "2025-01-15T14:32:26Z" },
  { category: "Environmental", sourceType: "Federal Registry", timestamp: "2025-01-15T14:32:29Z" },
  { category: "Traffic Data", sourceType: "State DOT", timestamp: "2025-01-15T14:32:31Z" }
];

export const AuditTrailTable = ({ sources = defaultSources }: AuditTrailTableProps) => {
  return (
    <div className="overflow-hidden">
      <table className="w-full">
        <thead>
          <tr className="border-b border-border">
            <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide">
              Data Category
            </th>
            <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide">
              Source Type
            </th>
            <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide">
              Validated
            </th>
          </tr>
        </thead>
        <tbody>
          {sources.map((source, index) => (
            <motion.tr
              key={index}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
              className="border-b border-border/50 hover:bg-accent/5 transition-colors duration-150"
            >
              <td className="px-4 py-3 text-sm font-medium text-foreground flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-accent" aria-hidden="true" />
                {source.category}
              </td>
              <td className="px-4 py-3 text-sm text-muted-foreground">
                {source.sourceType}
              </td>
              <td className="px-4 py-3 text-sm font-mono text-muted-foreground">
                {new Date(source.timestamp).toLocaleString('en-US', {
                  month: 'short',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                })}
              </td>
            </motion.tr>
          ))}
        </tbody>
      </table>
      <div className="mt-4 flex items-center gap-2 text-xs text-muted-foreground italic">
        <ShieldCheck className="w-3 h-3" aria-hidden="true" />
        <span>All intelligence originates from verified public-record systems</span>
      </div>
    </div>
  );
};
