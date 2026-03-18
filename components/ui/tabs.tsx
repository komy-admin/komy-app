import * as TabsPrimitive from '@rn-primitives/tabs';
import * as React from 'react';
import { cn } from '~/lib/utils';
import { TextClassContext } from '~/components/ui/text';

const Tabs = TabsPrimitive.Root;

const TabsList = React.forwardRef<TabsPrimitive.ListRef, TabsPrimitive.ListProps>(
  ({ className, ...props }, ref) => (
    <TabsPrimitive.List
      ref={ref}
      className={cn(
        'web:inline-flex items-center justify-center',
        className
      )}
      {...props}
    />
  )
);
TabsList.displayName = TabsPrimitive.List.displayName;

const TabsTrigger = React.forwardRef<TabsPrimitive.TriggerRef, TabsPrimitive.TriggerProps>(
  ({ className, ...props }, ref) => {
    const { value } = TabsPrimitive.useRootContext();
    const isActive = props.value === value

    return (
      <TextClassContext.Provider
        value={cn(
          'text-sm native:text-base font-medium web:transition-all',
          isActive ? 'text-black-500' : 'text-gray-500'
        )}
      >
        <TabsPrimitive.Trigger
          ref={ref}
          className={cn(
            'inline-flex items-stretch justify-center shadow-none',
            props.disabled && 'web:pointer-events-none opacity-50',
            isActive
              ? 'border-b-0 text-black-500'
              : 'border-b-0 text-gray-500',
            className
          )}
          style={{ minWidth: 100, height: '100%' }}
          {...props}
        />
      </TextClassContext.Provider>
    );
  }
);
TabsTrigger.displayName = TabsPrimitive.Trigger.displayName;

const TabsContent = React.forwardRef<TabsPrimitive.ContentRef, TabsPrimitive.ContentProps>(
  ({ className, ...props }, ref) => (
    <TabsPrimitive.Content
      ref={ref}
      className={cn(
        'web:ring-offset-background web:focus-visible:outline-none web:focus-visible:ring-2 web:focus-visible:ring-ring web:focus-visible:ring-offset-2',
        className
      )}
      {...props}
    />
  )
);
TabsContent.displayName = TabsPrimitive.Content.displayName;

export { Tabs, TabsContent, TabsList, TabsTrigger };
