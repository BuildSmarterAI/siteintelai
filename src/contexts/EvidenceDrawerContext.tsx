import { createContext, useContext, useState, useCallback, ReactNode } from "react";
import { EvidenceDrawerState, EvidenceData, EvidenceDomain, calculateFreshness, DATA_SOURCES, SourceMetadata } from "@/types/evidence";

interface EvidenceDrawerContextValue extends EvidenceDrawerState {
  openDrawer: (data: EvidenceData) => void;
  closeDrawer: () => void;
  setActiveTab: (tab: EvidenceDrawerState['activeTab']) => void;
  openForDomain: (params: {
    domain: EvidenceDomain;
    title: string;
    rawData: Record<string, unknown>;
    timestamp?: string;
    pdfUrl?: string;
    reliabilityScore?: number;
  }) => void;
}

const EvidenceDrawerContext = createContext<EvidenceDrawerContextValue | null>(null);

export function EvidenceDrawerProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<EvidenceDrawerState>({
    isOpen: false,
    activeTab: 'evidence',
    data: null,
  });

  const openDrawer = useCallback((data: EvidenceData) => {
    setState({
      isOpen: true,
      activeTab: 'evidence',
      data,
    });
  }, []);

  const closeDrawer = useCallback(() => {
    setState(prev => ({
      ...prev,
      isOpen: false,
    }));
  }, []);

  const setActiveTab = useCallback((tab: EvidenceDrawerState['activeTab']) => {
    setState(prev => ({
      ...prev,
      activeTab: tab,
    }));
  }, []);

  // Helper to quickly open drawer for a domain with minimal config
  const openForDomain = useCallback(({ 
    domain, 
    title, 
    rawData, 
    timestamp,
    pdfUrl,
    reliabilityScore = 85,
  }: {
    domain: EvidenceDomain;
    title: string;
    rawData: Record<string, unknown>;
    timestamp?: string;
    pdfUrl?: string;
    reliabilityScore?: number;
  }) => {
    const now = new Date().toISOString();
    const dataTimestamp = timestamp || now;
    const { days, status } = calculateFreshness(dataTimestamp);
    const sourceConfig = DATA_SOURCES[domain];

    const sourceMetadata: SourceMetadata = {
      ...sourceConfig,
      timestamp: dataTimestamp,
      freshnessDays: days,
      freshnessStatus: status,
      reliabilityScore,
      retrievalMethod: 'cached',
    };

    const evidenceData: EvidenceData = {
      domain,
      title,
      sourceMetadata,
      rawData,
      pdfUrl,
    };

    openDrawer(evidenceData);
  }, [openDrawer]);

  return (
    <EvidenceDrawerContext.Provider 
      value={{ 
        ...state, 
        openDrawer, 
        closeDrawer, 
        setActiveTab,
        openForDomain,
      }}
    >
      {children}
    </EvidenceDrawerContext.Provider>
  );
}

export function useEvidenceDrawer() {
  const context = useContext(EvidenceDrawerContext);
  if (!context) {
    throw new Error("useEvidenceDrawer must be used within an EvidenceDrawerProvider");
  }
  return context;
}
