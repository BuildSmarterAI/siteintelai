import { TrustBadgesGrid } from "./TrustBadgesGrid";
import { SimplifiedSourcesList } from "./SimplifiedSourcesList";
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
      // Show trust badges only for unauthenticated or non-owners
      return <TrustBadgesGrid />;
      
    case 'owner':
      // Show dataset names + timestamps (day-level) for report owners
      return <SimplifiedSourcesList dataSources={dataSources} />;
      
    case 'enterprise':
      // Full transparency with endpoints for enterprise tier
      return <DataSourcesSidebar dataSources={dataSources} />;
      
    default:
      return <TrustBadgesGrid />;
  }
};
