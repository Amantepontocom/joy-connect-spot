import { cn } from '@/lib/utils';
import { useRef, useEffect } from 'react';

export const CATEGORIES = [
  { id: 'mulheres', label: 'MULHERES' },
  { id: 'homens', label: 'HOMENS' },
  { id: 'lesbicas', label: 'LÉSBICAS' },
  { id: 'gays', label: 'GAYS' },
  { id: 'trans', label: 'TRANS' },
] as const;

export type CategoryId = typeof CATEGORIES[number]['id'];

interface CategoryFilterProps {
  selectedCategory: CategoryId;
  onCategoryChange: (category: CategoryId) => void;
  className?: string;
}

export function CategoryFilter({ selectedCategory, onCategoryChange, className }: CategoryFilterProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const selectedRef = useRef<HTMLButtonElement>(null);

  // Auto-scroll to selected category
  useEffect(() => {
    if (selectedRef.current && containerRef.current) {
      const container = containerRef.current;
      const selected = selectedRef.current;
      const scrollLeft = selected.offsetLeft - container.offsetWidth / 2 + selected.offsetWidth / 2;
      container.scrollTo({ left: scrollLeft, behavior: 'smooth' });
    }
  }, [selectedCategory]);

  return (
    <div className={cn("w-full", className)}>
      {/* Gradient shadow from top */}
      <div className="absolute top-0 left-0 right-0 h-28 bg-gradient-to-b from-black/80 via-black/40 to-transparent pointer-events-none z-40" />
      
      <div 
        ref={containerRef}
        className="relative z-50 flex items-center gap-2 overflow-x-auto hide-scrollbar px-3 py-3"
      >
        {CATEGORIES.map((category) => {
          const isSelected = selectedCategory === category.id;
          return (
            <button
              key={category.id}
              ref={isSelected ? selectedRef : null}
              onClick={() => onCategoryChange(category.id)}
              className={cn(
                "flex-shrink-0 px-4 py-2 rounded-full text-xs font-bold uppercase tracking-wide transition-all duration-200 whitespace-nowrap",
                isSelected
                  ? "bg-white/10 border border-primary text-primary"
                  : "bg-white/5 border border-white/20 text-white/80 hover:text-white hover:bg-white/10"
              )}
            >
              {category.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}

interface CategorySelectorProps {
  selectedCategories: CategoryId[];
  onCategoriesChange: (categories: CategoryId[]) => void;
  className?: string;
}

export function CategorySelector({ selectedCategories, onCategoriesChange, className }: CategorySelectorProps) {
  const toggleCategory = (categoryId: CategoryId) => {
    if (selectedCategories.includes(categoryId)) {
      onCategoriesChange(selectedCategories.filter(c => c !== categoryId));
    } else {
      onCategoriesChange([...selectedCategories, categoryId]);
    }
  };

  return (
    <div className={cn("space-y-2", className)}>
      <label className="text-xs text-muted-foreground">Categorias *</label>
      <div className="flex flex-wrap gap-2">
        {CATEGORIES.map((category) => (
          <button
            key={category.id}
            type="button"
            onClick={() => toggleCategory(category.id)}
            className={cn(
              "px-3 py-2 rounded-full transition-all text-sm font-medium",
              selectedCategories.includes(category.id)
                ? "bg-primary text-primary-foreground"
                : "bg-secondary text-muted-foreground hover:bg-secondary/80"
            )}
          >
            {category.label}
          </button>
        ))}
      </div>
      {selectedCategories.length === 0 && (
        <p className="text-xs text-destructive">Selecione pelo menos uma categoria</p>
      )}
    </div>
  );
}
