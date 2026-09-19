import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Polygon, CircleMarker, useMap, useMapEvents } from 'react-leaflet';
import { Search, Navigation, Loader2 } from 'lucide-react';

const DEFAULT_CENTER = [-27.215, -49.643];

// Captura cliques no mapa para adicionar pontos
function MapClickHandler({ onAddPoint }) {
  useMapEvents({
    click(event) {
      onAddPoint({
        lat: Number(event.latlng.lat.toFixed(6)),
        lng: Number(event.latlng.lng.toFixed(6)),
      });
    },
  });
  return null;
}

// Controlador de voo e animação do mapa
function MapController({ center }) {
  const map = useMap();
  useEffect(() => {
    if (center) {
      map.flyTo(center, 16, { duration: 1.5 });
    }
  }, [center, map]);
  return null;
}

export const AreaMapDrawer = ({
  coordenadas = [],
  onChangeCoordenadas,
  initialCenter = DEFAULT_CENTER,
}) => {
  const [pontos, setPontos] = useState(coordenadas);
  const [userLocation, setUserLocation] = useState(null);
  const [mapCenter, setMapCenter] = useState(initialCenter);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState(null);

  useEffect(() => {
    setPontos(coordenadas);
  }, [coordenadas]);

  // Captura inicial da localização do usuário
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const coords = [pos.coords.latitude, pos.coords.longitude];
          setUserLocation(coords);
          setMapCenter(coords);
        },
        (err) => console.warn('GPS não obtido automaticamente:', err.message),
        { enableHighAccuracy: false, timeout: 8000, maximumAge: 60000 }
      );
    }
  }, []);

  const centralizarNoUsuario = () => {
    if (!navigator.geolocation) {
      alert('Seu navegador não suporta geolocalização.');
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const coords = [pos.coords.latitude, pos.coords.longitude];
        setUserLocation(coords);
        setMapCenter(coords);
      },
      (err) => {
        if (err.code === 1) {
          alert('Permissão negada! Ative a permissão de localização no ícone de cadeado da barra de navegação.');
        } else if (err.code === 2) {
          alert('Localização indisponível no dispositivo. Utilize o campo de busca.');
        } else if (err.code === 3) {
          alert('Tempo esgotado ao buscar localização.');
        } else {
          alert('Não foi possível obter a sua localização atual.');
        }
      },
      { enableHighAccuracy: false, timeout: 15000, maximumAge: 60000 }
    );
  };

  const buscarLocalidade = async (e) => {
    if (e) e.preventDefault();
    if (!searchQuery.trim()) return;

    setIsSearching(true);
    setSearchError(null);

    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
          searchQuery
        )}&limit=1`
      );
      const data = await response.json();

      if (data && data.length > 0) {
        const lat = parseFloat(data[0].lat);
        const lon = parseFloat(data[0].lon);
        setMapCenter([lat, lon]);
      } else {
        setSearchError('Localização não encontrada. Tente incluir estado ou cidade (ex: Vidal Ramos SC).');
      }
    } catch (err) {
      setSearchError('Erro ao consultar o serviço de pesquisa.');
    } finally {
      setIsSearching(false);
    }
  };

  const adicionarPonto = (novo) => {
    setPontos((atual) => {
      const proximo = [...atual, novo];
      onChangeCoordenadas(proximo);
      return proximo;
    });
  };

  const limpar = () => {
    setPontos([]);
    onChangeCoordenadas([]);
  };

  const desfazerUltimo = () => {
    setPontos((atual) => {
      const proximo = atual.slice(0, -1);
      onChangeCoordenadas(proximo);
      return proximo;
    });
  };

  const polygonPositions = pontos.map((p) => [p.lat, p.lng]);

  return (
    <div className="space-y-2">
      {/* Barra de Pesquisa e Botão de Localização */}
      <div className="flex gap-2">
        <div className="flex-1 relative">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                buscarLocalidade(e);
              }
            }}
            placeholder="Pesquisar cidade, bairro ou estrada rural (ex: Vidal Ramos)..."
            className="w-full bg-slate-900 border border-emerald-500/40 rounded-xl px-4 py-2 text-xs text-white placeholder:text-gray-400 focus:outline-none focus:border-emerald-400 focus:ring-1 focus:ring-emerald-400"
          />
          <button
            type="button"
            onClick={buscarLocalidade}
            disabled={isSearching}
            className="absolute right-2 top-2 text-emerald-400 hover:text-emerald-300 p-0.5 cursor-pointer disabled:opacity-40"
            title="Buscar localização"
          >
            {isSearching ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
          </button>
        </div>

        <button
          type="button"
          onClick={centralizarNoUsuario}
          className="flex items-center gap-1.5 px-3 py-2 bg-emerald-950/60 hover:bg-emerald-900/60 text-emerald-300 border border-emerald-500/40 rounded-xl text-xs font-semibold cursor-pointer transition shrink-0"
          title="Centralizar na minha localização atual"
        >
          <Navigation className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Onde estou</span>
        </button>
      </div>

      {searchError && (
        <p className="text-[11px] text-red-400">{searchError}</p>
      )}

      {/* Janela do Mapa */}
      <div className="w-full h-80 rounded-2xl overflow-hidden border border-emerald-500/30 relative shadow-inner">
        <MapContainer
          center={initialCenter}
          zoom={15}
          scrollWheelZoom
          style={{ height: '100%', width: '100%' }}
        >
          {/* Camada Google Satélite Híbrido (Satélite + Estradas e Referências) */}
          <TileLayer
            attribution="&copy; Google Maps"
            url="https://mt1.google.com/vt/lyrs=y&x={x}&y={y}&z={z}"
            maxZoom={20}
            subdomains={['mt0', 'mt1', 'mt2', 'mt3']}
          />

          <MapController center={mapCenter} />
          <MapClickHandler onAddPoint={adicionarPonto} />

          {/* Marcador de posição atual (Bolinha Azul) */}
          {userLocation && (
            <>
              <CircleMarker
                center={userLocation}
                radius={12}
                pathOptions={{ color: '#3b82f6', fillColor: '#60a5fa', fillOpacity: 0.25, weight: 1 }}
              />
              <CircleMarker
                center={userLocation}
                radius={6}
                pathOptions={{ color: '#ffffff', fillColor: '#2563eb', fillOpacity: 1, weight: 2 }}
              />
            </>
          )}

          {/* Pontos marcados */}
          {pontos.map((p, idx) => (
            <CircleMarker
              key={idx}
              center={[p.lat, p.lng]}
              radius={4}
              pathOptions={{ color: '#10b981', fillColor: '#34d399', fillOpacity: 1 }}
            />
          ))}

          {/* Polígono desenhado */}
          {pontos.length >= 3 && (
            <Polygon
              positions={polygonPositions}
              pathOptions={{
                color: '#10b981',
                fillColor: '#059669',
                fillOpacity: 0.35,
                weight: 2,
              }}
            />
          )}
        </MapContainer>

        {/* Botões de Ação do Perímetro */}
        <div className="absolute left-2 bottom-2 z-[1000] flex gap-1.5 items-center">
          <button
            type="button"
            onClick={desfazerUltimo}
            disabled={pontos.length === 0}
            className="bg-slate-950/90 border border-white/10 text-white text-xs px-2.5 py-1 rounded-lg backdrop-blur-sm hover:bg-slate-900 disabled:opacity-40 cursor-pointer"
          >
            Desfazer
          </button>
          <button
            type="button"
            onClick={limpar}
            disabled={pontos.length === 0}
            className="bg-red-950/90 border border-red-500/30 text-red-300 text-xs px-2.5 py-1 rounded-lg backdrop-blur-sm hover:bg-red-900/80 disabled:opacity-40 cursor-pointer"
          >
            Limpar
          </button>
        </div>

        <div className="absolute right-2 bottom-2 z-[1000] bg-slate-950/90 border border-white/10 text-white text-[11px] px-2.5 py-1 rounded-lg backdrop-blur-sm pointer-events-none max-w-[210px] text-right">
          {pontos.length === 0 && 'Clique no mapa para marcar o talhão.'}
          {pontos.length > 0 && pontos.length < 3 && `Marque mais ${3 - pontos.length} ponto(s) para fechar o talhão.`}
          {pontos.length >= 3 && `${pontos.length} pontos marcados. Área pronta!`}
        </div>
      </div>
    </div>
  );
};

export default AreaMapDrawer;