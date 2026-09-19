import React from 'react';
import { MapContainer, TileLayer, Polygon, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';

// Correção dos ícones padrão do Leaflet no Vite
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

export const AreaMapView = ({ coordenadas = [], diagnósticos = [] }) => {
  const center = coordenadas.length > 0 
    ? [coordenadas[0].lat, coordenadas[0].lng] 
    : [-27.215, -49.643];

  const polygonPositions = coordenadas.map(c => [c.lat, c.lng]);

  return (
    <div className="w-full h-80 rounded-2xl overflow-hidden border border-emerald-500/20 shadow-inner relative">
      <MapContainer
        center={center}
        zoom={16}
        scrollWheelZoom={true}
        style={{ height: '100%', width: '100%' }}
      >
        {/* Camada Google Satélite Híbrido (Satélite + Estradas e Nomes) */}
        <TileLayer
          attribution="&copy; Google Maps"
          url="https://mt1.google.com/vt/lyrs=y&x={x}&y={y}&z={z}"
          maxZoom={20}
          subdomains={['mt0', 'mt1', 'mt2', 'mt3']}
        />

        {polygonPositions.length > 0 && (
          <Polygon
            positions={polygonPositions}
            pathOptions={{
              color: '#10b981',
              fillColor: '#059669',
              fillOpacity: 0.35,
              weight: 3
            }}
          />
        )}

        {diagnósticos.map((item) => {
          if (!item.latitude || !item.longitude) return null;
          return (
            <Marker key={item.id} position={[item.latitude, item.longitude]}>
              <Popup>
                <div className="text-xs space-y-1">
                  <p className="font-bold text-gray-900">{item.doenca_detectada}</p>
                  <p className="text-gray-600">Confiança: {item.confianca}%</p>
                  <p className="text-gray-400">
                    {new Date(item.created_at).toLocaleDateString('pt-BR')}
                  </p>
                </div>
              </Popup>
            </Marker>
          );
        })}
      </MapContainer>
    </div>
  );
};

export default AreaMapView;