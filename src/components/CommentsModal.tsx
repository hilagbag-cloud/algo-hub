import React, { useState, useEffect } from 'react';
import { X, MessageSquare, Star, Send, CheckCircle2 } from 'lucide-react';
import { AlgorithmDoc, CommentDoc, RatingDoc, UserProfile } from '../types/algobox';
import { addComment, subscribeComments, subscribeRatings } from '../lib/firestoreService';

interface CommentsModalProps {
  algorithm: AlgorithmDoc | null;
  isOpen: boolean;
  onClose: () => void;
  userProfile: UserProfile;
}

export const CommentsModal: React.FC<CommentsModalProps> = ({
  algorithm,
  isOpen,
  onClose,
  userProfile,
}) => {
  const [activeTab, setActiveTab] = useState<'ratings' | 'comments'>('ratings');
  const [comments, setComments] = useState<CommentDoc[]>([]);
  const [ratings, setRatings] = useState<RatingDoc[]>([]);
  const [newComment, setNewComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!algorithm || !isOpen) return;

    const unsubComments = subscribeComments(algorithm.id, (c) => setComments(c));
    const unsubRatings = subscribeRatings(algorithm.id, (r) => setRatings(r));

    return () => {
      unsubComments();
      unsubRatings();
    };
  }, [algorithm, isOpen]);

  if (!isOpen || !algorithm) return null;

  const handleSendComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim()) return;
    setIsSubmitting(true);
    try {
      await addComment(algorithm.id, newComment.trim(), {
        id: userProfile.uid,
        name: userProfile.displayName,
        avatar: userProfile.avatarIcon,
      });
      setNewComment('');
    } catch (err) {
      console.error('Failed to post comment:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
      <div className="bg-white text-zinc-900 rounded-3xl max-w-lg w-full max-h-[85vh] flex flex-col shadow-2xl border border-orange-100 overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 bg-orange-500 text-white flex items-center justify-between">
          <div>
            <h3 className="font-extrabold text-base text-white line-clamp-1">{algorithm.title}</h3>
            <p className="text-xs text-orange-100">Avis des testeurs & Discussions</p>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-full hover:bg-white/20 transition text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab switch */}
        <div className="flex border-b border-zinc-100 bg-zinc-50 p-1.5 gap-1">
          <button
            onClick={() => setActiveTab('ratings')}
            className={`flex-1 py-2 text-xs font-bold rounded-full transition flex items-center justify-center gap-1.5 ${
              activeTab === 'ratings'
                ? 'bg-white text-orange-600 shadow-xs'
                : 'text-zinc-500 hover:text-zinc-800'
            }`}
          >
            <Star className="w-3.5 h-3.5 fill-orange-500 text-orange-500" />
            <span>Notes des testeurs ({ratings.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('comments')}
            className={`flex-1 py-2 text-xs font-bold rounded-full transition flex items-center justify-center gap-1.5 ${
              activeTab === 'comments'
                ? 'bg-white text-orange-600 shadow-xs'
                : 'text-zinc-500 hover:text-zinc-800'
            }`}
          >
            <MessageSquare className="w-3.5 h-3.5 text-zinc-500" />
            <span>Commentaires ({comments.length})</span>
          </button>
        </div>

        {/* Content list */}
        <div className="flex-1 overflow-y-auto p-5 space-y-3">
          {activeTab === 'ratings' ? (
            ratings.length > 0 ? (
              ratings.map((r) => (
                <div key={r.id} className="p-3.5 rounded-2xl border border-zinc-100 bg-zinc-50">
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full bg-orange-100 text-orange-700 font-bold text-xs flex items-center justify-center">
                        {r.userName.charAt(0) || 'T'}
                      </div>
                      <span className="font-bold text-xs text-zinc-900">{r.userName}</span>
                      {r.executionPassed && (
                        <span className="inline-flex items-center gap-1 text-[10px] text-orange-700 bg-orange-50 px-2 py-0.5 rounded-full font-semibold">
                          <CheckCircle2 className="w-3 h-3 text-orange-600" /> Test validé
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-1 font-bold text-xs text-zinc-900">
                      <Star className="w-3.5 h-3.5 fill-orange-500 text-orange-500" />
                      <span>{r.score}/5</span>
                    </div>
                  </div>

                  {r.feedback && (
                    <p className="text-xs text-zinc-600 mt-1 pl-8 leading-relaxed">
                      "{r.feedback}"
                    </p>
                  )}
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-zinc-400 text-xs italic">
                Aucun avis pour l'instant. Testez l'algorithme et donnez votre note !
              </div>
            )
          ) : comments.length > 0 ? (
            comments.map((c) => (
              <div key={c.id} className="p-3.5 rounded-2xl border border-zinc-100 bg-zinc-50">
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full bg-zinc-200 text-zinc-700 text-xs flex items-center justify-center font-bold">
                      {c.authorName.charAt(0) || 'U'}
                    </div>
                    <span className="font-bold text-xs text-zinc-900">{c.authorName}</span>
                  </div>
                  <span className="text-[10px] text-zinc-400">
                    {new Date(c.createdAt).toLocaleDateString('fr-FR')}
                  </span>
                </div>
                <p className="text-xs text-zinc-700 pl-8 leading-relaxed">{c.content}</p>
              </div>
            ))
          ) : (
            <div className="text-center py-8 text-zinc-400 text-xs italic">
              Aucun commentaire pour le moment.
            </div>
          )}
        </div>

        {/* Input */}
        <div className="p-4 border-t border-zinc-100 bg-white">
          <form onSubmit={handleSendComment} className="flex gap-2">
            <input
              type="text"
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder="Écrire un message..."
              className="flex-1 text-xs px-4 py-2 bg-zinc-50 border border-zinc-200 rounded-full focus:border-orange-500 outline-none"
            />
            <button
              type="submit"
              disabled={isSubmitting || !newComment.trim()}
              className="px-4 py-2 bg-orange-500 hover:bg-orange-600 disabled:opacity-40 text-white rounded-full text-xs font-bold transition flex items-center gap-1 shadow-xs"
            >
              <span>Envoyer</span>
              <Send className="w-3 h-3" />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
