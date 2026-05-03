// ─── BiomeRenderer ────────────────────────────────────────────────────────────
// Per-biome background extras + obstacle theming. Each biome must be
// immediately, unmistakably different — strong alphas, structural elements.

export function renderBiomeExtras(ctx, idx, t, wx, wy, onScreen, W, H, DPR, camX, camY, STARS, BLDGS, WEB_LINES) {
  ctx.save();
  switch (idx) {

    case 0: { // CYBER GRID — purple hex lattice + bright scanning pulse
      // Hex tile floor overlay
      const hs = 38 * DPR;
      const hh = hs * 0.866;
      for (let col = -1; col < W / (hs * 1.5) + 2; col++) {
        for (let row = -1; row < H / hh + 2; row++) {
          const hx = col * hs * 1.5;
          const hy = row * hh + (col % 2 === 0 ? 0 : hh * 0.5);
          ctx.strokeStyle = 'rgba(191,0,255,0.22)'; ctx.lineWidth = DPR;
          ctx.beginPath();
          for (let p = 0; p < 6; p++) {
            const a = p / 6 * Math.PI * 2;
            ctx[p === 0 ? 'moveTo' : 'lineTo'](hx + Math.cos(a) * hs * 0.52, hy + Math.sin(a) * hs * 0.52);
          }
          ctx.closePath(); ctx.stroke();
        }
      }
      // Bright scan band
      const scanY = ((t * 90 * DPR) % (H + 60 * DPR));
      const sg = ctx.createLinearGradient(0, scanY - 50 * DPR, 0, scanY + 50 * DPR);
      sg.addColorStop(0,   'rgba(191,0,255,0)');
      sg.addColorStop(0.5, 'rgba(191,0,255,0.22)');
      sg.addColorStop(1,   'rgba(191,0,255,0)');
      ctx.fillStyle = sg; ctx.fillRect(0, scanY - 50 * DPR, W, 100 * DPR);
      // Pulsing corner brackets at STAR nodes
      ctx.shadowBlur = 6 * DPR; ctx.shadowColor = '#BF00FF';
      STARS.slice(0, 60).forEach(s => {
        if (!onScreen(s.x, s.y, 20)) return;
        const sx2 = wx(s.x), sy2 = wy(s.y);
        const bz = 8 * DPR;
        const a = s.a * (0.5 + 0.5 * Math.sin(t * 2.2 + s.phase));
        ctx.globalAlpha = a; ctx.strokeStyle = '#BF00FF'; ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(sx2 - bz, sy2 - bz); ctx.lineTo(sx2 - bz * 0.4, sy2 - bz);
        ctx.moveTo(sx2 - bz, sy2 - bz); ctx.lineTo(sx2 - bz, sy2 - bz * 0.4);
        ctx.moveTo(sx2 + bz, sy2 + bz); ctx.lineTo(sx2 + bz * 0.4, sy2 + bz);
        ctx.moveTo(sx2 + bz, sy2 + bz); ctx.lineTo(sx2 + bz, sy2 + bz * 0.4);
        ctx.stroke(); ctx.globalAlpha = 1;
      });
      ctx.shadowBlur = 0;
      break;
    }

    case 1: { // DEEP SPACE — visible star field + nebula bands + shooting stars
      // Nebula gradient
      const nb = ctx.createLinearGradient(0, 0, W, H);
      nb.addColorStop(0,   'rgba(0,20,100,0.22)');
      nb.addColorStop(0.4, 'rgba(0,60,180,0.10)');
      nb.addColorStop(1,   'rgba(10,0,60,0.18)');
      ctx.fillStyle = nb; ctx.fillRect(0, 0, W, H);
      // Bright twinkling stars
      STARS.forEach(s => {
        if (!onScreen(s.x, s.y, 6)) return;
        const a = s.a * (0.55 + 0.45 * Math.sin(t * s.tw + s.phase));
        ctx.globalAlpha = a;
        ctx.fillStyle = s.r > 1.5 ? '#88CCFF' : s.r > 1.0 ? '#FFFFFF' : '#AADDFF';
        if (s.r > 1.3) { ctx.shadowBlur = 7 * DPR; ctx.shadowColor = '#88CCFF'; }
        ctx.beginPath(); ctx.arc(wx(s.x), wy(s.y), s.r * DPR, 0, Math.PI * 2); ctx.fill();
        ctx.shadowBlur = 0; ctx.globalAlpha = 1;
      });
      // Nebula cloud blobs
      BLDGS.slice(0, 12).forEach((b, i) => {
        const nx = wx(b.x), ny = H * (0.1 + (i % 4) * 0.25);
        const nr = (60 + b.w * 0.5) * DPR;
        const g = ctx.createRadialGradient(nx, ny, 0, nx, ny, nr);
        g.addColorStop(0, 'rgba(0,60,180,0.12)');
        g.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.fillStyle = g; ctx.beginPath(); ctx.arc(nx, ny, nr, 0, Math.PI * 2); ctx.fill();
      });
      // Shooting star
      if (Math.sin(t * 0.7) > 0.85) {
        const slp = (t * 0.7 % 1);
        ctx.strokeStyle = 'rgba(200,230,255,0.9)'; ctx.lineWidth = 2 * DPR;
        ctx.shadowBlur = 10 * DPR; ctx.shadowColor = '#AADDFF';
        ctx.beginPath();
        ctx.moveTo(W * (0.05 + slp * 0.5), H * 0.06);
        ctx.lineTo(W * (0.05 + slp * 0.5) + 80 * DPR, H * 0.06 + 40 * DPR);
        ctx.stroke(); ctx.shadowBlur = 0;
      }
      break;
    }

    case 2: { // NEON CITY — building silhouettes + heavy digital rain + neon signs
      // Heavy neon rain
      STARS.forEach(s => {
        if (!onScreen(s.x, s.y, 24)) return;
        const ry = ((wy(s.y) + t * 200 * DPR * s.tw) % (H + 20 * DPR) + H) % (H + 20 * DPR);
        const ra = 0.28 + 0.22 * Math.sin(t + s.phase);
        ctx.globalAlpha = ra; ctx.strokeStyle = '#FF0066'; ctx.lineWidth = 1.5 * DPR;
        ctx.shadowBlur = 4 * DPR; ctx.shadowColor = '#FF0066';
        ctx.beginPath(); ctx.moveTo(wx(s.x), ry); ctx.lineTo(wx(s.x) - 2 * DPR, ry + 18 * DPR); ctx.stroke();
        ctx.shadowBlur = 0; ctx.globalAlpha = 1;
      });
      // Building silhouettes with lit windows
      BLDGS.forEach(b => {
        const bx = (wx(b.x) % W + W) % W;
        const bh = b.h * DPR * 0.45;
        const bw = b.w * DPR * 0.7;
        const by = H - bh;
        if (bx < -bw || bx > W + bw) return;
        ctx.fillStyle = 'rgba(8,0,3,0.88)'; ctx.fillRect(bx, by, bw, bh);
        ctx.strokeStyle = 'rgba(255,0,80,0.35)'; ctx.lineWidth = DPR; ctx.strokeRect(bx, by, bw, bh);
        // Windows
        const cols2 = Math.max(2, Math.floor(bw / (10 * DPR)));
        const rows2 = Math.max(2, Math.floor(bh / (14 * DPR)));
        for (let wr = 0; wr < rows2; wr++) {
          for (let wc = 0; wc < cols2; wc++) {
            if (Math.sin(t * 0.3 + b.x * 0.01 + wr * 3.7 + wc * 1.4) < 0.0) continue;
            const wx2 = bx + (wc + 0.5) * (bw / cols2) - 3 * DPR;
            const wy2 = by + (wr + 0.5) * (bh / rows2) - 4 * DPR;
            ctx.fillStyle = `rgba(255,${40 + Math.floor(Math.sin(t + wr + wc) * 20)},120,0.4)`;
            ctx.fillRect(wx2, wy2, 6 * DPR, 8 * DPR);
          }
        }
      });
      // Street level glow at bottom
      const sg2 = ctx.createLinearGradient(0, H * 0.75, 0, H);
      sg2.addColorStop(0, 'rgba(255,0,80,0)'); sg2.addColorStop(1, 'rgba(255,0,80,0.08)');
      ctx.fillStyle = sg2; ctx.fillRect(0, H * 0.75, W, H * 0.25);
      break;
    }

    case 3: { // DATA STORM — full Matrix rain (bright, dense)
      ctx.font = `bold ${8 * DPR}px monospace`;
      ctx.shadowBlur = 6 * DPR; ctx.shadowColor = '#00FF41';
      STARS.forEach(s => {
        if (!onScreen(s.x, s.y, 16)) return;
        const ry = ((wy(s.y) + t * (80 + s.tw * 60) * DPR) % (H + 20 * DPR));
        const ch = String.fromCharCode(33 + (Math.floor(t * 8 + s.phase * 12) % 94));
        // Dim trail
        ctx.fillStyle = `rgba(0,200,50,${0.28 + 0.12 * Math.sin(t + s.phase)})`;
        ctx.fillText(ch, wx(s.x), ry);
        // Bright leader
        ctx.fillStyle = 'rgba(200,255,200,0.9)';
        ctx.fillText(String.fromCharCode(33 + (Math.floor(t * 14 + s.phase * 18) % 94)), wx(s.x), ry - 10 * DPR);
      });
      ctx.shadowBlur = 0;
      // Green tint overlay
      ctx.fillStyle = 'rgba(0,255,64,0.04)'; ctx.fillRect(0, 0, W, H);
      break;
    }

    case 4: { // QUANTUM REALM — large concentric rings + bright shimmer
      // Rings from center
      for (let ri = 1; ri <= 8; ri++) {
        const rr = ri * Math.min(W, H) * 0.1;
        const ra = 0.12 + 0.08 * Math.abs(Math.sin(t * 0.5 + ri * 0.8));
        const arcStart = t * (ri % 2 === 0 ? 0.22 : -0.15);
        ctx.strokeStyle = `rgba(160,80,255,${ra})`; ctx.lineWidth = 1.5 * DPR;
        ctx.shadowBlur = ri % 2 === 0 ? 8 * DPR : 0; ctx.shadowColor = '#AA00FF';
        ctx.beginPath(); ctx.arc(W / 2, H / 2, rr, arcStart, arcStart + Math.PI * 1.7); ctx.stroke();
        ctx.shadowBlur = 0;
      }
      // Bright shimmer particles
      STARS.slice(0, 80).forEach(s => {
        if (!onScreen(s.x, s.y, 8)) return;
        const pa = s.a * (0.4 + 0.6 * Math.abs(Math.sin(t * 1.4 + s.phase)));
        ctx.globalAlpha = pa; ctx.fillStyle = '#CC88FF';
        ctx.shadowBlur = 6 * DPR; ctx.shadowColor = '#AA66FF';
        ctx.beginPath(); ctx.arc(wx(s.x), wy(s.y), s.r * DPR, 0, Math.PI * 2); ctx.fill();
        ctx.shadowBlur = 0; ctx.globalAlpha = 1;
      });
      // Center glow
      const cg = ctx.createRadialGradient(W / 2, H / 2, 0, W / 2, H / 2, Math.min(W, H) * 0.35);
      cg.addColorStop(0, 'rgba(120,0,255,0.08)'); cg.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = cg; ctx.fillRect(0, 0, W, H);
      break;
    }

    case 5: { // DARK WEB — prominent spider web + red pulsing nodes
      // Dense web strands
      ctx.shadowBlur = 3 * DPR; ctx.shadowColor = '#FF2200';
      WEB_LINES.forEach(l => {
        if (!onScreen((l.x1 + l.x2) / 2, (l.y1 + l.y2) / 2, 400)) return;
        ctx.strokeStyle = 'rgba(255,30,0,0.18)'; ctx.lineWidth = DPR;
        ctx.beginPath(); ctx.moveTo(wx(l.x1), wy(l.y1)); ctx.lineTo(wx(l.x2), wy(l.y2)); ctx.stroke();
      });
      ctx.shadowBlur = 0;
      // Cross-web strands from centre
      const cx5 = W / 2, cy5 = H / 2;
      for (let si = 0; si < 12; si++) {
        const a = si / 12 * Math.PI * 2 + t * 0.04;
        ctx.strokeStyle = 'rgba(200,20,0,0.14)'; ctx.lineWidth = DPR;
        ctx.beginPath(); ctx.moveTo(cx5, cy5); ctx.lineTo(cx5 + Math.cos(a) * W, cy5 + Math.sin(a) * H); ctx.stroke();
      }
      // Bright red pulsing nodes
      ctx.shadowBlur = 12 * DPR; ctx.shadowColor = '#FF2200';
      STARS.slice(0, 35).forEach(s => {
        if (!onScreen(s.x, s.y, 8)) return;
        const a = 0.4 + 0.5 * Math.abs(Math.sin(t * 1.8 + s.phase));
        ctx.globalAlpha = a; ctx.fillStyle = '#FF3300';
        ctx.beginPath(); ctx.arc(wx(s.x), wy(s.y), (2 + s.r) * DPR, 0, Math.PI * 2); ctx.fill();
        ctx.globalAlpha = 1;
      });
      ctx.shadowBlur = 0;
      // Crimson tint
      ctx.fillStyle = 'rgba(200,0,0,0.04)'; ctx.fillRect(0, 0, W, H);
      break;
    }

    case 6: { // AI NEXUS — circuit board traces + data pulses + blinking nodes
      // Manhattan circuit traces
      ctx.shadowBlur = 4 * DPR; ctx.shadowColor = '#00CCFF';
      WEB_LINES.forEach((l, i) => {
        if (!onScreen((l.x1 + l.x2) / 2, (l.y1 + l.y2) / 2, 400)) return;
        ctx.strokeStyle = 'rgba(0,200,255,0.22)'; ctx.lineWidth = DPR;
        ctx.beginPath();
        ctx.moveTo(wx(l.x1), wy(l.y1)); ctx.lineTo(wx(l.x2), wy(l.y1)); ctx.lineTo(wx(l.x2), wy(l.y2));
        ctx.stroke();
        // Data pulse bead
        const tp = ((t * 0.65 + i * 0.42) % 1);
        const ppx = wx(l.x1) + (wx(l.x2) - wx(l.x1)) * tp;
        ctx.fillStyle = '#00FFFF'; ctx.shadowBlur = 8 * DPR;
        ctx.beginPath(); ctx.arc(ppx, wy(l.y1), 2.5 * DPR, 0, Math.PI * 2); ctx.fill();
        ctx.shadowBlur = 4 * DPR;
      });
      ctx.shadowBlur = 0;
      // Blinking nodes — more visible
      STARS.slice(0, 40).forEach(s => {
        if (!onScreen(s.x, s.y, 8)) return;
        const blink = Math.sin(t * 3.5 + s.phase) > 0;
        ctx.globalAlpha = blink ? 0.7 : 0.18;
        ctx.fillStyle = blink ? '#00FFFF' : '#006688';
        ctx.shadowBlur = blink ? 10 * DPR : 0; ctx.shadowColor = '#00FFFF';
        ctx.beginPath(); ctx.arc(wx(s.x), wy(s.y), (blink ? 4 : 2.5) * DPR, 0, Math.PI * 2); ctx.fill();
        ctx.shadowBlur = 0; ctx.globalAlpha = 1;
      });
      // Cyan floor tint
      ctx.fillStyle = 'rgba(0,200,255,0.04)'; ctx.fillRect(0, 0, W, H);
      break;
    }

    case 7: { // CRYO VAULT — ice hex tiles + frost particles + blue tint
      // Blue ice tint
      ctx.fillStyle = 'rgba(0,150,200,0.08)'; ctx.fillRect(0, 0, W, H);
      // Ice hexagonal tiles
      const hs7 = 32 * DPR;
      const hh7 = hs7 * 0.866;
      ctx.shadowBlur = 4 * DPR; ctx.shadowColor = '#00EEFF';
      for (let col = -1; col < W / (hs7 * 1.5) + 2; col++) {
        for (let row = -1; row < H / hh7 + 2; row++) {
          const hx = col * hs7 * 1.5;
          const hy = row * hh7 + (col % 2 === 0 ? 0 : hh7 * 0.5);
          const crackAmt = Math.sin(col * 3.7 + row * 2.1) * 0.5 + 0.5;
          ctx.strokeStyle = `rgba(0,210,255,${0.10 + 0.08 * crackAmt})`; ctx.lineWidth = DPR;
          ctx.beginPath();
          for (let p = 0; p < 6; p++) {
            const a = p / 6 * Math.PI * 2 + Math.PI / 6;
            ctx[p === 0 ? 'moveTo' : 'lineTo'](hx + Math.cos(a) * hs7 * 0.48, hy + Math.sin(a) * hs7 * 0.48);
          }
          ctx.closePath(); ctx.stroke();
          // Inner facet
          ctx.strokeStyle = `rgba(180,255,255,${0.06 + 0.04 * crackAmt})`;
          ctx.beginPath(); ctx.arc(hx, hy, hs7 * 0.15, 0, Math.PI * 2); ctx.stroke();
        }
      }
      ctx.shadowBlur = 0;
      // Frost particles rising
      STARS.forEach(s => {
        if (!onScreen(s.x, s.y, 8)) return;
        const fy = ((wy(s.y) - t * 25 * DPR * s.tw + H) % H + H) % H;
        ctx.globalAlpha = s.a * 0.45; ctx.fillStyle = '#88EEFF';
        ctx.shadowBlur = 5 * DPR; ctx.shadowColor = '#88EEFF';
        ctx.beginPath(); ctx.arc(wx(s.x) + Math.sin(t * 1.2 + s.phase) * 5 * DPR, fy, s.r * DPR * 0.8, 0, Math.PI * 2); ctx.fill();
        ctx.shadowBlur = 0; ctx.globalAlpha = 1;
      });
      break;
    }

    case 8: { // INDUSTRIAL WASTE — pipes + lava glow at bottom + heavy steam
      // Lava glow at bottom
      const lavG = ctx.createLinearGradient(0, H * 0.7, 0, H);
      lavG.addColorStop(0, 'rgba(255,80,0,0)'); lavG.addColorStop(1, 'rgba(255,60,0,0.18)');
      ctx.fillStyle = lavG; ctx.fillRect(0, H * 0.7, W, H * 0.3);
      // Pipe structures — prominent
      ctx.lineCap = 'round';
      WEB_LINES.slice(0, 16).forEach(l => {
        if (!onScreen((l.x1 + l.x2) / 2, (l.y1 + l.y2) / 2, 400)) return;
        // Pipe body
        ctx.strokeStyle = 'rgba(60,25,0,0.65)'; ctx.lineWidth = 7 * DPR;
        ctx.beginPath(); ctx.moveTo(wx(l.x1), wy(l.y1)); ctx.lineTo(wx(l.x2), wy(l.y2)); ctx.stroke();
        // Hot edge
        ctx.strokeStyle = 'rgba(255,80,0,0.20)'; ctx.lineWidth = 2.5 * DPR;
        ctx.beginPath(); ctx.moveTo(wx(l.x1), wy(l.y1)); ctx.lineTo(wx(l.x2), wy(l.y2)); ctx.stroke();
        // Pipe connectors
        ctx.fillStyle = 'rgba(80,40,0,0.7)';
        ctx.beginPath(); ctx.arc(wx(l.x1), wy(l.y1), 5 * DPR, 0, Math.PI * 2); ctx.fill();
        ctx.beginPath(); ctx.arc(wx(l.x2), wy(l.y2), 5 * DPR, 0, Math.PI * 2); ctx.fill();
      });
      // Heavy steam puffs rising
      STARS.slice(0, 30).forEach(s => {
        if (!onScreen(s.x, s.y, 50)) return;
        const fy = ((wy(s.y) - t * (35 + s.tw * 25) * DPR + H) % H + H) % H;
        const fade = (H - fy) / H;
        ctx.globalAlpha = s.a * 0.18 * fade;
        ctx.fillStyle = '#994400';
        ctx.shadowBlur = 4 * DPR; ctx.shadowColor = '#FF8800';
        ctx.beginPath(); ctx.arc(wx(s.x) + Math.sin(t * 0.7 + s.phase) * 12 * DPR, fy, s.r * 11 * DPR, 0, Math.PI * 2); ctx.fill();
        ctx.shadowBlur = 0; ctx.globalAlpha = 1;
      });
      // Orange tint
      ctx.fillStyle = 'rgba(255,80,0,0.04)'; ctx.fillRect(0, 0, W, H);
      break;
    }

    case 9: { // BIO-DIGITAL — organic pulsing cell membrane + green tint + tendrils
      // Green organic tint
      ctx.fillStyle = 'rgba(0,200,60,0.06)'; ctx.fillRect(0, 0, W, H);
      // Organic cell blobs — more prominent
      BLDGS.slice(0, 16).forEach((b, i) => {
        const cx2 = wx(b.x), cy2 = wy((b.w * 1.5) % 1200);
        if (cx2 < -100 * DPR || cx2 > W + 100 * DPR || cy2 < -100 * DPR || cy2 > H + 100 * DPR) return;
        const cr = (18 + b.h * 0.1) * DPR;
        const pulse = cr * (1 + 0.10 * Math.sin(t * 1.2 + i));
        // Membrane
        ctx.strokeStyle = `rgba(0,220,80,${0.18 + 0.08 * Math.sin(t + i)})`; ctx.lineWidth = 2 * DPR;
        ctx.shadowBlur = 6 * DPR; ctx.shadowColor = '#00FF50';
        ctx.beginPath(); ctx.arc(cx2, cy2, pulse, 0, Math.PI * 2); ctx.stroke();
        // Inner nucleus
        ctx.fillStyle = `rgba(40,255,100,${0.10 + 0.06 * Math.sin(t * 2 + i)})`;
        ctx.beginPath(); ctx.arc(cx2, cy2, pulse * 0.4, 0, Math.PI * 2); ctx.fill();
        ctx.shadowBlur = 0;
        // Tendrils
        for (let td = 0; td < 5; td++) {
          const ta = (td / 5) * Math.PI * 2 + t * 0.35 + i * 0.4;
          const tlen = pulse * (1.3 + 0.2 * Math.sin(t * 1.8 + td));
          ctx.strokeStyle = `rgba(0,180,50,0.12)`; ctx.lineWidth = DPR; ctx.shadowBlur = 0;
          ctx.beginPath(); ctx.moveTo(cx2, cy2); ctx.lineTo(cx2 + Math.cos(ta) * tlen, cy2 + Math.sin(ta) * tlen); ctx.stroke();
        }
      });
      // Spore particles
      STARS.slice(0, 40).forEach(s => {
        if (!onScreen(s.x, s.y, 8)) return;
        const sp = s.a * (0.30 + 0.28 * Math.sin(t * 0.9 + s.phase));
        ctx.globalAlpha = sp; ctx.fillStyle = '#44FF88';
        ctx.beginPath(); ctx.arc(wx(s.x) + Math.sin(t * 0.6 + s.phase) * 8 * DPR, wy(s.y) + Math.cos(t * 0.5 + s.phase) * 5 * DPR, s.r * DPR, 0, Math.PI * 2); ctx.fill();
        ctx.globalAlpha = 1;
      });
      break;
    }

    case 10: { // VOID MATRIX — large void sinks + heavy static glitch
      // Dark void blobs
      BLDGS.slice(0, 8).forEach((b, i) => {
        const vx2 = wx(b.x), vy2 = wy((b.h + b.w * 0.5) % 1200);
        if (vx2 < -100 * DPR || vx2 > W + 100 * DPR) return;
        const vr = (20 + b.w * 0.14) * DPR;
        const g = ctx.createRadialGradient(vx2, vy2, 0, vx2, vy2, vr);
        g.addColorStop(0, 'rgba(0,0,0,0.92)');
        g.addColorStop(0.5, 'rgba(10,10,30,0.5)');
        g.addColorStop(1, 'rgba(200,200,255,0.05)');
        ctx.fillStyle = g; ctx.beginPath(); ctx.arc(vx2, vy2, vr, 0, Math.PI * 2); ctx.fill();
        ctx.strokeStyle = `rgba(200,200,255,${0.20 + 0.10 * Math.sin(t * 2.8 + i)})`; ctx.lineWidth = 1.5 * DPR;
        ctx.beginPath(); ctx.arc(vx2, vy2, vr, 0, Math.PI * 2); ctx.stroke();
      });
      // Static glitch noise — frequent stripes
      const glitchRate = 0.4 + 0.3 * Math.sin(t * 2.3);
      if (Math.random() < glitchRate) {
        for (let gi = 0; gi < 8; gi++) {
          ctx.fillStyle = `rgba(220,220,255,${Math.random() * 0.30})`;
          ctx.fillRect(Math.random() * W, Math.random() * H, (10 + Math.random() * 80) * DPR, (1 + Math.random() * 2) * DPR);
        }
      }
      // White noise dots
      if (Math.random() < 0.3) {
        for (let ni = 0; ni < 15; ni++) {
          ctx.fillStyle = `rgba(255,255,255,${Math.random() * 0.18})`;
          ctx.fillRect(Math.random() * W, Math.random() * H, 2 * DPR, 2 * DPR);
        }
      }
      break;
    }

    case 11: { // PHISHING NET — dense diamond mesh + animated hooks + green tint
      ctx.fillStyle = 'rgba(100,220,0,0.05)'; ctx.fillRect(0, 0, W, H);
      // Diamond mesh
      const ns = 55 * DPR;
      const noX = ((-camX * DPR * 0.5 % ns) + ns * 2) % ns;
      const noY = ((-camY * DPR * 0.5 % ns) + ns * 2) % ns;
      ctx.shadowBlur = 3 * DPR; ctx.shadowColor = '#88FF00';
      for (let gx = noX - ns; gx < W + ns; gx += ns) {
        for (let gy = noY - ns; gy < H + ns; gy += ns) {
          ctx.strokeStyle = 'rgba(120,220,0,0.18)'; ctx.lineWidth = DPR;
          ctx.beginPath();
          ctx.moveTo(gx, gy - ns / 2); ctx.lineTo(gx + ns / 2, gy);
          ctx.lineTo(gx, gy + ns / 2); ctx.lineTo(gx - ns / 2, gy);
          ctx.closePath(); ctx.stroke();
        }
      }
      ctx.shadowBlur = 0;
      // Animated hooks
      STARS.slice(0, 28).forEach(s => {
        if (!onScreen(s.x, s.y, 14)) return;
        const a = 0.22 + 0.18 * Math.abs(Math.sin(t * 1.4 + s.phase));
        ctx.globalAlpha = a; ctx.strokeStyle = '#88FF00'; ctx.lineWidth = 1.5 * DPR;
        ctx.shadowBlur = 5 * DPR; ctx.shadowColor = '#88FF00';
        const hx = wx(s.x), hy = wy(s.y);
        ctx.beginPath(); ctx.arc(hx, hy - 4 * DPR, 4 * DPR, Math.PI, 0); ctx.lineTo(hx + 4 * DPR, hy + 7 * DPR); ctx.stroke();
        ctx.shadowBlur = 0; ctx.globalAlpha = 1;
      });
      break;
    }

    case 12: { // OVERCLOCK CORE — bright heat rings + sparks + center furnace glow
      // Center furnace glow
      const fG = ctx.createRadialGradient(W / 2, H / 2, 0, W / 2, H / 2, Math.min(W, H) * 0.45);
      fG.addColorStop(0, 'rgba(255,200,0,0.14)'); fG.addColorStop(0.5, 'rgba(255,80,0,0.06)'); fG.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = fG; ctx.fillRect(0, 0, W, H);
      // Expanding heat rings
      for (let ri = 0; ri < 6; ri++) {
        const rp = ((t * 0.42 + ri / 6) % 1);
        const rr = rp * Math.min(W, H) * 0.68;
        const ra = 0.28 * (1 - rp);
        ctx.strokeStyle = `rgba(255,${140 + Math.floor(60 * rp)},0,${ra})`; ctx.lineWidth = 2 * DPR;
        ctx.shadowBlur = 8 * DPR; ctx.shadowColor = '#FFCC00';
        ctx.beginPath(); ctx.arc(W / 2, H / 2, rr, 0, Math.PI * 2); ctx.stroke();
        ctx.shadowBlur = 0;
      }
      // Rising sparks
      STARS.forEach(s => {
        if (!onScreen(s.x, s.y, 8)) return;
        const sy2 = ((wy(s.y) - t * (55 + s.tw * 35) * DPR + H * 2) % H + H) % H;
        const fa = s.a * (1 - sy2 / H) * 0.9;
        ctx.globalAlpha = fa;
        ctx.fillStyle = s.r > 1.3 ? '#FFEE00' : '#FF8800';
        ctx.shadowBlur = 5 * DPR; ctx.shadowColor = '#FFCC00';
        ctx.fillRect(wx(s.x) + Math.sin(t * 4 + s.phase) * 5 * DPR, sy2, DPR, 3 * DPR);
        ctx.shadowBlur = 0; ctx.globalAlpha = 1;
      });
      // Orange tint
      ctx.fillStyle = 'rgba(255,120,0,0.05)'; ctx.fillRect(0, 0, W, H);
      break;
    }

    case 13: { // SHADOW PROTOCOL — deep darkness vignette + moving spotlight
      // Dark vignette (strong)
      const vg13 = ctx.createRadialGradient(W / 2, H / 2, H * 0.15, W / 2, H / 2, H * 0.75);
      vg13.addColorStop(0, 'rgba(0,0,0,0)'); vg13.addColorStop(1, 'rgba(0,0,0,0.70)');
      ctx.fillStyle = vg13; ctx.fillRect(0, 0, W, H);
      // Sweeping spotlight
      const slx13 = W / 2 + Math.sin(t * 0.42) * W * 0.4;
      const slg = ctx.createRadialGradient(slx13, 0, 0, slx13, H * 0.52, H * 0.45);
      slg.addColorStop(0, 'rgba(160,0,20,0.10)'); slg.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = slg; ctx.fillRect(0, 0, W, H);
      // Shadow debris
      STARS.slice(0, 40).forEach(s => {
        if (!onScreen(s.x, s.y, 6)) return;
        ctx.globalAlpha = s.a * 0.25; ctx.fillStyle = '#CC0020';
        ctx.fillRect(wx(s.x), wy(s.y), 2.5 * DPR, 2.5 * DPR);
        ctx.globalAlpha = 1;
      });
      // Edge darkness strips
      const edW = W * 0.12;
      ctx.fillStyle = 'rgba(0,0,0,0.35)';
      ctx.fillRect(0, 0, edW, H); ctx.fillRect(W - edW, 0, edW, H);
      break;
    }

    case 14: { // NEURAL CLUSTER — strong synaptic connections + bright pulsing neurons
      // Purple neural tint
      ctx.fillStyle = 'rgba(150,30,255,0.05)'; ctx.fillRect(0, 0, W, H);
      // Synaptic connections — brighter
      ctx.shadowBlur = 5 * DPR; ctx.shadowColor = '#CC66FF';
      WEB_LINES.forEach((l, i) => {
        if (!onScreen((l.x1 + l.x2) / 2, (l.y1 + l.y2) / 2, 400)) return;
        const a = 0.10 + 0.08 * Math.sin(t * 1.2 + i);
        ctx.strokeStyle = `rgba(180,60,255,${a})`; ctx.lineWidth = 1.5 * DPR;
        ctx.beginPath(); ctx.moveTo(wx(l.x1), wy(l.y1)); ctx.lineTo(wx(l.x2), wy(l.y2)); ctx.stroke();
        // Synaptic pulse
        const tp = ((t * 0.85 + i * 0.32) % 1);
        const ppx = wx(l.x1) + (wx(l.x2) - wx(l.x1)) * tp;
        const ppy = wy(l.y1) + (wy(l.y2) - wy(l.y1)) * tp;
        ctx.fillStyle = 'rgba(240,120,255,0.75)'; ctx.shadowBlur = 8 * DPR;
        ctx.beginPath(); ctx.arc(ppx, ppy, 3 * DPR, 0, Math.PI * 2); ctx.fill();
        ctx.shadowBlur = 5 * DPR;
      });
      ctx.shadowBlur = 0;
      // Neuron nodes — clearly visible
      STARS.slice(0, 50).forEach(s => {
        if (!onScreen(s.x, s.y, 8)) return;
        const na = 0.30 + 0.45 * Math.abs(Math.sin(t * 2.0 + s.phase));
        ctx.globalAlpha = na;
        ctx.fillStyle = '#CC66FF'; ctx.shadowBlur = 10 * DPR; ctx.shadowColor = '#AA44FF';
        ctx.beginPath(); ctx.arc(wx(s.x), wy(s.y), (s.r + 1.5) * DPR, 0, Math.PI * 2); ctx.fill();
        ctx.globalAlpha = 1; ctx.shadowBlur = 0;
      });
      break;
    }

    default: break;
  }
  ctx.restore();
}

// ─── Biome-themed obstacle renderer ───────────────────────────────────────────
// Call this instead of the generic fillRect/strokeRect for each obstacle.
export function renderBiomeObstacle(ctx, o, wx, wy, DPR, mapIdx, M, t) {
  const ox = wx(o.x), oy = wy(o.y), ow = o.w * DPR, oh = o.h * DPR;

  ctx.save();
  switch (mapIdx) {

    case 0: // CYBER GRID — dark purple wall with circuit edge
      ctx.fillStyle = 'rgba(20,0,40,0.85)'; ctx.fillRect(ox, oy, ow, oh);
      ctx.strokeStyle = '#BF00FF'; ctx.lineWidth = 1.5 * DPR;
      ctx.shadowBlur = 8 * DPR; ctx.shadowColor = '#BF00FF';
      ctx.strokeRect(ox, oy, ow, oh);
      // Corner connectors
      ctx.fillStyle = '#BF00FF';
      [[ox, oy], [ox + ow, oy], [ox, oy + oh], [ox + ow, oy + oh]].forEach(([cx2, cy2]) => {
        ctx.beginPath(); ctx.arc(cx2, cy2, 3 * DPR, 0, Math.PI * 2); ctx.fill();
      });
      break;

    case 1: // DEEP SPACE — dark asteroid
      ctx.fillStyle = 'rgba(5,5,25,0.90)'; ctx.fillRect(ox, oy, ow, oh);
      ctx.strokeStyle = '#0088FF'; ctx.lineWidth = DPR;
      ctx.shadowBlur = 6 * DPR; ctx.shadowColor = '#0066CC';
      ctx.strokeRect(ox, oy, ow, oh);
      ctx.fillStyle = '#0044AA'; ctx.shadowBlur = 0;
      [[ox, oy], [ox + ow, oy], [ox, oy + oh], [ox + ow, oy + oh]].forEach(([cx2, cy2]) => {
        ctx.beginPath(); ctx.arc(cx2, cy2, 2.5 * DPR, 0, Math.PI * 2); ctx.fill();
      });
      break;

    case 2: // NEON CITY — building facade with pink windows
      ctx.fillStyle = 'rgba(8,0,3,0.92)'; ctx.fillRect(ox, oy, ow, oh);
      ctx.strokeStyle = '#FF0066'; ctx.lineWidth = 1.5 * DPR;
      ctx.shadowBlur = 8 * DPR; ctx.shadowColor = '#FF0066';
      ctx.strokeRect(ox, oy, ow, oh);
      // Lit windows
      if (ow > 20 * DPR && oh > 12 * DPR) {
        const wc = Math.max(1, Math.floor(ow / (12 * DPR)));
        const wr2 = Math.max(1, Math.floor(oh / (14 * DPR)));
        for (let r = 0; r < wr2; r++) {
          for (let c = 0; c < wc; c++) {
            if (Math.sin(t * 0.3 + o.x * 0.02 + r * 4.1 + c * 2.7) < 0.2) continue;
            ctx.fillStyle = 'rgba(255,40,120,0.38)';
            ctx.fillRect(ox + (c + 0.25) * (ow / wc), oy + (r + 0.25) * (oh / wr2), ow / wc * 0.5, oh / wr2 * 0.5);
          }
        }
      }
      ctx.shadowBlur = 0; break;

    case 3: // DATA STORM — green data block with scrolling text line
      ctx.fillStyle = 'rgba(0,10,0,0.88)'; ctx.fillRect(ox, oy, ow, oh);
      ctx.strokeStyle = '#00FF41'; ctx.lineWidth = DPR;
      ctx.shadowBlur = 6 * DPR; ctx.shadowColor = '#00FF41';
      ctx.strokeRect(ox, oy, ow, oh);
      // Scrolling data stripe
      ctx.fillStyle = `rgba(0,255,50,0.12)`;
      const sy3 = ((t * 30 * DPR) % oh + oh) % oh;
      ctx.fillRect(ox, oy + sy3, ow, 4 * DPR);
      ctx.shadowBlur = 0; break;

    case 4: // QUANTUM REALM — violet faceted crystal
      ctx.fillStyle = 'rgba(15,0,30,0.88)'; ctx.fillRect(ox, oy, ow, oh);
      ctx.strokeStyle = '#AA00FF'; ctx.lineWidth = 1.5 * DPR;
      ctx.shadowBlur = 10 * DPR; ctx.shadowColor = '#8800CC';
      ctx.strokeRect(ox, oy, ow, oh);
      // Facet line diagonally
      ctx.strokeStyle = 'rgba(180,80,255,0.25)'; ctx.lineWidth = DPR;
      ctx.shadowBlur = 0;
      ctx.beginPath(); ctx.moveTo(ox, oy); ctx.lineTo(ox + ow, oy + oh); ctx.stroke();
      ctx.fillStyle = '#CC88FF';
      [[ox, oy], [ox + ow, oy], [ox, oy + oh], [ox + ow, oy + oh]].forEach(([cx2, cy2]) => {
        ctx.beginPath(); ctx.arc(cx2, cy2, 3 * DPR, 0, Math.PI * 2); ctx.fill();
      });
      break;

    case 5: // DARK WEB — near-black with red strands
      ctx.fillStyle = 'rgba(4,0,0,0.92)'; ctx.fillRect(ox, oy, ow, oh);
      ctx.strokeStyle = '#CC1100'; ctx.lineWidth = DPR;
      ctx.shadowBlur = 6 * DPR; ctx.shadowColor = '#CC1100';
      ctx.strokeRect(ox, oy, ow, oh);
      // Web strand across obstacle
      ctx.strokeStyle = 'rgba(200,30,0,0.2)'; ctx.lineWidth = DPR; ctx.shadowBlur = 0;
      ctx.beginPath(); ctx.moveTo(ox, oy + oh * 0.5); ctx.lineTo(ox + ow, oy + oh * 0.5); ctx.stroke();
      ctx.fillStyle = '#FF2200'; ctx.shadowBlur = 5 * DPR; ctx.shadowColor = '#FF2200';
      [[ox + ow * 0.25, oy + oh * 0.5], [ox + ow * 0.75, oy + oh * 0.5]].forEach(([cx2, cy2]) => {
        ctx.beginPath(); ctx.arc(cx2, cy2, 2.5 * DPR, 0, Math.PI * 2); ctx.fill();
      });
      ctx.shadowBlur = 0; break;

    case 6: // AI NEXUS — circuit board
      ctx.fillStyle = 'rgba(0,8,18,0.90)'; ctx.fillRect(ox, oy, ow, oh);
      ctx.strokeStyle = '#00CCFF'; ctx.lineWidth = 1.5 * DPR;
      ctx.shadowBlur = 8 * DPR; ctx.shadowColor = '#00AAFF';
      ctx.strokeRect(ox, oy, ow, oh);
      // Circuit trace
      ctx.strokeStyle = 'rgba(0,200,255,0.22)'; ctx.lineWidth = DPR; ctx.shadowBlur = 0;
      ctx.beginPath(); ctx.moveTo(ox + ow * 0.3, oy); ctx.lineTo(ox + ow * 0.3, oy + oh * 0.5); ctx.lineTo(ox + ow * 0.7, oy + oh * 0.5); ctx.lineTo(ox + ow * 0.7, oy + oh); ctx.stroke();
      ctx.fillStyle = '#00FFFF'; ctx.shadowBlur = 6 * DPR; ctx.shadowColor = '#00FFFF';
      ctx.beginPath(); ctx.arc(ox + ow * 0.3, oy + oh * 0.5, 3 * DPR, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.arc(ox + ow * 0.7, oy + oh * 0.5, 3 * DPR, 0, Math.PI * 2); ctx.fill();
      ctx.shadowBlur = 0; break;

    case 7: // CRYO VAULT — ice block with frost glow
      ctx.fillStyle = 'rgba(0,15,30,0.88)'; ctx.fillRect(ox, oy, ow, oh);
      ctx.strokeStyle = '#00EEFF'; ctx.lineWidth = 1.5 * DPR;
      ctx.shadowBlur = 10 * DPR; ctx.shadowColor = '#00CCFF';
      ctx.strokeRect(ox, oy, ow, oh);
      // Ice crack lines
      ctx.strokeStyle = 'rgba(100,230,255,0.18)'; ctx.lineWidth = DPR; ctx.shadowBlur = 0;
      ctx.beginPath(); ctx.moveTo(ox + ow * 0.2, oy); ctx.lineTo(ox + ow * 0.5, oy + oh * 0.6); ctx.lineTo(ox + ow * 0.8, oy + oh); ctx.stroke();
      ctx.fillStyle = '#88EEFF'; ctx.shadowBlur = 6 * DPR; ctx.shadowColor = '#88EEFF';
      [[ox, oy], [ox + ow, oy], [ox, oy + oh], [ox + ow, oy + oh]].forEach(([cx2, cy2]) => {
        ctx.beginPath(); ctx.arc(cx2, cy2, 3 * DPR, 0, Math.PI * 2); ctx.fill();
      });
      ctx.shadowBlur = 0; break;

    case 8: // INDUSTRIAL WASTE — rusted metal
      ctx.fillStyle = 'rgba(18,8,0,0.90)'; ctx.fillRect(ox, oy, ow, oh);
      ctx.strokeStyle = '#FF8800'; ctx.lineWidth = DPR;
      ctx.shadowBlur = 6 * DPR; ctx.shadowColor = '#FF6600';
      ctx.strokeRect(ox, oy, ow, oh);
      // Rivet bolts at corners
      ctx.fillStyle = '#CC5500'; ctx.shadowBlur = 4 * DPR; ctx.shadowColor = '#FF6600';
      [[ox + 5 * DPR, oy + 5 * DPR], [ox + ow - 5 * DPR, oy + 5 * DPR],
       [ox + 5 * DPR, oy + oh - 5 * DPR], [ox + ow - 5 * DPR, oy + oh - 5 * DPR]].forEach(([cx2, cy2]) => {
        ctx.beginPath(); ctx.arc(cx2, cy2, 3 * DPR, 0, Math.PI * 2); ctx.fill();
      });
      ctx.shadowBlur = 0; break;

    case 9: // BIO-DIGITAL — organic membrane
      ctx.fillStyle = 'rgba(0,12,4,0.88)'; ctx.fillRect(ox, oy, ow, oh);
      ctx.strokeStyle = '#00FF55'; ctx.lineWidth = 1.5 * DPR;
      ctx.shadowBlur = 8 * DPR; ctx.shadowColor = '#00CC44';
      ctx.strokeRect(ox, oy, ow, oh);
      // Pulsing inner fill
      const biopulse = 0.06 + 0.04 * Math.sin(t * 1.5 + o.x * 0.01);
      ctx.fillStyle = `rgba(0,200,60,${biopulse})`; ctx.fillRect(ox, oy, ow, oh);
      ctx.fillStyle = '#44FF88'; ctx.shadowBlur = 5 * DPR; ctx.shadowColor = '#00FF55';
      [[ox, oy], [ox + ow, oy], [ox, oy + oh], [ox + ow, oy + oh]].forEach(([cx2, cy2]) => {
        ctx.beginPath(); ctx.arc(cx2, cy2, 3 * DPR, 0, Math.PI * 2); ctx.fill();
      });
      ctx.shadowBlur = 0; break;

    case 10: // VOID MATRIX — black void
      ctx.fillStyle = 'rgba(0,0,0,0.96)'; ctx.fillRect(ox, oy, ow, oh);
      ctx.strokeStyle = '#CCCCFF'; ctx.lineWidth = DPR;
      ctx.shadowBlur = 6 * DPR; ctx.shadowColor = '#9999CC';
      ctx.strokeRect(ox, oy, ow, oh);
      ctx.shadowBlur = 0; break;

    case 11: // PHISHING NET — dark with green grid
      ctx.fillStyle = 'rgba(2,8,0,0.90)'; ctx.fillRect(ox, oy, ow, oh);
      ctx.strokeStyle = '#88FF00'; ctx.lineWidth = DPR;
      ctx.shadowBlur = 6 * DPR; ctx.shadowColor = '#66CC00';
      ctx.strokeRect(ox, oy, ow, oh);
      ctx.fillStyle = '#88FF00'; ctx.shadowBlur = 4 * DPR;
      [[ox, oy], [ox + ow, oy], [ox, oy + oh], [ox + ow, oy + oh]].forEach(([cx2, cy2]) => {
        ctx.beginPath(); ctx.arc(cx2, cy2, 3 * DPR, 0, Math.PI * 2); ctx.fill();
      });
      ctx.shadowBlur = 0; break;

    case 12: // OVERCLOCK CORE — hot metal plate
      ctx.fillStyle = 'rgba(20,5,0,0.88)'; ctx.fillRect(ox, oy, ow, oh);
      ctx.strokeStyle = '#FFCC00'; ctx.lineWidth = 1.5 * DPR;
      ctx.shadowBlur = 10 * DPR; ctx.shadowColor = '#FF8800';
      ctx.strokeRect(ox, oy, ow, oh);
      // Heat glow inner
      const hgAlpha = 0.05 + 0.04 * Math.sin(t * 2.5 + o.x * 0.02);
      ctx.fillStyle = `rgba(255,100,0,${hgAlpha})`; ctx.fillRect(ox, oy, ow, oh);
      ctx.fillStyle = '#FFCC00'; ctx.shadowBlur = 8 * DPR;
      [[ox, oy], [ox + ow, oy], [ox, oy + oh], [ox + ow, oy + oh]].forEach(([cx2, cy2]) => {
        ctx.beginPath(); ctx.arc(cx2, cy2, 3 * DPR, 0, Math.PI * 2); ctx.fill();
      });
      ctx.shadowBlur = 0; break;

    case 13: // SHADOW PROTOCOL — almost invisible dark block
      ctx.fillStyle = 'rgba(3,0,0,0.92)'; ctx.fillRect(ox, oy, ow, oh);
      ctx.strokeStyle = 'rgba(150,0,20,0.55)'; ctx.lineWidth = DPR;
      ctx.strokeRect(ox, oy, ow, oh);
      break;

    case 14: // NEURAL CLUSTER — purple neural block
      ctx.fillStyle = 'rgba(8,0,20,0.90)'; ctx.fillRect(ox, oy, ow, oh);
      ctx.strokeStyle = '#CC66FF'; ctx.lineWidth = 1.5 * DPR;
      ctx.shadowBlur = 8 * DPR; ctx.shadowColor = '#AA44FF';
      ctx.strokeRect(ox, oy, ow, oh);
      ctx.fillStyle = '#CC66FF'; ctx.shadowBlur = 5 * DPR;
      [[ox, oy], [ox + ow, oy], [ox, oy + oh], [ox + ow, oy + oh]].forEach(([cx2, cy2]) => {
        ctx.beginPath(); ctx.arc(cx2, cy2, 3 * DPR, 0, Math.PI * 2); ctx.fill();
      });
      ctx.shadowBlur = 0; break;

    default:
      ctx.fillStyle = 'rgba(255,255,255,0.03)'; ctx.fillRect(ox, oy, ow, oh);
      ctx.strokeStyle = M.ac; ctx.lineWidth = DPR; ctx.strokeRect(ox, oy, ow, oh);
      ctx.fillStyle = M.sc;
      [[ox, oy], [ox + ow, oy], [ox, oy + oh], [ox + ow, oy + oh]].forEach(([cx2, cy2]) => {
        ctx.beginPath(); ctx.arc(cx2, cy2, 2.5 * DPR, 0, Math.PI * 2); ctx.fill();
      });
  }
  ctx.restore();
}
