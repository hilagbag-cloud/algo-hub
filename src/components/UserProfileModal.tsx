import React, { useState } from 'react';
import { X, User, Check, ShieldCheck } from 'lucide-react';
import { UserProfile } from '../types/algobox';
import { syncUserProfile } from '../lib/firestoreService';

interface UserProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  userProfile: UserProfile;
  onUpdateProfile: (updated: UserProfile) => void;
}

export const UserProfileModal: React.FC<UserProfileModalProps> = ({
  isOpen,
  onClose,
  userProfile,
  onUpdateProfile,
}) => {
  const [displayName, setDisplayName] = useState(userProfile.displayName);
  const [bio, setBio] = useState(userProfile.bio || '');
  const [saved, setSaved] = useState(false);

  if (!isOpen) return null;

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const updated: UserProfile = {
      ...userProfile,
      displayName: displayName.trim() || userProfile.displayName,
      bio: bio.trim(),
    };
    onUpdateProfile(updated);
    await syncUserProfile(updated);
    setSaved(true);
    setTimeout(() => {
      setSaved(false);
      onClose();
    }, 600);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
      <div className="bg-white text-zinc-900 rounded-3xl max-w-md w-full shadow-2xl border border-orange-100 overflow-hidden">
        <div className="px-6 py-4 bg-orange-500 text-white flex items-center justify-between">
          <div className="flex items-center gap-2">
            <User className="w-4 h-4" />
            <h3 className="font-extrabold text-sm">Profil Utilisateur</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-full hover:bg-white/20 transition text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSave} className="p-6 space-y-4">
          <div className="flex items-center gap-4 pb-4 border-b border-zinc-100">
            <div className="w-14 h-14 rounded-full bg-orange-100 text-orange-600 font-extrabold text-2xl flex items-center justify-center border border-orange-200 shadow-xs">
              {displayName.charAt(0).toUpperCase() || 'U'}
            </div>
            <div>
              <div className="text-sm font-bold text-zinc-900">{displayName}</div>
              <div className="inline-flex items-center gap-1 text-[10px] text-orange-700 bg-orange-50 px-2 py-0.5 rounded-full mt-1 border border-orange-200">
                <ShieldCheck className="w-3 h-3 text-orange-600" /> Compte Firebase
              </div>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-zinc-700 mb-1">
              Pseudo affiché
            </label>
            <input
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              className="w-full text-sm px-4 py-2 bg-zinc-50 border border-zinc-200 rounded-full focus:border-orange-500 outline-none"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-zinc-700 mb-1">
              Bio / Présentation
            </label>
            <textarea
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder="Passionné d'algorithmique et de maths..."
              rows={2}
              className="w-full text-xs p-3 bg-zinc-50 border border-zinc-200 rounded-2xl focus:border-orange-500 outline-none resize-none"
            />
          </div>

          <div className="pt-2 flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-zinc-500 hover:text-zinc-800 transition"
            >
              Fermer
            </button>
            <button
              type="submit"
              className="flex items-center gap-1.5 px-5 py-2 bg-orange-500 hover:bg-orange-600 text-white text-xs font-bold rounded-full transition shadow-xs"
            >
              {saved ? (
                <>
                  <Check className="w-3.5 h-3.5" />
                  <span>Enregistré !</span>
                </>
              ) : (
                <span>Enregistrer</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
