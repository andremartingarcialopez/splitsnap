import { AVATAR_GALLERY } from '../constants/avatars';

type AvatarPickerProps = {
  value: string;
  onChange: (avatarId: string) => void;
};

export function AvatarPicker({ value, onChange }: AvatarPickerProps) {
  return (
    <div className="grid grid-cols-4 gap-2 sm:grid-cols-6">
      {AVATAR_GALLERY.map((avatar) => {
        const selected = value === avatar.id;
        return (
          <button
            key={avatar.id}
            type="button"
            title={avatar.label}
            className={[
              'flex aspect-square items-center justify-center rounded-2xl text-2xl transition',
              selected
                ? 'bg-primary-muted ring-2 ring-primary dark:bg-primary/20 dark:ring-primary-light'
                : 'bg-surface-muted hover:bg-border/40 dark:bg-slate-800 dark:hover:bg-slate-700',
            ].join(' ')}
            onClick={() => onChange(avatar.id)}
          >
            {avatar.emoji}
          </button>
        );
      })}
    </div>
  );
}
