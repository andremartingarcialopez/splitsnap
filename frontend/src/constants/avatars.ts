export type AvatarOption = {
  id: string;
  emoji: string;
  label: string;
};

export const AVATAR_GALLERY: AvatarOption[] = [
  { id: 'bear', emoji: '🐻', label: 'Oso' },
  { id: 'fox', emoji: '🦊', label: 'Zorro' },
  { id: 'cat', emoji: '🐱', label: 'Gato' },
  { id: 'dog', emoji: '🐶', label: 'Perro' },
  { id: 'panda', emoji: '🐼', label: 'Panda' },
  { id: 'lion', emoji: '🦁', label: 'León' },
  { id: 'unicorn', emoji: '🦄', label: 'Unicornio' },
  { id: 'robot', emoji: '🤖', label: 'Robot' },
  { id: 'alien', emoji: '👽', label: 'Alien' },
  { id: 'ninja', emoji: '🥷', label: 'Ninja' },
  { id: 'chef', emoji: '👨‍🍳', label: 'Chef' },
  { id: 'star', emoji: '⭐', label: 'Estrella' },
];

export function avatarEmoji(avatarId: string | null | undefined): string {
  return AVATAR_GALLERY.find((a) => a.id === avatarId)?.emoji ?? '👤';
}
