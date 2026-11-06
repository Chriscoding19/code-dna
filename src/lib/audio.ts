import * as Tone from 'tone';
import { DNASequence } from './dna';
import { DNAData } from './github';

let synth: Tone.PolySynth | null = null;
let isPlaying = false;

export async function initAudio() {
  await Tone.start();
  if (!synth) {
    synth = new Tone.PolySynth(Tone.Synth, {
      oscillator: { type: 'sine' },
      envelope: { attack: 0.02, decay: 0.3, sustain: 0.2, release: 1.2 },
    }).toDestination();
    synth.volume.value = -12;
  }
}

export function stopAudio() {
  if (synth) {
    synth.releaseAll();
  }
  isPlaying = false;
}

export async function playGenome(
  sequence: DNASequence,
  data: DNAData,
  onProgress?: (pct: number) => void
) {
  await initAudio();
  stopAudio();
  isPlaying = true;

  // Map bases to notes
  const baseNotes: Record<string, string> = {
    A: 'C4',
    T: 'E4',
    C: 'G4',
    G: 'B4',
  };

  // Scale based on dominant language / night owl for mood
  const isNight = data.nightOwlScore > 0.45;
  const root = isNight ? 'A3' : 'C4';
  const scale = isNight
    ? ['A3', 'C4', 'E4', 'G4', 'B4']
    : ['C4', 'D4', 'E4', 'G4', 'A4'];

  const now = Tone.now();
  const noteDuration = 0.18;
  const total = Math.min(sequence.bases.length, 64); // keep short

  for (let i = 0; i < total; i++) {
    if (!isPlaying) break;

    const b = sequence.bases[i];
    const note = baseNotes[b.base] || scale[i % scale.length];
    const velocity = 0.3 + b.intensity * 0.5;
    const time = now + i * noteDuration;

    synth?.triggerAttackRelease(note, noteDuration * 0.9, time, velocity);

    // Occasional chord for high intensity
    if (b.intensity > 0.7 && i % 4 === 0) {
      const chordNote = scale[(i + 2) % scale.length];
      synth?.triggerAttackRelease(chordNote, noteDuration * 1.5, time, velocity * 0.6);
    }

    onProgress?.(i / total);
  }

  // Final resolve
  setTimeout(() => {
    if (isPlaying) {
      synth?.triggerAttackRelease(isNight ? ['A3', 'E4'] : ['C4', 'G4'], 1.5, Tone.now(), 0.4);
    }
    isPlaying = false;
    onProgress?.(1);
  }, total * noteDuration * 1000 + 200);
}

export function isAudioPlaying() {
  return isPlaying;
}
