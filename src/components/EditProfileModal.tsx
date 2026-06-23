import React from 'react';
import { CoupleState, LanguageCode } from '../types';
import { X, Edit3, Plus } from 'lucide-react';
import { uploadDataUrl } from '../storage';
import { ANIMAL_PRESETS, CHARACTER_PRESETS } from '../data/avatarPresets';

interface EditProfileModalProps {
  editingProfileTarget: 'me' | 'partner';
  profileNameInput: string;
  setProfileNameInput: React.Dispatch<React.SetStateAction<string>>;
  profileAvatarInput: string;
  setProfileAvatarInput: React.Dispatch<React.SetStateAction<string>>;
  lang: LanguageCode;
  currentUserEmail: string | null;
  setState: React.Dispatch<React.SetStateAction<CoupleState>>;
  onInteract?: (inc: number) => void;
  addFloatingHearts: () => void;
  showTempAlert: (msg: string) => void;
  setEditingProfileTarget: React.Dispatch<React.SetStateAction<'me' | 'partner' | null>>;
}

/**
 * Profile editor modal: pick a preset animal/character avatar, paste a URL,
 * or upload a local  plus edit the display name.
 */
export default function EditProfileModal({
  editingProfileTarget,
  profileNameInput,
  setProfileNameInput,
  profileAvatarInput,
  setProfileAvatarInput,
  lang,
  currentUserEmail,
  setState,
  onInteract,
  addFloatingHearts,
  showTempAlert,
  setEditingProfileTarget
}: EditProfileModalProps) {
  return (
    <div className="fixed inset-0 z-[100] bg-black/85 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-[#121216] border border-pink-500/30 rounded-3xl p-5 max-w-[420px] w-full space-y-4 shadow-2xl relative my-8 animate-fadeIn text-left">
        {/* Header close cross */}
        <button
          onClick={() => setEditingProfileTarget(null)}
          className="absolute top-4 right-4 text-slate-400 hover:text-white p-1 rounded-full bg-white/5 cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="space-y-1">
          <h3 className="text-sm font-black text-white uppercase tracking-wider flex items-center gap-1.5 leading-none">
            <Edit3 className="w-4 h-4 text-[#ff4d6d]" />
            {lang === 'es' ? 'Personalizar Perfil: ' : 'Customize Profile: '}
            {editingProfileTarget === 'me'
              ? lang === 'es'
                ? 'Elegir mi Foto & Nombre'
                : 'Choose my Photo & Name'
              : lang === 'es'
                ? 'Ajustar para Pareja'
                : 'Adjust for Partner'}
          </h3>
          <p className="text-[10px] text-zinc-400">
            {lang === 'es'
              ? 'Selecciona uno de los hermosos animales o personajes animados predeterminados, o publica tu propio enlace de foto.'
              : 'Pick one of the lovely preset animals or animated characters, or post your own photo link.'}
          </p>
        </div>

        {/* Profile Inputs */}
        <div className="space-y-3 pt-2">
          <div className="space-y-1">
            <label className="text-[10px] uppercase font-black tracking-widest text-[#ff4d6d] block">
              {lang === 'es' ? 'Nombre de Perfil' : 'Profile Name'}
            </label>
            <input
              type="text"
              value={profileNameInput}
              onChange={(e) => setProfileNameInput(e.target.value)}
              placeholder={
                editingProfileTarget === 'me'
                  ? lang === 'es'
                    ? 'Ingresa tu nombre...'
                    : 'Enter your name...'
                  : lang === 'es'
                    ? 'Nombre de tu pareja...'
                    : "Your partner's name..."
              }
              className="w-full bg-black/50 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-[#ff4d6d]"
            />
          </div>

          {/* SECTION A: CUTE ANIMALS */}
          <div className="space-y-1.5">
            <label className="text-[10px] uppercase font-black tracking-widest text-slate-400 block">
              {lang === 'es'
                ? 'Opción 1: Animales Predeterminados 🐼'
                : 'Option 1: Preset Animals 🐼'}
            </label>
            <div className="grid grid-cols-3 gap-2">
              {ANIMAL_PRESETS.map((preset) => {
                const isSelected = profileAvatarInput === preset.url;
                return (
                  <button
                    key={preset.name}
                    type="button"
                    onClick={() => {
                      setProfileAvatarInput(preset.url);
                      addFloatingHearts();
                    }}
                    className={`p-1.5 rounded-xl bg-white/5 hover:bg-white/10 border transition-all text-center flex flex-col items-center gap-1 cursor-pointer ${isSelected ? 'border-[#ff4d6d] bg-pink-500/10 shadow-md ring-1 ring-[#ff4d6d]/40' : 'border-white/5'}`}
                  >
                    <div className="w-10 h-10 rounded-lg overflow-hidden bg-slate-950">
                      <img
                        src={preset.url}
                        alt={preset.name}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <span className="text-[8px] font-sans text-slate-305 leading-none font-bold truncate max-w-full">
                      {preset.name}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* SECTION B: ANIMATED CHARACTERS */}
          <div className="space-y-1.5">
            <label className="text-[10px] uppercase font-black tracking-widest text-slate-400 block">
              {lang === 'es'
                ? 'Opción 2: Personajes Animados ✨'
                : 'Option 2: Animated Characters ✨'}
            </label>
            <div className="grid grid-cols-3 gap-2">
              {CHARACTER_PRESETS.map((preset) => {
                const isSelected = profileAvatarInput === preset.url;
                return (
                  <button
                    key={preset.name}
                    type="button"
                    onClick={() => {
                      setProfileAvatarInput(preset.url);
                      addFloatingHearts();
                    }}
                    className={`p-1.5 rounded-xl bg-white/5 hover:bg-white/10 border transition-all text-center flex flex-col items-center gap-1 cursor-pointer ${isSelected ? 'border-[#ff4d6d] bg-pink-500/10 shadow-md ring-1 ring-[#ff4d6d]/40' : 'border-white/5'}`}
                  >
                    <div className="w-10 h-10 rounded-lg overflow-hidden bg-slate-950">
                      <img
                        src={preset.url}
                        alt={preset.name}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <span className="text-[8px] font-sans text-slate-305 leading-none font-bold truncate max-w-full">
                      {preset.name}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* SECTION C: CUSTOM PHOTO URL INPUT */}
          <div className="space-y-1 pt-1">
            <label className="text-[10px] uppercase font-black tracking-widest text-[#ff4d6d] block">
              {lang === 'es'
                ? 'Opción 3: Publicar tu propia foto (Enlace/URL)'
                : 'Option 3: Post your own photo (Link/URL)'}
            </label>
            <input
              type="text"
              value={profileAvatarInput}
              onChange={(e) => setProfileAvatarInput(e.target.value)}
              placeholder={
                lang === 'es'
                  ? 'Pega la URL de cualquier imagen web...'
                  : 'Paste any web image URL...'
              }
              className="w-full bg-black/50 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-purple-500 font-mono"
            />
          </div>

          {/* SECTION D: NATIVE UPLOAD FILE */}
          <div className="space-y-1 pt-1">
            <label className="text-[10px] uppercase font-black tracking-widest text-[#ff4d6d] block">
              {lang === 'es'
                ? 'Opción 4: Subir tu foto de perfil directamente'
                : 'Option 4: Upload your profile photo directly'}
            </label>
            <label className="flex flex-col items-center justify-center w-full h-16 border border-dashed border-zinc-800 hover:border-pink-500/55 bg-black/40 rounded-xl cursor-pointer transition-all p-2 group">
              <div className="flex flex-col items-center justify-center text-center">
                <Plus className="w-4 h-4 text-zinc-500 group-hover:text-pink-500 mb-0.5" />
                <p className="text-[9px] font-bold text-zinc-400">
                  {lang === 'es' ? 'Seleccionar archivo local 📸' : 'Select local filename'}
                </p>
                <span className="text-[7px] text-zinc-600 leading-none">
                  {lang === 'es' ? 'Soporta PNG, JPEG y JPG' : 'Supports PNG, JPEG and JPG'}
                </span>
              </div>
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    const reader = new FileReader();
                    reader.onload = (event) => {
                      if (event.target?.result) {
                        setProfileAvatarInput(event.target.result as string);
                        showTempAlert(
                          lang === 'es'
                            ? '¡Imagen cargada en el perfil!'
                            : 'Image loaded into profile!'
                        );
                      }
                    };
                    reader.readAsDataURL(file);
                  }
                }}
              />
            </label>
            {profileAvatarInput && profileAvatarInput.startsWith('data:') && (
              <div className="flex items-center gap-1.5 bg-green-500/10 border border-green-500/20 px-2 py-1 rounded-xl">
                <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
                <span className="text-[8px] text-green-400 font-bold truncate flex-1">
                  {lang === 'es'
                    ? 'Archivo de imagen seleccionado con éxito.'
                    : 'Image file selected successfully.'}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Actions Footer */}
        <div className="flex gap-2.5 pt-3 border-t border-white/5">
          <button
            type="button"
            onClick={() => {
              setProfileAvatarInput('');
            }}
            className="px-3 py-2.5 bg-red-950/20 hover:bg-red-950/40 text-red-400 text-xs font-bold rounded-xl transition-all cursor-pointer border border-red-500/20"
            title={lang === 'es' ? 'Quitar foto' : 'Remove photo'}
          >
            {lang === 'es' ? 'Quitar Foto 🗑️' : 'Remove Photo 🗑️'}
          </button>

          <div className="flex-1 flex gap-2 justify-end">
            <button
              type="button"
              onClick={() => setEditingProfileTarget(null)}
              className="px-3.5 py-2.5 bg-zinc-900 hover:bg-zinc-800 text-zinc-400 text-xs font-bold rounded-xl transition-all cursor-pointer border border-white/5"
            >
              {lang === 'es' ? 'Cancelar' : 'Cancel'}
            </button>
            <button
              type="button"
              onClick={async () => {
                const target = editingProfileTarget;
                const incrementProfile = 1.5;

                // Upload an inline base64 avatar to Storage so the heavy image
                // doesn't end up in app state, localStorage and every poll payload.
                let avatar = profileAvatarInput;
                if (avatar.startsWith('data:')) {
                  avatar = await uploadDataUrl(avatar, 'avatars');
                }

                setState((prev) => {
                  const updated = {
                    ...prev,
                    [target === 'me' ? 'meName' : 'partnerName']: profileNameInput,
                    [target === 'me' ? 'meAvatar' : 'partnerAvatar']: avatar,
                    // boost love warmth on profile tweak
                    warmth: Math.min(100, Number((prev.warmth + incrementProfile).toFixed(1))),
                  };
                  return updated;
                });
                if (onInteract) onInteract(incrementProfile);

                // Sync customized values to server
                if (currentUserEmail && target === 'me') {
                  fetch('/api/user/update', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                      email: currentUserEmail,
                      name: profileNameInput,
                      avatar: avatar,
                    }),
                  }).catch((err) => console.error('Could not sync user profile modify:'));
                }

                setEditingProfileTarget(null);
                showTempAlert(lang === 'es' ? '¡Perfil actualizado! 💖' : 'Profile customized! 💖');
                for (let i = 0; i < 4; i++) setTimeout(addFloatingHearts, i * 150);
              }}
              className="px-4.5 py-2.5 bg-gradient-to-r from-[#ff4d6d] to-purple-600 hover:scale-[1.02] text-white font-black text-xs rounded-xl shadow-lg transition-all cursor-pointer border-none"
            >
              Guardar Cambios 💖
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

