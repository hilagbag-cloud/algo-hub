import React, { useEffect, useState } from 'react';
import {
  ArrowLeft,
  User,
  Terminal,
  Brain,
  Code,
  Rocket,
  Compass,
  Sparkles,
  Award,
  Play,
  Star,
  Flame,
  CheckCircle2,
  Calendar,
  LogOut,
  Edit3,
  Share2,
} from 'lucide-react';
import { AlgorithmDoc, UserProfile } from '../types/algobox';
import { fetchUserProfileByUsername, formatUsername, logoutUser, syncUserProfile } from '../lib/firestoreService';

interface UserProfilePageProps {
  targetUsername: string;
  currentUser: UserProfile;
  algorithms: AlgorithmDoc[];
  onBack: () => void;
  onOpenTestAlgo: (algo: AlgorithmDoc) => void;
  onOpenAuthModal: () => void;
  onCurrentUserUpdated: (profile: UserProfile) => void;
}

const AVATAR_ICONS: Record<string, React.FC<{ className?: string }>> = {
  terminal: Terminal,
  brain: Brain,
  code: Code,
  rocket: Rocket,
  compass: Compass,
  sparkles: Sparkles,
};

export const UserProfilePage: React.FC<UserProfilePageProps> = ({
  targetUsername,
  currentUser,
  algorithms,
  onBack,
  onOpenTestAlgo,
  onOpenAuthModal,
  onCurrentUserUpdated,
}) => {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [isEditingBio, setIsEditingBio] = useState(false);
  const [bioInput, setBioInput] = useState('');
  const [copiedLink, setCopiedLink] = useState(false);

  const formattedTarget = formatUsername(targetUsername);
  const isOwner =
    currentUser.username &&
    formatUsername(currentUser.username).toLowerCase() === formattedTarget.toLowerCase();

  useEffect(() => {
    let isMounted = true;
    setLoading(true);

    if (isOwner) {
      setProfile(currentUser);
      setBioInput(currentUser.bio || '');
      setLoading(false);
      return;
    }

    fetchUserProfileByUsername(targetUsername)
      .then((res) => {
        if (!isMounted) return;
        if (res) {
          setProfile(res);
          setBioInput(res.bio || '');
        } else {
          // Construct fallback display profile from algorithms
          const authorAlgos = algorithms.filter(
            (a) => formatUsername(a.authorName).toLowerCase() === formattedTarget.toLowerCase()
          );
          if (authorAlgos.length > 0) {
            const first = authorAlgos[0];
            setProfile({
              uid: first.authorId,
              username: formattedTarget,
              displayName: first.authorName,
              avatarIcon: first.authorAvatar || 'terminal',
              avatarSeed: first.authorName,
              bio: 'Auteur d\'algorithmes partagés sur la communauté AlgoBox',
              createdAt: first.createdAt,
              isRegistered: true,
            });
          } else {
            setProfile(null);
          }
        }
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [targetUsername, currentUser, isOwner, algorithms, formattedTarget]);

  // Find algorithms created by this user
  const userAlgorithms = algorithms.filter((algo) => {
    if (!profile) return false;
    return (
      algo.authorId === profile.uid ||
      formatUsername(algo.authorName).toLowerCase() === formattedTarget.toLowerCase()
    );
  });

  const totalTestsReceived = userAlgorithms.reduce((sum, a) => sum + (a.testsCount || 0), 0);
  const totalLikesReceived = userAlgorithms.reduce((sum, a) => sum + (a.likesCount || 0), 0);
  const ratedAlgos = userAlgorithms.filter((a) => (a.ratingsCount || 0) > 0);
  const avgRating =
    ratedAlgos.length > 0
      ? (
          ratedAlgos.reduce((acc, a) => acc + (a.averageRating || 0), 0) / ratedAlgos.length
        ).toFixed(1)
      : '5.0';

  const handleSaveBio = async () => {
    if (!profile || !isOwner) return;
    const updated: UserProfile = { ...profile, bio: bioInput };
    setProfile(updated);
    setIsEditingBio(false);
    await syncUserProfile(updated);
    onCurrentUserUpdated(updated);
  };

  const handleLogout = async () => {
    const guest = await logoutUser();
    onCurrentUserUpdated(guest);
    onBack();
  };

  const handleCopyProfile = () => {
    navigator.clipboard.writeText(`${window.location.origin}#${formattedTarget}`);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const AvatarComponent = (profile && AVATAR_ICONS[profile.avatarIcon || 'terminal']) || Terminal;

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-12 text-center text-zinc-500 font-mono text-sm">
        Chargement du profil {formattedTarget}...
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-12 text-center">
        <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-zinc-100 flex items-center justify-center text-zinc-400">
          <User className="w-8 h-8" />
        </div>
        <h2 className="text-lg font-bold text-zinc-800 mb-2">
          Profil {formattedTarget} introuvable
        </h2>
        <p className="text-xs text-zinc-500 mb-6 max-w-sm mx-auto">
          Aucun utilisateur ou auteur d'algorithme n'a été trouvé avec ce pseudo.
        </p>
        <button
          onClick={onBack}
          className="inline-flex items-center gap-1.5 px-5 py-2.5 bg-orange-500 text-white rounded-full text-xs font-bold shadow-xs hover:bg-orange-600 transition"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Retour aux algorithmes</span>
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 space-y-6">
      {/* Back button & top bar */}
      <div className="flex items-center justify-between">
        <button
          onClick={onBack}
          className="inline-flex items-center gap-1.5 px-4 py-2 bg-white hover:bg-zinc-50 border border-zinc-200 text-zinc-700 rounded-full text-xs font-bold transition shadow-2xs cursor-pointer"
        >
          <ArrowLeft className="w-3.5 h-3.5 text-orange-500" />
          <span>Retour à la galerie</span>
        </button>

        <div className="flex items-center gap-2">
          <button
            onClick={handleCopyProfile}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-white hover:bg-zinc-50 border border-zinc-200 text-zinc-700 rounded-full text-xs font-bold transition shadow-2xs cursor-pointer"
          >
            <Share2 className="w-3.5 h-3.5 text-zinc-400" />
            <span>{copiedLink ? 'Lien copié !' : 'Partager ce profil'}</span>
          </button>

          {isOwner && (
            <button
              onClick={onOpenAuthModal}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-orange-50 hover:bg-orange-100 border border-orange-200 text-orange-700 rounded-full text-xs font-bold transition shadow-2xs cursor-pointer"
            >
              <User className="w-3.5 h-3.5" />
              <span>{profile.isRegistered ? 'Changer de pseudo' : 'Choisir mon @pseudo'}</span>
            </button>
          )}

          {isOwner && profile.isRegistered && (
            <button
              onClick={handleLogout}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-red-50 hover:bg-red-100 border border-red-200 text-red-700 rounded-full text-xs font-bold transition shadow-2xs cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5 text-red-500" />
              <span>Se déconnecter</span>
            </button>
          )}
        </div>
      </div>

      {/* Profile Header Hero Card */}
      <div className="bg-white border border-zinc-200 rounded-3xl p-6 shadow-xs relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-bl from-orange-400/10 to-transparent rounded-bl-full pointer-events-none" />

        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5">
          {/* Avatar Icon */}
          <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-orange-500 to-amber-500 text-white flex items-center justify-center font-bold shadow-md shadow-orange-500/20 shrink-0">
            <AvatarComponent className="w-10 h-10" />
          </div>

          {/* User Details */}
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-2 mb-1">
              <h1 className="text-xl font-black text-zinc-900 font-mono tracking-tight">
                {profile.username || formattedTarget}
              </h1>
              {profile.isRegistered ? (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-orange-100 text-orange-800 border border-orange-200">
                  <CheckCircle2 className="w-3 h-3 text-orange-600" />
                  Membre certifié
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-zinc-100 text-zinc-600 border border-zinc-200">
                  Visiteur invité
                </span>
              )}
            </div>

            {/* Bio Section */}
            {isEditingBio ? (
              <div className="mt-2 space-y-2">
                <textarea
                  value={bioInput}
                  onChange={(e) => setBioInput(e.target.value)}
                  rows={2}
                  className="w-full text-xs p-2.5 bg-zinc-50 border border-orange-300 rounded-2xl focus:bg-white outline-none"
                  placeholder="Écrivez votre bio..."
                />
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleSaveBio}
                    className="px-3.5 py-1.5 rounded-full bg-orange-500 text-white text-xs font-bold hover:bg-orange-600 transition"
                  >
                    Enregistrer
                  </button>
                  <button
                    onClick={() => setIsEditingBio(false)}
                    className="px-3 py-1.5 text-xs text-zinc-500 hover:text-zinc-800 transition"
                  >
                    Annuler
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-2 mt-1">
                <p className="text-xs text-zinc-600">
                  {profile.bio || "Aucune biographie rédigée pour l'instant."}
                </p>
                {isOwner && (
                  <button
                    onClick={() => setIsEditingBio(true)}
                    className="p-1 text-zinc-400 hover:text-orange-500 transition"
                    title="Modifier la bio"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            )}

            <div className="mt-3 flex items-center gap-4 text-[11px] text-zinc-400">
              <span className="flex items-center gap-1">
                <Calendar className="w-3 h-3" />
                Membre depuis {new Date(profile.createdAt || Date.now()).toLocaleDateString('fr-FR')}
              </span>
            </div>
          </div>
        </div>

        {/* Community Stats Counters */}
        <div className="mt-6 pt-5 border-t border-zinc-100 grid grid-cols-2 sm:grid-cols-4 gap-3 font-mono">
          <div className="bg-zinc-50/80 p-3 rounded-2xl border border-zinc-100">
            <span className="text-[10px] text-zinc-400 font-sans block font-semibold">
              Algorithmes créés
            </span>
            <span className="text-base font-black text-zinc-900">{userAlgorithms.length}</span>
          </div>

          <div className="bg-zinc-50/80 p-3 rounded-2xl border border-zinc-100">
            <span className="text-[10px] text-zinc-400 font-sans block font-semibold">
              Tests reçus
            </span>
            <span className="text-base font-black text-orange-600 flex items-center gap-1">
              <Play className="w-3.5 h-3.5" />
              {totalTestsReceived}
            </span>
          </div>

          <div className="bg-zinc-50/80 p-3 rounded-2xl border border-zinc-100">
            <span className="text-[10px] text-zinc-400 font-sans block font-semibold">
              Score moyen
            </span>
            <span className="text-base font-black text-amber-500 flex items-center gap-1">
              <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
              {avgRating} / 5
            </span>
          </div>

          <div className="bg-zinc-50/80 p-3 rounded-2xl border border-zinc-100">
            <span className="text-[10px] text-zinc-400 font-sans block font-semibold">
              Likes reçus
            </span>
            <span className="text-base font-black text-red-500 flex items-center gap-1">
              <Flame className="w-3.5 h-3.5" />
              {totalLikesReceived}
            </span>
          </div>
        </div>
      </div>

      {/* List of Algorithms Published by this User */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-extrabold text-zinc-900 flex items-center gap-2">
            <span>Algorithmes publiés par {profile.username || formattedTarget}</span>
            <span className="text-xs text-orange-600 bg-orange-100 px-2 py-0.5 rounded-full font-mono">
              {userAlgorithms.length}
            </span>
          </h2>
        </div>

        {userAlgorithms.length === 0 ? (
          <div className="bg-white border border-zinc-200 rounded-3xl p-8 text-center text-xs text-zinc-400">
            Cet utilisateur n'a pas encore publié d'algorithme.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {userAlgorithms.map((algo) => (
              <div
                key={algo.id}
                className="bg-white border border-zinc-200 hover:border-orange-300 rounded-2xl p-4 shadow-xs transition flex flex-col justify-between group"
              >
                <div>
                  <div className="flex items-start justify-between gap-2 mb-1">
                    <h3 className="font-extrabold text-xs text-zinc-900 group-hover:text-orange-600 transition line-clamp-1">
                      {algo.title}
                    </h3>
                    <div className="flex items-center gap-1 text-[11px] font-bold text-amber-500 shrink-0 font-mono">
                      <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                      <span>{algo.averageRating ? algo.averageRating.toFixed(1) : '-'}</span>
                    </div>
                  </div>

                  <p className="text-[11px] text-zinc-500 line-clamp-2 mb-3">
                    {algo.description}
                  </p>

                  {/* Tags */}
                  <div className="flex flex-wrap gap-1 mb-3">
                    {algo.tags?.map((tag) => (
                      <span
                        key={tag}
                        className="text-[10px] bg-zinc-100 text-zinc-600 px-2 py-0.5 rounded-full font-mono"
                      >
                        #{tag}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Footer Action */}
                <div className="pt-2 border-t border-zinc-100 flex items-center justify-between">
                  <span className="text-[10px] text-zinc-400 font-mono">
                    {algo.testsCount || 0} exécution(s)
                  </span>

                  <button
                    onClick={() => onOpenTestAlgo(algo)}
                    className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-orange-50 hover:bg-orange-500 text-orange-600 hover:text-white text-xs font-bold transition cursor-pointer"
                  >
                    <Play className="w-3 h-3" />
                    <span>Tester</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
