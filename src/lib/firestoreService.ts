import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  onSnapshot,
  query,
  where,
  orderBy,
  increment,
  arrayUnion,
  arrayRemove,
  addDoc,
} from 'firebase/firestore';
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  updateProfile,
  GoogleAuthProvider,
  signInWithPopup,
} from 'firebase/auth';
import { auth, db, ensureAuthenticated } from '../firebase';
export { ensureAuthenticated, auth };
import { AlgorithmDoc, CommentDoc, RatingDoc, UserProfile } from '../types/algobox';
import { SAMPLE_ALGORITHMS } from './sampleAlgorithms';

const ALGORITHMS_COLLECTION = 'algorithms';
const USERS_COLLECTION = 'users';

// Initialize and sync sample algorithms to Firestore if empty
export async function seedInitialAlgorithmsIfEmpty() {
  try {
    const snap = await getDocs(collection(db, ALGORITHMS_COLLECTION));
    if (snap.empty) {
      // Seed samples
      for (const sample of SAMPLE_ALGORITHMS) {
        const algoRef = doc(db, ALGORITHMS_COLLECTION, sample.id);
        await setDoc(algoRef, {
          title: sample.title,
          description: sample.description,
          rawAlgContent: sample.rawAlgContent,
          tags: sample.tags,
          category: sample.category,
          authorId: 'seed-author-' + sample.id,
          authorName: sample.authorName,
          authorAvatar: sample.authorAvatar,
          createdAt: sample.createdAt,
          likesCount: sample.likesCount,
          likedBy: [],
          ratingsCount: sample.ratingsCount,
          averageRating: sample.averageRating,
          testsCount: sample.testsCount,
        });
      }
    }
  } catch (err) {
    console.warn('Could not check/seed initial algorithms to Firestore:', err);
  }
}

// Real-time listener for algorithms collection
export function subscribeAlgorithms(
  onUpdate: (algos: AlgorithmDoc[]) => void,
  onError?: (err: Error) => void
) {
  try {
    const q = query(collection(db, ALGORITHMS_COLLECTION), orderBy('createdAt', 'desc'));
    return onSnapshot(
      q,
      (snapshot) => {
        if (snapshot.empty) {
          // If Firestore is empty, provide the pre-built samples
          onUpdate(
            SAMPLE_ALGORITHMS.map((s) => ({
              ...s,
              authorId: 'seed-author',
              likedBy: [],
            }))
          );
        } else {
          const algos: AlgorithmDoc[] = [];
          snapshot.forEach((docSnap) => {
            const data = docSnap.data();
            algos.push({
              id: docSnap.id,
              title: data.title || 'Algorithme sans titre',
              description: data.description || '',
              rawAlgContent: data.rawAlgContent || '',
              tags: Array.isArray(data.tags) ? data.tags : [],
              authorId: data.authorId || 'anonyme',
              authorName: data.authorName || 'Anonyme',
              authorAvatar: data.authorAvatar || 'terminal',
              createdAt: data.createdAt || Date.now(),
              likesCount: Number(data.likesCount || 0),
              likedBy: Array.isArray(data.likedBy) ? data.likedBy : [],
              ratingsCount: Number(data.ratingsCount || 0),
              averageRating: Number(data.averageRating || 0),
              testsCount: Number(data.testsCount || 0),
              category: data.category || 'Général',
            });
          });
          onUpdate(algos);
        }
      },
      (error) => {
        console.warn('Firestore subscription error (fallback to samples):', error);
        onUpdate(
          SAMPLE_ALGORITHMS.map((s) => ({
            ...s,
            authorId: 'seed-author',
            likedBy: [],
          }))
        );
        if (onError) onError(error);
      }
    );
  } catch (err: any) {
    console.error('Failed to subscribe to algorithms:', err);
    onUpdate(
      SAMPLE_ALGORITHMS.map((s) => ({
        ...s,
        authorId: 'seed-author',
        likedBy: [],
      }))
    );
    return () => {};
  }
}

// Create new algorithm in Firestore
export async function createAlgorithm(
  algoData: Omit<AlgorithmDoc, 'id' | 'createdAt' | 'likesCount' | 'ratingsCount' | 'averageRating' | 'testsCount' | 'likedBy'>
): Promise<string> {
  const user = await ensureAuthenticated();
  const newDocRef = doc(collection(db, ALGORITHMS_COLLECTION));
  const fallbackUid = getLocalUserProfile().uid || 'guest';
  const fullDoc: Omit<AlgorithmDoc, 'id'> = {
    ...algoData,
    authorId: user?.uid || fallbackUid,
    createdAt: Date.now(),
    likesCount: 0,
    likedBy: [],
    ratingsCount: 0,
    averageRating: 0,
    testsCount: 0,
  };

  await setDoc(newDocRef, fullDoc);
  return newDocRef.id;
}

// Increment test count when an algorithm is run
export async function recordExecutionRun(algoId: string) {
  try {
    const docRef = doc(db, ALGORITHMS_COLLECTION, algoId);
    await updateDoc(docRef, {
      testsCount: increment(1),
    });
  } catch (err) {
    // If it's a seed sample or offline, fail quietly
  }
}

// Toggle Like
export async function toggleLikeAlgorithm(algoId: string, userId: string, currentlyLiked: boolean) {
  try {
    const docRef = doc(db, ALGORITHMS_COLLECTION, algoId);
    if (currentlyLiked) {
      await updateDoc(docRef, {
        likesCount: increment(-1),
        likedBy: arrayRemove(userId),
      });
    } else {
      await updateDoc(docRef, {
        likesCount: increment(1),
        likedBy: arrayUnion(userId),
      });
    }
  } catch (err) {
    console.error('Error toggling like:', err);
  }
}

// Ratings Subcollection
export function subscribeRatings(
  algoId: string,
  onUpdate: (ratings: RatingDoc[]) => void
) {
  try {
    const ratingsRef = collection(db, ALGORITHMS_COLLECTION, algoId, 'ratings');
    const q = query(ratingsRef, orderBy('createdAt', 'desc'));
    return onSnapshot(
      q,
      (snapshot) => {
        const ratings: RatingDoc[] = [];
        snapshot.forEach((snap) => {
          const d = snap.data();
          ratings.push({
            id: snap.id,
            algoId,
            userId: d.userId,
            userName: d.userName,
            userAvatar: d.userAvatar,
            score: Number(d.score || 5),
            feedback: d.feedback || '',
            executionPassed: Boolean(d.executionPassed),
            createdAt: d.createdAt || Date.now(),
          });
        });
        onUpdate(ratings);
      },
      (error) => {
        console.warn('Ratings error:', error);
        onUpdate([]);
      }
    );
  } catch (err) {
    onUpdate([]);
    return () => {};
  }
}

// Add Rating & recalculate score
export async function submitAlgorithmRating(
  algoId: string,
  rating: {
    userId: string;
    userName: string;
    userAvatar?: string;
    score: number;
    feedback?: string;
    executionPassed?: boolean;
  }
) {
  await ensureAuthenticated();
  const ratingsRef = collection(db, ALGORITHMS_COLLECTION, algoId, 'ratings');
  
  // Use userId as rating document ID so one user rates once per algo (or updates their note)
  const ratingDocRef = doc(ratingsRef, rating.userId);
  await setDoc(ratingDocRef, {
    ...rating,
    createdAt: Date.now(),
  });

  // Re-fetch all ratings to compute exact averageRating
  try {
    const allRatingsSnap = await getDocs(ratingsRef);
    let totalScore = 0;
    let count = 0;
    allRatingsSnap.forEach((r) => {
      totalScore += Number(r.data().score || 0);
      count++;
    });

    const avg = count > 0 ? Number((totalScore / count).toFixed(1)) : 0;
    const algoRef = doc(db, ALGORITHMS_COLLECTION, algoId);
    await updateDoc(algoRef, {
      ratingsCount: count,
      averageRating: avg,
    });
  } catch (err) {
    console.error('Error updating average score:', err);
  }
}

// Comments Subcollection
export function subscribeComments(
  algoId: string,
  onUpdate: (comments: CommentDoc[]) => void
) {
  try {
    const commentsRef = collection(db, ALGORITHMS_COLLECTION, algoId, 'comments');
    const q = query(commentsRef, orderBy('createdAt', 'desc'));
    return onSnapshot(
      q,
      (snapshot) => {
        const comments: CommentDoc[] = [];
        snapshot.forEach((snap) => {
          const d = snap.data();
          comments.push({
            id: snap.id,
            algoId,
            authorId: d.authorId,
            authorName: d.authorName,
            authorAvatar: d.authorAvatar,
            content: d.content || '',
            createdAt: d.createdAt || Date.now(),
          });
        });
        onUpdate(comments);
      },
      (error) => {
        console.warn('Comments subscription error:', error);
        onUpdate([]);
      }
    );
  } catch (err) {
    onUpdate([]);
    return () => {};
  }
}

export async function addComment(algoId: string, content: string, author: { id: string; name: string; avatar?: string }) {
  await ensureAuthenticated();
  const commentsRef = collection(db, ALGORITHMS_COLLECTION, algoId, 'comments');
  await addDoc(commentsRef, {
    authorId: author.id,
    authorName: author.name,
    authorAvatar: author.avatar || 'terminal',
    content,
    createdAt: Date.now(),
  });
}

// User Profile Local / Remote Management
const LOCAL_PROFILE_KEY = 'algobox_user_profile';
const USERNAMES_COLLECTION = 'usernames';

export function formatUsername(raw: string): string {
  const cleaned = raw.trim().replace(/^@+/, '').replace(/\s+/g, '_').toLowerCase();
  return `@${cleaned}`;
}

export function getCleanPseudo(raw: string): string {
  return raw.trim().replace(/^@+/, '').replace(/\s+/g, '_').toLowerCase();
}

export function getLocalUserProfile(): UserProfile {
  try {
    const saved = localStorage.getItem(LOCAL_PROFILE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (!parsed.username) {
        parsed.username = formatUsername(parsed.displayName || 'algoteam');
      }
      return parsed;
    }
  } catch {}

  const randomNum = Math.floor(100 + Math.random() * 900);
  const defaultProfile: UserProfile = {
    uid: `user_${Math.random().toString(36).substring(2, 9)}`,
    username: `@testeur_${randomNum}`,
    displayName: `@testeur_${randomNum}`,
    avatarSeed: `avatar_${randomNum}`,
    avatarIcon: 'terminal',
    bio: 'Passionné d\'algorithmes & mathématiques appliquées',
    isRegistered: false,
    createdAt: Date.now(),
  };

  saveLocalUserProfile(defaultProfile);
  return defaultProfile;
}

export function saveLocalUserProfile(profile: UserProfile) {
  try {
    localStorage.setItem(LOCAL_PROFILE_KEY, JSON.stringify(profile));
  } catch {}
}

export async function syncUserProfile(profile: UserProfile) {
  saveLocalUserProfile(profile);
  try {
    const user = await ensureAuthenticated();
    const uid = user?.uid || profile.uid;
    const userDoc = doc(db, USERS_COLLECTION, uid);
    await setDoc(
      userDoc,
      {
        ...profile,
        uid,
        updatedAt: Date.now(),
      },
      { merge: true }
    );
  } catch (err) {
    console.warn('Failed to sync profile to firestore:', err);
  }
}

// Sign in with Google (recommended & natively configured provider)
export async function signInWithGoogle(): Promise<UserProfile> {
  const provider = new GoogleAuthProvider();
  const credential = await signInWithPopup(auth, provider);
  const user = credential.user;
  const uid = user.uid;

  const rawName = user.displayName || user.email?.split('@')[0] || 'codeur';
  const clean = getCleanPseudo(rawName);
  const formatted = `@${clean}`;

  try {
    const userDoc = await getDoc(doc(db, USERS_COLLECTION, uid));
    if (userDoc.exists()) {
      const data = userDoc.data() as UserProfile;
      const loaded: UserProfile = {
        ...data,
        uid,
        username: data.username || formatted,
        displayName: data.displayName || user.displayName || formatted,
        email: user.email || undefined,
        isRegistered: true,
      };
      saveLocalUserProfile(loaded);
      return loaded;
    }
  } catch (err) {
    console.warn('Could not check user doc during Google login:', err);
  }

  const profile: UserProfile = {
    uid,
    username: formatted,
    displayName: user.displayName || formatted,
    email: user.email || undefined,
    avatarSeed: clean,
    avatarIcon: 'terminal',
    bio: 'Membre certifié AlgoBox (Google)',
    createdAt: Date.now(),
    isRegistered: true,
    totalSubmissions: 0,
    totalRatingsGiven: 0,
    totalLikesReceived: 0,
  };

  try {
    await setDoc(doc(db, USERS_COLLECTION, uid), profile);
    await setDoc(doc(db, USERNAMES_COLLECTION, formatted), {
      uid,
      username: formatted,
      createdAt: Date.now(),
    });
  } catch (err) {
    console.warn('Could not write Google user doc to firestore:', err);
  }

  saveLocalUserProfile(profile);
  return profile;
}

// Check if a username is already taken
export async function isUsernameTaken(rawPseudo: string): Promise<boolean> {
  const clean = getCleanPseudo(rawPseudo);
  const formatted = `@${clean}`;
  try {
    const usernameDoc = await getDoc(doc(db, USERNAMES_COLLECTION, formatted));
    if (usernameDoc.exists()) return true;

    // Check users collection as backup
    const q = query(collection(db, USERS_COLLECTION), where('username', '==', formatted));
    const snap = await getDocs(q);
    return !snap.empty;
  } catch {
    return false;
  }
}

// Register or set user with Username only (no password required)
export async function registerWithUsername(
  rawPseudo: string,
  bio?: string,
  avatarIcon?: string
): Promise<UserProfile> {
  const clean = getCleanPseudo(rawPseudo);
  if (!clean || clean.length < 3) {
    throw new Error('Le pseudo doit contenir au moins 3 caractères (lettres, chiffres ou tirets-bas).');
  }

  const formatted = `@${clean}`;
  
  // Check if already registered
  try {
    const usernameDoc = await getDoc(doc(db, USERNAMES_COLLECTION, formatted));
    if (usernameDoc.exists()) {
      const existingUid = usernameDoc.data().uid;
      const existingUserDoc = await getDoc(doc(db, USERS_COLLECTION, existingUid));
      if (existingUserDoc.exists()) {
        const existingProfile = existingUserDoc.data() as UserProfile;
        saveLocalUserProfile(existingProfile);
        return existingProfile;
      }
    }
  } catch (err) {
    console.warn('Username check notice:', err);
  }

  const currentAuth = auth.currentUser;
  const uid = currentAuth?.uid || `user_${clean}_${Date.now().toString(36)}`;

  const profile: UserProfile = {
    uid,
    username: formatted,
    displayName: formatted,
    avatarSeed: clean,
    avatarIcon: avatarIcon || 'terminal',
    bio: bio || 'Membre passionné d\'algorithmes AlgoBox',
    createdAt: Date.now(),
    isRegistered: true,
    totalSubmissions: 0,
    totalRatingsGiven: 0,
    totalLikesReceived: 0,
  };

  // Save directly to Firestore
  try {
    await setDoc(doc(db, USERS_COLLECTION, uid), profile, { merge: true });
    await setDoc(doc(db, USERNAMES_COLLECTION, formatted), {
      uid,
      username: formatted,
      createdAt: Date.now(),
    });
  } catch (err) {
    console.warn('Could not write profile to Firestore:', err);
  }

  saveLocalUserProfile(profile);
  return profile;
}

// Login with Username only (no password required)
export async function loginWithUsername(rawPseudo: string): Promise<UserProfile> {
  const clean = getCleanPseudo(rawPseudo);
  if (!clean || clean.length < 3) {
    throw new Error('Veuillez entrer un pseudo valide (au moins 3 caractères).');
  }

  const formatted = `@${clean}`;

  // 1. Try to find user by reserved username
  try {
    const usernameDoc = await getDoc(doc(db, USERNAMES_COLLECTION, formatted));
    if (usernameDoc.exists()) {
      const uid = usernameDoc.data().uid;
      const userDoc = await getDoc(doc(db, USERS_COLLECTION, uid));
      if (userDoc.exists()) {
        const loaded = userDoc.data() as UserProfile;
        const profile: UserProfile = {
          ...loaded,
          uid,
          username: loaded.username || formatted,
          displayName: loaded.displayName || loaded.username || formatted,
          isRegistered: true,
        };
        saveLocalUserProfile(profile);
        return profile;
      }
    }

    // 2. Try query in users collection
    const q = query(collection(db, USERS_COLLECTION), where('username', '==', formatted));
    const snap = await getDocs(q);
    if (!snap.empty) {
      const docSnap = snap.docs[0];
      const loaded = docSnap.data() as UserProfile;
      const profile: UserProfile = {
        ...loaded,
        uid: docSnap.id,
        username: loaded.username || formatted,
        displayName: loaded.displayName || loaded.username || formatted,
        isRegistered: true,
      };
      saveLocalUserProfile(profile);
      return profile;
    }
  } catch (err) {
    console.warn('Firestore lookup notice during login:', err);
  }

  // 3. If pseudo is not registered yet, create it instantly without friction
  return registerWithUsername(clean);
}

// Backward-compatible wrappers (no password required)
export async function registerWithPseudoAndPassword(
  rawPseudo: string,
  _password?: string,
  bio?: string,
  avatarIcon?: string
): Promise<UserProfile> {
  return registerWithUsername(rawPseudo, bio, avatarIcon);
}

export async function loginWithPseudoAndPassword(
  rawPseudo: string,
  _password?: string
): Promise<UserProfile> {
  return loginWithUsername(rawPseudo);
}

// Sign out user
export async function logoutUser(): Promise<UserProfile> {
  try {
    await signOut(auth);
  } catch (err) {
    console.warn('Sign out error:', err);
  }

  // Revert to a guest profile
  const randomNum = Math.floor(100 + Math.random() * 900);
  const guest: UserProfile = {
    uid: `guest_${Date.now()}`,
    username: `@visiteur_${randomNum}`,
    displayName: `@visiteur_${randomNum}`,
    avatarSeed: `guest_${randomNum}`,
    avatarIcon: 'terminal',
    bio: 'Visiteur invité - Connectez-vous pour avoir votre propre profil @pseudo',
    isRegistered: false,
    createdAt: Date.now(),
  };

  saveLocalUserProfile(guest);
  return guest;
}

// Fetch public profile by username (@pseudo)
export async function fetchUserProfileByUsername(rawUsername: string): Promise<UserProfile | null> {
  const formatted = formatUsername(rawUsername);
  try {
    const q = query(collection(db, USERS_COLLECTION), where('username', '==', formatted));
    const snap = await getDocs(q);
    if (!snap.empty) {
      const docData = snap.docs[0].data() as UserProfile;
      return {
        ...docData,
        uid: snap.docs[0].id,
      };
    }
  } catch (err) {
    console.warn('Failed to query user by username:', err);
  }

  // Fallback: check if matches sample authors
  const sampleMatch = SAMPLE_ALGORITHMS.find(
    (s) => formatUsername(s.authorName).toLowerCase() === formatted.toLowerCase()
  );
  if (sampleMatch) {
    return {
      uid: 'sample_' + sampleMatch.id,
      username: formatUsername(sampleMatch.authorName),
      displayName: sampleMatch.authorName,
      avatarIcon: sampleMatch.authorAvatar || 'terminal',
      avatarSeed: sampleMatch.authorName,
      bio: 'Auteur officiel d\'algorithmes certifiés AlgoBox',
      createdAt: sampleMatch.createdAt,
      isRegistered: true,
    };
  }

  return null;
}
