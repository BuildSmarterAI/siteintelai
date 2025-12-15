import { createContext, useContext } from "react";
import { UseReportDataReturn } from "@/hooks/useReportData";

const ReportContext = createContext<UseReportDataReturn | null>(null);

export function ReportContextProvider({ 
  children, 
  value 
}: { 
  children: React.ReactNode;
  value: UseReportDataReturn;
}) {
  return (
    <ReportContext.Provider value={value}>
      {children}
    </ReportContext.Provider>
  );
}

export function useReportContext() {
  const context = useContext(ReportContext);
  if (!context) {
    throw new Error("useReportContext must be used within a ReportContextProvider");
  }
  return context;
}
