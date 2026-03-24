import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { FiFileText, FiImage, FiMic, FiBriefcase, FiActivity } from 'react-icons/fi'

const STEPS = [
  "▸ Initializing analysis engine...",
  "▸ Processing input data...",
  "▸ Querying Gemini AI...",
  "▸ Computing confidence scores...",
  "▸ Generating verdict..."
]

const ICONS = {
  news: <FiFileText size={20} color="#334155" />,
  image: <FiImage size={20} color="#334155" />,
  voice: <FiMic size={20} color="#334155" />,
  job: <FiBriefcase size={20} color="#334155" />,
  fraud: <FiActivity size={20} color="#334155" />
}

export default function LoaderOverlay({ module }) {
  const [stepIdx, setStepIdx] = useState(0)

  useEffect(() => {
    const iv = setInterval(() => {
      setStepIdx(i => (i + 1 < STEPS.length ? i + 1 : i))
    }, 900)
    return () => clearInterval(iv)
  }, [])

  return (
    <motion.div
      className="fixed inset-0 flex items-center justify-center z-[900]"
      style={{ background: 'rgba(3,5,10,0.85)', backdropFilter: 'blur(8px)' }}
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
    >
      <div className="flex flex-col items-center">
        
        {/* Spinner & Inner Icon */}
        <div className="relative flex items-center justify-center" style={{ width: 56, height: 56 }}>
          <div 
            className="absolute inset-0 rounded-full" 
            style={{ border: '2px solid rgba(37,99,235,0.15)', borderTop: '2px solid #2563eb', animation: 'spin 0.8s linear infinite' }} 
          />
          <div className="absolute flex items-center justify-center">
            {ICONS[module] || ICONS.news}
          </div>
        </div>

        {/* Status text */}
        <div className="h-6 mt-[20px] overflow-hidden relative w-64 text-center">
          <AnimatePresence mode="wait">
            <motion.p 
              key={stepIdx} 
              className="absolute inset-x-0"
              style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '13px', color: '#64748b' }}
              initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -5 }}
              transition={{ duration: 0.2 }}
            >
              {STEPS[stepIdx]}
            </motion.p>
          </AnimatePresence>
        </div>

        {/* Progress bar */}
        <div style={{ width: '240px', height: '2px', background: 'rgba(255,255,255,0.05)', borderRadius: '1px', marginTop: '16px', overflow: 'hidden' }}>
          <div style={{ background: '#2563eb', height: '100%', borderRadius: '1px', transformOrigin: 'left', animation: 'progressFill 4s ease forwards' }} />
        </div>
        
      </div>
    </motion.div>
  )
}
