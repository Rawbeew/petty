import { useEffect, useMemo, useRef, useState } from 'react';
import { Clapperboard, Upload, Download, Eraser, Circle, Square, Gavel } from 'lucide-react';
import { SectionHeader } from './Shared';
import { cx } from '../lib/ui';

type Preset = 'argument' | 'recall' | 'docket';
const PRESETS: Record<Preset, { accent: string; label: string; kicker: string }> = {
  argument: { accent: '#F2C14E', label: 'ORAL ARGUMENT', kicker: 'SCOTUS · CIRCUIT · STATE' },
  recall:   { accent: '#FF5A5A', label: 'RECALL ALERT',  kicker: 'CLASS I · GET IT OUT OF THE HOUSE' },
  docket:   { accent: '#3DDC97', label: 'DOCKET WATCH',  kicker: 'FILINGS THAT MOVE MARKETS' },
};

const W = 1080, H = 1920;
const FONT = 'Georgia, "Times New Roman", serif';
const MONO = 'ui-monospace, "SF Mono", Menlo, monospace';

const wrapLines = (ctx: CanvasRenderingContext2D, text: string, maxWidth: number) => {
  const lines: string[] = [];
  for (const raw of text.split('\n')) {
    const words = raw.trim().split(/\s+/).filter(Boolean);
    let line = '';
    for (const w of words) {
      const t = line ? line + ' ' + w : w;
      if (ctx.measureText(t).width > maxWidth && line) { lines.push(line); line = w; } else line = t;
    }
    lines.push(line);
  }
  return lines.filter(l => l.length);
};

export default function ClipStudio() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const mediaDestRef = useRef<MediaStreamAudioDestinationNode | null>(null);
  const rafRef = useRef(0);
  const chunksRef = useRef<Blob[]>([]);
  const lastDrawRef = useRef(0);

  const [fileName, setFileName] = useState<string | null>(null);
  const [fileUrl, setFileUrl] = useState<string | null>(null);
  const [isVideo, setIsVideo] = useState(false);
  const [duration, setDuration] = useState(0);
  const [caption, setCaption] = useState('The Court heard argument\non whether permitting\nthe recall live.');
  const [caseName, setCaseName] = useState('In re Meridian Recall MDL 3117');
  const [court, setCourt] = useState('5th Cir.');
  const [argued, setArgued] = useState('2026-11-21');
  const [sourceUrl, setSourceUrl] = useState('courtlistener.com/docket/3:19-md-03317');
  const [preset, setPreset] = useState<Preset>('argument');
  const [recording, setRecording] = useState(false);
  const [progress, setProgress] = useState(0);
  const [outputUrl, setOutputUrl] = useState<string | null>(null);
  const [outputName, setOutputName] = useState('petty-cut.webm');
  const [outputExt, setOutputExt] = useState('webm');
  const [error, setError] = useState<string | null>(null);

  const accent = PRESETS[preset].accent;
  const estSeconds = Math.min(duration || 45, 90);

  /* build audio graph once per loaded file */
  const ensureAudioGraph = () => {
    const video = videoRef.current;
    if (!video || audioCtxRef.current) return;
    interface OptionalAudioWindow extends Window { AudioContext?: typeof AudioContext; webkitAudioContext?: typeof AudioContext }
    const w: OptionalAudioWindow = window;
    const AC = w.AudioContext ?? w.webkitAudioContext;
    if (AC === undefined) return;
    const ctx = new AC();
    const src = ctx.createMediaElementSource(video);
    const analyser = ctx.createAnalyser();
    analyser.fftSize = 256; analyser.smoothingTimeConstant = 0.82;
    const dest = ctx.createMediaStreamDestination();
    const gain = ctx.createGain(); gain.gain.value = 0.9;
    src.connect(gain); gain.connect(ctx.destination);
    src.connect(analyser); analyser.connect(dest);
    audioCtxRef.current = ctx; analyserRef.current = analyser; mediaDestRef.current = dest;
  };

  const drawFrame = (t: number) => {
    const canvas = canvasRef.current; const ctx2d = canvas?.getContext('2d');
    if (!canvas || !ctx2d) return;
    const v = videoRef.current;
    const p = duration ? Math.min(1, (v?.currentTime ?? 0) / duration) : 0;
    if (Math.abs(p - lastDrawRef.current) > 0.008 || p === 0 || p >= 1) { setProgress(p); lastDrawRef.current = p; }

    /* background */
    const bg = ctx2d.createLinearGradient(0, 0, 0, H);
    bg.addColorStop(0, '#0d1017'); bg.addColorStop(0.55, '#090b12'); bg.addColorStop(1, '#05070c');
    ctx2d.fillStyle = bg; ctx2d.fillRect(0, 0, W, H);
    const glow = ctx2d.createRadialGradient(W / 2, 320, 40, W / 2, 320, 620);
    glow.addColorStop(0, 'rgba(242,193,78,0.10)'); glow.addColorStop(1, 'transparent');
    ctx2d.fillStyle = glow; ctx2d.fillRect(0, 0, W, H);

    /* rings + sweep */
    ctx2d.strokeStyle = 'rgba(242,193,78,0.16)'; ctx2d.lineWidth = 2;
    for (const r of [300, 210, 120]) { ctx2d.beginPath(); ctx2d.arc(W / 2, 330, r, 0, Math.PI * 2); ctx2d.stroke(); }
    const ang = (t * 0.9) % (Math.PI * 2) - Math.PI / 2;
    ctx2d.save(); ctx2d.beginPath(); ctx2d.moveTo(W / 2, 330); ctx2d.arc(W / 2, 330, 290, ang - 0.5, ang); ctx2d.closePath();
    const wedge = ctx2d.createRadialGradient(W / 2, 330, 20, W / 2, 330, 290);
    wedge.addColorStop(0, accent + 'cc'); wedge.addColorStop(1, accent + '00');
    ctx2d.fillStyle = wedge; ctx2d.fill(); ctx2d.restore();
    ctx2d.fillStyle = accent; ctx2d.beginPath(); ctx2d.arc(W / 2, 330, 14, 0, Math.PI * 2); ctx2d.fill();

    /* wordmark */
    ctx2d.textAlign = 'center';
    ctx2d.fillStyle = accent; ctx2d.font = `700 58px ${FONT}`;
    ctx2d.fillText('P E T T Y', W / 2, 150);
    ctx2d.fillStyle = '#8a8fa3'; ctx2d.font = `500 17px ${MONO}`;
    ctx2d.fillText('R A D A R   ·   H E R A L D   C U T', W / 2, 190);
    ctx2d.fillStyle = '#565d75'; ctx2d.font = `500 15px ${MONO}`;
    ctx2d.fillText(PRESETS[preset].kicker, W / 2, 218);

    /* video frame (if video file) — center-cropped 9:16 band */
    if (isVideo && v && v.readyState >= 2) {
      const vw = v.videoWidth, vh = v.videoHeight;
      const targetH = 520, targetW = (vw / vh) * targetH > 940 ? 940 : (vw / vh) * targetH;
      const sw = (vw / vh) * targetH > 940 ? (940 * vh) / targetH : vw;
      ctx2d.save();
      ctx2d.beginPath(); ctx2d.roundRect((W - targetW) / 2, 560, targetW, targetH, 26); ctx2d.clip();
      ctx2d.drawImage(v, 0, 0, sw, vh, (W - targetW) / 2, 560, targetW, targetH);
      ctx2d.restore();
      ctx2d.strokeStyle = 'rgba(242,193,78,0.35)'; ctx2d.lineWidth = 1.5;
      ctx2d.beginPath(); ctx2d.roundRect((W - targetW) / 2, 560, targetW, targetH, 26); ctx2d.stroke();
    }

    /* caption — deterministic character reveal over track progress */
    const captionTop = isVideo ? 1150 : 640;
    ctx2d.font = `700 ${isVideo ? 54 : 66}px ${FONT}`;
    const maxW = 920;
    const lines = wrapLines(ctx2d, caption, maxW).slice(0, isVideo ? 3 : 4);
    const total = lines.reduce((n, l) => n + l.length, 0);
    let budget = Math.floor(total * (duration ? progress : 1));
    ctx2d.textAlign = 'center';
    ctx2d.fillStyle = '#f5f2ea';
    lines.forEach((line, i) => {
      const take = budget > 0 ? line.slice(0, budget) : '';
      budget -= line.length;
      ctx2d.fillText(take, W / 2, captionTop + i * (isVideo ? 68 : 84));
    });
    /* accent underline */
    const underlineY = captionTop + lines.length * (isVideo ? 68 : 84) + 6;
    ctx2d.fillStyle = accent; ctx2d.fillRect(W / 2 - 110, underlineY, 220 * (0.15 + 0.85 * (duration ? progress : 1)), 4);

    /* waveform */
    const analyser = analyserRef.current;
    const bars = 56, bandTop = isVideo ? 1380 : 1240, bandH = 150;
    if (analyser) {
      const data = new Uint8Array(analyser.frequencyBinCount);
      analyser.getByteFrequencyData(data);
      for (let i = 0; i < bars; i++) {
        const bin = Math.floor(4 + (i / bars) * (analyser.frequencyBinCount * 0.62));
        const vAmp = (data[bin] ?? 0) / 255;
        const bh = 8 + vAmp * bandH;
        const x = (W - 940) / 2 + (i * 940) / bars + 3;
        ctx2d.globalAlpha = 0.35 + 0.65 * vAmp;
        ctx2d.fillStyle = accent;
        ctx2d.beginPath(); ctx2d.roundRect(x, bandTop + bandH / 2 - bh / 2, 940 / bars - 6, bh, 4); ctx2d.fill();
      }
      ctx2d.globalAlpha = 1;
    }

    /* lower third */
    ctx2d.strokeStyle = accent; ctx2d.lineWidth = 3;
    ctx2d.beginPath(); ctx2d.moveTo(80, 1615); ctx2d.lineTo(W - 80, 1615); ctx2d.stroke();
    ctx2d.textAlign = 'left';
    ctx2d.fillStyle = '#e8e6df'; ctx2d.font = `600 27px ${FONT}`;
    ctx2d.fillText(caseName.slice(0, 64) || 'Case name', 80, 1668);
    ctx2d.fillStyle = '#8a8fa3'; ctx2d.font = `500 18px ${MONO}`;
    ctx2d.fillText(`${court || 'Court'}${argued ? '  ·  argued ' + argued : ''}`, 80, 1704);
    ctx2d.fillStyle = '#59d5f0'; ctx2d.font = `400 16px ${MONO}`;
    ctx2d.fillText(sourceUrl.slice(0, 78), 80, 1736);

    /* footer */
    ctx2d.fillStyle = '#3a4258'; ctx2d.fillRect(80, 1800, W - 160, 1.5);
    ctx2d.fillStyle = '#565d75'; ctx2d.font = `400 15px ${MONO}`; ctx2d.textAlign = 'left';
    ctx2d.fillText('FAIR-USE EXCERPT · NOT LEGAL ADVICE', 80, 1832);
    ctx2d.fillStyle = accent; ctx2d.font = `700 23px ${FONT}`; ctx2d.textAlign = 'center';
    ctx2d.fillText('petty.io', W / 2, 1834);
    ctx2d.fillStyle = '#565d75'; ctx2d.font = `400 15px ${MONO}`; ctx2d.textAlign = 'right';
    ctx2d.fillText('ATTRIBUTION REQUIRED', W - 80, 1832);
  };

  const loop = (t: number) => { drawFrame(t / 1000); rafRef.current = requestAnimationFrame(loop); };

  const onFile = (f: File | undefined) => {
    if (!f) return;
    setError(null); setOutputUrl(null);
    const url = URL.createObjectURL(f);
    setFileUrl(url); setFileName(f.name); setIsVideo(f.type.startsWith('video')); setProgress(0); setDuration(0);
  };

  const onLoadedMetadata = () => {
    ensureAudioGraph();
    const d = videoRef.current?.duration ?? 0;
    setDuration(Number.isFinite(d) ? d : 0);
    drawFrame(lastDrawRef.current);
  };

  useEffect(() => () => { cancelAnimationFrame(rafRef.current); }, []);
  useEffect(() => { rafRef.current = requestAnimationFrame(loop); return () => { cancelAnimationFrame(rafRef.current); }; });

  const pickMime = () => ['video/webm;codecs=vp9,opus', 'video/webm;codecs=vp9', 'video/webm', 'video/mp4']
    .find(m => MediaRecorder.isTypeSupported(m)) ?? 'video/webm';

  const record = async () => {
    const canvas = canvasRef.current; const v = videoRef.current; const dest = mediaDestRef.current;
    if (!canvas || !v || !dest || !fileUrl) { setError('Load an audio or video file first.'); return; }
    setError(null); setOutputUrl(null);
    await audioCtxRef.current?.resume();
    drawFrame(0);
    const canvasStream = canvas.captureStream(30);
    const combined = new MediaStream([...canvasStream.getVideoTracks(), ...dest.stream.getAudioTracks()]);
    const mime = pickMime();
    const rec = new MediaRecorder(combined, { mimeType: mime, videoBitsPerSecond: 4_000_000 });
    chunksRef.current = [];
    rec.ondataavailable = e => { if (e.data.size) chunksRef.current.push(e.data); };
    rec.onstop = () => {
      const ext = mime.includes('mp4') ? 'mp4' : 'webm';
      setOutputExt(ext);
      setOutputName(`petty-cut-${Date.now()}.${ext}`);
      setOutputUrl(URL.createObjectURL(new Blob(chunksRef.current, { type: mime })));
      setRecording(false);
    };
    v.currentTime = 0;
    rec.start(250);
    setRecording(true);
    const stop = () => { try { if (rec.state !== 'inactive') rec.stop(); } catch { /* already stopped */ } };
    v.onended = stop;
    const hardCap = setTimeout(stop, Math.min(duration * 1000 + 500, 90_000));
    v.play().catch((e: unknown) => { setError(String(e)); });
    // clear hardCap when playback ends naturally
    const clear = setInterval(() => { if (v.paused || v.ended) { clearTimeout(hardCap); clearInterval(clear); } }, 500);
  };

  const stopRecording = () => { const v = videoRef.current; if (v) { v.pause(); v.dispatchEvent(new Event('ended')); } };

  const reset = () => {
    setFileName(null); setFileUrl(null); setDuration(0); setProgress(0); setOutputUrl(null); setError(null);
    void audioCtxRef.current?.close(); audioCtxRef.current = null; analyserRef.current = null; mediaDestRef.current = null;
  };

  const fileNote = useMemo(() => isVideo ? 'Video file — center-cropped into 9:16 with live captions burned in.' : 'Audio file — rendered as an animated waveform sermon.', [isVideo]);

  return (
    <div className="grid xl:grid-cols-[1fr_420px] gap-4 items-start">
      {/* control deck */}
      <section className="panel p-5 space-y-4">
        <SectionHeader icon={Clapperboard} kicker="Herald cuts" title="Court argument → 9:16 in one take." right={<span className="chip chip-gold"><Gavel size={10} />{PRESETS[preset].label}</span>} />
        <p className="text-[12px] text-[var(--dim)] leading-relaxed -mt-2">Drop a public-record <strong>argument audio/video</strong> (CourtListener / Oyez, downloaded free by you) — Petty burns in captions, live waveform, attribution and the case line, then hands back a vertical cut for TikTok / Reels / Shorts. <strong>Nothing is uploaded</strong>; rendering is 100% on-device.</p>

        {/* presets */}
        <div className="flex flex-wrap gap-1.5">
          {Object.keys(PRESETS).filter((k): k is Preset => k in PRESETS).map(k => (
            <button key={k} onClick={() => { setPreset(k); }} className={cx('chip transition-all', preset === k && 'chip-gold')} style={preset === k ? { borderColor: PRESETS[k].accent, color: PRESETS[k].accent } : undefined}>{PRESETS[k].label}</button>
          ))}
        </div>

        {/* file drop */}
        <label className="block rounded-2xl border border-dashed border-[var(--line2)] hover:border-[var(--gold)] transition-colors p-6 text-center cursor-pointer">
          <Upload size={26} className="mx-auto text-[var(--dim)]" />
          <span className="block mono text-[10px] tracking-[0.2em] text-[var(--ink)] mt-2">{fileName ? fileName.toUpperCase() : 'DROP MP3 · MP4 · M4A · WAV — OR CLICK TO CHOOSE'}</span>
          <span className="block mono text-[8px] text-[var(--dim)] mt-1">{fileName ? fileNote : 'MAX 90S CAPTURE · STAYS ON THIS DEVICE'}</span>
          <input type="file" accept="audio/*,video/*" className="hidden" onChange={e => { onFile(e.target.files?.[0]); }} />
        </label>

        {/* hidden media element */}
        {fileUrl && <video ref={videoRef} src={fileUrl} crossOrigin="anonymous" playsInline preload="auto" className="hidden" onLoadedMetadata={onLoadedMetadata} />}

        {/* caption + case fields */}
        <div>
          <label className="lbl" htmlFor="cap">Burn-in caption (line breaks kept)</label>
          <textarea id="cap" rows={3} className="field mono !text-[12px]" value={caption} onChange={e => { setCaption(e.target.value.slice(0, 140)); }} />
        </div>
        <div className="grid grid-cols-2 gap-2.5">
          <div className="col-span-2"><label className="lbl" htmlFor="cn">Case</label><input id="cn" className="field" value={caseName} onChange={e => { setCaseName(e.target.value); }} /></div>
          <div><label className="lbl" htmlFor="ct">Court</label><input id="ct" className="field" value={court} onChange={e => { setCourt(e.target.value); }} /></div>
          <div><label className="lbl" htmlFor="da">Argued</label><input id="da" className="field" type="date" value={argued} onChange={e => { setArgued(e.target.value); }} /></div>
          <div className="col-span-2"><label className="lbl" htmlFor="su">Source (attribution, required by licence)</label><input id="su" className="field mono !text-[11px]" value={sourceUrl} onChange={e => { setSourceUrl(e.target.value); }} /></div>
        </div>

        {/* transport */}
        <div className="flex flex-wrap items-center gap-2">
          {!recording
            ? <button onClick={() => { void record(); }} className="flex items-center gap-2 rounded-xl bg-[var(--gold)] text-black font-bold px-5 py-3 mono text-[11px] tracking-[0.2em] uppercase hover:bg-[var(--gold2)]"><Circle size={13} fill="currentColor" />Record cut</button>
            : <button onClick={stopRecording} className="flex items-center gap-2 rounded-xl bg-[var(--red)] text-black font-bold px-5 py-3 mono text-[11px] tracking-[0.2em] uppercase"><Square size={13} fill="currentColor" />Stop</button>}
          <button onClick={reset} className="p-3 rounded-xl border border-[var(--line2)] text-[var(--dim)] hover:text-[var(--ink)]" aria-label="Clear studio"><Eraser size={15} /></button>
          <div className="flex-1 min-w-[140px] h-2 rounded-full bg-[#131a2b] overflow-hidden"><div className="h-full transition-[width] duration-150" style={{ width: `${progress * 100}%`, background: accent }} /></div>
          <span className="mono text-[10px] text-[var(--dim)]">{estSeconds.toFixed(0)}s</span>
        </div>
        {error && <p className="mono text-[10px] text-[var(--red)] border border-[rgba(255,90,90,0.35)] rounded-xl px-3 py-2">{error}</p>}
        {outputUrl && (
          <div className="rounded-xl border border-[rgba(61,220,151,0.35)] bg-[rgba(61,220,151,0.06)] p-4 flex flex-wrap items-center gap-3">
            <video src={outputUrl} controls className="h-40 rounded-lg border border-[var(--line2)]" />
            <div className="flex-1 min-w-[160px]">
              <p className="mono text-[9px] tracking-[0.25em] text-[var(--green)]">CUT READY — {outputExt.toUpperCase()}</p>
              <p className="mono text-[8px] text-[var(--dim)] mt-1">If your TikTok flow needs .mp4 and the browser produced .webm, transcode locally: <span className="text-[var(--cyan)]">ffmpeg -i cut.webm -c:v libx264 -crf 20 cut.mp4</span></p>
              <a href={outputUrl} download={outputName} className="mt-2 inline-flex items-center gap-2 rounded-xl bg-[var(--green)] text-black font-bold px-4 py-2.5 mono text-[10px] tracking-[0.2em] uppercase"><Download size={13} />Download cut</a>
            </div>
          </div>
        )}
        <p className="mono text-[8px] text-[var(--dim)] leading-relaxed">Public-record audio courtesy of the uploader’s own download (CourtListener/Oyez). Keep excerpts short, keep attribution visible, never imply endorsement. Petty is not affiliated with any court. Information, not advice.</p>
      </section>

      {/* live preview canvas */}
      <section className="panel p-4 flex flex-col items-center gap-3">
        <div className="mono text-[9px] tracking-[0.3em] text-[var(--dim)] self-start">9:16 PREVIEW — 1080×1920</div>
        <canvas ref={canvasRef} width={W} height={H} className="w-full max-w-[300px] rounded-2xl border border-[var(--line2)] shadow-2xl shadow-black/60" aria-label="Vertical clip preview" />
        <div className="mono text-[8px] text-[var(--dim)] text-center">Captions reveal with playback progress · waveform is the real signal · sweep honors the preset accent</div>
      </section>
    </div>
  );
}
