import React, { useEffect, useRef } from 'react';
import { ParsedAlgorithm } from '../types/algobox';

interface AlgoBoxCodeTreeProps {
  parsed: ParsedAlgorithm | null;
  activeLine: number | null;
}

// AlgoBox reserved keywords
const KEYWORDS = new Set([
  'VARIABLES',
  'DEBUT_ALGORITHME',
  'FIN_ALGORITHME',
  'EST_DU_TYPE',
  'NOMBRE',
  'CHAINE',
  'LISTE',
  'LIRE',
  'AFFICHER',
  'AFFICHER*',
  'PREND_LA_VALEUR',
  'SI',
  'ALORS',
  'SINON',
  'DEBUT_SI',
  'FIN_SI',
  'DEBUT_SINON',
  'FIN_SINON',
  'POUR',
  'ALLANT_DE',
  'A',
  'PAS',
  'FAIRE',
  'DEBUT_POUR',
  'FIN_POUR',
  'TANT_QUE',
  'DEBUT_TANT_QUE',
  'FIN_TANT_QUE',
  'PAUSE',
]);

export const AlgoBoxCodeTree: React.FC<AlgoBoxCodeTreeProps> = ({ parsed, activeLine }) => {
  const activeLineRef = useRef<HTMLDivElement | null>(null);

  // Auto scroll active line into view smoothly
  useEffect(() => {
    if (activeLine && activeLineRef.current) {
      activeLineRef.current.scrollIntoView({
        behavior: 'smooth',
        block: 'nearest',
      });
    }
  }, [activeLine]);

  if (!parsed) {
    return (
      <div className="p-8 text-center text-zinc-400 italic font-mono text-xs">
        Aucun algorithme à afficher.
      </div>
    );
  }

  // Set of declared variable names for highlighting
  const declaredVariables = new Set(parsed.variables.map((v) => v.name));

  // Tokenize line text to apply bold to keywords and variables
  const renderHighlightedLine = (text: string, isActive: boolean) => {
    // Check if it's a comment
    if (text.trim().startsWith('//')) {
      return (
        <span className={isActive ? 'text-orange-100 italic' : 'text-zinc-400 italic'}>
          {text}
        </span>
      );
    }

    // Split keeping quotes intact
    const parts: { text: string; type: 'keyword' | 'var' | 'string' | 'number' | 'text' }[] = [];
    let remaining = text;

    while (remaining.length > 0) {
      // Check for quoted strings
      const quoteMatch = remaining.match(/^"([^"]*)"/);
      if (quoteMatch) {
        parts.push({ text: quoteMatch[0], type: 'string' });
        remaining = remaining.substring(quoteMatch[0].length);
        continue;
      }

      // Check for word tokens
      const wordMatch = remaining.match(/^[a-zA-Z0-9_]+/);
      if (wordMatch) {
        const token = wordMatch[0];
        if (KEYWORDS.has(token.toUpperCase())) {
          parts.push({ text: token, type: 'keyword' });
        } else if (declaredVariables.has(token)) {
          parts.push({ text: token, type: 'var' });
        } else if (/^\d+$/.test(token)) {
          parts.push({ text: token, type: 'number' });
        } else {
          parts.push({ text: token, type: 'text' });
        }
        remaining = remaining.substring(token.length);
        continue;
      }

      // Non-word characters (spaces, operators, parenthesis)
      parts.push({ text: remaining[0], type: 'text' });
      remaining = remaining.substring(1);
    }

    return (
      <span>
        {parts.map((part, idx) => {
          if (part.type === 'keyword') {
            return (
              <span
                key={idx}
                className={
                  isActive
                    ? 'font-black text-white underline underline-offset-2'
                    : 'font-extrabold text-blue-700 tracking-tight'
                }
              >
                {part.text}
              </span>
            );
          }
          if (part.type === 'var') {
            return (
              <span
                key={idx}
                className={
                  isActive
                    ? 'font-black text-amber-200 bg-black/25 px-1 py-0.5 rounded'
                    : 'font-bold text-orange-700 bg-orange-50 px-1 py-0.5 rounded border border-orange-200/50 shadow-2xs'
                }
              >
                {part.text}
              </span>
            );
          }
          if (part.type === 'string') {
            return (
              <span
                key={idx}
                className={
                  isActive
                    ? 'text-emerald-200 font-semibold'
                    : 'text-emerald-700 font-medium italic'
                }
              >
                {part.text}
              </span>
            );
          }
          if (part.type === 'number') {
            return (
              <span
                key={idx}
                className={
                  isActive
                    ? 'text-white font-bold'
                    : 'text-blue-600 font-semibold'
                }
              >
                {part.text}
              </span>
            );
          }
          return (
            <span
              key={idx}
              className={isActive ? 'text-white' : 'text-zinc-700'}
            >
              {part.text}
            </span>
          );
        })}
      </span>
    );
  };

  return (
    <div className="font-mono text-xs border border-zinc-200 rounded-2xl overflow-hidden bg-white shadow-xs">
      {/* AlgoBox Header Banner */}
      <div className="bg-zinc-100/90 border-b border-zinc-200 px-4 py-2 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-orange-500" />
          <span className="font-bold text-zinc-800 text-xs">Arborescence Officielle AlgoBox</span>
        </div>
        <div className="text-[11px] text-zinc-500 font-semibold">
          {parsed.rawLines.length} lignes analysées
        </div>
      </div>

      {/* Description if present */}
      {parsed.description && (
        <div className="px-4 py-2 bg-orange-50/60 border-b border-orange-100 text-zinc-700 text-xs italic">
          "{parsed.description}"
        </div>
      )}

      {/* SECTION VARIABLES */}
      <div className="bg-zinc-50 border-b border-zinc-200">
        <div className="px-4 py-2 flex items-center justify-between text-xs font-black text-blue-900 border-b border-zinc-100">
          <span className="flex items-center gap-1.5">
            <span className="text-orange-500">📁</span> VARIABLES
          </span>
          <span className="text-[11px] font-bold text-zinc-500 bg-zinc-200/70 px-2 py-0.5 rounded-full">
            {parsed.variables.length} déclarée(s)
          </span>
        </div>

        {/* Variables declarations list with linked tree guide */}
        <div className="p-3 pl-6 space-y-1 relative">
          {parsed.variables.map((v, i) => {
            const isLast = i === parsed.variables.length - 1;
            return (
              <div key={v.name} className="flex items-center gap-2 relative">
                {/* Branch connector */}
                <span className="text-zinc-300 font-mono select-none">
                  {isLast ? '└──' : '├──'}
                </span>
                <span className="font-extrabold text-orange-700 bg-orange-50 px-2 py-0.5 rounded-full border border-orange-200 text-xs">
                  {v.name}
                </span>
                <span className="font-black text-blue-800 text-[11px]">EST_DU_TYPE</span>
                <span className="font-black text-xs px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200 uppercase">
                  {v.type}
                </span>
              </div>
            );
          })}
          {parsed.variables.length === 0 && (
            <div className="text-zinc-400 italic text-xs pl-6">
              Aucune variable déclarée
            </div>
          )}
        </div>
      </div>

      {/* SECTION CORPS DE L'ALGORITHME */}
      <div>
        <div className="px-4 py-2 bg-zinc-100 text-xs font-black text-blue-900 border-y border-zinc-200 flex items-center justify-between">
          <span className="flex items-center gap-1.5">
            <span className="text-emerald-600">⚡</span> DÉBUT_ALGORITHME
          </span>
          {activeLine && (
            <span className="text-[10px] font-bold uppercase tracking-wider bg-orange-500 text-white px-2 py-0.5 rounded-full animate-pulse">
              Étape active : Ligne {activeLine}
            </span>
          )}
        </div>

        {/* Code Lines with Authentic Tree Indentation Guides */}
        <div className="p-2 space-y-0.5 bg-zinc-50/30">
          {parsed.rawLines.map((lineObj) => {
            const isActive = activeLine === lineObj.line;
            const indentLevel = Math.max(0, lineObj.indent);

            return (
              <div
                key={lineObj.line}
                ref={isActive ? activeLineRef : null}
                className={`group flex items-center py-1 px-2 rounded-xl transition-all ${
                  isActive
                    ? 'bg-orange-500 text-white shadow-md shadow-orange-500/30 ring-2 ring-orange-400 scale-[1.005] z-10'
                    : 'hover:bg-zinc-100/80 text-zinc-800'
                }`}
              >
                {/* Line number */}
                <div
                  className={`w-8 shrink-0 text-right pr-2.5 font-mono select-none text-[11px] ${
                    isActive ? 'text-white font-bold' : 'text-zinc-400 group-hover:text-zinc-600'
                  }`}
                >
                  {lineObj.line}
                </div>

                {/* Active marker indicator */}
                <div className="w-5 shrink-0 text-center font-bold">
                  {isActive ? (
                    <span className="text-white text-xs animate-pulse">▶</span>
                  ) : (
                    <span className="text-transparent group-hover:text-zinc-300 text-[10px]">•</span>
                  )}
                </div>

                {/* Indented scope container with authentic linked vertical guides */}
                <div className="flex items-center flex-1 overflow-x-auto py-0.5">
                  {Array.from({ length: indentLevel }).map((_, idx) => (
                    <span
                      key={idx}
                      className={`inline-block w-4 shrink-0 text-center select-none ${
                        isActive ? 'text-white/40' : 'text-zinc-300 font-light'
                      }`}
                    >
                      │
                    </span>
                  ))}
                  {indentLevel > 0 && (
                    <span
                      className={`inline-block mr-1 text-xs select-none ${
                        isActive ? 'text-white/70' : 'text-zinc-300'
                      }`}
                    >
                      ├──
                    </span>
                  )}

                  {/* Highlighted text */}
                  <span className="inline-block whitespace-pre">
                    {renderHighlightedLine(lineObj.text, isActive)}
                  </span>
                </div>
              </div>
            );
          })}

          {parsed.rawLines.length === 0 && (
            <div className="p-4 text-center text-zinc-400 italic text-xs">
              Algorithme vide
            </div>
          )}
        </div>

        {/* SECTION FIN_ALGORITHME */}
        <div className="px-4 py-2 bg-zinc-100 text-xs font-black text-blue-900 border-t border-zinc-200 flex items-center justify-between">
          <span className="flex items-center gap-1.5">
            <span className="text-red-500">🛑</span> FIN_ALGORITHME
          </span>
          <span className="text-[11px] text-zinc-400 italic">Fin du flux d'exécution</span>
        </div>
      </div>
    </div>
  );
};
