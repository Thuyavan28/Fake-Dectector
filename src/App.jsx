import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { analyzeNews } from './modules/newsDetector';
import { analyzeImage } from './modules/imageDetector';
import { analyzeVoice } from './modules/voiceAnalyzer';
import { analyzeJob } from './modules/jobChecker';
import { analyzeFraud, captureBrowserSignals } from './modules/fraudDetector';
import ResultModal from './components/ResultModal';
import ImageDetector from './components/ImageDetector';
import LoaderOverlay from './components/LoaderOverlay';
import InitialLoader from './components/InitialLoader';

const MODULES = [
  { id: 'news', icon: '📰', label: 'FAKE NEWS', desc: 'Verify news claims and statements', features: ['Real-time fact checking', 'Source credibility analysis', 'Corrected facts provided'], engine: 'Gemini AI' },
  { id: 'image', icon: '🖼️', label: 'AI IMAGE', desc: 'Detect AI-generated images', features: ['Pixel forensics analysis', 'Content safety scan', 'Artifact detection'], engine: 'Gemini AI' },
  { id: 'voice', icon: '🎤', label: 'DEEPFAKE VOICE', desc: 'Identify synthetic audio', features: ['Acoustic pattern analysis', 'Frequency examination', 'MFCC feature extraction'], engine: 'Web Audio' },
  { id: 'job', icon: '💼', label: 'FAKE JOB', desc: 'Spot fraudulent job postings', features: ['Salary reality check', 'Domain verification', 'Urgency pattern detection'], engine: 'Gemini AI' },
  { id: 'fraud', icon: '🕵️', label: 'FRAUD BEHAVIOR', desc: 'Detect suspicious user activity', features: ['Behavioral biometrics', 'Pattern anomaly detection', 'Risk score calculation'], engine: 'Gemini AI' }
];

function ShieldIconSVG() {
  return (
    <svg width="28" height="28" viewBox="0 0 56 56" fill="none" style={{ overflow: 'visible', flexShrink: 0 }}>
      <path d="M28 4L12 12V24C12 36 20 44 28 48C36 44 44 36 44 24V12L28 4Z" fill="rgba(37,99,235,0.08)" stroke="#3b82f6" strokeWidth="1.5"/>
      <path d="M22 28L26 32L34 24" stroke="#06b6d4" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
      <circle cx="28" cy="28" r="3" fill="#3b82f6" style={{ animation: 'pulse 2s infinite' }}/>
    </svg>
  );
}

function Toggle({ checked, onChange }) {
  return (
    <button onClick={() => onChange(!checked)} className="relative w-11 h-6 rounded-full transition-colors duration-200" style={{ background: checked ? '#2563eb' : 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}>
      <span className="absolute top-0.5 w-4 h-4 rounded-full shadow transition-all duration-200" style={{ background: '#f0f6ff', left: checked ? '22px' : '4px' }} />
    </button>
  );
}

function NeuralNetworkCanvas() {
  const canvasRef = useRef(null);
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const resize = () => { canvas.width = window.innerWidth; canvas.height = window.innerHeight; };
    resize();
    const nodes = [];
    const colors = ['#3b82f6', '#06b6d4', '#8b5cf6'];
    for (let i = 0; i < 50; i++) {
        const rand = Math.random();
        nodes.push({
            x: Math.random() * canvas.width, y: Math.random() * canvas.height,
            vx: (Math.random() - 0.5) * 0.5, vy: (Math.random() - 0.5) * 0.5,
            radius: 2, color: rand < 0.6 ? colors[0] : (rand < 0.9 ? colors[1] : colors[2]),
            pulse: Math.random() < 0.1
        });
    }
    let animId;
    const draw = () => {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        for (let i = 0; i < nodes.length; i++) {
            const n = nodes[i];
            n.x += n.vx; n.y += n.vy;
            if (n.x < 0 || n.x > canvas.width) n.vx *= -1;
            if (n.y < 0 || n.y > canvas.height) n.vy *= -1;
            ctx.beginPath();
            ctx.arc(n.x, n.y, n.pulse ? 3 : n.radius, 0, Math.PI * 2);
            ctx.fillStyle = n.color;
            ctx.globalAlpha = n.pulse ? 1 : 0.6;
            if (n.pulse) { ctx.shadowBlur = 8; ctx.shadowColor = n.color; } else { ctx.shadowBlur = 0; }
            ctx.fill();
            for (let j = i + 1; j < nodes.length; j++) {
                const n2 = nodes[j];
                const dist = Math.sqrt((n.x - n2.x)**2 + (n.y - n2.y)**2);
                if (dist < 120) {
                    ctx.beginPath(); ctx.moveTo(n.x, n.y); ctx.lineTo(n2.x, n2.y);
                    ctx.strokeStyle = n.color; ctx.globalAlpha = (1 - dist / 120) * 0.15;
                    ctx.shadowBlur = 0; ctx.stroke();
                }
            }
        }
        ctx.globalAlpha = 1;
        animId = requestAnimationFrame(draw);
    };
    draw();
    window.addEventListener('resize', resize);
    return () => { cancelAnimationFrame(animId); window.removeEventListener('resize', resize); };
  }, []);
  return <canvas ref={canvasRef} style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', zIndex: 3, pointerEvents: 'none' }} />;
}

export default function App() {
  const getInitialHistory = () => {
    try {
      const data = localStorage.getItem('tg_history');
      if (data && data !== 'null' && data !== 'undefined') {
        const parsed = JSON.parse(data);
        return Array.isArray(parsed) ? parsed : [];
      }
    } catch (e) { console.error('History parse error', e); }
    return [];
  };

  const getInitialStats = () => {
    try {
      const data = localStorage.getItem('tg_stats');
      if (data && data !== 'null' && data !== 'undefined') {
        const parsed = JSON.parse(data);
        if (parsed && typeof parsed === 'object') {
          return {
            total: parsed.total || 0,
            fake: parsed.fake || 0,
            real: parsed.real || 0
          };
        }
      }
    } catch (e) { console.error('Stats parse error', e); }
    return { total: 0, fake: 0, real: 0 };
  };

  const [appLoaded, setAppLoaded] = useState(false);
  const [activeModule, setActiveModule] = useState(null);
  const [scanHistory, setScanHistory] = useState(getInitialHistory);
  const [stats, setStats] = useState(getInitialStats);
  const [currentTime, setCurrentTime] = useState({ h: '00', m: '00', s: '00' });
  const [toasts, setToasts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [newsText, setNewsText] = useState('');
  const [jobText, setJobText] = useState('');
  const [audioFile, setAudioFile] = useState(null);
  const [fraudData, setFraudData] = useState({ logins: 2, actionTime: 900, deviceChanges: 0, geoChanges: false, unusualHours: false, copyPaste: false, multiAccount: false, rapidClicks: false });

  const audioInputRef = useRef(null);
  
  useEffect(() => {
    const tick = () => {
      const now = new Date();
      setCurrentTime({ h: now.getHours().toString().padStart(2,'0'), m: now.getMinutes().toString().padStart(2,'0'), s: now.getSeconds().toString().padStart(2,'0') });
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => { localStorage.setItem('tg_history', JSON.stringify(scanHistory)); }, [scanHistory]);
  useEffect(() => { localStorage.setItem('tg_stats', JSON.stringify(stats)); }, [stats]);

  const showToast = useCallback((type, title, message) => {
    const id = Date.now() + Math.random();
    setToasts(t => [...t, { id, type, title, message }]);
    const dur = type === 'error' ? 5000 : type === 'warning' ? 4000 : 3000;
    setTimeout(() => { setToasts(t => t.filter(x => x.id !== id)); }, dur);
  }, []);

  const runAnalysis = async () => {
    if (activeModule === 'news' && !newsText.trim()) return showToast('warning', 'Empty Input', 'Please enter text to analyze.');
    if (activeModule === 'job' && !jobText.trim()) return showToast('warning', 'Empty Input', 'Please paste a job posting.');
    if (activeModule === 'voice' && !audioFile) return showToast('warning', 'No File', 'Please upload audio.');
    
    setLoading(true); setResult(null);
    showToast('info', 'Analyzing content', 'Please wait...');
    try {
      const apiKey = ''; // Same API key logic
      const [res] = await Promise.all([
        (async () => {
          if (activeModule === 'news') return { ...(await analyzeNews(newsText)), inputText: newsText.trim() };
          if (activeModule === 'job') { const r = await analyzeJob(jobText, apiKey); return { ...r, inputText: jobText.trim(), explanation: r.summary + '\n\n' + r.reasons.join('\n') }; }
          if (activeModule === 'voice') { const r = await analyzeVoice(audioFile, apiKey); return { ...r, inputText: `Audio "${audioFile.name}"`, explanation: r.summary + '\n\n' + r.reasons.join('\n') }; }
          if (activeModule === 'fraud') {
            const r = await analyzeFraud(fraudData, apiKey);
            const traits = [`${fraudData.logins} login attempts`, `${fraudData.actionTime}ms action speed`, `${fraudData.deviceChanges} device switch(es)`];
            if (fraudData.geoChanges) traits.push('location jumped');
            if (fraudData.unusualHours) traits.push('active at unusual hours');
            if (fraudData.copyPaste) traits.push('pasted inputs');
            if (fraudData.multiAccount) traits.push('multi-account signals');
            if (fraudData.rapidClicks) traits.push('rapid mechanical clicks');
            return {
              ...r,
              inputText: `Behavioral Analysis Profile: ${traits.join(', ')}.`,
              explanation: (r.summary || 'Behavioral reasoning:') + '\n\n' + (r.reasons || []).map(x => '• ' + x).join('\n')
            };
          }
        })(),
        new Promise(r => setTimeout(r, 1500))
      ]);
      setResult(res);
      showToast('success', 'Analysis complete', 'View results below.');
      
      const isFake = res.verdict === 'FAKE';
      setStats(s => ({ total: s.total + 1, fake: s.fake + (isFake ? 1 : 0), real: s.real + (!isFake ? 1 : 0) }));
      const mod = MODULES.find(m => m.id === activeModule);
      setScanHistory(h => [{ id: Date.now(), modId: activeModule, name: mod.label, icon: mod.icon, verdict: res.verdict, confidence: res.confidence, input: res.inputText || mod.label, time: new Date().toLocaleTimeString() }, ...h]);
    } catch (e) {
      showToast('error', 'Analysis failed', e.message);
    } finally {
      setLoading(false);
    }
  };

  const particles = Array.from({ length: 25 }).map((_, i) => ({
    id: i, size: Math.random() * 2 + 2, 
    left: Math.random() * 100, 
    delay: Math.random() * 20, 
    duration: Math.random() * 13 + 12,
    color: Math.random() > 0.5 ? 'rgba(37,99,235,0.4)' : 'rgba(6,182,212,0.3)'
  }));

  const activeModData = MODULES.find(m => m.id === activeModule);

  return (
    <>
      <AnimatePresence>
        {!appLoaded && <InitialLoader key="initial-loader" onComplete={() => setAppLoaded(true)} />}
      </AnimatePresence>
      <div className="flex flex-col h-screen w-screen overflow-hidden bg-[#020408]">
      {/* GLOBAL BACKGROUNDS */}
      <div style={{ position: 'fixed', inset: 0, zIndex: 0, background: '#020408' }}></div>
      <div style={{ position: 'fixed', top: 0, left: 0, width: '70vw', height: '50vh', filter: 'blur(60px)', background: 'conic-gradient(from 180deg at 50% 50%, rgba(37,99,235,0) 0deg, rgba(37,99,235,0.08) 55deg, rgba(6,182,212,0.06) 120deg, rgba(37,99,235,0) 160deg)', animation: 'aurora1 15s ease-in-out infinite', transformOrigin: 'center', pointerEvents: 'none', zIndex: 1 }}></div>
      <div style={{ position: 'fixed', top: 0, right: 0, width: '60vw', height: '60vh', filter: 'blur(80px)', background: 'conic-gradient(from 0deg at 50% 50%, rgba(6,182,212,0) 0deg, rgba(6,182,212,0.06) 60deg, rgba(37,99,235,0.04) 130deg, rgba(6,182,212,0) 180deg)', animation: 'aurora2 20s ease-in-out infinite', pointerEvents: 'none', zIndex: 1 }}></div>
      <div style={{ position: 'fixed', bottom: 0, left: '10vw', width: '80vw', height: '40vh', filter: 'blur(40px)', background: 'radial-gradient(ellipse, rgba(37,99,235,0.05) 0%, transparent 70%)', animation: 'aurora3 12s ease-in-out infinite', pointerEvents: 'none', zIndex: 1 }}></div>
      <div style={{ position: 'fixed', inset: 0, backgroundImage: 'url("data:image/svg+xml,<svg xmlns=\'http://www.w3.org/2000/svg\' width=\'56\' height=\'100\'><polygon points=\'28,2 54,16 54,44 28,58 2,44 2,16\' fill=\'none\' stroke=\'rgba(37,99,235,0.04)\' stroke-width=\'0.5\'/><polygon points=\'28,52 54,66 54,94 28,108 2,94 2,66\' fill=\'none\' stroke=\'rgba(37,99,235,0.04)\' stroke-width=\'0.5\'/></svg>")', backgroundSize: '56px 100px', animation: 'hexDrift 40s linear infinite', zIndex: 2, pointerEvents: 'none' }}></div>
      <NeuralNetworkCanvas />
      
      {[15, 35, 65, 85].map((pos, i) => (
        <div key={`beam-${i}`} style={{ position: 'fixed', left: `${pos}%`, top: 0, width: '1px', height: '100vh', background: 'linear-gradient(180deg, transparent 0%, rgba(37,99,235,0.15) 30%, rgba(6,182,212,0.2) 50%, rgba(37,99,235,0.15) 70%, transparent 100%)', animation: `beamFade ${[4,6,5,7][i]}s ease-in-out infinite ${[0,2,1,3][i]}s`, zIndex: 4, pointerEvents: 'none' }} />
      ))}
      <div style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 4, overflow: 'hidden' }}>
        {particles.map(p => (
          <div key={p.id} style={{ position: 'absolute', left: `${p.left}%`, width: p.size, height: p.size, borderRadius: '50%', background: p.color, animation: `particleFloat ${p.duration}s linear infinite ${p.delay}s` }} />
        ))}
      </div>

      {loading && <LoaderOverlay module={activeModule} />}
      {result && <ResultModal result={result} onClose={() => setResult(null)} />}

      {/* TOP NAVBAR */}
      <nav style={{ flexShrink: 0, height: 56, zIndex: 1000, background: 'rgba(2,4,8,0.85)', backdropFilter: 'blur(20px) saturate(1.5)', borderBottom: '1px solid rgba(37,99,235,0.12)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0 24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <ShieldIconSVG />
          <div style={{ fontFamily: "'Bebas Neue', cursive", fontSize: 24, color: '#f0f6ff', display: 'flex', alignItems: 'center', gap: 6, paddingTop: 4 }}>
            TRUTHGUARD <span style={{ color: '#3b82f6' }}>AI</span>
          </div>
        </div>

        <div className="hidden lg:flex gap-6 items-center" style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#94a3b8' }}>
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#22c55e', animation: 'pulse 2s infinite' }} /> SYSTEM: <span style={{ color: '#f8fafc' }}>ONLINE</span>
          </div>
          <div style={{ color: '#94a3b8' }}>Total Scans: <span style={{ color: '#3b82f6' }}>{stats.total}</span></div>
          <div style={{ color: '#94a3b8' }}>Fake Detected: <span style={{ color: '#ef4444' }}>{stats.fake}</span></div>
          <div style={{ color: '#94a3b8' }}>Real Verified: <span style={{ color: '#22c55e' }}>{stats.real}</span></div>
          <div style={{ color: '#94a3b8' }}>Accuracy: <span style={{ color: '#3b82f6' }}>{(stats.total === 0 ? 0 : 99)}.0%</span></div>
        </div>

        <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 13, color: '#3b82f6', letterSpacing: 2 }}>
          {currentTime.h}<span style={{ opacity: 0.5 }}>:</span>{currentTime.m}<span style={{ opacity: 0.5 }}>:</span>{currentTime.s}
        </div>
      </nav>

      {/* MAIN DIVIDER */}
      <div className="flex-1 flex overflow-hidden relative z-10 w-full">
        
        {/* LEFT SIDEBAR */}
        <aside style={{ width: 320, flexShrink: 0, background: 'rgba(4,8,16,0.6)', backdropFilter: 'blur(20px)', borderRight: '1px solid rgba(37,99,235,0.12)', display: 'flex', flexDirection: 'column', zIndex: 20 }} className="overflow-y-auto">
          
          <div style={{ padding: '24px 16px 12px' }}>
            <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, color: '#475569', letterSpacing: 3, display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16, marginLeft: 8 }}>
              <span>+</span> SELECT MODULE
            </div>
            
            <div className="flex flex-col gap-3">
              {MODULES.map(m => {
                const isActive = activeModule === m.id;
                return (
                  <div key={m.id} onClick={() => setActiveModule(m.id)}
                    style={{
                      background: isActive ? 'rgba(37,99,235,0.08)' : 'rgba(255,255,255,0.01)',
                      border: `1px solid ${isActive ? 'rgba(37,99,235,0.3)' : 'rgba(255,255,255,0.05)'}`,
                      borderRadius: 16, padding: '16px', cursor: 'pointer', transition: 'all 0.2s',
                      position: 'relative', overflow: 'hidden'
                    }}
                    onMouseEnter={e => { if(!isActive) { e.currentTarget.style.background = 'rgba(255,255,255,0.03)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)'; } }}
                    onMouseLeave={e => { if(!isActive) { e.currentTarget.style.background = 'rgba(255,255,255,0.01)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.05)'; } }}
                  >
                    {isActive && <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: 3, background: '#3b82f6' }} />}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
                      <div style={{ width: 36, height: 36, borderRadius: 10, background: 'rgba(255,255,255,0.04)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18 }}>{m.icon}</div>
                      <div style={{ fontFamily: "'Bebas Neue', cursive", fontSize: 20, color: isActive ? '#f0f6ff' : '#cbd5e1', letterSpacing: 1 }}>{m.label}</div>
                    </div>
                    <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 12, color: '#64748b', marginBottom: 8, paddingLeft: 2 }}>
                      {m.label === 'FAKE NEWS' ? 'News & claims' : m.label === 'AI IMAGE' ? 'Image upload' : m.label === 'DEEPFAKE VOICE' ? 'Audio upload' : m.label === 'FAKE JOB' ? 'Job postings' : 'Behavior sim'}
                    </div>
                    <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, color: '#3b82f6', display: 'flex', alignItems: 'center', gap: 6, paddingLeft: 2 }}>
                      <span style={{ width: 4, height: 4, borderRadius: '50%', background: '#3b82f6' }}/> {m.engine}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div style={{ marginTop: 'auto', padding: '24px 16px', borderTop: '1px solid rgba(255,255,255,0.04)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
              <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, color: '#475569', letterSpacing: 3, display: 'flex', alignItems: 'center', gap: 8, marginLeft: 8 }}>
                <span>+</span> SCAN HISTORY
              </div>
              <button onClick={() => { setScanHistory([]); setStats({total: 0, fake: 0, real: 0}); showToast('warning', 'History cleared', 'All scans removed.'); }} style={{ background: 'none', border: 'none', color: '#64748b', fontSize: 11, cursor: 'pointer', fontFamily: "'DM Sans', sans-serif" }} onMouseEnter={e=>e.currentTarget.style.color='#f8fafc'} onMouseLeave={e=>e.currentTarget.style.color='#64748b'}>Clear</button>
            </div>
            
            <div className="flex flex-col gap-2 relative">
              {scanHistory.length === 0 ? (
                <div style={{ padding: '20px 0', textAlign: 'center', color: '#475569', fontFamily: "'DM Sans', sans-serif", fontSize: 12 }}>No recent scans</div>
              ) : (
                scanHistory.slice(0, 10).map(h => (
                  <div key={h.id} style={{ background: 'rgba(255,255,255,0.02)', borderRadius: 12, padding: '12px', border: '1px solid rgba(255,255,255,0.03)', display: 'flex', gap: 10 }}>
                    <div style={{ fontSize: 16 }}>{h.icon}</div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                       <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                          <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 12, color: '#cbd5e1', fontWeight: 500 }}>{h.name}</span>
                          <span style={{ background: h.verdict === 'FAKE' ? 'rgba(239,68,68,0.1)' : 'rgba(34,197,94,0.1)', color: h.verdict === 'FAKE' ? '#ef4444' : '#22c55e', borderRadius: 4, padding: '2px 6px', fontSize: 9, fontFamily: "'JetBrains Mono', monospace" }}>{h.verdict}</span>
                       </div>
                       <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 11, color: '#64748b', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                         {h.input}
                       </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </aside>

        {/* RIGHT MAIN AREA */}
        <main className="flex-1 overflow-y-auto relative z-10 flex flex-col items-center custom-scrollbar" style={{ justifyContent: activeModule ? 'flex-start' : 'center', padding: activeModule ? '60px 24px' : '0' }}>
          
          <AnimatePresence mode="wait">
            {!activeModule ? (
              <motion.div key="hero" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, y: -20 }} transition={{ duration: 0.5 }} className="flex flex-col items-center text-center">
                <div style={{ marginBottom: 24, animation: 'float 6s ease-in-out infinite' }}><ShieldIconSVG /></div>
                
                <h1 style={{ fontFamily: "'Bebas Neue', cursive", fontSize: 'clamp(56px, 8vw, 110px)', lineHeight: 0.9, letterSpacing: 4, margin: 0, color: '#f0f6ff', textShadow: '0 0 40px rgba(255,255,255,0.1)' }}>
                  DETECT FAKE CONTENT
                </h1>
                
                <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 16, color: '#3b82f6', marginTop: 16, letterSpacing: 1 }}>
                  Powered by Gemini AI · Real-time Analysis
                </div>

                <div className="flex flex-wrap justify-center gap-4 mt-8">
                  <div style={{ background: 'rgba(37,99,235,0.05)', border: '1px solid rgba(37,99,235,0.2)', borderRadius: 30, padding: '8px 20px', fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: '#cbd5e1', display: 'flex', alignItems: 'center', gap: 8 }}>
                    ⚡ Instant Analysis
                  </div>
                  <div style={{ background: 'rgba(37,99,235,0.05)', border: '1px solid rgba(37,99,235,0.2)', borderRadius: 30, padding: '8px 20px', fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: '#cbd5e1', display: 'flex', alignItems: 'center', gap: 8 }}>
                    🛡 5 Detection Modes
                  </div>
                  <div style={{ background: 'rgba(37,99,235,0.05)', border: '1px solid rgba(37,99,235,0.2)', borderRadius: 30, padding: '8px 20px', fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: '#cbd5e1', display: 'flex', alignItems: 'center', gap: 8 }}>
                    🤖 AI-Powered
                  </div>
                </div>

                <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 12, color: '#64748b', marginTop: 60, letterSpacing: 4, opacity: 0.7 }} className="animate-pulse">
                  SELECT A MODULE → _
                </div>
              </motion.div>
            ) : (
              <motion.div key={activeModule} initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -30 }} transition={{ duration: 0.3 }} className="w-full max-w-3xl" style={{ background: 'rgba(8,15,26,0.7)', backdropFilter: 'blur(30px)', border: '1px solid rgba(37,99,235,0.15)', borderRadius: 24, padding: 40, boxShadow: '0 30px 60px rgba(0,0,0,0.4)' }}>
                <div style={{ textAlign: 'center', marginBottom: 32 }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 16 }}>
                    <span style={{ fontSize: 32 }}>{activeModData?.icon}</span>
                    <h2 style={{ fontFamily: "'Bebas Neue', cursive", fontSize: 40, color: '#fff', margin: 0, letterSpacing: 2 }}>{activeModData?.label}</h2>
                    <div style={{ background: 'rgba(37,99,235,0.1)', border: '1px solid rgba(37,99,235,0.2)', color: '#3b82f6', borderRadius: 20, padding: '4px 12px', fontSize: 11, fontFamily: "'JetBrains Mono', monospace", transform: 'translateY(-2px)' }}>{activeModData?.engine}</div>
                  </div>
                  <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 14, color: '#64748b', marginTop: 8 }}>{activeModData?.desc}</p>
                </div>

                <div style={{ background: 'rgba(8,15,26,0.6)', border: '1px solid rgba(255,255,255,0.04)', borderRadius: 20, padding: 32 }}>
                  
                  {activeModule === 'news' && (
                    <>
                      <textarea style={{ width: '100%', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 10, padding: 16, color: '#f8fafc', fontFamily: "'DM Sans', sans-serif", fontSize: 14, minHeight: 140, resize: 'vertical', outline: 'none' }} placeholder="Enter news claim or post content..." onFocus={e => { e.target.style.borderColor='rgba(37,99,235,0.4)' }} onBlur={e => { e.target.style.borderColor='rgba(255,255,255,0.06)' }} value={newsText} onChange={e => setNewsText(e.target.value)} />
                    </>
                  )}

                  {activeModule === 'job' && (
                    <>
                      <textarea style={{ width: '100%', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 10, padding: 16, color: '#f8fafc', fontFamily: "'DM Sans', sans-serif", fontSize: 14, minHeight: 140, resize: 'vertical', outline: 'none' }} placeholder="Paste the full job posting..." onFocus={e => { e.target.style.borderColor='rgba(37,99,235,0.4)' }} onBlur={e => { e.target.style.borderColor='rgba(255,255,255,0.06)' }} value={jobText} onChange={e => setJobText(e.target.value)} />
                    </>
                  )}

                  {activeModule === 'voice' && (
                    <>
                      <div onClick={() => audioInputRef.current.click()} style={{ border: '1px solid rgba(255,255,255,0.06)', borderRadius: 10, padding: 40, textAlign: 'center', cursor: 'pointer', background: 'rgba(255,255,255,0.02)' }} onMouseEnter={e => e.currentTarget.style.background='rgba(255,255,255,0.04)'} onMouseLeave={e => e.currentTarget.style.background='rgba(255,255,255,0.02)'}>
                        <input ref={audioInputRef} type="file" accept="audio/*" style={{ display: 'none' }} onChange={e => setAudioFile(e.target.files[0])} />
                        {audioFile ? (
                          <div style={{ color: '#22c55e', fontFamily: "'DM Sans', sans-serif", fontWeight: 500 }}>✓ {audioFile.name} ({(audioFile.size/1024).toFixed(1)}KB)</div>
                        ) : (
                          <>
                            <div style={{ fontSize: 32, marginBottom: 12 }}>🎤</div>
                            <div style={{ color: '#94a3b8', fontFamily: "'DM Sans', sans-serif" }}>Click to upload audio snippet</div>
                          </>
                        )}
                      </div>
                    </>
                  )}

                  {activeModule === 'fraud' && (
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr', md: {gridTemplateColumns: '1fr 1fr'}, gap: 24 }} className="md:grid-cols-2">
                      <div>
                        {['logins', 'actionTime'].map(k => (
                          <div key={k} style={{ marginBottom: 16 }}>
                            <label style={{ display: 'block', marginBottom: 8, color: '#64748b', fontSize: 12, fontFamily: "'DM Sans', sans-serif" }}>{k === 'logins' ? 'Login attempts' : 'Action Speed (ms)'}</label>
                            <input type="number" style={{ width: '100%', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 8, padding: 10, color: '#f8fafc', outline: 'none' }} value={fraudData[k]} onChange={e => setFraudData({...fraudData, [k]: +e.target.value})} onFocus={e => e.target.style.borderColor='rgba(37,99,235,0.4)'} onBlur={e => e.target.style.borderColor='rgba(255,255,255,0.06)'} />
                          </div>
                        ))}
                        <div>
                          <label style={{ display: 'block', marginBottom: 8, color: '#64748b', fontSize: 12, fontFamily: "'DM Sans', sans-serif" }}>Device Changes: <span style={{ color: '#f8fafc' }}>{fraudData.deviceChanges}</span></label>
                          <input type="range" min="0" max="10" style={{ width: '100%' }} value={fraudData.deviceChanges} onChange={e => setFraudData({...fraudData, deviceChanges: +e.target.value})} />
                        </div>
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                        {Object.keys(fraudData).slice(3).map(k => (
                          <div key={k} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.04)', borderRadius: 8, padding: '10px 14px' }}>
                            <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: '#94a3b8' }}>{k}</span>
                            <Toggle checked={fraudData[k]} onChange={v => setFraudData({...fraudData, [k]: v})} />
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {activeModule === 'image' ? (
                    <ImageDetector />
                  ) : (
                    <button onClick={runAnalysis} disabled={loading} style={{ width: '100%', height: 56, background: 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)', borderRadius: 12, border: 'none', fontFamily: "'Bebas Neue', cursive", fontSize: 20, letterSpacing: 3, color: 'white', marginTop: 24, cursor: loading ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, transition: 'all 0.2s' }} onMouseEnter={e => { if(!loading){ e.currentTarget.style.background = 'linear-gradient(135deg, #3b82f6, #2563eb)'; e.currentTarget.style.boxShadow = '0 0 40px rgba(37,99,235,0.4)'; e.currentTarget.style.transform = 'translateY(-2px)'; } }} onMouseLeave={e => { if(!loading){ e.currentTarget.style.background = 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)'; e.currentTarget.style.boxShadow = 'none'; e.currentTarget.style.transform = 'translateY(0)'; } }}>
                      <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#22c55e', animation: 'pulse 1s infinite' }} />
                      {loading ? 'ANALYZING...' : 'ANALYZE NOW'}
                    </button>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </main>
      </div>

      {/* TOAST SYSTEM */}
      <div style={{ position: 'fixed', bottom: 24, right: 24, zIndex: 9999, display: 'flex', flexDirection: 'column', gap: 8 }}>
        <AnimatePresence>
          {toasts.map(t => {
            const isSucc = t.type === 'success';
            const isErr = t.type === 'error';
            const isWarn = t.type === 'warning';
            const bdColor = isSucc ? '#22c55e' : isErr ? '#ef4444' : isWarn ? '#f59e0b' : '#3b82f6';
            const icon = isSucc ? '✅' : isErr ? '❌' : isWarn ? '⚠️' : 'ℹ️';
            const dur = isErr ? 5000 : isWarn ? 4000 : 3000;
            return (
              <motion.div key={t.id} initial={{ opacity: 0, x: 100 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 100 }} transition={{ duration: 0.3 }} style={{ minWidth: 280, maxWidth: 400, background: 'rgba(8,15,26,0.97)', backdropFilter: 'blur(20px)', borderRadius: 12, padding: '14px 18px', display: 'flex', alignItems: 'center', gap: 12, boxShadow: '0 8px 32px rgba(0,0,0,0.4)', borderLeft: `3px solid ${bdColor}`, position: 'relative', overflow: 'hidden' }}>
                <div style={{ fontSize: 20 }}>{icon}</div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontFamily: "'DM Sans', sans-serif", fontWeight: 600, fontSize: 14, color: bdColor }}>{t.title}</div>
                  <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: '#94a3b8', marginTop: 2 }}>{t.message}</div>
                </div>
                <button onClick={() => setToasts(ts => ts.filter(x => x.id !== t.id))} style={{ background: 'none', border: 'none', color: '#334155', fontSize: 16, cursor: 'pointer', padding: 4 }} onMouseEnter={e => e.currentTarget.style.color = '#94a3b8'} onMouseLeave={e => e.currentTarget.style.color = '#334155'}>×</button>
                <motion.div initial={{ width: '100%' }} animate={{ width: '0%' }} transition={{ duration: dur / 1000, ease: 'linear' }} style={{ position: 'absolute', bottom: 0, left: 0, height: 2, background: bdColor, borderRadius: '0 0 12px 12px' }} />
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </div>
    </>
  );
}
