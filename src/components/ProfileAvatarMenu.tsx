import React, { useEffect, useRef, useState } from 'react';
import { Camera, ChevronDown, LogOut, RotateCcw, Upload } from 'lucide-react';
import { ROLE_LABELS, useAssessmentStore } from '../store/useAssessmentStore';
import type { UserRole } from '../types/tvet';

const HONORIFIC_PREFIXES = new Set([
  'dr',
  'dr.',
  'eng',
  'eng.',
  'prof',
  'prof.',
  'hod',
  'principal',
  'cpa',
  'inspector',
  'cdacc',
  'mr',
  'mr.',
  'mrs',
  'mrs.',
  'ms',
  'ms.',
]);

const ROLE_AVATAR_STYLES: Record<UserRole, string> = {
  super_admin: 'bg-[#0F2744] text-white',
  hod: 'bg-blue-700 text-white',
  trainer: 'bg-[#1E3A5F] text-white',
  internal_verifier: 'bg-emerald-700 text-white',
  external_verifier: 'bg-indigo-700 text-white',
  trainee: 'bg-sky-700 text-white',
  management: 'bg-slate-800 text-white',
};

export function getUserInitials(fullName: string): string {
  const rawTokens = fullName
    .trim()
    .split(/\s+/)
    .filter((token) => token.length > 0);
  if (rawTokens.length === 0) return 'TV';

  const meaningful = rawTokens.filter(
    (token) => !HONORIFIC_PREFIXES.has(token.toLowerCase()),
  );
  const parts = meaningful.length > 0 ? meaningful : rawTokens;

  if (parts.length === 1) {
    return parts[0].slice(0, 2).toUpperCase();
  }
  const first = parts[0].charAt(0);
  const last = parts[parts.length - 1].charAt(0);
  return `${first}${last}`.toUpperCase();
}

function resizeAndCropAvatar(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const allowed = ['image/jpeg', 'image/png', 'image/webp'];
    if (!allowed.includes(file.type)) {
      reject(new Error('Please select a JPEG, PNG, or WEBP image file.'));
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      reject(new Error('Image file must be under 5 MB.'));
      return;
    }

    const objectUrl = URL.createObjectURL(file);
    const img = new Image();

    img.onload = () => {
      try {
        const size = 160;
        const canvas = document.createElement('canvas');
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Browser image processing unavailable.'));
          return;
        }

        const minDim = Math.min(img.width, img.height);
        const sx = Math.max(0, (img.width - minDim) / 2);
        const sy = Math.max(0, (img.height - minDim) / 2);

        ctx.drawImage(img, sx, sy, minDim, minDim, 0, 0, size, size);
        const dataUrl = canvas.toDataURL('image/jpeg', 0.84);
        if (dataUrl.length > 140_000) {
          reject(
            new Error('Processed image is too large. Please try a simpler photo.'),
          );
          return;
        }
        resolve(dataUrl);
      } catch {
        reject(new Error('Unable to process selected image.'));
      } finally {
        URL.revokeObjectURL(objectUrl);
      }
    };

    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error('Could not read the selected image file.'));
    };

    img.src = objectUrl;
  });
}

export function ProfileAvatarMenu() {
  const { activeUser, updateProfileAvatar, logout } = useAssessmentStore();
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState<{
    type: 'error' | 'success';
    text: string;
  } | null>(null);

  const containerRef = useRef<HTMLDivElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (!open) return;
    const handleOutside = (e: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
      }
    };
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('mousedown', handleOutside);
    document.addEventListener('keydown', handleEscape);
    return () => {
      document.removeEventListener('mousedown', handleOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [open]);

  const initials = getUserInitials(activeUser.full_name);
  const roleColorClass = ROLE_AVATAR_STYLES[activeUser.role] || 'bg-[#0F2744] text-white';
  const hasCustomPhoto = Boolean(activeUser.avatar_url);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;

    setFeedback(null);
    setSaving(true);
    try {
      const dataUrl = await resizeAndCropAvatar(file);
      const res = await updateProfileAvatar(dataUrl);
      if (!res.ok) {
        setFeedback({
          type: 'error',
          text: res.error || 'Could not save profile picture.',
        });
      } else {
        setFeedback({
          type: 'success',
          text: 'Profile picture updated.',
        });
      }
    } catch (err) {
      setFeedback({
        type: 'error',
        text:
          err instanceof Error ? err.message : 'Unable to upload image.',
      });
    } finally {
      setSaving(false);
    }
  };

  const handleResetToInitials = async () => {
    setFeedback(null);
    setSaving(true);
    const res = await updateProfileAvatar(null);
    setSaving(false);
    if (!res.ok) {
      setFeedback({
        type: 'error',
        text: res.error || 'Could not reset profile picture.',
      });
    } else {
      setFeedback({
        type: 'success',
        text: 'Switched back to account initials.',
      });
    }
  };

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={() => {
          setOpen((prev) => !prev);
          setFeedback(null);
        }}
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-label={`Account profile for ${activeUser.full_name}`}
        className="inline-flex items-center gap-2.5 pl-1 pr-2 py-1 rounded-lg hover:bg-slate-100/80 transition-colors cursor-pointer"
      >
        <span
          className={`w-9 h-9 rounded-full overflow-hidden flex items-center justify-center text-xs font-bold tracking-wide ring-2 ring-slate-200 shrink-0 ${
            hasCustomPhoto ? 'bg-slate-100' : roleColorClass
          }`}
        >
          {hasCustomPhoto && activeUser.avatar_url ? (
            <img
              src={activeUser.avatar_url}
              alt={activeUser.full_name}
              className="w-full h-full object-cover"
            />
          ) : (
            initials
          )}
        </span>

        <span className="hidden lg:flex flex-col items-start text-left leading-tight">
          <span className="text-xs font-semibold text-[#0F2744] max-w-[140px] truncate">
            {activeUser.full_name}
          </span>
          <span className="text-[11px] text-slate-500">
            {ROLE_LABELS[activeUser.role]}
          </span>
        </span>

        <ChevronDown
          className={`w-3.5 h-3.5 text-slate-500 transition-transform ${
            open ? 'rotate-180' : ''
          }`}
        />
      </button>

      {open && (
        <div
          role="dialog"
          aria-label="Account Profile & Picture"
          className="absolute right-0 mt-2 w-80 bg-white border border-slate-200 rounded-lg shadow-xl p-4 z-50"
        >
          {/* Identity Summary */}
          <div className="flex items-start gap-3.5 pb-3.5 border-b border-slate-200">
            <div className="relative shrink-0">
              <div
                className={`w-14 h-14 rounded-full overflow-hidden flex items-center justify-center text-base font-bold tracking-wide ring-2 ring-slate-200 ${
                  hasCustomPhoto ? 'bg-slate-100' : roleColorClass
                }`}
              >
                {hasCustomPhoto && activeUser.avatar_url ? (
                  <img
                    src={activeUser.avatar_url}
                    alt={activeUser.full_name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  initials
                )}
              </div>
              <button
                type="button"
                disabled={saving}
                onClick={() => fileInputRef.current?.click()}
                title="Change profile photo"
                className="absolute -bottom-0.5 -right-0.5 w-6 h-6 rounded-full bg-white border border-slate-300 shadow-sm flex items-center justify-center text-[#0F2744] hover:bg-slate-50 cursor-pointer disabled:opacity-50"
              >
                <Camera className="w-3 h-3" />
              </button>
            </div>

            <div className="min-w-0 flex-1">
              <p className="text-sm font-bold text-[#0F2744] truncate">
                {activeUser.full_name}
              </p>
              <p className="text-xs font-semibold text-blue-700">
                {ROLE_LABELS[activeUser.role]}
              </p>
              <p className="text-[11px] font-mono text-slate-600 mt-0.5 truncate">
                {activeUser.staff_or_adm_no}
              </p>
              <p className="text-[11px] text-slate-500 truncate">
                {activeUser.email}
              </p>
            </div>
          </div>

          {/* Photo Controls */}
          <div className="py-3 space-y-2.5">
            <div className="flex items-center justify-between text-[11px] text-slate-500">
              <span>Account Visual ID</span>
              <span className="font-medium text-slate-700">
                {hasCustomPhoto ? 'Custom Photo' : `Initials (${initials})`}
              </span>
            </div>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/png,image/jpeg,image/webp"
              className="hidden"
              onChange={handleFileChange}
            />

            <div className="flex items-center gap-2">
              <button
                type="button"
                disabled={saving}
                onClick={() => fileInputRef.current?.click()}
                className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-semibold text-white bg-[#0F2744] rounded-md hover:bg-[#17365D] transition-colors cursor-pointer disabled:opacity-60"
              >
                <Upload className="w-3.5 h-3.5" />
                {saving
                  ? 'Saving...'
                  : hasCustomPhoto
                    ? 'Change Photo'
                    : 'Upload Photo'}
              </button>

              {hasCustomPhoto && (
                <button
                  type="button"
                  disabled={saving}
                  onClick={handleResetToInitials}
                  className="inline-flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-700 bg-slate-100 border border-slate-200 rounded-md hover:bg-slate-200/70 transition-colors cursor-pointer disabled:opacity-60"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  Initials
                </button>
              )}
            </div>

            <p className="text-[11px] text-slate-500">
              JPG, PNG, or WEBP · Auto-cropped square for instant identification.
            </p>

            {feedback && (
              <div
                className={`px-2.5 py-1.5 rounded-md text-xs font-medium border ${
                  feedback.type === 'error'
                    ? 'bg-red-50 text-red-700 border-red-200'
                    : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                }`}
              >
                {feedback.text}
              </div>
            )}
          </div>

          {/* Account Action */}
          <div className="pt-2.5 border-t border-slate-200 flex justify-end">
            <button
              type="button"
              onClick={() => {
                setOpen(false);
                logout();
              }}
              className="w-full inline-flex items-center justify-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-white border border-slate-300 rounded-md hover:bg-slate-50 transition-colors cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5 text-slate-600" />
              Sign Out
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
