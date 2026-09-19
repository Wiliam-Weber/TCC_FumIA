import React, { useEffect, useState } from 'react';
import { supabase } from '../supabaseClient';

export const AreaList = ({ onSelectArea, onOpenNovoModal }) => {
  const [areas, setAreas] = useState([]);
  const [loading, setLoading] = useState(true);

  const carregarAreas = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('areas')
        .select('*, diagnosticos(count)')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setAreas(data || []);
    } catch (err) {
      console.error('Erro ao carregar áreas:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    carregarAreas();
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Lavouras Cadastradas</h2>
          <p className="text-sm text-gray-500">
            Selecione uma lavoura para abrir o mapa e diagnosticar folhas por IA
          </p>
        </div>
        <button
          onClick={onOpenNovoModal}
          className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold px-4 py-2.5 rounded-lg shadow-sm transition"
        >
          <span className="text-lg leading-none">+</span> Nova Lavoura
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center items-center py-16">
          <div className="w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : areas.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-xl border border-dashed border-gray-300 p-8">
          <p className="text-gray-500 mb-4">Nenhuma lavoura cadastrada até o momento.</p>
          <button
            onClick={onOpenNovoModal}
            className="text-emerald-600 font-semibold hover:underline"
          >
            Cadastrar primeira lavoura agora
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {areas.map((area) => (
            <div
              key={area.id}
              onClick={() => onSelectArea(area)}
              className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm hover:shadow-md transition cursor-pointer flex flex-col group"
            >
              <div className="h-44 bg-gray-100 relative overflow-hidden">
                {area.foto_capa_url ? (
                  <img
                    src={area.foto_capa_url}
                    alt={area.nome}
                    className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                  />
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center text-gray-400 bg-emerald-50/50">
                    <span className="text-3xl">🌱</span>
                    <span className="text-xs text-emerald-800/60 mt-1 font-medium">Sem foto de capa</span>
                  </div>
                )}
                <div className="absolute top-2 right-2 bg-black/60 text-white text-xs px-2.5 py-1 rounded-full backdrop-blur-sm">
                  {area.diagnosticos?.[0]?.count || 0} diagnósticos
                </div>
              </div>

              <div className="p-5 flex-1 flex flex-col justify-between">
                <div>
                  <h3 className="text-lg font-bold text-gray-800 group-hover:text-emerald-600 transition">
                    {area.nome}
                  </h3>
                  {area.referencia && (
                    <p className="text-sm text-gray-500 mt-1 flex items-center gap-1">
                      <span>📍</span> {area.referencia}
                    </p>
                  )}
                  {area.observacoes && (
                    <p className="text-xs text-gray-400 mt-2 line-clamp-2">
                      {area.observacoes}
                    </p>
                  )}
                </div>

                <div className="mt-4 pt-3 border-t border-gray-100 flex items-center justify-between text-xs text-emerald-600 font-semibold">
                  <span>Abrir área e mapa</span>
                  <span>→</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};