import { useLocalStorage } from './useLocalStorage';

export function useFavoriteTools() {
  const [favorites, setFavorites] = useLocalStorage<string[]>('ar-favorite-tools', []);

  function isFavorite(path: string) {
    return favorites.includes(path);
  }

  function toggleFavorite(path: string) {
    setFavorites((prev) => (prev.includes(path) ? prev.filter((p) => p !== path) : [...prev, path]));
  }

  return { favorites, isFavorite, toggleFavorite };
}
