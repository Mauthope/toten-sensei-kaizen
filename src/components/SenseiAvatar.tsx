"use client";

import React from 'react';
import { motion } from 'framer-motion';
import { SenseiState } from '../types';

interface SenseiAvatarProps {
  state: SenseiState;
  isSpeaking?: boolean;
}

export function SenseiAvatar({ state, isSpeaking = false }: SenseiAvatarProps) {
  const isIdle = state === 'idle';

  return (
    <div className="relative flex flex-col items-center justify-center select-none w-72 h-72 sm:w-80 sm:h-80 md:w-96 md:h-96">
      {/* Background Glow Aura */}
      <div 
        className={`absolute inset-0 rounded-full blur-3xl transition-all duration-700 pointer-events-none ${
          isIdle 
            ? 'bg-cyan-500/10 scale-90' 
            : state === 'celebrating'
            ? 'bg-emerald-500/25 scale-125'
            : 'bg-gradient-to-tr from-cyan-500/25 to-blue-500/25 scale-110'
        }`}
      />

      {/* Main Character Animated Body */}
      <motion.div
        className="relative z-10 w-full h-full flex items-center justify-center"
        animate={
          isIdle
            ? { y: [0, -8, 0], rotate: [-1, 1, -1] }
            : { y: [0, -12, 0], scale: [1, 1.02, 1] }
        }
        transition={{
          repeat: Infinity,
          duration: isIdle ? 3.5 : 2,
          ease: "easeInOut"
        }}
      >
        <svg
          viewBox="0 0 400 400"
          className="w-full h-full filter drop-shadow-[0_10px_25px_rgba(6,182,212,0.25)]"
        >
          <defs>
            <linearGradient id="kimonoGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stop-color="#1e293b" />
              <stop offset="100%" stop-color="#0f172a" />
            </linearGradient>

            <linearGradient id="cyanNeon" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stop-color="#06b6d4" />
              <stop offset="100%" stop-color="#3b82f6" />
            </linearGradient>

            <linearGradient id="lensGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stop-color="#38bdf8" />
              <stop offset="100%" stop-color="#0284c7" />
            </linearGradient>

            <filter id="neonGlow">
              <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
              <feMerge>
                <feMergeNode in="coloredBlur"/>
                <feMergeNode in="SourceGraphic"/>
              </feMerge>
            </filter>
          </defs>

          {/* Torso & Kimono */}
          <path
            d="M 100 380 Q 200 270 300 380 L 320 400 L 80 400 Z"
            fill="url(#kimonoGrad)"
            stroke="#334155"
            strokeWidth="3"
          />
          {/* Kimono Collar / Lapel with Cyan Neon Accent */}
          <path
            d="M 160 300 L 200 365 L 240 300"
            stroke="url(#cyanNeon)"
            strokeWidth="6"
            strokeLinecap="round"
            fill="none"
          />

          {/* Neck */}
          <rect x="180" y="240" width="40" height="35" rx="8" fill="#fed7aa" />

          {/* Sensei Head */}
          <circle cx="200" cy="180" r="85" fill="#fed7aa" />

          {/* Headband (Hachimaki) with Japanese Red Sun */}
          <path
            d="M 118 140 Q 200 120 282 140 L 280 115 Q 200 95 120 115 Z"
            fill="#ef4444"
          />
          <circle cx="200" cy="123" r="11" fill="#ffffff" />
          <circle cx="200" cy="123" r="7" fill="#ef4444" />

          {/* Sensei Fluffy White Eyebrows */}
          <motion.path
            d="M 140 148 Q 170 135 188 152"
            stroke="#ffffff"
            strokeWidth="8"
            strokeLinecap="round"
            fill="none"
            animate={
              isIdle
                ? { d: ["M 140 148 Q 170 135 188 152", "M 140 145 Q 170 130 188 150", "M 140 148 Q 170 135 188 152"] }
                : { d: ["M 140 140 Q 170 125 188 145", "M 140 142 Q 170 128 188 147", "M 140 140 Q 170 125 188 145"] }
            }
            transition={{ repeat: Infinity, duration: 2 }}
          />
          <motion.path
            d="M 260 148 Q 230 135 212 152"
            stroke="#ffffff"
            strokeWidth="8"
            strokeLinecap="round"
            fill="none"
            animate={
              isIdle
                ? { d: ["M 260 148 Q 230 135 212 152", "M 260 145 Q 230 130 212 150", "M 260 148 Q 230 135 212 152"] }
                : { d: ["M 260 140 Q 230 125 212 145", "M 260 142 Q 230 128 212 147", "M 260 140 Q 230 125 212 145"] }
            }
            transition={{ repeat: Infinity, duration: 2 }}
          />

          {/* Eyes Logic based on Idle vs Active */}
          {!isIdle && (
            <g>
              {/* Joyful Expressive Eyes when Person is Detected */}
              <circle cx="165" cy="175" r="10" fill="#1e293b" />
              <circle cx="168" cy="172" r="3.5" fill="#ffffff" />
              
              <circle cx="235" cy="175" r="10" fill="#1e293b" />
              <circle cx="238" cy="172" r="3.5" fill="#ffffff" />

              {/* Rosy Cheeks */}
              <ellipse cx="145" cy="192" rx="12" ry="7" fill="#fb7185" fillOpacity="0.4" />
              <ellipse cx="255" cy="192" rx="12" ry="7" fill="#fb7185" fillOpacity="0.4" />
            </g>
          )}

          {/* Sensei Big Flowing White Beard */}
          <path
            d="M 160 215 Q 200 230 240 215 Q 220 280 200 285 Q 180 280 160 215 Z"
            fill="#ffffff"
            filter="drop-shadow(0 2px 4px rgba(0,0,0,0.15))"
          />

          {/* Mouth / Smile (moves when speaking) */}
          <motion.path
            d="M 190 206 Q 200 218 210 206"
            stroke="#991b1b"
            strokeWidth="3.5"
            strokeLinecap="round"
            fill="none"
            animate={
              isSpeaking
                ? { d: ["M 190 206 Q 200 220 210 206", "M 190 206 Q 200 212 210 206", "M 190 206 Q 200 220 210 206"] }
                : {}
            }
            transition={{ repeat: Infinity, duration: 0.25 }}
          />

          {/* STATE 1: IDLE -> Sensei looking through Binoculars */}
          {isIdle && (
            <motion.g
              animate={{
                x: [-18, 18, -18],
                rotate: [-4, 4, -4],
              }}
              transition={{
                repeat: Infinity,
                duration: 3,
                ease: "easeInOut",
              }}
            >
              {/* Binocular Scanner Beams */}
              <polygon
                points="160,175 100,260 140,260"
                fill="url(#cyanNeon)"
                opacity="0.15"
              />
              <polygon
                points="240,175 260,260 300,260"
                fill="url(#cyanNeon)"
                opacity="0.15"
              />

              {/* Binoculars Body */}
              <g filter="url(#neonGlow)">
                {/* Left Barrel */}
                <rect x="135" y="155" width="55" height="42" rx="12" fill="#0f172a" stroke="#06b6d4" strokeWidth="4" />
                <circle cx="162" cy="176" r="16" fill="url(#lensGrad)" />
                <circle cx="158" cy="172" r="5" fill="#ffffff" opacity="0.8" />

                {/* Right Barrel */}
                <rect x="210" y="155" width="55" height="42" rx="12" fill="#0f172a" stroke="#06b6d4" strokeWidth="4" />
                <circle cx="237" cy="176" r="16" fill="url(#lensGrad)" />
                <circle cx="233" cy="172" r="5" fill="#ffffff" opacity="0.8" />

                {/* Bridge */}
                <rect x="185" y="168" width="30" height="12" rx="4" fill="#334155" stroke="#06b6d4" strokeWidth="2" />
              </g>

              {/* Hands holding the binoculars */}
              <ellipse cx="126" cy="180" rx="12" ry="10" fill="#fed7aa" stroke="#334155" strokeWidth="2" />
              <ellipse cx="274" cy="180" rx="12" ry="10" fill="#fed7aa" stroke="#334155" strokeWidth="2" />
            </motion.g>
          )}

          {/* STATE 2: ACTIVE -> Sensei holding binoculars down & waving! */}
          {!isIdle && (
            <g>
              {/* Lowered Binoculars on chest */}
              <g transform="translate(145, 230) scale(0.65)" filter="url(#neonGlow)">
                <rect x="0" y="0" width="45" height="35" rx="10" fill="#0f172a" stroke="#06b6d4" strokeWidth="3" />
                <circle cx="22" cy="17" r="11" fill="url(#lensGrad)" />

                <rect x="55" y="0" width="45" height="35" rx="10" fill="#0f172a" stroke="#06b6d4" strokeWidth="3" />
                <circle cx="77" cy="17" r="11" fill="url(#lensGrad)" />

                <rect x="42" y="10" width="16" height="10" rx="3" fill="#334155" />
              </g>

              {/* Left hand holding binoculars */}
              <ellipse cx="140" cy="245" rx="14" ry="11" fill="#fed7aa" stroke="#334155" strokeWidth="2" />

              {/* Right hand waving cheerfully */}
              <motion.g
                animate={{
                  rotate: [0, 20, -10, 20, 0],
                  originX: "285px",
                  originY: "250px"
                }}
                transition={{
                  repeat: Infinity,
                  duration: 1.8,
                  ease: "easeInOut"
                }}
              >
                <ellipse cx="285" cy="235" rx="15" ry="13" fill="#fed7aa" stroke="#334155" strokeWidth="2" />
                {/* Waving fingers */}
                <circle cx="280" cy="223" r="5" fill="#fed7aa" />
                <circle cx="290" cy="222" r="5" fill="#fed7aa" />
                <circle cx="298" cy="227" r="5" fill="#fed7aa" />
              </motion.g>
            </g>
          )}
        </svg>
      </motion.div>
    </div>
  );
}
