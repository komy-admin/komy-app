import React, { useEffect, useState } from "react";
import { Input } from "~/components/ui";
import { View } from 'react-native';
import { ForkSelect } from '~/components/ui/select';
import { NumberInput } from "~/components/ui/numberInput";
import { TextInput } from 'react-native';
import { FilterConfig, FilterOperator, FilterValue } from "~/hooks/useFilter/types";
interface FilterBarProps<T> {
  config: FilterConfig<T>[];
  onUpdateFilter: (field: string, value: any, operator?: FilterOperator) => void;
  onClearFilters: () => void;
  activeFilters: FilterValue[];
}

export function FilterBar<T>({
  config,
  onUpdateFilter,
  onClearFilters,
  activeFilters
}: FilterBarProps<T>) {
  const defaultOption = {label: 'Choisissez une catégorie',  value: '' };
  const [selectedOption, setSelectedOption] = useState(defaultOption);

  const getFilterValue = (field: string) => 
    activeFilters.find(f => f.field === field)?.value;

  const renderFilterInput = (filter: FilterConfig<T>) => {
    const value = getFilterValue(String(filter.field));
    const operator = filter.operator;
    const options = filter.options;
    switch (filter.type) {
      case 'text':
        return (
          <View>
            <TextInput
              value={activeFilters.find(f => f.field === filter.field)?.value as string}
              onChangeText={(text: string) => onUpdateFilter(String(filter.field), text, operator)}
              placeholder={`${filter.label.toLowerCase()}`}
              style={{ borderWidth: 1, borderColor: '#D7D7D7', borderRadius: 5, backgroundColor: '#FFFFFF', padding: 10, color: '#2A2E33' }}
            />
          </View>
        );
      case 'number':
        if (operator === 'between') {
          const [min, max] = (value as [number, number]) || [null, null];
          return (
            <View className="flex">
              <NumberInput
                style={{ marginBottom: 8 }}
                value={typeof value === 'number' ? value : 0}
                onChangeText={(e) => onUpdateFilter(String(filter.field), [e, max], operator)}
                decimalPlaces={2}
                min={0}
                max={1000}
                currency="€"
                placeholder={`${filter.label.toLowerCase()} min `}
              />
              <NumberInput
                style={{ marginTop: 8 }}
                value={typeof value === 'number' ? value : 0}
                onChangeText={(e) => onUpdateFilter(String(filter.field), [min, e], operator)}
                decimalPlaces={2}
                min={0}
                max={1000}
                currency="€"
                placeholder={`${filter.label.toLowerCase()} max `}
              />
            </View>
          );
        }
        return (
          <NumberInput
            value={typeof value === 'number' ? value : 0}
            onChangeText={(e) => onUpdateFilter(String(filter.field), e, operator)}
            decimalPlaces={2}
            min={0}
            max={1000}
            currency="€"
            placeholder="0.00"
          />
        );

      // case 'date':
      //   if (operator === 'between') {
      //     const [startDate, endDate] = (value as unknown as [Date, Date]) || [null, null];
      //     return (
      //       <View className="flex gap-2">
      //         <input
      //           type="date"
      //           className="w-1/2 rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
      //           onChange={(e) => onUpdateFilter(String(filter.field), [new Date(e.target.value), endDate], operator)}
      //           value={startDate ? new Date(startDate).toISOString().split('T')[0] : ''}
      //         />
      //         <input
      //           type="date"
      //           className="w-1/2 rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
      //           onChange={(e) => onUpdateFilter(String(filter.field), [startDate, new Date(e.target.value)], operator)}
      //           value={endDate ? new Date(endDate).toISOString().split('T')[0] : ''}
      //         />
      //       </View>
      //     );
      //   }
      //   return (
      //     <input
      //       type="date"
      //       className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
      //       onChange={(e) => onUpdateFilter(String(filter.field), new Date(e.target.value), operator)}
      //       value={value ? new Date(value as Date).toISOString().split('T')[0] : ''}
      //     />
      //   );

      // case 'boolean':
      //   return (
      //     <select
      //       className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
      //       onChange={(e) => onUpdateFilter(String(filter.field), e.target.value === 'true', operator)}
      //       value={String(value) || ''}
      //     >
      //       <option value="">Tous</option>
      //       <option value="true">Oui</option>
      //       <option value="false">Non</option>
      //     </select>
      //   );

      // case 'select':
      //   if (operator === 'in') {
      //     <ForkSelect
      //       choices={options || []}
      //       selectedValue={selectedOption}
      //       onValueChange={(e) => { 
      //         onUpdateFilter(String(filter.field), e, operator)
      //         if (options && e) {
      //           const selected = options.find(option => String(option.value) === String(e.value));
      //           if (selected) setSelectedOption(selected);
      //         }
      //       }}
      //     />
      //   }
      default:
        return null;
    }
  };

  return (
    <View className="">
      {config.filter(c => c.show).map((filter) => (
        <View key={String(filter.field)} style={{ marginVertical: 8 }}>
          {renderFilterInput(filter)}
        </View>
      ))}
      {activeFilters.length > 0 && (
        <button
          onClick={onClearFilters}
          className="mt-6 px-4 py-2 bg-gray-100 text-gray-600 rounded-md hover:bg-gray-200 transition-colors"
        >
          Effacer les filtres
        </button>
      )}
    </View>
  );
}