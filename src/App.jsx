import React, { useState, useEffect } from 'react';
import { supabase } from './supabaseClient';
import Dashboard from './Dashboard';
import { Leaf, Cpu, ShieldCheck, Mail, Lock, User, ArrowRight, Loader2, Sprout, AlertCircle, CheckCircle2 } from 'lucide-react';

export default function App() {
  const [session, setSession] = useState(null);
  const [checkingSession, setCheckingSession] = useState(true);

  // Estados do formulário de autenticação
  const [isSignUp, setIsSignUp] = useState(false);
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [nome, setNome] = useState('');
  const [mensagem, setMensagem] = useState({ tipo: '', texto: '' });

  // Ouvir mudanças no estado de autenticação (login, logout, refresh)
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setCheckingSession(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setCheckingSession(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleAuth = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMensagem({ tipo: '', texto: '' });

    try {
      if (isSignUp) {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: { data: { nome: nome || 'Produtor Rural' } }
        });

        if (error) throw error;

        // Se o Supabase exigir confirmação por e-mail, session vem null
        if (data?.user && !data?.session) {
          setMensagem({
            tipo: 'sucesso',
            texto: 'Conta criada! Verifique seu e-mail para confirmar o cadastro.'
          });
        } else {
          setMensagem({
            tipo: 'sucesso',
            texto: 'Conta cadastrada com sucesso! Entrando no sistema...'
          });
        }
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (error) throw error;
      }
    } catch (error) {
      setMensagem({
        tipo: 'erro',
        texto: error.message === 'Invalid login credentials' 
          ? 'E-mail ou senha inválidos.' 
          : error.message || 'Erro ao processar autenticação.'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  // Carregamento inicial da sessão
  if (checkingSession) {
    return (
      <div className="min-h-screen bg-agro-dark flex items-center justify-center text-agro-primary">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  // Se estiver logado, exibe a Dashboard da lavoura
  if (session) {
    return <Dashboard session={session} onLogout={handleLogout} />;
  }

  // Se não estiver logado, exibe a tela de Login/Cadastro
  return (
    <main className="min-h-screen w-full flex items-center justify-center p-4 bg-agro-dark relative overflow-hidden">
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#10b9810a_1px,transparent_1px),linear-gradient(to_bottom,#10b9810a_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_50%,#000_70%,transparent_100%)] pointer-events-none" />
      
      <div className="absolute -top-32 -left-32 w-96 h-96 bg-agro-primary/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-32 -right-32 w-96 h-96 bg-agro-accent/10 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-4xl grid grid-cols-1 md:grid-cols-2 bg-agro-card/80 border border-agro-primary/20 rounded-3xl backdrop-blur-xl shadow-2xl overflow-hidden z-10">
        
        {/* Identidade Visual */}
        <div className="p-8 md:p-12 flex flex-col justify-between border-b md:border-b-0 md:border-r border-agro-primary/10 bg-gradient-to-br from-agro-card to-agro-dark/90">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-agro-primary/10 border border-agro-primary/30 text-agro-accent text-xs font-semibold tracking-wider uppercase mb-6">
              <Cpu className="w-4 h-4 text-agro-primary" />
              <span>Visão Computacional & Agro</span>
            </div>

            <h1 className="text-3xl font-extrabold text-white tracking-tight flex items-center gap-2">
              <span>FumIA</span>
              <span className="text-agro-primary"></span>
              <Sprout className="w-7 h-7 text-agro-accent" />
            </h1>
            
            <p className="mt-4 text-agro-muted text-sm leading-relaxed">
              Diagnóstico inteligente de patologias foliares na cultura do tabaco por meio de Redes Neurais Convolucionais.
            </p>
          </div>

          <div className="space-y-4 my-8 md:my-0">
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-lg bg-agro-primary/10 text-agro-primary">
                <Leaf className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-sm font-semibold text-gray-200">Detecção Rápida em Campo</h2>
                <p className="text-xs text-agro-muted">Classificação de patologias foliares.</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="p-2 rounded-lg bg-agro-primary/10 text-agro-primary">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-sm font-semibold text-gray-200">Suporte ao Produtor & Agrônomo</h2>
                <p className="text-xs text-agro-muted">Decisões assertivas para proteção da lavoura no Alto Vale do Itajaí.</p>
              </div>
            </div>
          </div>

          <div className="text-xs text-agro-muted/70 flex items-center justify-between border-t border-agro-primary/10 pt-4">
            <span>Wiliam Mateus Weber</span>
            <span>UNIDAVI</span>
          </div>
        </div>

        {/* Formulário */}
        <div className="p-8 md:p-12 flex flex-col justify-center">
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-white">
              {isSignUp ? 'Criar Conta' : 'Acessar Plataforma'}
            </h2>
            <p className="text-xs text-agro-muted mt-1">
              {isSignUp 
                ? 'Preencha seus dados para começar a analisar lavouras' 
                : 'Entre com suas credenciais para continuar'}
            </p>
          </div>

          {mensagem.texto && (
            <div className={`mb-4 p-3 rounded-xl flex items-center gap-2 text-xs border ${
              mensagem.tipo === 'sucesso' 
                ? 'bg-emerald-950/60 border-emerald-500/30 text-emerald-300' 
                : 'bg-red-950/60 border-red-500/30 text-red-300'
            }`}>
              {mensagem.tipo === 'sucesso' ? <CheckCircle2 className="w-4 h-4 shrink-0" /> : <AlertCircle className="w-4 h-4 shrink-0" />}
              <span>{mensagem.texto}</span>
            </div>
          )}

          <form onSubmit={handleAuth} className="space-y-4">
            {isSignUp && (
              <div>
                <label className="block text-xs font-medium text-agro-muted mb-1">Nome Completo</label>
                <div className="relative">
                  <User className="w-4 h-4 text-agro-muted absolute left-3 top-3.5" />
                  <input 
                    type="text" 
                    value={nome}
                    onChange={(e) => setNome(e.target.value)}
                    required
                    placeholder="Seu nome ou propriedade"
                    className="w-full pl-10 pr-4 py-2.5 bg-agro-dark/60 border border-agro-primary/20 rounded-xl text-sm text-white placeholder-agro-muted/40 focus:outline-none focus:border-agro-primary focus:ring-1 focus:ring-agro-primary transition"
                  />
                </div>
              </div>
            )}

            <div>
              <label className="block text-xs font-medium text-agro-muted mb-1">E-mail</label>
              <div className="relative">
                <Mail className="w-4 h-4 text-agro-muted absolute left-3 top-3.5" />
                <input 
                  type="email" 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  placeholder="produtor@campo.com"
                  className="w-full pl-10 pr-4 py-2.5 bg-agro-dark/60 border border-agro-primary/20 rounded-xl text-sm text-white placeholder-agro-muted/40 focus:outline-none focus:border-agro-primary focus:ring-1 focus:ring-agro-primary transition"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-agro-muted mb-1">Senha</label>
              <div className="relative">
                <Lock className="w-4 h-4 text-agro-muted absolute left-3 top-3.5" />
                <input 
                  type="password" 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  placeholder="••••••••"
                  minLength={6}
                  className="w-full pl-10 pr-4 py-2.5 bg-agro-dark/60 border border-agro-primary/20 rounded-xl text-sm text-white placeholder-agro-muted/40 focus:outline-none focus:border-agro-primary focus:ring-1 focus:ring-agro-primary transition"
                />
              </div>
            </div>

            <button 
              type="submit" 
              disabled={loading}
              className="w-full py-3 px-4 bg-agro-primary hover:bg-agro-hover text-agro-dark font-semibold rounded-xl text-sm transition flex items-center justify-center gap-2 shadow-lg shadow-agro-primary/20 disabled:opacity-50 cursor-pointer"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Processando...</span>
                </>
              ) : (
                <>
                  <span>{isSignUp ? 'Cadastrar' : 'Entrar no Sistema'}</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          <div className="mt-6 text-center">
            <button
              type="button"
              onClick={() => {
                setIsSignUp(!isSignUp);
                setMensagem({ tipo: '', texto: '' });
              }}
              className="text-xs text-agro-muted hover:text-agro-accent transition font-medium cursor-pointer"
            >
              {isSignUp 
                ? 'Já possui uma conta? Faça login' 
                : 'Ainda não tem conta? Cadastre-se'}
            </button>
          </div>
        </div>

      </div>
    </main>
  );
}