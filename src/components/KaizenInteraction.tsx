"use client";

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import confetti from 'canvas-confetti';
import { SenseiState, CanalKaizenIdea } from '../types';
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
  MessageSquare,
  Bot,
  Volume2,
  ArrowRight
} from 'lucide-react';

interface KaizenInteractionProps {
  personDetected?: boolean;
  onSpeak: (text: string) => void;
  onStateChange: (state: SenseiState) => void;
  onReturnToIdle: () => void;
}

export function KaizenInteraction({ 
  personDetected = true, 
  onSpeak, 
  onStateChange, 
  onReturnToIdle 
}: KaizenInteractionProps) {
  // Navigation tabs: 'idea' (Canal Kaizen), 'chat' (Sensei IA), 'list' (Ideias Cadastradas)
  const [activeTab, setActiveTab] = useState<'idea' | 'chat' | 'list'>('idea');

  // ==========================================
  // CANAL KAIZEN (IDEAS) STATES
  // ==========================================
  const [ideaPhase, setIdeaPhase] = useState<'input' | 'review' | 'success'>('input');
  const [rawIdeaInput, setRawIdeaInput] = useState('');
  const [isVoiceRecording, setIsVoiceRecording] = useState(false);
  const [isStructuring, setIsStructuring] = useState(false);

  // Form fields for review & confirmation
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

  // Recognition reference
  const recognitionRef = useRef<any>(null);

  // Refs for callbacks to prevent unnecessary effect triggers
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

    // 1. Confetti explosion
    confetti({
      particleCount: 80,
      spread: 75,
      origin: { y: 0.45 }
    });
    setTimeout(() => {
      confetti({
        particleCount: 45,
        spread: 90,
        origin: { y: 0.5 }
      });
    }, 200);

    onStateChangeRef.current('celebrating');

    // 2. Energetic welcome phrases
    const greetings = [
      "Ei você aí! Sabe o que é Kaizen? Vem aqui que posso te ensinar!",
      "Aha, te vi! O Sensei preparou novidades para o seu turno de hoje!",
      "Vem aqui, campeão! Tem alguma ideia ou dúvida sobre melhoria contínua?",
      "Parado aí! O Sensei está a postos para receber sua sugestão de melhoria!"
    ];
    const randomGreeting = greetings[Math.floor(Math.random() * greetings.length)];

    onSpeakRef.current(`${randomGreeting} Cadastre sua ideia no Canal Kaizen ou converse com o Sensei!`);

    setTimeout(() => {
      onStateChangeRef.current('idea');
    }, 2000);
  }, []);

  // Synchronize Mascot sprite with the active view
  useEffect(() => {
    if (!hasCelebratedRef.current) return;

    if (activeTab === 'idea') {
      if (ideaPhase === 'success') {
        onStateChangeRef.current('success');
      } else {
        onStateChangeRef.current('idea');
      }
    } else if (activeTab === 'chat') {
      onStateChangeRef.current('interacting');
    } else {
      onStateChangeRef.current('interacting');
    }
  }, [activeTab, ideaPhase]);

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
  // AUTOMATIC IDEA STRUCTURING
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
        // Fallback structuring
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

  // Toggle Voice Recording for Canal Kaizen Idea
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
      // Automatically triggers proposal structuring without extra clicks!
      structureIdeaProposal(transcript);
    };

    recognition.onerror = (e: any) => {
      console.warn("Speech error:", e);
      setIsVoiceRecording(false);
    };
    recognition.onend = () => setIsVoiceRecording(false);
    recognitionRef.current = recognition;

    try {
      setIsVoiceRecording(true);
      recognition.start();
    } catch (err) {
      setIsVoiceRecording(false);
    }
  }, [isVoiceRecording]);

  // Submit Finalized Idea
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

    onSpeak(`Parabéns! Sua ideia foi cadastrada no Canal Kaizen sob o protocolo ${newProtocol}! Obrigado por construir uma fábrica melhor!`);
  };

  // ==========================================
  // SENSEI IA CHAT / CONSULTATION
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

  // Voice recording for Sensei IA Chat
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
      
      {/* Top Bar: Clean Status + Direct Segmented Navigation + Conclude */}
      <div className="flex flex-wrap items-center justify-between gap-2.5 mb-3 bg-slate-900/90 backdrop-blur-xl border border-white/10 px-3 sm:px-4 py-2 rounded-2xl shadow-xl">
        {/* Presence indicator */}
        <div className="flex items-center gap-2">
          <span className={`w-2.5 h-2.5 rounded-full ${personDetected ? 'bg-emerald-400 shadow-[0_0_10px_#34d399] animate-pulse' : 'bg-amber-400'}`} />
          <span className="text-xs font-semibold text-slate-300">
            {personDetected ? 'Operador Presente' : 'Aguardando Operador...'}
          </span>
        </div>

        {/* Center: Clean 3-Tab Segmented Switcher */}
        <div className="flex items-center gap-1.5 p-1 rounded-xl bg-slate-950/70 border border-white/10 text-xs">
          {/* TAB 1: CANAL KAIZEN (HERO HIGHLIGHT) */}
          <button
            onClick={() => {
              setActiveTab('idea');
              setIdeaPhase('input');
            }}
            className={`px-3 py-1.5 rounded-lg font-bold transition flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'idea'
                ? 'bg-gradient-to-r from-amber-500 to-yellow-500 text-slate-950 shadow-[0_0_15px_rgba(245,158,11,0.4)]'
                : 'text-amber-400 hover:text-amber-300 hover:bg-white/5'
            }`}
          >
            <Lightbulb className="w-4 h-4 shrink-0" />
            <span>Cadastrar Ideia</span>
          </button>

          {/* TAB 2: SENSEI IA CHAT */}
          <button
            onClick={() => setActiveTab('chat')}
            className={`px-3 py-1.5 rounded-lg font-semibold transition flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'chat'
                ? 'bg-cyan-500 text-slate-950 font-bold shadow-[0_0_15px_rgba(6,182,212,0.4)]'
                : 'text-cyan-300 hover:text-white hover:bg-white/5'
            }`}
          >
            <Bot className="w-4 h-4 shrink-0" />
            <span>Falar com Sensei IA</span>
          </button>

          {/* TAB 3: REGISTERED IDEAS LIST */}
          <button
            onClick={() => setActiveTab('list')}
            className={`px-2.5 py-1.5 rounded-lg font-medium transition flex items-center gap-1 cursor-pointer ${
              activeTab === 'list'
                ? 'bg-slate-800 text-white font-bold border border-white/15'
                : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
            }`}
          >
            <ListFilter className="w-3.5 h-3.5 shrink-0" />
            <span className="hidden sm:inline">Ideias</span> ({registeredIdeas.length})
          </button>
        </div>

        {/* Right: Quick Conclude Session */}
        <button
          onClick={onReturnToIdle}
          className="px-3 py-1.5 rounded-xl bg-slate-800/80 hover:bg-red-500/20 border border-white/10 hover:border-red-500/40 text-xs font-semibold text-slate-300 hover:text-red-300 transition flex items-center gap-1 cursor-pointer"
          title="Encerrar sessão interativa"
        >
          <X className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Encerrar</span>
        </button>
      </div>

      <AnimatePresence mode="wait">
        
        {/* ========================================================================= */}
        {/* TAB 1: CANAL KAIZEN (CADASTRAR IDEIA) - CLEAN, DIRECT & ACCESSIBLE        */}
        {/* ========================================================================= */}
        {activeTab === 'idea' && (
          <motion.div
            key="tab_idea"
            initial={{ opacity: 0, y: 12, scale: 0.99 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -12, scale: 0.99 }}
            className="bg-slate-900/90 backdrop-blur-2xl border border-white/15 rounded-3xl p-5 sm:p-7 shadow-2xl relative overflow-hidden"
          >
            {/* Top Glowing Amber Line */}
            <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-amber-400 via-yellow-400 to-amber-500" />

            {/* PHASE 1: INPUT BY VOICE OR TYPING */}
            {ideaPhase === 'input' && (
              <div>
                {/* Header */}
                <div className="text-center max-w-2xl mx-auto mb-6">
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-amber-500/15 text-amber-400 border border-amber-500/30 mb-2">
                    <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                    Canal Kaizen • Sua Ideia Valorizada
                  </div>
                  <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
                    O que podemos melhorar no seu posto de trabalho hoje?
                  </h2>
                  <p className="text-xs sm:text-sm text-slate-300 mt-1">
                    Toque no microfone e fale livremente. O <strong className="text-amber-300">Sensei IA</strong> interpreta sua voz e estrutura a proposta automaticamente!
                  </p>
                </div>

                {/* Big Glowing Voice Record Button Hero */}
                <div className="bg-slate-950/70 border border-white/10 rounded-3xl p-6 sm:p-8 text-center mb-5 relative overflow-hidden">
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
                        Toque no botão e diga qual problema você viu ou como gostaria de resolver.
                      </p>
                    )}
                  </div>
                </div>

                {/* Direct Typing Alternative */}
                {!isStructuring && (
                  <div className="space-y-3">
                    <div className="relative">
                      <textarea
                        value={rawIdeaInput}
                        onChange={(e) => setRawIdeaInput(e.target.value)}
                        placeholder="Ou digite sua sugestão aqui... (ex: na linha 3 falta suporte para o leitor de código de barras, isso atrasa o bip das peças)"
                        rows={2}
                        className="w-full bg-slate-950/70 border border-white/10 rounded-2xl p-3.5 text-white placeholder-slate-500 text-xs sm:text-sm focus:outline-none focus:border-amber-400 transition"
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-[11px] text-slate-400">
                        ⚡ Ideias práticas e simples são as mais bem avaliadas no comitê.
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

            {/* PHASE 2: REVIEW & EDIT (CLEAN PROPOSAL CARD) */}
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

                {/* Original Audio Transcription */}
                {rawIdeaInput && (
                  <div className="bg-slate-950/60 border border-white/5 rounded-xl px-3.5 py-2 text-xs text-slate-400">
                    <span className="font-semibold text-slate-300 block mb-0.5">🎙️ O que você disse:</span>
                    <span className="italic text-slate-300">&ldquo;{rawIdeaInput}&rdquo;</span>
                  </div>
                )}

                {/* Title & Category Grid */}
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

                {/* Problem Description */}
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

                {/* Solution */}
                <div>
                  <label className="block text-xs font-semibold text-emerald-300 mb-1">
                    Solução Proposta (Ação Prática):
                  </label>
                  <textarea
                    value={ideaSolution}
                    onChange={(e) => setIdeaSolution(e.target.value)}
                    rows={2}
                    required
                    className="w-full bg-slate-950/70 border border-white/10 rounded-xl p-3 text-xs sm:text-sm text-white focus:outline-none focus:border-emerald-400"
                  />
                </div>

                {/* Benefits */}
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

                {/* Author & Department */}
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

                {/* Action Buttons */}
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
                    Confirmar e Cadastrar no Canal Kaizen
                  </button>
                </div>
              </form>
            )}

            {/* PHASE 3: SUCCESS CONFIRMATION */}
            {ideaPhase === 'success' && lastSubmittedIdea && (
              <div className="text-center py-4">
                <div className="w-16 h-16 rounded-full bg-emerald-500/20 border-2 border-emerald-400 flex items-center justify-center mx-auto mb-3 shadow-[0_0_25px_rgba(52,211,153,0.35)]">
                  <CheckCircle2 className="w-9 h-9 text-emerald-400" />
                </div>

                <h3 className="text-xl sm:text-2xl font-bold text-white mb-1">
                  Ideia Registrada com Sucesso!
                </h3>
                
                <div className="inline-block px-4 py-1.5 rounded-full bg-cyan-950 border border-cyan-500/40 text-cyan-300 font-mono font-bold text-sm my-2 shadow-md">
                  Protocolo: {lastSubmittedIdea.protocol}
                </div>

                <p className="text-xs sm:text-sm text-slate-300 max-w-lg mx-auto mb-5 leading-relaxed">
                  Obrigado, <strong className="text-white">{lastSubmittedIdea.authorName}</strong>! Sua proposta foi enviada diretamente para a comissão de melhorias contínuas.
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
                    onClick={() => setActiveTab('list')}
                    className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs sm:text-sm font-semibold transition cursor-pointer flex items-center gap-1.5"
                  >
                    <ListFilter className="w-4 h-4 text-cyan-400" /> Ver Banco de Ideias
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
        {/* TAB 2: CONVERSAR COM SENSEI IA - DIRECT, FAST & INSPIRATIONAL             */}
        {/* ========================================================================= */}
        {activeTab === 'chat' && (
          <motion.div
            key="tab_chat"
            initial={{ opacity: 0, y: 12, scale: 0.99 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -12, scale: 0.99 }}
            className="bg-slate-900/90 backdrop-blur-2xl border border-white/15 rounded-3xl p-5 sm:p-7 shadow-2xl relative overflow-hidden"
          >
            <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-cyan-400 via-blue-500 to-cyan-400" />

            {/* Header */}
            <div className="flex items-center justify-between gap-3 mb-4">
              <div className="flex items-center gap-2">
                <span className="p-2 rounded-xl bg-cyan-500/20 text-cyan-400 border border-cyan-500/30">
                  <Bot className="w-5 h-5" />
                </span>
                <div>
                  <h3 className="text-lg sm:text-xl font-bold text-white flex items-center gap-2">
                    Sensei IA • Consultor Kaizen & 5S
                  </h3>
                  <p className="text-xs text-cyan-300">
                    Respostas sábias com áudio falado • Pergunte por voz ou texto
                  </p>
                </div>
              </div>

              <button
                onClick={() => {
                  setActiveTab('idea');
                  setIdeaPhase('input');
                }}
                className="px-3 py-1.5 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/40 text-amber-300 text-xs font-bold transition cursor-pointer flex items-center gap-1.5"
              >
                <Lightbulb className="w-3.5 h-3.5 text-amber-400" />
                <span>Canal Kaizen</span>
              </button>
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
                    className="p-2.5 rounded-xl bg-slate-950/60 hover:bg-cyan-500/15 border border-white/10 hover:border-cyan-500/40 text-left text-xs text-slate-200 hover:text-cyan-300 transition cursor-pointer flex items-center justify-between"
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
                className="bg-slate-950/80 border border-cyan-500/40 rounded-2xl p-4 sm:p-5 mb-4 relative shadow-lg shadow-cyan-500/10"
              >
                <div className="flex items-center justify-between gap-2 mb-2 text-cyan-400 text-xs font-bold uppercase tracking-wider">
                  <span className="flex items-center gap-1.5">
                    <Volume2 className="w-4 h-4 text-cyan-400 animate-pulse" />
                    O Sensei Responde:
                  </span>
                  <button
                    onClick={() => onSpeak(aiResponse)}
                    className="text-[11px] text-cyan-400 hover:text-cyan-300 hover:underline cursor-pointer flex items-center gap-1"
                  >
                    Repetir Voz 🔊
                  </button>
                </div>
                <p className="text-slate-100 text-sm sm:text-base leading-relaxed font-medium">
                  &ldquo;{aiResponse}&rdquo;
                </p>
              </motion.div>
            )}

            {/* Input Bar: Voice Microphone + Text + Send */}
            <div className="flex items-center gap-2 pt-1">
              <input
                type="text"
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleAskSensei()}
                placeholder="Pergunte ao Sensei... (ex: como evitar retrabalho na esteira?)"
                className="flex-1 bg-slate-950/70 border border-white/10 rounded-2xl px-4 py-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400 transition"
              />

              <button
                type="button"
                onClick={toggleSpeechForChat}
                className={`p-3 rounded-2xl border transition cursor-pointer ${
                  isChatListening
                    ? 'bg-red-500/20 border-red-500 text-red-400 animate-pulse'
                    : 'bg-slate-800/80 border-white/10 text-slate-300 hover:text-cyan-300 hover:border-cyan-500/40'
                }`}
                title={isChatListening ? "Ouvindo... Toque para parar" : "Falar pergunta no microfone"}
              >
                {isChatListening ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
              </button>

              <button
                type="button"
                onClick={() => handleAskSensei()}
                disabled={isAiLoading || !chatInput.trim()}
                className="px-5 py-3 rounded-2xl bg-cyan-500 hover:bg-cyan-400 disabled:opacity-40 text-slate-950 font-bold transition cursor-pointer flex items-center gap-1.5 shadow-lg shadow-cyan-500/25"
              >
                {isAiLoading ? (
                  <RefreshCw className="w-4 h-4 animate-spin text-slate-950" />
                ) : (
                  <Send className="w-4 h-4 text-slate-950" />
                )}
              </button>
            </div>
          </motion.div>
        )}

        {/* ========================================================================= */}
        {/* TAB 3: BANCO DE IDEIAS (LISTA DE PROPOSTAS DO TOTEN)                       */}
        {/* ========================================================================= */}
        {activeTab === 'list' && (
          <motion.div
            key="tab_list"
            initial={{ opacity: 0, y: 12, scale: 0.99 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -12, scale: 0.99 }}
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
                  setActiveTab('idea');
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
                    setActiveTab('idea');
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
