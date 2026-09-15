import React, { useMemo } from 'react';
import { Trophy, Play, Star, Users } from 'lucide-react';
import { AlgorithmDoc, UserProfile } from '../types/algobox';

interface LeaderboardProps {
  algorithms: AlgorithmDoc[];
  userProfile: UserProfile;
  onSelectForRun: (algo: AlgorithmDoc) => void;
  onAuthorClick?: (author: string) => void;
}

export const Leaderboard: React.FC<LeaderboardProps> = ({
  algorithms,
  userProfile,
  onSelectForRun,
  onAuthorClick,
}) => {
  const rankedAlgorithms = useMemo(() => {
    return [...algorithms]
      .map((algo) => {
        const ratingPart = algo.averageRating ? (algo.averageRating / 5) * 70 : 35;
        const testsPart = Math.min(algo.testsCount || 0, 100) * 0.2;
        const likesPart = Math.min(algo.likesCount || 0, 50) * 0.2;
        const officialScore = Math.round(ratingPart + testsPart + likesPart);
        return {
          ...algo,
          officialScore,
        };
      })
      .sort((a, b) => {
        if (b.officialScore !== a.officialScore) return b.officialScore - a.officialScore;
        return (b.averageRating || 0) - (a.averageRating || 0);
      });
  }, [algorithms]);

  const top1 = rankedAlgorithms[0];
  const top2 = rankedAlgorithms[1];
  const top3 = rankedAlgorithms[2];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-orange-100 text-orange-800 text-xs font-bold mb-2">
          <Trophy className="w-3.5 h-3.5 text-orange-600" />
          <span>Classement Officiel en Direct</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-zinc-900">
          Palmarès des Meilleurs Algorithmes
        </h1>
        <p className="text-sm text-zinc-600 mt-1">
          Basé sur les notes des testeurs, la robustesse aux tests et les recommandations.
        </p>
      </div>

      {/* Top 3 Podium */}
      {rankedAlgorithms.length >= 3 && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12 items-end">
          {/* 2nd Place */}
          <div className="order-2 md:order-1 bg-white border border-zinc-200 rounded-3xl p-6 text-center shadow-xs">
            <div className="w-10 h-10 rounded-full bg-zinc-100 text-zinc-700 font-extrabold text-sm flex items-center justify-center mx-auto mb-3">
              🥈 2
            </div>
            <h3 className="font-extrabold text-base text-zinc-900 mb-1 line-clamp-1">
              {top2.title}
            </h3>
            <p className="text-xs text-zinc-500 mb-3">
              par{' '}
              {onAuthorClick ? (
                <button
                  onClick={() => onAuthorClick(top2.authorName)}
                  className="font-bold text-orange-600 hover:underline cursor-pointer"
                >
                  {top2.authorName.startsWith('@') ? top2.authorName : `@${top2.authorName}`}
                </button>
              ) : (
                top2.authorName
              )}
            </p>
            <div className="inline-flex items-center gap-1.5 font-bold text-base text-zinc-900 bg-orange-50/60 px-3.5 py-1 rounded-full border border-orange-200 mb-4">
              <Star className="w-4 h-4 fill-orange-500 text-orange-500" />
              <span>{top2.averageRating ? top2.averageRating.toFixed(1) : '5.0'}</span>
              <span className="text-xs text-orange-700 font-semibold">({top2.officialScore} pts)</span>
            </div>
            <button
              onClick={() => onSelectForRun(top2)}
              className="w-full flex items-center justify-center gap-2 py-2 px-4 rounded-full bg-zinc-900 hover:bg-black text-white text-xs font-bold transition"
            >
              <Play className="w-3.5 h-3.5 fill-white" />
              <span>Tester l'algo</span>
            </button>
          </div>

          {/* 1st Place - Champion Orange */}
          <div className="order-1 md:order-2 bg-gradient-to-b from-orange-500 to-orange-600 text-white rounded-3xl p-8 text-center shadow-xl shadow-orange-500/20 relative -translate-y-2">
            <div className="w-12 h-12 rounded-full bg-white text-orange-600 font-black text-lg flex items-center justify-center mx-auto mb-3 shadow-md">
              🥇 1
            </div>
            <span className="text-[10px] font-bold uppercase tracking-widest px-3 py-1 rounded-full bg-white/20 text-white">
              Grand Vainqueur
            </span>
            <h3 className="font-black text-xl text-white mt-3 mb-1 line-clamp-1">
              {top1.title}
            </h3>
            <p className="text-xs text-orange-100 mb-4">
              par{' '}
              {onAuthorClick ? (
                <button
                  onClick={() => onAuthorClick(top1.authorName)}
                  className="font-bold text-white underline decoration-white/70 hover:decoration-white cursor-pointer"
                >
                  {top1.authorName.startsWith('@') ? top1.authorName : `@${top1.authorName}`}
                </button>
              ) : (
                top1.authorName
              )}
            </p>
            <div className="inline-flex items-center gap-2 font-black text-2xl text-orange-600 bg-white px-5 py-1.5 rounded-full shadow-md mb-5">
              <Star className="w-5 h-5 fill-orange-500 text-orange-500" />
              <span>{top1.averageRating ? top1.averageRating.toFixed(1) : '5.0'}</span>
              <span className="text-xs text-zinc-500 font-semibold">({top1.officialScore} pts)</span>
            </div>
            <button
              onClick={() => onSelectForRun(top1)}
              className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-full bg-zinc-950 hover:bg-black text-white text-xs font-black transition shadow-md"
            >
              <Play className="w-4 h-4 fill-white" />
              <span>Tester le champion</span>
            </button>
          </div>

          {/* 3rd Place */}
          <div className="order-3 bg-white border border-zinc-200 rounded-3xl p-6 text-center shadow-xs">
            <div className="w-10 h-10 rounded-full bg-zinc-100 text-zinc-700 font-extrabold text-sm flex items-center justify-center mx-auto mb-3">
              🥉 3
            </div>
            <h3 className="font-extrabold text-base text-zinc-900 mb-1 line-clamp-1">
              {top3.title}
            </h3>
            <p className="text-xs text-zinc-500 mb-3">
              par{' '}
              {onAuthorClick ? (
                <button
                  onClick={() => onAuthorClick(top3.authorName)}
                  className="font-bold text-orange-600 hover:underline cursor-pointer"
                >
                  {top3.authorName.startsWith('@') ? top3.authorName : `@${top3.authorName}`}
                </button>
              ) : (
                top3.authorName
              )}
            </p>
            <div className="inline-flex items-center gap-1.5 font-bold text-base text-zinc-900 bg-orange-50/60 px-3.5 py-1 rounded-full border border-orange-200 mb-4">
              <Star className="w-4 h-4 fill-orange-500 text-orange-500" />
              <span>{top3.averageRating ? top3.averageRating.toFixed(1) : '5.0'}</span>
              <span className="text-xs text-orange-700 font-semibold">({top3.officialScore} pts)</span>
            </div>
            <button
              onClick={() => onSelectForRun(top3)}
              className="w-full flex items-center justify-center gap-2 py-2 px-4 rounded-full bg-zinc-900 hover:bg-black text-white text-xs font-bold transition"
            >
              <Play className="w-3.5 h-3.5 fill-white" />
              <span>Tester l'algo</span>
            </button>
          </div>
        </div>
      )}

      {/* Main Ranking Table */}
      <div className="bg-white border border-zinc-200 rounded-3xl overflow-hidden shadow-2xs">
        <div className="px-6 py-4 bg-zinc-50 border-b border-zinc-200 flex items-center justify-between">
          <h2 className="font-extrabold text-sm text-zinc-900">
            Tous les Algorithmes Classés
          </h2>
          <span className="text-xs text-orange-600 font-bold">
            Mise à jour instantanée
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-zinc-100/70 text-zinc-600 font-bold uppercase text-[11px] border-b border-zinc-200">
              <tr>
                <th className="py-3 px-4 w-12 text-center">Rang</th>
                <th className="py-3 px-4">Algorithme</th>
                <th className="py-3 px-4">Auteur</th>
                <th className="py-3 px-4 text-center">Note</th>
                <th className="py-3 px-4 text-center">Tests</th>
                <th className="py-3 px-4 text-center">Score</th>
                <th className="py-3 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {rankedAlgorithms.map((algo, index) => (
                <tr key={algo.id} className="hover:bg-orange-50/40 transition-colors">
                  <td className="py-3.5 px-4 text-center font-black">
                    {index === 0 && <span className="text-orange-600">🥇 1</span>}
                    {index === 1 && <span className="text-zinc-600">🥈 2</span>}
                    {index === 2 && <span className="text-amber-700">🥉 3</span>}
                    {index > 2 && <span className="text-zinc-400 font-medium">#{index + 1}</span>}
                  </td>
                  <td className="py-3.5 px-4">
                    <div
                      className="font-bold text-zinc-900 hover:text-orange-600 cursor-pointer"
                      onClick={() => onSelectForRun(algo)}
                    >
                      {algo.title}
                    </div>
                    <div className="text-[11px] text-zinc-400">{algo.category || 'Général'}</div>
                  </td>
                  <td className="py-3.5 px-4 text-zinc-600">
                    {onAuthorClick ? (
                      <button
                        onClick={() => onAuthorClick(algo.authorName)}
                        className="font-bold text-zinc-800 hover:text-orange-600 hover:underline cursor-pointer"
                      >
                        {algo.authorName.startsWith('@') ? algo.authorName : `@${algo.authorName}`}
                      </button>
                    ) : (
                      algo.authorName
                    )}
                  </td>
                  <td className="py-3.5 px-4 text-center font-bold text-zinc-900">
                    <div className="inline-flex items-center gap-1">
                      <Star className="w-3.5 h-3.5 fill-orange-500 text-orange-500" />
                      <span>{algo.averageRating ? algo.averageRating.toFixed(1) : '5.0'}</span>
                    </div>
                  </td>
                  <td className="py-3.5 px-4 text-center text-zinc-600 font-medium">
                    {algo.testsCount || 0}
                  </td>
                  <td className="py-3.5 px-4 text-center">
                    <span className="px-2.5 py-1 rounded-full bg-orange-100 text-orange-700 font-extrabold text-xs">
                      {algo.officialScore} pts
                    </span>
                  </td>
                  <td className="py-3.5 px-4 text-right">
                    <button
                      onClick={() => onSelectForRun(algo)}
                      className="px-3 py-1.5 rounded-full bg-orange-500 hover:bg-orange-600 text-white transition inline-flex items-center gap-1 text-xs font-bold shadow-xs cursor-pointer"
                    >
                      <Play className="w-3 h-3 fill-white" />
                      <span>Tester</span>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
