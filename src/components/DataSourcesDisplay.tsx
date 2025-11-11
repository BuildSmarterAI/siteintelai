import { TrustBadgesGrid } from "./TrustBadgesGrid";
import { DataSourcesSidebar } from "./DataSourcesSidebar";

interface DataSource {
  dataset_name: string;
  timestamp: string;
  endpoint_url?: string;
  section: string;
}

interface DataSourcesDisplayProps {
  dataSources: DataSource[];
  accessLevel: 'public' | 'authenticated' | 'owner' | 'enterprise';
}

export const DataSourcesDisplay = ({ dataSources, accessLevel }: DataSourcesDisplayProps) => {
  switch (accessLevel) {
    case 'public':
    case 'authenticated':
    case 'owner':
      // Show trust badges only for all non-enterprise users
      return <TrustBadgesGrid />;
      
    case 'enterprise':
      // Full transparency with endpoints for enterprise tier only
      return <DataSourcesSidebar dataSources={dataSources} />;
      
    default:
      return <TrustBadgesGrid />;
  }
};
