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
    <div className="relative flex flex-col items-center justify-center select-none w-72 h-72 sm:w-84 sm:h-84 md:w-96 md:h-96">
      {/* Background Soft Glow Aura */}
      <div 
        className={`absolute inset-0 rounded-full blur-3xl transition-all duration-700 pointer-events-none ${
          isIdle 
            ? 'bg-cyan-500/15 scale-95' 
            : state === 'celebrating'
            ? 'bg-amber-400/25 scale-125'
            : 'bg-gradient-to-tr from-cyan-500/25 via-blue-500/20 to-purple-500/25 scale-110'
        }`}
      />

      {/* Main Mascot Animated Container */}
      <motion.div
        className="relative z-10 w-full h-full flex items-center justify-center"
        animate={
          isIdle
            ? { y: [0, -6, 0] }
            : { y: [0, -10, 0] }
        }
        transition={{
          repeat: Infinity,
          duration: isIdle ? 3.2 : 2.2,
          ease: "easeInOut"
        }}
      >
        <svg
          viewBox="0 0 400 400"
          className="w-full h-full filter drop-shadow-[0_12px_28px_rgba(0,0,0,0.45)]"
        >
          <defs>
            {/* Gradients */}
            <linearGradient id="bodyGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#1e293b" />
              <stop offset="100%" stopColor="#0f172a" />
            </linearGradient>

            <linearGradient id="skinGrad" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#fef08a" />
              <stop offset="10%" stopColor="#fed7aa" />
              <stop offset="100%" stopColor="#fdba74" />
            </linearGradient>

            <linearGradient id="cyanNeon" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#06b6d4" />
              <stop offset="100%" stopColor="#3b82f6" />
            </linearGradient>

            <linearGradient id="binocularGrad" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#0284c7" />
              <stop offset="100%" stopColor="#0f172a" />
            </linearGradient>

            <linearGradient id="lensGlow" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#38bdf8" />
              <stop offset="100%" stopColor="#0369a1" />
            </linearGradient>

            <radialGradient id="beamGrad" cx="50%" cy="0%" r="90%">
              <stop offset="0%" stopColor="#38bdf8" stopOpacity="0.4" />
              <stop offset="100%" stopColor="#06b6d4" stopOpacity="0" />
            </radialGradient>

            {/* Neon Glow Filter */}
            <filter id="neonBlur" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="3" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
          </defs>

          {/* 1. GROUND SHADOW */}
          <ellipse cx="200" cy="385" rx="90" ry="12" fill="#000000" opacity="0.35" />

          {/* 2. BACK HAIR TUFTS (Wise White Hair Behind Head) */}
          <path
            d="M 125 155 C 105 170, 105 210, 130 225 C 120 200, 125 175, 125 155 Z"
            fill="#f1f5f9"
          />
          <path
            d="M 275 155 C 295 170, 295 210, 270 225 C 280 200, 275 175, 275 155 Z"
            fill="#f1f5f9"
          />

          {/* 3. TORSO & KIMONO ROBE */}
          {/* Main Kimono Body */}
          <path
            d="M 115 270 C 115 240, 160 235, 200 235 C 240 235, 285 240, 285 270 L 315 380 L 85 380 Z"
            fill="url(#bodyGrad)"
            stroke="#334155"
            strokeWidth="3"
          />

          {/* Belt (Obi) with Cyan Trim */}
          <rect x="135" y="340" width="130" height="26" rx="5" fill="#090d16" stroke="#06b6d4" strokeWidth="2" />
          <line x1="200" y1="340" x2="200" y2="366" stroke="#06b6d4" strokeWidth="2" />

          {/* Kimono Crossed V-Lapels with Cyan Neon Border */}
          <path
            d="M 155 240 L 200 335 L 245 240"
            stroke="url(#cyanNeon)"
            strokeWidth="6"
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="none"
          />
          <path
            d="M 170 250 L 200 310 L 230 250"
            stroke="#1e293b"
            strokeWidth="4"
            fill="none"
          />

          {/* 4. NECK */}
          <path
            d="M 180 210 L 220 210 L 216 245 C 210 248, 190 248, 184 245 Z"
            fill="url(#skinGrad)"
          />

          {/* 5. EARS */}
          <circle cx="128" cy="180" r="14" fill="url(#skinGrad)" />
          <circle cx="128" cy="180" r="8" fill="#fda4af" opacity="0.5" />
          <circle cx="272" cy="180" r="14" fill="url(#skinGrad)" />
          <circle cx="272" cy="180" r="8" fill="#fda4af" opacity="0.5" />

          {/* 6. HEAD */}
          <ellipse cx="200" cy="175" rx="74" ry="68" fill="url(#skinGrad)" />

          {/* 7. HEADBAND (HACHIMAKI) - Wraps forehead naturally */}
          <path
            d="M 126 142 C 160 126, 240 126, 274 142 L 273 118 C 240 102, 160 102, 127 118 Z"
            fill="#ffffff"
            stroke="#cbd5e1"
            strokeWidth="1.5"
          />
          {/* Headband Knot Ribbon Tails hanging on left side */}
          <path
            d="M 126 130 C 110 135, 102 155, 108 175 C 114 165, 116 150, 126 140 Z"
            fill="#ffffff"
          />
          <path
            d="M 122 135 C 104 145, 96 170, 98 190 C 106 175, 110 160, 122 145 Z"
            fill="#e2e8f0"
          />
          {/* Japanese Red Sun / Kaizen Crest Emblem */}
          <circle cx="200" cy="126" r="12" fill="#ef4444" />
          <circle cx="200" cy="126" r="6" fill="#dc2626" />

          {/* 8. WHITE EYEBROWS */}
          <motion.path
            d="M 148 145 C 165 132, 185 140, 192 148 C 185 144, 165 138, 148 145 Z"
            fill="#ffffff"
            filter="drop-shadow(0 2px 2px rgba(0,0,0,0.1))"
            animate={
              isIdle
                ? { y: [0, -2, 0] }
                : { y: [0, -4, 0] }
            }
            transition={{ repeat: Infinity, duration: 2.5 }}
          />
          <motion.path
            d="M 252 145 C 235 132, 215 140, 208 148 C 215 144, 235 138, 252 145 Z"
            fill="#ffffff"
            filter="drop-shadow(0 2px 2px rgba(0,0,0,0.1))"
            animate={
              isIdle
                ? { y: [0, -2, 0] }
                : { y: [0, -4, 0] }
            }
            transition={{ repeat: Infinity, duration: 2.5 }}
          />

          {/* 9. EYES (Visible when Active / Lowered Binoculars) */}
          {!isIdle && (
            <g>
              {/* Left Eye */}
              <motion.g
                animate={{ scaleY: [1, 1, 0.1, 1, 1] }}
                transition={{ repeat: Infinity, duration: 4.2, times: [0, 0.9, 0.95, 0.98, 1] }}
                style={{ originX: "168px", originY: "168px" }}
              >
                <ellipse cx="168" cy="168" rx="11" ry="13" fill="#0f172a" />
                <circle cx="171" cy="164" r="4.5" fill="#ffffff" />
                <circle cx="165" cy="172" r="2" fill="#ffffff" />
              </motion.g>

              {/* Right Eye */}
              <motion.g
                animate={{ scaleY: [1, 1, 0.1, 1, 1] }}
                transition={{ repeat: Infinity, duration: 4.2, times: [0, 0.9, 0.95, 0.98, 1] }}
                style={{ originX: "232px", originY: "168px" }}
              >
                <ellipse cx="232" cy="168" rx="11" ry="13" fill="#0f172a" />
                <circle cx="235" cy="164" r="4.5" fill="#ffffff" />
                <circle cx="229" cy="172" r="2" fill="#ffffff" />
              </motion.g>

              {/* Rosy Friendly Cheeks */}
              <ellipse cx="150" cy="184" rx="12" ry="7" fill="#fb7185" opacity="0.45" />
              <ellipse cx="250" cy="184" rx="12" ry="7" fill="#fb7185" opacity="0.45" />

              {/* Cute Nose */}
              <path
                d="M 196 176 C 200 180, 204 180, 204 176"
                stroke="#ea580c"
                strokeWidth="2.5"
                strokeLinecap="round"
                fill="none"
              />
            </g>
          )}

          {/* 10. MOUTH (Behind beard / animated when speaking) */}
          {!isIdle && (
            <motion.path
              d="M 190 196 Q 200 208 210 196"
              stroke="#b91c1c"
              strokeWidth="4"
              strokeLinecap="round"
              fill="none"
              animate={
                isSpeaking
                  ? { d: ["M 190 196 Q 200 214 210 196", "M 190 196 Q 200 202 210 196", "M 190 196 Q 200 214 210 196"] }
                  : {}
              }
              transition={{ repeat: Infinity, duration: 0.22 }}
            />
          )}

          {/* 11. SENSEI MUSTACHE & FLOWING BEARD */}
          {/* Mustache Layer */}
          <path
            d="M 200 190 C 180 188, 150 198, 140 216 C 160 214, 185 204, 200 206 C 215 204, 240 214, 260 216 C 250 198, 220 188, 200 190 Z"
            fill="#ffffff"
            stroke="#e2e8f0"
            strokeWidth="1.5"
          />
          {/* Long Flowing Beard Layer */}
          <path
            d="M 152 208 C 145 240, 165 295, 200 300 C 235 295, 255 240, 248 208 C 235 230, 215 234, 200 234 C 185 234, 165 230, 152 208 Z"
            fill="#ffffff"
            stroke="#cbd5e1"
            strokeWidth="1.5"
            filter="drop-shadow(0 4px 6px rgba(0,0,0,0.15))"
          />

          {/* 12. ARMS & ACTIONS */}

          {/* === SCENARIO A: IDLE (Binoculars Held to Eyes with Connected Arms) === */}
          {isIdle && (
            <motion.g
              animate={{
                x: [-14, 14, -14],
                rotate: [-3, 3, -3],
              }}
              transition={{
                repeat: Infinity,
                duration: 3.5,
                ease: "easeInOut",
              }}
              style={{ originX: "200px", originY: "170px" }}
            >
              {/* Scanning Beams projecting forward */}
              <polygon points="152,170 80,310 140,310" fill="url(#beamGrad)" />
              <polygon points="248,170 260,310 320,310" fill="url(#beamGrad)" />

              {/* Arms reaching up to hold binoculars */}
              {/* Left Kimono Sleeve */}
              <path
                d="M 115 270 C 100 230, 110 185, 138 175 L 148 195 C 130 205, 125 240, 135 275 Z"
                fill="url(#bodyGrad)"
                stroke="#334155"
                strokeWidth="2"
              />
              {/* Right Kimono Sleeve */}
              <path
                d="M 285 270 C 300 230, 290 185, 262 175 L 252 195 C 270 205, 275 240, 265 275 Z"
                fill="url(#bodyGrad)"
                stroke="#334155"
                strokeWidth="2"
              />

              {/* High-Tech Binoculars Body */}
              <g filter="url(#neonBlur)">
                {/* Bridge */}
                <rect x="184" y="160" width="32" height="14" rx="4" fill="#0f172a" stroke="#06b6d4" strokeWidth="2" />
                <circle cx="200" cy="167" r="4" fill="#06b6d4" />

                {/* Left Barrel */}
                <rect x="126" y="146" width="58" height="46" rx="14" fill="url(#binocularGrad)" stroke="#06b6d4" strokeWidth="3" />
                <circle cx="155" cy="169" r="17" fill="url(#lensGlow)" stroke="#e0f2fe" strokeWidth="2.5" />
                <circle cx="151" cy="164" r="5" fill="#ffffff" opacity="0.9" />

                {/* Right Barrel */}
                <rect x="216" y="146" width="58" height="46" rx="14" fill="url(#binocularGrad)" stroke="#06b6d4" strokeWidth="3" />
                <circle cx="245" cy="169" r="17" fill="url(#lensGlow)" stroke="#e0f2fe" strokeWidth="2.5" />
                <circle cx="241" cy="164" r="5" fill="#ffffff" opacity="0.9" />
              </g>

              {/* Hands realistically gripping the outer barrels */}
              <ellipse cx="124" cy="170" rx="11" ry="14" fill="url(#skinGrad)" stroke="#c2410c" strokeWidth="1.5" />
              <ellipse cx="276" cy="170" rx="11" ry="14" fill="url(#skinGrad)" stroke="#c2410c" strokeWidth="1.5" />
            </motion.g>
          )}

          {/* === SCENARIO B: ACTIVE (Binoculars Lowered, Cheerful Wave) === */}
          {!isIdle && (
            <g>
              {/* Left Arm: Resting at hip holding the binoculars down */}
              <path
                d="M 115 270 C 105 295, 115 325, 135 335 L 148 318 C 132 310, 126 290, 132 270 Z"
                fill="url(#bodyGrad)"
                stroke="#334155"
                strokeWidth="2"
              />
              {/* Lowered Binoculars on chest/side */}
              <g transform="translate(130, 290) scale(0.65)" filter="url(#neonBlur)">
                <rect x="0" y="0" width="45" height="34" rx="10" fill="url(#binocularGrad)" stroke="#06b6d4" strokeWidth="2.5" />
                <circle cx="22" cy="17" r="11" fill="url(#lensGlow)" />
                <rect x="50" y="0" width="45" height="34" rx="10" fill="url(#binocularGrad)" stroke="#06b6d4" strokeWidth="2.5" />
                <circle cx="72" cy="17" r="11" fill="url(#lensGlow)" />
                <rect x="38" y="10" width="18" height="10" rx="3" fill="#0f172a" />
              </g>
              {/* Left Hand holding lowered binoculars */}
              <circle cx="140" cy="298" r="10" fill="url(#skinGrad)" stroke="#c2410c" strokeWidth="1.5" />

              {/* Right Arm: Raised and waving cheerily! */}
              <motion.g
                animate={{
                  rotate: [0, 16, -6, 16, 0],
                  originX: "285px",
                  originY: "270px"
                }}
                transition={{
                  repeat: Infinity,
                  duration: 1.8,
                  ease: "easeInOut"
                }}
              >
                {/* Sleeve from shoulder up to wrist */}
                <path
                  d="M 285 270 C 310 250, 320 215, 305 185 L 285 198 C 295 220, 288 245, 270 262 Z"
                  fill="url(#bodyGrad)"
                  stroke="#334155"
                  strokeWidth="2"
                />

                {/* Forearm and Hand */}
                <path
                  d="M 292 195 L 305 178 C 308 174, 314 176, 314 182 L 305 198 Z"
                  fill="url(#skinGrad)"
                />

                {/* Waving Palm & Fingers */}
                <ellipse cx="312" cy="170" rx="13" ry="11" fill="url(#skinGrad)" stroke="#c2410c" strokeWidth="1.5" />
                {/* Cute Fingers */}
                <circle cx="304" cy="158" r="4.5" fill="url(#skinGrad)" />
                <circle cx="313" cy="156" r="4.5" fill="url(#skinGrad)" />
                <circle cx="321" cy="159" r="4" fill="url(#skinGrad)" />
                <circle cx="327" cy="166" r="3.5" fill="url(#skinGrad)" />
              </motion.g>
            </g>
          )}
        </svg>
      </motion.div>
    </div>
  );
}
