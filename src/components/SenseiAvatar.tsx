"use client";

import React, { useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { SenseiState } from '../types';
import Image from 'next/image';

interface SenseiAvatarProps {
  state: SenseiState;
  isSpeaking?: boolean;
}

export const SenseiAvatar = React.memo(function SenseiAvatar({ state, isSpeaking = false }: SenseiAvatarProps) {
  // Determine active sprite source
  const spriteSrc = useMemo(() => {
    switch (state) {
      case 'idle':
        return '/sprites/sensei-searching.png';
      case 'celebrating':
        return '/sprites/sensei-celebrating.png';
      case 'idea':
        return '/sprites/sensei-idea.png';
      case 'success':
        return '/sprites/sensei-success.png';
      case 'detected':
      case 'interacting':
      default:
        return '/sprites/sensei-speaking.png';
    }
  }, [state]);

  // Determine aura glow color based on character state
  const auraClass = useMemo(() => {
    switch (state) {
      case 'idle':
        return 'bg-cyan-500/20 scale-95 shadow-[0_0_60px_rgba(6,182,212,0.3)]';
      case 'celebrating':
        return 'bg-amber-400/30 scale-125 shadow-[0_0_80px_rgba(245,158,11,0.4)] animate-pulse';
      case 'idea':
        return 'bg-yellow-400/30 scale-110 shadow-[0_0_80px_rgba(250,204,21,0.4)] animate-pulse';
      case 'success':
        return 'bg-emerald-400/30 scale-115 shadow-[0_0_70px_rgba(52,211,153,0.35)]';
      case 'detected':
      case 'interacting':
      default:
        return isSpeaking
          ? 'bg-gradient-to-tr from-cyan-500/30 via-blue-500/25 to-purple-500/30 scale-110 animate-pulse'
          : 'bg-cyan-500/20 scale-105';
    }
  }, [state, isSpeaking]);

  return (
    <div className="relative flex flex-col items-center justify-center select-none w-64 h-72 sm:w-76 sm:h-84 md:w-84 md:h-96">
      {/* Background Soft Glow Aura (matches Toten Dark Slate #0f172a) */}
      <div 
        className={`absolute inset-0 rounded-full blur-3xl transition-all duration-700 pointer-events-none ${auraClass}`}
      />

      {/* Main Pixel Art Mascot Animated Container */}
      <motion.div
        className="relative z-10 w-full h-full flex items-center justify-center"
        animate={
          state === 'celebrating'
            ? { y: [0, -16, 0], scale: [1, 1.04, 1] }
            : isSpeaking
            ? { y: [0, -6, 0] }
            : state === 'idle'
            ? { y: [0, -5, 0] }
            : { y: [0, -4, 0] }
        }
        transition={{
          repeat: Infinity,
          duration: state === 'celebrating' ? 1.4 : isSpeaking ? 1.6 : 3.0,
          ease: "easeInOut"
        }}
      >
        <AnimatePresence mode="wait">
          <motion.div
            key={spriteSrc}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.25 }}
            className="relative w-full h-full flex items-center justify-center"
          >
            {/* 32-Bit Pixel Art Sprite */}
            <img
              src={spriteSrc}
              alt="Sensei Kaizen Pixel Art Sprite"
              className="w-full h-full object-contain filter drop-shadow-[0_16px_28px_rgba(0,0,0,0.65)]"
              style={{
                imageRendering: 'pixelated', // Keeps pixel art ultra-crisp at any kiosk zoom
              }}
            />

            {/* Speaking Audio Indicator Bubble */}
            {isSpeaking && (
              <motion.div
                initial={{ opacity: 0, scale: 0.8, y: 10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.8 }}
                className="absolute -top-3 right-4 px-3 py-1 rounded-full bg-cyan-950/90 border border-cyan-400 text-[11px] font-bold text-cyan-300 shadow-[0_0_15px_rgba(6,182,212,0.5)] flex items-center gap-1.5 backdrop-blur-md"
              >
                <span className="flex gap-0.5 items-end h-3">
                  <span className="w-1 bg-cyan-400 rounded-full animate-bounce [animation-delay:-0.3s] h-2" />
                  <span className="w-1 bg-cyan-400 rounded-full animate-bounce [animation-delay:-0.15s] h-3" />
                  <span className="w-1 bg-cyan-400 rounded-full animate-bounce h-2.5" />
                </span>
                <span>Sensei Falando</span>
              </motion.div>
            )}

            {/* Eureka Lightbulb Glow for Idea State */}
            {state === 'idea' && (
              <div className="absolute top-2 w-16 h-16 rounded-full bg-yellow-400/20 blur-xl animate-ping pointer-events-none" />
            )}
          </motion.div>
        </AnimatePresence>
      </motion.div>
    </div>
  );
});
