"use client";

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import confetti from 'canvas-confetti';
import { SenseiState, CanalKaizenIdea } from '../types';
import { KAIZEN_PILLS } from '../lib/kaizenData';
import { 
  Lightbulb, 
  Sparkles, 
  Send, 
  Mic, 
  MicOff, 
  X, 
  ListFilter, 
  Clock, 
  User, 
  Building2, 
  FileCheck,
  CheckCircle2,
  RefreshCw,
  Bot,
  Volume2,
  ArrowRight,
  BookOpen,
  Trophy,
  ArrowLeft,
  Flame,
  Check,
  Compass
} from 'lucide-react';

export type InteractionView = 'menu' | 'canal_kaizen' | 'aula' | 'desafio' | 'chat' | 'lista_ideias';

interface KaizenInteractionProps {
  personDetected?: boolean;
  onSpeak: (text: string) => void;
  onStateChange: (state: SenseiState) => void;
  onReturnToIdle: () => void;
  activeView?: InteractionView;
  onViewChange?: (view: InteractionView) => void;
}

export function KaizenInteraction({ 
  personDetected = true, 
  onSpeak, 
  onStateChange, 
  onReturnToIdle,
  activeView: controlledView,
  onViewChange
}: KaizenInteractionProps) {
  // Navigation: 'menu' (Default Hub), 'canal_kaizen', 'aula', 'desafio', 'chat', 'lista_ideias'
  const [internalView, setInternalView] = useState<InteractionView>('menu');
  const activeView = controlledView ?? internalView;

  const setView = useCallback((newView: InteractionView) => {
    setInternalView(newView);
    if (onViewChange) {
      onViewChange(newView);
    }
  }, [onViewChange]);

  // ==========================================
  // CANAL KAIZEN (IDEAS) STATES
  // ==========================================
  const [ideaPhase, setIdeaPhase] = useState<'input' | 'review' | 'success'>('input');
  const [rawIdeaInput, setRawIdeaInput] = useState('');
  const [isVoiceRecording, setIsVoiceRecording] = useState(false);
  const [isStructuring, setIsStructuring] = useState(false);

  // Form fields for proposal
  const [ideaTitle, setIdeaTitle] = useState('');
  const [ideaCategory, setIdeaCategory] = useState('5S & Organização');
  const [ideaProblem, setIdeaProblem] = useState('');
  const [ideaSolution, setIdeaSolution] = useState('');
  const [ideaBenefits, setIdeaBenefits] = useState('');
  const [ideaAuthor, setIdeaAuthor] = useState('');
  const [ideaDepartment, setIdeaDepartment] = useState('Chão de Fábrica');
  const [lastSubmittedIdea, setLastSubmittedIdea] = useState<CanalKaizenIdea | null>(null);
  const [registeredIdeas, setRegisteredIdeas] = useState<CanalKaizenIdea[]>([]);

  // ==========================================
  // SENSEI IA CHAT STATES
  // ==========================================
  const [chatInput, setChatInput] = useState('');
  const [aiResponse, setAiResponse] = useState<string | null>(null);
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [isChatListening, setIsChatListening] = useState(false);

  // ==========================================
  // AULA COM O SENSEI (PILLS) STATES
  // ==========================================
  const [currentPillIndex, setCurrentPillIndex] = useState(0);

  // ==========================================
  // DESAFIO 5S STATES
  // ==========================================
  const [hasAcceptedChallenge, setHasAcceptedChallenge] = useState(false);

  // Recognition reference
  const recognitionRef = useRef<any>(null);

  // Refs for callbacks
  const onReturnToIdleRef = useRef(onReturnToIdle);
  onReturnToIdleRef.current = onReturnToIdle;

  const onSpeakRef = useRef(onSpeak);
  onSpeakRef.current = onSpeak;

  const onStateChangeRef = useRef(onStateChange);
  onStateChangeRef.current = onStateChange;

  const hasCelebratedRef = useRef(false);

  // Load existing ideas from localStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem('toten_canal_kaizen_ideas');
      if (stored) {
        setRegisteredIdeas(JSON.parse(stored));
      }
    } catch (e) {
      console.warn("Failed loading ideas from localStorage:", e);
    }
  }, []);

  // Celebration burst and initial greeting when user arrives (Strictly once per detection session)
  useEffect(() => {
    if (hasCelebratedRef.current) return;
    hasCelebratedRef.current = true;

    // Confetti explosion
    confetti({
      particleCount: 80,
      spread: 75,
      origin: { y: 0.4 }
    });

    onStateChangeRef.current('celebrating');

    // Welcoming party greeting inviting the user to choose an option
    const welcomeSpeech = "Olá, campeão! Sou o Sensei Kaizen! Toque na tela para escolher: cadastrar uma ideia, ter uma aula rápida, aceitar um desafio ou conversar comigo!";
    onSpeakRef.current(welcomeSpeech);

    setTimeout(() => {
      onStateChangeRef.current('interacting');
    }, 2000);
  }, []);

  // Synchronize Mascot sprite with active view
  useEffect(() => {
    if (!hasCelebratedRef.current) return;

    if (activeView === 'canal_kaizen') {
      if (ideaPhase === 'success') {
        onStateChangeRef.current('success');
      } else {
        onStateChangeRef.current('idea');
      }
    } else if (activeView === 'desafio' && hasAcceptedChallenge) {
      onStateChangeRef.current('success');
    } else if (activeView === 'aula') {
      onStateChangeRef.current('interacting');
    } else if (activeView === 'chat') {
      onStateChangeRef.current('interacting');
    } else {
      onStateChangeRef.current('interacting');
    }
  }, [activeView, ideaPhase, hasAcceptedChallenge]);

  // Clean up any active speech recognition on unmount
  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch (_) {}
      }
    };
  }, []);

  // ==========================================
  // CANAL KAIZEN LOGIC
  // ==========================================
  const structureIdeaProposal = async (text: string) => {
    if (!text.trim()) return;

    setIsStructuring(true);
    onStateChange('interacting');

    try {
      const res = await fetch('/api/sensei', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'refine_idea',
          rawText: text
        })
      });

      const json = await res.json();
      if (json.success && json.data) {
        const d = json.data;
        setIdeaTitle(d.title || 'Melhoria no Posto de Trabalho');
        setIdeaCategory(d.category || '5S & Organização');
        setIdeaProblem(d.problem || text);
        setIdeaSolution(d.solution || 'Padronizar e ajustar conforme necessidade do posto.');
        setIdeaBenefits(d.benefits || 'Mais agilidade, ergonomia e segurança no turno.');
        setIdeaPhase('review');

        if (d.senseiEncouragement) {
          onSpeak(d.senseiEncouragement);
        } else {
          onSpeak("Ideia interpretada com sucesso! Dê uma olhada na proposta e confirme o envio.");
        }
      } else {
        setIdeaTitle(`Melhoria Kaizen: ${text.slice(0, 36)}...`);
        setIdeaProblem(text);
        setIdeaSolution("Implementar dispositivo ou rotina padrão.");
        setIdeaBenefits("Mais segurança e agilidade no posto.");
        setIdeaPhase('review');
        onSpeak("Ideia organizada! Você pode revisar e confirmar o envio.");
      }
    } catch (err) {
      console.warn("Erro ao estruturar proposta:", err);
      setIdeaTitle(`Melhoria: ${text.slice(0, 30)}...`);
      setIdeaProblem(text);
      setIdeaSolution("Implementar sugestão prática do operador.");
      setIdeaBenefits("Otimização do posto.");
      setIdeaPhase('review');
    } finally {
      setIsStructuring(false);
    }
  };

  const toggleVoiceRecordingForIdea = useCallback(() => {
    if (typeof window === 'undefined') return;
    const SpeechRec = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRec) {
      alert("Reconhecimento de voz não suportado neste navegador. Digite sua ideia no campo de texto!");
      return;
    }

    if (isVoiceRecording) {
      try {
        recognitionRef.current?.stop();
      } catch (_) {}
      setIsVoiceRecording(false);
      return;
    }

    const recognition = new SpeechRec();
    recognition.lang = 'pt-BR';
    recognition.continuous = false;
    recognition.interimResults = false;

    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      setRawIdeaInput(transcript);
      setIsVoiceRecording(false);
      structureIdeaProposal(transcript);
    };

    recognition.onerror = () => setIsVoiceRecording(false);
    recognition.onend = () => setIsVoiceRecording(false);
    recognitionRef.current = recognition;

    try {
      setIsVoiceRecording(true);
      recognition.start();
    } catch (err) {
      setIsVoiceRecording(false);
    }
  }, [isVoiceRecording]);

  const handleConfirmIdeaSubmission = (e: React.FormEvent) => {
    e.preventDefault();
    if (!ideaTitle.trim() || !ideaProblem.trim()) return;

    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    const newProtocol = `KZ-2026-${randomSuffix}`;

    const newIdea: CanalKaizenIdea = {
      id: Date.now().toString(),
      protocol: newProtocol,
      title: ideaTitle,
      category: ideaCategory,
      problem: ideaProblem,
      solution: ideaSolution,
      benefits: ideaBenefits,
      rawVoiceInput: rawIdeaInput || undefined,
      authorName: ideaAuthor.trim() || 'Colaborador do Turno',
      department: ideaDepartment.trim() || 'Chão de Fábrica',
      createdAt: new Date().toLocaleString('pt-BR'),
      status: 'Em Análise',
      senseiEncouragement: "Excelente contribuição para a melhoria contínua da empresa!"
    };

    const updated = [newIdea, ...registeredIdeas];
    setRegisteredIdeas(updated);
    try {
      localStorage.setItem('toten_canal_kaizen_ideas', JSON.stringify(updated));
    } catch (e) {
      console.warn("Error saving to localStorage:", e);
    }

    setLastSubmittedIdea(newIdea);
    setIdeaPhase('success');

    confetti({
      particleCount: 120,
      spread: 85,
      origin: { y: 0.55 }
    });

    onSpeak(`Parabéns! Sua ideia foi cadastrada no Canal Kaizen com o protocolo ${newProtocol}! Obrigado por construir uma fábrica melhor!`);
  };

  // ==========================================
  // SENSEI IA CHAT LOGIC
  // ==========================================
  const handleAskSensei = async (questionText?: string) => {
    const textToSend = questionText || chatInput;
    if (!textToSend.trim() || isAiLoading) return;

    setIsAiLoading(true);
    setAiResponse(null);
    onStateChange('interacting');

    try {
      const res = await fetch('/api/sensei', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          action: 'chat',
          message: textToSend 
        })
      });

      const data = await res.json();
      const reply = data.response || "Mudar sempre para melhor é o caminho do guerreiro Kaizen!";
      setAiResponse(reply);
      onSpeak(reply);

      confetti({
        particleCount: 35,
        spread: 60,
        origin: { y: 0.6 }
      });
    } catch (err) {
      console.warn("Erro ao consultar Sensei:", err);
      const fallbackMsg = "O Sensei lembra: disciplina e 5S vencem qualquer obstáculo! Qual a sua dúvida sobre o posto?";
      setAiResponse(fallbackMsg);
      onSpeak(fallbackMsg);
    } finally {
      setIsAiLoading(false);
    }
  };

  const toggleSpeechForChat = useCallback(() => {
    if (typeof window === 'undefined') return;
    const SpeechRec = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRec) {
      alert("Reconhecimento de voz não suportado neste navegador. Digite no campo abaixo!");
      return;
    }

    if (isChatListening) {
      try {
        recognitionRef.current?.stop();
      } catch (_) {}
      setIsChatListening(false);
      return;
    }

    const recognition = new SpeechRec();
    recognition.lang = 'pt-BR';
    recognition.continuous = false;
    recognition.interimResults = false;

    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      setChatInput(transcript);
      setIsChatListening(false);
      handleAskSensei(transcript);
    };

    recognition.onerror = () => setIsChatListening(false);
    recognition.onend = () => setIsChatListening(false);
    recognitionRef.current = recognition;

    try {
      setIsChatListening(true);
      recognition.start();
    } catch (err) {
      setIsChatListening(false);
    }
  }, [isChatListening]);

  return (
    <div className="w-full max-w-4xl mx-auto px-2 sm:px-4 z-20">
      
      {/* Top Session Bar */}
      <div className="flex items-center justify-between gap-2.5 mb-3 bg-slate-900/90 backdrop-blur-xl border border-white/10 px-3 sm:px-4 py-2 rounded-2xl shadow-xl">
        {/* Left: Presence / Return to Menu Button */}
        {activeView === 'menu' ? (
          <div className="flex items-center gap-2">
            <span className={`w-2.5 h-2.5 rounded-full ${personDetected ? 'bg-emerald-400 shadow-[0_0_10px_#34d399] animate-pulse' : 'bg-amber-400'}`} />
            <span className="text-xs font-semibold text-slate-300">
              {personDetected ? 'Operador Presente • Escolha uma Opção' : 'Aguardando Operador...'}
            </span>
          </div>
        ) : (
          <button
            onClick={() => setView('menu')}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-bold text-cyan-300 hover:text-white transition cursor-pointer border border-white/10 shadow-sm"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Voltar ao Menu Principal</span>
          </button>
        )}

        {/* Center: Current Section Indicator (when inside a subview) */}
        {activeView !== 'menu' && (
          <div className="hidden sm:flex items-center gap-1.5 text-xs font-bold text-slate-300">
            {activeView === 'canal_kaizen' && <span className="text-amber-400 flex items-center gap-1"><Lightbulb className="w-3.5 h-3.5" /> Canal Kaizen</span>}
            {activeView === 'aula' && <span className="text-cyan-400 flex items-center gap-1"><BookOpen className="w-3.5 h-3.5" /> Aula com Sensei</span>}
            {activeView === 'desafio' && <span className="text-emerald-400 flex items-center gap-1"><Trophy className="w-3.5 h-3.5" /> Desafio 5S</span>}
            {activeView === 'chat' && <span className="text-purple-400 flex items-center gap-1"><Bot className="w-3.5 h-3.5" /> Conversar com Sensei</span>}
            {activeView === 'lista_ideias' && <span className="text-blue-400 flex items-center gap-1"><ListFilter className="w-3.5 h-3.5" /> Banco de Ideias</span>}
          </div>
        )}

        {/* Right: Conclude session button */}
        <button
          onClick={onReturnToIdle}
          className="px-3 py-1.5 rounded-xl bg-slate-800/80 hover:bg-red-500/20 border border-white/10 hover:border-red-500/40 text-xs font-semibold text-slate-300 hover:text-red-300 transition flex items-center gap-1 cursor-pointer"
          title="Encerrar sessão e voltar ao descanso"
        >
          <X className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Encerrar</span>
        </button>
      </div>

      <AnimatePresence mode="wait">
        
        {/* ========================================================================= */}
        {/* MAIN MENU HUB (SENSEI GRANDE COM VÁRIAS OPÇÕES EM BOTÕES)                 */}
        {/* ========================================================================= */}
        {activeView === 'menu' && (
          <motion.div
            key="view_menu"
            initial={{ opacity: 0, y: 15, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -15, scale: 0.98 }}
            className="bg-slate-900/90 backdrop-blur-2xl border border-white/15 rounded-3xl p-5 sm:p-7 shadow-2xl relative overflow-hidden"
          >
            {/* Top Cyan Glowing Line */}
            <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-amber-400 via-cyan-400 to-purple-500" />

            {/* Menu Header Welcome Banner */}
            <div className="text-center max-w-xl mx-auto mb-5">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-cyan-500/15 text-cyan-300 border border-cyan-500/30 mb-2">
                <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
                Menu Interativo do Sensei
              </div>
              <h2 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight">
                Olá! O que vamos fazer juntos hoje?
              </h2>
              <p className="text-xs sm:text-sm text-slate-300 mt-1">
                Toque em uma das opções abaixo para iniciar:
              </p>
            </div>

            {/* Grid of Large Interactive Buttons */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 mb-4">
              
              {/* BUTTON 1: CANAL KAIZEN (CADASTRAR IDEIA) - HERO HIGHLIGHT */}
              <button
                type="button"
                onClick={() => {
                  setView('canal_kaizen');
                  setIdeaPhase('input');
                }}
                className="group relative p-5 rounded-2xl bg-gradient-to-br from-amber-500/15 via-slate-900 to-yellow-500/10 hover:from-amber-500/25 hover:to-yellow-500/20 border-2 border-amber-400/50 hover:border-amber-400 shadow-[0_0_20px_rgba(245,158,11,0.2)] text-left transition-all duration-300 cursor-pointer flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="p-2.5 rounded-xl bg-amber-500 text-slate-950 font-bold shadow-md shadow-amber-500/30 group-hover:scale-105 transition">
                      <Lightbulb className="w-6 h-6" />
                    </span>
                    <span className="text-[10px] font-extrabold tracking-wider uppercase bg-amber-500/20 text-amber-300 border border-amber-500/40 px-2 py-0.5 rounded-full">
                      ★ Destaque
                    </span>
                  </div>
                  <h3 className="text-base sm:text-lg font-bold text-white group-hover:text-amber-300 transition mb-1">
                    💡 Canal Kaizen (Cadastrar Ideia)
                  </h3>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    Viu um desperdício ou tem uma solução para o posto? Fale no microfone e o Sensei IA estrutura sua proposta com protocolo!
                  </p>
                </div>
                <div className="mt-3 flex items-center text-xs font-bold text-amber-400 group-hover:translate-x-1 transition">
                  <span>Cadastrar ideia por voz ou texto</span>
                  <ArrowRight className="w-3.5 h-3.5 ml-1" />
                </div>
              </button>

              {/* BUTTON 2: AULA COM O SENSEI (PÍLULAS KAIZEN & 5S) */}
              <button
                type="button"
                onClick={() => setView('aula')}
                className="group relative p-5 rounded-2xl bg-gradient-to-br from-cyan-500/15 via-slate-900 to-blue-500/10 hover:from-cyan-500/25 hover:to-blue-500/20 border-2 border-cyan-400/40 hover:border-cyan-400 shadow-[0_0_20px_rgba(6,182,212,0.15)] text-left transition-all duration-300 cursor-pointer flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="p-2.5 rounded-xl bg-cyan-500 text-slate-950 font-bold shadow-md shadow-cyan-500/30 group-hover:scale-105 transition">
                      <BookOpen className="w-6 h-6" />
                    </span>
                    <span className="text-[10px] font-extrabold tracking-wider uppercase bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 px-2 py-0.5 rounded-full">
                      1 Minuto
                    </span>
                  </div>
                  <h3 className="text-base sm:text-lg font-bold text-white group-hover:text-cyan-300 transition mb-1">
                    🥋 Aula com o Sensei (5S & Lean)
                  </h3>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    Ouça lições rápidas sobre os 5S, Poka-Yoke, Gemba e os 8 Desperdícios industriais explicadas em áudio.
                  </p>
                </div>
                <div className="mt-3 flex items-center text-xs font-bold text-cyan-400 group-hover:translate-x-1 transition">
                  <span>Ver pílulas de conhecimento</span>
                  <ArrowRight className="w-3.5 h-3.5 ml-1" />
                </div>
              </button>

              {/* BUTTON 3: DESAFIOS 5S DO TURNO */}
              <button
                type="button"
                onClick={() => {
                  setHasAcceptedChallenge(false);
                  setView('desafio');
                }}
                className="group relative p-5 rounded-2xl bg-gradient-to-br from-emerald-500/15 via-slate-900 to-teal-500/10 hover:from-emerald-500/25 hover:to-teal-500/20 border-2 border-emerald-400/40 hover:border-emerald-400 shadow-[0_0_20px_rgba(52,211,153,0.15)] text-left transition-all duration-300 cursor-pointer flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="p-2.5 rounded-xl bg-emerald-500 text-slate-950 font-bold shadow-md shadow-emerald-500/30 group-hover:scale-105 transition">
                      <Trophy className="w-6 h-6" />
                    </span>
                    <span className="text-[10px] font-extrabold tracking-wider uppercase bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 px-2 py-0.5 rounded-full">
                      Missão Rápida
                    </span>
                  </div>
                  <h3 className="text-base sm:text-lg font-bold text-white group-hover:text-emerald-300 transition mb-1">
                    🏆 Desafio 5S do Turno
                  </h3>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    Aceite uma missão prática de 2 minutos para aplicar no seu posto de trabalho agora mesmo e ganhe pontos Kaizen!
                  </p>
                </div>
                <div className="mt-3 flex items-center text-xs font-bold text-emerald-400 group-hover:translate-x-1 transition">
                  <span>Aceitar missão de 2 minutos</span>
                  <ArrowRight className="w-3.5 h-3.5 ml-1" />
                </div>
              </button>

              {/* BUTTON 4: CONVERSAR COM O SENSEI IA */}
              <button
                type="button"
                onClick={() => setView('chat')}
                className="group relative p-5 rounded-2xl bg-gradient-to-br from-purple-500/15 via-slate-900 to-indigo-500/10 hover:from-purple-500/25 hover:to-indigo-500/20 border-2 border-purple-400/40 hover:border-purple-400 shadow-[0_0_20px_rgba(168,85,247,0.15)] text-left transition-all duration-300 cursor-pointer flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="p-2.5 rounded-xl bg-purple-500 text-white font-bold shadow-md shadow-purple-500/30 group-hover:scale-105 transition">
                      <Bot className="w-6 h-6" />
                    </span>
                    <span className="text-[10px] font-extrabold tracking-wider uppercase bg-purple-500/20 text-purple-300 border border-purple-500/40 px-2 py-0.5 rounded-full">
                      Voz & Resposta
                    </span>
                  </div>
                  <h3 className="text-base sm:text-lg font-bold text-white group-hover:text-purple-300 transition mb-1">
                    💬 Tirar Dúvidas com o Sensei
                  </h3>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    Pergunte qualquer coisa sobre bancadas, 5S, máquinas, segurança ou qualidade por voz ou texto.
                  </p>
                </div>
                <div className="mt-3 flex items-center text-xs font-bold text-purple-400 group-hover:translate-x-1 transition">
                  <span>Falar com o Sensei por microfone</span>
                  <ArrowRight className="w-3.5 h-3.5 ml-1" />
                </div>
              </button>

            </div>

            {/* Bottom Row: Quick Ideas Counter & Audio Repeat */}
            <div className="pt-3 border-t border-white/10 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-400">
              <button
                type="button"
                onClick={() => setView('lista_ideias')}
                className="hover:text-cyan-300 flex items-center gap-1.5 transition cursor-pointer font-medium"
              >
                <ListFilter className="w-4 h-4 text-cyan-400" />
                <span>Ver Banco de Ideias ({registeredIdeas.length} cadastradas)</span>
              </button>

              <button
                type="button"
                onClick={() => onSpeak("Olá, campeão! Toque na opção desejada para cadastrar ideias, ter aulas com o Sensei, fazer desafios ou tirar dúvidas!")}
                className="hover:text-white flex items-center gap-1.5 transition cursor-pointer font-medium"
              >
                <Volume2 className="w-4 h-4 text-amber-400" />
                <span>Ouvir Ajuda do Sensei</span>
              </button>
            </div>
          </motion.div>
        )}

        {/* ========================================================================= */}
        {/* SUBVIEW 1: CANAL KAIZEN (CADASTRAR IDEIA)                                 */}
        {/* ========================================================================= */}
        {activeView === 'canal_kaizen' && (
          <motion.div
            key="view_canal_kaizen"
            initial={{ opacity: 0, y: 15, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -15, scale: 0.98 }}
            className="bg-slate-900/90 backdrop-blur-2xl border border-white/15 rounded-3xl p-5 sm:p-7 shadow-2xl relative overflow-hidden"
          >
            <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-amber-400 via-yellow-400 to-amber-500" />

            {/* PHASE 1: INPUT */}
            {ideaPhase === 'input' && (
              <div>
                <div className="text-center max-w-2xl mx-auto mb-5">
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-amber-500/15 text-amber-400 border border-amber-500/30 mb-2">
                    <Lightbulb className="w-3.5 h-3.5 text-amber-400" />
                    Canal Kaizen • Nova Ideia de Melhoria
                  </div>
                  <h3 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
                    O que podemos melhorar no seu posto de trabalho hoje?
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-300 mt-1">
                    Grave sua ideia no microfone ou digite abaixo. O <strong className="text-amber-300">Sensei IA</strong> estrutura automaticamente sua proposta!
                  </p>
                </div>

                {/* Big Voice Recording Button */}
                <div className="bg-slate-950/70 border border-white/10 rounded-3xl p-6 sm:p-7 text-center mb-5 relative overflow-hidden">
                  <button
                    type="button"
                    onClick={toggleVoiceRecordingForIdea}
                    disabled={isStructuring}
                    className={`relative mx-auto w-24 h-24 sm:w-28 sm:h-28 rounded-full flex flex-col items-center justify-center transition-all duration-300 cursor-pointer shadow-2xl ${
                      isVoiceRecording
                        ? 'bg-red-500 text-white shadow-[0_0_35px_rgba(239,68,68,0.6)] scale-105 animate-pulse'
                        : isStructuring
                        ? 'bg-slate-800 text-slate-400 scale-95'
                        : 'bg-gradient-to-tr from-amber-500 via-amber-400 to-yellow-300 text-slate-950 hover:scale-105 shadow-[0_0_30px_rgba(245,158,11,0.35)]'
                    }`}
                  >
                    {isVoiceRecording ? (
                      <>
                        <MicOff className="w-10 h-10 mb-1" />
                        <span className="text-[10px] font-extrabold tracking-wider uppercase">Parar</span>
                      </>
                    ) : isStructuring ? (
                      <RefreshCw className="w-9 h-9 animate-spin text-amber-400" />
                    ) : (
                      <>
                        <Mic className="w-10 h-10 mb-1 text-slate-950" />
                        <span className="text-[10px] font-extrabold tracking-wider uppercase text-slate-950">Gravar Voz</span>
                      </>
                    )}
                  </button>

                  <div className="mt-4">
                    {isVoiceRecording ? (
                      <div className="flex items-center justify-center gap-2 text-red-400 font-bold text-sm animate-pulse">
                        <span className="w-2.5 h-2.5 rounded-full bg-red-500" />
                        Ouvindo sua ideia... Fale com tranquilidade!
                      </div>
                    ) : isStructuring ? (
                      <div className="flex items-center justify-center gap-2 text-amber-300 font-semibold text-sm">
                        <RefreshCw className="w-4 h-4 animate-spin text-amber-400" />
                        O Sensei IA está estruturando sua proposta...
                      </div>
                    ) : (
                      <p className="text-xs sm:text-sm text-slate-400">
                        Toque no microfone e diga qual problema você viu ou como gostaria de resolver.
                      </p>
                    )}
                  </div>
                </div>

                {/* Direct Typing Alternative */}
                {!isStructuring && (
                  <div className="space-y-3">
                    <textarea
                      value={rawIdeaInput}
                      onChange={(e) => setRawIdeaInput(e.target.value)}
                      placeholder="Ou digite sua sugestão de melhoria aqui..."
                      rows={2}
                      className="w-full bg-slate-950/70 border border-white/10 rounded-2xl p-3.5 text-white placeholder-slate-500 text-xs sm:text-sm focus:outline-none focus:border-amber-400 transition"
                    />

                    <div className="flex items-center justify-between">
                      <span className="text-[11px] text-slate-400">
                        ⚡ Ideias práticas e simples são as mais valorizadas.
                      </span>

                      <button
                        type="button"
                        onClick={() => structureIdeaProposal(rawIdeaInput)}
                        disabled={!rawIdeaInput.trim()}
                        className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-500 hover:opacity-95 disabled:opacity-30 text-slate-950 font-bold text-xs sm:text-sm transition cursor-pointer flex items-center gap-2 shadow-lg shadow-amber-500/20"
                      >
                        <span>Avançar para Revisão</span>
                        <ArrowRight className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* PHASE 2: REVIEW & EDIT */}
            {ideaPhase === 'review' && (
              <form onSubmit={handleConfirmIdeaSubmission} className="space-y-4">
                <div className="flex items-center justify-between gap-3 bg-amber-500/15 border border-amber-500/30 rounded-2xl p-3.5">
                  <div className="flex items-center gap-2.5">
                    <Sparkles className="w-5 h-5 text-amber-400 shrink-0" />
                    <div>
                      <h4 className="text-sm font-bold text-white">Proposta Estruturada pelo Sensei IA</h4>
                      <p className="text-xs text-amber-200">Revisamos sua ideia para o formato oficial. Ajuste os campos se desejar e confirme!</p>
                    </div>
                  </div>
                </div>

                {rawIdeaInput && (
                  <div className="bg-slate-950/60 border border-white/5 rounded-xl px-3.5 py-2 text-xs text-slate-400">
                    <span className="font-semibold text-slate-300 block mb-0.5">🎙️ Transcrição da sua fala:</span>
                    <span className="italic text-slate-300">&ldquo;{rawIdeaInput}&rdquo;</span>
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      Título da Melhoria:
                    </label>
                    <input
                      type="text"
                      value={ideaTitle}
                      onChange={(e) => setIdeaTitle(e.target.value)}
                      required
                      className="w-full bg-slate-950/70 border border-white/10 rounded-xl px-3.5 py-2 text-sm text-white focus:outline-none focus:border-amber-400 font-semibold"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      Categoria:
                    </label>
                    <select
                      value={ideaCategory}
                      onChange={(e) => setIdeaCategory(e.target.value)}
                      className="w-full bg-slate-950/70 border border-white/10 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-400 cursor-pointer"
                    >
                      <option value="5S & Organização">5S & Organização</option>
                      <option value="Segurança no Trabalho">Segurança no Trabalho</option>
                      <option value="Eliminação de Desperdício">Eliminação de Desperdício</option>
                      <option value="Manutenção Autônoma">Manutenção Autônoma</option>
                      <option value="Qualidade & Poka-Yoke">Qualidade & Poka-Yoke</option>
                      <option value="Agilidade & Produtividade">Agilidade & Produtividade</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-red-300 mb-1">
                    Problema / Oportunidade Identificada:
                  </label>
                  <textarea
                    value={ideaProblem}
                    onChange={(e) => setIdeaProblem(e.target.value)}
                    rows={2}
                    required
                    className="w-full bg-slate-950/70 border border-white/10 rounded-xl p-3 text-xs sm:text-sm text-white focus:outline-none focus:border-red-400"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-emerald-300 mb-1">
                    Solução Proposta:
                  </label>
                  <textarea
                    value={ideaSolution}
                    onChange={(e) => setIdeaSolution(e.target.value)}
                    rows={2}
                    required
                    className="w-full bg-slate-950/70 border border-white/10 rounded-xl p-3 text-xs sm:text-sm text-white focus:outline-none focus:border-emerald-400"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-cyan-300 mb-1">
                    Benefício Esperado:
                  </label>
                  <textarea
                    value={ideaBenefits}
                    onChange={(e) => setIdeaBenefits(e.target.value)}
                    rows={1}
                    className="w-full bg-slate-950/70 border border-white/10 rounded-xl p-2.5 text-xs sm:text-sm text-white focus:outline-none focus:border-cyan-400"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-400 mb-1 flex items-center gap-1">
                      <User className="w-3.5 h-3.5" /> Seu Nome (Opcional):
                    </label>
                    <input
                      type="text"
                      value={ideaAuthor}
                      onChange={(e) => setIdeaAuthor(e.target.value)}
                      placeholder="Ex: Carlos Oliveira (ou deixe anônimo)"
                      className="w-full bg-slate-950/70 border border-white/10 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none focus:border-white/30"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-400 mb-1 flex items-center gap-1">
                      <Building2 className="w-3.5 h-3.5" /> Setor / Linha:
                    </label>
                    <input
                      type="text"
                      value={ideaDepartment}
                      onChange={(e) => setIdeaDepartment(e.target.value)}
                      placeholder="Ex: Linha de Montagem 02"
                      className="w-full bg-slate-950/70 border border-white/10 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none focus:border-white/30"
                    />
                  </div>
                </div>

                <div className="pt-3 border-t border-white/10 flex flex-wrap justify-between items-center gap-3">
                  <button
                    type="button"
                    onClick={() => setIdeaPhase('input')}
                    className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-300 hover:text-white transition cursor-pointer flex items-center gap-1.5"
                  >
                    <Mic className="w-3.5 h-3.5" /> Regravar / Ajustar
                  </button>

                  <button
                    type="submit"
                    className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-bold text-sm transition cursor-pointer flex items-center gap-2 shadow-lg shadow-emerald-500/30"
                  >
                    <FileCheck className="w-4 h-4 text-slate-950" />
                    Confirmar e Cadastrar Ideia
                  </button>
                </div>
              </form>
            )}

            {/* PHASE 3: SUCCESS */}
            {ideaPhase === 'success' && lastSubmittedIdea && (
              <div className="text-center py-4">
                <div className="w-16 h-16 rounded-full bg-emerald-500/20 border-2 border-emerald-400 flex items-center justify-center mx-auto mb-3 shadow-[0_0_25px_rgba(52,211,153,0.35)]">
                  <CheckCircle2 className="w-9 h-9 text-emerald-400" />
                </div>

                <h3 className="text-xl sm:text-2xl font-bold text-white mb-1">
                  Ideia Registrada no Canal Kaizen!
                </h3>
                
                <div className="inline-block px-4 py-1.5 rounded-full bg-cyan-950 border border-cyan-500/40 text-cyan-300 font-mono font-bold text-sm my-2 shadow-md">
                  Protocolo: {lastSubmittedIdea.protocol}
                </div>

                <p className="text-xs sm:text-sm text-slate-300 max-w-lg mx-auto mb-5 leading-relaxed">
                  Obrigado, <strong className="text-white">{lastSubmittedIdea.authorName}</strong>! Sua proposta foi enviada para o comitê de melhoria contínua.
                </p>

                <div className="bg-slate-950/70 border border-white/10 rounded-2xl p-4 max-w-md mx-auto mb-6 text-left text-xs">
                  <div className="font-bold text-white mb-1 text-sm">{lastSubmittedIdea.title}</div>
                  <div className="text-slate-400 mb-1.5">Categoria: <span className="text-amber-400 font-semibold">{lastSubmittedIdea.category}</span></div>
                  <div className="text-slate-300"><strong className="text-emerald-400">Solução:</strong> {lastSubmittedIdea.solution}</div>
                </div>

                <div className="flex flex-wrap justify-center items-center gap-3">
                  <button
                    onClick={() => {
                      setRawIdeaInput('');
                      setIdeaTitle('');
                      setIdeaProblem('');
                      setIdeaSolution('');
                      setIdeaBenefits('');
                      setIdeaPhase('input');
                    }}
                    className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-500 hover:opacity-95 text-slate-950 font-bold text-xs sm:text-sm transition cursor-pointer flex items-center gap-1.5 shadow-lg shadow-amber-500/20"
                  >
                    <Lightbulb className="w-4 h-4" /> Cadastrar Outra Ideia
                  </button>

                  <button
                    onClick={() => setView('menu')}
                    className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs sm:text-sm font-semibold transition cursor-pointer flex items-center gap-1.5"
                  >
                    Voltar ao Menu
                  </button>

                  <button
                    onClick={onReturnToIdle}
                    className="px-4 py-2.5 rounded-xl bg-slate-900 border border-white/10 hover:border-white/20 text-slate-400 hover:text-white text-xs sm:text-sm font-semibold transition cursor-pointer"
                  >
                    Concluir Sessão
                  </button>
                </div>
              </div>
            )}
          </motion.div>
        )}

        {/* ========================================================================= */}
        {/* SUBVIEW 2: AULA COM O SENSEI (PÍLULAS KAIZEN & 5S)                        */}
        {/* ========================================================================= */}
        {activeView === 'aula' && (
          <motion.div
            key="view_aula"
            initial={{ opacity: 0, y: 15, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -15, scale: 0.98 }}
            className="bg-slate-900/90 backdrop-blur-2xl border border-white/15 rounded-3xl p-5 sm:p-7 shadow-2xl relative overflow-hidden"
          >
            <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-cyan-400 via-blue-500 to-cyan-400" />

            <div className="flex items-center justify-between gap-3 mb-4">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold tracking-wider uppercase bg-cyan-500/15 text-cyan-400 border border-cyan-500/30">
                <BookOpen className="w-3.5 h-3.5" />
                Lição {currentPillIndex + 1} de {KAIZEN_PILLS.length} • {KAIZEN_PILLS[currentPillIndex].tag}
              </span>

              <button
                type="button"
                onClick={() => onSpeak(`${KAIZEN_PILLS[currentPillIndex].title}. ${KAIZEN_PILLS[currentPillIndex].content}`)}
                className="px-3 py-1 rounded-xl bg-cyan-500/20 hover:bg-cyan-500/30 border border-cyan-500/40 text-xs font-bold text-cyan-300 transition cursor-pointer flex items-center gap-1.5"
              >
                <Volume2 className="w-3.5 h-3.5" /> Ouvir Aula 🔊
              </button>
            </div>

            <h3 className="text-xl sm:text-2xl font-extrabold text-white mb-1">
              {KAIZEN_PILLS[currentPillIndex].title}
            </h3>
            <p className="text-xs sm:text-sm font-medium text-cyan-300 mb-4">
              {KAIZEN_PILLS[currentPillIndex].subtitle}
            </p>

            <div className="bg-slate-950/70 border border-white/10 rounded-2xl p-4 sm:p-5 mb-4 text-slate-200 text-sm sm:text-base leading-relaxed">
              {KAIZEN_PILLS[currentPillIndex].content}
            </div>

            <div className="bg-amber-500/10 border border-amber-500/25 rounded-2xl p-3.5 mb-5 text-xs sm:text-sm text-amber-300">
              {KAIZEN_PILLS[currentPillIndex].tip}
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-white/10">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    const prevIdx = (currentPillIndex - 1 + KAIZEN_PILLS.length) % KAIZEN_PILLS.length;
                    setCurrentPillIndex(prevIdx);
                    onSpeak(`${KAIZEN_PILLS[prevIdx].title}. ${KAIZEN_PILLS[prevIdx].content}`);
                  }}
                  className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-300 hover:text-white transition cursor-pointer"
                >
                  ← Anterior
                </button>

                <button
                  type="button"
                  onClick={() => {
                    const nextIdx = (currentPillIndex + 1) % KAIZEN_PILLS.length;
                    setCurrentPillIndex(nextIdx);
                    onSpeak(`${KAIZEN_PILLS[nextIdx].title}. ${KAIZEN_PILLS[nextIdx].content}`);
                  }}
                  className="px-4 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-xs font-bold text-slate-950 transition cursor-pointer flex items-center gap-1.5 shadow-md shadow-cyan-500/20"
                >
                  <span>Próxima Lição</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>

              <button
                type="button"
                onClick={() => {
                  setView('canal_kaizen');
                  setIdeaCategory(currentPillIndex === 1 ? '5S & Organização' : currentPillIndex === 2 ? 'Eliminação de Desperdício' : 'Qualidade & Poka-Yoke');
                  setIdeaPhase('input');
                }}
                className="px-4 py-2 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/40 text-amber-300 text-xs font-bold transition cursor-pointer flex items-center gap-1.5"
              >
                <Lightbulb className="w-3.5 h-3.5 text-amber-400" />
                <span>Aplicar e Cadastrar Ideia</span>
              </button>
            </div>
          </motion.div>
        )}

        {/* ========================================================================= */}
        {/* SUBVIEW 3: DESAFIOS 5S DO TURNO (MISSÃO DE 2 MINUTOS)                     */}
        {/* ========================================================================= */}
        {activeView === 'desafio' && (
          <motion.div
            key="view_desafio"
            initial={{ opacity: 0, y: 15, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -15, scale: 0.98 }}
            className="bg-slate-900/90 backdrop-blur-2xl border border-white/15 rounded-3xl p-5 sm:p-7 shadow-2xl relative overflow-hidden"
          >
            <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-emerald-400 via-teal-500 to-emerald-400" />

            <div className="flex items-center justify-between gap-3 mb-4">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold tracking-wider uppercase bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                <Trophy className="w-3.5 h-3.5" />
                Desafio 5S do Turno • Meta Rápida
              </span>
              <span className="text-xs text-slate-400">⏱️ Duração: 2 minutos</span>
            </div>

            <h3 className="text-xl sm:text-2xl font-extrabold text-white mb-2">
              Missão de Hoje: Seiri & Seiton (Descarte e Lugar Certo)
            </h3>
            <p className="text-slate-300 text-xs sm:text-sm mb-5 leading-relaxed">
              Dê uma olhada na sua estação de trabalho agora. Identifique <strong className="text-emerald-400">1 objeto, papel ou ferramenta</strong> que não tem mais utilidade ou está fora do lugar padrão. Guarde-o no local correto ou descarte adequadamente!
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6">
              <div className="bg-slate-950/60 border border-white/10 rounded-2xl p-4 flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-xs sm:text-sm font-bold text-white">Mais Espaço e Menos Fadiga</h4>
                  <p className="text-xs text-slate-400 mt-0.5">Eliminar o que atrapalha reduz o cansaço visual e poupa até 15 minutos procurando ferramentas.</p>
                </div>
              </div>
              <div className="bg-slate-950/60 border border-white/10 rounded-2xl p-4 flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-cyan-400 shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-xs sm:text-sm font-bold text-white">Segurança em Primeiro Lugar</h4>
                  <p className="text-xs text-slate-400 mt-0.5">Piso e bancadas limpas previnem tropeços, cortes e acidentes no setor.</p>
                </div>
              </div>
            </div>

            {hasAcceptedChallenge ? (
              <div className="p-4 rounded-2xl bg-emerald-500/20 border border-emerald-400/50 text-center mb-4">
                <div className="w-12 h-12 rounded-full bg-emerald-500/30 flex items-center justify-center mx-auto mb-2 text-emerald-300">
                  <Check className="w-6 h-6" />
                </div>
                <h4 className="text-base font-bold text-white mb-1">Missão Aceita com Honra!</h4>
                <p className="text-xs text-emerald-200">
                  Execute no seu posto agora. Ao final do turno você sentirá a diferença!
                </p>
              </div>
            ) : null}

            <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-white/10">
              <button
                type="button"
                onClick={() => setView('menu')}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-300 hover:text-white transition cursor-pointer"
              >
                Voltar ao Menu
              </button>

              {!hasAcceptedChallenge ? (
                <button
                  type="button"
                  onClick={() => {
                    setHasAcceptedChallenge(true);
                    confetti({ particleCount: 110, spread: 90, origin: { y: 0.6 } });
                    onSpeak("Missão aceita! Excelente atitude guerreiro Kaizen! Aplique no seu posto e tenha um ótimo turno!");
                  }}
                  className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 text-xs sm:text-sm font-extrabold transition shadow-lg shadow-emerald-500/25 cursor-pointer flex items-center gap-2"
                >
                  <Trophy className="w-4 h-4 text-slate-950" />
                  Aceitar Desafio!
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => {
                    setView('canal_kaizen');
                    setIdeaPhase('input');
                  }}
                  className="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs sm:text-sm font-bold transition shadow-lg shadow-amber-500/25 cursor-pointer flex items-center gap-2"
                >
                  <Lightbulb className="w-4 h-4" />
                  Cadastrar Melhoria no Posto
                </button>
              )}
            </div>
          </motion.div>
        )}

        {/* ========================================================================= */}
        {/* SUBVIEW 4: CONVERSAR COM O SENSEI IA                                      */}
        {/* ========================================================================= */}
        {activeView === 'chat' && (
          <motion.div
            key="view_chat"
            initial={{ opacity: 0, y: 15, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -15, scale: 0.98 }}
            className="bg-slate-900/90 backdrop-blur-2xl border border-white/15 rounded-3xl p-5 sm:p-7 shadow-2xl relative overflow-hidden"
          >
            <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-purple-500 via-indigo-500 to-cyan-400" />

            <div className="flex items-center justify-between gap-3 mb-4">
              <div className="flex items-center gap-2">
                <span className="p-2 rounded-xl bg-purple-500/20 text-purple-400 border border-purple-500/30">
                  <Bot className="w-5 h-5" />
                </span>
                <div>
                  <h3 className="text-lg sm:text-xl font-bold text-white flex items-center gap-2">
                    Tirar Dúvidas com o Sensei IA
                  </h3>
                  <p className="text-xs text-purple-300">
                    Respostas sábias com áudio falado • Pergunte por voz ou digite
                  </p>
                </div>
              </div>
            </div>

            {/* Quick Consultation Chips */}
            <div className="mb-4">
              <span className="block text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-2">
                Perguntas Frequentes do Chão de Fábrica:
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {[
                  "Como organizar minha bancada com 5S?",
                  "O que é Poka-Yoke na prática?",
                  "Como identificar desperdícios de tempo?",
                  "Dica de segurança para o turno de hoje"
                ].map((q, idx) => (
                  <button
                    key={idx}
                    onClick={() => {
                      setChatInput(q);
                      handleAskSensei(q);
                    }}
                    className="p-2.5 rounded-xl bg-slate-950/60 hover:bg-purple-500/15 border border-white/10 hover:border-purple-500/40 text-left text-xs text-slate-200 hover:text-purple-300 transition cursor-pointer flex items-center justify-between"
                  >
                    <span>{q}</span>
                    <ArrowRight className="w-3.5 h-3.5 text-slate-500 shrink-0 ml-1" />
                  </button>
                ))}
              </div>
            </div>

            {/* Sensei Audio Speech Bubble Response Display */}
            {aiResponse && (
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-slate-950/80 border border-purple-500/40 rounded-2xl p-4 sm:p-5 mb-4 relative shadow-lg shadow-purple-500/10"
              >
                <div className="flex items-center justify-between gap-2 mb-2 text-purple-400 text-xs font-bold uppercase tracking-wider">
                  <span className="flex items-center gap-1.5">
                    <Volume2 className="w-4 h-4 text-purple-400 animate-pulse" />
                    O Sensei Responde:
                  </span>
                  <button
                    onClick={() => onSpeak(aiResponse)}
                    className="text-[11px] text-purple-400 hover:text-purple-300 hover:underline cursor-pointer flex items-center gap-1"
                  >
                    Repetir Voz 🔊
                  </button>
                </div>
                <p className="text-slate-100 text-sm sm:text-base leading-relaxed font-medium">
                  &ldquo;{aiResponse}&rdquo;
                </p>
              </motion.div>
            )}

            {/* Input Bar */}
            <div className="flex items-center gap-2 pt-1">
              <input
                type="text"
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleAskSensei()}
                placeholder="Pergunte ao Sensei... (ex: como evitar peças com defeito?)"
                className="flex-1 bg-slate-950/70 border border-white/10 rounded-2xl px-4 py-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-purple-400 transition"
              />

              <button
                type="button"
                onClick={toggleSpeechForChat}
                className={`p-3 rounded-2xl border transition cursor-pointer ${
                  isChatListening
                    ? 'bg-red-500/20 border-red-500 text-red-400 animate-pulse'
                    : 'bg-slate-800/80 border-white/10 text-slate-300 hover:text-purple-300 hover:border-purple-500/40'
                }`}
                title={isChatListening ? "Ouvindo... Toque para parar" : "Falar no microfone"}
              >
                {isChatListening ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
              </button>

              <button
                type="button"
                onClick={() => handleAskSensei()}
                disabled={isAiLoading || !chatInput.trim()}
                className="px-5 py-3 rounded-2xl bg-purple-500 hover:bg-purple-400 disabled:opacity-40 text-white font-bold transition cursor-pointer flex items-center gap-1.5 shadow-lg shadow-purple-500/25"
              >
                {isAiLoading ? (
                  <RefreshCw className="w-4 h-4 animate-spin text-white" />
                ) : (
                  <Send className="w-4 h-4 text-white" />
                )}
              </button>
            </div>
          </motion.div>
        )}

        {/* ========================================================================= */}
        {/* SUBVIEW 5: BANCO DE IDEIAS DO TOTEN                                       */}
        {/* ========================================================================= */}
        {activeView === 'lista_ideias' && (
          <motion.div
            key="view_lista_ideias"
            initial={{ opacity: 0, y: 15, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -15, scale: 0.98 }}
            className="bg-slate-900/90 backdrop-blur-2xl border border-white/15 rounded-3xl p-5 sm:p-7 shadow-2xl relative overflow-hidden"
          >
            <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-cyan-400 via-blue-500 to-amber-400" />

            <div className="flex items-center justify-between gap-3 mb-4">
              <div className="flex items-center gap-2">
                <span className="p-2 rounded-xl bg-cyan-500/20 text-cyan-400 border border-cyan-500/30">
                  <ListFilter className="w-5 h-5" />
                </span>
                <div>
                  <h3 className="text-lg sm:text-xl font-bold text-white">
                    Banco de Ideias do Canal Kaizen
                  </h3>
                  <p className="text-xs text-slate-400">
                    Propostas cadastradas pelos operadores no toten
                  </p>
                </div>
              </div>

              <button
                onClick={() => {
                  setView('canal_kaizen');
                  setIdeaPhase('input');
                }}
                className="px-3.5 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs transition cursor-pointer flex items-center gap-1.5 shadow-md shadow-amber-500/20"
              >
                <Lightbulb className="w-3.5 h-3.5" /> Nova Ideia
              </button>
            </div>

            {registeredIdeas.length === 0 ? (
              <div className="text-center py-10 bg-slate-950/40 rounded-2xl border border-white/5">
                <Lightbulb className="w-10 h-10 text-slate-600 mx-auto mb-2" />
                <h4 className="text-sm font-bold text-white mb-1">Nenhuma ideia cadastrada ainda</h4>
                <p className="text-xs text-slate-400 mb-4 max-w-sm mx-auto">
                  Seja o primeiro a enviar uma proposta de melhoria contínua usando a voz ou o teclado!
                </p>
                <button
                  onClick={() => {
                    setView('canal_kaizen');
                    setIdeaPhase('input');
                  }}
                  className="px-4 py-2 rounded-xl bg-amber-500 text-slate-950 font-bold text-xs hover:bg-amber-400 transition cursor-pointer"
                >
                  Cadastrar Primeira Ideia
                </button>
              </div>
            ) : (
              <div className="space-y-2.5 max-h-[46vh] overflow-y-auto pr-1">
                {registeredIdeas.map((idea) => (
                  <div
                    key={idea.id}
                    className="p-3.5 rounded-2xl bg-slate-950/60 border border-white/10 hover:border-cyan-500/40 transition"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2 mb-1.5">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-mono font-bold text-cyan-400 bg-cyan-950/60 border border-cyan-500/30 px-2 py-0.5 rounded">
                          {idea.protocol}
                        </span>
                        <span className="text-[11px] font-semibold text-amber-300 bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded">
                          {idea.category}
                        </span>
                      </div>
                      <span className="text-[11px] text-slate-500 flex items-center gap-1">
                        <Clock className="w-3 h-3" /> {idea.createdAt}
                      </span>
                    </div>

                    <h4 className="text-sm font-bold text-white mb-1">
                      {idea.title}
                    </h4>

                    <p className="text-xs text-slate-300 mb-2 leading-relaxed">
                      <strong className="text-emerald-400">Solução:</strong> {idea.solution}
                    </p>

                    <div className="flex items-center justify-between text-[11px] text-slate-400 pt-2 border-t border-white/5">
                      <span>Autor: <strong className="text-slate-300">{idea.authorName || 'Anônimo'}</strong> ({idea.department})</span>
                      <span className="text-emerald-400 font-semibold bg-emerald-500/10 px-2 py-0.5 rounded">
                        ✓ {idea.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </motion.div>
        )}

      </AnimatePresence>
    </div>
  );
}
