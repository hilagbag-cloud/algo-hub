import React, { useState, useRef } from 'react';
import {
  X,
  Upload,
  FileCode,
  CheckCircle2,
  AlertCircle,
  Play,
  Save,
} from 'lucide-react';
import { parseAlgoBox } from '../lib/algoboxParser';
import { createAlgorithm } from '../lib/firestoreService';
import { UserProfile } from '../types/algobox';

interface UploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  userProfile: UserProfile;
  onCreatedAndTest: (rawCode: string, title: string) => void;
}

export const UploadModal: React.FC<UploadModalProps> = ({
  isOpen,
  onClose,
  userProfile,
  onCreatedAndTest,
}) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('Arithmétique');
  const [tagsInput, setTagsInput] = useState('maths, algobox');
  const [rawAlgContent, setRawAlgContent] = useState('');
  const [isDragging, setIsDragging] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  let parsedValidation = null;
  if (rawAlgContent.trim().length > 0) {
    try {
      parsedValidation = parseAlgoBox(rawAlgContent);
    } catch {}
  }

  const handleFileDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      processFile(e.target.files[0]);
    }
  };

  const processFile = (file: File) => {
    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      setRawAlgContent(text);
      if (!title) {
        const cleanName = file.name.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' ');
        setTitle(cleanName.charAt(0).toUpperCase() + cleanName.slice(1));
      }
      try {
        const parsed = parseAlgoBox(text);
        if (parsed.description && !description) {
          setDescription(parsed.description);
        }
      } catch {}
    };
    reader.readAsText(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setErrorMessage('Veuillez renseigner un titre');
      return;
    }
    if (!rawAlgContent.trim()) {
      setErrorMessage('Veuillez importer ou coller le code AlgoBox (.alg)');
      return;
    }

    setIsSubmitting(true);
    setErrorMessage('');

    try {
      const tags = tagsInput
        .split(',')
        .map((t) => t.trim().toLowerCase().replace(/^#/, ''))
        .filter((t) => t.length > 0);

      await createAlgorithm({
        title: title.trim(),
        description: description.trim(),
        rawAlgContent: rawAlgContent.trim(),
        category,
        tags,
        authorId: userProfile.uid,
        authorName: userProfile.displayName,
        authorAvatar: userProfile.avatarIcon,
      });

      onClose();
    } catch (err: any) {
      setErrorMessage(`Erreur : ${err.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleTestNow = () => {
    if (!rawAlgContent.trim()) {
      setErrorMessage('Veuillez coller du code AlgoBox');
      return;
    }
    onCreatedAndTest(rawAlgContent, title || 'Algorithme personnalisé');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
      <div className="bg-white text-zinc-900 rounded-3xl max-w-xl w-full max-h-[90vh] flex flex-col shadow-2xl border border-orange-100 overflow-hidden">
        {/* Modal Header */}
        <div className="px-6 py-4 bg-orange-500 text-white flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Upload className="w-5 h-5" />
            <h2 className="font-extrabold text-base">Publier un Algorithme (.alg)</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-full hover:bg-white/20 transition text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-4">
          {errorMessage && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-2xl text-xs text-red-700 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Drag & Drop File Zone */}
          <div>
            <div
              onDragOver={(e) => {
                e.preventDefault();
                setIsDragging(true);
              }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={handleFileDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-2xl p-5 text-center cursor-pointer transition ${
                isDragging
                  ? 'border-orange-500 bg-orange-50'
                  : 'border-zinc-200 hover:border-orange-400 bg-zinc-50'
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".alg,.xml,.txt"
                onChange={handleFileChange}
                className="hidden"
              />
              <FileCode className="w-7 h-7 mx-auto text-orange-500 mb-1.5" />
              <div className="text-xs font-bold text-zinc-800">
                Glissez votre fichier .alg ici ou cliquez
              </div>
            </div>
          </div>

          {/* Code Textarea */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-xs font-bold text-zinc-700">
                Ou collez le code AlgoBox
              </label>
              {parsedValidation && (
                <div className="flex items-center gap-1 text-xs text-orange-600 font-bold">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Validé ({parsedValidation.variables.length} var)</span>
                </div>
              )}
            </div>
            <textarea
              value={rawAlgContent}
              onChange={(e) => setRawAlgContent(e.target.value)}
              placeholder="Collez ici le code .alg ou XML..."
              rows={4}
              className="w-full font-mono text-xs p-3 bg-zinc-50 border border-zinc-200 rounded-2xl focus:border-orange-500 outline-none"
              spellCheck={false}
            />
          </div>

          {/* Title & Category */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-zinc-700 mb-1">
                Titre *
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Ex: Jeu du Nombre Mystère"
                className="w-full text-xs px-3 py-2 bg-white border border-zinc-200 rounded-full focus:border-orange-500 outline-none"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-zinc-700 mb-1">
                Catégorie
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full text-xs px-3 py-2 bg-white border border-zinc-200 rounded-full focus:border-orange-500 outline-none"
              >
                <option value="Arithmétique">Arithmétique</option>
                <option value="Jeux & Interactivité">Jeux & Interactivité</option>
                <option value="Suites Numériques">Suites Numériques</option>
                <option value="Algèbre">Algèbre</option>
                <option value="Géométrie">Géométrie</option>
                <option value="Probabilités & Stats">Probabilités & Stats</option>
                <option value="Autre">Autre</option>
              </select>
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-bold text-zinc-700 mb-1">
              Description (optionnel)
            </label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Courte description de ce que fait l'algorithme..."
              className="w-full text-xs px-3 py-2 bg-white border border-zinc-200 rounded-full focus:border-orange-500 outline-none"
            />
          </div>

          {/* Modal Footer Actions */}
          <div className="pt-3 border-t border-zinc-100 flex items-center justify-between gap-2">
            <button
              type="button"
              onClick={handleTestNow}
              className="flex items-center gap-1.5 px-4 py-2 rounded-full border border-orange-500 text-orange-600 hover:bg-orange-50 text-xs font-bold transition"
            >
              <Play className="w-3.5 h-3.5 fill-orange-500" />
              <span>Tester avant de publier</span>
            </button>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-full text-zinc-500 hover:text-zinc-800 text-xs font-semibold"
              >
                Annuler
              </button>

              <button
                type="submit"
                disabled={isSubmitting}
                className="flex items-center gap-1.5 px-5 py-2 rounded-full bg-orange-500 hover:bg-orange-600 disabled:opacity-50 text-white text-xs font-bold transition shadow-sm shadow-orange-500/25"
              >
                <Save className="w-4 h-4" />
                <span>{isSubmitting ? 'Publication...' : 'Publier'}</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
