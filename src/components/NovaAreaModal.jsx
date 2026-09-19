import React, { useState } from 'react';
import { AreaMapDrawer } from './AreaMapDrawer';
import { supabase } from '../supabaseClient';
import { X, Sprout, Image as ImageIcon, Loader2 } from 'lucide-react';

// Função de cálculo geodésico de área sobre o elipsoide WGS84
function calcularHectares(coords) {
  if (!coords || coords.length < 3) return null;
  const RAIO_TERRA = 6378137;
  let total = 0;

  for (let i = 0; i < coords.length; i++) {
    const j = (i + 1) % coords.length;
    const p1 = coords[i];
    const p2 = coords[j];

    const radLat1 = (p1.lat * Math.PI) / 180;
    const radLat2 = (p2.lat * Math.PI) / 180;
    const radLngDiff = ((p2.lng - p1.lng) * Math.PI) / 180;

    total += radLngDiff * (2 + Math.sin(radLat1) + Math.sin(radLat2));
  }

  const areaM2 = Math.abs((total * RAIO_TERRA * RAIO_TERRA) / 4);
  return Number((areaM2 / 10000).toFixed(2));
}

export const NovaAreaModal = ({ isOpen, onClose, onAreaCreated }) => {
  const [nome, setNome] = useState('');
  const [referencia, setReferencia] = useState('');
  const [observacoes, setObservacoes] = useState('');
  const [coordenadas, setCoordenadas] = useState([]);
  const [fotoFile, setFotoFile] = useState(null);
  const [fotoPreview, setFotoPreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState(null);

  if (!isOpen) return null;

  const handleFotoChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setFotoFile(file);
      setFotoPreview(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!nome.trim()) {
      setErro('Indique o nome da lavoura.');
      return;
    }
    if (coordenadas.length < 3) {
      setErro('Delimite a lavoura no mapa com pelo menos 3 pontos.');
      return;
    }

    setLoading(true);
    setErro(null);

    try {
      let fotoUrl = null;

      // Upload da foto para o bucket areas-fotos
      if (fotoFile) {
        const fileExt = fotoFile.name.split('.').pop();
        const nomeArquivoLimpo = `${Date.now()}_capa.${fileExt}`;
        const filePath = nomeArquivoLimpo;

        const { error: uploadError } = await supabase.storage
          .from('areas-fotos')
          .upload(filePath, fotoFile, {
            cacheControl: '3600',
            upsert: true,
          });

        if (uploadError) {
          throw new Error(`Falha no envio da foto: ${uploadError.message}`);
        }

        const { data: publicData } = supabase.storage
          .from('areas-fotos')
          .getPublicUrl(filePath);

        fotoUrl = publicData?.publicUrl || null;
      }

      const tamanhoHaCalculado = calcularHectares(coordenadas);

      // Registo na base de dados com a coluna tamanho_ha
      const { error: insertError } = await supabase.from('areas').insert([
        {
          nome: nome.trim(),
          referencia: referencia.trim() || null,
          observacoes: observacoes.trim() || null,
          foto_capa_url: fotoUrl,
          coordenadas,
          tamanho_ha: tamanhoHaCalculado,
        },
      ]);

      if (insertError) throw insertError;

      onAreaCreated();
      onClose();
      setNome('');
      setReferencia('');
      setObservacoes('');
      setCoordenadas([]);
      setFotoFile(null);
      setFotoPreview(null);
    } catch (err) {
      console.error(err);
      setErro(err.message || 'Erro ao guardar a lavoura.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 overflow-y-auto">
      <div className="bg-[#131f17] border border-emerald-500/30 rounded-3xl max-w-2xl w-full p-6 shadow-2xl my-6 space-y-4">
        
        {/* Cabeçalho */}
        <div className="flex justify-between items-center border-b border-emerald-500/20 pb-3">
          <div className="flex items-center gap-2">
            <Sprout className="w-5 h-5 text-emerald-400" />
            <h2 className="text-lg font-bold text-white">Cadastrar Nova Lavoura</h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg text-gray-400 hover:text-white hover:bg-black/30 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {erro && (
          <div className="p-3 bg-red-950/70 border border-red-500/40 text-red-200 text-xs rounded-xl">
            {erro}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-200 mb-1">
                Nome da Área *
              </label>
              <input
                type="text"
                placeholder="Ex: Lavoura 01"
                value={nome}
                onChange={(e) => setNome(e.target.value)}
                required
                className="w-full px-3.5 py-2.5 bg-slate-900 border border-emerald-500/40 rounded-xl text-sm text-white placeholder:text-gray-400 focus:outline-none focus:border-emerald-400 focus:ring-1 focus:ring-emerald-400 transition"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-200 mb-1">
                Ponto de Referência
              </label>
              <input
                type="text"
                placeholder="Ex: Perto da"
                value={referencia}
                onChange={(e) => setReferencia(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-900 border border-emerald-500/40 rounded-xl text-sm text-white placeholder:text-gray-400 focus:outline-none focus:border-emerald-400 focus:ring-1 focus:ring-emerald-400 transition"
              />
            </div>
          </div>

          {/* Imagem de Referência */}
          <div>
            <label className="block text-xs font-semibold text-gray-200 mb-1">
              Foto de Identificação / Referência (Opcional)
            </label>
            <div className="flex items-center gap-3">
              <label className="flex items-center gap-2 px-3.5 py-2 bg-slate-900 border border-emerald-500/30 rounded-xl text-xs text-emerald-300 hover:bg-emerald-950/40 cursor-pointer transition">
                <ImageIcon className="w-4 h-4" />
                <span>Escolher Imagem</span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFotoChange}
                  className="hidden"
                />
              </label>
              {fotoPreview && (
                <img
                  src={fotoPreview}
                  alt="Pré-visualização"
                  className="w-10 h-10 rounded-lg object-cover border border-emerald-500/40"
                />
              )}
            </div>
          </div>

          {/* Desenho do Perímetro no Mapa */}
          <div>
            <label className="block text-xs font-semibold text-gray-200 mb-1.5">
              Delimitação Geográfica da lavoura *
            </label>
            <AreaMapDrawer
              coordenadas={coordenadas}
              onChangeCoordenadas={setCoordenadas}
            />
          </div>

          {/* Observações Adicionais */}
          <div>
            <label className="block text-xs font-semibold text-gray-200 mb-1">
              Observações Adicionais
            </label>
            <textarea
              placeholder="Ex: Variedade Virgínia, adubação realizada..."
              value={observacoes}
              onChange={(e) => setObservacoes(e.target.value)}
              rows={2}
              className="w-full px-3.5 py-2 bg-slate-900 border border-emerald-500/40 rounded-xl text-xs text-white placeholder:text-gray-400 focus:outline-none focus:border-emerald-400 focus:ring-1 focus:ring-emerald-400 transition"
            />
          </div>

          {/* Botões de Ação */}
          <div className="flex justify-end gap-3 pt-3 border-t border-emerald-500/20">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-gray-400 hover:text-white transition cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex items-center gap-2 px-5 py-2 text-xs font-bold text-slate-950 bg-emerald-400 hover:bg-emerald-300 rounded-xl shadow-lg transition disabled:opacity-40 cursor-pointer"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>A guardar...</span>
                </>
              ) : (
                <span>Guardar Lavoura</span>
              )}
            </button>
          </div>
        </form>

      </div>
    </div>
  );
};

export default NovaAreaModal;