/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { 
  Search, 
  Brain, 
  Activity, 
  BookOpen, 
  Settings, 
  AlertCircle, 
  ChevronRight, 
  Menu, 
  X,
  ClipboardList,
  Stethoscope,
  Home,
  MessageSquare,
  Loader2,
  FileText,
  Upload,
  CheckCircle2,
  Plus,
  Trash2,
  User as UserIcon,
  Sun,
  Moon,
  Download,
  BookOpenCheck
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { getClinicalResponse } from './services/geminiService';
import { DOMAIN_SECTIONS, PROCESS_SECTIONS } from './constants';
import { STATIC_MIND_MAP } from './constants/mindMapData';
import ReactMarkdown from 'react-markdown';
import jsPDF from 'jspdf';
import * as htmlToImage from 'html-to-image';

type View = 'home' | 'search' | 'analysis' | 'reasoning' | 'domain' | 'process' | 'emergency' | 'knowledge' | 'mindmap';

export default function App() {
  const [activeView, setActiveView] = useState<View>('home');
  const [isSidebarOpen, setIsSidebarOpen] = useState(typeof window !== 'undefined' ? window.innerWidth > 1024 : true);
  const [isMobile, setIsMobile] = useState(typeof window !== 'undefined' ? window.innerWidth < 768 : false);
  const [searchQuery, setSearchQuery] = useState('');
  const resultRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
      if (mobile) {
        setIsSidebarOpen(false);
      } else if (window.innerWidth > 1024) {
        setIsSidebarOpen(true);
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);
  const [analysisInput, setAnalysisInput] = useState('');
  const [reasoningInput, setReasoningInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  
  // PDF State
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [pdfBase64, setPdfBase64] = useState<string | null>(null);
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [mindMapData] = useState<any>(STATIC_MIND_MAP);
  const [isGeneratingMindMap] = useState(false);

  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    if (typeof window !== 'undefined') {
      try {
        const savedTheme = localStorage.getItem('theme');
        if (savedTheme === 'light' || savedTheme === 'dark') return savedTheme;
      } catch (e) {
        console.error("Erro ao acessar localStorage", e);
      }
    }
    return 'dark';
  });

  useEffect(() => {
    const root = window.document.documentElement;
    const body = window.document.body;
    
    if (theme === 'dark') {
      root.classList.add('dark');
      body.classList.add('dark');
    } else {
      root.classList.remove('dark');
      body.classList.remove('dark');
    }
    
    try {
      localStorage.setItem('theme', theme);
    } catch (e) {
      console.warn("LocalStorage não disponível");
    }
  }, [theme]);

  // PDF Auto-load
  useEffect(() => {
    const loadDefaultPdf = async () => {
      try {
        const response = await fetch('/epto.pdf');
        if (!response.ok) throw new Error('PDF epto.pdf não encontrado na pasta public');
        
        const blob = await response.blob();
        const file = new File([blob], 'EPTO-4-Edicao.pdf', { type: 'application/pdf' });
        setPdfFile(file);
        setPdfUrl('/epto.pdf');

        const reader = new FileReader();
        reader.onload = () => {
          const base64 = (reader.result as string).split(',')[1];
          setPdfBase64(base64);
        };
        reader.readAsDataURL(file);
      } catch (error) {
        console.error("Erro ao carregar PDF padrão:", error);
      }
    };

    loadDefaultPdf();
  }, []);

  const toggleTheme = () => {
    const nextTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(nextTheme);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.type === 'application/pdf') {
      setPdfFile(file);
      const url = URL.createObjectURL(file);
      setPdfUrl(url);
      const reader = new FileReader();
      reader.onload = () => {
        const base64 = (reader.result as string).split(',')[1];
        setPdfBase64(base64);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSearch = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!searchQuery.trim()) return;
    setIsLoading(true);
    try {
      const response = await getClinicalResponse(
        `Busca/Pergunta: ${searchQuery}`, 
        'search', 
        pdfBase64 || undefined
      );
      setResult(response || 'Nenhuma resposta gerada.');
    } catch (error) {
      setResult('Erro ao gerar resposta. Verifique sua chave de API.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAnalysis = async () => {
    if (!analysisInput.trim()) return;
    setIsLoading(true);
    try {
      const response = await getClinicalResponse(
        `Realize uma Análise de Atividade detalhada para: ${analysisInput}. Lembre-se: NÃO inclua resumos ou introduções. Siga rigorosamente as seções obrigatórias.`, 
        'analysis', 
        pdfBase64 || undefined
      );
      setResult(response || 'Nenhuma análise gerada.');
    } catch (error) {
      setResult('Erro ao gerar análise.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleReasoning = async () => {
    if (!reasoningInput.trim()) return;
    setIsLoading(true);
    try {
      const response = await getClinicalResponse(
        `Forneça raciocínio clínico para este caso: ${reasoningInput}. Lembre-se: NÃO inclua resumos ou introduções. Siga rigorosamente as seções obrigatórias.`, 
        'reasoning', 
        pdfBase64 || undefined
      );
      setResult(response || 'Nenhum raciocínio gerado.');
    } catch (error) {
      setResult('Erro ao gerar raciocínio.');
    } finally {
      setIsLoading(false);
    }
  };

  const exportToPDF = async () => {
    if (!resultRef.current) return;
    
    setIsLoading(true);
    try {
      const element = resultRef.current;
      const canvas = await htmlToImage.toCanvas(element, {
        backgroundColor: theme === 'dark' ? '#111114' : '#ffffff',
        pixelRatio: 2,
      });

      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      
      const imgWidth = 210; // A4 width in mm
      const pageHeight = 297; // A4 height in mm
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      let heightLeft = imgHeight;
      let position = 0;

      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;

      while (heightLeft >= 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
      }

      pdf.save(`analise-dominio-processo-${new Date().getTime()}.pdf`);
    } catch (error) {
      console.error('Erro ao gerar PDF:', error);
      alert('Erro ao gerar PDF. Tente novamente.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleEmergency = async (situation: string) => {
    setIsLoading(true);
    setActiveView('emergency');
    try {
      const response = await getClinicalResponse(
        `Situação Clínica de Emergência: ${situation}. Forneça análise e intervenção imediatas em formato rápido.`, 
        'emergency', 
        pdfBase64 || undefined
      );
      setResult(response || 'Nenhuma orientação de emergência gerada.');
    } catch (error) {
      console.error("Erro no modo emergência:", error);
      setResult('Erro ao gerar orientação de emergência. Tente novamente ou verifique se o PDF não é muito grande.');
    } finally {
      setIsLoading(false);
    }
  };

  const resetResult = () => setResult(null);

  const NavItem = ({ icon: Icon, label, view, color }: { icon: any, label: string, view: View, color: string }) => (
    <button
      onClick={() => { setActiveView(view); resetResult(); }}
      className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${
        activeView === view 
          ? `${color} text-white shadow-lg shadow-indigo-500/20` 
          : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
      }`}
    >
      <Icon size={20} />
      <span className={`${!isSidebarOpen && 'hidden'} font-medium`}>{label}</span>
    </button>
  );

  return (
    <div className={`flex h-screen bg-white dark:bg-[#0a0a0c] text-slate-900 dark:text-slate-200 font-sans overflow-hidden transition-colors duration-300 ${isMobile && isSidebarOpen ? 'overflow-hidden' : ''}`}>
      {/* Mobile Sidebar Overlay */}
      <AnimatePresence>
        {isMobile && isSidebarOpen && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsSidebarOpen(false)}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40"
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <motion.aside 
        initial={false}
        animate={{ 
          width: isSidebarOpen ? (isMobile ? 300 : 280) : (isMobile ? 0 : 80),
          x: isMobile && !isSidebarOpen ? -300 : 0
        }}
        className={`bg-slate-50 dark:bg-[#111114] border-r border-slate-200 dark:border-slate-800/50 flex flex-col z-50 transition-colors duration-300 ${isMobile ? 'fixed inset-y-0 left-0' : 'relative h-full'} ${isMobile && !isSidebarOpen ? 'pointer-events-none' : ''}`}
      >
        <div className="p-6 flex items-center justify-between">
          <div className={`flex items-center gap-3 ${!isSidebarOpen && 'hidden'}`}>
            <div className="w-10 h-10 bg-slate-100 dark:bg-slate-800 rounded-xl overflow-hidden flex items-center justify-center border border-slate-200 dark:border-slate-800 shadow-sm">
              <img src="/logo.png" alt="Logo" className="w-full h-full object-cover" />
            </div>
            <div>
              <h1 className="font-black text-sm leading-tight tracking-tight text-slate-900 dark:text-white uppercase">
                Domínio e Processo <span className="text-orange-600">Assist</span>
              </h1>
              <p className="text-[9px] text-slate-500 font-bold tracking-widest uppercase">OTPF-4 Specialist</p>
            </div>
          </div>
          <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="p-2 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-lg text-slate-500 dark:text-slate-400">
            {isSidebarOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>

        <nav className="flex-1 px-4 space-y-2 overflow-y-auto">
          <NavItem icon={Home} label="Início" view="home" color="bg-indigo-600" />
          <NavItem icon={FileText} label="Base de Conhecimento" view="knowledge" color="bg-cyan-600" />
          <NavItem icon={Brain} label="Mapa Mental (EPTO)" view="mindmap" color="bg-orange-600" />
          <div className="my-4 border-t border-slate-200 dark:border-slate-800/50 mx-2" />
          <NavItem icon={Search} label="Busca Inteligente" view="search" color="bg-emerald-600" />
          <NavItem icon={Activity} label="Análise de Atividade" view="analysis" color="bg-blue-600" />
          <NavItem icon={Brain} label="Raciocínio Clínico" view="reasoning" color="bg-purple-600" />
          <div className="my-4 border-t border-slate-200 dark:border-slate-800/50 mx-2" />
          <NavItem icon={BookOpen} label="Domínio (EPTO)" view="domain" color="bg-amber-600" />
          <NavItem icon={ClipboardList} label="Processo (EPTO)" view="process" color="bg-rose-600" />
          <NavItem icon={AlertCircle} label="Modo Emergência" view="emergency" color="bg-red-600" />
        </nav>

        <div className="p-4 border-t border-slate-200 dark:border-slate-800/50">
          <div className="flex items-center justify-center gap-3 px-4 py-2">
            <div className="w-8 h-8 bg-slate-200 dark:bg-slate-800 rounded-full flex items-center justify-center text-slate-500">
              <UserIcon size={18} />
            </div>
            {isSidebarOpen && (
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-slate-900 dark:text-white truncate">D.P. Assist</p>
                <p className="text-xs text-slate-500 truncate">Sessão Ativa</p>
              </div>
            )}
          </div>
        </div>
      </motion.aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col relative overflow-hidden">
        {/* Header */}
        <header className="h-16 border-b border-slate-200 dark:border-slate-800/50 bg-white/80 dark:bg-[#0a0a0c]/80 backdrop-blur-md flex items-center justify-between px-4 sm:px-8 z-10 transition-colors duration-300">
          <div className="flex items-center gap-3 text-slate-500 dark:text-slate-400 text-sm">
            {isMobile && (
              <button 
                onClick={() => setIsSidebarOpen(true)}
                className="p-2 -ml-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-slate-600 dark:text-slate-400"
              >
                <Menu size={20} />
              </button>
            )}
            <span className="hidden sm:inline">EPTO-4</span>
            <ChevronRight size={14} className="hidden sm:inline" />
            <span className="text-slate-900 dark:text-slate-200 capitalize font-medium">
              {activeView === 'home' ? 'Início' : 
               activeView === 'knowledge' ? 'Base de Conhecimento' :
               activeView === 'mindmap' ? 'Mapa Mental' :
               activeView === 'search' ? 'Busca Inteligente' :
               activeView === 'analysis' ? 'Análise de Atividade' :
               activeView === 'reasoning' ? 'Raciocínio Clínico' :
               activeView === 'domain' ? 'Domínio' :
               activeView === 'process' ? 'Processo' : 'Emergência'}
            </span>
          </div>
          <div className="flex items-center gap-4">
            <button 
              onClick={toggleTheme}
              className="flex items-center gap-2 px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-all shadow-sm border border-slate-200 dark:border-slate-700 group"
              title={theme === 'dark' ? 'Mudar para modo claro' : 'Mudar para modo escuro'}
            >
              <div className="relative w-5 h-5 flex items-center justify-center">
                <motion.div
                  initial={false}
                  animate={{ 
                    scale: theme === 'dark' ? 1 : 0, 
                    rotate: theme === 'dark' ? 0 : 90,
                    opacity: theme === 'dark' ? 1 : 0 
                  }}
                  className="absolute"
                >
                  <Sun size={20} className="text-amber-500" />
                </motion.div>
                <motion.div
                  initial={false}
                  animate={{ 
                    scale: theme === 'light' ? 1 : 0, 
                    rotate: theme === 'light' ? 0 : -90,
                    opacity: theme === 'light' ? 1 : 0 
                  }}
                  className="absolute"
                >
                  <Moon size={20} className="text-indigo-600" />
                </motion.div>
              </div>
              <span className="text-xs font-bold uppercase tracking-wider hidden sm:inline">
                {theme === 'dark' ? 'Claro' : 'Escuro'}
              </span>
            </button>
            {pdfFile ? (
              <div className="hidden sm:flex items-center gap-2 px-3 py-1 bg-emerald-500/10 border border-emerald-500/20 rounded-full text-emerald-600 dark:text-emerald-400 text-xs font-medium">
                <CheckCircle2 size={12} />
                PDF Anexado: {pdfFile.name.length > 20 ? pdfFile.name.substring(0, 20) + '...' : pdfFile.name}
              </div>
            ) : (
              <button 
                onClick={() => setActiveView('knowledge')}
                className="hidden sm:flex items-center gap-2 px-3 py-1 bg-amber-500/10 border border-amber-500/20 rounded-full text-amber-600 dark:text-amber-400 text-xs font-medium hover:bg-amber-500/20 transition-colors"
              >
                <AlertCircle size={12} />
                Nenhum PDF Anexado
              </button>
            )}
          </div>
        </header>

        {/* View Content */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-8">
              <AnimatePresence mode="wait">
                <motion.div
                  key={activeView + (result ? '-result' : '')}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.2 }}
                  className="w-full max-w-5xl mx-auto"
                >
                  {result ? (
                    <div className="w-full space-y-6">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Resultado da Análise</h2>
                    <div className="flex items-center gap-2 w-full sm:w-auto">
                      <button 
                        onClick={exportToPDF}
                        disabled={isLoading}
                        className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl transition-all shadow-lg shadow-rose-500/20 disabled:opacity-50"
                      >
                        <Download size={18} />
                        Gerar PDF
                      </button>
                      <button 
                        onClick={resetResult}
                        className="flex-1 sm:flex-none px-4 py-2 bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl hover:bg-slate-300 dark:hover:bg-slate-700 transition-all"
                      >
                        Nova Consulta
                      </button>
                    </div>
                  </div>
                  <div 
                    ref={resultRef}
                    className="bg-slate-50 dark:bg-[#111114] border border-slate-200 dark:border-slate-800 rounded-2xl p-4 sm:p-10 prose dark:prose-invert prose-indigo max-w-none shadow-2xl transition-colors duration-300"
                  >
                    <div className="mb-8 pb-8 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
                      <div>
                        <h1 className="text-2xl font-bold text-rose-600 mb-1">Assistente TO</h1>
                        <p className="text-xs text-slate-500 uppercase tracking-widest">Relatório de Análise Clínica</p>
                      </div>
                      <div className="text-right text-xs text-slate-400">
                        <p>{new Date().toLocaleDateString('pt-BR')}</p>
                        <p>{new Date().toLocaleTimeString('pt-BR')}</p>
                      </div>
                    </div>
                    <ReactMarkdown>{result}</ReactMarkdown>
                  </div>
                </div>
              ) : (
                <>
                  {activeView === 'home' && (
                    <div className="space-y-10">
                      <div className="space-y-2">
                        <h2 className="text-4xl font-bold text-slate-900 dark:text-white tracking-tight">Bem-vindo, Terapeuta.</h2>
                        <p className="text-slate-500 dark:text-slate-400 text-lg">Selecione uma ferramenta especializada para apoiar seu processo de decisão clínica.</p>
                      </div>

                      {!pdfFile && (
                        <div className="bg-amber-500/5 border border-amber-500/20 rounded-2xl p-6 flex flex-col sm:flex-row items-center justify-between gap-4">
                          <div className="flex items-center gap-4 text-center sm:text-left">
                            <div className="p-3 bg-amber-500/10 rounded-xl text-amber-600 dark:text-amber-50">
                              <FileText size={24} />
                            </div>
                            <div>
                              <h3 className="text-lg font-bold text-slate-900 dark:text-white">Base de Conhecimento Vazia</h3>
                              <p className="text-slate-500 dark:text-slate-400 text-sm">Anexe o PDF do EPTO (OTPF-4) para habilitar o raciocínio clínico baseado no contexto.</p>
                            </div>
                          </div>
                          <button 
                            onClick={() => setActiveView('knowledge')}
                            className="w-full sm:w-auto px-6 py-2 bg-amber-600 hover:bg-amber-500 text-white rounded-xl font-medium transition-all"
                          >
                            Anexar PDF
                          </button>
                        </div>
                      )}

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <QuickCard 
                          icon={Search} 
                          title="Busca Inteligente" 
                          desc="Faça perguntas sobre a estrutura do EPTO e obtenha respostas clínicas."
                          color="bg-emerald-500"
                          onClick={() => setActiveView('search')}
                        />
                        <QuickCard 
                          icon={Activity} 
                          title="Análise de Atividade" 
                          desc="Decomponha qualquer atividade em suas demandas ocupacionais."
                          color="bg-blue-500"
                          onClick={() => setActiveView('analysis')}
                        />
                        <QuickCard 
                          icon={Brain} 
                          title="Raciocínio Clínico" 
                          desc="Insira casos de pacientes para uma análise ocupacional estruturada."
                          color="bg-purple-500"
                          onClick={() => setActiveView('reasoning')}
                        />
                        <QuickCard 
                          icon={FileText} 
                          title="Base de Conhecimento" 
                          desc="Anexe o PDF da EPTO para fornecer contexto à inteligência artificial."
                          color="bg-cyan-500"
                          onClick={() => setActiveView('knowledge')}
                        />
                      </div>

                      <div className="bg-red-500/5 border border-red-500/20 rounded-2xl p-6 flex flex-col md:flex-row items-start gap-4">
                        <div className="p-3 bg-red-500/10 rounded-xl text-red-600 dark:text-red-500">
                          <AlertCircle size={24} />
                        </div>
                        <div className="space-y-3 w-full">
                          <h3 className="text-lg font-bold text-slate-900 dark:text-white">Situações Clínicas de Emergência</h3>
                          <div className="flex flex-wrap gap-2">
                            {['Déficit Motor', 'Declínio Cognitivo', 'Barreira de Interação Social', 'Limitação de Participação'].map(s => (
                              <button 
                                key={s}
                                onClick={() => handleEmergency(s)}
                                className="flex-1 min-w-[150px] px-4 py-2 bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 rounded-lg text-sm font-medium text-red-600 dark:text-red-400 transition-all"
                              >
                                {s}
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {activeView === 'mindmap' && (
                    <div className="space-y-8 h-full flex flex-col">
                      <div className="space-y-2">
                        <h2 className="text-3xl font-bold text-slate-900 dark:text-white">Mapa Mental (EPTO 4ª Edição)</h2>
                        <p className="text-slate-500 dark:text-slate-400">Uma visão ampla da estrutura da EPTO. Clique nos itens para navegar no PDF.</p>
                      </div>

                      {isGeneratingMindMap ? (
                        <div className="flex-1 flex flex-col items-center justify-center space-y-4">
                          <Loader2 size={48} className="text-orange-500 animate-spin" />
                          <p className="text-slate-500 dark:text-slate-400 font-medium">Carregando mapa mental...</p>
                        </div>
                      ) : (
                        <div className="flex-1 grid grid-cols-1 lg:grid-cols-2 gap-8 h-full min-h-[700px]">
                          {/* Mind Map Visualization */}
                          <div className="bg-white dark:bg-[#111114] border border-slate-200 dark:border-slate-800 rounded-3xl p-6 overflow-auto shadow-sm h-[500px] lg:h-auto">
                            <MindMapNode 
                              node={mindMapData} 
                              onNodeClick={(page) => {
                                if (pdfUrl) {
                                  const iframe = document.getElementById('pdf-viewer') as HTMLIFrameElement;
                                  if (iframe) {
                                    iframe.src = `${pdfUrl}#page=${page}`;
                                  }
                                } else {
                                  setActiveView('knowledge');
                                }
                              }} 
                            />
                          </div>

                          {/* PDF Viewer */}
                          <div className="bg-slate-900 rounded-3xl overflow-hidden border border-slate-800 relative group h-[600px] lg:h-auto shadow-2xl">
                            {pdfUrl ? (
                              <>
                                <iframe 
                                  id="pdf-viewer"
                                  src={pdfUrl} 
                                  className="w-full h-full border-none"
                                  title="PDF Viewer"
                                />
                                <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
                                  <a 
                                    href={pdfUrl} 
                                    target="_blank" 
                                    rel="noopener noreferrer"
                                    className="p-2 bg-white/10 backdrop-blur-md rounded-lg text-white hover:bg-white/20 transition-colors"
                                  >
                                    <Plus size={20} />
                                  </a>
                                </div>
                              </>
                            ) : (
                              <div className="w-full h-full flex flex-col items-center justify-center text-slate-500 p-8 text-center">
                                <FileText size={48} className="mb-4 opacity-20" />
                                <p>Anexe o PDF na aba "Base de Conhecimento" para visualizar o conteúdo aqui.</p>
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {activeView === 'knowledge' && (
                    <div className="space-y-8">
                      <div className="space-y-2">
                        <h2 className="text-3xl font-bold text-slate-900 dark:text-white">Base de Conhecimento</h2>
                        <p className="text-slate-500 dark:text-slate-400">Faça o upload do PDF da EPTO (OTPF-4) para fornecer à IA a estrutura clínica exata para suas consultas.</p>
                      </div>

                      <div className="bg-white dark:bg-[#111114] border border-slate-200 dark:border-slate-800 rounded-3xl p-12 text-center space-y-6">
                        <div className="w-20 h-20 bg-cyan-500/10 rounded-3xl flex items-center justify-center text-cyan-500 mx-auto">
                          {pdfFile ? <CheckCircle2 size={40} /> : <Upload size={40} />}
                        </div>
                        
                        <div className="space-y-2">
                          <h3 className="text-xl font-bold text-slate-900 dark:text-white">
                            {pdfFile ? 'Documento Anexado com Sucesso' : 'Upload da Estrutura Clínica'}
                          </h3>
                          <p className="text-slate-500 dark:text-slate-400 max-w-md mx-auto">
                           {pdfFile 
                              ? `O arquivo "${pdfFile.name}" está carregado e pronto para uso como contexto clínico.`
                              : 'Selecione o PDF da EPTO 4ª Edição do seu dispositivo. O conteúdo será usado para guiar todo o raciocínio clínico.'}
                          </p>
                        </div>

                        <div className="pt-4">
                          <label className="cursor-pointer inline-flex items-center gap-2 px-8 py-4 bg-cyan-600 hover:bg-cyan-500 text-white rounded-2xl font-bold transition-all shadow-lg shadow-cyan-500/20">
                            <Upload size={20} />
                            {pdfFile ? 'Alterar Documento PDF' : 'Selecionar Arquivo PDF'}
                            <input 
                              type="file" 
                              accept="application/pdf" 
                              className="hidden" 
                              onChange={handleFileUpload}
                            />
                          </label>
                        </div>

                        {pdfFile && (
                          <button 
                            onClick={() => setPdfFile(null)}
                            className="block mx-auto text-slate-500 hover:text-red-500 text-sm transition-colors"
                          >
                            Remover Documento
                          </button>
                        )}
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="p-6 bg-slate-50 dark:bg-slate-800/30 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-2">
                          <div className="text-cyan-600 dark:text-cyan-500 font-bold">Privacidade</div>
                          <p className="text-xs text-slate-500 dark:text-slate-400">O documento é processado localmente e enviado de forma segura para o serviço de IA para contexto.</p>
                        </div>
                        <div className="p-6 bg-slate-50 dark:bg-slate-800/30 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-2">
                          <div className="text-cyan-600 dark:text-cyan-500 font-bold">Precisão</div>
                          <p className="text-xs text-slate-500 dark:text-slate-400">Ao fornecer o PDF, a IA citará seções e tabelas específicas da OTPF-4.</p>
                        </div>
                        <div className="p-6 bg-slate-50 dark:bg-slate-800/30 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-2">
                          <div className="text-cyan-600 dark:text-cyan-500 font-bold">Sessão</div>
                          <p className="text-xs text-slate-500 dark:text-slate-400">O documento é mantido na memória para sua sessão atual para garantir respostas rápidas.</p>
                        </div>
                      </div>
                    </div>
                  )}

                  {activeView === 'search' && (
                    <div className="space-y-8">
                      <div className="text-center space-y-4 max-w-2xl mx-auto py-12">
                        <div className="w-16 h-16 bg-emerald-500/10 rounded-2xl flex items-center justify-center text-emerald-500 mx-auto">
                          <Search size={32} />
                        </div>
                        <h2 className="text-3xl font-bold text-slate-900 dark:text-white">Busca Inteligente</h2>
                        <p className="text-slate-500 dark:text-slate-400">Pergunte qualquer coisa sobre a Estrutura da Prática da Terapia Ocupacional (OTPF-4).</p>
                      </div>
                      <form onSubmit={handleSearch} className="max-w-3xl mx-auto relative">
                        <input 
                          type="text"
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          placeholder="ex: Quais são as competências de desempenho envolvidas na interação social?"
                          className="w-full bg-white dark:bg-[#111114] border border-slate-200 dark:border-slate-800 rounded-2xl px-6 py-5 pr-16 text-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/50 transition-all dark:text-white"
                        />
                        <button 
                          disabled={isLoading}
                          className="absolute right-3 top-3 bottom-3 px-4 bg-emerald-600 hover:bg-emerald-500 rounded-xl text-white transition-colors flex items-center justify-center disabled:opacity-50"
                        >
                          {isLoading ? <Loader2 className="animate-spin" size={20} /> : <Search size={20} />}
                        </button>
                      </form>
                    </div>
                  )}

                  {activeView === 'analysis' && (
                    <div className="space-y-8">
                      <div className="space-y-2">
                        <h2 className="text-3xl font-bold text-slate-900 dark:text-white">Análise de Atividade</h2>
                        <p className="text-slate-500 dark:text-slate-400">Insira uma atividade para analisar suas demandas e competências de desempenho.</p>
                      </div>
                      <div className="bg-white dark:bg-[#111114] border border-slate-200 dark:border-slate-800 rounded-2xl p-8 space-y-6">
                        <textarea 
                          value={analysisInput}
                          onChange={(e) => setAnalysisInput(e.target.value)}
                          placeholder="Descreva a atividade (ex: 'Escovar os dentes em pé na pia')"
                          className="w-full bg-slate-50 dark:bg-[#0a0a0c] border border-slate-200 dark:border-slate-800 rounded-xl p-4 h-40 focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all resize-none dark:text-white"
                        />
                        <button 
                          onClick={handleAnalysis}
                          disabled={isLoading}
                          className="w-full py-4 bg-blue-600 hover:bg-blue-500 rounded-xl font-bold text-white transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                        >
                          {isLoading ? <Loader2 className="animate-spin" size={20} /> : <Activity size={20} />}
                          Analisar Atividade
                        </button>
                      </div>
                    </div>
                  )}

                  {activeView === 'reasoning' && (
                    <div className="space-y-8">
                      <div className="space-y-2">
                        <h2 className="text-3xl font-bold text-slate-900 dark:text-white">Raciocínio Clínico</h2>
                        <p className="text-slate-500 dark:text-slate-400">Descreva um caso de paciente para uma análise estruturada de TO e plano de intervenção.</p>
                      </div>
                      <div className="bg-white dark:bg-[#111114] border border-slate-200 dark:border-slate-800 rounded-2xl p-8 space-y-6">
                        <textarea 
                          value={reasoningInput}
                          onChange={(e) => setReasoningInput(e.target.value)}
                          placeholder="Descreva o caso (ex: 'Paciente de 72 anos com doença de Parkinson apresentando dificuldade em vestir a parte superior do corpo e preparar refeições devido a tremores e bradicinesia.')"
                          className="w-full bg-slate-50 dark:bg-[#0a0a0c] border border-slate-200 dark:border-slate-800 rounded-xl p-4 h-40 focus:outline-none focus:ring-2 focus:ring-purple-500/50 transition-all resize-none dark:text-white"
                        />
                        <button 
                          onClick={handleReasoning}
                          disabled={isLoading}
                          className="w-full py-4 bg-purple-600 hover:bg-purple-500 rounded-xl font-bold text-white transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                        >
                          {isLoading ? <Loader2 className="animate-spin" size={20} /> : <Brain size={20} />}
                          Gerar Raciocínio Clínico
                        </button>
                      </div>
                    </div>
                  )}

                  {activeView === 'domain' && (
                    <div className="space-y-8">
                      <div className="space-y-2">
                        <h2 className="text-3xl font-bold text-slate-900 dark:text-white">Domínio da TO</h2>
                        <p className="text-slate-500 dark:text-slate-400">O escopo da prática da terapia ocupacional e as áreas em que seus profissionais têm um corpo estabelecido de conhecimento e experiência.</p>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {DOMAIN_SECTIONS.map(section => (
                          <div key={section.title} className="bg-white dark:bg-[#111114] border border-slate-200 dark:border-slate-800 rounded-2xl p-6 space-y-4">
                            <h3 className="text-xl font-bold text-amber-600 dark:text-amber-500">{section.title}</h3>
                            <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">{section.description}</p>
                            <div className="flex flex-wrap gap-2">
                              {section.items.map(item => (
                                <span key={item} className="px-3 py-1 bg-slate-100 dark:bg-slate-800 rounded-full text-xs text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                                  {item}
                                </span>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {activeView === 'process' && (
                    <div className="space-y-8">
                      <div className="space-y-2">
                        <h2 className="text-3xl font-bold text-slate-900 dark:text-white">Processo da TO</h2>
                        <p className="text-slate-500 dark:text-slate-400">As ações que os profissionais realizam ao fornecer serviços centrados no cliente e focados no engajamento em ocupações.</p>
                      </div>
                      <div className="space-y-6">
                        {PROCESS_SECTIONS.map(section => (
                          <div key={section.title} className="bg-white dark:bg-[#111114] border border-slate-200 dark:border-slate-800 rounded-2xl p-6 flex flex-col md:flex-row gap-6">
                            <div className="md:w-1/3 space-y-2">
                              <h3 className="text-xl font-bold text-rose-600 dark:text-rose-500">{section.title}</h3>
                              <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">{section.description}</p>
                            </div>
                            <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-3">
                              {section.items.map(item => (
                                <div key={item} className="p-3 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 rounded-xl text-sm text-slate-700 dark:text-slate-200 flex items-center gap-2">
                                  <div className="w-1.5 h-1.5 bg-rose-500 rounded-full" />
                                  {item}
                                </div>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {activeView === 'emergency' && !result && (
                    <div className="space-y-8">
                      <div className="space-y-2 text-center py-12">
                        <div className="w-16 h-16 bg-red-500/10 rounded-2xl flex items-center justify-center text-red-500 mx-auto mb-4">
                          <AlertCircle size={32} />
                        </div>
                        <h2 className="text-3xl font-bold text-slate-900 dark:text-white">Orientação Clínica de Emergência</h2>
                        <p className="text-slate-500 dark:text-slate-400">Selecione uma situação para análise clínica imediata e estratégias de intervenção.</p>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-2xl mx-auto">
                        {['Déficit Motor', 'Dificuldade de Interação Social', 'Déficit Cognitivo', 'Limitação de Participação', 'Risco de Quedas', 'Barreiras Ambientais'].map(s => (
                          <button 
                            key={s}
                            onClick={() => handleEmergency(s)}
                            className="p-6 bg-white dark:bg-[#111114] border border-slate-200 dark:border-slate-800 hover:border-red-500/50 rounded-2xl text-left transition-all group"
                          >
                            <div className="flex items-center justify-between">
                              <span className="font-bold text-slate-900 dark:text-white group-hover:text-red-500 transition-colors">{s}</span>
                              <ChevronRight size={18} className="text-slate-400 dark:text-slate-600 group-hover:text-red-500" />
                            </div>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </main>
    </div>
  );
}

function QuickCard({ icon: Icon, title, desc, color, onClick }: { icon: any, title: string, desc: string, color: string, onClick: () => void }) {
  return (
    <button 
      onClick={onClick}
      className="bg-white dark:bg-[#111114] border border-slate-200 dark:border-slate-800 p-6 rounded-2xl text-left hover:border-slate-300 dark:hover:border-slate-600 transition-all group shadow-sm dark:shadow-none"
    >
      <div className={`w-12 h-12 ${color}/10 rounded-xl flex items-center justify-center ${color.replace('bg-', 'text-')} mb-4 group-hover:scale-110 transition-transform`}>
        <Icon size={24} />
      </div>
      <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">{title}</h3>
      <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">{desc}</p>
    </button>
  );
}

function MindMapNode({ node, onNodeClick, depth = 0 }: { node: any, onNodeClick: (page: number) => void, depth?: number }) {
  const [isOpen, setIsOpen] = useState(depth < 2);

  if (!node) return null;

  return (
    <div className={`pl-${depth > 0 ? '6' : '0'} border-l-2 border-slate-100 dark:border-slate-800/50 mt-2`}>
      <div className="flex items-center gap-2 group">
        {node.children && node.children.length > 0 && (
          <button 
            onClick={() => setIsOpen(!isOpen)}
            className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded transition-colors"
          >
            <ChevronRight 
              size={14} 
              className={`transition-transform duration-200 ${isOpen ? 'rotate-90' : ''}`} 
            />
          </button>
        )}
        <button
          onClick={() => node.page && onNodeClick(node.page)}
          className={`flex-1 text-left px-3 py-2 rounded-lg transition-all ${
            node.page 
              ? 'hover:bg-orange-500/10 hover:text-orange-600 dark:hover:text-orange-400 cursor-pointer' 
              : 'cursor-default'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className={`font-medium ${depth === 0 ? 'text-lg text-slate-900 dark:text-white' : 'text-sm'}`}>
              {node.name}
            </span>
            {node.page && (
              <span className="text-[10px] bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded text-slate-500">
                pág. {node.page}
              </span>
            )}
          </div>
        </button>
      </div>
      
      {isOpen && node.children && (
        <div className="mt-1">
          {node.children.map((child: any, idx: number) => (
            <MindMapNode key={idx} node={child} onNodeClick={onNodeClick} depth={depth + 1} />
          ))}
        </div>
      )}
    </div>
  );
}
