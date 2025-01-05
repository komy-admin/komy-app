import React from 'react';
import { FilterConfig, FilterValue } from '~/types/filter.types';

interface FilterBarProps<T> {
  config: FilterConfig<T>[];
  onUpdateFilter: (field: string, value: string | number | boolean | Date) => void;
  onClearFilters: () => void;
  activeFilters: FilterValue[];
}

export function FilterBar<T>({
  config,
  onUpdateFilter,
  onClearFilters,
  activeFilters
}: FilterBarProps<T>) {
  return (
    <div className="bg-white p-4 rounded-lg shadow-sm mb-4">
      <div className="flex flex-wrap gap-4 items-center">
        {config.map((filter) => (
          <div key={String(filter.field)} className="flex-1 min-w-[200px]">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {filter.label}
            </label>
            {filter.type === 'text' && (
              <div className="relative">
                <input
                  type="text"
                  className="pl-2 w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  onChange={(e) => onUpdateFilter(String(filter.field), e.target.value)}
                  value={activeFilters.find(f => f.field === filter.field)?.value as string || ''}
                  placeholder={`${filter.label.toLowerCase()}`}
                />
              </div>
            )}
            {filter.type === 'number' && (
              <input
                type="number"
                className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                onChange={(e) => onUpdateFilter(String(filter.field), Number(e.target.value))}
                value={activeFilters.find(f => f.field === filter.field)?.value as number || ''}
              />
            )}
            {filter.type === 'boolean' && (
              <select
                className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                onChange={(e) => onUpdateFilter(String(filter.field), e.target.value === 'true')}
                value={String(activeFilters.find(f => f.field === filter.field)?.value) || ''}
              >
                <option value="">Tous</option>
                <option value="true">Oui</option>
                <option value="false">Non</option>
              </select>
            )}
          </div>
        ))}
        {/* {activeFilters.length > 0 && (
          <button
            onClick={onClearFilters}
            className="flex items-center px-3 py-2 text-sm text-gray-600 hover:text-gray-900"
          >
            Effacer les filtres
          </button>
        )} */}
      </div>
    </div>
  );
}