"use client";

import { useEffect, useRef, useState } from "react";
import { Mic, Square, Loader2, Package } from "lucide-react";

export default function Home() {
  const [isListening, setIsListening] = useState(false);
  const [status, setStatus] = useState("แตะเพื่อเริ่มพูด");
  const [result, setResult] = useState<any>({});
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) return;
    const rec = new SpeechRecognition();
    rec.lang = "th-TH";
    rec.onstart = () => { setIsListening(true); setStatus("กำลังฟังเสียง..."); setResult({}); };
    rec.onend = () => setIsListening(false);
    rec.onresult = async (event: any) => {
      const transcript = event.results?.[0]?.[0]?.transcript || "";
      setResult({ transcript });
      setStatus("กำลังวิเคราะห์...");
      try {
        const resp = await fetch("/api/voice", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ text: transcript }),
        });
        const data = await resp.json();
        setResult(data);
        setStatus("พร้อมรับคำสั่งใหม่");
      } catch (e) { setStatus("เกิดข้อผิดพลาด"); }
    };
    recognitionRef.current = rec;
  }, []);

  const toggleListen = () => isListening ? recognitionRef.current?.stop() : recognitionRef.current?.start();

  return (
    <main className="relative h-[100dvh] w-full flex flex-col items-center bg-[#f8faff] text-slate-900 overflow-hidden font-sans">

      {/* Background Mesh Decor (คงเดิม) */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden z-0 opacity-60">
        <div className="absolute top-[-10%] left-[-10%] w-[60%] h-[60%] bg-purple-200/40 blur-[100px] rounded-full animate-pulse" />
        <div className="absolute bottom-[10%] right-[-10%] w-[60%] h-[60%] bg-blue-200/30 blur-[100px] rounded-full animate-pulse [animation-delay:2s]" />
      </div>

      {/* 1. คลื่น Sphere กลางจอ (อัปเกรดให้พรีเมียมและอลังการขึ้น) */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-0">
        {isListening ? (
          <div className="relative flex items-center justify-center">
            {/* คลื่นพลังงานกระจายตัว 3 ชั้น */}
            <div className="absolute w-56 h-56 bg-gradient-to-r from-purple-400/40 via-blue-400/40 to-pink-400/40 rounded-full animate-ai-glow" />
            <div className="absolute w-56 h-56 bg-gradient-to-r from-cyan-400/30 via-purple-400/30 to-blue-400/30 rounded-full animate-ai-glow [animation-delay:0.8s]" />
            <div className="absolute w-56 h-56 bg-gradient-to-r from-indigo-400/20 via-blue-400/20 to-cyan-400/20 rounded-full animate-ai-glow [animation-delay:1.6s]" />

            {/* วงแหวนออร่าหมุนรอบ */}
            <div className="absolute w-44 h-44 border border-white/20 rounded-full animate-aura" />

            {/* แกนกลาง Sphere แบบพรีเมียม Glassmorphism */}
            <div className="relative w-32 h-32 bg-white/60 backdrop-blur-3xl rounded-full shadow-[0_0_50px_rgba(255,255,255,0.6)] flex items-center justify-center border border-white/80 overflow-hidden">
              {/* เอฟเฟกต์เลนส์ใน Sphere */}
              <div className="absolute inset-0 bg-gradient-to-br from-white/40 to-transparent" />

              {/* กราฟเสียง 5 แท่งแบบพริ้วไหว */}
              <div className="relative flex items-end gap-1.5 h-10">
                <div className="w-1.5 bg-purple-500 rounded-full animate-voice-bar [animation-delay:0.1s]" />
                <div className="w-1.5 bg-blue-500 rounded-full animate-voice-bar [animation-delay:0.3s]" />
                <div className="w-1.5 bg-indigo-600 rounded-full animate-voice-bar [animation-delay:0.5s]" />
                <div className="w-1.5 bg-blue-400 rounded-full animate-voice-bar [animation-delay:0.2s]" />
                <div className="w-1.5 bg-pink-500 rounded-full animate-voice-bar [animation-delay:0.4s]" />
              </div>
            </div>
          </div>
        ) : (
          <div className="w-32 h-32 bg-white/40 backdrop-blur-md rounded-full border border-white/60 shadow-inner" />
        )}
      </div>

      {/* 2. Top Section (คงเดิม) */}
      <div className="relative z-10 w-full max-w-xl px-6 pt-20 pb-10 flex flex-col items-center h-[280px] shrink-0">
        <div className="text-center space-y-4 w-full">
          {result.transcript && <p className="text-sm font-medium text-slate-400 italic">"{result.transcript}"</p>}
          {result.answer && <h2 className={`text-xl font-light leading-relaxed ${result.notFound ? 'text-slate-400' : 'text-slate-800'}`}>{result.answer}</h2>}
        </div>
      </div>

      {/* 3. Middle Section (คงเดิม) */}
      <div className="relative z-10 flex-1 w-full max-w-md px-4 overflow-y-auto">
        <div className="space-y-4 pb-32">
          {result.items?.map((item: any, idx: number) => (
            <div key={idx} className="bg-white/70 backdrop-blur-xl border border-white/60 rounded-[2.5rem] p-6 shadow-sm animate-in slide-in-from-bottom-5" style={{ animationDelay: `${idx * 150}ms` }}>
              <div className="flex justify-between items-start mb-4">
                <span className="text-[9px] font-bold text-purple-600 uppercase tracking-widest bg-purple-50 px-2.5 py-1 rounded-full">{item.category}</span>
                <span className="text-xl font-bold text-slate-900">฿{item.price.toLocaleString()}</span>
              </div>
              <h3 className="text-base font-semibold text-slate-800 mb-4">{item.name}</h3>
              <div className="flex justify-between items-center pt-4 border-t border-slate-50 text-[10px] text-slate-400">
                <div className="flex items-center gap-1"><Package className="w-3 h-3" /><span>คลัง: {item.stock}</span></div>
                <span>ประกัน {item.warranty_months} ด.</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 4. Footer (คงเดิม) */}
      <footer className="absolute bottom-0 left-0 w-full py-10 flex flex-col items-center gap-6 bg-gradient-to-t from-white via-white to-transparent z-20">
        <span className="text-[9px] font-bold uppercase tracking-[0.4em] text-slate-300">{status}</span>
        <button onClick={toggleListen} className={`relative w-20 h-20 flex items-center justify-center rounded-full transition-all duration-500 shadow-xl border-4 border-white ${isListening ? 'bg-gradient-to-tr from-pink-500 to-purple-600 scale-110' : 'bg-gradient-to-tr from-blue-500 to-purple-500'}`}>
          {isListening ? <Square className="w-6 h-6 text-white fill-white" /> : <Mic className="w-6 h-6 text-white" />}
        </button>
      </footer>
    </main>
  );
}
