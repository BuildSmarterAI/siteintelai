import { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

interface MapCanvasProps {
  center: [number, number];
  zoom?: number;
  parcel?: any;
  floodZones?: any[];
  utilities?: any[];
  traffic?: any[];
  className?: string;
}

export function MapCanvas({ 
  center, 
  zoom = 15, 
  parcel, 
  floodZones = [],
  utilities = [],
  traffic = [],
  className = "h-96 w-full rounded-lg"
}: MapCanvasProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);

  useEffect(() => {
    if (!mapContainer.current || mapRef.current) return;

    // Initialize map
    const map = L.map(mapContainer.current).setView(center, zoom);
    mapRef.current = map;

    // Add tile layer
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors',
      maxZoom: 19
    }).addTo(map);

    // Add center marker
    L.marker(center).addTo(map)
      .bindPopup('Property Location')
      .openPopup();

    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    if (!mapRef.current) return;

    // Update map center when coordinates change
    mapRef.current.setView(center, zoom);
  }, [center, zoom]);

  useEffect(() => {
    if (!mapRef.current || !parcel) return;

    // Add parcel boundary if available
    if (parcel.geometry && parcel.geometry.coordinates) {
      try {
        const coordinates = parcel.geometry.coordinates[0].map((coord: number[]) => [coord[1], coord[0]]);
        L.polygon(coordinates, {
          color: '#4F46E5',
          fillColor: '#6366F1',
          fillOpacity: 0.2,
          weight: 2
        }).addTo(mapRef.current)
          .bindPopup(`Parcel: ${parcel.parcel_id || 'Unknown'}`);
      } catch (e) {
        console.error('Error rendering parcel geometry:', e);
      }
    }
  }, [parcel]);

  useEffect(() => {
    if (!mapRef.current || floodZones.length === 0) return;

    // Add flood zones
    floodZones.forEach(zone => {
      if (zone.geometry && zone.geometry.coordinates) {
        try {
          const coordinates = zone.geometry.coordinates[0].map((coord: number[]) => [coord[1], coord[0]]);
          const color = zone.zone === 'A' || zone.zone === 'AE' ? '#EF4444' : '#F59E0B';
          
          L.polygon(coordinates, {
            color,
            fillColor: color,
            fillOpacity: 0.15,
            weight: 1
          }).addTo(mapRef.current!)
            .bindPopup(`Flood Zone: ${zone.zone}`);
        } catch (e) {
          console.error('Error rendering flood zone:', e);
        }
      }
    });
  }, [floodZones]);

  useEffect(() => {
    if (!mapRef.current || utilities.length === 0) return;

    // Add utility lines
    utilities.forEach(utility => {
      if (utility.geometry && utility.geometry.coordinates) {
        try {
          const coordinates = utility.geometry.coordinates.map((coord: number[]) => [coord[1], coord[0]]);
          const color = utility.type === 'water' ? '#3B82F6' : utility.type === 'sewer' ? '#10B981' : '#6B7280';
          
          L.polyline(coordinates, {
            color,
            weight: 3,
            opacity: 0.7
          }).addTo(mapRef.current!)
            .bindPopup(`${utility.type}: ${utility.provider || 'Unknown'}`);
        } catch (e) {
          console.error('Error rendering utility line:', e);
        }
      }
    });
  }, [utilities]);

  useEffect(() => {
    if (!mapRef.current || traffic.length === 0) return;

    // Add traffic segments
    traffic.forEach(segment => {
      if (segment.geometry && segment.geometry.coordinates) {
        try {
          const coordinates = segment.geometry.coordinates.map((coord: number[]) => [coord[1], coord[0]]);
          const aadt = segment.aadt || 0;
          const color = aadt > 20000 ? '#DC2626' : aadt > 10000 ? '#F59E0B' : '#10B981';
          
          L.polyline(coordinates, {
            color,
            weight: 4,
            opacity: 0.6
          }).addTo(mapRef.current!)
            .bindPopup(`${segment.roadway}: ${aadt.toLocaleString()} AADT`);
        } catch (e) {
          console.error('Error rendering traffic segment:', e);
        }
      }
    });
  }, [traffic]);

  return <div ref={mapContainer} className={className} />;
}
