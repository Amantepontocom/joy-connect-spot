import { cn } from '@/lib/utils';

export const CATEGORIES = [
  { id: 'homens', label: 'Homens', icon: '👨' },
  { id: 'mulheres', label: 'Mulheres', icon: '👩' },
  { id: 'lesbicas', label: 'Lésbicas', icon: '👩‍❤️‍👩' },
  { id: 'gays', label: 'Gays', icon: '👨‍❤️‍👨' },
  { id: 'trans', label: 'Trans', icon: '🏳️‍⚧️' },
] as const;

export type CategoryId = typeof CATEGORIES[number]['id'];

interface CategoryFilterProps {
  selectedCategory: CategoryId;
  onCategoryChange: (category: CategoryId) => void;
  className?: string;
}

export function CategoryFilter({ selectedCategory, onCategoryChange, className }: CategoryFilterProps) {
  return (
    <div className={cn("w-full bg-background/95 backdrop-blur-md border-b border-border/30 z-40", className)}>
      <div className="flex items-center justify-between px-2 py-2 gap-1 overflow-x-auto hide-scrollbar">
        {CATEGORIES.map((category) => (
          <button
            key={category.id}
            onClick={() => onCategoryChange(category.id)}
            className={cn(
              "flex-1 min-w-0 flex flex-col items-center gap-0.5 px-2 py-1.5 rounded-xl transition-all duration-200",
              selectedCategory === category.id
                ? "bg-primary text-primary-foreground shadow-md scale-105"
                : "bg-secondary/50 text-muted-foreground hover:bg-secondary"
            )}
          >
            <span className="text-lg leading-none">{category.icon}</span>
            <span className={cn(
              "text-[10px] font-semibold truncate w-full text-center",
              selectedCategory === category.id ? "text-primary-foreground" : "text-foreground"
            )}>
              {category.label}
            </span>
          </button>
        ))}
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
              "flex items-center gap-1.5 px-3 py-2 rounded-full transition-all text-sm font-medium",
              selectedCategories.includes(category.id)
                ? "bg-primary text-primary-foreground"
                : "bg-secondary text-muted-foreground hover:bg-secondary/80"
            )}
          >
            <span>{category.icon}</span>
            <span>{category.label}</span>
          </button>
        ))}
      </div>
      {selectedCategories.length === 0 && (
        <p className="text-xs text-destructive">Selecione pelo menos uma categoria</p>
      )}
    </div>
  );
}
