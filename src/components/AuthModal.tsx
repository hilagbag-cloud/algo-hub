import React, { useState } from 'react';
import {
  X,
  User,
  ShieldCheck,
  AlertCircle,
  CheckCircle2,
  Sparkles,
  Terminal,
  Brain,
  Code,
  Rocket,
  Compass,
  ArrowRight,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import {
  formatUsername,
  loginWithUsername,
  registerWithUsername,
  signInWithGoogle,
} from '../lib/firestoreService';
import { UserProfile } from '../types/algobox';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAuthSuccess: (profile: UserProfile) => void;
  initialMode?: 'login' | 'register';
}

const AVATAR_OPTIONS = [
  { id: 'terminal', label: 'Terminal', icon: Terminal },
  { id: 'brain', label: 'Logique', icon: Brain },
  { id: 'code', label: 'Codeur', icon: Code },
  { id: 'rocket', label: 'Fusée', icon: Rocket },
  { id: 'compass', label: 'Explorateur', icon: Compass },
  { id: 'sparkles', label: 'Étoile', icon: Sparkles },
];

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  onAuthSuccess,
  initialMode = 'register',
}) => {
  const [mode, setMode] = useState<'login' | 'register'>(initialMode);
  const [pseudo, setPseudo] = useState('');
  const [bio, setBio] = useState('');
  const [selectedAvatar, setSelectedAvatar] = useState('terminal');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const previewFormatted = pseudo ? formatUsername(pseudo) : '@mon_pseudo';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const clean = pseudo.trim().replace(/^@+/, '').replace(/\s+/g, '_');
      if (!clean || clean.length < 3) {
        throw new Error('Le pseudo doit comporter au moins 3 caractères (ex: @marie_curie).');
      }

      let profile: UserProfile;
      if (mode === 'register') {
        profile = await registerWithUsername(clean, bio, selectedAvatar);
      } else {
        profile = await loginWithUsername(clean);
      }

      confetti({
        particleCount: 50,
        spread: 60,
        origin: { y: 0.6 },
        colors: ['#f97316', '#ea580c', '#ffffff'],
      });

      onAuthSuccess(profile);
      onClose();
    } catch (err: any) {
      setError(err?.message || 'Erreur lors de la validation du pseudo.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setError(null);
    setLoading(true);
    try {
      const profile = await signInWithGoogle();
      confetti({
        particleCount: 50,
        spread: 60,
        origin: { y: 0.6 },
        colors: ['#f97316', '#ea580c', '#ffffff'],
      });
      onAuthSuccess(profile);
      onClose();
    } catch (err: any) {
      if (err?.code !== 'auth/popup-closed-by-user') {
        setError(err?.message || 'Erreur lors de la connexion Google.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
      <div className="bg-white text-zinc-900 rounded-3xl max-w-md w-full shadow-2xl border border-orange-100 overflow-hidden animate-fade-in">
        {/* Header */}
        <div className="px-6 py-4 bg-gradient-to-r from-orange-500 to-amber-500 text-white flex items-center justify-between">
          <div className="flex items-center gap-2">
            <User className="w-5 h-5 stroke-[2.5]" />
            <div>
              <h3 className="font-extrabold text-sm tracking-tight">
                {mode === 'register' ? 'Créer mon Pseudo Public' : 'Accéder avec mon Pseudo'}
              </h3>
              <p className="text-[10px] text-orange-100 font-medium">Sans mot de passe • Immédiat & simple</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-full hover:bg-white/20 transition text-white cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab switch */}
        <div className="flex bg-zinc-100 p-1 m-4 mb-2 rounded-full border border-zinc-200">
          <button
            type="button"
            onClick={() => {
              setMode('register');
              setError(null);
            }}
            className={`flex-1 py-1.5 rounded-full text-xs font-bold transition ${
              mode === 'register'
                ? 'bg-white text-orange-600 shadow-xs'
                : 'text-zinc-600 hover:text-zinc-900'
            }`}
          >
            Nouveau pseudo
          </button>
          <button
            type="button"
            onClick={() => {
              setMode('login');
              setError(null);
            }}
            className={`flex-1 py-1.5 rounded-full text-xs font-bold transition ${
              mode === 'login'
                ? 'bg-white text-orange-600 shadow-xs'
                : 'text-zinc-600 hover:text-zinc-900'
            }`}
          >
            Pseudo existant
          </button>
        </div>

        {/* Error message banner */}
        {error && (
          <div className="mx-6 mb-2 p-3 rounded-2xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="p-6 pt-2 space-y-4">
          {/* Live Preview Card */}
          <div className="p-3 bg-orange-50/80 border border-orange-200 rounded-2xl flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-full bg-orange-500 text-white flex items-center justify-center font-bold text-sm shadow-xs">
                {pseudo ? pseudo.replace(/^@+/, '').charAt(0).toUpperCase() : '?'}
              </div>
              <div>
                <div className="text-[10px] text-zinc-500 font-semibold uppercase tracking-wider">
                  Votre profil public
                </div>
                <div className="text-sm font-black text-orange-700 font-mono">
                  {previewFormatted}
                </div>
              </div>
            </div>
            <span className="text-[10px] font-bold text-orange-700 bg-white px-2.5 py-1 rounded-full border border-orange-200 shadow-2xs">
              AlgoBox @
            </span>
          </div>

          {/* Pseudo Input Field (NO PASSWORD!) */}
          <div>
            <label className="block text-xs font-bold text-zinc-700 mb-1 flex items-center justify-between">
              <span>{mode === 'register' ? 'Choisissez votre Pseudo' : 'Votre Pseudo existant'}</span>
              <span className="text-[10px] font-normal text-zinc-400">Sans mot de passe</span>
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-orange-500 font-mono font-bold text-sm">
                @
              </div>
              <input
                type="text"
                value={pseudo}
                onChange={(e) => setPseudo(e.target.value.replace(/\s+/g, '_'))}
                placeholder="ex: marie_curie"
                autoFocus
                className="w-full text-xs pl-8 pr-4 py-2.5 bg-zinc-50 border border-zinc-200 rounded-full focus:border-orange-500 focus:bg-white outline-none font-mono font-bold text-zinc-800 transition"
                required
              />
            </div>
          </div>

          {/* Avatar & Bio only in Register Mode */}
          {mode === 'register' && (
            <>
              <div>
                <label className="block text-xs font-bold text-zinc-700 mb-1.5">
                  Icône d'avatar
                </label>
                <div className="grid grid-cols-6 gap-1.5">
                  {AVATAR_OPTIONS.map((av) => {
                    const Icon = av.icon;
                    const isSelected = selectedAvatar === av.id;
                    return (
                      <button
                        key={av.id}
                        type="button"
                        onClick={() => setSelectedAvatar(av.id)}
                        className={`p-2 rounded-2xl flex flex-col items-center gap-1 border transition cursor-pointer ${
                          isSelected
                            ? 'bg-orange-50 border-orange-500 text-orange-600 shadow-xs'
                            : 'bg-zinc-50 border-zinc-200 text-zinc-500 hover:bg-zinc-100'
                        }`}
                        title={av.label}
                      >
                        <Icon className="w-4 h-4" />
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-zinc-700 mb-1">
                  Bio / Courte présentation (facultatif)
                </label>
                <textarea
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  placeholder="Passionné d'algorithmes et de programmation AlgoBox..."
                  rows={2}
                  className="w-full text-xs p-3 bg-zinc-50 border border-zinc-200 rounded-2xl focus:border-orange-500 focus:bg-white outline-none resize-none"
                />
              </div>
            </>
          )}

          {/* Action Buttons */}
          <div className="pt-2 flex items-center justify-between gap-2">
            <button
              type="button"
              onClick={handleGoogleSignIn}
              disabled={loading}
              className="text-[11px] font-semibold text-zinc-500 hover:text-zinc-800 flex items-center gap-1.5 transition py-2"
              title="Connexion Google alternative"
            >
              <svg className="w-3.5 h-3.5" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                />
              </svg>
              <span>ou Google</span>
            </button>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-xs font-semibold text-zinc-500 hover:text-zinc-800 transition"
              >
                Annuler
              </button>

              <button
                type="submit"
                disabled={loading}
                className="flex items-center gap-1.5 px-6 py-2.5 bg-orange-500 hover:bg-orange-600 disabled:opacity-50 text-white text-xs font-extrabold rounded-full transition shadow-md shadow-orange-500/25 cursor-pointer hover:scale-102"
              >
                {loading ? (
                  <span>Validation...</span>
                ) : mode === 'register' ? (
                  <>
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Créer mon profil @</span>
                  </>
                ) : (
                  <>
                    <ArrowRight className="w-3.5 h-3.5" />
                    <span>Valider mon pseudo</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
