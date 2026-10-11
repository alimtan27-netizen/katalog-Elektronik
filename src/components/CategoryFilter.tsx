import React from 'react';
import { ProductCategory } from '../types';

interface CategoryFilterProps {
  selectedCategory: ProductCategory;
  onSelectCategory: (cat: ProductCategory) => void;
  totalCount: number;
}

const CATEGORIES: { label: string; value: ProductCategory }[] = [
  { label: 'Semua Produk', value: 'Semua' },
  { label: 'Laptop & Komputer', value: 'Laptop & Komputer' },
  { label: 'Ponsel & Tablet', value: 'Ponsel & Tablet' },
  { label: 'Kamera & Audio', value: 'Kamera & Audio' },
  { label: 'Aksesoris & Gadget', value: 'Aksesoris & Gadget' },
];

export const CategoryFilter: React.FC<CategoryFilterProps> = ({
  selectedCategory,
  onSelectCategory,
  totalCount,
}) => {
  return (
    <div className="pt-1 pb-3">
      <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1">
        {CATEGORIES.map((cat) => {
          const isSelected = selectedCategory === cat.value;
          return (
            <button
              key={cat.value}
              id={`cat-pill-${cat.value.toLowerCase().replace(/[^a-z0-9]/g, '-')}`}
              onClick={() => onSelectCategory(cat.value)}
              className={`shrink-0 px-3.5 py-1.5 rounded-full text-xs sm:text-sm font-bold transition-all select-none ${
                isSelected
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'bg-slate-100 hover:bg-slate-200/80 text-slate-600'
              }`}
            >
              {cat.label}
            </button>
          );
        })}
      </div>

      <div className="flex items-center justify-between mt-2.5 text-slate-500 text-xs font-medium">
        <span className="font-semibold text-slate-700">{totalCount} barang tersedia</span>
        <span className="flex items-center gap-1 text-[11px] text-indigo-600 font-medium">
          <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
          <span>Garansi & Verifikasi Admin</span>
        </span>
      </div>
    </div>
  );
};
