'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

type Instrument = 'kick' | 'snare' | 'hihat';
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

// Melody notes - 5 notes for simplicity
const MELODY_NOTES = ['C4', 'D4', 'E4', 'G4', 'A4'];

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

// Generate patterns from prompt
const generateFromPrompt = (prompt: string): {
  kick: BeatPattern;
  snare: BeatPattern;
  hihat: BeatPattern;
  melody: MelodyPattern[];
  bpm: number;
} => {
  const lowerPrompt = prompt.toLowerCase();
  let kick: BeatPattern = new Array(BEATS_PER_MEASURE).fill(false);
  let snare: BeatPattern = new Array(BEATS_PER_MEASURE).fill(false);
  let hihat: BeatPattern = new Array(BEATS_PER_MEASURE).fill(false);
  let melody: MelodyPattern[] = MELODY_NOTES.map(() => new Array(BEATS_PER_MEASURE).fill(false));
  let bpm = DEFAULT_BPM;

  // Hip Hop
  if (lowerPrompt.includes('hip hop') || lowerPrompt.includes('trap') || lowerPrompt.includes('rap')) {
    kick = [true, false, false, false, true, false, false, false];
    snare = [false, false, false, false, false, false, true, false];
    hihat = [true, false, true, false, true, false, true, false];
    melody[0] = [true, false, false, false, true, false, false, false]; // C4
    melody[2] = [false, false, false, false, false, false, true, false]; // E4
    melody[4] = [true, false, false, false, true, false, false, false]; // A4
    bpm = 140;
  }
  // House / EDM
  else if (lowerPrompt.includes('house') || lowerPrompt.includes('edm') || lowerPrompt.includes('electronic')) {
    kick = [true, false, false, false, true, false, false, false];
    snare = [false, false, false, false, false, false, true, false];
    hihat = [false, true, false, true, false, true, false, true];
    melody[0] = [true, false, true, false, true, false, true, false]; // C4
    melody[2] = [false, true, false, true, false, true, false, true]; // E4
    bpm = 128;
  }
  // Rock
  else if (lowerPrompt.includes('rock')) {
    kick = [true, false, false, true, true, false, false, true];
    snare = [false, false, false, false, false, false, true, false];
    hihat = [true, false, true, false, true, false, true, false];
    melody[1] = [true, false, false, false, true, false, false, false]; // D4
    melody[3] = [false, false, false, false, false, false, true, false]; // G4
    bpm = 120;
  }
  // Jazz
  else if (lowerPrompt.includes('jazz')) {
    kick = [true, false, false, false, true, false, false, false];
    snare = [false, false, false, false, false, false, true, false];
    hihat = [true, false, true, false, true, false, true, false];
    melody[0] = [true, false, false, true, false, false, true, false]; // C4
    melody[2] = [false, false, true, false, false, true, false, false]; // E4
    melody[4] = [true, false, false, false, true, false, false, false]; // A4
    bpm = 110;
  }
  // Funk
  else if (lowerPrompt.includes('funk')) {
    kick = [true, false, false, true, false, false, true, false];
    snare = [false, false, false, false, false, false, true, false];
    hihat = [false, true, false, true, false, true, false, true];
    melody[0] = [true, false, true, false, false, true, false, false]; // C4
    melody[2] = [false, true, false, false, true, false, false, true]; // E4
    bpm = 100;
  }
  // Ambient / Chill
  else if (lowerPrompt.includes('ambient') || lowerPrompt.includes('chill')) {
    kick = [true, false, false, false, false, false, false, false];
    snare = [false, false, false, false, false, false, false, false];
    hihat = [false, false, false, false, false, false, false, true];
    melody[0] = [true, false, false, false, true, false, false, false]; // C4
    melody[2] = [false, false, false, true, false, false, false, true]; // E4
    melody[4] = [true, false, false, false, false, false, false, false]; // A4
    bpm = 90;
  }
  // Default
  else {
    kick = [true, false, false, false, true, false, false, false];
    snare = [false, false, false, false, false, false, true, false];
    hihat = [false, true, false, true, false, true, false, true];
    melody[0] = [true, false, false, false, true, false, false, false]; // C4
    melody[2] = [false, false, false, false, false, false, true, false]; // E4
    bpm = 120;
  }

  return { kick, snare, hihat, melody, bpm };
};

export default function BeatMaker() {
  const [user, setUser] = useState<any>(null);
  const [patterns, setPatterns] = useState<Record<Instrument, BeatPattern>>({
    kick: new Array(BEATS_PER_MEASURE).fill(false),
    snare: new Array(BEATS_PER_MEASURE).fill(false),
    hihat: new Array(BEATS_PER_MEASURE).fill(false),
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

  // Sound generation
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
    }
  }, [playKick, playSnare, playHiHat]);

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
      setPatterns({
        kick: generated.kick,
        snare: generated.snare,
        hihat: generated.hihat,
      });
      setMelody(generated.melody);
      setBpm(generated.bpm);
      setIsGenerating(false);
      setPrompt('');
    }, 300);
  };

  const clearAll = () => {
    setPatterns({
      kick: new Array(BEATS_PER_MEASURE).fill(false),
      snare: new Array(BEATS_PER_MEASURE).fill(false),
      hihat: new Array(BEATS_PER_MEASURE).fill(false),
    });
    setMelody(MELODY_NOTES.map(() => new Array(BEATS_PER_MEASURE).fill(false)));
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

  const instrumentConfig: Record<Instrument, { label: string; color: string; bgColor: string }> = {
    kick: { label: 'Kick', color: 'text-red-400', bgColor: 'bg-red-500' },
    snare: { label: 'Snare', color: 'text-green-400', bgColor: 'bg-green-500' },
    hihat: { label: 'Hi-Hat', color: 'text-blue-400', bgColor: 'bg-blue-500' },
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-between mb-4">
            <div></div>
            <h1 className="text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-pink-400 to-blue-400">
              Beat Maker
            </h1>
            <div className="flex items-center gap-3">
              {user ? (
                <>
                  <span className="text-slate-300 text-sm">{user.email}</span>
                  <button
                    onClick={handleLogout}
                    className="px-4 py-2 rounded-lg bg-slate-700 text-white text-sm hover:bg-slate-600"
                  >
                    Logout
                  </button>
                </>
              ) : (
                <Link href="/login" className="px-4 py-2 rounded-lg bg-purple-600 text-white text-sm hover:bg-purple-500">
                  Login
                </Link>
              )}
            </div>
          </div>
          <p className="text-slate-300">Create beats and melodies with AI</p>
        </div>

        {/* Prompt Generator */}
        <div className="bg-slate-800/90 backdrop-blur-xl rounded-2xl p-6 mb-6 border border-purple-500/20 shadow-2xl">
          <div className="text-lg font-semibold text-purple-300 mb-4">Describe your beat style</div>
          <div className="flex gap-3">
            <input
              type="text"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="e.g., 'hip hop', 'house', 'rock', 'jazz', 'funk', 'ambient'..."
              className="flex-1 px-5 py-3 rounded-xl bg-slate-700/50 border border-slate-600 text-white text-lg focus:outline-none focus:ring-2 focus:ring-purple-500 placeholder-slate-400"
              onKeyPress={(e) => {
                if (e.key === 'Enter') {
                  handleGenerate();
                }
              }}
            />
            <button
              onClick={handleGenerate}
              disabled={!prompt.trim() || isGenerating}
              className="px-8 py-3 rounded-xl font-bold bg-gradient-to-r from-purple-500 to-pink-500 text-white hover:from-purple-400 hover:to-pink-400 disabled:opacity-50 disabled:cursor-not-allowed transition-all transform hover:scale-105 shadow-lg"
            >
              {isGenerating ? '✨' : 'Generate'}
            </button>
          </div>
          <div className="mt-3 text-sm text-slate-400">
            Try: hip hop, trap, house, edm, rock, jazz, funk, ambient, chill
          </div>
        </div>

        {/* Controls */}
        <div className="bg-slate-800/90 backdrop-blur-xl rounded-2xl p-6 mb-6 border border-slate-700">
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
              <label className="text-slate-300 font-semibold">Tempo:</label>
              <input
                type="range"
                min={MIN_BPM}
                max={MAX_BPM}
                value={bpm}
                onChange={(e) => setBpm(Number(e.target.value))}
                className="w-40"
              />
              <span className="text-purple-300 font-bold text-xl w-16">{bpm} BPM</span>
            </div>
            <button
              onClick={clearAll}
              className="px-6 py-3 rounded-xl font-semibold bg-orange-600 text-white hover:bg-orange-500 transition-all"
            >
              Clear
            </button>
          </div>
        </div>

        {/* Drums */}
        <div className="bg-slate-800/90 backdrop-blur-xl rounded-2xl p-6 mb-6 border border-slate-700">
          <div className="text-xl font-bold text-slate-200 mb-4">Drums</div>
          <div className="space-y-4">
            {(Object.keys(patterns) as Instrument[]).map((instrument) => {
              const config = instrumentConfig[instrument];
              return (
                <div key={instrument} className="flex items-center gap-4">
                  <div className={`w-24 text-right font-semibold ${config.color}`}>
                    {config.label}
                  </div>
                  <div className="flex-1 grid grid-cols-8 gap-2">
                    {patterns[instrument].map((isActive, beatIndex) => (
                      <button
                        key={beatIndex}
                        onClick={() => toggleBeat(instrument, beatIndex)}
                        className={`
                          aspect-square rounded-xl transition-all transform hover:scale-110
                          ${isActive 
                            ? `${config.bgColor} border-2 border-white/50 shadow-lg` 
                            : 'bg-slate-700 border-2 border-slate-600 hover:border-slate-500'
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
              );
            })}
          </div>
        </div>

        {/* Melody */}
        <div className="bg-slate-800/90 backdrop-blur-xl rounded-2xl p-6 border border-slate-700">
          <div className="text-xl font-bold text-slate-200 mb-4">Melody</div>
          <div className="space-y-3">
            {MELODY_NOTES.map((note, noteIndex) => (
              <div key={note} className="flex items-center gap-4">
                <div className="w-24 text-right font-semibold text-amber-400">
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
                          : 'bg-slate-700 border-2 border-slate-600 hover:border-slate-500'
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

        {/* Save/Load Beats - Only show if logged in */}
        {user && (
          <div className="bg-slate-800/90 backdrop-blur-xl rounded-2xl p-6 border border-slate-700">
            <div className="text-xl font-bold text-slate-200 mb-4">Save Your Beat</div>
            <div className="flex gap-3 mb-4">
              <input
                type="text"
                value={beatName}
                onChange={(e) => setBeatName(e.target.value)}
                placeholder="Enter beat name..."
                className="flex-1 px-4 py-3 rounded-xl bg-slate-700/50 border border-slate-600 text-white focus:outline-none focus:ring-2 focus:ring-purple-500 placeholder-slate-400"
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    saveBeat();
                  }
                }}
              />
              <button
                onClick={saveBeat}
                disabled={!beatName.trim()}
                className="px-6 py-3 rounded-xl font-semibold bg-gradient-to-r from-purple-500 to-pink-500 text-white hover:from-purple-400 hover:to-pink-400 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                Save
              </button>
            </div>
            
            {savedBeats.length > 0 && (
              <div>
                <div className="text-lg font-semibold text-slate-300 mb-3">Your Saved Beats</div>
                <div className="space-y-2">
                  {savedBeats.map((beat) => (
                    <div key={beat.id} className="flex items-center justify-between p-4 bg-slate-700/50 rounded-xl">
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
