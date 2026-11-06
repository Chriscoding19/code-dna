import { DNAData, getLanguageColor } from './github';

export type Base = 'A' | 'T' | 'C' | 'G';

export interface DNABase {
  base: Base;
  color: string;
  language?: string;
  intensity: number; // 0-1
  label?: string;
}

export interface DNASequence {
  bases: DNABase[];
  length: number;
  dominantLanguage: string;
  summary: string;
}

const BASES: Base[] = ['A', 'T', 'C', 'G'];

// Map languages to preferred bases for visual consistency
const LANG_TO_BASE: Record<string, Base> = {
  TypeScript: 'A',
  JavaScript: 'T',
  Python: 'C',
  Rust: 'G',
  Go: 'A',
  Java: 'T',
  'C++': 'C',
  C: 'G',
  Ruby: 'A',
  PHP: 'T',
  HTML: 'C',
  CSS: 'G',
  Shell: 'A',
  Vue: 'T',
  Svelte: 'C',
};

export function generateDNASequence(data: DNAData, length = 120): DNASequence {
  const bases: DNABase[] = [];
  const langs = Object.entries(data.languages).sort((a, b) => b[1] - a[1]);
  const dominantLanguage = langs[0]?.[0] || 'Unknown';

  // Build weighted language list for sampling
  const weightedLangs: string[] = [];
  for (const [lang, pct] of langs) {
    const count = Math.max(1, Math.round(pct / 2));
    for (let i = 0; i < count; i++) weightedLangs.push(lang);
  }
  if (weightedLangs.length === 0) weightedLangs.push('Unknown');

  // Activity intensity over the sequence (simulate from rhythm + commits)
  const intensityWave = data.activityRhythm.map((h) => Math.min(1, h / 10));

  for (let i = 0; i < length; i++) {
    const lang = weightedLangs[i % weightedLangs.length];
    const preferred = LANG_TO_BASE[lang] || BASES[i % 4];
    // Occasionally mutate for visual interest
    const base = Math.random() > 0.85 ? BASES[Math.floor(Math.random() * 4)] : preferred;

    const intensity =
      intensityWave[i % 24] * 0.6 +
      (data.nightOwlScore > 0.4 && (i % 24 > 20 || i % 24 < 5) ? 0.4 : 0.2) +
      Math.random() * 0.2;

    bases.push({
      base,
      color: getLanguageColor(lang),
      language: lang,
      intensity: Math.min(1, intensity),
      label: i % 12 === 0 ? lang : undefined,
    });
  }

  // Generate summary
  const nightDesc =
    data.nightOwlScore > 0.55
      ? 'strong nocturnal coding patterns'
      : data.nightOwlScore > 0.35
      ? 'mixed day/night activity'
      : 'primarily daytime contributor';

  const polyDesc =
    data.polyglotScore > 0.7
      ? 'highly polyglot'
      : data.polyglotScore > 0.4
      ? 'multi-language'
      : 'focused specialist';

  const summary = `${data.profile.login}'s genome shows ${polyDesc} traits with ${nightDesc}. Dominant code base: ${dominantLanguage}. Sequence length reflects ${data.profile.public_repos} public repositories.`;

  return {
    bases,
    length,
    dominantLanguage,
    summary,
  };
}

export function getComplement(base: Base): Base {
  const map: Record<Base, Base> = { A: 'T', T: 'A', C: 'G', G: 'C' };
  return map[base];
}
