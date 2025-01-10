import React, { useEffect, useState } from "react";
import { FilterConfig, FilterValue } from '~/types/filter.types';
import { Input } from "~/components/ui";
import { View } from 'react-native';
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from '~/components/ui/select';
interface FilterBarProps<T> {
  config: FilterConfig<T>[];
  onUpdateFilter: (field: string, value: any, operator?: string) => void;
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
          <Input
            style={{ marginVertical: 8, borderColor: '#D7D7D7', borderRadius: 5, backgroundColor: '#FFFFFF', paddingVertical: 20, color: '#2A2E33' }}
            placeholder={`${filter.label.toLowerCase()}`}
            value={activeFilters.find(f => f.field === filter.field)?.value as string}
            onChangeText={(text: string) => onUpdateFilter(String(filter.field), text, operator)}
            aria-labelledby='inputLabel'
            aria-errormessage='inputError'
          />
        );

      // case 'number':
      //   if (operator === 'between') {
      //     const [min, max] = (value as [number, number]) || [null, null];
      //     return (
      //       <View className="flex gap-2">
      //         <input
      //           style={{
      //             marginBottom: '8px',
      //             padding: '8px',
      //             border: '1px solid #D7D7D7',
      //             borderRadius: '5px',
      //             backgroundColor: '#FFFFFF',
      //             fontWeight: '300',
      //             color: '#2A2E33',
      //           }}
      //           className="w-1/2"
      //           placeholder={`${filter.label.toLowerCase()} min `}
      //           onChange={(e) => onUpdateFilter(String(filter.field), [Number(e.target.value), max], operator)}
      //           value={min || ''}
      //         />
      //         <input
      //           style={{
      //             marginBottom: '8px',
      //             padding: '8px',
      //             border: '1px solid #D7D7D7',
      //             borderRadius: '5px',
      //             backgroundColor: '#FFFFFF',
      //             fontWeight: '300',
      //             color: '#2A2E33',
      //           }}
      //           className="w-1/2"
      //           placeholder={`${filter.label.toLowerCase()} max`}
      //           onChange={(e) => onUpdateFilter(String(filter.field), [min, Number(e.target.value)], operator)}
      //           value={max || ''}
      //         />
      //       </View>
      //     );
      //   }
      //   return (
      //     <input
      //       type="number"
      //       className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
      //       onChange={(e) => onUpdateFilter(String(filter.field), Number(e.target.value), operator)}
      //       value={value as number || ''}
      //     />
      //   );

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
      //     return (
      //       <Select value={selectedOption} onValueChange={(e) => { 
      //           onUpdateFilter(String(filter.field), e, operator)
      //           if (options && e) {
      //             const selected = options.find(option => String(option.value) === String(e.value));
      //             if (selected) setSelectedOption(selected);
      //           }
      //         }}
      //       >
      //         <SelectTrigger className='w-100'>
      //           <SelectValue
      //             className='text-foreground text-sm native:text-lg'
      //             placeholder='Choisissez une catégorie'
      //           />
      //         </SelectTrigger>
      //         <SelectContent className='w-100'>
      //           <SelectGroup>
      //             <SelectLabel>---</SelectLabel>
      //             {options && options.map(item => (
      //               <SelectItem key={String(item.value)} label={item.label} value={String(item.value)}>
      //                 {item.label}
      //               </SelectItem>
      //             ))}
      //           </SelectGroup>
      //         </SelectContent>
      //       </Select>
      //     );
      //   }
      //   return (
      //     <select
      //       className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
      //       onChange={(e) => onUpdateFilter(String(filter.field), e.target.value, operator)}
      //       value={value as string || ''}
      //     >
      //       <option value="">Tous</option>
      //       {filter.options?.map((option) => (
      //         <option key={String(option.value)} value={String(option.value)}>
      //           {option.label}
      //         </option>
      //       ))}
      //     </select>
      //   );

      default:
        return null;
    }
  };

  return (
    <View className="">
      {config.map((filter) => (
        <View key={String(filter.field)} className="flex-1 min-w-[200px]">
          {/* <label className="block text-sm font-medium text-gray-700 mb-1">
            {filter.label}
          </label> */}
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