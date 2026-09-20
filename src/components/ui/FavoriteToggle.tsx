import { Star } from 'lucide-react';
import { useFavoriteTools } from '@/hooks/useFavoriteTools';
import { clsx } from '@/lib/utils/clsx';

export function FavoriteToggle({ path }: { path: string }) {
  const { isFavorite, toggleFavorite } = useFavoriteTools();
  const favorite = isFavorite(path);

  return (
    <button
      onClick={() => toggleFavorite(path)}
      aria-pressed={favorite}
      aria-label={favorite ? 'Remove from favorites' : 'Add to favorites'}
      className={clsx(
        'flex h-9 w-9 items-center justify-center rounded-full border transition-colors shrink-0',
        favorite
          ? 'border-amber-400 bg-amber-400/10 text-amber-500'
          : 'border-navy-200 dark:border-white/10 text-navy-400 hover:border-amber-400 hover:text-amber-500'
      )}
    >
      <Star size={16} fill={favorite ? 'currentColor' : 'none'} />
    </button>
  );
}
