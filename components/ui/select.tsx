// import * as SelectPrimitive from '@rn-primitives/select';
// import * as React from 'react';
// import { Platform, StyleSheet, View } from 'react-native';
// import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';
// import { useSafeAreaInsets } from 'react-native-safe-area-context';
// import { Check } from '~/lib/icons/Check';
// import { ChevronDown } from '~/lib/icons/ChevronDown';
// import { ChevronUp } from '~/lib/icons/ChevronUp';
// import { cn } from '~/lib/utils';

// type Option = SelectPrimitive.Option;

// const Select = SelectPrimitive.Root;

// const SelectGroup = SelectPrimitive.Group;

// const SelectValue = SelectPrimitive.Value;

// const SelectTrigger = React.forwardRef<SelectPrimitive.TriggerRef, SelectPrimitive.TriggerProps>(
//   ({ className, children, ...props }, ref) => (
//     <SelectPrimitive.Trigger
//       ref={ref}
//       className={cn(
//         'flex flex-row h-10 native:h-12 items-center text-sm justify-between rounded-md border border-input bg-background px-3 py-2 web:ring-offset-background text-muted-foreground web:focus:outline-none web:focus:ring-2 web:focus:ring-ring web:focus:ring-offset-2 [&>span]:line-clamp-1',
//         props.disabled && 'web:cursor-not-allowed opacity-50',
//         className
//       )}
//       {...props}
//     >
//       <>{children}</>
//       <ChevronDown size={16} aria-hidden={true} className='text-foreground opacity-50' />
//     </SelectPrimitive.Trigger>
//   )
// );
// SelectTrigger.displayName = SelectPrimitive.Trigger.displayName;

// /**
//  * Platform: WEB ONLY
//  */
// const SelectScrollUpButton = ({ className, ...props }: SelectPrimitive.ScrollUpButtonProps) => {
//   if (Platform.OS !== 'web') {
//     return null;
//   }
//   return (
//     <SelectPrimitive.ScrollUpButton
//       className={cn('flex web:cursor-default items-center justify-center py-1', className)}
//       {...props}
//     >
//       <ChevronUp size={14} className='text-foreground' />
//     </SelectPrimitive.ScrollUpButton>
//   );
// };

// /**
//  * Platform: WEB ONLY
//  */
// const SelectScrollDownButton = ({ className, ...props }: SelectPrimitive.ScrollDownButtonProps) => {
//   if (Platform.OS !== 'web') {
//     return null;
//   }
//   return (
//     <SelectPrimitive.ScrollDownButton
//       className={cn('flex web:cursor-default items-center justify-center py-1', className)}
//       {...props}
//     >
//       <ChevronDown size={14} className='text-foreground' />
//     </SelectPrimitive.ScrollDownButton>
//   );
// };

// const SelectContent = React.forwardRef<
//   SelectPrimitive.ContentRef,
//   SelectPrimitive.ContentProps & { portalHost?: string }
// >(({ className, children, position = 'popper', portalHost, ...props }, ref) => {
//   const { open } = SelectPrimitive.useRootContext();

//   return (
//     <SelectPrimitive.Portal hostName={portalHost}>
//       <SelectPrimitive.Overlay style={Platform.OS !== 'web' ? StyleSheet.absoluteFill : undefined}>
//         <Animated.View entering={FadeIn} exiting={FadeOut}>
//           <SelectPrimitive.Content
//             ref={ref}
//             className={cn(
//               'relative z-50 max-h-96 min-w-[8rem] rounded-md border border-border bg-popover shadow-md shadow-foreground/10 py-2 px-1 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2',
//               position === 'popper' &&
//                 'data-[side=bottom]:translate-y-1 data-[side=left]:-translate-x-1 data-[side=right]:translate-x-1 data-[side=top]:-translate-y-1',
//               open
//                 ? 'web:zoom-in-95 web:animate-in web:fade-in-0'
//                 : 'web:zoom-out-95 web:animate-out web:fade-out-0',
//               className
//             )}
//             position={position}
//             {...props}
//           >
//             <SelectScrollUpButton />
//             <SelectPrimitive.Viewport
//               className={cn(
//                 'p-1',
//                 position === 'popper' &&
//                   'h-[var(--radix-select-trigger-height)] w-full min-w-[var(--radix-select-trigger-width)]'
//               )}
//             >
//               {children}
//             </SelectPrimitive.Viewport>
//             <SelectScrollDownButton />
//           </SelectPrimitive.Content>
//         </Animated.View>
//       </SelectPrimitive.Overlay>
//     </SelectPrimitive.Portal>
//   );
// });
// SelectContent.displayName = SelectPrimitive.Content.displayName;

// const SelectLabel = React.forwardRef<SelectPrimitive.LabelRef, SelectPrimitive.LabelProps>(
//   ({ className, ...props }, ref) => (
//     <SelectPrimitive.Label
//       ref={ref}
//       className={cn(
//         'py-1.5 native:pb-2 pl-8 native:pl-10 pr-2 text-popover-foreground text-sm native:text-base font-semibold',
//         className
//       )}
//       {...props}
//     />
//   )
// );
// SelectLabel.displayName = SelectPrimitive.Label.displayName;

// const SelectItem = React.forwardRef<SelectPrimitive.ItemRef, SelectPrimitive.ItemProps>(
//   ({ className, children, ...props }, ref) => (
//     <SelectPrimitive.Item
//       ref={ref}
//       className={cn(
//         'relative web:group flex flex-row w-full web:cursor-default web:select-none items-center rounded-sm py-1.5 native:py-2 pl-8 native:pl-10 pr-2 web:hover:bg-accent/50 active:bg-accent web:outline-none web:focus:bg-accent',
//         props.disabled && 'web:pointer-events-none opacity-50',
//         className
//       )}
//       {...props}
//     >
//       <View className='absolute left-2 native:left-3.5 flex h-3.5 native:pt-px w-3.5 items-center justify-center'>
//         <SelectPrimitive.ItemIndicator>
//           <Check size={16} strokeWidth={3} className='text-popover-foreground' />
//         </SelectPrimitive.ItemIndicator>
//       </View>
//       <SelectPrimitive.ItemText className='text-sm native:text-lg text-popover-foreground native:text-base web:group-focus:text-accent-foreground' />
//     </SelectPrimitive.Item>
//   )
// );
// SelectItem.displayName = SelectPrimitive.Item.displayName;

// const SelectSeparator = React.forwardRef<
//   SelectPrimitive.SeparatorRef,
//   SelectPrimitive.SeparatorProps
// >(({ className, ...props }, ref) => (
//   <SelectPrimitive.Separator
//     ref={ref}
//     className={cn('-mx-1 my-1 h-px bg-muted', className)}
//     {...props}
//   />
// ));
// SelectSeparator.displayName = SelectPrimitive.Separator.displayName;

// interface SelectValue {
//   value: string;
//   label: string;
// }
// interface ForkSelectProps {
//   defaultValue: SelectValue;
//   choices: SelectValue[];
//   selectLabel?: string
// }
// const ForkSelect = ({defaultValue, choices, selectLabel }: ForkSelectProps) => {
//   const insets = useSafeAreaInsets();
//   const contentInsets = {
//     top: insets.top,
//     bottom: insets.bottom,
//   };

//   return (
//     <Select defaultValue={defaultValue}>
//       <SelectTrigger className='w-[250px]'>
//         <SelectValue
//           className='text-foreground text-sm native:text-lg'
//           placeholder='Select a fruit'
//         />
//       </SelectTrigger>
//       <SelectContent insets={contentInsets} className='w-[250px]'>
//         <SelectGroup>
//           {selectLabel && (
//             <SelectLabel>{ selectLabel }</SelectLabel>
//           )}
//           {choices.map((choice, index) => (
//             <SelectItem
//               key={`select-${choice.value}-${index}`}
//               label={choice.label}
//               value={choice.value}
//             >
//               { choice.label }
//             </SelectItem>
//            ))}
//         </SelectGroup>
//       </SelectContent>
//     </Select>
//   );
// }

// export {
//   Select,
//   SelectContent,
//   SelectGroup,
//   SelectItem,
//   SelectLabel,
//   SelectScrollDownButton,
//   SelectScrollUpButton,
//   SelectSeparator,
//   SelectTrigger,
//   SelectValue,
//   ForkSelect,
//   type Option,
// };

import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  Dimensions,
  Animated,
  TouchableWithoutFeedback,
} from 'react-native';

const Chevron = ({ isOpen }: { isOpen: boolean }) => {
  const rotateAnimation = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(rotateAnimation, {
      toValue: isOpen ? 1 : 0,
      duration: 200,
      useNativeDriver: true,
    }).start();
  }, [isOpen]);

  const rotate = rotateAnimation.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '180deg'],
  });

  return (
    <Animated.View style={[styles.chevron, { transform: [{ rotate }] }]}>
      <View style={styles.chevronLine1} />
      <View style={styles.chevronLine2} />
    </Animated.View>
  );
};
interface Choice {
  label: string;
  value: string;
}

interface SelectProps {
  choices: Choice[];
  selectedValue?: Choice;
  defaultValue?: Choice;
  placeholder?: string;
  onValueChange: (choice: Choice) => void;
  maxHeight?: number;
  style?: object
}

const ForkSelect: React.FC<SelectProps> = ({
  choices,
  selectedValue,
  defaultValue,
  placeholder = 'Sélectionner une option',
  onValueChange,
  maxHeight = 200,
  style,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [currentValue, setCurrentValue] = useState(selectedValue || defaultValue);
  const dropdownAnimation = useRef(new Animated.Value(0)).current;
  const selectRef = useRef<View>(null);


  useEffect(() => {
    if (selectedValue) {
      setCurrentValue(selectedValue);
    } else if (defaultValue) {
      setCurrentValue(defaultValue);
    }
  }, [selectedValue, defaultValue]);

  useEffect(() => {
    Animated.timing(dropdownAnimation, {
      toValue: isOpen ? 1 : 0,
      duration: 200,
      useNativeDriver: false,
    }).start();
  }, [isOpen]);

  const handlePress = () => {
    setIsOpen(!isOpen);
  };

  const handleSelect = (choice: Choice) => {
    onValueChange(choice);
    setIsOpen(false);
  };

  const dropdownHeight = dropdownAnimation.interpolate({
    inputRange: [0, 1],
    outputRange: [0, maxHeight],
  });

  return (
    <>
    {isOpen && (
      <TouchableWithoutFeedback onPress={() => setIsOpen(false)}>
        <View style={StyleSheet.absoluteFill} />
      </TouchableWithoutFeedback>
    )}
    
    <View ref={selectRef} style={{...styles.container, ...style}} collapsable={false}>
      <TouchableOpacity
        style={[styles.selectButton, isOpen && styles.selectButtonOpen]}
        onPress={handlePress}
        activeOpacity={0.7}
      >
        <Text style={styles.selectButtonText}>
          {currentValue ? currentValue.label : placeholder}
        </Text>
        <Chevron isOpen={isOpen} />
      </TouchableOpacity>

      {isOpen && (
        <Animated.View 
          style={[
            styles.dropdown,
            {
              maxHeight: dropdownHeight,
              opacity: dropdownAnimation,
            }
          ]}
        >
          <FlatList
            data={choices}
            keyExtractor={item => item.value}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={[
                  styles.option,
                  currentValue?.value === item.value && styles.selectedOption,
                ]}
                onPress={() => handleSelect(item)}
              >
                <Text
                  style={[
                    styles.optionText,
                    currentValue?.value === item.value && styles.selectedOptionText,
                  ]}
                >
                  {item.label}
                </Text>
              </TouchableOpacity>
            )}
            scrollEnabled={true}
            bounces={false}
            style={styles.list}
            nestedScrollEnabled={true}
          />
        </Animated.View>
      )}
    </View>
  </>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'relative',
    zIndex: 1000,
  },
  selectButton: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 5,
    padding: 9,
    backgroundColor: 'white',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  chevron: {
    width: 12,
    height: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  chevronLine1: {
    position: 'absolute',
    width: 8,
    height: 2,
    backgroundColor: '#666',
    transform: [{ rotate: '45deg' }],
    left: 0,
  },
  chevronLine2: {
    position: 'absolute',
    width: 8,
    height: 2,
    backgroundColor: '#666',
    transform: [{ rotate: '-45deg' }],
    right: 0,
  },
  selectButtonOpen: {
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
    borderBottomColor: 'transparent',
  },
  selectButtonText: {
    textAlign: 'center',
    textAlignVertical: 'center',
    minHeight: 30,
    fontSize: 14,
    color: '#333',
  },
  dropdown: {
    position: 'absolute',
    top: '100%',
    left: 0,
    right: 0,
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: '#ccc',
    borderTopWidth: 0,
    borderBottomLeftRadius: 8,
    borderBottomRightRadius: 8,
    overflow: 'hidden',
    zIndex: 1000,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  list: {
    flexGrow: 0,
  },
  option: {
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  selectedOption: {
    backgroundColor: '#f0f0f0',
  },
  optionText: {
    fontSize: 14,
    color: '#333',
  },
  selectedOptionText: {
    fontWeight: '600',
  },
});

export { ForkSelect };