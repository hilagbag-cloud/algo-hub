import React, { useState } from 'react';
import { Play, Heart, Star, MessageSquare } from 'lucide-react';
import { AlgorithmDoc, UserProfile } from '../types/algobox';
import { toggleLikeAlgorithm } from '../lib/firestoreService';

interface AlgorithmCardProps {
  algorithm: AlgorithmDoc;
  userProfile: UserProfile;
  onSelectForRun: (algo: AlgorithmDoc) => void;
  onOpenComments: (algo: AlgorithmDoc) => void;
  onAuthorClick?: (author: string) => void;
}

export const AlgorithmCard: React.FC<AlgorithmCardProps> = ({
  algorithm,
  userProfile,
  onSelectForRun,
  onOpenComments,
  onAuthorClick,
}) => {
  const isLiked = Array.isArray(algorithm.likedBy) && algorithm.likedBy.includes(userProfile.uid);
  const [likeState, setLikeState] = useState(isLiked);
  const [likesCount, setLikesCount] = useState(algorithm.likesCount || 0);

  const handleLike = async (e: React.MouseEvent) => {
    e.stopPropagation();
    const newLiked = !likeState;
    setLikeState(newLiked);
    setLikesCount((prev) => (newLiked ? prev + 1 : Math.max(0, prev - 1)));
    await toggleLikeAlgorithm(algorithm.id, userProfile.uid, likeState);
  };

  return (
    <div
      id={`algo-card-${algorithm.id}`}
      className="bg-white border border-zinc-200 hover:border-orange-300 rounded-2xl p-5 flex flex-col justify-between transition-all duration-200 shadow-2xs hover:shadow-md hover:-translate-y-0.5 group"
    >
      <div>
        {/* Top Header */}
        <div className="flex items-start justify-between gap-3 mb-2">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-orange-50 text-orange-700 border border-orange-200">
              {algorithm.category || 'Général'}
            </span>
            <h3 className="text-base font-extrabold text-zinc-900 group-hover:text-orange-600 transition-colors tracking-tight mt-1.5 line-clamp-1">
              {algorithm.title}
            </h3>
          </div>

          <button
            onClick={handleLike}
            className={`p-2 rounded-full transition-all flex items-center gap-1 text-xs font-bold ${
              likeState
                ? 'bg-orange-50 text-orange-600 border border-orange-200'
                : 'bg-zinc-50 text-zinc-500 hover:bg-orange-50 hover:text-orange-600 border border-zinc-200'
            }`}
            title="J'aime"
          >
            <Heart className={`w-3.5 h-3.5 ${likeState ? 'fill-orange-500 text-orange-500' : ''}`} />
            <span>{likesCount}</span>
          </button>
        </div>

        {/* Description */}
        <p className="text-xs text-zinc-600 line-clamp-2 mb-3 leading-relaxed">
          {algorithm.description || 'Aucune description fournie.'}
        </p>

        {/* Tags */}
        {algorithm.tags && algorithm.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-4">
            {algorithm.tags.slice(0, 3).map((tag, i) => (
              <span
                key={i}
                className="text-[10px] font-medium text-zinc-600 bg-zinc-100 px-2 py-0.5 rounded-full"
              >
                #{tag}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Footer Meta & Actions */}
      <div className="pt-3 border-t border-zinc-100">
        <div className="flex items-center justify-between mb-3 text-xs">
          {onAuthorClick ? (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onAuthorClick(algorithm.authorName);
              }}
              className="text-zinc-600 hover:text-orange-600 font-bold truncate max-w-[130px] hover:underline text-left cursor-pointer transition"
              title="Voir le profil"
            >
              {algorithm.authorName.startsWith('@') ? algorithm.authorName : `@${algorithm.authorName}`}
            </button>
          ) : (
            <span className="text-zinc-500 font-medium truncate max-w-[120px]">
              {algorithm.authorName}
            </span>
          )}

          <div className="flex items-center gap-2 font-bold text-zinc-800">
            <Star className="w-3.5 h-3.5 fill-orange-500 text-orange-500" />
            <span>{algorithm.averageRating ? algorithm.averageRating.toFixed(1) : '5.0'}</span>
            <span className="text-[11px] text-zinc-400 font-normal">
              ({algorithm.ratingsCount || 0} avis)
            </span>
          </div>
        </div>

        {/* Rounded Action Buttons */}
        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={() => onSelectForRun(algorithm)}
            className="flex items-center justify-center gap-1.5 py-2 px-3 rounded-full bg-orange-500 hover:bg-orange-600 text-white text-xs font-bold transition shadow-xs shadow-orange-500/20 hover:scale-102 cursor-pointer"
          >
            <Play className="w-3.5 h-3.5 fill-white" />
            <span>Tester en direct</span>
          </button>

          <button
            onClick={() => onOpenComments(algorithm)}
            className="flex items-center justify-center gap-1.5 py-2 px-3 rounded-full bg-zinc-100 text-zinc-700 hover:bg-zinc-200 text-xs font-semibold transition cursor-pointer"
          >
            <MessageSquare className="w-3.5 h-3.5 text-zinc-500" />
            <span>Avis</span>
          </button>
        </div>
      </div>
    </div>
  );
};
