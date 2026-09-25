"use client";

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import confetti from 'canvas-confetti';
import { DYNAMIC_HOOKS, KAIZEN_PILLS, DynamicHook, DynamicHookOption } from '../lib/kaizenData';
import { SenseiState } from '../types';
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
  HelpCircle,
  Compass
} from 'lucide-react';

interface KaizenInteractionProps {
  onSpeak: (text: string) => void;
  onStateChange: (state: SenseiState) => void;
}

export function KaizenInteraction({ onSpeak, onStateChange }: KaizenInteractionProps) {
  // Navigation steps:
  // 'hook': First dynamic attention-grabber question (no Kaizen jargon yet, relatable workplace problem)
  // 'intro': Sensei introduces Kaizen/5S connecting to the user's specific answer
  // 'pill': Detailed Kaizen & 5S Pills
  // 'challenge': 2-minute 5S Turn Challenge
  // 'gemini': Conversational AI with Google Gemini
  // 'idea': Suggestion box for continuous improvement
  const [step, setStep] = useState<'hook' | 'intro' | 'pill' | 'challenge' | 'idea' | 'gemini'>('hook');

  // Currently active dynamic hook
  const [currentHook, setCurrentHook] = useState<DynamicHook>(DYNAMIC_HOOKS[0]);
  const [selectedOption, setSelectedOption] = useState<DynamicHookOption | null>(null);
  const [selectedPillIndex, setSelectedPillIndex] = useState(0);

  // Gemini AI Chat states
  const [chatInput, setChatInput] = useState('');
  const [aiResponse, setAiResponse] = useState<string | null>(null);
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef<any>(null);

  // Idea submission states
  const [ideaText, setIdeaText] = useState('');
  const [ideaSubmitted, setIdeaSubmitted] = useState(false);

  // Randomize hook whenever this component mounts (i.e. whenever someone is newly detected!)
  useEffect(() => {
    const randomIdx = Math.floor(Math.random() * DYNAMIC_HOOKS.length);
    const chosenHook = DYNAMIC_HOOKS[randomIdx];
    setCurrentHook(chosenHook);
    setStep('hook');
    setSelectedOption(null);

    // Speak dynamic attention callout
    onSpeak(chosenHook.calloutSpeech);
  }, []); // Run on mount

  // Speech Recognition setup
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (SpeechRecognition) {
        const recognition = new SpeechRecognition();
        recognition.lang = 'pt-BR';
        recognition.continuous = false;
        recognition.interimResults = false;

        recognition.onresult = (event: any) => {
          const transcript = event.results[0][0].transcript;
          setChatInput(transcript);
          setIsListening(false);
          handleAskGemini(transcript);
        };

        recognition.onerror = () => setIsListening(false);
        recognition.onend = () => setIsListening(false);
        recognitionRef.current = recognition;
      }
    }
  }, []);

  const toggleSpeechRecognition = () => {
    if (!recognitionRef.current) {
      alert("Reconhecimento de voz não suportado neste navegador. Digite sua pergunta!");
      return;
    }

    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    } else {
      try {
        setIsListening(true);
        recognitionRef.current.start();
      } catch (err) {
        console.warn("Speech recognition error:", err);
        setIsListening(false);
      }
    }
  };

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
        body: JSON.stringify({ message: textToSend })
      });

      const data = await res.json();
      const reply = data.response || "Mudar sempre para melhor é o caminho do guerreiro Kaizen!";
      setAiResponse(reply);
      onSpeak(reply);

      confetti({
        particleCount: 50,
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
      particleCount: 70,
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

  const handleSubmitIdea = (e: React.FormEvent) => {
    e.preventDefault();
    if (!ideaText.trim()) return;

    confetti({
      particleCount: 100,
      spread: 80,
      origin: { y: 0.6 }
    });
    setIdeaSubmitted(true);
    onSpeak("Ideia de melhoria registrada com sucesso! Você faz a diferença na nossa fábrica!");
  };

  return (
    <div className="w-full max-w-2xl mx-auto px-4 z-20">
      <AnimatePresence mode="wait">
        
        {/* STEP 1: DYNAMIC HOOK (Attention Grabber & Relatable Icebreaker) */}
        {step === 'hook' && (
          <motion.div
            key="hook"
            initial={{ opacity: 0, y: 20, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.96 }}
            className="bg-slate-900/85 backdrop-blur-xl border border-white/10 rounded-2xl p-6 sm:p-8 shadow-2xl relative overflow-hidden"
          >
            {/* Top Cyan Glowing Line */}
            <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-cyan-500 via-blue-500 to-cyan-500" />

            <div className="flex items-center justify-between gap-4 mb-3">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold tracking-wider uppercase bg-cyan-500/15 text-cyan-400 border border-cyan-500/30 animate-pulse">
                <Flame className="w-3.5 h-3.5 text-cyan-400" />
                {currentHook.badge}
              </span>
              <button
                onClick={() => setStep('gemini')}
                className="px-3 py-1 rounded-full text-xs font-semibold bg-purple-500/20 text-purple-300 border border-purple-500/30 hover:bg-purple-500/30 transition cursor-pointer flex items-center gap-1.5"
              >
                <Bot className="w-3.5 h-3.5 text-purple-400" />
                Conversar com Gemini IA
              </button>
            </div>

            <h2 className="text-xl sm:text-2xl font-bold text-white mb-2 tracking-tight">
              {currentHook.question}
            </h2>
            <p className="text-xs sm:text-sm text-slate-300 mb-5">
              Toque na opção que mais combina com a sua realidade hoje:
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
              {currentHook.options.map((option, idx) => (
                <button
                  key={idx}
                  onClick={() => handleSelectHookOption(option)}
                  className="flex items-center justify-start text-left p-3.5 sm:p-4 rounded-xl bg-slate-800/80 hover:bg-cyan-500/15 border border-white/10 hover:border-cyan-500/50 text-white font-medium transition-all duration-200 group active:scale-98 cursor-pointer shadow-md hover:shadow-cyan-500/10"
                >
                  <span className="text-sm sm:text-base text-slate-200 group-hover:text-cyan-300">
                    {option.text}
                  </span>
                </button>
              ))}
            </div>

            <div className="pt-3 border-t border-white/10 flex justify-between items-center text-xs text-slate-400">
              <span>O Sensei está te ouvindo atentamente</span>
              <button
                onClick={() => {
                  const nextHookIdx = (DYNAMIC_HOOKS.findIndex(h => h.id === currentHook.id) + 1) % DYNAMIC_HOOKS.length;
                  setCurrentHook(DYNAMIC_HOOKS[nextHookIdx]);
                  onSpeak(DYNAMIC_HOOKS[nextHookIdx].calloutSpeech);
                }}
                className="text-cyan-400 hover:text-cyan-300 hover:underline flex items-center gap-1 cursor-pointer"
              >
                <RefreshCw className="w-3.5 h-3.5" /> Outra Pergunta
              </button>
            </div>
          </motion.div>
        )}

        {/* STEP 2: METHODOLOGY INTRODUCTION (Appears ONLY AFTER user's first choice!) */}
        {step === 'intro' && selectedOption && (
          <motion.div
            key="intro"
            initial={{ opacity: 0, y: 20, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.96 }}
            className="bg-slate-900/85 backdrop-blur-xl border border-white/10 rounded-2xl p-6 sm:p-8 shadow-2xl relative overflow-hidden"
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
            <div className="bg-cyan-500/10 border border-cyan-500/25 rounded-xl p-4 mb-4">
              <p className="text-sm sm:text-base font-medium text-cyan-200 italic">
                &ldquo;{selectedOption.reactionSpeech}&rdquo;
              </p>
            </div>

            {/* Structured Methodology Explanation */}
            <div className="bg-slate-950/60 border border-white/5 rounded-xl p-4 sm:p-5 mb-5 text-slate-200 text-xs sm:text-sm leading-relaxed">
              <h4 className="text-sm sm:text-base font-bold text-white mb-2 flex items-center gap-2">
                <Compass className="w-4 h-4 text-cyan-400" />
                Como a metodologia resolve isso na prática:
              </h4>
              <p className="text-slate-300">
                {selectedOption.methodologyIntro}
              </p>
            </div>

            {/* Next Action Choices */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              <button
                onClick={handleOpenRecommendedPill}
                className="p-3 rounded-xl bg-cyan-500/20 hover:bg-cyan-500/30 border border-cyan-500/40 text-cyan-300 text-xs sm:text-sm font-semibold transition cursor-pointer flex flex-col items-center justify-center text-center gap-1"
              >
                <BookOpen className="w-4 h-4" />
                <span>Ver Pílulas 5S</span>
              </button>

              <button
                onClick={() => setStep('challenge')}
                className="p-3 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/40 text-amber-300 text-xs sm:text-sm font-semibold transition cursor-pointer flex flex-col items-center justify-center text-center gap-1"
              >
                <Trophy className="w-4 h-4" />
                <span>Desafio 5S (2 min)</span>
              </button>

              <button
                onClick={() => setStep('gemini')}
                className="p-3 rounded-xl bg-purple-500/20 hover:bg-purple-500/30 border border-purple-500/40 text-purple-300 text-xs sm:text-sm font-semibold transition cursor-pointer flex flex-col items-center justify-center text-center gap-1"
              >
                <Bot className="w-4 h-4" />
                <span>Perguntar ao Gemini</span>
              </button>
            </div>

            <div className="mt-5 pt-3 border-t border-white/10 flex justify-between items-center text-xs text-slate-400">
              <button
                onClick={() => setStep('hook')}
                className="text-slate-400 hover:text-white transition cursor-pointer"
              >
                ← Voltar à pergunta inicial
              </button>
              <button
                onClick={() => setStep('idea')}
                className="text-amber-400 hover:text-amber-300 hover:underline flex items-center gap-1 cursor-pointer"
              >
                <Lightbulb className="w-3.5 h-3.5" /> Tenho uma ideia de melhoria
              </button>
            </div>
          </motion.div>
        )}

        {/* STEP 3: KAIZEN KNOWLEDGE PILLS */}
        {step === 'pill' && (
          <motion.div
            key="pill"
            initial={{ opacity: 0, y: 20, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.96 }}
            className="bg-slate-900/85 backdrop-blur-xl border border-white/10 rounded-2xl p-6 sm:p-8 shadow-2xl relative overflow-hidden"
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

            <div className="bg-slate-950/60 border border-white/5 rounded-xl p-4 sm:p-5 mb-4 text-slate-200 text-sm sm:text-base leading-relaxed">
              {KAIZEN_PILLS[selectedPillIndex].content}
            </div>

            <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-3 mb-6 text-xs sm:text-sm text-amber-300">
              {KAIZEN_PILLS[selectedPillIndex].tip}
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3">
              <button
                onClick={() => setStep('intro')}
                className="px-4 py-2.5 rounded-lg bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700 text-sm font-medium transition cursor-pointer flex items-center gap-1.5"
              >
                <RefreshCw className="w-4 h-4" /> Voltar
              </button>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setStep('challenge')}
                  className="px-4 py-2.5 rounded-lg bg-slate-800 text-cyan-400 hover:bg-cyan-500/20 border border-cyan-500/30 text-sm font-semibold transition cursor-pointer flex items-center gap-1.5"
                >
                  <Trophy className="w-4 h-4" /> Desafio do Dia
                </button>

                <button
                  onClick={handleNextPill}
                  className="px-5 py-2.5 rounded-lg bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white text-sm font-semibold transition shadow-lg shadow-cyan-500/20 cursor-pointer flex items-center gap-1.5"
                >
                  Próxima Pílula <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </motion.div>
        )}

        {/* STEP 4: GEMINI AI CHAT & CONSULTATION */}
        {step === 'gemini' && (
          <motion.div
            key="gemini"
            initial={{ opacity: 0, y: 20, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.96 }}
            className="bg-slate-900/85 backdrop-blur-xl border border-white/10 rounded-2xl p-6 sm:p-8 shadow-2xl relative overflow-hidden"
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
                  className="px-2.5 py-1 rounded-lg bg-slate-800/80 hover:bg-cyan-500/20 border border-white/10 text-[11px] text-cyan-300 transition cursor-pointer"
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
                className="bg-slate-950/70 border border-cyan-500/30 rounded-xl p-4 mb-4 relative"
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
                className="flex-1 bg-slate-950/70 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400"
              />

              <button
                type="button"
                onClick={toggleSpeechRecognition}
                className={`p-2.5 rounded-xl border transition cursor-pointer ${
                  isListening
                    ? 'bg-red-500/20 border-red-500 text-red-400 animate-pulse'
                    : 'bg-slate-800/80 border-white/10 text-slate-300 hover:text-cyan-300'
                }`}
                title={isListening ? "Ouvindo... Toque para parar" : "Falar pergunta no microfone"}
              >
                {isListening ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
              </button>

              <button
                type="button"
                onClick={() => handleAskGemini()}
                disabled={isAiLoading || !chatInput.trim()}
                className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 disabled:opacity-40 text-white font-semibold transition cursor-pointer flex items-center gap-1.5 shadow-lg shadow-cyan-500/20"
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

        {/* STEP 5: DAILY 5S / KAIZEN CHALLENGE */}
        {step === 'challenge' && (
          <motion.div
            key="challenge"
            initial={{ opacity: 0, y: 20, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.96 }}
            className="bg-slate-900/85 backdrop-blur-xl border border-white/10 rounded-2xl p-6 sm:p-8 shadow-2xl relative overflow-hidden"
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
              Dê uma olhada na sua estação de trabalho agora. Identifique **1 objeto, papel ou ferramenta** que não tem mais utilidade ou está no lugar errado. Guarde no local correto ou descarte adequadamente!
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6">
              <div className="bg-slate-800/60 border border-white/5 rounded-xl p-3.5 flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-sm font-semibold text-white">Mais Espaço e Foco</h4>
                  <p className="text-xs text-slate-400">Menos poluição visual reduz o estresse e evita perdas de ferramentas.</p>
                </div>
              </div>
              <div className="bg-slate-800/60 border border-white/5 rounded-xl p-3.5 flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-cyan-400 shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-sm font-semibold text-white">Segurança em Primeiro Lugar</h4>
                  <p className="text-xs text-slate-400">Piso e bancadas limpas previnem acidentes e tropeços.</p>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between gap-3">
              <button
                onClick={() => setStep('intro')}
                className="px-4 py-2.5 rounded-lg bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700 text-sm font-medium transition cursor-pointer"
              >
                Voltar
              </button>

              <button
                onClick={() => {
                  confetti({ particleCount: 120, spread: 90, origin: { y: 0.6 } });
                  onSpeak("Missão aceita! Bom turno e excelente trabalho!");
                  setStep('hook');
                }}
                className="px-6 py-2.5 rounded-lg bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white text-sm font-semibold transition shadow-lg shadow-emerald-500/20 cursor-pointer flex items-center gap-2"
              >
                <CheckCircle2 className="w-4 h-4" /> Aceito a Missão!
              </button>
            </div>
          </motion.div>
        )}

        {/* STEP 6: SUGGEST KAIZEN IDEA */}
        {step === 'idea' && (
          <motion.div
            key="idea"
            initial={{ opacity: 0, y: 20, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.96 }}
            className="bg-slate-900/85 backdrop-blur-xl border border-white/10 rounded-2xl p-6 sm:p-8 shadow-2xl relative overflow-hidden"
          >
            <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-purple-500 to-pink-500" />

            <div className="flex items-center justify-between gap-4 mb-4">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold tracking-wider uppercase bg-purple-500/15 text-purple-400 border border-purple-500/30">
                <Lightbulb className="w-3.5 h-3.5" />
                Banco de Ideias Kaizen
              </span>
              <span className="text-xs text-slate-400">Melhoria Contínua</span>
            </div>

            <h3 className="text-2xl font-bold text-white mb-2">
              Qual processo podemos melhorar hoje?
            </h3>
            <p className="text-slate-300 text-sm mb-4">
              Pequenas ideias geram grandes transformações. Conte ao Sensei sua sugestão:
            </p>

            {ideaSubmitted ? (
              <div className="bg-emerald-500/15 border border-emerald-500/30 rounded-xl p-6 text-center">
                <CheckCircle2 className="w-10 h-10 text-emerald-400 mx-auto mb-2" />
                <h4 className="text-lg font-bold text-white mb-1">Ideia Enviada com Sucesso!</h4>
                <p className="text-sm text-slate-300 mb-4">
                  Obrigado por contribuir com a melhoria contínua da empresa.
                </p>
                <button
                  onClick={() => {
                    setIdeaSubmitted(false);
                    setIdeaText('');
                    setStep('hook');
                  }}
                  className="px-5 py-2 rounded-lg bg-slate-800 text-white hover:bg-slate-700 text-sm font-medium transition cursor-pointer"
                >
                  Concluir
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmitIdea} className="space-y-4">
                <textarea
                  value={ideaText}
                  onChange={(e) => setIdeaText(e.target.value)}
                  placeholder="Ex: Organizar o suporte de ferramentas na linha de embalagem para evitar tempo de busca..."
                  rows={4}
                  className="w-full bg-slate-950/70 border border-white/10 rounded-xl p-3.5 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 transition"
                />

                <div className="flex items-center justify-between gap-3">
                  <button
                    type="button"
                    onClick={() => setStep('hook')}
                    className="px-4 py-2 rounded-lg bg-slate-800 text-slate-300 hover:text-white text-sm font-medium transition cursor-pointer"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={!ideaText.trim()}
                    className="px-6 py-2.5 rounded-lg bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-400 hover:to-pink-500 disabled:opacity-40 text-white text-sm font-semibold transition cursor-pointer shadow-lg shadow-purple-500/20"
                  >
                    Registrar Sugestão
                  </button>
                </div>
              </form>
            )}
          </motion.div>
        )}

      </AnimatePresence>
    </div>
  );
}
