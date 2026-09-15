import React from 'react';
import {
  Activity,
  CheckCircle2,
  Clock,
  Layers,
  ArrowRight,
  AlertTriangle,
  Play,
  RotateCcw,
} from 'lucide-react';
import { ExecutionStatus, ExecutionSummary, WorkflowStepEvent } from '../types/algobox';

interface AlgoWorkflowTrackerProps {
  status: ExecutionStatus;
  activeLine: number | null;
  currentStep: WorkflowStepEvent | null;
  stepHistory: WorkflowStepEvent[];
  summary: ExecutionSummary | null;
  onReset: () => void;
  onRun: () => void;
}

export const AlgoWorkflowTracker: React.FC<AlgoWorkflowTrackerProps> = ({
  status,
  activeLine,
  currentStep,
  stepHistory,
  summary,
  onReset,
  onRun,
}) => {
  return (
    <div className="bg-white border border-zinc-200 rounded-2xl shadow-xs overflow-hidden">
      {/* Workflow Tracker Header */}
      <div className="bg-gradient-to-r from-orange-500/10 via-amber-500/10 to-transparent p-3.5 border-b border-orange-100 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-full bg-orange-500 text-white flex items-center justify-center font-bold shadow-xs">
            <Activity className="w-3.5 h-3.5 animate-pulse" />
          </div>
          <div>
            <h3 className="font-extrabold text-xs text-zinc-900 tracking-tight flex items-center gap-1.5">
              <span>Suivi Minutieux du Workflow</span>
              {currentStep && (
                <span className="text-[10px] font-mono font-bold bg-orange-100 text-orange-800 px-2 py-0.2 rounded-full">
                  Étape #{currentStep.stepNumber}
                </span>
              )}
            </h3>
            <p className="text-[11px] text-zinc-500">
              Traçabilité instruction par instruction jusqu'à l'arrêt
            </p>
          </div>
        </div>

        {/* Status Pill */}
        <div className="flex items-center gap-1">
          {status === 'running' && (
            <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-orange-500 text-white shadow-xs animate-pulse">
              <span className="w-2 h-2 rounded-full bg-white animate-ping" />
              <span>En cours...</span>
            </span>
          )}
          {status === 'waiting_input' && (
            <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-blue-500 text-white shadow-xs">
              <span className="w-2 h-2 rounded-full bg-white animate-bounce" />
              <span>Saisie attendue</span>
            </span>
          )}
          {status === 'paused' && (
            <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-amber-500 text-white shadow-xs">
              <span>En pause</span>
            </span>
          )}
          {status === 'completed' && (
            <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-emerald-600 text-white shadow-xs">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Terminé</span>
            </span>
          )}
          {status === 'error' && (
            <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-red-600 text-white shadow-xs">
              <AlertTriangle className="w-3.5 h-3.5" />
              <span>Erreur</span>
            </span>
          )}
          {status === 'idle' && (
            <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium bg-zinc-100 text-zinc-600 border border-zinc-200">
              <span>En attente</span>
            </span>
          )}
        </div>
      </div>

      {/* Completion Summary Card if done */}
      {status === 'completed' && summary && (
        <div className="p-4 bg-emerald-50 border-b border-emerald-200 animate-fade-in">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-2">
              <div className="w-9 h-9 rounded-full bg-emerald-600 text-white flex items-center justify-center font-bold shadow-sm">
                <CheckCircle2 className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-extrabold text-sm text-emerald-950">
                  *** Algorithme terminé avec succès ***
                </h4>
                <p className="text-xs text-emerald-700">
                  L'ensemble des branches et instructions ont été exécutées jusqu'à la fin.
                </p>
              </div>
            </div>

            <button
              onClick={onRun}
              className="flex items-center gap-1 px-3.5 py-1.5 rounded-full bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition shadow-xs cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Relancer</span>
            </button>
          </div>

          <div className="mt-3 grid grid-cols-3 gap-2 pt-2 border-t border-emerald-200/60 font-mono text-xs">
            <div className="bg-white/80 p-2 rounded-xl border border-emerald-100">
              <span className="text-[10px] text-emerald-700 font-sans block">Étapes validées</span>
              <span className="font-black text-sm text-emerald-950">{summary.totalSteps}</span>
            </div>
            <div className="bg-white/80 p-2 rounded-xl border border-emerald-100">
              <span className="text-[10px] text-emerald-700 font-sans block">Durée d'exécution</span>
              <span className="font-black text-sm text-emerald-950">{summary.durationMs} ms</span>
            </div>
            <div className="bg-white/80 p-2 rounded-xl border border-emerald-100">
              <span className="text-[10px] text-emerald-700 font-sans block">Sorties terminal</span>
              <span className="font-black text-sm text-emerald-950">{summary.outputsCount}</span>
            </div>
          </div>
        </div>
      )}

      {/* Current Step Focus Box */}
      {currentStep && status !== 'completed' && (
        <div className="p-3 bg-zinc-50 border-b border-zinc-200">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider flex items-center gap-1">
              <Layers className="w-3 h-3 text-orange-500" /> Action en cours
            </span>
            <span className="font-mono text-[11px] font-bold text-orange-600 bg-orange-100/70 px-2 py-0.5 rounded-full">
              Ligne {currentStep.line}
            </span>
          </div>

          <div className="bg-white p-2.5 rounded-xl border border-orange-200 shadow-2xs">
            <div className="font-mono text-xs font-black text-zinc-900 mb-1 flex items-center gap-1.5">
              <span className="text-orange-500">▶</span>
              <span>{currentStep.rawCommand}</span>
            </div>
            <div className="text-xs text-zinc-600 flex items-center gap-1.5">
              <ArrowRight className="w-3 h-3 text-orange-400 shrink-0" />
              <span>{currentStep.explanation}</span>
            </div>
          </div>
        </div>
      )}

      {/* Workflow Steps Recent Timeline */}
      <div className="p-3">
        <div className="flex items-center justify-between mb-2">
          <span className="text-[11px] font-bold text-zinc-700 flex items-center gap-1">
            <Clock className="w-3 h-3 text-zinc-400" />
            <span>Historique récent des étapes</span>
          </span>
          <span className="text-[10px] text-zinc-400 font-mono">
            {stepHistory.length} passée(s)
          </span>
        </div>

        {stepHistory.length === 0 ? (
          <div className="text-center py-4 text-xs text-zinc-400 italic">
            Lancez l'algorithme ou avancez en "Pas à pas" pour observer le déroulement détaillé.
          </div>
        ) : (
          <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
            {stepHistory.slice(-5).reverse().map((step) => (
              <div
                key={step.stepNumber}
                className="flex items-center justify-between p-2 rounded-xl bg-zinc-50 hover:bg-zinc-100/80 border border-zinc-200/70 text-xs transition"
              >
                <div className="flex items-center gap-2 overflow-hidden">
                  <span className="font-mono text-[10px] font-bold text-zinc-500 bg-zinc-200/80 px-1.5 py-0.5 rounded shrink-0">
                    #{step.stepNumber}
                  </span>
                  <span className="font-mono text-[11px] font-semibold text-zinc-900 truncate">
                    {step.rawCommand}
                  </span>
                </div>

                <div className="flex items-center gap-1.5 shrink-0 ml-2">
                  {step.variableChanged && (
                    <span className="font-mono text-[10px] font-bold text-orange-700 bg-orange-100 px-1.5 py-0.5 rounded-full">
                      {step.variableChanged.name} = {String(step.variableChanged.value)}
                    </span>
                  )}
                  <span className="text-[10px] font-mono text-zinc-400">
                    L.{step.line}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
