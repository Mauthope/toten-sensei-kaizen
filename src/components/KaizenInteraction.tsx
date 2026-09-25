"use client";

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import confetti from 'canvas-confetti';
import { DYNAMIC_HOOKS, KAIZEN_PILLS, DynamicHook, DynamicHookOption } from '../lib/kaizenData';
import { SenseiState, CanalKaizenIdea } from '../types';
import { 
  Sparkles, 
  CheckCircle2, 
  BookOpen, 
  Lightbulb, 
  RefreshCw, 
  Trophy, 
  ArrowRight, 
  Bot, 
  Send, 
  Mic, 
  MicOff, 
  Flame, 
  Compass, 
  X, 
  Wand2, 
  ListFilter, 
  Clock, 
  User, 
  Building2, 
  Check, 
  ChevronRight,
  HelpCircle,
  FileCheck
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
  // Navigation steps:
  // 'hook': Dynamic attention-grabber question (relatable workplace problem)
  // 'intro': Sensei introduces Kaizen/5S connecting to the user's specific answer
  // 'canal_kaizen': Idea registration with Voice + Gemini AI refinement
  // 'canal_kaizen_list': View previously registered ideas
  // 'pill': Detailed Kaizen & 5S Pills
  // 'challenge': 2-minute 5S Turn Challenge
  // 'gemini': Conversational AI with Google Gemini
  const [step, setStep] = useState<
    'hook' | 'intro' | 'canal_kaizen' | 'canal_kaizen_list' | 'pill' | 'challenge' | 'gemini'
  >('hook');

  // Currently active dynamic hook
  const [currentHook, setCurrentHook] = useState<DynamicHook>(DYNAMIC_HOOKS[0]);
  const [selectedOption, setSelectedOption] = useState<DynamicHookOption | null>(null);
  const [selectedPillIndex, setSelectedPillIndex] = useState(0);

  // Gemini AI Chat states
  const [chatInput, setChatInput] = useState('');
  const [aiResponse, setAiResponse] = useState<string | null>(null);
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [chatListening, setChatListening] = useState(false);
  const recognitionRef = useRef<any>(null);

  // ==========================================
  // CANAL KAIZEN (IDEAS) STATES
  // ==========================================
  const [rawIdeaVoice, setRawIdeaVoice] = useState('');
  const [isVoiceRecordingIdea, setIsVoiceRecordingIdea] = useState(false);
  const [isRefiningWithAi, setIsRefiningWithAi] = useState(false);
  const [ideaPhase, setIdeaPhase] = useState<'input' | 'review' | 'success'>('input');
  
  // Refined Idea Form fields (editable by user)
  const [ideaTitle, setIdeaTitle] = useState('');
  const [ideaCategory, setIdeaCategory] = useState('5S & Organização');
  const [ideaProblem, setIdeaProblem] = useState('');
  const [ideaSolution, setIdeaSolution] = useState('');
  const [ideaBenefits, setIdeaBenefits] = useState('');
  const [ideaAuthor, setIdeaAuthor] = useState('');
  const [ideaDepartment, setIdeaDepartment] = useState('Chão de Fábrica');
  const [lastSubmittedIdea, setLastSubmittedIdea] = useState<CanalKaizenIdea | null>(null);
  const [registeredIdeas, setRegisteredIdeas] = useState<CanalKaizenIdea[]>([]);

  // Callbacks stored in refs to avoid re-triggering effects on parent re-renders
  const onReturnToIdleRef = useRef(onReturnToIdle);
  onReturnToIdleRef.current = onReturnToIdle;

  const onSpeakRef = useRef(onSpeak);
  onSpeakRef.current = onSpeak;

  const onStateChangeRef = useRef(onStateChange);
  onStateChangeRef.current = onStateChange;

  const hasCelebratedRef = useRef(false);

  // Load existing ideas from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem('toten_canal_kaizen_ideas');
      if (stored) {
        setRegisteredIdeas(JSON.parse(stored));
      }
    } catch (e) {
      console.warn("Could not load ideas from localStorage:", e);
    }
  }, []);

  // Party celebration & dynamic greeting on detection - RUNS STRICTLY ONCE ON MOUNT
  useEffect(() => {
    if (hasCelebratedRef.current) return;
    hasCelebratedRef.current = true;

    // 1. Party celebration bursts (confetti!)
    confetti({
      particleCount: 80,
      spread: 75,
      origin: { y: 0.45 }
    });
    setTimeout(() => {
      confetti({
        particleCount: 50,
        spread: 90,
        origin: { y: 0.5 }
      });
    }, 200);

    onStateChangeRef.current('celebrating');

    // 2. Energetic Party greetings
    const partyGreetings = [
      "Ei você aí! Sabe o que é Kaizen?",
      "Vem aqui, posso te ensinar!",
      "Tem alguma dúvida sobre melhoria contínua?",
      "Aha, te vi! O Sensei preparou uma novidade pro seu turno!",
      "Parado aí, campeão! Chega mais perto da tela!"
    ];
    const randomParty = partyGreetings[Math.floor(Math.random() * partyGreetings.length)];

    const randomIdx = Math.floor(Math.random() * DYNAMIC_HOOKS.length);
    const chosenHook = DYNAMIC_HOOKS[randomIdx];
    setCurrentHook(chosenHook);
    setStep('hook');
    setSelectedOption(null);

    // Speak dynamic celebration phrase + question once
    onSpeakRef.current(`${randomParty} ${chosenHook.calloutSpeech}`);

    setTimeout(() => {
      onStateChangeRef.current('interacting');
    }, 1800);
  }, []);

  // Dynamically synchronize mascot sprite with active interaction context
  useEffect(() => {
    if (!hasCelebratedRef.current) return;

    if (step === 'canal_kaizen') {
      if (ideaPhase === 'success') {
        onStateChangeRef.current('success');
      } else {
        onStateChangeRef.current('idea');
      }
    } else if (step === 'hook' || step === 'intro' || step === 'gemini' || step === 'pill') {
      onStateChangeRef.current('interacting');
    }
  }, [step, ideaPhase]);

  // Web Speech Recognition for Chat & Canal Kaizen Voice
  const startSpeechForChat = useCallback(() => {
    if (typeof window === 'undefined') return;
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert("Reconhecimento de voz não suportado neste navegador. Digite no campo abaixo!");
      return;
    }

    if (chatListening) {
      recognitionRef.current?.stop();
      setChatListening(false);
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = 'pt-BR';
    recognition.continuous = false;
    recognition.interimResults = false;

    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      setChatInput(transcript);
      setChatListening(false);
      handleAskGemini(transcript);
    };

    recognition.onerror = () => setChatListening(false);
    recognition.onend = () => setChatListening(false);
    recognitionRef.current = recognition;

    try {
      setChatListening(true);
      recognition.start();
    } catch (err) {
      setChatListening(false);
    }
  }, [chatListening]);

  // Voice recording specifically for CANAL KAIZEN idea capture
  const toggleVoiceRecordingForIdea = useCallback(() => {
    if (typeof window === 'undefined') return;
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert("Reconhecimento de voz não suportado neste navegador. Você pode digitar sua ideia!");
      return;
    }

    if (isVoiceRecordingIdea) {
      recognitionRef.current?.stop();
      setIsVoiceRecordingIdea(false);
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = 'pt-BR';
    recognition.continuous = false;
    recognition.interimResults = false;

    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      setRawIdeaVoice(transcript);
      setIsVoiceRecordingIdea(false);
      // Automatically trigger AI refinement of voice!
      refineIdeaWithGemini(transcript);
    };

    recognition.onerror = (e: any) => {
      console.warn("Speech recognition error:", e);
      setIsVoiceRecordingIdea(false);
    };
    recognition.onend = () => setIsVoiceRecordingIdea(false);
    recognitionRef.current = recognition;

    try {
      setIsVoiceRecordingIdea(true);
      recognition.start();
    } catch (err) {
      setIsVoiceRecordingIdea(false);
    }
  }, [isVoiceRecordingIdea]);

  // Refine Idea with Gemini AI (Interprets broken/colloquial voice and structures proposal)
  const refineIdeaWithGemini = async (textToRefine: string) => {
    if (!textToRefine.trim()) return;

    setIsRefiningWithAi(true);
    onStateChange('interacting');

    try {
      const res = await fetch('/api/sensei', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'refine_idea',
          rawText: textToRefine
        })
      });

      const json = await res.json();
      if (json.success && json.data) {
        const d = json.data;
        setIdeaTitle(d.title || 'Melhoria no Posto de Trabalho');
        setIdeaCategory(d.category || '5S & Organização');
        setIdeaProblem(d.problem || textToRefine);
        setIdeaSolution(d.solution || 'Ajuste de procedimento ou instalação de dispositivo.');
        setIdeaBenefits(d.benefits || 'Maior agilidade, segurança e qualidade no turno.');
        
        setIdeaPhase('review');

        if (d.senseiEncouragement) {
          onSpeak(d.senseiEncouragement);
        } else {
          onSpeak("Ideia interpretada com sucesso! Dê uma olhada na proposta estruturada e confirme o envio.");
        }
      } else {
        // Fallback structuring
        setIdeaTitle(`Melhoria Kaizen: ${textToRefine.slice(0, 35)}...`);
        setIdeaProblem(textToRefine);
        setIdeaSolution("Padronizar e ajustar conforme necessidade do posto.");
        setIdeaBenefits("Mais segurança e agilidade no turno.");
        setIdeaPhase('review');
      }
    } catch (err) {
      console.warn("Erro ao refinar ideia:", err);
      setIdeaTitle(`Melhoria: ${textToRefine.slice(0, 30)}...`);
      setIdeaProblem(textToRefine);
      setIdeaSolution("Implementar melhoria sugerida pelo operador.");
      setIdeaBenefits("Otimização de processo.");
      setIdeaPhase('review');
    } finally {
      setIsRefiningWithAi(false);
    }
  };

  // Submit Finalized Kaizen Idea
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
      rawVoiceInput: rawIdeaVoice || undefined,
      authorName: ideaAuthor || 'Colaborador Anônimo',
      department: ideaDepartment || 'Chão de Fábrica',
      createdAt: new Date().toLocaleString('pt-BR'),
      status: 'Em Análise',
      senseiEncouragement: "Excelente contribuição para a melhoria contínua da empresa!"
    };

    const updated = [newIdea, ...registeredIdeas];
    setRegisteredIdeas(updated);
    try {
      localStorage.setItem('toten_canal_kaizen_ideas', JSON.stringify(updated));
    } catch (e) {
      console.warn("Failed saving to localStorage:", e);
    }

    setLastSubmittedIdea(newIdea);
    setIdeaPhase('success');

    confetti({
      particleCount: 110,
      spread: 85,
      origin: { y: 0.55 }
    });

    onSpeak(`Parabéns! Sua ideia foi cadastrada no Canal Kaizen com o protocolo ${newProtocol}! Obrigado por construir uma fábrica melhor!`);
  };

  // Ask Gemini Chat Question
  const handleAskGemini = async (questionText?: string) => {
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
        particleCount: 40,
        spread: 60,
        origin: { y: 0.6 }
      });
    } catch (err) {
      console.error("Erro ao chamar API Gemini:", err);
      const fallbackMsg = "O Sensei teve uma oscilação na rede, mas lembre-se: disciplina e 5S vencem qualquer obstáculo!";
      setAiResponse(fallbackMsg);
      onSpeak(fallbackMsg);
    } finally {
      setIsAiLoading(false);
    }
  };

  // User answered the dynamic hook question -> Introduce Kaizen now!
  const handleSelectHookOption = (option: DynamicHookOption) => {
    setSelectedOption(option);
    onSpeak(option.reactionSpeech);

    confetti({
      particleCount: 60,
      spread: 70,
      origin: { y: 0.6 }
    });

    onStateChange('interacting');
    setStep('intro');
  };

  const handleOpenRecommendedPill = () => {
    if (selectedOption?.recommendedPillId) {
      const pIdx = KAIZEN_PILLS.findIndex(p => p.id === selectedOption.recommendedPillId);
      if (pIdx !== -1) {
        setSelectedPillIndex(pIdx);
      }
    }
    setStep('pill');
  };

  const handleNextPill = () => {
    const nextIdx = (selectedPillIndex + 1) % KAIZEN_PILLS.length;
    setSelectedPillIndex(nextIdx);
    onSpeak(`${KAIZEN_PILLS[nextIdx].title}. ${KAIZEN_PILLS[nextIdx].content}`);
  };

  return (
    <div className="w-full max-w-4xl mx-auto px-2 sm:px-4 z-20">
      
      {/* Top Session Bar: Live Presence Indicator & Quick Conclude Button */}
      <div className="flex items-center justify-between gap-2 mb-3 bg-slate-900/80 backdrop-blur-md border border-white/10 px-4 py-2 rounded-2xl shadow-lg">
        {/* Left: Presence Indicator */}
        <div className="flex items-center gap-2">
          <span className={`w-2.5 h-2.5 rounded-full ${personDetected ? 'bg-emerald-400 shadow-[0_0_10px_#34d399] animate-pulse' : 'bg-amber-400'}`} />
          <span className="text-xs font-semibold text-slate-300">
            {personDetected ? 'Operador Presente • Sessão Ativa' : 'Aguardando Operador...'}
          </span>
        </div>

        {/* Center: Navigation shortcuts */}
        <div className="hidden sm:flex items-center gap-1.5 text-xs">
          <button
            onClick={() => setStep('hook')}
            className={`px-3 py-1 rounded-lg transition font-medium cursor-pointer ${
              step === 'hook' ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40' : 'text-slate-400 hover:text-white'
            }`}
          >
            🎯 Início
          </button>
          
          <button
            onClick={() => {
              setStep('canal_kaizen');
              setIdeaPhase('input');
            }}
            className={`px-3 py-1 rounded-lg transition font-bold cursor-pointer flex items-center gap-1.5 ${
              step === 'canal_kaizen' || step === 'canal_kaizen_list'
                ? 'bg-gradient-to-r from-amber-500/30 to-purple-500/30 text-amber-300 border border-amber-400/50 shadow-[0_0_12px_rgba(245,158,11,0.25)]'
                : 'text-amber-400 hover:text-amber-300 bg-amber-500/10 border border-amber-500/20'
            }`}
          >
            <Lightbulb className="w-3.5 h-3.5 text-amber-400" />
            Canal Kaizen
          </button>

          <button
            onClick={() => setStep('gemini')}
            className={`px-3 py-1 rounded-lg transition font-medium cursor-pointer flex items-center gap-1.5 ${
              step === 'gemini' ? 'bg-purple-500/20 text-purple-300 border border-purple-500/40' : 'text-slate-400 hover:text-white'
            }`}
          >
            <Bot className="w-3.5 h-3.5" />
            Sensei IA
          </button>

          <button
            onClick={() => setStep('challenge')}
            className={`px-3 py-1 rounded-lg transition font-medium cursor-pointer flex items-center gap-1.5 ${
              step === 'challenge' ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40' : 'text-slate-400 hover:text-white'
            }`}
          >
            <Trophy className="w-3.5 h-3.5" />
            Desafio 5S
          </button>
        </div>

        {/* Right: Conclude session button (No rush! User decides or walks away) */}
        <button
          onClick={onReturnToIdle}
          className="px-3 py-1 rounded-lg bg-slate-800/80 hover:bg-red-500/20 border border-white/10 hover:border-red-500/40 text-xs font-semibold text-slate-300 hover:text-red-300 transition flex items-center gap-1.5 cursor-pointer shadow-sm"
          title="Encerrar sessão e voltar ao modo de descanso"
        >
          <X className="w-3.5 h-3.5 text-slate-400" />
          <span>Concluir</span>
        </button>
      </div>

      <AnimatePresence mode="wait">
        
        {/* STEP 1: DYNAMIC HOOK (Attention Grabber & Relatable Icebreaker) */}
        {step === 'hook' && (
          <motion.div
            key="hook"
            initial={{ opacity: 0, y: 15, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -15, scale: 0.98 }}
            className="bg-slate-900/90 backdrop-blur-xl border border-white/10 rounded-3xl p-6 sm:p-8 shadow-2xl relative overflow-hidden"
          >
            {/* Top Cyan Glowing Line */}
            <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-cyan-500 via-blue-500 to-cyan-500" />

            <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold tracking-wider uppercase bg-cyan-500/15 text-cyan-400 border border-cyan-500/30">
                <Flame className="w-3.5 h-3.5 text-cyan-400" />
                {currentHook.badge}
              </span>

              {/* Direct Canal Kaizen Action Button */}
              <button
                onClick={() => {
                  setStep('canal_kaizen');
                  setIdeaPhase('input');
                }}
                className="px-3.5 py-1.5 rounded-full text-xs font-bold bg-gradient-to-r from-amber-500/20 to-purple-500/20 text-amber-300 border border-amber-400/40 hover:border-amber-400 shadow-[0_0_15px_rgba(245,158,11,0.2)] transition cursor-pointer flex items-center gap-1.5"
              >
                <Lightbulb className="w-4 h-4 text-amber-400 animate-pulse" />
                💡 Cadastrar Ideia no Canal Kaizen
              </button>
            </div>

            <h2 className="text-xl sm:text-2xl font-bold text-white mb-2 tracking-tight">
              {currentHook.question}
            </h2>
            <p className="text-xs sm:text-sm text-slate-300 mb-5">
              Toque na opção que mais combina com a sua realidade no posto de trabalho:
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 mb-5">
              {currentHook.options.map((option, idx) => (
                <button
                  key={idx}
                  onClick={() => handleSelectHookOption(option)}
                  className="flex items-center justify-start text-left p-4 rounded-2xl bg-slate-800/80 hover:bg-cyan-500/15 border border-white/10 hover:border-cyan-500/50 text-white font-medium transition-all duration-200 group active:scale-98 cursor-pointer shadow-md hover:shadow-cyan-500/15"
                >
                  <span className="text-sm sm:text-base text-slate-200 group-hover:text-cyan-300 leading-snug">
                    {option.text}
                  </span>
                </button>
              ))}
            </div>

            {/* Bottom Actions Bar */}
            <div className="pt-4 border-t border-white/10 flex flex-wrap justify-between items-center gap-3 text-xs text-slate-400">
              <span className="flex items-center gap-1.5 text-slate-300">
                <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
                O Sensei aprende e interage em tempo real com seu turno
              </span>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    const nextHookIdx = (DYNAMIC_HOOKS.findIndex(h => h.id === currentHook.id) + 1) % DYNAMIC_HOOKS.length;
                    setCurrentHook(DYNAMIC_HOOKS[nextHookIdx]);
                    onSpeak(DYNAMIC_HOOKS[nextHookIdx].calloutSpeech);
                  }}
                  className="text-cyan-400 hover:text-cyan-300 hover:underline flex items-center gap-1 cursor-pointer font-medium"
                >
                  <RefreshCw className="w-3.5 h-3.5" /> Outra Pergunta
                </button>

                <button
                  onClick={() => setStep('gemini')}
                  className="px-2.5 py-1 rounded-lg bg-purple-500/20 text-purple-300 border border-purple-500/30 hover:bg-purple-500/30 transition cursor-pointer flex items-center gap-1 font-medium"
                >
                  <Bot className="w-3.5 h-3.5" /> Perguntar à IA
                </button>
              </div>
            </div>
          </motion.div>
        )}

        {/* STEP 2: METHODOLOGY INTRODUCTION */}
        {step === 'intro' && selectedOption && (
          <motion.div
            key="intro"
            initial={{ opacity: 0, y: 15, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -15, scale: 0.98 }}
            className="bg-slate-900/90 backdrop-blur-xl border border-white/10 rounded-3xl p-6 sm:p-8 shadow-2xl relative overflow-hidden"
          >
            <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-emerald-500 via-cyan-500 to-amber-500" />

            <div className="flex items-center justify-between gap-4 mb-3">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold tracking-wider uppercase bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                <Sparkles className="w-3.5 h-3.5" />
                A Solução Kaizen & 5S
              </span>
              <span className="text-xs text-slate-400">Filosofia de Produção</span>
            </div>

            {/* Sensei's Reaction Speech */}
            <div className="bg-cyan-500/10 border border-cyan-500/25 rounded-2xl p-4 mb-4">
              <p className="text-sm sm:text-base font-medium text-cyan-200 italic">
                &ldquo;{selectedOption.reactionSpeech}&rdquo;
              </p>
            </div>

            {/* Structured Methodology Explanation */}
            <div className="bg-slate-950/60 border border-white/5 rounded-2xl p-4 sm:p-5 mb-5 text-slate-200 text-xs sm:text-sm leading-relaxed">
              <h4 className="text-sm sm:text-base font-bold text-white mb-2 flex items-center gap-2">
                <Compass className="w-4 h-4 text-cyan-400" />
                Como a metodologia resolve isso na prática:
              </h4>
              <p className="text-slate-300">
                {selectedOption.methodologyIntro}
              </p>
            </div>

            {/* Next Action Choices */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-5">
              <button
                onClick={() => {
                  setStep('canal_kaizen');
                  setIdeaPhase('input');
                }}
                className="p-3.5 rounded-2xl bg-gradient-to-br from-amber-500/20 to-purple-500/20 hover:from-amber-500/30 hover:to-purple-500/30 border border-amber-400/40 text-amber-300 text-xs sm:text-sm font-bold transition cursor-pointer flex flex-col items-center justify-center text-center gap-1.5 shadow-md shadow-amber-500/10"
              >
                <Lightbulb className="w-5 h-5 text-amber-400" />
                <span>💡 Canal Kaizen (Cadastrar Ideia)</span>
              </button>

              <button
                onClick={handleOpenRecommendedPill}
                className="p-3.5 rounded-2xl bg-cyan-500/20 hover:bg-cyan-500/30 border border-cyan-500/40 text-cyan-300 text-xs sm:text-sm font-semibold transition cursor-pointer flex flex-col items-center justify-center text-center gap-1.5"
              >
                <BookOpen className="w-5 h-5" />
                <span>Ver Pílulas 5S</span>
              </button>

              <button
                onClick={() => setStep('challenge')}
                className="p-3.5 rounded-2xl bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/40 text-emerald-300 text-xs sm:text-sm font-semibold transition cursor-pointer flex flex-col items-center justify-center text-center gap-1.5"
              >
                <Trophy className="w-5 h-5 text-emerald-400" />
                <span>Desafio 5S (2 min)</span>
              </button>
            </div>

            <div className="pt-3 border-t border-white/10 flex justify-between items-center text-xs text-slate-400">
              <button
                onClick={() => setStep('hook')}
                className="text-slate-400 hover:text-white transition cursor-pointer font-medium"
              >
                ← Voltar à pergunta inicial
              </button>

              <button
                onClick={() => setStep('gemini')}
                className="text-purple-400 hover:text-purple-300 hover:underline flex items-center gap-1 cursor-pointer font-medium"
              >
                <Bot className="w-3.5 h-3.5" /> Tirar Dúvidas com Gemini IA
              </button>
            </div>
          </motion.div>
        )}

        {/* STEP: CANAL KAIZEN (IDEA REGISTRATION WITH VOICE & GEMINI AI REFINEMENT) */}
        {step === 'canal_kaizen' && (
          <motion.div
            key="canal_kaizen"
            initial={{ opacity: 0, y: 15, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -15, scale: 0.98 }}
            className="bg-slate-900/90 backdrop-blur-xl border border-white/10 rounded-3xl p-6 sm:p-8 shadow-2xl relative overflow-hidden"
          >
            <div className="absolute top-0 inset-x-0 h-1.5 bg-gradient-to-r from-amber-400 via-purple-500 to-cyan-400" />

            {/* Header */}
            <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
              <div className="flex items-center gap-2">
                <span className="p-2 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30">
                  <Lightbulb className="w-5 h-5" />
                </span>
                <div>
                  <h3 className="text-xl sm:text-2xl font-bold text-white flex items-center gap-2">
                    Canal Kaizen • Banco de Ideias
                  </h3>
                  <p className="text-xs text-amber-400 font-medium">
                    Sua ideia valorizada • Voz com IA Gemini & Lean Manufacturing
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setStep('canal_kaizen_list')}
                  className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-300 hover:text-white border border-white/10 transition cursor-pointer flex items-center gap-1.5"
                >
                  <ListFilter className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Ideias ({registeredIdeas.length})</span>
                </button>

                <button
                  onClick={() => setStep('hook')}
                  className="text-xs text-slate-400 hover:text-white cursor-pointer px-2 py-1"
                >
                  Voltar ✕
                </button>
              </div>
            </div>

            {/* PHASE 1: INPUT (Voice or Typing) */}
            {ideaPhase === 'input' && (
              <div>
                <p className="text-sm text-slate-300 mb-5 leading-relaxed">
                  Viu algum desperdício de tempo, ferramenta fora do lugar, risco de segurança ou processo difícil? 
                  <strong className="text-amber-300"> Fale no microfone</strong> ou digite sua sugestão. O Sensei IA irá estruturar sua proposta para o comitê!
                </p>

                {/* Big Voice Recording Button */}
                <div className="bg-slate-950/70 border border-white/10 rounded-2xl p-6 text-center mb-6">
                  <button
                    type="button"
                    onClick={toggleVoiceRecordingForIdea}
                    disabled={isRefiningWithAi}
                    className={`relative mx-auto w-24 h-24 rounded-full flex flex-col items-center justify-center transition-all cursor-pointer shadow-xl ${
                      isVoiceRecordingIdea
                        ? 'bg-red-500 text-white shadow-red-500/50 scale-105 animate-pulse'
                        : 'bg-gradient-to-tr from-amber-500 to-purple-600 hover:from-amber-400 hover:to-purple-500 text-white shadow-amber-500/30 hover:scale-105'
                    }`}
                  >
                    {isVoiceRecordingIdea ? (
                      <>
                        <MicOff className="w-9 h-9 mb-1" />
                        <span className="text-[10px] font-bold tracking-wider uppercase">Parar</span>
                      </>
                    ) : (
                      <>
                        <Mic className="w-9 h-9 mb-1" />
                        <span className="text-[10px] font-bold tracking-wider uppercase">Gravar Voz</span>
                      </>
                    )}
                  </button>

                  <div className="mt-4">
                    {isVoiceRecordingIdea ? (
                      <div className="flex items-center justify-center gap-2 text-red-400 font-semibold text-sm animate-pulse">
                        <span className="w-2.5 h-2.5 rounded-full bg-red-500" />
                        Ouvindo sua ideia... Fale com naturalidade!
                      </div>
                    ) : isRefiningWithAi ? (
                      <div className="flex items-center justify-center gap-2 text-purple-400 font-semibold text-sm">
                        <RefreshCw className="w-4 h-4 animate-spin text-purple-400" />
                        Sensei Gemini lapidando sua ideia Kaizen...
                      </div>
                    ) : (
                      <p className="text-xs text-slate-400">
                        Toque no microfone para falar livremente. O Gemini corrige falhas do áudio e organiza a proposta.
                      </p>
                    )}
                  </div>
                </div>

                {/* Processing State when Voice or Text is being structured */}
                {isRefiningWithAi ? (
                  <div className="py-10 text-center bg-slate-950/70 border border-purple-500/30 rounded-2xl p-6">
                    <div className="w-14 h-14 rounded-2xl bg-purple-500/20 border border-purple-500/40 flex items-center justify-center mx-auto mb-3">
                      <RefreshCw className="w-7 h-7 text-purple-400 animate-spin" />
                    </div>
                    <h4 className="text-base font-bold text-white mb-1">
                      Sensei IA Estruturando sua Ideia...
                    </h4>
                    <p className="text-xs text-purple-300 max-w-md mx-auto">
                      Interpretando sua fala e organizando problema, solução e benefícios técnicos para você revisar.
                    </p>
                  </div>
                ) : (
                  <div>
                    {/* Alternative: Typed Input */}
                    <div className="mb-4">
                      <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center justify-between">
                        <span>Ou digite sua sugestão de melhoria:</span>
                        <span className="text-slate-500 font-normal">Chão de fábrica / Processos</span>
                      </label>
                      <textarea
                        value={rawIdeaVoice}
                        onChange={(e) => setRawIdeaVoice(e.target.value)}
                        placeholder="Ex: A esteira 4 fica travando porque junta pó na guia lateral, devia ter um suporte de escova ou aspirador ali perto..."
                        rows={3}
                        className="w-full bg-slate-950/70 border border-white/10 rounded-2xl p-4 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-amber-400 transition"
                      />
                    </div>

                    {/* Action Bar for Typed Input */}
                    <div className="flex items-center justify-between pt-1">
                      <span className="text-[11px] text-slate-400 hidden sm:inline">
                        💡 A fala é interpretada e lapidada automaticamente pelo Sensei.
                      </span>
                      <button
                        type="button"
                        onClick={() => refineIdeaWithGemini(rawIdeaVoice)}
                        disabled={!rawIdeaVoice.trim()}
                        className="ml-auto px-6 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-purple-600 hover:opacity-95 disabled:opacity-30 text-white font-bold text-xs sm:text-sm transition cursor-pointer flex items-center gap-2 shadow-md shadow-purple-500/20"
                      >
                        <span>Continuar para Revisão</span>
                        <ArrowRight className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* PHASE 2: REVIEW & EDIT (User checks the AI-refined idea and can edit before submitting) */}
            {ideaPhase === 'review' && (
              <form onSubmit={handleConfirmIdeaSubmission} className="space-y-4">
                
                {/* Notification Banner */}
                <div className="bg-purple-500/15 border border-purple-500/30 rounded-2xl p-4 flex items-start gap-3">
                  <Sparkles className="w-5 h-5 text-purple-400 shrink-0 mt-0.5" />
                  <div className="text-xs sm:text-sm text-purple-200 leading-relaxed">
                    <strong>Ideia Lapidada pelo Sensei IA:</strong> Revisamos sua fala para deixá-la no padrão técnico Kaizen. Você tem controle total: edite o que quiser antes de enviar!
                  </div>
                </div>

                {/* Original Audio Card (if voice was used) */}
                {rawIdeaVoice && (
                  <div className="bg-slate-950/60 border border-white/5 rounded-xl p-3 text-xs text-slate-400">
                    <span className="font-semibold text-slate-300 block mb-0.5">🎙️ Transcrição do seu áudio:</span>
                    <span className="italic text-slate-400">&ldquo;{rawIdeaVoice}&rdquo;</span>
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {/* Title */}
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

                  {/* Category */}
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
                    Benefício Esperado (Para o posto e equipe):
                  </label>
                  <textarea
                    value={ideaBenefits}
                    onChange={(e) => setIdeaBenefits(e.target.value)}
                    rows={2}
                    className="w-full bg-slate-950/70 border border-white/10 rounded-xl p-3 text-xs sm:text-sm text-white focus:outline-none focus:border-cyan-400"
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
                      placeholder="Ex: Carlos Oliveira (ou deixe em branco)"
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
                    onClick={() => {
                      setIdeaPhase('input');
                    }}
                    className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-300 hover:text-white transition cursor-pointer flex items-center gap-1.5"
                  >
                    <Mic className="w-3.5 h-3.5" /> Regravar / Digitar Novamente
                  </button>

                  <button
                    type="submit"
                    className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white font-bold text-sm transition cursor-pointer flex items-center gap-2 shadow-lg shadow-emerald-500/25"
                  >
                    <FileCheck className="w-4 h-4" />
                    Confirmar e Cadastrar Ideia Kaizen
                  </button>
                </div>
              </form>
            )}

            {/* PHASE 3: SUCCESS & PROTOCOL */}
            {ideaPhase === 'success' && lastSubmittedIdea && (
              <div className="text-center py-4">
                <div className="w-16 h-16 rounded-full bg-emerald-500/20 border-2 border-emerald-400 flex items-center justify-center mx-auto mb-3 shadow-[0_0_20px_rgba(52,211,153,0.3)]">
                  <CheckCircle2 className="w-9 h-9 text-emerald-400" />
                </div>

                <h4 className="text-xl sm:text-2xl font-bold text-white mb-1">
                  Ideia Registrada no Canal Kaizen!
                </h4>
                
                <div className="inline-block px-4 py-1.5 rounded-full bg-cyan-950 border border-cyan-500/40 text-cyan-300 font-mono font-bold text-sm my-3 shadow-md">
                  Protocolo: {lastSubmittedIdea.protocol}
                </div>

                <p className="text-sm text-slate-300 max-w-lg mx-auto mb-6 leading-relaxed">
                  Obrigado, <strong className="text-white">{lastSubmittedIdea.authorName}</strong>! Sua proposta foi enviada para o painel de melhorias contínuas. Cada pequena mudança aproxima a fábrica da perfeição.
                </p>

                <div className="bg-slate-950/60 border border-white/10 rounded-2xl p-4 max-w-md mx-auto mb-6 text-left text-xs">
                  <div className="font-bold text-white mb-1 text-sm">{lastSubmittedIdea.title}</div>
                  <div className="text-slate-400 mb-2">Categoria: <span className="text-amber-400 font-semibold">{lastSubmittedIdea.category}</span></div>
                  <div className="text-slate-300"><strong className="text-emerald-400">Solução:</strong> {lastSubmittedIdea.solution}</div>
                </div>

                <div className="flex flex-wrap justify-center items-center gap-3">
                  <button
                    onClick={() => {
                      setRawIdeaVoice('');
                      setIdeaTitle('');
                      setIdeaProblem('');
                      setIdeaSolution('');
                      setIdeaBenefits('');
                      setIdeaPhase('input');
                    }}
                    className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-purple-600 hover:opacity-95 text-white font-bold text-xs sm:text-sm transition cursor-pointer flex items-center gap-1.5 shadow-lg shadow-amber-500/20"
                  >
                    <Lightbulb className="w-4 h-4" /> Cadastrar Outra Ideia
                  </button>

                  <button
                    onClick={() => setStep('canal_kaizen_list')}
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

        {/* STEP: CANAL KAIZEN LIST (VIEW SUBMITTED IDEAS) */}
        {step === 'canal_kaizen_list' && (
          <motion.div
            key="canal_kaizen_list"
            initial={{ opacity: 0, y: 15, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -15, scale: 0.98 }}
            className="bg-slate-900/90 backdrop-blur-xl border border-white/10 rounded-3xl p-6 sm:p-8 shadow-2xl relative overflow-hidden"
          >
            <div className="absolute top-0 inset-x-0 h-1.5 bg-gradient-to-r from-cyan-400 via-blue-500 to-purple-500" />

            <div className="flex items-center justify-between gap-3 mb-4">
              <div className="flex items-center gap-2">
                <span className="p-2 rounded-xl bg-cyan-500/20 text-cyan-400 border border-cyan-500/30">
                  <ListFilter className="w-5 h-5" />
                </span>
                <div>
                  <h3 className="text-xl sm:text-2xl font-bold text-white">
                    Banco de Ideias do Toten
                  </h3>
                  <p className="text-xs text-slate-400">
                    Sugestões cadastradas pelos operadores no Canal Kaizen
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    setStep('canal_kaizen');
                    setIdeaPhase('input');
                  }}
                  className="px-3 py-1.5 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/40 text-amber-300 text-xs font-bold transition cursor-pointer flex items-center gap-1"
                >
                  <Lightbulb className="w-3.5 h-3.5" /> Nova Ideia
                </button>

                <button
                  onClick={() => setStep('hook')}
                  className="text-xs text-slate-400 hover:text-white cursor-pointer px-2 py-1"
                >
                  Voltar ✕
                </button>
              </div>
            </div>

            {registeredIdeas.length === 0 ? (
              <div className="text-center py-12 bg-slate-950/40 rounded-2xl border border-white/5">
                <Lightbulb className="w-12 h-12 text-slate-600 mx-auto mb-3" />
                <h4 className="text-base font-bold text-white mb-1">Nenhuma ideia cadastrada ainda</h4>
                <p className="text-xs text-slate-400 mb-4 max-w-sm mx-auto">
                  Seja o primeiro a enviar uma proposta de melhoria contínua usando a voz ou o teclado!
                </p>
                <button
                  onClick={() => {
                    setStep('canal_kaizen');
                    setIdeaPhase('input');
                  }}
                  className="px-5 py-2 rounded-xl bg-amber-500 text-slate-950 font-bold text-xs hover:bg-amber-400 transition cursor-pointer"
                >
                  Cadastrar Primeira Ideia
                </button>
              </div>
            ) : (
              <div className="space-y-3 max-h-[50vh] overflow-y-auto pr-1">
                {registeredIdeas.map((idea) => (
                  <div
                    key={idea.id}
                    className="p-4 rounded-2xl bg-slate-950/60 border border-white/10 hover:border-cyan-500/40 transition"
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

        {/* STEP: KAIZEN KNOWLEDGE PILLS */}
        {step === 'pill' && (
          <motion.div
            key="pill"
            initial={{ opacity: 0, y: 15, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -15, scale: 0.98 }}
            className="bg-slate-900/90 backdrop-blur-xl border border-white/10 rounded-3xl p-6 sm:p-8 shadow-2xl relative overflow-hidden"
          >
            <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-emerald-500 via-cyan-500 to-blue-500" />

            <div className="flex items-center justify-between gap-4 mb-4">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold tracking-wider uppercase bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                <BookOpen className="w-3.5 h-3.5" />
                Pílula #{selectedPillIndex + 1} de {KAIZEN_PILLS.length}
              </span>
              <span className="text-xs text-slate-400">{KAIZEN_PILLS[selectedPillIndex].tag}</span>
            </div>

            <h3 className="text-2xl font-bold text-white mb-1">
              {KAIZEN_PILLS[selectedPillIndex].title}
            </h3>
            <p className="text-sm font-medium text-cyan-400 mb-4">
              {KAIZEN_PILLS[selectedPillIndex].subtitle}
            </p>

            <div className="bg-slate-950/60 border border-white/5 rounded-2xl p-4 sm:p-5 mb-4 text-slate-200 text-sm sm:text-base leading-relaxed">
              {KAIZEN_PILLS[selectedPillIndex].content}
            </div>

            <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-3.5 mb-6 text-xs sm:text-sm text-amber-300">
              💡 {KAIZEN_PILLS[selectedPillIndex].tip}
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3">
              <button
                onClick={() => setStep('intro')}
                className="px-4 py-2.5 rounded-xl bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700 text-sm font-medium transition cursor-pointer flex items-center gap-1.5"
              >
                <RefreshCw className="w-4 h-4" /> Voltar
              </button>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    setStep('canal_kaizen');
                    setIdeaPhase('input');
                  }}
                  className="px-4 py-2.5 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/40 text-amber-300 text-sm font-semibold transition cursor-pointer flex items-center gap-1.5"
                >
                  <Lightbulb className="w-4 h-4" /> Canal Kaizen
                </button>

                <button
                  onClick={handleNextPill}
                  className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white text-sm font-semibold transition shadow-lg shadow-cyan-500/20 cursor-pointer flex items-center gap-1.5"
                >
                  Próxima Pílula <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </motion.div>
        )}

        {/* STEP: GEMINI AI CHAT & CONSULTATION */}
        {step === 'gemini' && (
          <motion.div
            key="gemini"
            initial={{ opacity: 0, y: 15, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -15, scale: 0.98 }}
            className="bg-slate-900/90 backdrop-blur-xl border border-white/10 rounded-3xl p-6 sm:p-8 shadow-2xl relative overflow-hidden"
          >
            <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-purple-500 via-cyan-500 to-blue-500" />

            <div className="flex items-center justify-between gap-4 mb-4">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold tracking-wider uppercase bg-purple-500/15 text-purple-300 border border-purple-500/30">
                <Bot className="w-3.5 h-3.5 text-purple-400" />
                Sensei Gemini IA • Resposta por Voz
              </span>
              <button
                onClick={() => setStep('hook')}
                className="text-xs text-slate-400 hover:text-white cursor-pointer"
              >
                Voltar ✕
              </button>
            </div>

            <h3 className="text-xl sm:text-2xl font-bold text-white mb-2">
              Pergunte qualquer coisa ao Sensei! 🥋
            </h3>
            <p className="text-xs sm:text-sm text-slate-300 mb-4">
              Dúvidas sobre o posto de trabalho, 5S, desperdícios ou processos? O Sensei responde e fala com você!
            </p>

            {/* Quick Questions Pills */}
            <div className="flex flex-wrap gap-1.5 mb-4">
              {[
                "Como organizar minha bancada com 5S?",
                "O que é Poka-Yoke na prática?",
                "Como evitar peças com defeito?",
                "Qual a regra de ouro do Kaizen?"
              ].map((q, idx) => (
                <button
                  key={idx}
                  onClick={() => {
                    setChatInput(q);
                    handleAskGemini(q);
                  }}
                  className="px-3 py-1.5 rounded-xl bg-slate-800/80 hover:bg-cyan-500/20 border border-white/10 text-xs text-cyan-300 transition cursor-pointer"
                >
                  {q}
                </button>
              ))}
            </div>

            {/* AI Response Display Card */}
            {aiResponse && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-slate-950/70 border border-cyan-500/30 rounded-2xl p-4 mb-4 relative"
              >
                <div className="flex items-center gap-2 mb-2 text-cyan-400 text-xs font-bold uppercase tracking-wider">
                  <Sparkles className="w-3.5 h-3.5" />
                  Sensei Responde:
                </div>
                <p className="text-slate-100 text-sm sm:text-base leading-relaxed">
                  &ldquo;{aiResponse}&rdquo;
                </p>
              </motion.div>
            )}

            {/* Input Bar with Voice Recognition button */}
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleAskGemini()}
                placeholder="Ex: Como organizar a bancada de trabalho?"
                className="flex-1 bg-slate-950/70 border border-white/10 rounded-2xl px-4 py-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400"
              />

              <button
                type="button"
                onClick={startSpeechForChat}
                className={`p-3 rounded-2xl border transition cursor-pointer ${
                  chatListening
                    ? 'bg-red-500/20 border-red-500 text-red-400 animate-pulse'
                    : 'bg-slate-800/80 border-white/10 text-slate-300 hover:text-cyan-300'
                }`}
                title={chatListening ? "Ouvindo... Toque para parar" : "Falar pergunta no microfone"}
              >
                {chatListening ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
              </button>

              <button
                type="button"
                onClick={() => handleAskGemini()}
                disabled={isAiLoading || !chatInput.trim()}
                className="px-5 py-3 rounded-2xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 disabled:opacity-40 text-white font-semibold transition cursor-pointer flex items-center gap-1.5 shadow-lg shadow-cyan-500/20"
              >
                {isAiLoading ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  <Send className="w-4 h-4" />
                )}
              </button>
            </div>
          </motion.div>
        )}

        {/* STEP: DAILY 5S / KAIZEN CHALLENGE */}
        {step === 'challenge' && (
          <motion.div
            key="challenge"
            initial={{ opacity: 0, y: 15, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -15, scale: 0.98 }}
            className="bg-slate-900/90 backdrop-blur-xl border border-white/10 rounded-3xl p-6 sm:p-8 shadow-2xl relative overflow-hidden"
          >
            <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-amber-500 to-emerald-500" />

            <div className="flex items-center justify-between gap-4 mb-4">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold tracking-wider uppercase bg-amber-500/15 text-amber-400 border border-amber-500/30">
                <Trophy className="w-3.5 h-3.5" />
                Desafio 5S do Turno
              </span>
              <span className="text-xs text-slate-400">Meta Rápida (2 minutos)</span>
            </div>

            <h3 className="text-2xl font-bold text-white mb-2">
              Missão Kaizen de Hoje: Seiri (Descarte Consciente)
            </h3>
            <p className="text-slate-300 text-sm sm:text-base mb-6 leading-relaxed">
              Dê uma olhada na sua estação de trabalho agora. Identifique <strong className="text-cyan-400">1 objeto, papel ou ferramenta</strong> que não tem mais utilidade ou está no lugar errado. Guarde no local correto ou descarte adequadamente!
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6">
              <div className="bg-slate-800/60 border border-white/5 rounded-2xl p-4 flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-sm font-semibold text-white">Mais Espaço e Foco</h4>
                  <p className="text-xs text-slate-400 mt-0.5">Menos poluição visual reduz o estresse e evita perdas de ferramentas.</p>
                </div>
              </div>
              <div className="bg-slate-800/60 border border-white/5 rounded-2xl p-4 flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-cyan-400 shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-sm font-semibold text-white">Segurança em Primeiro Lugar</h4>
                  <p className="text-xs text-slate-400 mt-0.5">Piso e bancadas limpas previnem acidentes e tropeços.</p>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between gap-3">
              <button
                onClick={() => setStep('intro')}
                className="px-4 py-2.5 rounded-xl bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700 text-sm font-medium transition cursor-pointer"
              >
                Voltar
              </button>

              <button
                onClick={() => {
                  confetti({ particleCount: 120, spread: 90, origin: { y: 0.6 } });
                  onSpeak("Missão aceita! Bom turno e excelente trabalho!");
                  onStateChange('success');
                  setTimeout(() => {
                    setStep('hook');
                  }, 2500);
                }}
                className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white text-sm font-bold transition shadow-lg shadow-emerald-500/20 cursor-pointer flex items-center gap-2"
              >
                <CheckCircle2 className="w-4 h-4" /> Aceito a Missão!
              </button>
            </div>
          </motion.div>
        )}

      </AnimatePresence>
    </div>
  );
}
