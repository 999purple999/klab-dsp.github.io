// ─── Weapon Catalog – 30 Weapons across 8 Classes ────────────────────────────
// All stats: 0-100 (higher always better).
// fireRate: 0-100 → 60-1200 RPM (100 = 1200 RPM). damage is raw per-shot.
// TTK targets: SMG/SG close 200-300ms, AR mid 300-400ms, LMG 350-450ms,
//   Sniper head instant/150ms, Marksman chest 200-250ms.

import { WeaponBase } from './WeaponBase.js';

const rp = (...pts) => pts.map(([x, y]) => ({ x, y }));

// ── ASSAULT RIFLES ────────────────────────────────────────────────────────────

const K_AR_OBLIVION = {
  id: 'k_ar_oblivion', name: 'K-AR "OBLIVION"', weaponClass: 'assault',
  col: '#00FFCC', tag: 'STANDARD', unlockLevel: 0,
  description: 'Standard-issue cyber-frame. Balanced in every dimension. Reliable from any engagement distance.',
  stats: { damage: 28, fireRate: 57, accuracy: 65, range: 65, mobility: 85, control: 70, handling: 72 },
  magazine: 30, reserve: 90,
  recoilPattern: rp([0,-2],[0.5,-2.5],[1,-3],[1.5,-3.5],[2,-3],[2.5,-2.5],[3,-2],[2.5,-1.5],[2,-1],[1.5,-0.5]),
  ammoTypes: ['standard','overpressure','ap','incendiary','cryo'],
  uniqueAttachment: { id: 'oblivion_core', name: 'Oblivion Core', slot: 'barrel',
    desc: '+20% range, digital sound skin. -5% mobility.',
    modifiers: { range: 12, mobility: -5 }, unlockLevel: 30,
    pros: ['+Range','Unique Sound'], cons: ['-Mobility'] },
};

const M4C_NEON = {
  id: 'm4c_neon', name: 'M4-C "NEON"', weaponClass: 'assault',
  col: '#00CCFF', tag: 'RAPID FIRE', unlockLevel: 5,
  description: 'High-rate barrel with thermal dissipation fins. Shreds targets at mid-range.',
  stats: { damage: 24, fireRate: 67, accuracy: 60, range: 60, mobility: 88, control: 55, handling: 75 },
  magazine: 30, reserve: 90,
  recoilPattern: rp([0,-1.5],[0,-2],[0.5,-2.5],[1,-3],[1.5,-3.5],[2,-4],[2.5,-4.5],[3,-4],[3.5,-3.5],[4,-3]),
  ammoTypes: ['standard','overpressure','ap','incendiary','subsonic'],
  uniqueAttachment: { id: 'neon_tracer', name: 'Neon Tracer Mag', slot: 'magazine',
    desc: 'Cyan bullet trails. +5% accuracy. -10% range.',
    modifiers: { accuracy: 5, range: -10 }, unlockLevel: 25,
    pros: ['Cyan Trails','+Accuracy'], cons: ['-Range'] },
};

const AKX_CORRUPTOR = {
  id: 'akx_corruptor', name: 'AK-X "CORRUPTOR"', weaponClass: 'assault',
  col: '#FF2200', tag: 'HIGH DAMAGE', unlockLevel: 15,
  description: 'Devastating stopping power with ferocious recoil. Rewards the disciplined operator.',
  stats: { damage: 35, fireRate: 47, accuracy: 50, range: 70, mobility: 78, control: 45, handling: 58 },
  magazine: 30, reserve: 60,
  recoilPattern: rp([0,-3],[-0.5,-3.5],[-1,-4],[-1.5,-4.5],[-2,-4],[-2.5,-3.5],[-3,-3],[-3.5,-2.5],[-4,-2],[-4.5,-1.5]),
  ammoTypes: ['standard','overpressure','ap','explosive','corrosive'],
  uniqueAttachment: { id: 'corruptor_rounds', name: 'Corruptor Rounds', slot: 'magazine',
    desc: 'Infected targets take DoT 8/sec for 3s. -20% bullet damage.',
    modifiers: { damage: -7 }, unlockLevel: 35, special: 'infect_dot',
    pros: ['DoT 8/s × 3s'], cons: ['-Damage'] },
};

const CR56_AXIOM = {
  id: 'cr56_axiom', name: 'CR-56 "AXIOM"', weaponClass: 'assault',
  col: '#FFAA00', tag: 'BURST', unlockLevel: 20,
  description: 'Precision 3-round burst in a bullpup frame. Surgical at any range.',
  stats: { damage: 32, fireRate: 75, accuracy: 80, range: 75, mobility: 82, control: 75, handling: 68 },
  magazine: 30, reserve: 90,
  recoilPattern: rp([0,-1],[0,-2],[0,-3],[0,-1],[0,-2],[0,-3]),  // burst cycle
  ammoTypes: ['standard','ap','subsonic','smart_link'],
  uniqueAttachment: { id: 'axiom_processor', name: 'Axiom Processor', slot: 'optic',
    desc: 'Built-in 2.5×. +15% headshot multiplier.',
    modifiers: { accuracy: 8, handling: -5 }, unlockLevel: 30, special: 'headshot_boost', zoom: 2.5,
    pros: ['+Headshot Damage','2.5× Zoom'], cons: ['-ADS Speed'] },
};

const FFAL_GHOSTWIRE = {
  id: 'ffal_ghostwire', name: 'FFAL "GHOSTWIRE"', weaponClass: 'assault',
  col: '#88FF44', tag: 'SEMI-AUTO', unlockLevel: 25,
  description: 'Mobile semi-automatic with integrated ghost suppressor. High damage per trigger pull.',
  stats: { damage: 42, fireRate: 33, accuracy: 70, range: 68, mobility: 90, control: 65, handling: 80 },
  magazine: 20, reserve: 60,
  recoilPattern: rp([0,-4],[0.5,-3.5],[0,-3],[0.5,-3.5],[0,-3]),
  ammoTypes: ['standard','ap','hollow_point','shock'],
  uniqueAttachment: { id: 'ghostwire_sup', name: 'Ghostwire Suppressor', slot: 'muzzle',
    desc: 'Integrated suppressor. No range penalty. -5% damage.',
    modifiers: { damage: -2 }, unlockLevel: 30, special: 'stealth',
    pros: ['No Range Loss','Stealth'], cons: ['-Damage'] },
};

// ── SMGs ──────────────────────────────────────────────────────────────────────

const MP5K_VIPER = {
  id: 'mp5k_viper', name: 'MP5-K "VIPER"', weaponClass: 'smg',
  col: '#BF00FF', tag: 'CQB KING', unlockLevel: 0,
  description: 'The gold standard of close-quarters. Compact, lethal, whisper-quiet.',
  stats: { damage: 26, fireRate: 67, accuracy: 60, range: 35, mobility: 95, control: 70, handling: 88 },
  magazine: 30, reserve: 90,
  recoilPattern: rp([0,-1],[0.5,-1.5],[1,-1],[0.5,-1.5],[0,-2],[-0.5,-1.5],[-1,-1],[-0.5,-1.5],[0,-1],[0.5,-1]),
  ammoTypes: ['standard','subsonic','hollow_point','cryo'],
  uniqueAttachment: { id: 'viper_fang', name: 'Viper Fang Blade', slot: 'underbarrel',
    desc: 'Integrated blade. Instant melee. +10% melee range.',
    modifiers: {}, unlockLevel: 20, special: 'fast_melee',
    pros: ['Instant Melee','+Melee Range'], cons: [] },
};

const UZIM_SPRAY = {
  id: 'uzim_spray', name: 'UZI-M "SPRAY"', weaponClass: 'smg',
  col: '#FF88FF', tag: 'FULL SPRAY', unlockLevel: 8,
  description: '1100 RPM chaos engine. Overwhelms sensors and enemies alike.',
  stats: { damage: 20, fireRate: 92, accuracy: 45, range: 30, mobility: 98, control: 40, handling: 92 },
  magazine: 32, reserve: 128,
  recoilPattern: rp([0,-1],[0.5,-1.5],[1,-2],[-1,-2.5],[2,-1.5],[-2,-1]),
  ammoTypes: ['standard','subsonic','incendiary'],
  uniqueAttachment: { id: 'overclock_motor', name: 'Overclock Motor', slot: 'barrel',
    desc: '+150 RPM, +10% mobility, -20% control.',
    modifiers: { fireRate: 12, mobility: 10, control: -20 }, unlockLevel: 25,
    pros: ['+RPM','+Mobility'], cons: ['-Control'] },
};

const P90X_VECTOR = {
  id: 'p90x_vector', name: 'P90-X "VECTOR"', weaponClass: 'smg',
  col: '#00FFCC', tag: 'PRECISION SMG', unlockLevel: 12,
  description: 'Alien-silhouetted PDW with 50-round horizontal mag. Lowest spread of any SMG.',
  stats: { damage: 22, fireRate: 75, accuracy: 75, range: 40, mobility: 92, control: 80, handling: 85 },
  magazine: 50, reserve: 100,
  recoilPattern: rp([0,-0.5],[0.2,-0.5],[0.4,-0.5],[0.6,-0.5],[0.4,-0.5]),
  ammoTypes: ['standard','ap','smart_link'],
  uniqueAttachment: { id: 'vector_horizontal', name: 'Vector Horizontal', slot: 'stock',
    desc: 'Eliminates horizontal recoil. +10% ADS.',
    modifiers: { accuracy: 15, handling: 10 }, unlockLevel: 28,
    pros: ['No H-Recoil','+ADS'], cons: [] },
};

const MP7_SILENCER = {
  id: 'mp7_silencer', name: 'MP7 "SILENCER"', weaponClass: 'smg',
  col: '#888888', tag: 'STEALTH', unlockLevel: 18,
  description: 'Ghost-optimised PDW. No sound, no muzzle flash, no trace.',
  stats: { damage: 24, fireRate: 63, accuracy: 68, range: 38, mobility: 94, control: 72, handling: 87 },
  magazine: 40, reserve: 120,
  recoilPattern: rp([0,-1],[0,-1.2],[0.2,-1.4],[0.2,-1.6],[0,-1.8]),
  ammoTypes: ['standard','subsonic','cryo','shock'],
  uniqueAttachment: { id: 'shadow_integral', name: 'Shadow Integral', slot: 'muzzle',
    desc: 'Absolute silence. +10% range. No muzzle flash. -10% ADS.',
    modifiers: { range: 10, handling: -10 }, unlockLevel: 30, special: 'stealth',
    pros: ['Absolute Silence','+Range'], cons: ['-ADS'] },
};

const STRIKER_THUNDER = {
  id: 'striker_thunder', name: 'STRIKER "THUNDER"', weaponClass: 'smg',
  col: '#FFCC00', tag: 'HEAVY SMG', unlockLevel: 22,
  description: 'Assault-Rifle damage in an SMG frame. Slow but devastatingly punishing.',
  stats: { damage: 34, fireRate: 42, accuracy: 55, range: 45, mobility: 88, control: 60, handling: 78 },
  magazine: 24, reserve: 72,
  recoilPattern: rp([0,-3],[0,-3.5],[0.5,-3],[0,-3.5],[0.5,-3]),
  ammoTypes: ['standard','overpressure','hollow_point','ap'],
  uniqueAttachment: { id: 'thunder_slug', name: 'Thunder Slug', slot: 'magazine',
    desc: 'Heavy single projectiles. +40% damage, -20% RPM, +15% accuracy.',
    modifiers: { damage: 14, fireRate: -20, accuracy: 15 }, unlockLevel: 35,
    pros: ['+Damage','+Accuracy'], cons: ['-Fire Rate'] },
};

// ── SHOTGUNS ──────────────────────────────────────────────────────────────────

const M870_JUDGE = {
  id: 'm870_judge', name: 'M870 "JUDGE"', weaponClass: 'shotgun',
  col: '#FF6600', tag: 'PUMP', unlockLevel: 3,
  description: '8-pellet pump verdict. One-shot potential at point-blank.',
  stats: { damage: 20, fireRate: 6, accuracy: 40, range: 25, mobility: 80, control: 50, handling: 55 },
  magazine: 5, reserve: 20,
  recoilPattern: rp([0,-8],[0,-8]),
  ammoTypes: ['standard','incendiary','explosive'],
  uniqueAttachment: { id: 'judge_jury', name: 'Judge Jury Barrel', slot: 'barrel',
    desc: '+2 pellets, +10% range, -15% ADS.',
    modifiers: { range: 10, handling: -15 }, unlockLevel: 25, special: 'extra_pellets',
    pros: ['+2 Pellets','+Range'], cons: ['-ADS'] },
};

const AA12_AUTO = {
  id: 'aa12_auto', name: 'AA-12 "AUTO"', weaponClass: 'shotgun',
  col: '#FF4422', tag: 'FULL AUTO', unlockLevel: 14,
  description: 'Fully-automatic pellet spray. Destroys cover, armour, and patience.',
  stats: { damage: 12, fireRate: 25, accuracy: 35, range: 20, mobility: 75, control: 35, handling: 48 },
  magazine: 8, reserve: 24,
  recoilPattern: rp([0,-4],[0,-5],[0,-6],[0,-6]),
  ammoTypes: ['standard','incendiary'],
  uniqueAttachment: { id: 'auto_breach', name: 'Auto Breach', slot: 'underbarrel',
    desc: '+50% damage vs cover. Bullets penetrate thin walls.',
    modifiers: {}, unlockLevel: 28, special: 'breach_penetrate',
    pros: ['+Structure Damage','Wall Penetration'], cons: [] },
};

const ORIGIN_HAMMER = {
  id: 'origin_hammer', name: 'ORIGIN "HAMMER"', weaponClass: 'shotgun',
  col: '#FF8800', tag: 'DOUBLE BARREL', unlockLevel: 19,
  description: 'Two barrels, two deaths. Fan-the-hammer mode: double damage, triple recoil.',
  stats: { damage: 25, fireRate: 17, accuracy: 45, range: 22, mobility: 85, control: 45, handling: 62 },
  magazine: 2, reserve: 18,
  recoilPattern: rp([0,-8]),
  ammoTypes: ['standard','explosive','overpressure'],
  uniqueAttachment: { id: 'hammer_fan', name: 'Hammer Fan Grip', slot: 'rearGrip',
    desc: 'Fan the hammer: both barrels in 0.1s. -30% accuracy.',
    modifiers: { accuracy: -30 }, unlockLevel: 30, special: 'double_fire',
    pros: ['Double Barrels Simultaneous'], cons: ['-Accuracy'] },
};

const R90_DRAGON = {
  id: 'r90_dragon', name: 'R9-0 "DRAGON"', weaponClass: 'shotgun',
  col: '#FF2200', tag: "DRAGON'S BREATH", unlockLevel: 28,
  description: 'Integrated incendiary loads. Fire trails from every pellet. Digital flame burns circuits.',
  stats: { damage: 18, fireRate: 10, accuracy: 38, range: 24, mobility: 82, control: 55, handling: 58 },
  magazine: 6, reserve: 18,
  recoilPattern: rp([0,-6],[0,-6]),
  ammoTypes: ['incendiary','standard'],
  uniqueAttachment: { id: 'dragon_scale', name: 'Dragon Scale Barrel', slot: 'barrel',
    desc: '+30% DoT duration, +10% range, -10% control.',
    modifiers: { range: 10, control: -10 }, unlockLevel: 35, special: 'dot_ext',
    pros: ['+DoT Duration','+Range'], cons: ['-Control'] },
};

// ── LMGs ─────────────────────────────────────────────────────────────────────

const M249_SAW = {
  id: 'm249_saw', name: 'M249 "SAW"', weaponClass: 'lmg',
  col: '#FFAA00', tag: 'BELT FED', unlockLevel: 10,
  description: '100-round belt. Mobile suppressive fire platform.',
  stats: { damage: 28, fireRate: 54, accuracy: 55, range: 70, mobility: 60, control: 60, handling: 35 },
  magazine: 100, reserve: 100,
  recoilPattern: rp([0,-2],[0.5,-2.5],[1,-2],[1.5,-2.5],[2,-2],[1.5,-2.5],[1,-2]),
  ammoTypes: ['standard','ap','incendiary','overpressure'],
  uniqueAttachment: { id: 'saw_bipod', name: 'SAW Bipod', slot: 'underbarrel',
    desc: 'On cover/prone: +50% control, -50% ADS. Immobile.',
    modifiers: { control: 25, handling: -25 }, unlockLevel: 20, special: 'bipod_prone',
    pros: ['+Control When Stationary'], cons: ['-ADS When Active'] },
};

const PKM_TITAN = {
  id: 'pkm_titan', name: 'PKM "TITAN"', weaponClass: 'lmg',
  col: '#FF4400', tag: 'HEAVY', unlockLevel: 24,
  description: 'Walking tank. Maximum damage output, minimal speed.',
  stats: { damage: 38, fireRate: 42, accuracy: 60, range: 80, mobility: 50, control: 50, handling: 28 },
  magazine: 80, reserve: 80,
  recoilPattern: rp([0,-3],[0.5,-3.5],[1,-3],[0.5,-3.5],[1,-3]),
  ammoTypes: ['standard','ap','explosive','overpressure'],
  uniqueAttachment: { id: 'titan_brake', name: 'Titan Brake', slot: 'muzzle',
    desc: '-40% vertical recoil, +20% stability, -10% ADS.',
    modifiers: { control: 20, accuracy: 12, handling: -10 }, unlockLevel: 35,
    pros: ['-Vertical Recoil','+Stability'], cons: ['-ADS'] },
};

const HOLGER_DEFENDER = {
  id: 'holger_defender', name: 'HOLGER "DEFENDER"', weaponClass: 'lmg',
  col: '#00CCFF', tag: 'MOBILE LMG', unlockLevel: 30,
  description: 'LMG with AR handling. The perfect compromise between firepower and manoeuvre.',
  stats: { damage: 26, fireRate: 58, accuracy: 62, range: 65, mobility: 75, control: 65, handling: 52 },
  magazine: 60, reserve: 120,
  recoilPattern: rp([0,-2],[0,-2.5],[0.5,-2.5],[1,-3],[1,-3]),
  ammoTypes: ['standard','ap','subsonic'],
  uniqueAttachment: { id: 'defender_hybrid', name: 'Defender Hybrid Stock', slot: 'stock',
    desc: '+20% mobility, +15% ADS, -20 magazine rounds.',
    modifiers: { mobility: 20, handling: 15 }, unlockLevel: 38, special: 'reduced_mag',
    pros: ['+Mobility','+ADS'], cons: ['-Magazine Capacity'] },
};

// ── SNIPER RIFLES ─────────────────────────────────────────────────────────────

const HDR_VOID = {
  id: 'hdr_void', name: 'HDR "VOID"', weaponClass: 'sniper',
  col: '#6600FF', tag: 'BOLT ONE-SHOT', unlockLevel: 16,
  description: 'Bolt-action cosmic sniper. One shot. One kill. The universe bends around this barrel.',
  stats: { damage: 95, fireRate: 4, accuracy: 95, range: 95, mobility: 45, control: 40, handling: 22 },
  magazine: 5, reserve: 15,
  recoilPattern: rp([0,-15]),
  ammoTypes: ['standard','ap','explosive'],
  uniqueAttachment: { id: 'void_silence', name: 'Void Silence', slot: 'muzzle',
    desc: 'Bolt suppressor. No damage penalty. -10% ADS.',
    modifiers: { handling: -10 }, unlockLevel: 35, special: 'stealth',
    pros: ['No Damage Penalty','Sound Suppression'], cons: ['-ADS'] },
};

const AX50_REAPER = {
  id: 'ax50_reaper', name: 'AX-50 "REAPER"', weaponClass: 'sniper',
  col: '#FF0044', tag: 'SEMI SNIPER', unlockLevel: 26,
  description: 'Semi-automatic follow-up sniper. For those who never miss twice.',
  stats: { damage: 72, fireRate: 10, accuracy: 88, range: 90, mobility: 50, control: 55, handling: 28 },
  magazine: 10, reserve: 20,
  recoilPattern: rp([0,-8],[0,-8]),
  ammoTypes: ['standard','ap','incendiary'],
  uniqueAttachment: { id: 'reaper_scope', name: 'Reaper Rangefinder', slot: 'optic',
    desc: '12× with rangefinder HUD. Shows distance and bullet drop.',
    modifiers: { accuracy: 8, handling: -5 }, unlockLevel: 38, zoom: 12, special: 'rangefinder',
    pros: ['12× Zoom','Rangefinder HUD'], cons: ['-ADS'] },
};

const DRAGUNOV_SPECTRE = {
  id: 'dragunov_spectre', name: 'DRAGUNOV "SPECTRE"', weaponClass: 'sniper',
  col: '#4488FF', tag: 'AUTO SNIPER', unlockLevel: 32,
  description: 'Semi-auto sniper spam. Moderate damage, elevated rate of fire.',
  stats: { damage: 55, fireRate: 15, accuracy: 82, range: 85, mobility: 55, control: 50, handling: 32 },
  magazine: 15, reserve: 30,
  recoilPattern: rp([0,-4],[0,-5],[0,-6],[0,-7]),
  ammoTypes: ['standard','ap','shock'],
  uniqueAttachment: { id: 'spectre_stab', name: 'Spectre Stabilizer', slot: 'underbarrel',
    desc: '-30% recoil, -10% ADS.',
    modifiers: { control: 20, handling: -10 }, unlockLevel: 40,
    pros: ['-Recoil'], cons: ['-ADS'] },
};

// ── MARKSMAN RIFLES ───────────────────────────────────────────────────────────

const KAR98K_IRON = {
  id: 'kar98k_iron', name: 'KAR98K "IRON"', weaponClass: 'marksman',
  col: '#FFAA44', tag: 'LEVER ACTION', unlockLevel: 11,
  description: 'Lever-action precision with bolt speed. Nostalgic execution engine.',
  stats: { damage: 75, fireRate: 5, accuracy: 85, range: 70, mobility: 70, control: 60, handling: 58 },
  magazine: 6, reserve: 18,
  recoilPattern: rp([0,-8]),
  ammoTypes: ['standard','hollow_point','ap'],
  uniqueAttachment: { id: 'iron_lever', name: 'Iron Lever', slot: 'rearGrip',
    desc: '+25% fire rate (faster lever), -10% control.',
    modifiers: { fireRate: 25, control: -10 }, unlockLevel: 28,
    pros: ['+Fire Rate'], cons: ['-Control'] },
};

const SKS_DATA = {
  id: 'sks_data', name: 'SKS "DATA"', weaponClass: 'marksman',
  col: '#00FF88', tag: 'SEMI MARKSMAN', unlockLevel: 21,
  description: '20-round semi-auto versatility. Precision and volume in one package.',
  stats: { damage: 48, fireRate: 25, accuracy: 78, range: 65, mobility: 75, control: 65, handling: 62 },
  magazine: 20, reserve: 60,
  recoilPattern: rp([0,-3],[0,-3.2],[0.2,-3.4]),
  ammoTypes: ['standard','ap','hollow_point','smart_link'],
  uniqueAttachment: { id: 'data_link', name: 'Data Link Scope', slot: 'optic',
    desc: 'Built-in 3.5×. Marks hit enemies for 1.5s.',
    modifiers: { accuracy: 10, handling: -8 }, unlockLevel: 32, zoom: 3.5, special: 'mark_on_hit',
    pros: ['3.5× Zoom','Mark on Hit'], cons: ['-ADS'] },
};

const CROSSBOW_HARPOON = {
  id: 'crossbow_harpoon', name: 'CROSSBOW "HARPOON"', weaponClass: 'marksman',
  col: '#FFFF44', tag: 'PROJECTILE', unlockLevel: 27,
  description: 'Silent bolt launcher with explosive options. Gravitational arc. The punisher.',
  stats: { damage: 120, fireRate: 2, accuracy: 90, range: 60, mobility: 80, control: 80, handling: 65 },
  magazine: 1, reserve: 9,
  recoilPattern: rp([0,0]),
  ammoTypes: ['standard','explosive','cryo','shock'],
  uniqueAttachment: { id: 'harpoon_reel', name: 'Harpoon Reel', slot: 'underbarrel',
    desc: 'Hit enemy slowed 50% for 2s (digital cable).',
    modifiers: {}, unlockLevel: 35, special: 'harpoon_slow',
    pros: ['Enemy Slow on Hit'], cons: [] },
};

// ── PISTOLS ───────────────────────────────────────────────────────────────────

const M19_SIDEKICK = {
  id: 'm19_sidekick', name: 'M19 "SIDEKICK"', weaponClass: 'pistol',
  col: '#AAAAFF', tag: 'STANDARD', unlockLevel: 0,
  description: 'Military-standard secondary. Dependable in any situation.',
  stats: { damage: 28, fireRate: 33, accuracy: 65, range: 30, mobility: 100, control: 70, handling: 92 },
  magazine: 15, reserve: 45,
  recoilPattern: rp([0,-2],[0.5,-2.5]),
  ammoTypes: ['standard','hollow_point','subsonic'],
  uniqueAttachment: { id: 'sidekick_auto', name: 'Sidekick Auto Trigger', slot: 'weaponPerk',
    desc: 'Full-auto mode. +RPM, -damage -control.',
    modifiers: { fireRate: 17, damage: -4, control: -20 }, unlockLevel: 25, special: 'full_auto_switch',
    pros: ['Full-Auto Mode','+RPM'], cons: ['-Damage','-Control'] },
};

const GS50_HANDCANNON = {
  id: 'gs50_handcannon', name: '.50 GS "HANDCANNON"', weaponClass: 'pistol',
  col: '#FF6600', tag: 'HEAVY PISTOL', unlockLevel: 13,
  description: 'Two shots, two corpses. Recoil like a horse kick.',
  stats: { damage: 62, fireRate: 12, accuracy: 55, range: 35, mobility: 90, control: 40, handling: 78 },
  magazine: 7, reserve: 21,
  recoilPattern: rp([0,-10],[0,-10]),
  ammoTypes: ['standard','ap','hollow_point','overpressure'],
  uniqueAttachment: { id: 'cannon_brake', name: 'Handcannon Brake', slot: 'muzzle',
    desc: '-30% recoil, +10% range. Massive flash.',
    modifiers: { control: 20, range: 10 }, unlockLevel: 25,
    pros: ['-Recoil','+Range'], cons: ['Large Flash'] },
};

const RENETTI_BURST = {
  id: 'renetti_burst', name: 'RENETTI "BURST"', weaponClass: 'pistol',
  col: '#FF88CC', tag: 'BURST PISTOL', unlockLevel: 17,
  description: '3-round burst secondary with surgical precision.',
  stats: { damage: 25, fireRate: 75, accuracy: 72, range: 28, mobility: 95, control: 65, handling: 94 },
  magazine: 15, reserve: 45,
  recoilPattern: rp([0,-1],[0,-2],[0,-3]),
  ammoTypes: ['standard','hollow_point','cryo'],
  uniqueAttachment: { id: 'renetti_full', name: 'Full-Auto Conversion', slot: 'weaponPerk',
    desc: 'Becomes full-auto. +15 magazine. -10% damage.',
    modifiers: { damage: -2, fireRate: 25 }, unlockLevel: 30, special: 'full_auto_switch',
    pros: ['Full-Auto Mode','+Mag Capacity'], cons: ['-Damage'] },
};

const SYKOV_AUTO = {
  id: 'sykov_auto', name: 'SYKOV "AUTO"', weaponClass: 'pistol',
  col: '#FF4488', tag: 'FULL AUTO', unlockLevel: 23,
  description: 'Pocket SMG. Insane fire rate, massive spread. Pocket-sized destruction.',
  stats: { damage: 22, fireRate: 75, accuracy: 50, range: 25, mobility: 98, control: 45, handling: 96 },
  magazine: 20, reserve: 60,
  recoilPattern: rp([0,-1],[0.5,-1.5],[-0.5,-2],[1,-2.5],[-1,-2]),
  ammoTypes: ['standard','subsonic','incendiary'],
  uniqueAttachment: { id: 'sykov_drum', name: 'Sykov Drum', slot: 'magazine',
    desc: '80-round drum. -15% mobility, -10% ADS.',
    modifiers: { mobility: -15, handling: -10 }, unlockLevel: 32, special: 'mag_x4',
    pros: ['80-Round Capacity'], cons: ['-Mobility','-ADS'] },
};

// ── SPECIAL ───────────────────────────────────────────────────────────────────

const RPG7_BOOM = {
  id: 'rpg7_boom', name: 'RPG-7 "BOOM"', weaponClass: 'launcher',
  col: '#FF4400', tag: 'LAUNCHER', unlockLevel: 20,
  description: 'Direct hit or proximity detonation. Destroys groups, cover, and momentum.',
  stats: { damage: 150, fireRate: 1, accuracy: 70, range: 70, mobility: 70, control: 80, handling: 32 },
  magazine: 1, reserve: 2,
  recoilPattern: rp([0,-20]),
  ammoTypes: ['standard'],
  uniqueAttachment: { id: 'boom_prox', name: 'Proximity Trigger', slot: 'weaponPerk',
    desc: 'Auto-detonates within 50px of enemies. -30% damage.',
    modifiers: { damage: -45 }, unlockLevel: 35, special: 'proximity_det',
    pros: ['Auto Detonation'], cons: ['-Damage'] },
};

const COMBATBOW_CYBER = {
  id: 'combatbow_cyber', name: 'COMBAT BOW "CYBER"', weaponClass: 'bow',
  col: '#00FF88', tag: 'CHARGE BOW', unlockLevel: 29,
  description: 'Silent, lethal, versatile. Electric arrows fry enemy circuits. Charge for full power.',
  stats: { damage: 100, fireRate: 5, accuracy: 90, range: 65, mobility: 85, control: 80, handling: 58 },
  magazine: 1, reserve: 9,
  recoilPattern: rp([0,0]),
  ammoTypes: ['standard','explosive','cryo','shock'],
  uniqueAttachment: { id: 'cyber_overcharge', name: 'Cyber Overcharge', slot: 'weaponPerk',
    desc: 'Max charge penetrates 2 enemies. +50% range.',
    modifiers: { range: 30 }, unlockLevel: 38, special: 'overcharge_pierce',
    pros: ['Penetrate 2 Enemies','+Range on Max Charge'], cons: [] },
};

const SHIELD_AEGIS = {
  id: 'shield_aegis', name: 'SHIELD "AEGIS"', weaponClass: 'special',
  col: '#4488FF', tag: 'BALLISTIC SHIELD', unlockLevel: 35,
  description: 'Full-cover ballistic shield with integrated taser. Walk toward victory.',
  stats: { damage: 50, fireRate: 8, accuracy: 100, range: 10, mobility: 60, control: 100, handling: 50 },
  magazine: 1, reserve: 1,
  recoilPattern: rp([0,0]),
  ammoTypes: ['standard'],
  uniqueAttachment: { id: 'aegis_flash', name: 'Aegis Flash Panel', slot: 'weaponPerk',
    desc: 'Front-integrated flashbang. 15s cooldown.',
    modifiers: {}, unlockLevel: 40, special: 'shield_flash',
    pros: ['Integrated Flashbang'], cons: [] },
};

// ── Catalog Map ───────────────────────────────────────────────────────────────

export const WEAPON_CATALOG_DATA = [
  K_AR_OBLIVION, M4C_NEON, AKX_CORRUPTOR, CR56_AXIOM, FFAL_GHOSTWIRE,
  MP5K_VIPER, UZIM_SPRAY, P90X_VECTOR, MP7_SILENCER, STRIKER_THUNDER,
  M870_JUDGE, AA12_AUTO, ORIGIN_HAMMER, R90_DRAGON,
  M249_SAW, PKM_TITAN, HOLGER_DEFENDER,
  HDR_VOID, AX50_REAPER, DRAGUNOV_SPECTRE,
  KAR98K_IRON, SKS_DATA, CROSSBOW_HARPOON,
  M19_SIDEKICK, GS50_HANDCANNON, RENETTI_BURST, SYKOV_AUTO,
  RPG7_BOOM, COMBATBOW_CYBER, SHIELD_AEGIS,
];

export const WEAPON_CATALOG_BY_ID = Object.fromEntries(WEAPON_CATALOG_DATA.map(d => [d.id, d]));

export function createWeapon(id) {
  const def = WEAPON_CATALOG_BY_ID[id];
  if (!def) { console.warn('Unknown weapon:', id); return null; }
  return new WeaponBase(def);
}

export function getCatalogByClass(cls) {
  return WEAPON_CATALOG_DATA.filter(d => d.weaponClass === cls);
}

export const WEAPON_CLASSES = ['assault','smg','shotgun','lmg','sniper','marksman','pistol','launcher','bow','special'];
export const CLASS_LABELS = {
  assault: 'ASSAULT RIFLES', smg: 'SMGs', shotgun: 'SHOTGUNS', lmg: 'LMGs',
  sniper: 'SNIPER RIFLES', marksman: 'MARKSMAN', pistol: 'PISTOLS',
  launcher: 'LAUNCHERS', bow: 'SPECIALS', special: 'SPECIALS',
};

// TTK helper (ms) at given distance
export function calcTTK(def, enemyHp = 100, meters = 10) {
  const hp   = enemyHp;
  const rpm  = 60 + def.stats.fireRate * 11.4;
  const dmg  = def.stats.damage;
  const rng  = def.stats.range;
  const eff  = rng * 0.55;
  const mult = meters <= eff ? 1 : Math.max(0.25, 1 - (meters - eff) / (eff * 2.5));
  const dps  = (dmg * mult) * (rpm / 60);
  return Math.round((hp / dps) * 1000);
}

// DPS helper
export function calcDPS(def) {
  const rpm = 60 + def.stats.fireRate * 11.4;
  return ((def.stats.damage * rpm) / 60).toFixed(1);
}
