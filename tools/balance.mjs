// Balance sanity check for the 0.1.0 idle game.
//
// Two rules learned the hard way in v1 and v2 of this script:
//
//  1. Cost growth must outpace the income growth an upgrade buys, or
//     time-to-next collapses to zero and the game is over in an hour.
//  2. Deeper zones need a HIGHER gold-per-HP ratio, or armor makes them
//     strictly worse than shallow zones and nobody ever moves.

const ATK_GROWTH = 1.1;
const ATK_COST = 1.25;
const LOOT_GROWTH = 1.1;
const LOOT_COST = 1.25;

const ZONES = [
  { name: 'Zone 1', hp: 10, armor: 0, gold: 1 },      // gold/hp = 0.1
  { name: 'Zone 2', hp: 400, armor: 25, gold: 120 },  // gold/hp = 0.3
  { name: 'Zone 3', hp: 20000, armor: 600, gold: 20000 }, // gold/hp = 1.0
];

const attackOf = (A) => Math.pow(ATK_GROWTH, A);
const lootOf = (L) => Math.pow(LOOT_GROWTH, L);
const costAttack = (A) => 10 * Math.pow(ATK_COST, A);
const costLoot = (L) => 100 * Math.pow(LOOT_COST, L);

function income(zone, A, L) {
  const dps = Math.max(attackOf(A) - zone.armor, 0);
  return (zone.gold * lootOf(L) * dps) / zone.hp;
}
function bestZone(A, L) {
  let best = null, bestRate = 0;
  for (const z of ZONES) {
    const r = income(z, A, L);
    if (r > bestRate) { bestRate = r; best = z; }
  }
  return { zone: best, rate: bestRate };
}
const fmt = (s) => {
  if (!Number.isFinite(s)) return 'inf';
  if (s < 90) return `${s.toFixed(0)}s`;
  if (s < 5400) return `${(s / 60).toFixed(1)}m`;
  if (s < 86400 * 3) return `${(s / 3600).toFixed(1)}h`;
  return `${(s / 86400).toFixed(1)}d`;
};

console.log('=== Zone crossovers (which zone is optimal at each attack level) ===');
let prev = null;
for (let A = 0; A <= 140; A++) {
  const { zone, rate } = bestZone(A, 0);
  const name = zone ? zone.name : 'none';
  if (name !== prev) {
    console.log(
      `  attackLevel=${String(A).padStart(3)}  attack=${attackOf(A).toFixed(0).padStart(6)}` +
      `  -> ${name}  (${rate.toFixed(2)} gold/s)`);
    prev = name;
  }
}

console.log('\n=== Simulated playthrough ===');
let A = 0, L = 0, t = 0;
const milestones = new Map();
const waits = [];

for (let step = 0; step < 200; step++) {
  const { zone, rate } = bestZone(A, L);
  if (!zone || rate <= 0) { console.log('  stalled'); break; }
  if (!milestones.has(zone.name)) milestones.set(zone.name, { t, A, L });

  const cA = costAttack(A), cL = costLoot(L);
  const gainA = bestZone(A + 1, L).rate - rate;
  const gainL = bestZone(A, L + 1).rate - rate;
  const buyAttack = gainA / cA >= gainL / cL;
  const cost = buyAttack ? cA : cL;
  const wait = cost / rate;

  t += wait; waits.push(wait);
  if (buyAttack) A++; else L++;

  if (step % 15 === 0) {
    const dps = Math.max(attackOf(A) - zone.armor, 0);
    console.log(
      `  #${String(step).padStart(3)} t=${fmt(t).padStart(7)}  ` +
      `atk=${attackOf(A).toFixed(0).padStart(7)} loot=x${lootOf(L).toFixed(1).padStart(7)}  ` +
      `${zone.name}  ${rate.toFixed(1).padStart(10)} g/s  ` +
      `kill=${(zone.hp / Math.max(dps, 0.001)).toFixed(1)}s  next=${fmt(wait)}`);
  }
}

console.log('\n=== First arrival at each zone ===');
for (const [name, m] of milestones)
  console.log(`  ${name.padEnd(7)} at ${fmt(m.t).padStart(7)}  (attack ${attackOf(m.A).toFixed(0)})`);

console.log('\n=== Time-to-next-upgrade (the real currency) ===');
const bucket = (f, to) => {
  const s = waits.slice(f, to).filter(Number.isFinite);
  return s.length ? fmt(s.reduce((a, b) => a + b, 0) / s.length) : 'n/a';
};
for (const [f, to] of [[0,10],[10,30],[30,60],[60,100],[100,150],[150,200]])
  console.log(`  upgrades ${String(f+1).padStart(3)}-${String(to).padStart(3)} : avg ${bucket(f, to)}`);

console.log('\n=== Offline check: gold earned over a 12h capped absence ===');
for (const [label, a, l] of [['early', 20, 5], ['mid', 45, 20], ['late', 75, 40]]) {
  const { zone, rate } = bestZone(a, l);
  console.log(`  ${label.padEnd(5)} (A=${a},L=${l}) in ${zone.name}: ` +
    `${rate.toFixed(1)} g/s -> ${(rate * 43200).toExponential(2)} gold in 12h`);
}
