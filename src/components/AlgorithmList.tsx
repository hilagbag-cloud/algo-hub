import React, { useState, useMemo } from 'react';
import { Search, Plus, Play, Zap, Star } from 'lucide-react';
import { AlgorithmDoc, UserProfile } from '../types/algobox';
import { AlgorithmCard } from './AlgorithmCard';
import { SAMPLE_ALGORITHMS } from '../lib/sampleAlgorithms';

interface AlgorithmListProps {
  algorithms: AlgorithmDoc[];
  userProfile: UserProfile;
  onSelectForRun: (algo: AlgorithmDoc) => void;
  onOpenComments: (algo: AlgorithmDoc) => void;
  onOpenUpload: () => void;
  onAuthorClick?: (author: string) => void;
}

export const AlgorithmList: React.FC<AlgorithmListProps> = ({
  algorithms,
  userProfile,
  onSelectForRun,
  onOpenComments,
  onOpenUpload,
  onAuthorClick,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('Tous');
  const [sortBy, setSortBy] = useState<'rating' | 'tests' | 'recent'>('rating');

  const categories = useMemo(() => {
    const set = new Set<string>();
    algorithms.forEach((a) => {
      if (a.category) set.add(a.category);
    });
    return ['Tous', ...Array.from(set)];
  }, [algorithms]);

  const filteredAlgorithms = useMemo(() => {
    return algorithms
      .filter((algo) => {
        const matchesCat = selectedCategory === 'Tous' || algo.category === selectedCategory;
        const q = searchQuery.toLowerCase().trim();
        const matchesQuery =
          !q ||
          algo.title.toLowerCase().includes(q) ||
          algo.description.toLowerCase().includes(q) ||
          algo.authorName.toLowerCase().includes(q) ||
          (algo.tags && algo.tags.some((t) => t.toLowerCase().includes(q)));
        return matchesCat && matchesQuery;
      })
      .sort((a, b) => {
        if (sortBy === 'rating') {
          if (b.averageRating !== a.averageRating) return (b.averageRating || 0) - (a.averageRating || 0);
          return (b.ratingsCount || 0) - (a.ratingsCount || 0);
        }
        if (sortBy === 'tests') {
          return (b.testsCount || 0) - (a.testsCount || 0);
        }
        return b.createdAt - a.createdAt;
      });
  }, [algorithms, searchQuery, selectedCategory, sortBy]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Warm Orange Hero - Quick Start & Clear Value */}
      <div className="bg-gradient-to-r from-orange-500 via-orange-600 to-amber-500 text-white rounded-3xl p-6 sm:p-8 mb-8 shadow-lg shadow-orange-500/15 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="max-w-2xl">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/20 backdrop-blur-xs text-xs font-bold mb-3">
            <Zap className="w-3.5 h-3.5 fill-white" />
            <span>Prise en main en 1 clic</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight mb-2">
            Testez et partagez des algorithmes AlgoBox
          </h1>
          <p className="text-orange-100 text-sm leading-relaxed max-w-xl">
            Exécutez n'importe quel fichier .alg directement dans votre navigateur, observez les variables en direct et attribuez votre note.
          </p>

          {/* Quick Start Buttons */}
          <div className="mt-4 flex flex-wrap items-center gap-2">
            <span className="text-xs font-bold text-orange-200">Essayer :</span>
            {SAMPLE_ALGORITHMS.slice(0, 3).map((sample) => (
              <button
                key={sample.id}
                onClick={() => {
                  const matching = algorithms.find((a) => a.id === sample.id);
                  onSelectForRun(
                    matching || {
                      ...sample,
                      authorId: 'seed',
                      likedBy: [],
                    }
                  );
                }}
                className="px-3 py-1 rounded-full bg-white text-orange-700 hover:bg-orange-50 text-xs font-bold transition shadow-xs flex items-center gap-1"
              >
                <Play className="w-3 h-3 fill-orange-600 text-orange-600" />
                <span>{sample.title}</span>
              </button>
            ))}
          </div>
        </div>

        <button
          onClick={onOpenUpload}
          className="px-5 py-2.5 rounded-full bg-zinc-950 hover:bg-black text-white text-xs font-black transition shadow-md flex items-center gap-2 shrink-0 hover:scale-102"
        >
          <Plus className="w-4 h-4 stroke-[3]" />
          <span>Publier un algorithme</span>
        </button>
      </div>

      {/* Filter and Search Bar with Rounded-Full Elements */}
      <div className="space-y-3 mb-8">
        <div className="flex flex-col md:flex-row items-center justify-between gap-3">
          {/* Rounded Search Input */}
          <div className="relative w-full md:w-96">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-orange-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Rechercher par nom, auteur, mot-clé..."
              className="w-full pl-10 pr-4 py-2 bg-white border border-zinc-200 rounded-full text-xs sm:text-sm text-zinc-900 placeholder-zinc-400 focus:border-orange-500 focus:ring-2 focus:ring-orange-100 outline-none transition"
            />
          </div>

          {/* Rounded Sort Selector */}
          <div className="flex items-center gap-2 w-full md:w-auto justify-end">
            <select
              value={sortBy}
              onChange={(e: any) => setSortBy(e.target.value)}
              className="bg-white border border-zinc-200 text-zinc-800 px-4 py-2 rounded-full text-xs font-bold outline-none cursor-pointer hover:border-orange-400"
            >
              <option value="rating">★ Mieux notés</option>
              <option value="tests">⚡ Plus testés</option>
              <option value="recent">⏱ Plus récents</option>
            </select>
          </div>
        </div>

        {/* Rounded Category Chips */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3.5 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-all ${
                selectedCategory === cat
                  ? 'bg-orange-500 text-white shadow-xs shadow-orange-500/20'
                  : 'bg-zinc-100 text-zinc-600 hover:bg-orange-50 hover:text-orange-700'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Grid of Cards */}
      {filteredAlgorithms.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredAlgorithms.map((algo) => (
            <AlgorithmCard
              key={algo.id}
              algorithm={algo}
              userProfile={userProfile}
              onSelectForRun={onSelectForRun}
              onOpenComments={onOpenComments}
              onAuthorClick={onAuthorClick}
            />
          ))}
        </div>
      ) : (
        <div className="text-center py-16 px-4 bg-white border border-zinc-200 rounded-2xl shadow-2xs">
          <p className="text-sm font-bold text-zinc-800 mb-2">Aucun algorithme trouvé</p>
          <button
            onClick={() => {
              setSearchQuery('');
              setSelectedCategory('Tous');
            }}
            className="px-4 py-2 rounded-full bg-orange-500 text-white text-xs font-bold hover:bg-orange-600 transition"
          >
            Réinitialiser
          </button>
        </div>
      )}
    </div>
  );
};
