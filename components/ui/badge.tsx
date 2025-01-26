import * as Slot from '@rn-primitives/slot';
import type { SlottableViewProps } from '@rn-primitives/types';
import { cva, type VariantProps } from 'class-variance-authority';
import { View } from 'react-native';
import { cn } from '~/lib/utils';
import { TextClassContext } from '~/components/ui/text';

const badgeVariants = cva(
  'web:inline-flex items-center rounded border border-border web:transition-colors web:focus:outline-none web:focus:ring-2 web:focus:ring-ring web:focus:ring-offset-2',
  {
    variants: {
      variant: {
        success: 'border-transparent bg-success web:hover:opacity-80 active:opacity-80',
        danger: 'border-transparent bg-error web:hover:opacity-80 active:opacity-80',
        default: 'border-transparent bg-primary web:hover:opacity-80 active:opacity-80',
        secondary: 'border-transparent bg-secondary web:hover:opacity-80 active:opacity-80',
        destructive: 'border-transparent bg-destructive web:hover:opacity-80 active:opacity-80',
        outline: 'text-foreground',
      },
      size: {
        sm: 'px-2 py-0.5',
        md: 'px-2.5 py-1',
        lg: 'px-3 py-0.5',
      },
      active: {
        true: 'opacity-90',
        false: '',
      }
    },
    compoundVariants: [
      {
        active: true,
        variant: 'success',
        className: 'bg-success/80',
      },
      {
        active: true,
        variant: 'danger',
        className: 'bg-error/80',
      },
      {
        active: true,
        variant: 'default',
        className: 'bg-primary/80',
      },
      {
        active: true,
        variant: 'secondary',
        className: 'bg-secondary/80',
      },
      {
        active: true,
        variant: 'destructive',
        className: 'bg-destructive/80',
      },
      {
        active: true,
        variant: 'outline',
        className: 'bg-primary/10 border-primary text-primary',
      },
    ],
    defaultVariants: {
      variant: 'default',
      size: 'md',
      active: false,
    },
  }
);

const badgeTextVariants = cva('', {
  variants: {
    variant: {
      success: 'text-success-foreground',
      danger: 'text-error-foreground',
      default: 'text-primary-foreground',
      secondary: 'text-secondary-foreground',
      destructive: 'text-destructive-foreground',
      outline: 'text-foreground',
    },
    size: {
      sm: 'text-xs',
      md: 'text-sm',
      lg: 'text-base',
    },
    active: {
      true: 'font-normal',
      false: 'font-normal'
    }
  },
  defaultVariants: {
    variant: 'default',
    size: 'md',
    active: false
  },
});

type BadgeProps = SlottableViewProps & 
  VariantProps<typeof badgeVariants> & {
    size?: 'sm' | 'md' | 'lg';
    active?: boolean;
  };

function Badge({ 
  className, 
  variant, 
  size, 
  active = false,
  asChild, 
  ...props 
}: BadgeProps) {
  const Component = asChild ? Slot.View : View;
  return (
    <TextClassContext.Provider value={badgeTextVariants({ variant, size, active })}>
      <Component 
        className={cn(badgeVariants({ variant, size, active }), className)} 
        {...props} 
      />
    </TextClassContext.Provider>
  );
}

export { Badge, badgeTextVariants, badgeVariants };
export type { BadgeProps };