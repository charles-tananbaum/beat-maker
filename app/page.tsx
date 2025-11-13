'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

type Instrument = 'kick' | 'snare' | 'hihat' | 'openhat' | 'crash' | 'ride' | 'tom' | 'clap' | 'perc' | 'shaker' | 'bass' | 'synth' | 'pad' | 'lead' | 'pluck' | 'bell' | 'fx';
type BeatPattern = boolean[];
type MelodyPattern = boolean[];
type BeatData = {
  patterns: Record<Instrument, BeatPattern>;
  melody: MelodyPattern[];
  bpm: number;
};

const BEATS_PER_MEASURE = 8;
const MIN_BPM = 60;
const MAX_BPM = 180;
const DEFAULT_BPM = 120;

// Expanded melody notes
const MELODY_NOTES = ['C3', 'D3', 'E3', 'G3', 'A3', 'C4', 'D4', 'E4', 'G4', 'A4'];

// Theme configurations for different genres
type Theme = {
  name: string;
  bgGradient: string;
  cardBg: string;
  borderColor: string;
  textColor: string;
  accentColor: string;
  buttonGradient: string;
};

const themes: Record<string, Theme> = {
  'hip hop': {
    name: 'Hip Hop',
    bgGradient: 'from-slate-900 via-red-900 to-slate-900',
    cardBg: 'bg-slate-800/90',
    borderColor: 'border-red-500/30',
    textColor: 'text-red-300',
    accentColor: 'text-red-400',
    buttonGradient: 'from-red-500 to-orange-500',
  },
  'trap': {
    name: 'Trap',
    bgGradient: 'from-slate-900 via-purple-900 to-slate-900',
    cardBg: 'bg-slate-800/90',
    borderColor: 'border-purple-500/30',
    textColor: 'text-purple-300',
    accentColor: 'text-purple-400',
    buttonGradient: 'from-purple-500 to-pink-500',
  },
  'house': {
    name: 'House',
    bgGradient: 'from-blue-900 via-cyan-900 to-blue-900',
    cardBg: 'bg-blue-800/90',
    borderColor: 'border-cyan-500/30',
    textColor: 'text-cyan-300',
    accentColor: 'text-cyan-400',
    buttonGradient: 'from-cyan-500 to-blue-500',
  },
  'edm': {
    name: 'EDM',
    bgGradient: 'from-indigo-900 via-purple-900 to-pink-900',
    cardBg: 'bg-indigo-800/90',
    borderColor: 'border-pink-500/30',
    textColor: 'text-pink-300',
    accentColor: 'text-pink-400',
    buttonGradient: 'from-indigo-500 to-purple-500',
  },
  'rock': {
    name: 'Rock',
    bgGradient: 'from-gray-900 via-orange-900 to-gray-900',
    cardBg: 'bg-gray-800/90',
    borderColor: 'border-orange-500/30',
    textColor: 'text-orange-300',
    accentColor: 'text-orange-400',
    buttonGradient: 'from-orange-500 to-red-500',
  },
  'jazz': {
    name: 'Jazz',
    bgGradient: 'from-amber-900 via-yellow-900 to-amber-900',
    cardBg: 'bg-amber-800/90',
    borderColor: 'border-yellow-500/30',
    textColor: 'text-yellow-300',
    accentColor: 'text-yellow-400',
    buttonGradient: 'from-amber-500 to-yellow-500',
  },
  'funk': {
    name: 'Funk',
    bgGradient: 'from-green-900 via-emerald-900 to-green-900',
    cardBg: 'bg-green-800/90',
    borderColor: 'border-emerald-500/30',
    textColor: 'text-emerald-300',
    accentColor: 'text-emerald-400',
    buttonGradient: 'from-green-500 to-emerald-500',
  },
  'techno': {
    name: 'Techno',
    bgGradient: 'from-slate-900 via-gray-900 to-black',
    cardBg: 'bg-gray-800/90',
    borderColor: 'border-gray-500/30',
    textColor: 'text-gray-300',
    accentColor: 'text-gray-400',
    buttonGradient: 'from-gray-500 to-slate-500',
  },
  'ambient': {
    name: 'Ambient',
    bgGradient: 'from-teal-900 via-blue-900 to-indigo-900',
    cardBg: 'bg-teal-800/90',
    borderColor: 'border-blue-500/30',
    textColor: 'text-blue-300',
    accentColor: 'text-blue-400',
    buttonGradient: 'from-teal-500 to-blue-500',
  },
  'latin': {
    name: 'Latin',
    bgGradient: 'from-orange-900 via-red-900 to-pink-900',
    cardBg: 'bg-orange-800/90',
    borderColor: 'border-red-500/30',
    textColor: 'text-red-300',
    accentColor: 'text-red-400',
    buttonGradient: 'from-orange-500 to-red-500',
  },
  'reggae': {
    name: 'Reggae',
    bgGradient: 'from-green-900 via-lime-900 to-green-900',
    cardBg: 'bg-green-800/90',
    borderColor: 'border-lime-500/30',
    textColor: 'text-lime-300',
    accentColor: 'text-lime-400',
    buttonGradient: 'from-green-500 to-lime-500',
  },
  'default': {
    name: 'Default',
    bgGradient: 'from-slate-900 via-purple-900 to-slate-900',
    cardBg: 'bg-slate-800/90',
    borderColor: 'border-purple-500/30',
    textColor: 'text-purple-300',
    accentColor: 'text-purple-400',
    buttonGradient: 'from-purple-500 to-pink-500',
  },
};

// Convert note name to frequency
const noteToFrequency = (note: string): number => {
  const A4 = 440;
  const noteNames = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
  const match = note.match(/([A-G]#?)(\d)/);
  if (!match) return A4;
  const [, noteName, octave] = match;
  const noteIndex = noteNames.indexOf(noteName);
  const octaveNum = parseInt(octave);
  const semitonesFromA4 = (octaveNum - 4) * 12 + (noteIndex - 9);
  return A4 * Math.pow(2, semitonesFromA4 / 12);
};

// Detect genre from prompt
const detectGenre = (prompt: string): string => {
  const lowerPrompt = prompt.toLowerCase();
  
  if (lowerPrompt.includes('hip hop') || lowerPrompt.includes('hiphop')) return 'hip hop';
  if (lowerPrompt.includes('trap')) return 'trap';
  if (lowerPrompt.includes('house')) return 'house';
  if (lowerPrompt.includes('edm') || lowerPrompt.includes('electronic')) return 'edm';
  if (lowerPrompt.includes('rock') || lowerPrompt.includes('punk')) return 'rock';
  if (lowerPrompt.includes('jazz')) return 'jazz';
  if (lowerPrompt.includes('funk')) return 'funk';
  if (lowerPrompt.includes('techno') || lowerPrompt.includes('minimal')) return 'techno';
  if (lowerPrompt.includes('ambient') || lowerPrompt.includes('chill')) return 'ambient';
  if (lowerPrompt.includes('latin') || lowerPrompt.includes('salsa') || lowerPrompt.includes('samba')) return 'latin';
  if (lowerPrompt.includes('reggae') || lowerPrompt.includes('dub')) return 'reggae';
  
  return 'default';
};

// Generate comprehensive patterns from prompt
const generateFromPrompt = (prompt: string): {
  patterns: Record<Instrument, BeatPattern>;
  melody: MelodyPattern[];
  bpm: number;
  genre: string;
} => {
  const lowerPrompt = prompt.toLowerCase();
  const genre = detectGenre(prompt);
  
  // Initialize all patterns
  const patterns: Record<Instrument, BeatPattern> = {
    kick: new Array(BEATS_PER_MEASURE).fill(false),
    snare: new Array(BEATS_PER_MEASURE).fill(false),
    hihat: new Array(BEATS_PER_MEASURE).fill(false),
    openhat: new Array(BEATS_PER_MEASURE).fill(false),
    crash: new Array(BEATS_PER_MEASURE).fill(false),
    ride: new Array(BEATS_PER_MEASURE).fill(false),
    tom: new Array(BEATS_PER_MEASURE).fill(false),
    clap: new Array(BEATS_PER_MEASURE).fill(false),
    perc: new Array(BEATS_PER_MEASURE).fill(false),
    shaker: new Array(BEATS_PER_MEASURE).fill(false),
    bass: new Array(BEATS_PER_MEASURE).fill(false),
    synth: new Array(BEATS_PER_MEASURE).fill(false),
    pad: new Array(BEATS_PER_MEASURE).fill(false),
    lead: new Array(BEATS_PER_MEASURE).fill(false),
    pluck: new Array(BEATS_PER_MEASURE).fill(false),
    bell: new Array(BEATS_PER_MEASURE).fill(false),
    fx: new Array(BEATS_PER_MEASURE).fill(false),
  };
  
  let melody: MelodyPattern[] = MELODY_NOTES.map(() => new Array(BEATS_PER_MEASURE).fill(false));
  let bpm = DEFAULT_BPM;

  // Hip Hop
  if (genre === 'hip hop') {
    patterns.kick = [true, false, false, false, true, false, false, false];
    patterns.snare = [false, false, false, false, false, false, true, false];
    patterns.hihat = [true, false, true, false, true, false, true, false];
    patterns.clap = [false, false, false, false, false, false, true, false];
    patterns.bass = [true, false, false, false, true, false, false, false];
    patterns.synth = [true, false, false, true, false, false, true, false];
    melody[5] = [true, false, false, false, true, false, false, false]; // C4
    melody[7] = [false, false, false, false, false, false, true, false]; // E4
    bpm = 140;
  }
  // Trap
  else if (genre === 'trap') {
    patterns.kick = [true, false, false, true, false, false, true, false];
    patterns.snare = [false, false, false, false, false, false, true, false];
    patterns.hihat = [true, false, true, false, true, false, true, false];
    patterns.openhat = [false, false, false, false, false, false, false, true];
    patterns.clap = [false, false, false, false, false, false, true, false];
    patterns.bass = [true, false, false, true, false, false, true, false];
    patterns.synth = [true, false, true, false, false, true, false, false];
    melody[5] = [true, false, false, true, false, false, true, false];
    bpm = 150;
  }
  // House
  else if (genre === 'house') {
    patterns.kick = [true, false, false, false, true, false, false, false];
    patterns.snare = [false, false, false, false, false, false, true, false];
    patterns.hihat = [false, true, false, true, false, true, false, true];
    patterns.openhat = [false, false, false, false, false, false, false, true];
    patterns.bass = [true, false, false, true, true, false, false, true];
    patterns.synth = [true, false, true, false, true, false, true, false];
    patterns.pad = [true, false, false, false, true, false, false, false];
    melody[5] = [true, false, true, false, true, false, true, false];
    melody[7] = [false, true, false, true, false, true, false, true];
    bpm = 128;
  }
  // EDM
  else if (genre === 'edm') {
    patterns.kick = [true, false, false, false, true, false, false, false];
    patterns.snare = [false, false, false, false, false, false, true, false];
    patterns.hihat = [false, true, false, true, false, true, false, true];
    patterns.crash = [true, false, false, false, false, false, false, false];
    patterns.bass = [true, false, false, true, true, false, false, true];
    patterns.synth = [true, false, true, false, true, false, true, false];
    patterns.lead = [false, false, false, false, true, false, false, false];
    patterns.pad = [true, false, false, false, true, false, false, false];
    melody[5] = [true, false, true, false, true, false, true, false];
    melody[6] = [false, true, false, true, false, true, false, true];
    bpm = 128;
  }
  // Rock
  else if (genre === 'rock') {
    patterns.kick = [true, false, false, true, true, false, false, true];
    patterns.snare = [false, false, false, false, false, false, true, false];
    patterns.hihat = [true, false, true, false, true, false, true, false];
    patterns.crash = [true, false, false, false, false, false, false, false];
    patterns.ride = [false, false, false, false, false, false, false, true];
    patterns.tom = [false, false, false, false, false, false, false, true];
    patterns.bass = [true, false, false, true, true, false, false, true];
    melody[5] = [true, false, false, false, true, false, false, false];
    melody[7] = [false, false, false, false, false, false, true, false];
    bpm = 120;
  }
  // Jazz
  else if (genre === 'jazz') {
    patterns.kick = [true, false, false, false, true, false, false, false];
    patterns.snare = [false, false, false, false, false, false, true, false];
    patterns.ride = [true, false, true, false, true, false, true, false];
    patterns.openhat = [false, false, false, true, false, false, false, true];
    patterns.bass = [true, false, false, false, true, false, false, false];
    patterns.pad = [true, false, false, true, false, false, true, false];
    melody[4] = [true, false, false, true, false, false, true, false];
    melody[6] = [false, false, true, false, false, true, false, false];
    melody[8] = [true, false, false, false, true, false, false, false];
    bpm = 110;
  }
  // Funk
  else if (genre === 'funk') {
    patterns.kick = [true, false, false, true, false, false, true, false];
    patterns.snare = [false, false, false, false, false, false, true, false];
    patterns.hihat = [false, true, false, true, false, true, false, true];
    patterns.clap = [false, false, false, false, false, false, true, false];
    patterns.bass = [true, false, true, false, false, true, false, false];
    patterns.pluck = [true, false, true, false, false, true, false, false];
    melody[5] = [true, false, true, false, false, true, false, false];
    melody[7] = [false, true, false, false, true, false, false, true];
    bpm = 100;
  }
  // Techno
  else if (genre === 'techno') {
    patterns.kick = [true, false, false, false, true, false, false, false];
    patterns.hihat = [false, false, true, false, false, false, true, false];
    patterns.openhat = [false, false, false, false, false, false, false, true];
    patterns.bass = [true, false, false, false, true, false, false, false];
    patterns.synth = [false, true, false, true, false, true, false, true];
    patterns.fx = [false, false, false, false, true, false, false, false];
    melody[5] = [false, true, false, true, false, true, false, true];
    bpm = 130;
  }
  // Ambient
  else if (genre === 'ambient') {
    patterns.kick = [true, false, false, false, false, false, false, false];
    patterns.pad = [true, false, false, false, true, false, false, false];
    patterns.bell = [false, false, false, false, false, false, false, true];
    patterns.fx = [false, false, false, true, false, false, false, true];
    melody[4] = [true, false, false, false, true, false, false, false];
    melody[6] = [false, false, false, true, false, false, false, true];
    melody[8] = [true, false, false, false, false, false, false, false];
    bpm = 90;
  }
  // Latin
  else if (genre === 'latin') {
    patterns.kick = [true, false, false, true, false, false, true, false];
    patterns.snare = [false, false, true, false, false, false, true, false];
    patterns.perc = [false, true, false, true, false, true, false, true];
    patterns.shaker = [true, false, true, false, true, false, true, false];
    patterns.openhat = [true, false, false, false, true, false, false, false];
    patterns.bass = [true, false, false, false, true, false, false, false];
    melody[5] = [true, false, false, true, false, false, true, false];
    melody[7] = [false, true, false, false, false, true, false, false];
    bpm = 120;
  }
  // Reggae
  else if (genre === 'reggae') {
    patterns.kick = [true, false, false, false, false, false, true, false];
    patterns.snare = [false, false, false, false, false, false, true, false];
    patterns.hihat = [false, true, false, true, false, true, false, true];
    patterns.perc = [false, false, true, false, false, false, true, false];
    patterns.bass = [true, false, false, false, true, false, false, false];
    patterns.pluck = [true, false, false, true, false, false, true, false];
    melody[5] = [true, false, false, true, false, false, true, false];
    melody[7] = [false, false, false, false, false, false, true, false];
    bpm = 80;
  }
  // Default
  else {
    patterns.kick = [true, false, false, false, true, false, false, false];
    patterns.snare = [false, false, false, false, false, false, true, false];
    patterns.hihat = [false, true, false, true, false, true, false, true];
    patterns.bass = [true, false, false, false, true, false, false, false];
    melody[5] = [true, false, false, false, true, false, false, false];
    melody[7] = [false, false, false, false, false, false, true, false];
    bpm = 120;
  }

  return { patterns, melody, bpm, genre };
};

export default function BeatMaker() {
  const [user, setUser] = useState<any>(null);
  const [currentTheme, setCurrentTheme] = useState<Theme>(themes.default);
  const [patterns, setPatterns] = useState<Record<Instrument, BeatPattern>>({
    kick: new Array(BEATS_PER_MEASURE).fill(false),
    snare: new Array(BEATS_PER_MEASURE).fill(false),
    hihat: new Array(BEATS_PER_MEASURE).fill(false),
    openhat: new Array(BEATS_PER_MEASURE).fill(false),
    crash: new Array(BEATS_PER_MEASURE).fill(false),
    ride: new Array(BEATS_PER_MEASURE).fill(false),
    tom: new Array(BEATS_PER_MEASURE).fill(false),
    clap: new Array(BEATS_PER_MEASURE).fill(false),
    perc: new Array(BEATS_PER_MEASURE).fill(false),
    shaker: new Array(BEATS_PER_MEASURE).fill(false),
    bass: new Array(BEATS_PER_MEASURE).fill(false),
    synth: new Array(BEATS_PER_MEASURE).fill(false),
    pad: new Array(BEATS_PER_MEASURE).fill(false),
    lead: new Array(BEATS_PER_MEASURE).fill(false),
    pluck: new Array(BEATS_PER_MEASURE).fill(false),
    bell: new Array(BEATS_PER_MEASURE).fill(false),
    fx: new Array(BEATS_PER_MEASURE).fill(false),
  });

  const [melody, setMelody] = useState<MelodyPattern[]>(
    MELODY_NOTES.map(() => new Array(BEATS_PER_MEASURE).fill(false))
  );
  
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentBeat, setCurrentBeat] = useState(0);
  const [bpm, setBpm] = useState(DEFAULT_BPM);
  const [prompt, setPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [savedBeats, setSavedBeats] = useState<any[]>([]);
  const [beatName, setBeatName] = useState('');
  
  const audioContextRef = useRef<AudioContext | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const router = useRouter();

  // Check auth
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
    });

    supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });
  }, []);

  // Load saved beats
  useEffect(() => {
    if (user) {
      loadSavedBeats();
    }
  }, [user]);

  const loadSavedBeats = async () => {
    if (!user) return;
    const { data } = await supabase
      .from('beats')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });
    if (data) setSavedBeats(data);
  };

  // Initialize AudioContext
  useEffect(() => {
    audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    return () => {
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
    };
  }, []);

  // Sound generation functions - expanded
  const playKick = useCallback(() => {
    if (!audioContextRef.current) return;
    const ctx = audioContextRef.current;
    const oscillator = ctx.createOscillator();
    const gainNode = ctx.createGain();
    oscillator.connect(gainNode);
    gainNode.connect(ctx.destination);
    oscillator.frequency.setValueAtTime(60, ctx.currentTime);
    oscillator.frequency.exponentialRampToValueAtTime(30, ctx.currentTime + 0.1);
    gainNode.gain.setValueAtTime(1, ctx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3);
    oscillator.start(ctx.currentTime);
    oscillator.stop(ctx.currentTime + 0.3);
  }, []);

  const playSnare = useCallback(() => {
    if (!audioContextRef.current) return;
    const ctx = audioContextRef.current;
    const oscillator = ctx.createOscillator();
    const gainNode1 = ctx.createGain();
    oscillator.type = 'triangle';
    oscillator.frequency.value = 200;
    oscillator.connect(gainNode1);
    gainNode1.connect(ctx.destination);
    gainNode1.gain.setValueAtTime(0.3, ctx.currentTime);
    gainNode1.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.1);
    oscillator.start(ctx.currentTime);
    oscillator.stop(ctx.currentTime + 0.1);
    const bufferSize = ctx.sampleRate * 0.05;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const output = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      output[i] = Math.random() * 2 - 1;
    }
    const whiteNoise = ctx.createBufferSource();
    const bandpass = ctx.createBiquadFilter();
    const gainNode2 = ctx.createGain();
    whiteNoise.buffer = buffer;
    whiteNoise.connect(bandpass);
    bandpass.connect(gainNode2);
    gainNode2.connect(ctx.destination);
    bandpass.type = 'bandpass';
    bandpass.frequency.value = 1000;
    gainNode2.gain.setValueAtTime(0.2, ctx.currentTime);
    gainNode2.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.05);
    whiteNoise.start(ctx.currentTime);
    whiteNoise.stop(ctx.currentTime + 0.05);
  }, []);

  const playHiHat = useCallback(() => {
    if (!audioContextRef.current) return;
    const ctx = audioContextRef.current;
    const bufferSize = ctx.sampleRate * 0.01;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const output = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      output[i] = Math.random() * 2 - 1;
    }
    const whiteNoise = ctx.createBufferSource();
    const bandpass = ctx.createBiquadFilter();
    const gainNode = ctx.createGain();
    whiteNoise.buffer = buffer;
    whiteNoise.connect(bandpass);
    bandpass.connect(gainNode);
    gainNode.connect(ctx.destination);
    bandpass.type = 'bandpass';
    bandpass.frequency.value = 10000;
    gainNode.gain.setValueAtTime(0.3, ctx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.05);
    whiteNoise.start(ctx.currentTime);
    whiteNoise.stop(ctx.currentTime + 0.05);
  }, []);

  const playOpenHat = useCallback(() => {
    if (!audioContextRef.current) return;
    const ctx = audioContextRef.current;
    const bufferSize = ctx.sampleRate * 0.02;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const output = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      output[i] = Math.random() * 2 - 1;
    }
    const whiteNoise = ctx.createBufferSource();
    const highpass = ctx.createBiquadFilter();
    const gainNode = ctx.createGain();
    whiteNoise.buffer = buffer;
    whiteNoise.connect(highpass);
    highpass.connect(gainNode);
    gainNode.connect(ctx.destination);
    highpass.type = 'highpass';
    highpass.frequency.value = 6000;
    gainNode.gain.setValueAtTime(0.25, ctx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.15);
    whiteNoise.start(ctx.currentTime);
    whiteNoise.stop(ctx.currentTime + 0.15);
  }, []);

  const playCrash = useCallback(() => {
    if (!audioContextRef.current) return;
    const ctx = audioContextRef.current;
    const bufferSize = ctx.sampleRate * 0.15;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const output = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      output[i] = Math.random() * 2 - 1;
    }
    const whiteNoise = ctx.createBufferSource();
    const highpass = ctx.createBiquadFilter();
    const gainNode = ctx.createGain();
    whiteNoise.buffer = buffer;
    whiteNoise.connect(highpass);
    highpass.connect(gainNode);
    gainNode.connect(ctx.destination);
    highpass.type = 'highpass';
    highpass.frequency.value = 7000;
    gainNode.gain.setValueAtTime(0.5, ctx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3);
    whiteNoise.start(ctx.currentTime);
    whiteNoise.stop(ctx.currentTime + 0.3);
  }, []);

  const playRide = useCallback(() => {
    if (!audioContextRef.current) return;
    const ctx = audioContextRef.current;
    const bufferSize = ctx.sampleRate * 0.03;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const output = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      output[i] = Math.random() * 2 - 1;
    }
    const whiteNoise = ctx.createBufferSource();
    const bandpass = ctx.createBiquadFilter();
    const gainNode = ctx.createGain();
    whiteNoise.buffer = buffer;
    whiteNoise.connect(bandpass);
    bandpass.connect(gainNode);
    gainNode.connect(ctx.destination);
    bandpass.type = 'bandpass';
    bandpass.frequency.value = 8000;
    gainNode.gain.setValueAtTime(0.2, ctx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.2);
    whiteNoise.start(ctx.currentTime);
    whiteNoise.stop(ctx.currentTime + 0.2);
  }, []);

  const playTom = useCallback(() => {
    if (!audioContextRef.current) return;
    const ctx = audioContextRef.current;
    const oscillator = ctx.createOscillator();
    const gainNode = ctx.createGain();
    oscillator.type = 'sine';
    oscillator.frequency.value = 150;
    oscillator.frequency.exponentialRampToValueAtTime(80, ctx.currentTime + 0.2);
    oscillator.connect(gainNode);
    gainNode.connect(ctx.destination);
    gainNode.gain.setValueAtTime(0.4, ctx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3);
    oscillator.start(ctx.currentTime);
    oscillator.stop(ctx.currentTime + 0.3);
  }, []);

  const playClap = useCallback(() => {
    if (!audioContextRef.current) return;
    const ctx = audioContextRef.current;
    const bufferSize = ctx.sampleRate * 0.02;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const output = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      output[i] = Math.random() * 2 - 1;
    }
    const whiteNoise = ctx.createBufferSource();
    const bandpass = ctx.createBiquadFilter();
    const gainNode = ctx.createGain();
    whiteNoise.buffer = buffer;
    whiteNoise.connect(bandpass);
    bandpass.connect(gainNode);
    gainNode.connect(ctx.destination);
    bandpass.type = 'bandpass';
    bandpass.frequency.value = 2000;
    gainNode.gain.setValueAtTime(0.3, ctx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.1);
    whiteNoise.start(ctx.currentTime);
    whiteNoise.stop(ctx.currentTime + 0.1);
  }, []);

  const playPerc = useCallback(() => {
    if (!audioContextRef.current) return;
    const ctx = audioContextRef.current;
    const oscillator = ctx.createOscillator();
    const gainNode = ctx.createGain();
    oscillator.type = 'square';
    oscillator.frequency.value = 400;
    oscillator.frequency.exponentialRampToValueAtTime(200, ctx.currentTime + 0.1);
    oscillator.connect(gainNode);
    gainNode.connect(ctx.destination);
    gainNode.gain.setValueAtTime(0.3, ctx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.15);
    oscillator.start(ctx.currentTime);
    oscillator.stop(ctx.currentTime + 0.15);
  }, []);

  const playShaker = useCallback(() => {
    if (!audioContextRef.current) return;
    const ctx = audioContextRef.current;
    const bufferSize = ctx.sampleRate * 0.005;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const output = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      output[i] = Math.random() * 2 - 1;
    }
    const whiteNoise = ctx.createBufferSource();
    const bandpass = ctx.createBiquadFilter();
    const gainNode = ctx.createGain();
    whiteNoise.buffer = buffer;
    whiteNoise.connect(bandpass);
    bandpass.connect(gainNode);
    gainNode.connect(ctx.destination);
    bandpass.type = 'bandpass';
    bandpass.frequency.value = 12000;
    gainNode.gain.setValueAtTime(0.2, ctx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.08);
    whiteNoise.start(ctx.currentTime);
    whiteNoise.stop(ctx.currentTime + 0.08);
  }, []);

  const playBass = useCallback(() => {
    if (!audioContextRef.current) return;
    const ctx = audioContextRef.current;
    const oscillator = ctx.createOscillator();
    const gainNode = ctx.createGain();
    oscillator.type = 'sawtooth';
    oscillator.frequency.value = 80;
    oscillator.connect(gainNode);
    gainNode.connect(ctx.destination);
    gainNode.gain.setValueAtTime(0.4, ctx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.2);
    oscillator.start(ctx.currentTime);
    oscillator.stop(ctx.currentTime + 0.2);
  }, []);

  const playSynth = useCallback(() => {
    if (!audioContextRef.current) return;
    const ctx = audioContextRef.current;
    const oscillator = ctx.createOscillator();
    const gainNode = ctx.createGain();
    const filter = ctx.createBiquadFilter();
    oscillator.type = 'square';
    oscillator.frequency.value = 440;
    filter.type = 'lowpass';
    filter.frequency.value = 1500;
    filter.Q.value = 2;
    oscillator.connect(filter);
    filter.connect(gainNode);
    gainNode.connect(ctx.destination);
    gainNode.gain.setValueAtTime(0.3, ctx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.15);
    oscillator.start(ctx.currentTime);
    oscillator.stop(ctx.currentTime + 0.15);
  }, []);

  const playPad = useCallback(() => {
    if (!audioContextRef.current) return;
    const ctx = audioContextRef.current;
    const oscillator = ctx.createOscillator();
    const gainNode = ctx.createGain();
    const filter = ctx.createBiquadFilter();
    oscillator.type = 'sine';
    oscillator.frequency.value = 220;
    filter.type = 'lowpass';
    filter.frequency.value = 800;
    filter.Q.value = 1;
    oscillator.connect(filter);
    filter.connect(gainNode);
    gainNode.connect(ctx.destination);
    gainNode.gain.setValueAtTime(0.2, ctx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.8);
    oscillator.start(ctx.currentTime);
    oscillator.stop(ctx.currentTime + 0.8);
  }, []);

  const playLead = useCallback(() => {
    if (!audioContextRef.current) return;
    const ctx = audioContextRef.current;
    const oscillator = ctx.createOscillator();
    const gainNode = ctx.createGain();
    oscillator.type = 'sawtooth';
    oscillator.frequency.value = 880;
    oscillator.connect(gainNode);
    gainNode.connect(ctx.destination);
    gainNode.gain.setValueAtTime(0.35, ctx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.2);
    oscillator.start(ctx.currentTime);
    oscillator.stop(ctx.currentTime + 0.2);
  }, []);

  const playPluck = useCallback(() => {
    if (!audioContextRef.current) return;
    const ctx = audioContextRef.current;
    const oscillator = ctx.createOscillator();
    const gainNode = ctx.createGain();
    oscillator.type = 'triangle';
    oscillator.frequency.value = 440;
    oscillator.connect(gainNode);
    gainNode.connect(ctx.destination);
    gainNode.gain.setValueAtTime(0.4, ctx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.1);
    oscillator.start(ctx.currentTime);
    oscillator.stop(ctx.currentTime + 0.1);
  }, []);

  const playBell = useCallback(() => {
    if (!audioContextRef.current) return;
    const ctx = audioContextRef.current;
    const oscillator = ctx.createOscillator();
    const gainNode = ctx.createGain();
    oscillator.type = 'sine';
    oscillator.frequency.value = 880;
    oscillator.frequency.setValueAtTime(880, ctx.currentTime);
    oscillator.frequency.setValueAtTime(1320, ctx.currentTime + 0.01);
    oscillator.connect(gainNode);
    gainNode.connect(ctx.destination);
    gainNode.gain.setValueAtTime(0.3, ctx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.5);
    oscillator.start(ctx.currentTime);
    oscillator.stop(ctx.currentTime + 0.5);
  }, []);

  const playFx = useCallback(() => {
    if (!audioContextRef.current) return;
    const ctx = audioContextRef.current;
    const bufferSize = ctx.sampleRate * 0.1;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const output = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      output[i] = Math.random() * 2 - 1;
    }
    const whiteNoise = ctx.createBufferSource();
    const filter = ctx.createBiquadFilter();
    const gainNode = ctx.createGain();
    whiteNoise.buffer = buffer;
    whiteNoise.connect(filter);
    filter.connect(gainNode);
    gainNode.connect(ctx.destination);
    filter.type = 'bandpass';
    filter.frequency.value = 5000;
    filter.Q.value = 5;
    gainNode.gain.setValueAtTime(0.3, ctx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3);
    whiteNoise.start(ctx.currentTime);
    whiteNoise.stop(ctx.currentTime + 0.3);
  }, []);

  const playMelodyNote = useCallback((note: string) => {
    if (!audioContextRef.current) return;
    const ctx = audioContextRef.current;
    const frequency = noteToFrequency(note);
    const oscillator = ctx.createOscillator();
    const gainNode = ctx.createGain();
    const filter = ctx.createBiquadFilter();
    oscillator.type = 'sine';
    oscillator.frequency.value = frequency;
    filter.type = 'lowpass';
    filter.frequency.value = 2000;
    filter.Q.value = 1;
    oscillator.connect(filter);
    filter.connect(gainNode);
    gainNode.connect(ctx.destination);
    const now = ctx.currentTime;
    gainNode.gain.setValueAtTime(0, now);
    gainNode.gain.linearRampToValueAtTime(0.3, now + 0.01);
    gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.5);
    oscillator.start(now);
    oscillator.stop(now + 0.5);
  }, []);

  const playSound = useCallback((instrument: Instrument) => {
    switch (instrument) {
      case 'kick': playKick(); break;
      case 'snare': playSnare(); break;
      case 'hihat': playHiHat(); break;
      case 'openhat': playOpenHat(); break;
      case 'crash': playCrash(); break;
      case 'ride': playRide(); break;
      case 'tom': playTom(); break;
      case 'clap': playClap(); break;
      case 'perc': playPerc(); break;
      case 'shaker': playShaker(); break;
      case 'bass': playBass(); break;
      case 'synth': playSynth(); break;
      case 'pad': playPad(); break;
      case 'lead': playLead(); break;
      case 'pluck': playPluck(); break;
      case 'bell': playBell(); break;
      case 'fx': playFx(); break;
    }
  }, [playKick, playSnare, playHiHat, playOpenHat, playCrash, playRide, playTom, playClap, playPerc, playShaker, playBass, playSynth, playPad, playLead, playPluck, playBell, playFx]);

  // Playback loop
  useEffect(() => {
    if (isPlaying) {
      const beatDuration = (60 / bpm) * 1000 / 4;
      intervalRef.current = setInterval(() => {
        setCurrentBeat((prev) => {
          const nextBeat = (prev + 1) % BEATS_PER_MEASURE;
          
          // Play drums
          (Object.keys(patterns) as Instrument[]).forEach((instrument) => {
            if (patterns[instrument][prev]) {
              playSound(instrument);
            }
          });

          // Play melody
          MELODY_NOTES.forEach((note, noteIndex) => {
            if (melody[noteIndex] && melody[noteIndex][prev]) {
              playMelodyNote(note);
            }
          });

          return nextBeat;
        });
      }, beatDuration);
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      setCurrentBeat(0);
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isPlaying, patterns, playSound, bpm, melody, playMelodyNote]);

  const toggleBeat = (instrument: Instrument, beatIndex: number) => {
    setPatterns((prev) => {
      const newPatterns = { ...prev };
      newPatterns[instrument] = [...prev[instrument]];
      newPatterns[instrument][beatIndex] = !newPatterns[instrument][beatIndex];
      return newPatterns;
    });
  };

  const toggleMelody = (noteIndex: number, beatIndex: number) => {
    setMelody((prev) => {
      const newMelody = [...prev];
      newMelody[noteIndex] = [...prev[noteIndex]];
      newMelody[noteIndex][beatIndex] = !newMelody[noteIndex][beatIndex];
      return newMelody;
    });
  };

  const handlePlay = () => {
    if (audioContextRef.current?.state === 'suspended') {
      audioContextRef.current.resume();
    }
    setIsPlaying(true);
  };

  const handleStop = () => {
    setIsPlaying(false);
    setCurrentBeat(0);
  };

  const handleGenerate = () => {
    if (!prompt.trim()) return;
    setIsGenerating(true);
    
    setTimeout(() => {
      const generated = generateFromPrompt(prompt);
      setPatterns(generated.patterns);
      setMelody(generated.melody);
      setBpm(generated.bpm);
      setCurrentTheme(themes[generated.genre] || themes.default);
      setIsGenerating(false);
      setPrompt('');
    }, 300);
  };

  const clearAll = () => {
    setPatterns(
      Object.keys(patterns).reduce((acc, key) => {
        acc[key as Instrument] = new Array(BEATS_PER_MEASURE).fill(false);
        return acc;
      }, {} as Record<Instrument, BeatPattern>)
    );
    setMelody(MELODY_NOTES.map(() => new Array(BEATS_PER_MEASURE).fill(false)));
    setCurrentTheme(themes.default);
  };

  const saveBeat = async () => {
    if (!user || !beatName.trim()) return;
    
    const beatData: BeatData = {
      patterns,
      melody,
      bpm,
    };

    const { error } = await supabase
      .from('beats')
      .insert({
        user_id: user.id,
        name: beatName,
        data: beatData,
      });

    if (!error) {
      setBeatName('');
      loadSavedBeats();
    }
  };

  const loadBeat = (beat: any) => {
    const data = beat.data as BeatData;
    setPatterns(data.patterns);
    setMelody(data.melody);
    setBpm(data.bpm);
  };

  const deleteBeat = async (id: string) => {
    if (!user) return;
    await supabase.from('beats').delete().eq('id', id).eq('user_id', user.id);
    loadSavedBeats();
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/login');
  };

  const instrumentColors: Record<Instrument, string> = {
    kick: 'bg-red-500',
    snare: 'bg-green-500',
    hihat: 'bg-blue-500',
    openhat: 'bg-cyan-500',
    crash: 'bg-yellow-500',
    ride: 'bg-indigo-500',
    tom: 'bg-orange-500',
    clap: 'bg-pink-500',
    perc: 'bg-purple-500',
    shaker: 'bg-teal-500',
    bass: 'bg-amber-500',
    synth: 'bg-rose-500',
    pad: 'bg-violet-500',
    lead: 'bg-fuchsia-500',
    pluck: 'bg-emerald-500',
    bell: 'bg-sky-500',
    fx: 'bg-slate-500',
  };

  return (
    <div className={`min-h-screen bg-gradient-to-br ${currentTheme.bgGradient} p-6 transition-all duration-500`}>
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-between mb-4">
            <div></div>
            <h1 className={`text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r ${currentTheme.buttonGradient}`}>
              Beat Maker
            </h1>
            <div className="flex items-center gap-3">
              {user ? (
                <>
                  <span className={`${currentTheme.textColor} text-sm`}>{user.email}</span>
                  <button
                    onClick={handleLogout}
                    className={`px-4 py-2 rounded-lg ${currentTheme.cardBg} ${currentTheme.textColor} text-sm hover:opacity-80`}
                  >
                    Logout
                  </button>
                </>
              ) : (
                <Link href="/login" className={`px-4 py-2 rounded-lg bg-gradient-to-r ${currentTheme.buttonGradient} text-white text-sm hover:opacity-80`}>
                  Login
                </Link>
              )}
            </div>
          </div>
          <p className={currentTheme.textColor}>Create beats and melodies with AI</p>
        </div>

        {/* Prompt Generator */}
        <div className={`${currentTheme.cardBg} backdrop-blur-xl rounded-2xl p-6 mb-6 border ${currentTheme.borderColor} shadow-2xl transition-all duration-500`}>
          <div className={`text-lg font-semibold ${currentTheme.accentColor} mb-4`}>Describe your beat style</div>
          <div className="flex gap-3">
            <input
              type="text"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="e.g., 'hip hop', 'house', 'rock', 'jazz', 'funk', 'techno', 'ambient', 'latin', 'reggae'..."
              className={`flex-1 px-5 py-3 rounded-xl ${currentTheme.cardBg} border ${currentTheme.borderColor} text-white text-lg focus:outline-none focus:ring-2 ${currentTheme.accentColor.replace('text-', 'focus:ring-')} placeholder-slate-400`}
              onKeyPress={(e) => {
                if (e.key === 'Enter') {
                  handleGenerate();
                }
              }}
            />
            <button
              onClick={handleGenerate}
              disabled={!prompt.trim() || isGenerating}
              className={`px-8 py-3 rounded-xl font-bold bg-gradient-to-r ${currentTheme.buttonGradient} text-white hover:opacity-80 disabled:opacity-50 disabled:cursor-not-allowed transition-all transform hover:scale-105 shadow-lg`}
            >
              {isGenerating ? '✨' : 'Generate'}
            </button>
          </div>
          <div className="mt-3 text-sm text-slate-400">
            Try: hip hop, trap, house, edm, rock, jazz, funk, techno, ambient, latin, reggae
          </div>
        </div>

        {/* Controls */}
        <div className={`${currentTheme.cardBg} backdrop-blur-xl rounded-2xl p-6 mb-6 border ${currentTheme.borderColor} transition-all duration-500`}>
          <div className="flex items-center justify-between gap-6 flex-wrap">
            <div className="flex items-center gap-4">
              <button
                onClick={handlePlay}
                disabled={isPlaying}
                className="px-8 py-3 rounded-xl font-bold text-lg bg-green-600 text-white hover:bg-green-500 disabled:opacity-50 transition-all transform hover:scale-105"
              >
                ▶ Play
              </button>
              <button
                onClick={handleStop}
                disabled={!isPlaying}
                className="px-8 py-3 rounded-xl font-bold text-lg bg-red-600 text-white hover:bg-red-500 disabled:opacity-50 transition-all transform hover:scale-105"
              >
                ⏹ Stop
              </button>
            </div>
            <div className="flex items-center gap-4">
              <label className={`${currentTheme.textColor} font-semibold`}>Tempo:</label>
              <input
                type="range"
                min={MIN_BPM}
                max={MAX_BPM}
                value={bpm}
                onChange={(e) => setBpm(Number(e.target.value))}
                className="w-40"
              />
              <span className={`${currentTheme.accentColor} font-bold text-xl w-16`}>{bpm} BPM</span>
            </div>
            <button
              onClick={clearAll}
              className="px-6 py-3 rounded-xl font-semibold bg-orange-600 text-white hover:bg-orange-500 transition-all"
            >
              Clear
            </button>
          </div>
        </div>

        {/* Instruments Grid */}
        <div className={`${currentTheme.cardBg} backdrop-blur-xl rounded-2xl p-6 mb-6 border ${currentTheme.borderColor} transition-all duration-500`}>
          <div className={`text-xl font-bold ${currentTheme.textColor} mb-4`}>Instruments</div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
            {(Object.keys(patterns) as Instrument[]).map((instrument) => {
              const color = instrumentColors[instrument];
              return (
                <div key={instrument} className="flex flex-col gap-2">
                  <div className={`text-xs font-semibold ${currentTheme.textColor} capitalize`}>
                    {instrument}
                  </div>
                  <div className="grid grid-cols-8 gap-1">
                    {patterns[instrument].map((isActive, beatIndex) => (
                      <button
                        key={beatIndex}
                        onClick={() => toggleBeat(instrument, beatIndex)}
                        className={`
                          aspect-square rounded-lg transition-all transform hover:scale-110
                          ${isActive 
                            ? `${color} border-2 border-white/50 shadow-lg` 
                            : `${currentTheme.cardBg} border-2 ${currentTheme.borderColor} hover:border-opacity-50`
                          }
                          ${isPlaying && currentBeat === beatIndex 
                            ? 'ring-2 ring-yellow-400 ring-opacity-75' 
                            : ''
                          }
                        `}
                      >
                        {isActive && (
                          <div className="w-full h-full flex items-center justify-center">
                            <div className="w-1.5 h-1.5 rounded-full bg-white/90"></div>
                          </div>
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Melody */}
        <div className={`${currentTheme.cardBg} backdrop-blur-xl rounded-2xl p-6 mb-6 border ${currentTheme.borderColor} transition-all duration-500`}>
          <div className={`text-xl font-bold ${currentTheme.textColor} mb-4`}>Melody</div>
          <div className="space-y-3">
            {MELODY_NOTES.map((note, noteIndex) => (
              <div key={note} className="flex items-center gap-4">
                <div className={`w-24 text-right font-semibold ${currentTheme.accentColor}`}>
                  {note}
                </div>
                <div className="flex-1 grid grid-cols-8 gap-2">
                  {melody[noteIndex].map((isActive, beatIndex) => (
                    <button
                      key={beatIndex}
                      onClick={() => toggleMelody(noteIndex, beatIndex)}
                      className={`
                        aspect-square rounded-xl transition-all transform hover:scale-110
                        ${isActive 
                          ? 'bg-gradient-to-br from-amber-400 to-yellow-400 border-2 border-amber-300 shadow-lg' 
                          : `${currentTheme.cardBg} border-2 ${currentTheme.borderColor} hover:border-opacity-50`
                        }
                        ${isPlaying && currentBeat === beatIndex 
                          ? 'ring-4 ring-yellow-400 ring-opacity-75 scale-110' 
                          : ''
                        }
                      `}
                    >
                      {isActive && (
                        <div className="w-full h-full flex items-center justify-center">
                          <div className="w-3 h-3 rounded-full bg-white/90"></div>
                        </div>
                      )}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Save/Load Beats */}
        {user && (
          <div className={`${currentTheme.cardBg} backdrop-blur-xl rounded-2xl p-6 border ${currentTheme.borderColor} transition-all duration-500`}>
            <div className={`text-xl font-bold ${currentTheme.textColor} mb-4`}>Save Your Beat</div>
            <div className="flex gap-3 mb-4">
              <input
                type="text"
                value={beatName}
                onChange={(e) => setBeatName(e.target.value)}
                placeholder="Enter beat name..."
                className={`flex-1 px-4 py-3 rounded-xl ${currentTheme.cardBg} border ${currentTheme.borderColor} text-white focus:outline-none focus:ring-2 ${currentTheme.accentColor.replace('text-', 'focus:ring-')} placeholder-slate-400`}
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    saveBeat();
                  }
                }}
              />
              <button
                onClick={saveBeat}
                disabled={!beatName.trim()}
                className={`px-6 py-3 rounded-xl font-semibold bg-gradient-to-r ${currentTheme.buttonGradient} text-white hover:opacity-80 disabled:opacity-50 disabled:cursor-not-allowed transition-all`}
              >
                Save
              </button>
            </div>
            
            {savedBeats.length > 0 && (
              <div>
                <div className={`text-lg font-semibold ${currentTheme.textColor} mb-3`}>Your Saved Beats</div>
                <div className="space-y-2">
                  {savedBeats.map((beat) => (
                    <div key={beat.id} className={`flex items-center justify-between p-4 ${currentTheme.cardBg} rounded-xl border ${currentTheme.borderColor}`}>
                      <span className="text-white font-medium">{beat.name}</span>
                      <div className="flex gap-2">
                        <button
                          onClick={() => loadBeat(beat)}
                          className="px-4 py-2 rounded-lg bg-blue-600 text-white text-sm hover:bg-blue-500 transition-all"
                        >
                          Load
                        </button>
                        <button
                          onClick={() => deleteBeat(beat.id)}
                          className="px-4 py-2 rounded-lg bg-red-600 text-white text-sm hover:bg-red-500 transition-all"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
