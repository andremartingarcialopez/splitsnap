import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import type { IconDefinition } from '@fortawesome/fontawesome-svg-core';

const SIZE_CLASS = {
  xs: 'h-3.5 w-3.5',
  sm: 'h-4 w-4',
  md: 'h-5 w-5',
  lg: 'h-7 w-7',
  xl: 'h-8 w-8',
  '2xl': 'h-10 w-10',
} as const;

type AppIconProps = {
  icon: IconDefinition;
  size?: keyof typeof SIZE_CLASS;
  className?: string;
  spin?: boolean;
};

/** Wrapper único para iconos Font Awesome Free. */
export function AppIcon({ icon, size = 'md', className = '', spin }: AppIconProps) {
  return (
    <FontAwesomeIcon
      icon={icon}
      spin={spin}
      className={`shrink-0 ${SIZE_CLASS[size]} ${className}`.trim()}
      aria-hidden
    />
  );
}
