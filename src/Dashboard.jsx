import React, { useState, useEffect, useRef } from 'react';
import { supabase } from './supabaseClient';
import exifr from 'exifr';
import { 
  Leaf, 
  UploadCloud, 
  LogOut, 
  History, 
  Cpu, 
  CheckCircle2, 
  AlertTriangle, 
  Loader2, 
  Sprout, 
  Calendar, 
  MapPin, 
  ExternalLink, 
  X, 
  Navigation, 
  ArrowLeft, 
  Plus, 
  Ruler, 
  Trash2, 
  NotebookPen, 
  DollarSign, 
  CloudRain, 
  Bug, 
  Package 
} from 'lucide-react';
import { NovaAreaModal } from './components/NovaAreaModal';
import AreaMapView from './components/AreaMapView';

export default function Dashboard({ session, onLogout }) {
  const [areas, setAreas] = useState([]);
  const [loadingAreas, setLoadingAreas] = useState(true);
  const [areaSelecionada, setAreaSelecionada] = useState(null);
  const [modalNovaAreaAberto, setModalNovaAreaAberto] = useState(false);

  // Diagnósticos
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [coordenadasAtuais, setCoordenadasAtuais] = useState(null);
  const [origemGps, setOrigemGps] = useState(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [resultadoAtual, setResultadoAtual] = useState(null);
  const [historico, setHistorico] = useState([]);
  const [loadingHistorico, setLoadingHistorico] = useState(false);
  const [feedback, setFeedback] = useState({ tipo: '', texto: '' });
  const [itemMapaSelecionado, setItemMapaSelecionado] = useState(null);

  // Caderno de Campo (field_logs)
  const [fieldLogs, setFieldLogs] = useState([]);
  const [loadingLogs, setLoadingLogs] = useState(false);
  const [novoLogData, setNovoLogData] = useState(new Date().toISOString().split('T')[0]);
  const [novoLogCategoria, setNovoLogCategoria] = useState('Aplicação');
  const [novoLogDescricao, setNovoLogDescricao] = useState('');

  // Custos e Gastos (area_expenses)
  const [expenses, setExpenses] = useState([]);
  const [loadingExpenses, setLoadingExpenses] = useState(false);
  const [novoGastoData, setNovoGastoData] = useState(new Date().toISOString().split('T')[0]);
  const [novoGastoDescricao, setNovoGastoDescricao] = useState('');
  const [novoGastoQtd, setNovoGastoQtd] = useState(1);
  const [novoGastoUnidade, setNovoGastoUnidade] = useState('sc');
  const [novoGastoValorUnit, setNovoGastoValorUnit] = useState('');

  const fileInputRef = useRef(null);
  const user = session?.user;

  useEffect(() => {
    carregarAreas();
  }, []);

  useEffect(() => {
    if (areaSelecionada) {
      carregarHistoricoArea(areaSelecionada.id);
      carregarFieldLogs(areaSelecionada.id);
      carregarExpenses(areaSelecionada.id);
      setSelectedFile(null);
      setPreviewUrl(null);
      setResultadoAtual(null);
      setFeedback({ tipo: '', texto: '' });
    }
  }, [areaSelecionada]);

  const carregarAreas = async () => {
    try {
      setLoadingAreas(true);
      const { data, error } = await supabase
        .from('areas')
        .select('*, diagnostics(count)')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setAreas(data || []);
    } catch (err) {
      console.error('Erro ao procurar lavouras:', err);
    } finally {
      setLoadingAreas(false);
    }
  };

  const carregarHistoricoArea = async (areaId) => {
    try {
      setLoadingHistorico(true);
      const { data, error } = await supabase
        .from('diagnostics')
        .select('*')
        .eq('area_id', areaId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setHistorico(data || []);
    } catch (err) {
      console.error('Erro ao carregar histórico:', err);
    } finally {
      setLoadingHistorico(false);
    }
  };

  const carregarFieldLogs = async (areaId) => {
    try {
      setLoadingLogs(true);
      const { data, error } = await supabase
        .from('field_logs')
        .select('*')
        .eq('area_id', areaId)
        .order('data_registro', { ascending: false });

      if (error) throw error;
      setFieldLogs(data || []);
    } catch (err) {
      console.error('Erro ao carregar caderno de campo:', err);
    } finally {
      setLoadingLogs(false);
    }
  };

  const carregarExpenses = async (areaId) => {
    try {
      setLoadingExpenses(true);
      const { data, error } = await supabase
        .from('area_expenses')
        .select('*')
        .eq('area_id', areaId)
        .order('data_gasto', { ascending: false });

      if (error) throw error;
      setExpenses(data || []);
    } catch (err) {
      console.error('Erro ao carregar despesas:', err);
    } finally {
      setLoadingExpenses(false);
    }
  };

  const handleExcluirArea = async (e, area) => {
    if (e) e.stopPropagation();
    const confirmou = window.confirm(
      `Tem a certeza de que deseja eliminar o talhão "${area.nome}"?\nTodos os dados e registos associados serão eliminados.`
    );
    if (!confirmou) return;

    try {
      const { error } = await supabase.from('areas').delete().eq('id', area.id);
      if (error) throw error;
      if (areaSelecionada?.id === area.id) setAreaSelecionada(null);
      carregarAreas();
    } catch (err) {
      alert(`Erro ao eliminar lavoura: ${err.message}`);
    }
  };

  // Registo no Caderno de Campo
  const handleAdicionarLog = async (e) => {
    e.preventDefault();
    if (!novoLogDescricao.trim() || !areaSelecionada) return;

    try {
      const { error } = await supabase.from('field_logs').insert([
        {
          area_id: areaSelecionada.id,
          data_registro: novoLogData,
          categoria: novoLogCategoria,
          descricao: novoLogDescricao.trim()
        }
      ]);
      if (error) throw error;
      setNovoLogDescricao('');
      carregarFieldLogs(areaSelecionada.id);
    } catch (err) {
      alert('Erro ao registar anotação: ' + err.message);
    }
  };

  const handleExcluirLog = async (id) => {
    try {
      const { error } = await supabase.from('field_logs').delete().eq('id', id);
      if (error) throw error;
      carregarFieldLogs(areaSelecionada.id);
    } catch (err) {
      alert('Erro ao remover anotação: ' + err.message);
    }
  };

  // Registo de Despesas
  const handleAdicionarGasto = async (e) => {
    e.preventDefault();
    if (!novoGastoDescricao.trim() || !novoGastoValorUnit || !areaSelecionada) return;

    try {
      const valorUnit = parseFloat(novoGastoValorUnit.toString().replace(',', '.'));
      const { error } = await supabase.from('area_expenses').insert([
        {
          area_id: areaSelecionada.id,
          data_gasto: novoGastoData,
          descricao: novoGastoDescricao.trim(),
          quantidade: parseFloat(novoGastoQtd) || 1,
          unidade: novoGastoUnidade,
          valor_unitario: valorUnit
        }
      ]);
      if (error) throw error;
      setNovoGastoDescricao('');
      setNovoGastoValorUnit('');
      setNovoGastoQtd(1);
      carregarExpenses(areaSelecionada.id);
    } catch (err) {
      alert('Erro ao registar gasto: ' + err.message);
    }
  };

  const handleExcluirGasto = async (id) => {
    try {
      const { error } = await supabase.from('area_expenses').delete().eq('id', id);
      if (error) throw error;
      carregarExpenses(areaSelecionada.id);
    } catch (err) {
      alert('Erro ao remover gasto: ' + err.message);
    }
  };

  // Diagnóstico Foliar com IA
  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setSelectedFile(file);
    setPreviewUrl(URL.createObjectURL(file));
    setResultadoAtual(null);
    setFeedback({ tipo: '', texto: '' });
    setCoordenadasAtuais(null);
    setOrigemGps(null);

    try {
      const gpsData = await exifr.gps(file);
      if (gpsData?.latitude && gpsData?.longitude) {
        setCoordenadasAtuais({
          latitude: Number(gpsData.latitude.toFixed(6)),
          longitude: Number(gpsData.longitude.toFixed(6))
        });
        setOrigemGps('exif');
        return;
      }
    } catch (err) {
      console.warn('EXIF GPS não identificado:', err);
    }

    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setCoordenadasAtuais({
            latitude: Number(pos.coords.latitude.toFixed(6)),
            longitude: Number(pos.coords.longitude.toFixed(6))
          });
          setOrigemGps('navegador');
        },
        (erro) => console.warn('Geolocalização não concedida:', erro.message),
        { enableHighAccuracy: true, timeout: 5000 }
      );
    }
  };

  const handleDiagnosticar = async () => {
    if (!selectedFile || !areaSelecionada) return;

    setIsAnalyzing(true);
    setFeedback({ tipo: '', texto: '' });

    try {
      const formData = new FormData();
      formData.append('file', selectedFile);

      const apiUrl = import.meta.env.VITE_AI_API_URL || 'http://127.0.0.1:8000';
      const response = await fetch(`${apiUrl}/diagnostico`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) throw new Error('Falha no modelo de IA.');
      const resultadoIA = await response.json();

      const fileExt = selectedFile.name.split('.').pop();
      const fileName = `${user.id}/${Date.now()}.${fileExt}`;
      let imagePathFinal = fileName;

      const { error: uploadError } = await supabase.storage
        .from('folhas-tabaco')
        .upload(fileName, selectedFile);

      if (uploadError) imagePathFinal = 'local_sem_storage';

      const { error: diagError } = await supabase.from('diagnostics').insert([
        {
          user_id: user.id,
          area_id: areaSelecionada.id,
          lavoura: areaSelecionada.nome,
          image_path: imagePathFinal,
          doenca_detectada: resultadoIA.diagnostico,
          confianca: resultadoIA.confianca,
          modelo_utilizado: 'MobileNetV2',
          latitude: coordenadasAtuais?.latitude || null,
          longitude: coordenadasAtuais?.longitude || null,
          observacoes: `Origem GPS: ${origemGps || 'Não detetado'}`
        }
      ]);

      if (diagError) throw diagError;

      setResultadoAtual({
        lavoura: areaSelecionada.nome,
        doenca_detectada: resultadoIA.diagnostico,
        confianca: resultadoIA.confianca,
        modelo_utilizado: 'MobileNetV2',
        latitude: coordenadasAtuais?.latitude,
        longitude: coordenadasAtuais?.longitude,
      });

      setFeedback({ tipo: 'sucesso', texto: 'Diagnóstico registado com sucesso!' });
      carregarHistoricoArea(areaSelecionada.id);
      carregarAreas();
    } catch (err) {
      setFeedback({ tipo: 'erro', texto: err.message || 'Erro ao processar diagnóstico.' });
    } finally {
      setIsAnalyzing(false);
    }
  };

  const totalDespesas = expenses.reduce((acc, curr) => acc + (Number(curr.valor_total) || 0), 0);

  return (
    <div className="min-h-screen bg-agro-dark text-gray-100 flex flex-col">
      {/* Barra Superior */}
      <header className="border-b border-agro-primary/20 bg-agro-card/60 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {areaSelecionada && (
              <button
                onClick={() => setAreaSelecionada(null)}
                className="p-1.5 rounded-lg bg-agro-dark/60 text-agro-muted hover:text-white border border-agro-primary/20 transition cursor-pointer"
                title="Voltar para a lista de lavouras"
              >
                <ArrowLeft className="w-4 h-4" />
              </button>
            )}
            <div className="flex items-center gap-2">
              <Sprout className="w-6 h-6 text-agro-accent" />
              <span className="font-extrabold text-lg tracking-tight text-white">
                Fum<span className="text-agro-primary">IA</span>
              </span>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <span className="text-xs text-agro-muted hidden sm:inline-block">
              {user?.email}
            </span>
            <button
              onClick={onLogout}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-red-950/40 text-red-400 border border-red-500/20 hover:bg-red-900/40 transition cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Sair</span>
            </button>
          </div>
        </div>
      </header>

      {/* Conteúdo Principal */}
      <main className="max-w-7xl mx-auto w-full px-4 py-8 flex-1">
        {!areaSelecionada ? (
          /* LISTAGEM DE LAVOURAS */
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-agro-card/70 border border-agro-primary/20 rounded-3xl p-6 backdrop-blur-sm">
              <div>
                <h2 className="text-2xl font-black text-white flex items-center gap-2">
                  <MapPin className="w-6 h-6 text-agro-primary" />
                  Lavouras Registadas
                </h2>
                <p className="text-xs text-agro-muted mt-1">
                  Selecione uma lavoura para gerir aplicações, despesas e diagnósticos com recurso a IA
                </p>
              </div>
              <button
                onClick={() => setModalNovaAreaAberto(true)}
                className="flex items-center gap-2 bg-agro-primary hover:bg-agro-hover text-agro-dark font-bold px-5 py-2.5 rounded-xl shadow-lg transition cursor-pointer text-sm"
              >
                <Plus className="w-4 h-4" />
                <span>Nova Lavoura</span>
              </button>
            </div>

            {loadingAreas ? (
              <div className="flex items-center justify-center py-24 text-agro-muted gap-2">
                <Loader2 className="w-6 h-6 animate-spin text-agro-primary" />
                <span>A carregar lavouras...</span>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {areas.map((area) => (
                  <div
                    key={area.id}
                    onClick={() => setAreaSelecionada(area)}
                    className="bg-agro-card/70 border border-agro-primary/20 rounded-3xl overflow-hidden hover:border-agro-primary/50 transition cursor-pointer flex flex-col group backdrop-blur-sm relative"
                  >
                    <div className="h-44 bg-agro-dark/60 relative overflow-hidden">
                      {area.foto_capa_url ? (
                        <img
                          src={area.foto_capa_url}
                          alt={area.nome}
                          className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                        />
                      ) : (
                        <div className="w-full h-full flex flex-col items-center justify-center text-agro-muted/50">
                          <Sprout className="w-10 h-10 text-agro-primary/40" />
                          <span className="text-xs text-agro-muted mt-2">Sem foto de referência</span>
                        </div>
                      )}
                      
                      <div className="absolute top-3 left-3 bg-black/70 text-white text-[11px] font-bold px-3 py-1 rounded-full backdrop-blur-md border border-white/10">
                        {area.diagnostics?.[0]?.count || 0} patologias
                      </div>

                      <button
                        onClick={(e) => handleExcluirArea(e, area)}
                        className="absolute top-3 right-3 p-1.5 rounded-full bg-black/70 hover:bg-red-950/80 text-gray-300 hover:text-red-400 border border-white/10 hover:border-red-500/40 backdrop-blur-md transition cursor-pointer"
                        title="Eliminar este talhão"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>

                      {area.tamanho_ha && (
                        <div className="absolute bottom-3 left-3 bg-slate-950/80 text-emerald-300 text-[11px] font-extrabold px-2.5 py-1 rounded-lg backdrop-blur-md border border-emerald-500/30 flex items-center gap-1">
                          <Ruler className="w-3 h-3 text-emerald-400" />
                          <span>{area.tamanho_ha} ha</span>
                        </div>
                      )}
                    </div>

                    <div className="p-5 flex-1 flex flex-col justify-between space-y-3">
                      <div>
                        <h3 className="text-lg font-black text-white group-hover:text-agro-primary transition">
                          {area.nome}
                        </h3>
                        {area.referencia && (
                          <p className="text-xs text-agro-muted mt-1 flex items-center gap-1">
                            <MapPin className="w-3.5 h-3.5 text-agro-accent shrink-0" />
                            <span>{area.referencia}</span>
                          </p>
                        )}
                      </div>

                      <div className="pt-3 border-t border-agro-primary/10 flex items-center justify-between text-xs text-agro-primary font-bold">
                        <span>Aceder ao talhão</span>
                        <span>→</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : (
          /* PAINEL COMPLETO DO TALHÃO */
          <div className="space-y-8">
            {/* Topo do Talhão */}
            <div className="bg-agro-card/70 border border-agro-primary/20 rounded-3xl p-6 backdrop-blur-sm flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <span className="text-[11px] text-agro-muted uppercase tracking-wider font-semibold">
                  Talhão em Monitorização
                </span>
                <div className="flex items-center gap-3">
                  <h2 className="text-2xl font-black text-white">{areaSelecionada.nome}</h2>
                  {areaSelecionada.tamanho_ha && (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg bg-emerald-950/60 border border-emerald-500/30 text-emerald-300 text-xs font-bold">
                      <Ruler className="w-3 h-3 text-emerald-400" />
                      {areaSelecionada.tamanho_ha} ha
                    </span>
                  )}
                </div>
                {areaSelecionada.referencia && (
                  <p className="text-xs text-agro-accent flex items-center gap-1 mt-0.5">
                    <MapPin className="w-3 h-3" /> {areaSelecionada.referencia}
                  </p>
                )}
              </div>

              <div className="flex items-center gap-3">
                <button
                  onClick={(e) => handleExcluirArea(e, areaSelecionada)}
                  className="p-2 text-xs text-red-400 hover:text-red-300 hover:bg-red-950/40 border border-red-500/30 rounded-xl transition cursor-pointer"
                  title="Eliminar talhão"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setAreaSelecionada(null)}
                  className="text-xs text-agro-muted hover:text-white border border-agro-primary/20 px-3 py-2 rounded-xl transition cursor-pointer"
                >
                  Trocar Lavoura
                </button>
              </div>
            </div>

            {/* SEÇÃO 1: MAPA + DIAGNÓSTICO IA + HISTÓRICO DE PATOLOGIAS */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2 space-y-6">
                <div className="bg-agro-card/70 border border-agro-primary/20 rounded-3xl p-6 backdrop-blur-sm">
                  <AreaMapView
                    coordenadas={areaSelecionada.coordenadas || []}
                    diagnósticos={historico}
                  />
                </div>

                <div className="bg-agro-card/70 border border-agro-primary/20 rounded-3xl p-6 md:p-8 backdrop-blur-sm">
                  <h3 className="text-lg font-bold text-white flex items-center gap-2 mb-4">
                    <Cpu className="w-5 h-5 text-agro-primary" />
                    Novo Diagnóstico Foliar
                  </h3>

                  <div 
                    onClick={() => fileInputRef.current?.click()}
                    className={`border-2 border-dashed rounded-2xl p-6 flex flex-col items-center justify-center text-center cursor-pointer transition ${
                      previewUrl ? 'border-agro-primary/50 bg-agro-dark/40' : 'border-agro-primary/20 hover:border-agro-primary/40 bg-agro-dark/20'
                    }`}
                  >
                    <input 
                      type="file" 
                      ref={fileInputRef} 
                      onChange={handleFileChange} 
                      accept="image/*" 
                      className="hidden" 
                    />

                    {previewUrl ? (
                      <div className="space-y-3">
                        <img 
                          src={previewUrl} 
                          alt="Folha de tabaco" 
                          className="max-h-56 rounded-xl object-contain mx-auto border border-agro-primary/20" 
                        />
                        {coordenadasAtuais && (
                          <div className="inline-flex items-center gap-1 px-2.5 py-1 bg-emerald-950/60 border border-emerald-500/30 rounded-lg text-[11px] text-emerald-300">
                            <Navigation className="w-3 h-3 text-emerald-400" />
                            <span>GPS: {coordenadasAtuais.latitude}, {coordenadasAtuais.longitude}</span>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <UploadCloud className="w-8 h-8 text-agro-primary mx-auto" />
                        <p className="text-xs font-semibold text-gray-200">Selecione uma fotografia da folha</p>
                      </div>
                    )}
                  </div>

                  {feedback.texto && (
                    <div className={`mt-3 p-3 rounded-xl text-xs flex items-center gap-2 border ${
                      feedback.tipo === 'sucesso' ? 'bg-emerald-950/60 border-emerald-500/30 text-emerald-300' : 'bg-red-950/60 border-red-500/30 text-red-300'
                    }`}>
                      {feedback.tipo === 'sucesso' ? <CheckCircle2 className="w-4 h-4 shrink-0" /> : <AlertTriangle className="w-4 h-4 shrink-0" />}
                      <span>{feedback.texto}</span>
                    </div>
                  )}

                  <div className="mt-4 flex justify-end">
                    <button
                      onClick={handleDiagnosticar}
                      disabled={!selectedFile || isAnalyzing}
                      className="w-full sm:w-auto px-5 py-2.5 bg-agro-primary hover:bg-agro-hover text-agro-dark font-bold rounded-xl text-xs transition flex items-center justify-center gap-2 disabled:opacity-40 cursor-pointer"
                    >
                      {isAnalyzing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Leaf className="w-4 h-4" />}
                      <span>{isAnalyzing ? 'A processar IA...' : 'Diagnosticar Patologia'}</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Histórico de Patologia */}
              <div className="bg-agro-card/70 border border-agro-primary/20 rounded-3xl p-6 backdrop-blur-sm flex flex-col">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-base font-bold text-white flex items-center gap-2">
                    <History className="w-4 h-4 text-agro-primary" />
                    Histórico de Patologia
                  </h3>
                  <span className="text-[11px] text-agro-muted">
                    {historico.length} {historico.length === 1 ? 'registo' : 'registos'}
                  </span>
                </div>

                {loadingHistorico ? (
                  <div className="flex items-center justify-center py-12 text-agro-muted gap-2 text-xs">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>A carregar...</span>
                  </div>
                ) : historico.length === 0 ? (
                  <div className="text-center py-12 text-agro-muted text-xs">
                    Nenhuma patologia diagnosticada nesta área.
                  </div>
                ) : (
                  <div className="space-y-3 overflow-y-auto max-h-[500px] pr-1">
                    {historico.map((item) => (
                      <div 
                        key={item.id} 
                        className="p-3 bg-agro-dark/60 border border-agro-primary/10 rounded-2xl text-xs space-y-2"
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-semibold text-gray-100">{item.doenca_detectada}</span>
                          <span className="text-agro-accent font-semibold">{item.confianca}%</span>
                        </div>
                        <div className="flex items-center justify-between text-agro-muted text-[11px] pt-1 border-t border-agro-primary/5">
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            {new Date(item.created_at).toLocaleDateString('pt-BR')}
                          </span>
                          {item.latitude && (
                            <button
                              onClick={() => setItemMapaSelecionado(item)}
                              className="text-agro-primary hover:text-agro-accent font-semibold flex items-center gap-1 cursor-pointer"
                            >
                              <Navigation className="w-3 h-3" />
                              <span>Ver no Mapa</span>
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* SEÇÃO 2: CADERNO DE CAMPO / REGISTOS DE MANEJO */}
            <div className="bg-agro-card/70 border border-agro-primary/20 rounded-3xl p-6 backdrop-blur-sm space-y-6">
              <div className="flex items-center gap-2 border-b border-agro-primary/10 pb-4">
                <NotebookPen className="w-5 h-5 text-agro-primary" />
                <div>
                  <h3 className="text-lg font-bold text-white">Caderno de Campo & Manejo Agrícola</h3>
                  <p className="text-xs text-agro-muted">
                    Registe precipitações (mm), aplicações de defensivos, adubações ou o início da colheita
                  </p>
                </div>
              </div>

              {/* Formulário de Novo Registo */}
              <form onSubmit={handleAdicionarLog} className="grid grid-cols-1 sm:grid-cols-12 gap-3">
                <div className="sm:col-span-3">
                  <input
                    type="date"
                    value={novoLogData}
                    onChange={(e) => setNovoLogData(e.target.value)}
                    required
                    className="w-full bg-slate-900 border border-emerald-500/40 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-400"
                  />
                </div>
                <div className="sm:col-span-3">
                  <select
                    value={novoLogCategoria}
                    onChange={(e) => setNovoLogCategoria(e.target.value)}
                    className="w-full bg-slate-900 border border-emerald-500/40 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-400"
                  >
                    <option value="Aplicação">Aplicação de Defensivo</option>
                    <option value="Adubação">Adubação / Nutrição</option>
                    <option value="Clima">Precipitação / Clima (mm)</option>
                    <option value="Plantio">Transplante / Sementeira</option>
                    <option value="Colheita">Colheita / Cura</option>
                    <option value="Outro">Outro Manejo</option>
                  </select>
                </div>
                <div className="sm:col-span-4">
                  <input
                    type="text"
                    placeholder="Ex: Pulverizado inseticida para pulgão / Chuva de 28mm..."
                    value={novoLogDescricao}
                    onChange={(e) => setNovoLogDescricao(e.target.value)}
                    required
                    className="w-full bg-slate-900 border border-emerald-500/40 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-400 placeholder:text-gray-500"
                  />
                </div>
                <div className="sm:col-span-2">
                  <button
                    type="submit"
                    className="w-full h-full bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold px-4 py-2 rounded-xl text-xs transition cursor-pointer flex items-center justify-center gap-1 shadow-md"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Registar</span>
                  </button>
                </div>
              </form>

              {/* Tabela de Registos */}
              <div className="overflow-x-auto rounded-2xl border border-emerald-500/20">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-900/80 text-gray-300 font-semibold border-b border-emerald-500/20">
                    <tr>
                      <th className="p-3">Data</th>
                      <th className="p-3">Tipo de Manejo</th>
                      <th className="p-3">Anotação / Descrição Técnica</th>
                      <th className="p-3 text-right">Ação</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-emerald-500/10 text-gray-200">
                    {loadingLogs ? (
                      <tr>
                        <td colSpan={4} className="p-4 text-center text-agro-muted">A carregar caderno de campo...</td>
                      </tr>
                    ) : fieldLogs.length === 0 ? (
                      <tr>
                        <td colSpan={4} className="p-4 text-center text-agro-muted">Nenhum registo anotado nesta lavoura.</td>
                      </tr>
                    ) : (
                      fieldLogs.map((log) => (
                        <tr key={log.id} className="hover:bg-slate-900/40 transition">
                          <td className="p-3 font-mono text-emerald-400">
                            {new Date(log.data_registro + 'T00:00:00').toLocaleDateString('pt-BR')}
                          </td>
                          <td className="p-3">
                            <span className="px-2 py-0.5 rounded-md bg-emerald-950/70 border border-emerald-500/30 text-emerald-300 font-medium text-[11px]">
                              {log.categoria}
                            </span>
                          </td>
                          <td className="p-3 text-gray-100">{log.descricao}</td>
                          <td className="p-3 text-right">
                            <button
                              onClick={() => handleExcluirLog(log.id)}
                              className="text-red-400 hover:text-red-300 p-1 cursor-pointer transition"
                              title="Remover anotação"
                            >
                              <Trash2 className="w-3.5 h-3.5 inline" />
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* SEÇÃO 3: CONTROLO DE CUSTOS E GASTOS DA LAVOURA */}
            <div className="bg-agro-card/70 border border-agro-primary/20 rounded-3xl p-6 backdrop-blur-sm space-y-6">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b border-agro-primary/10 pb-4">
                <div className="flex items-center gap-2">
                  <DollarSign className="w-5 h-5 text-emerald-400" />
                  <div>
                    <h3 className="text-lg font-bold text-white">Custos & Despesas da Lavoura</h3>
                    <p className="text-xs text-agro-muted">
                      Acompanhamento de insumos, combustíveis, e despesas operacionais
                    </p>
                  </div>
                </div>

                <div className="px-4 py-2 rounded-2xl bg-slate-900 border border-emerald-500/40 flex items-center gap-2">
                  <span className="text-xs text-gray-400 font-medium">Custo Total:</span>
                  <span className="text-base font-black text-emerald-400">
                    {totalDespesas.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                  </span>
                </div>
              </div>

              {/* Formulário de Novo Custo */}
              <form onSubmit={handleAdicionarGasto} className="grid grid-cols-1 sm:grid-cols-12 gap-3">
                <div className="sm:col-span-2">
                  <input
                    type="date"
                    value={novoGastoData}
                    onChange={(e) => setNovoGastoData(e.target.value)}
                    required
                    className="w-full bg-slate-900 border border-emerald-500/40 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-400"
                  />
                </div>
                <div className="sm:col-span-4">
                  <input
                    type="text"
                    placeholder="Descrição (ex: Adubo NPK, Óleo diesel)"
                    value={novoGastoDescricao}
                    onChange={(e) => setNovoGastoDescricao(e.target.value)}
                    required
                    className="w-full bg-slate-900 border border-emerald-500/40 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-400 placeholder:text-gray-500"
                  />
                </div>
                <div className="sm:col-span-2">
                  <input
                    type="number"
                    step="0.01"
                    min="0.01"
                    placeholder="Qtd"
                    value={novoGastoQtd}
                    onChange={(e) => setNovoGastoQtd(e.target.value)}
                    required
                    className="w-full bg-slate-900 border border-emerald-500/40 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-400"
                  />
                </div>
                <div className="sm:col-span-1">
                  <select
                    value={novoGastoUnidade}
                    onChange={(e) => setNovoGastoUnidade(e.target.value)}
                    className="w-full bg-slate-900 border border-emerald-500/40 rounded-xl px-2 py-2 text-xs text-white focus:outline-none focus:border-emerald-400"
                  >
                    <option value="sc">sc</option>
                    <option value="kg">kg</option>
                    <option value="L">L</option>
                    <option value="un">un</option>
                    <option value="h">horas</option>
                  </select>
                </div>
                <div className="sm:col-span-2">
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="Valor Unit (R$)"
                    value={novoGastoValorUnit}
                    onChange={(e) => setNovoGastoValorUnit(e.target.value)}
                    required
                    className="w-full bg-slate-900 border border-emerald-500/40 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-400"
                  />
                </div>
                <div className="sm:col-span-1">
                  <button
                    type="submit"
                    className="w-full h-full bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold px-3 py-2 rounded-xl text-xs transition cursor-pointer flex items-center justify-center gap-1 shadow-md"
                    title="Adicionar despesa"
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                </div>
              </form>

              {/* Tabela de Despesas */}
              <div className="overflow-x-auto rounded-2xl border border-emerald-500/20">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-900/80 text-gray-300 font-semibold border-b border-emerald-500/20">
                    <tr>
                      <th className="p-3">Data</th>
                      <th className="p-3">Item / Insumo</th>
                      <th className="p-3 text-right">Qtd</th>
                      <th className="p-3 text-right">Valor Unitário</th>
                      <th className="p-3 text-right">Subtotal</th>
                      <th className="p-3 text-right">Ação</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-emerald-500/10 text-gray-200">
                    {loadingExpenses ? (
                      <tr>
                        <td colSpan={6} className="p-4 text-center text-agro-muted">A carregar custos da lavoura...</td>
                      </tr>
                    ) : expenses.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="p-4 text-center text-agro-muted">Nenhuma despesa registada para esta lavoura.</td>
                      </tr>
                    ) : (
                      expenses.map((gasto) => (
                        <tr key={gasto.id} className="hover:bg-slate-900/40 transition">
                          <td className="p-3 font-mono text-emerald-400">
                            {new Date(gasto.data_gasto + 'T00:00:00').toLocaleDateString('pt-BR')}
                          </td>
                          <td className="p-3 font-semibold text-gray-100">{gasto.descricao}</td>
                          <td className="p-3 text-right font-mono">
                            {gasto.quantidade} {gasto.unidade}
                          </td>
                          <td className="p-3 text-right font-mono">
                            {Number(gasto.valor_unitario).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                          </td>
                          <td className="p-3 text-right font-bold text-emerald-300 font-mono">
                            {Number(gasto.valor_total).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                          </td>
                          <td className="p-3 text-right">
                            <button
                              onClick={() => handleExcluirGasto(gasto.id)}
                              className="text-red-400 hover:text-red-300 p-1 cursor-pointer transition"
                              title="Remover despesa"
                            >
                              <Trash2 className="w-3.5 h-3.5 inline" />
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                  {expenses.length > 0 && (
                    <tfoot className="bg-slate-900 border-t border-emerald-500/30 font-bold">
                      <tr>
                        <td colSpan={4} className="p-3 text-right text-gray-300 uppercase tracking-wider text-[11px]">
                          Total Investido na lavoura:
                        </td>
                        <td className="p-3 text-right text-emerald-400 text-sm font-mono font-black">
                          {totalDespesas.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                        </td>
                        <td className="p-3"></td>
                      </tr>
                    </tfoot>
                  )}
                </table>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Modal de Registo de Lavoura */}
      <NovaAreaModal
        isOpen={modalNovaAreaAberto}
        onClose={() => setModalNovaAreaAberto(false)}
        onAreaCreated={carregarAreas}
      />

      {/* Modal de Visualização de Pin Individual */}
      {itemMapaSelecionado && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-agro-card border border-agro-primary/40 rounded-3xl max-w-2xl w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-agro-primary/20 pb-3">
              <div>
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  <MapPin className="w-5 h-5 text-agro-primary" />
                  Localização da Recolha
                </h3>
                <p className="text-xs text-agro-muted mt-0.5">
                  {itemMapaSelecionado.doenca_detectada} ({itemMapaSelecionado.confianca}%)
                </p>
              </div>
              <button
                onClick={() => setItemMapaSelecionado(null)}
                className="p-1.5 rounded-lg text-agro-muted hover:text-white hover:bg-agro-dark/40 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="w-full h-80 rounded-2xl overflow-hidden border border-agro-primary/20 shadow-inner">
              <iframe
                title="Mapa de Localização"
                width="100%"
                height="100%"
                frameBorder="0"
                scrolling="no"
                src={`https://www.openstreetmap.org/export/embed.html?bbox=${itemMapaSelecionado.longitude - 0.005}%2C${itemMapaSelecionado.latitude - 0.005}%2C${itemMapaSelecionado.longitude + 0.005}%2C${itemMapaSelecionado.latitude + 0.005}&layer=mapnik&marker=${itemMapaSelecionado.latitude}%2C${itemMapaSelecionado.longitude}`}
              />
            </div>

            <div className="flex items-center justify-between pt-1">
              <span className="text-xs text-agro-muted font-mono">
                {itemMapaSelecionado.latitude}, {itemMapaSelecionado.longitude}
              </span>
              <a
                href={`https://www.google.com/maps/search/?api=1&query=${itemMapaSelecionado.latitude},${itemMapaSelecionado.longitude}`}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-1.5 text-xs font-bold text-agro-dark bg-agro-primary hover:bg-agro-hover px-4 py-2 rounded-xl transition cursor-pointer"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                <span>Google Maps</span>
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}