import React, { useState, useEffect, useRef } from 'react';
import {
  Play,
  Pause,
  SkipForward,
  RotateCcw,
  Square,
  Terminal,
  Database,
  Star,
  CheckCircle2,
  AlertCircle,
  Clock,
  Send,
  Copy,
  Trash2,
  Sparkles,
  Zap,
  Activity,
  Code2,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { parseAlgoBox } from '../lib/algoboxParser';
import { AlgoBoxInterpreter } from '../lib/algoboxInterpreter';
import {
  ExecutionStatus,
  ExecutionSummary,
  ParsedAlgorithm,
  SymbolTable,
  TerminalOutput,
  UserProfile,
  WorkflowStepEvent,
} from '../types/algobox';
import { recordExecutionRun, submitAlgorithmRating } from '../lib/firestoreService';
import { SAMPLE_ALGORITHMS } from '../lib/sampleAlgorithms';
import { AlgoBoxCodeTree } from './AlgoBoxCodeTree';
import { AlgoWorkflowTracker } from './AlgoWorkflowTracker';

interface AlgoRunnerProps {
  initialCode: string;
  algorithmId?: string;
  algorithmTitle?: string;
  algorithmAuthor?: string;
  userProfile: UserProfile;
  onClose?: () => void;
  onSelectAlgorithm?: (code: string, title: string, author: string, id?: string) => void;
  onAuthorClick?: (author: string) => void;
}

export const AlgoRunner: React.FC<AlgoRunnerProps> = ({
  initialCode,
  algorithmId,
  algorithmTitle = 'Algorithme AlgoBox',
  algorithmAuthor,
  userProfile,
  onSelectAlgorithm,
  onAuthorClick,
}) => {
  const [code, setCode] = useState(initialCode);
  const [currentTitle, setCurrentTitle] = useState(algorithmTitle);
  const [currentAuthor, setCurrentAuthor] = useState(algorithmAuthor);
  const [currentId, setCurrentId] = useState(algorithmId);
  const [viewMode, setViewMode] = useState<'parsed' | 'raw'>('parsed');
  const [parsed, setParsed] = useState<ParsedAlgorithm | null>(null);
  const [parseErrors, setParseErrors] = useState<string[]>([]);

  // Execution states
  const [status, setStatus] = useState<ExecutionStatus>('idle');
  const [activeLine, setActiveLine] = useState<number | null>(null);
  const [memory, setMemory] = useState<SymbolTable>({});
  const [prevMemory, setPrevMemory] = useState<SymbolTable>({});
  const [terminalOutputs, setTerminalOutputs] = useState<TerminalOutput[]>([]);
  const [inputPrompt, setInputPrompt] = useState<{ varName: string; prompt: string } | null>(null);
  const [inputValue, setInputValue] = useState('');
  const [speed, setSpeed] = useState<number>(200); // 200ms default
  const [executedAtLeastOnce, setExecutedAtLeastOnce] = useState(false);

  // Workflow tracking states
  const [currentStep, setCurrentStep] = useState<WorkflowStepEvent | null>(null);
  const [stepHistory, setStepHistory] = useState<WorkflowStepEvent[]>([]);
  const [executionSummary, setExecutionSummary] = useState<ExecutionSummary | null>(null);

  // Rating state
  const [userRating, setUserRating] = useState<number>(5);
  const [ratingComment, setRatingComment] = useState('');
  const [ratingSubmitted, setRatingSubmitted] = useState(false);
  const [isSubmittingRating, setIsSubmittingRating] = useState(false);

  const interpreterRef = useRef<AlgoBoxInterpreter | null>(null);
  const terminalEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Parse code on change or initial load
  useEffect(() => {
    setCode(initialCode);
    setCurrentTitle(algorithmTitle);
    setCurrentAuthor(algorithmAuthor);
    setCurrentId(algorithmId);
    setRatingSubmitted(false);
    setCurrentStep(null);
    setStepHistory([]);
    setExecutionSummary(null);
  }, [initialCode, algorithmTitle, algorithmAuthor, algorithmId]);

  useEffect(() => {
    try {
      const parsedRes = parseAlgoBox(code);
      setParsed(parsedRes);
      setParseErrors(parsedRes.errors || []);
    } catch (e: any) {
      setParseErrors([e.message || 'Erreur de syntaxe']);
      setParsed(null);
    }
  }, [code]);

  // Initialize interpreter when parsed changes
  useEffect(() => {
    if (!parsed) return;

    if (interpreterRef.current) {
      interpreterRef.current.stop();
    }

    const interp = new AlgoBoxInterpreter(parsed, {
      onOutput: (out) => {
        setTerminalOutputs((prev) => [...prev, out]);
      },
      onMemoryChange: (newMem) => {
        setPrevMemory((old) => ({ ...old, ...memory }));
        setMemory(newMem);
      },
      onStatusChange: (newStatus) => {
        setStatus(newStatus);
        if (newStatus === 'waiting_input') {
          setTimeout(() => {
            inputRef.current?.focus();
          }, 50);
        }
      },
      onActiveLineChange: (line) => {
        setActiveLine(line);
      },
      onInputPrompt: (varName, prompt) => {
        setInputPrompt({ varName, prompt: prompt || `Entrez ${varName} :` });
      },
      onWorkflowStep: (step) => {
        setCurrentStep(step);
        setStepHistory((prev) => [...prev, step]);
      },
      onExecutionSummary: (sum) => {
        setExecutionSummary(sum);
      },
      onComplete: () => {
        setExecutedAtLeastOnce(true);
        if (currentId) {
          recordExecutionRun(currentId);
        }
        try {
          confetti({
            particleCount: 50,
            spread: 70,
            origin: { y: 0.7 },
            colors: ['#f97316', '#fb923c', '#fdba74', '#ffffff'],
          });
        } catch {}
      },
    });

    interp.setSpeed(speed);
    interpreterRef.current = interp;
    setMemory(interp.getMemory());

    return () => {
      interp.stop();
    };
  }, [parsed]);

  useEffect(() => {
    if (interpreterRef.current) {
      interpreterRef.current.setSpeed(speed);
    }
  }, [speed]);

  useEffect(() => {
    terminalEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [terminalOutputs, inputPrompt]);

  const handleRun = () => {
    if (interpreterRef.current) {
      if (status === 'completed' || status === 'error') {
        setCurrentStep(null);
        setStepHistory([]);
        setExecutionSummary(null);
      }
      interpreterRef.current.run();
    }
  };

  const handlePause = () => {
    if (interpreterRef.current) {
      interpreterRef.current.pause();
    }
  };

  const handleStep = () => {
    if (interpreterRef.current) {
      interpreterRef.current.step();
    }
  };

  const handleReset = () => {
    if (interpreterRef.current) {
      interpreterRef.current.reset();
      setInputPrompt(null);
      setInputValue('');
      setCurrentStep(null);
      setStepHistory([]);
      setExecutionSummary(null);
      setTerminalOutputs((prev) => [
        ...prev,
        {
          id: `reset_${Date.now()}`,
          type: 'system',
          text: '=== Réinitialisation de l\'algorithme ===',
          timestamp: Date.now(),
        },
      ]);
    }
  };

  const handleStop = () => {
    if (interpreterRef.current) {
      interpreterRef.current.stop();
      setInputPrompt(null);
      setInputValue('');
    }
  };

  const handleInputSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputPrompt || !interpreterRef.current) return;
    const val = inputValue.trim();
    interpreterRef.current.provideInput(val || '0');
    setInputPrompt(null);
    setInputValue('');
  };

  const clearTerminal = () => {
    setTerminalOutputs([]);
  };

  const copyTerminalOutput = () => {
    const text = terminalOutputs.map((o) => o.text).join('\n');
    navigator.clipboard.writeText(text);
  };

  const handleLoadSample = (sample: typeof SAMPLE_ALGORITHMS[0]) => {
    setCode(sample.rawAlgContent);
    setCurrentTitle(sample.title);
    setCurrentAuthor(sample.authorName);
    setCurrentId(sample.id);
    setRatingSubmitted(false);
    setExecutedAtLeastOnce(false);
    if (onSelectAlgorithm) {
      onSelectAlgorithm(sample.rawAlgContent, sample.title, sample.authorName, sample.id);
    }
  };

  const handleSubmitRating = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentId) return;
    setIsSubmittingRating(true);
    try {
      await submitAlgorithmRating(currentId, {
        userId: userProfile.uid,
        userName: userProfile.displayName,
        userAvatar: userProfile.avatarIcon,
        score: userRating,
        feedback: ratingComment,
        executionPassed: executedAtLeastOnce,
      });
      setRatingSubmitted(true);
      confetti({
        particleCount: 50,
        spread: 70,
        origin: { y: 0.7 },
        colors: ['#f97316', '#ea580c', '#ffffff'],
      });
    } catch (err) {
      console.error('Rating failed:', err);
    } finally {
      setIsSubmittingRating(false);
    }
  };

  return (
    <div className="w-full bg-zinc-50 text-zinc-900 min-h-[calc(100vh-4rem)] flex flex-col">
      {/* Quick Start Presets Row for Instant Onboarding */}
      <div className="bg-orange-50/80 border-b border-orange-100 px-4 py-2.5 flex items-center gap-2 overflow-x-auto">
        <div className="flex items-center gap-1.5 text-xs font-bold text-orange-800 shrink-0 mr-1">
          <Zap className="w-4 h-4 text-orange-500 fill-orange-500" />
          <span>Prise en main rapide :</span>
        </div>
        <div className="flex items-center gap-2">
          {SAMPLE_ALGORITHMS.map((sample) => {
            const isSelected = currentTitle === sample.title;
            return (
              <button
                key={sample.id}
                onClick={() => handleLoadSample(sample)}
                className={`px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap transition-all ${
                  isSelected
                    ? 'bg-orange-500 text-white shadow-xs'
                    : 'bg-white text-zinc-700 hover:bg-orange-100/70 border border-orange-200'
                }`}
              >
                {sample.title}
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Runner Header Toolbar */}
      <div className="bg-white px-4 py-3 border-b border-zinc-200 flex flex-wrap items-center justify-between gap-4 shadow-2xs">
        {/* Title & status */}
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-orange-100 text-orange-600 flex items-center justify-center font-bold">
            <Terminal className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="font-extrabold text-base text-zinc-900 tracking-tight">{currentTitle}</h2>
              {currentAuthor && (
                <button
                  type="button"
                  onClick={() => onAuthorClick && onAuthorClick(currentAuthor)}
                  className="text-xs text-orange-600 hover:text-orange-700 font-bold transition hover:underline cursor-pointer"
                  title="Voir le profil de l'auteur"
                >
                  par {currentAuthor.startsWith('@') ? currentAuthor : `@${currentAuthor}`}
                </button>
              )}
            </div>
            <div className="text-xs text-zinc-500 font-mono">
              {parsed?.variables.length || 0} variables • {parsed?.commands.length || 0} instructions
            </div>
          </div>
        </div>

        {/* Action Controls with Rounded Buttons */}
        <div className="flex items-center gap-2">
          {status === 'running' ? (
            <button
              id="runner-btn-pause"
              onClick={handlePause}
              className="flex items-center gap-1.5 px-4 py-2 rounded-full bg-zinc-800 hover:bg-zinc-700 text-white text-xs font-bold transition shadow-xs cursor-pointer"
            >
              <Pause className="w-4 h-4" />
              <span>Pause</span>
            </button>
          ) : (
            <button
              id="runner-btn-run"
              onClick={handleRun}
              className="flex items-center gap-1.5 px-5 py-2 rounded-full bg-orange-500 hover:bg-orange-600 text-white text-xs font-extrabold transition shadow-md shadow-orange-500/20 hover:scale-102 cursor-pointer"
            >
              <Play className="w-4 h-4 fill-white" />
              <span>{status === 'paused' ? 'Reprendre' : 'Lancer l\'algorithme'}</span>
            </button>
          )}

          <button
            id="runner-btn-step"
            onClick={handleStep}
            disabled={status === 'running' || status === 'waiting_input'}
            className="flex items-center gap-1 px-3.5 py-2 rounded-full bg-zinc-100 hover:bg-zinc-200 disabled:opacity-40 text-zinc-800 text-xs font-semibold transition border border-zinc-200 cursor-pointer"
            title="Pas à pas"
          >
            <SkipForward className="w-4 h-4" />
            <span className="hidden sm:inline">Pas à pas</span>
          </button>

          <button
            id="runner-btn-reset"
            onClick={handleReset}
            className="p-2 rounded-full bg-zinc-100 hover:bg-zinc-200 text-zinc-700 transition border border-zinc-200 cursor-pointer"
            title="Réinitialiser"
          >
            <RotateCcw className="w-4 h-4" />
          </button>

          {/* Speed Selector */}
          <div className="flex items-center gap-1 ml-1 text-xs text-zinc-500">
            <select
              value={speed}
              onChange={(e) => setSpeed(Number(e.target.value))}
              className="bg-zinc-100 text-zinc-800 rounded-full px-3 py-1.5 text-xs font-medium border border-zinc-200 outline-none cursor-pointer hover:border-orange-300"
            >
              <option value={0}>Vitesse: Instantanée</option>
              <option value={80}>Vitesse: Rapide</option>
              <option value={180}>Vitesse: Normale</option>
              <option value={600}>Vitesse: Pas à pas lent</option>
            </select>
          </div>
        </div>
      </div>

      {/* Main Grid: Code & Execution */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 min-h-[560px]">
        {/* Left Column: Code Viewer (7 cols) */}
        <div className="lg:col-span-7 border-r border-zinc-200 flex flex-col bg-white">
          {/* Sub Header */}
          <div className="bg-zinc-50 border-b border-zinc-200 px-4 py-2 flex items-center justify-between">
            <div className="flex items-center gap-1.5 bg-zinc-200/60 p-0.5 rounded-full">
              <button
                onClick={() => setViewMode('tree')}
                className={`flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold transition ${
                  viewMode === 'tree'
                    ? 'bg-white text-orange-600 shadow-xs'
                    : 'text-zinc-600 hover:text-zinc-900'
                }`}
              >
                <Activity className="w-3.5 h-3.5" />
                <span>Arborescence AlgoBox</span>
              </button>
              <button
                onClick={() => setViewMode('raw')}
                className={`flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold transition ${
                  viewMode === 'raw'
                    ? 'bg-white text-orange-600 shadow-xs'
                    : 'text-zinc-600 hover:text-zinc-900'
                }`}
              >
                <Code2 className="w-3.5 h-3.5" />
                <span>Code Source (.alg)</span>
              </button>
            </div>

            {activeLine !== null && (
              <span className="text-xs font-mono font-bold text-orange-600 bg-orange-50 px-2.5 py-0.5 rounded-full border border-orange-200 animate-pulse">
                Ligne active : {activeLine}
              </span>
            )}
          </div>

          {/* Code Viewer Area */}
          <div className="flex-1 p-3 overflow-auto">
            {parseErrors.length > 0 && (
              <div className="mb-3 p-3 bg-orange-50 border border-orange-200 rounded-2xl text-orange-900 text-xs">
                <div className="font-bold flex items-center gap-1.5 mb-1">
                  <AlertCircle className="w-4 h-4 text-orange-600" /> Avertissement syntaxe AlgoBox :
                </div>
                {parseErrors.map((err, i) => (
                  <div key={i} className="mt-0.5 font-mono">• {err}</div>
                ))}
              </div>
            )}

            {viewMode === 'raw' ? (
              <textarea
                value={code}
                onChange={(e) => setCode(e.target.value)}
                className="w-full h-full min-h-[480px] p-3.5 font-mono text-xs bg-zinc-50 border border-zinc-200 rounded-2xl focus:border-orange-500 focus:bg-white outline-none leading-relaxed resize-none text-zinc-800"
                spellCheck={false}
              />
            ) : (
              <AlgoBoxCodeTree parsed={parsed} activeLine={activeLine} />
            )}
          </div>
        </div>

        {/* Right Column: Workflow Tracker, Memory & Terminal (5 cols) */}
        <div className="lg:col-span-5 flex flex-col bg-zinc-50 space-y-3 p-3 overflow-y-auto">
          {/* Suivi Minutieux du Workflow */}
          <AlgoWorkflowTracker
            status={status}
            activeLine={activeLine}
            currentStep={currentStep}
            stepHistory={stepHistory}
            summary={executionSummary}
            onReset={handleReset}
            onRun={handleRun}
          />

          {/* Memory Inspector */}
          <div className="border border-zinc-200 bg-white p-3 rounded-2xl shadow-xs">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-1.5 text-xs font-bold text-zinc-800">
                <Database className="w-3.5 h-3.5 text-orange-500" />
                <span>Mémoire des Variables</span>
              </div>
              <span className="text-[10px] font-mono text-zinc-400">Temps réel</span>
            </div>

            <div className="flex flex-wrap gap-1.5 max-h-36 overflow-y-auto">
              {Object.keys(memory).length === 0 ? (
                <div className="text-xs text-zinc-400 italic py-1">
                  Aucune variable active
                </div>
              ) : (
                Object.entries(memory).map(([varName, val]) => {
                  const isChanged = prevMemory[varName] !== undefined && prevMemory[varName] !== val;
                  return (
                    <div
                      key={varName}
                      className={`px-2.5 py-1 rounded-xl border transition-all flex items-center gap-1.5 text-xs ${
                        isChanged
                          ? 'border-orange-400 bg-orange-50 ring-1 ring-orange-300'
                          : 'border-zinc-200 bg-zinc-50'
                      }`}
                    >
                      <span className="font-extrabold text-zinc-900">{varName} :</span>
                      <span className="font-mono font-bold text-orange-600">
                        {Array.isArray(val)
                          ? `[${val.join(', ')}]`
                          : typeof val === 'string'
                          ? `"${val}"`
                          : String(val)}
                      </span>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Console Terminal */}
          <div className="flex-1 flex flex-col bg-zinc-950 text-white min-h-[300px]">
            {/* Terminal Header */}
            <div className="px-4 py-2 bg-zinc-900 border-b border-zinc-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-full bg-orange-500 animate-pulse" />
                <span className="font-mono text-xs text-zinc-300 font-bold">Terminal Console</span>
              </div>
              <div className="flex items-center gap-1">
                <button
                  onClick={copyTerminalOutput}
                  className="p-1 rounded text-zinc-400 hover:text-white transition"
                  title="Copier"
                >
                  <Copy className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={clearTerminal}
                  className="p-1 rounded text-zinc-400 hover:text-white transition"
                  title="Effacer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Terminal Logs */}
            <div className="flex-1 p-4 overflow-y-auto font-mono text-xs space-y-1 select-text">
              {terminalOutputs.length === 0 && (
                <div className="text-zinc-600 italic">
                  Cliquez sur "Lancer l'algorithme" pour exécuter...
                </div>
              )}

              {terminalOutputs.map((out) => (
                <div
                  key={out.id}
                  className={`leading-relaxed break-words whitespace-pre-wrap ${
                    out.type === 'error'
                      ? 'text-red-400'
                      : out.type === 'success'
                      ? 'text-orange-400 font-bold'
                      : out.type === 'system'
                      ? 'text-zinc-500 italic'
                      : out.type === 'stdin'
                      ? 'text-amber-300 font-semibold'
                      : 'text-zinc-100'
                  }`}
                >
                  {out.text}
                </div>
              ))}

              {/* Waiting for Input Interactive Box */}
              {status === 'waiting_input' && inputPrompt && (
                <div className="mt-3 p-3 bg-zinc-900 border border-orange-500 rounded-2xl shadow-lg animate-fade-in">
                  <div className="flex items-center gap-1.5 text-orange-400 font-bold text-xs mb-2">
                    <span className="animate-ping text-orange-400">●</span>
                    <span>Entrez la valeur pour {inputPrompt.varName} :</span>
                  </div>
                  <form onSubmit={handleInputSubmit} className="flex gap-2">
                    <input
                      ref={inputRef}
                      type="text"
                      value={inputValue}
                      onChange={(e) => setInputValue(e.target.value)}
                      placeholder={`Valeur pour ${inputPrompt.varName}...`}
                      className="flex-1 bg-black text-white px-3.5 py-1.5 rounded-full border border-zinc-700 focus:border-orange-500 outline-none font-mono text-xs"
                      autoFocus
                    />
                    <button
                      type="submit"
                      className="px-4 py-1.5 rounded-full bg-orange-500 text-white font-bold hover:bg-orange-600 transition text-xs flex items-center gap-1 shadow-sm"
                    >
                      <span>Valider</span>
                      <Send className="w-3 h-3" />
                    </button>
                  </form>
                </div>
              )}

              <div ref={terminalEndRef} />
            </div>
          </div>
        </div>
      </div>

      {/* Tester Rating Footer */}
      {currentId && (
        <div className="bg-white border-t border-zinc-200 p-4 shadow-xs">
          <div className="max-w-4xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
            <div>
              <h4 className="font-bold text-sm text-zinc-900 flex items-center gap-1.5">
                <Star className="w-4 h-4 text-orange-500 fill-orange-500" />
                <span>Noter cet algorithme</span>
              </h4>
              <p className="text-xs text-zinc-500">
                Votre évaluation actualise le classement officiel en temps réel.
              </p>
            </div>

            {ratingSubmitted ? (
              <div className="flex items-center gap-2 bg-orange-50 text-orange-700 border border-orange-200 px-4 py-2 rounded-full text-xs font-bold">
                <CheckCircle2 className="w-4 h-4 text-orange-600" />
                <span>Note enregistrée avec succès !</span>
              </div>
            ) : (
              <form onSubmit={handleSubmitRating} className="flex flex-wrap items-center gap-2">
                {/* 1-5 Stars */}
                <div className="flex items-center bg-zinc-100 px-2 py-1 rounded-full">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setUserRating(star)}
                      className="p-1 hover:scale-110 transition-transform"
                    >
                      <Star
                        className={`w-4 h-4 ${
                          star <= userRating
                            ? 'text-orange-500 fill-orange-500'
                            : 'text-zinc-300'
                        }`}
                      />
                    </button>
                  ))}
                  <span className="text-xs font-bold px-1.5 text-orange-600">
                    {userRating}/5
                  </span>
                </div>

                <input
                  type="text"
                  value={ratingComment}
                  onChange={(e) => setRatingComment(e.target.value)}
                  placeholder="Avis rapide (optionnel)..."
                  className="bg-zinc-100 border border-zinc-200 rounded-full px-3 py-1.5 text-xs text-zinc-800 focus:border-orange-500 outline-none w-48"
                />

                <button
                  type="submit"
                  disabled={isSubmittingRating}
                  className="px-4 py-1.5 rounded-full bg-orange-500 hover:bg-orange-600 disabled:opacity-50 text-white text-xs font-bold transition shadow-sm shadow-orange-500/25 cursor-pointer"
                >
                  {isSubmittingRating ? 'Envoi...' : 'Envoyer la note'}
                </button>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
