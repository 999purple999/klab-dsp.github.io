// ─── BiomeRenderer ────────────────────────────────────────────────────────────
// Per-biome background extras rendered each frame before obstacles.
// Indices match MAPS array in MapData.js (0-14).

export function renderBiomeExtras(ctx, idx, t, wx, wy, onScreen, W, H, DPR, camX, camY, STARS, BLDGS, WEB_LINES) {
  ctx.save();
  switch (idx) {

    case 0: { // CYBER GRID — neon purple scanline + bracket markers
      // Scrolling scanline
      const scanY = ((t * 55 * DPR) % H + H) % H;
      const sg = ctx.createLinearGradient(0, scanY - 28 * DPR, 0, scanY + 28 * DPR);
      sg.addColorStop(0, 'rgba(191,0,255,0)');
      sg.addColorStop(0.5, 'rgba(191,0,255,0.07)');
      sg.addColorStop(1, 'rgba(191,0,255,0)');
      ctx.fillStyle = sg; ctx.fillRect(0, scanY - 28 * DPR, W, 56 * DPR);
      // Corner bracket markers at STAR positions
      STARS.slice(0, 50).forEach(s => {
        if (!onScreen(s.x, s.y, 20)) return;
        const sx2 = wx(s.x), sy2 = wy(s.y);
        const bz = 7 * DPR;
        const a = s.a * (0.35 + 0.55 * Math.sin(t * 2.2 + s.phase));
        ctx.globalAlpha = a;
        ctx.strokeStyle = '#BF00FF'; ctx.lineWidth = 1;
        ctx.beginPath(); ctx.moveTo(sx2 - bz, sy2 - bz); ctx.lineTo(sx2 - bz * 0.4, sy2 - bz); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(sx2 - bz, sy2 - bz); ctx.lineTo(sx2 - bz, sy2 - bz * 0.4); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(sx2 + bz, sy2 + bz); ctx.lineTo(sx2 + bz * 0.4, sy2 + bz); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(sx2 + bz, sy2 + bz); ctx.lineTo(sx2 + bz, sy2 + bz * 0.4); ctx.stroke();
        ctx.globalAlpha = 1;
      });
      break;
    }

    case 1: { // DEEP SPACE — star field + blue nebula clouds
      // Nebula clouds from BLDGS positions
      BLDGS.slice(0, 10).forEach((b, i) => {
        const nx = wx(b.x), ny = wy(b.h * 3);
        if (!onScreen(b.x, b.h * 3, b.w)) return;
        const nr = (40 + b.w * 0.4) * DPR;
        const g = ctx.createRadialGradient(nx, ny, 0, nx, ny, nr);
        g.addColorStop(0, 'rgba(0,80,200,0.06)');
        g.addColorStop(1, 'rgba(0,80,200,0)');
        ctx.fillStyle = g; ctx.beginPath(); ctx.arc(nx, ny, nr, 0, Math.PI * 2); ctx.fill();
      });
      // Stars
      STARS.forEach(s => {
        if (!onScreen(s.x, s.y, 6)) return;
        const a = s.a * (0.5 + 0.5 * Math.sin(t * s.tw + s.phase));
        ctx.globalAlpha = a;
        ctx.fillStyle = s.r > 1.4 ? '#88CCFF' : '#FFFFFF';
        ctx.beginPath(); ctx.arc(wx(s.x), wy(s.y), s.r * DPR, 0, Math.PI * 2); ctx.fill();
        ctx.globalAlpha = 1;
      });
      // Occasional shooting star
      if (Math.sin(t * 0.7) > 0.88) {
        const slp = (t * 0.7 % 1);
        const ssx = W * (0.1 + slp * 0.6), ssy = H * 0.05;
        ctx.strokeStyle = 'rgba(180,220,255,0.7)'; ctx.lineWidth = 1.5 * DPR;
        ctx.beginPath(); ctx.moveTo(ssx, ssy); ctx.lineTo(ssx + 50 * DPR, ssy + 25 * DPR); ctx.stroke();
      }
      break;
    }

    case 2: { // NEON CITY — building silhouettes + vertical neon rain
      // Falling neon rain
      STARS.forEach(s => {
        if (!onScreen(s.x, s.y, 24)) return;
        const ry = ((wy(s.y) + t * 160 * DPR * s.tw) % H + H) % H;
        ctx.strokeStyle = 'rgba(255,0,80,0.2)'; ctx.lineWidth = DPR;
        ctx.beginPath(); ctx.moveTo(wx(s.x), ry); ctx.lineTo(wx(s.x) - 1.5 * DPR, ry + 14 * DPR); ctx.stroke();
      });
      // Building silhouettes at bottom
      BLDGS.forEach(b => {
        if (!onScreen(b.x, b.h * 0.5, b.w + 20)) return;
        const bx = wx(b.x), bh = b.h * DPR * 0.55, bw = b.w * DPR;
        const by = H - bh;
        ctx.fillStyle = 'rgba(15,0,5,0.75)'; ctx.fillRect(bx, by, bw, bh);
        ctx.strokeStyle = 'rgba(255,0,80,0.22)'; ctx.lineWidth = DPR; ctx.strokeRect(bx, by, bw, bh);
        // Lit windows
        for (let wr = 0; wr < 4; wr++) for (let wc = 0; wc < 3; wc++) {
          if (Math.sin(t * 0.4 + b.x * 0.01 + wr * 3.7 + wc) < 0.1) continue;
          ctx.fillStyle = 'rgba(255,60,140,0.35)';
          ctx.fillRect(bx + (wc * bw / 3 + 3 * DPR), by + (wr * bh / 4 + 4 * DPR), (bw / 3 - 6 * DPR), (bh / 4 - 8 * DPR));
        }
      });
      break;
    }

    case 3: { // DATA STORM — matrix-style falling data glyphs
      ctx.font = `${7 * DPR}px monospace`;
      STARS.forEach(s => {
        if (!onScreen(s.x, s.y, 16)) return;
        const col = ((wy(s.y) + t * (70 + s.tw * 50) * DPR) % H + H) % H;
        ctx.fillStyle = 'rgba(0,255,64,0.45)';
        ctx.fillText(String.fromCharCode(33 + ((Math.floor(t * 8 + s.phase * 10)) % 94)), wx(s.x), col);
        // Bright leader
        ctx.fillStyle = 'rgba(180,255,180,0.85)';
        ctx.fillText(String.fromCharCode(33 + ((Math.floor(t * 13 + s.phase * 15)) % 94)), wx(s.x), col - 8 * DPR);
      });
      break;
    }

    case 4: { // QUANTUM REALM — rotating concentric rings + shimmer particles
      // Rings from arena center
      for (let ri = 1; ri <= 7; ri++) {
        const rr = ri * Math.min(W, H) * 0.11;
        const ra = 0.04 + 0.025 * Math.abs(Math.sin(t * 0.4 + ri * 0.7));
        const arcStart = t * (ri % 2 === 0 ? 0.18 : -0.12);
        ctx.strokeStyle = `rgba(160,80,255,${ra})`; ctx.lineWidth = DPR;
        ctx.beginPath(); ctx.arc(W / 2, H / 2, rr, arcStart, arcStart + Math.PI * 1.75); ctx.stroke();
      }
      // Shimmer particles
      STARS.slice(0, 70).forEach(s => {
        if (!onScreen(s.x, s.y, 8)) return;
        const pa = s.a * (0.3 + 0.6 * Math.abs(Math.sin(t * 1.3 + s.phase)));
        ctx.globalAlpha = pa; ctx.fillStyle = '#CC88FF';
        ctx.beginPath(); ctx.arc(wx(s.x), wy(s.y), s.r * DPR * 0.85, 0, Math.PI * 2); ctx.fill();
        ctx.globalAlpha = 1;
      });
      break;
    }

    case 5: { // DARK WEB — spider web strands + glowing red nodes
      ctx.strokeStyle = 'rgba(255,30,0,0.1)'; ctx.lineWidth = 0.7;
      WEB_LINES.forEach(l => {
        if (!onScreen((l.x1 + l.x2) / 2, (l.y1 + l.y2) / 2, 300)) return;
        ctx.beginPath(); ctx.moveTo(wx(l.x1), wy(l.y1)); ctx.lineTo(wx(l.x2), wy(l.y2)); ctx.stroke();
      });
      STARS.slice(0, 28).forEach(s => {
        if (!onScreen(s.x, s.y, 8)) return;
        const a = 0.25 + 0.45 * Math.abs(Math.sin(t * 1.6 + s.phase));
        ctx.globalAlpha = a;
        ctx.fillStyle = '#FF3300'; ctx.shadowBlur = 8 * DPR; ctx.shadowColor = '#FF2200';
        ctx.beginPath(); ctx.arc(wx(s.x), wy(s.y), 2.5 * DPR, 0, Math.PI * 2); ctx.fill();
        ctx.shadowBlur = 0; ctx.globalAlpha = 1;
      });
      break;
    }

    case 6: { // AI NEXUS — circuit board traces with data pulses
      ctx.lineWidth = DPR;
      WEB_LINES.forEach((l, i) => {
        if (!onScreen((l.x1 + l.x2) / 2, (l.y1 + l.y2) / 2, 300)) return;
        // Manhattan routing
        ctx.strokeStyle = 'rgba(0,200,255,0.13)';
        ctx.beginPath(); ctx.moveTo(wx(l.x1), wy(l.y1)); ctx.lineTo(wx(l.x2), wy(l.y1)); ctx.lineTo(wx(l.x2), wy(l.y2)); ctx.stroke();
        // Animated data pulse
        const tp = ((t * 0.55 + i * 0.38) % 1);
        const ppx = wx(l.x1) + (wx(l.x2) - wx(l.x1)) * tp;
        ctx.fillStyle = 'rgba(0,255,255,0.5)'; ctx.shadowBlur = 6 * DPR; ctx.shadowColor = '#00FFFF';
        ctx.beginPath(); ctx.arc(ppx, wy(l.y1), 2.5 * DPR, 0, Math.PI * 2); ctx.fill();
        ctx.shadowBlur = 0;
      });
      // Blinking nodes
      STARS.slice(0, 35).forEach(s => {
        if (!onScreen(s.x, s.y, 8)) return;
        const blink = Math.sin(t * 3.2 + s.phase) > 0.35;
        ctx.globalAlpha = blink ? 0.55 : 0.12; ctx.fillStyle = '#00FFFF';
        ctx.beginPath(); ctx.arc(wx(s.x), wy(s.y), 3 * DPR, 0, Math.PI * 2); ctx.fill();
        ctx.globalAlpha = 1;
      });
      break;
    }

    case 7: { // CRYO VAULT — ice hexagons + frost particles rising
      // Hexagonal ice crystals at BLDGS positions
      BLDGS.slice(0, 18).forEach((b, i) => {
        const hx = wx(b.x), hy = wy((b.h * 2) % 1200);
        if (hx < -100 * DPR || hx > W + 100 * DPR || hy < -100 * DPR || hy > H + 100 * DPR) return;
        const hr = (9 + b.w * 0.09) * DPR;
        ctx.strokeStyle = `rgba(0,210,230,${0.07 + 0.05 * Math.sin(t + i)})`; ctx.lineWidth = DPR;
        ctx.beginPath();
        for (let p = 0; p < 6; p++) {
          const a = (p / 6) * Math.PI * 2 + Math.PI / 6;
          ctx[p === 0 ? 'moveTo' : 'lineTo'](hx + Math.cos(a) * hr, hy + Math.sin(a) * hr);
        }
        ctx.closePath(); ctx.stroke();
        // Inner facet
        ctx.strokeStyle = `rgba(180,255,255,${0.04 + 0.03 * Math.sin(t * 1.5 + i)})`;
        ctx.beginPath(); ctx.arc(hx, hy, hr * 0.4, 0, Math.PI * 2); ctx.stroke();
      });
      // Frost particles rising
      STARS.forEach(s => {
        if (!onScreen(s.x, s.y, 8)) return;
        const fy = ((wy(s.y) - t * 22 * DPR * s.tw) % H + H) % H;
        ctx.globalAlpha = s.a * 0.35; ctx.fillStyle = '#88EEFF';
        ctx.beginPath(); ctx.arc(wx(s.x) + Math.sin(t + s.phase) * 4 * DPR, fy, s.r * DPR * 0.7, 0, Math.PI * 2); ctx.fill();
        ctx.globalAlpha = 1;
      });
      break;
    }

    case 8: { // INDUSTRIAL WASTE — pipes + rising steam clouds
      // Pipe structures
      ctx.lineCap = 'round';
      WEB_LINES.slice(0, 14).forEach(l => {
        if (!onScreen((l.x1 + l.x2) / 2, (l.y1 + l.y2) / 2, 300)) return;
        ctx.strokeStyle = 'rgba(80,35,0,0.45)'; ctx.lineWidth = 5 * DPR;
        ctx.beginPath(); ctx.moveTo(wx(l.x1), wy(l.y1)); ctx.lineTo(wx(l.x2), wy(l.y2)); ctx.stroke();
        ctx.strokeStyle = 'rgba(255,100,0,0.12)'; ctx.lineWidth = 2 * DPR;
        ctx.beginPath(); ctx.moveTo(wx(l.x1), wy(l.y1)); ctx.lineTo(wx(l.x2), wy(l.y2)); ctx.stroke();
      });
      // Steam puffs rising
      STARS.slice(0, 25).forEach(s => {
        if (!onScreen(s.x, s.y, 40)) return;
        const fy = ((wy(s.y) - t * (30 + s.tw * 20) * DPR) % H + H) % H;
        const fade = fy / H;
        ctx.globalAlpha = s.a * 0.12 * fade;
        ctx.fillStyle = '#AA6600';
        ctx.beginPath(); ctx.arc(wx(s.x) + Math.sin(t * 0.8 + s.phase) * 10 * DPR, fy, s.r * 9 * DPR, 0, Math.PI * 2); ctx.fill();
        ctx.globalAlpha = 1;
      });
      break;
    }

    case 9: { // BIO-DIGITAL — organic cell blobs with pulsing nuclei
      BLDGS.slice(0, 14).forEach((b, i) => {
        const cx2 = wx(b.x), cy2 = wy((b.w * 1.5) % 1200);
        if (cx2 < -80 * DPR || cx2 > W + 80 * DPR || cy2 < -80 * DPR || cy2 > H + 80 * DPR) return;
        const cr = (14 + b.h * 0.09) * DPR;
        const pulse = cr * (1 + 0.07 * Math.sin(t * 1.1 + i));
        ctx.strokeStyle = `rgba(0,220,80,${0.07 + 0.04 * Math.sin(t + i)})`; ctx.lineWidth = 1.5 * DPR;
        ctx.beginPath(); ctx.arc(cx2, cy2, pulse, 0, Math.PI * 2); ctx.stroke();
        ctx.fillStyle = `rgba(40,255,100,${0.04 + 0.025 * Math.sin(t * 2 + i)})`;
        ctx.beginPath(); ctx.arc(cx2, cy2, pulse * 0.38, 0, Math.PI * 2); ctx.fill();
        // Membrane tendrils
        for (let td = 0; td < 4; td++) {
          const ta = (td / 4) * Math.PI * 2 + t * 0.3 + i;
          ctx.strokeStyle = `rgba(0,200,60,${0.04})`;
          ctx.beginPath(); ctx.moveTo(cx2, cy2); ctx.lineTo(cx2 + Math.cos(ta) * pulse * 1.3, cy2 + Math.sin(ta) * pulse * 1.3); ctx.stroke();
        }
      });
      break;
    }

    case 10: { // VOID MATRIX — black holes + static glitch noise
      BLDGS.slice(0, 7).forEach((b, i) => {
        const vx2 = wx(b.x), vy2 = wy((b.h + b.w) % 1200);
        if (vx2 < -80 * DPR || vx2 > W + 80 * DPR || vy2 < -80 * DPR || vy2 > H + 80 * DPR) return;
        const vr = (12 + b.w * 0.12) * DPR;
        const g = ctx.createRadialGradient(vx2, vy2, 0, vx2, vy2, vr);
        g.addColorStop(0, 'rgba(0,0,0,0.85)');
        g.addColorStop(0.65, 'rgba(20,20,35,0.35)');
        g.addColorStop(1, 'rgba(200,200,255,0.04)');
        ctx.fillStyle = g; ctx.beginPath(); ctx.arc(vx2, vy2, vr, 0, Math.PI * 2); ctx.fill();
        ctx.strokeStyle = `rgba(200,200,255,${0.12 + 0.08 * Math.sin(t * 2.8 + i)})`; ctx.lineWidth = DPR;
        ctx.beginPath(); ctx.arc(vx2, vy2, vr, 0, Math.PI * 2); ctx.stroke();
      });
      // Static glitch stripes
      if (Math.random() < 0.25) {
        for (let gi = 0; gi < 5; gi++) {
          ctx.fillStyle = `rgba(220,220,255,${Math.random() * 0.22})`;
          ctx.fillRect(Math.random() * W, Math.random() * H, Math.random() * 50 * DPR, 2 * DPR);
        }
      }
      break;
    }

    case 11: { // PHISHING NET — diamond mesh + animated hooks
      const ns = 65 * DPR;
      const noX = ((-camX * DPR * 0.5) % ns + ns * 2) % ns;
      const noY = ((-camY * DPR * 0.5) % ns + ns * 2) % ns;
      ctx.strokeStyle = 'rgba(100,200,0,0.1)'; ctx.lineWidth = 0.5 * DPR;
      for (let x = noX - ns; x < W + ns; x += ns) {
        for (let y = noY - ns; y < H + ns; y += ns) {
          ctx.beginPath();
          ctx.moveTo(x, y - ns / 2); ctx.lineTo(x + ns / 2, y);
          ctx.lineTo(x, y + ns / 2); ctx.lineTo(x - ns / 2, y);
          ctx.closePath(); ctx.stroke();
        }
      }
      // Animated hook shapes at STARS positions
      STARS.slice(0, 22).forEach(s => {
        if (!onScreen(s.x, s.y, 12)) return;
        const a = 0.12 + 0.09 * Math.abs(Math.sin(t + s.phase));
        ctx.globalAlpha = a; ctx.strokeStyle = '#88FF00'; ctx.lineWidth = DPR;
        const hx = wx(s.x), hy = wy(s.y);
        ctx.beginPath();
        ctx.arc(hx, hy - 4 * DPR, 3 * DPR, Math.PI, 0);
        ctx.lineTo(hx + 3 * DPR, hy + 5 * DPR);
        ctx.stroke();
        ctx.globalAlpha = 1;
      });
      break;
    }

    case 12: { // OVERCLOCK CORE — radial heat rings + rising sparks
      // Expanding heat rings from center
      for (let ri = 0; ri < 5; ri++) {
        const rp = ((t * 0.38 + ri * 0.2) % 1);
        const rr = rp * Math.min(W, H) * 0.72;
        const ra = 0.18 * (1 - rp);
        ctx.strokeStyle = `rgba(255,200,0,${ra})`; ctx.lineWidth = 2 * DPR;
        ctx.beginPath(); ctx.arc(W / 2, H / 2, rr, 0, Math.PI * 2); ctx.stroke();
      }
      // Sparks rising
      STARS.forEach(s => {
        if (!onScreen(s.x, s.y, 8)) return;
        const sy2 = ((wy(s.y) - t * (45 + s.tw * 28) * DPR) % H + H) % H;
        const fa = s.a * (1 - sy2 / H) * 0.8;
        ctx.globalAlpha = fa;
        ctx.fillStyle = s.r > 1.3 ? '#FFCC00' : '#FF8800';
        ctx.fillRect(wx(s.x) + Math.sin(t * 3.5 + s.phase) * 4 * DPR, sy2, DPR, 2.5 * DPR);
        ctx.globalAlpha = 1;
      });
      break;
    }

    case 13: { // SHADOW PROTOCOL — noir vignette + moving spotlight
      // Dark vignette
      const vg = ctx.createRadialGradient(W / 2, H / 2, H * 0.18, W / 2, H / 2, H * 0.8);
      vg.addColorStop(0, 'rgba(0,0,0,0)'); vg.addColorStop(1, 'rgba(0,0,0,0.6)');
      ctx.fillStyle = vg; ctx.fillRect(0, 0, W, H);
      // Sweeping spotlight cone
      const slx = W / 2 + Math.sin(t * 0.38) * W * 0.38;
      const slg = ctx.createRadialGradient(slx, 0, 0, slx, H * 0.5, H * 0.42);
      slg.addColorStop(0, 'rgba(180,0,20,0.065)'); slg.addColorStop(1, 'rgba(180,0,20,0)');
      ctx.fillStyle = slg; ctx.fillRect(0, 0, W, H);
      // Shadow debris particles
      STARS.slice(0, 35).forEach(s => {
        if (!onScreen(s.x, s.y, 6)) return;
        ctx.globalAlpha = s.a * 0.18; ctx.fillStyle = '#CC0020';
        ctx.fillRect(wx(s.x), wy(s.y), 2 * DPR, 2 * DPR);
        ctx.globalAlpha = 1;
      });
      break;
    }

    case 14: { // NEURAL CLUSTER — synaptic connections + pulsing neuron nodes
      WEB_LINES.forEach((l, i) => {
        if (!onScreen((l.x1 + l.x2) / 2, (l.y1 + l.y2) / 2, 300)) return;
        const a = 0.05 + 0.04 * Math.sin(t * 1.1 + i);
        ctx.strokeStyle = `rgba(180,60,255,${a})`; ctx.lineWidth = DPR;
        ctx.beginPath(); ctx.moveTo(wx(l.x1), wy(l.y1)); ctx.lineTo(wx(l.x2), wy(l.y2)); ctx.stroke();
        // Synaptic pulse travelling along each connection
        const tp = ((t * 0.75 + i * 0.28) % 1);
        const ppx = wx(l.x1) + (wx(l.x2) - wx(l.x1)) * tp;
        const ppy = wy(l.y1) + (wy(l.y2) - wy(l.y1)) * tp;
        ctx.fillStyle = 'rgba(220,100,255,0.55)'; ctx.shadowBlur = 5 * DPR; ctx.shadowColor = '#CC66FF';
        ctx.beginPath(); ctx.arc(ppx, ppy, 2.2 * DPR, 0, Math.PI * 2); ctx.fill();
        ctx.shadowBlur = 0;
      });
      // Neuron nodes
      STARS.slice(0, 45).forEach(s => {
        if (!onScreen(s.x, s.y, 8)) return;
        const na = 0.18 + 0.32 * Math.abs(Math.sin(t * 1.9 + s.phase));
        ctx.globalAlpha = na;
        ctx.fillStyle = '#CC66FF'; ctx.shadowBlur = 7 * DPR; ctx.shadowColor = '#CC66FF';
        ctx.beginPath(); ctx.arc(wx(s.x), wy(s.y), (s.r + 1.2) * DPR, 0, Math.PI * 2); ctx.fill();
        ctx.globalAlpha = 1; ctx.shadowBlur = 0;
      });
      break;
    }

    default: break;
  }
  ctx.restore();
}
