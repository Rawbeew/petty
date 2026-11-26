import { useCallback } from 'react';
import type { SafetySignal, Pillar } from '../data/signals';
import { PILLARS } from '../data/packs';
import { CONFIDENCE_META } from '../lib/ui';

const PILLAR_COLOR: Record<Pillar, string> = {
  health: '#ff5a5a', weather: '#59d5f0', dispatch: '#a78bfa', stops: '#f2c14e',
  courts: '#3ddc97', money: '#f2c14e', luggage: '#f472b6',
};

function wrapText(ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string[] {
  const words = text.split(' ');
  const lines: string[] = [];
  let line = '';
  for (const w of words) {
    const test = line ? line + ' ' + w : w;
    if (ctx.measureText(test).width > maxWidth && line) { lines.push(line); line = w; } else line = test;
  }
  if (line) lines.push(line);
  return lines;
}

export default function useSafetyCard() {
  return useCallback((s: SafetySignal) => {
    const W = 1080, H = 1920;
    const canvas = document.createElement('canvas');
    canvas.width = W; canvas.height = H;
    const ctx = canvas.getContext('2d');
    if (ctx === null) return; // canvas 2d unavailable — render nothing rather than improvise

    // background
    const bg = ctx.createLinearGradient(0, 0, 0, H);
    bg.addColorStop(0, '#0d1017'); bg.addColorStop(1, '#06080d');
    ctx.fillStyle = bg; ctx.fillRect(0, 0, W, H);

    // radar rings (top emblem)
    const cx = W / 2, cy = 330;
    ctx.strokeStyle = 'rgba(242,193,78,0.28)';
    for (const r of [190, 140, 90]) { ctx.lineWidth = 2.5; ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2); ctx.stroke(); }
    ctx.lineWidth = 1.5; ctx.strokeStyle = 'rgba(242,193,78,0.14)';
    ctx.beginPath(); ctx.moveTo(cx - 210, cy); ctx.lineTo(cx + 210, cy); ctx.moveTo(cx, cy - 210); ctx.lineTo(cx, cy + 210); ctx.stroke();
    ctx.fillStyle = '#F2C14E';
    ctx.save();
    ctx.beginPath(); ctx.moveTo(cx, cy); ctx.arc(cx, cy, 165, -Math.PI / 2 - 0.5, -Math.PI / 2); ctx.closePath();
    const wedge = ctx.createRadialGradient(cx, cy, 10, cx, cy, 165);
    wedge.addColorStop(0, 'rgba(242,193,78,0.9)'); wedge.addColorStop(1, 'rgba(242,193,78,0)');
    ctx.fillStyle = wedge; ctx.fill(); ctx.restore();
    ctx.fillStyle = '#F2C14E'; ctx.beginPath(); ctx.arc(cx, cy, 16, 0, Math.PI * 2); ctx.fill();
    // blip
    ctx.fillStyle = PILLAR_COLOR[s.pillar];
    ctx.beginPath(); ctx.arc(cx + 95, cy - 80, 22, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#06080d'; ctx.beginPath(); ctx.arc(cx + 95, cy - 80, 9, 0, Math.PI * 2); ctx.fill();

    // wordmark
    ctx.fillStyle = '#F2C14E';
    ctx.font = '700 64px Georgia, serif'; ctx.textAlign = 'center';
    ctx.fillText('P E T T Y', W / 2, 620);
    ctx.font = '500 21px ui-monospace, monospace'; ctx.fillStyle = '#8a8fa3';
    ctx.fillText(`PETTY RADAR · ${PILLARS.find(p => p.id === s.pillar)?.label.toUpperCase()}`, W / 2, 668);

    // headline
    ctx.fillStyle = '#e8e6df'; ctx.font = '700 52px Georgia, serif'; ctx.textAlign = 'left';
    const lines = wrapText(ctx, s.title, 880).slice(0, 4);
    lines.forEach((ln, i) => { ctx.fillText(ln, 100, 800 + i * 66); });
    let y = 800 + lines.length * 66 + 28;

    // agency + date + country chip
    ctx.font = '500 26px ui-monospace, monospace'; ctx.fillStyle = '#b9bed2';
    ctx.fillText(`${s.agency} · ${s.country} · ${new Date(s.publishedAt).toUTCString().slice(5, 16)}`, 100, y);
    y += 54;

    // verbatim box
    ctx.fillStyle = '#10141d'; ctx.strokeStyle = '#242c3f'; ctx.lineWidth = 2;
    const boxH = 300;
    ctx.beginPath(); ctx.roundRect(100, y, 880, boxH, 24); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#59d5f0'; ctx.font = '600 18px ui-monospace, monospace';
    ctx.fillText('◆ SOURCE — VERBATIM · LIVE (OPEN-GOVT API)', 130, y + 46);
    ctx.fillStyle = '#cdd2e4'; ctx.font = '400 23px Georgia, serif';
    const q = wrapText(ctx, `“${s.rawOfficialText}”`, 812).slice(0, 6);
    q.forEach((ln, i) => { ctx.fillText(ln, 130, y + 96 + i * 34); });
    y += boxH + 44;

    // confidence chip
    const conf = CONFIDENCE_META[s.confidence];
    ctx.fillStyle = s.confidence === 'verified_agency' ? 'rgba(61,220,151,0.15)' : s.confidence === 'anonymized_approx' ? 'rgba(89,213,240,0.15)' : 'rgba(255,90,90,0.15)';
    ctx.strokeStyle = s.confidence === 'verified_agency' ? '#3ddc97' : s.confidence === 'anonymized_approx' ? '#59d5f0' : '#ff5a5a';
    ctx.lineWidth = 2;
    const chipW = ctx.measureText(conf.label).width + 56;
    ctx.beginPath(); ctx.roundRect(100, y, chipW + 40, 46, 23); ctx.fill(); ctx.stroke();
    ctx.fillStyle = ctx.strokeStyle; ctx.font = '600 17px ui-monospace, monospace';
    ctx.fillText(conf.label.toUpperCase(), 124, y + 30);
    y += 96;

    // footer
    ctx.fillStyle = '#3a4258'; ctx.fillRect(100, H - 300, 880, 2);
    ctx.fillStyle = '#8a8fa3'; ctx.font = '400 21px Georgia, serif';
    ctx.fillText('Petty Radar aggregates open government data. Not affiliated with any agency.', 100, H - 236);
    ctx.fillText('Information, not advice. Verify at the linked source before acting.', 100, H - 200);
    ctx.fillStyle = '#F2C14E'; ctx.font = '700 34px Georgia, serif';
    ctx.fillText('petty.io', 100, H - 118);
    ctx.fillStyle = '#59d5f0'; ctx.font = '400 20px ui-monospace, monospace';
    ctx.textAlign = 'right'; ctx.fillText(s.sourceUrl.replace(/^https?:\/\//, '').slice(0, 46), W - 100, H - 122);

    const a = document.createElement('a');
    a.download = `petty-safety-card-${s.id}.png`;
    a.href = canvas.toDataURL('image/png');
    a.click();
  }, []);
}
