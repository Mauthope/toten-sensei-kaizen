"use client";

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import confetti from 'canvas-confetti';
import { KAIZEN_PILLS, INITIAL_QUIZ } from '../lib/kaizenData';
import { KaizenPill, SenseiState } from '../types';
import { Sparkles, CheckCircle2, BookOpen, Lightbulb, RefreshCw, Trophy, ArrowRight } from 'lucide-react';

interface KaizenInteractionProps {
  onSpeak: (text: string) => void;
  onStateChange: (state: SenseiState) => void;
}

export function KaizenInteraction({ onSpeak, onStateChange }: KaizenInteractionProps) {
  const [step, setStep] = useState<'greeting' | 'pill' | 'challenge' | 'idea'>('greeting');
  const [selectedPillIndex, setSelectedPillIndex] = useState(0);
  const [ideaText, setIdeaText] = useState('');
  const [ideaSubmitted, setIdeaSubmitted] = useState(false);

  const currentPill = KAIZEN_PILLS[selectedPillIndex];

  const handleAnswerQuiz = (optionIndex: number) => {
    const option = INITIAL_QUIZ.options[optionIndex];
    onSpeak(option.response);

    if (optionIndex === 0) {
      // User said "Sim, sei!" -> Celebrate & show challenge!
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 }
      });
      onStateChange('celebrating');
      setTimeout(() => {
        setStep('challenge');
        onStateChange('interacting');
      }, 1200);
    } else {
      // User said "Não sei" -> Teach with pills!
      setStep('pill');
      onStateChange('interacting');
    }
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
        {/* STEP 1: GREETING & INITIAL QUESTION */}
        {step === 'greeting' && (
          <motion.div
            key="greeting"
            initial={{ opacity: 0, y: 20, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.96 }}
            className="bg-slate-900/80 backdrop-blur-xl border border-white/10 rounded-2xl p-6 sm:p-8 shadow-2xl relative overflow-hidden"
          >
            {/* Top Cyan Accent Strip */}
            <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-cyan-500 via-blue-500 to-cyan-500" />

            <div className="flex items-center justify-between gap-4 mb-4">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold tracking-wider uppercase bg-cyan-500/15 text-cyan-400 border border-cyan-500/30">
                <Sparkles className="w-3.5 h-3.5" />
                Presença Detectada
              </span>
              <span className="text-xs text-slate-400">Toten Interativo</span>
            </div>

            <h2 className="text-2xl sm:text-3xl font-bold text-white mb-2 tracking-tight">
              Olá! Estou te vendo! 👀
            </h2>
            <p className="text-lg text-slate-300 mb-6">
              Você sabe o que é <span className="text-cyan-400 font-semibold">Kaizen</span>?
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {INITIAL_QUIZ.options.map((option, idx) => (
                <button
                  key={idx}
                  onClick={() => handleAnswerQuiz(idx)}
                  className="flex flex-col items-center justify-center text-center p-4 rounded-xl bg-slate-800/80 hover:bg-cyan-500/15 border border-white/10 hover:border-cyan-500/50 text-white font-medium transition-all duration-200 group active:scale-95 cursor-pointer shadow-md hover:shadow-cyan-500/10"
                >
                  <span className="text-base sm:text-lg mb-1 group-hover:scale-110 transition-transform">
                    {option.text.split(' ')[0]}
                  </span>
                  <span className="text-xs sm:text-sm text-slate-300 group-hover:text-cyan-300">
                    {option.text.split(' ').slice(1).join(' ')}
                  </span>
                </button>
              ))}
            </div>

            <div className="mt-6 pt-4 border-t border-white/10 flex justify-between items-center text-xs text-slate-400">
              <span>Toque na tela para responder</span>
              <button
                onClick={() => setStep('idea')}
                className="text-cyan-400 hover:text-cyan-300 hover:underline flex items-center gap-1 cursor-pointer"
              >
                <Lightbulb className="w-3.5 h-3.5" /> Enviar uma Sugestão
              </button>
            </div>
          </motion.div>
        )}

        {/* STEP 2: KAIZEN KNOWLEDGE PILLS */}
        {step === 'pill' && (
          <motion.div
            key="pill"
            initial={{ opacity: 0, y: 20, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.96 }}
            className="bg-slate-900/80 backdrop-blur-xl border border-white/10 rounded-2xl p-6 sm:p-8 shadow-2xl relative overflow-hidden"
          >
            <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-emerald-500 via-cyan-500 to-blue-500" />

            <div className="flex items-center justify-between gap-4 mb-4">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold tracking-wider uppercase bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                <BookOpen className="w-3.5 h-3.5" />
                Pílula Kaizen #{selectedPillIndex + 1} de {KAIZEN_PILLS.length}
              </span>
              <span className="text-xs text-slate-400">{currentPill.tag}</span>
            </div>

            <h3 className="text-2xl font-bold text-white mb-1">
              {currentPill.title}
            </h3>
            <p className="text-sm font-medium text-cyan-400 mb-4">
              {currentPill.subtitle}
            </p>

            <div className="bg-slate-950/60 border border-white/5 rounded-xl p-4 sm:p-5 mb-4 text-slate-200 text-sm sm:text-base leading-relaxed">
              {currentPill.content}
            </div>

            <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-3 mb-6 text-xs sm:text-sm text-amber-300">
              {currentPill.tip}
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3">
              <button
                onClick={() => setStep('greeting')}
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

        {/* STEP 3: DAILY 5S / KAIZEN CHALLENGE */}
        {step === 'challenge' && (
          <motion.div
            key="challenge"
            initial={{ opacity: 0, y: 20, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.96 }}
            className="bg-slate-900/80 backdrop-blur-xl border border-white/10 rounded-2xl p-6 sm:p-8 shadow-2xl relative overflow-hidden"
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
                onClick={() => setStep('greeting')}
                className="px-4 py-2.5 rounded-lg bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700 text-sm font-medium transition cursor-pointer"
              >
                Voltar
              </button>

              <button
                onClick={() => {
                  confetti({ particleCount: 120, spread: 90, origin: { y: 0.6 } });
                  onSpeak("Missão aceita! Bom turno e excelente trabalho!");
                  setStep('greeting');
                }}
                className="px-6 py-2.5 rounded-lg bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white text-sm font-semibold transition shadow-lg shadow-emerald-500/20 cursor-pointer flex items-center gap-2"
              >
                <CheckCircle2 className="w-4 h-4" /> Aceito a Missão!
              </button>
            </div>
          </motion.div>
        )}

        {/* STEP 4: SUGGEST KAIZEN IDEA */}
        {step === 'idea' && (
          <motion.div
            key="idea"
            initial={{ opacity: 0, y: 20, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.96 }}
            className="bg-slate-900/80 backdrop-blur-xl border border-white/10 rounded-2xl p-6 sm:p-8 shadow-2xl relative overflow-hidden"
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
                    setStep('greeting');
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
                    onClick={() => setStep('greeting')}
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
