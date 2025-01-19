
import * as React from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Button, ButtonProps } from '~/components/ui/button';
import * as PopoverPrimitive from '@rn-primitives/popover';
import { Platform, StyleSheet } from 'react-native';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';
import { cn } from '~/lib/utils';
import { TextClassContext } from '~/components/ui/text';

const Popover = PopoverPrimitive.Root;

const PopoverTrigger = PopoverPrimitive.Trigger;

const PopoverContent = React.forwardRef<
  PopoverPrimitive.ContentRef,
  PopoverPrimitive.ContentProps & { portalHost?: string }
>(({ className, align = 'center', sideOffset = 4, portalHost, ...props }, ref) => {
  return (
    <PopoverPrimitive.Portal hostName={portalHost}>
      <PopoverPrimitive.Overlay style={Platform.OS !== 'web' ? StyleSheet.absoluteFill : undefined}>
        <Animated.View entering={FadeIn.duration(200)} exiting={FadeOut}>
          <TextClassContext.Provider value='text-popover-foreground'>
            <PopoverPrimitive.Content
              ref={ref}
              align={align}
              sideOffset={sideOffset}
              className={cn(
                'z-50 w-72 rounded-md web:cursor-auto border border-border bg-popover p-4 shadow-md shadow-foreground/5 web:outline-none web:data-[side=bottom]:slide-in-from-top-2 web:data-[side=left]:slide-in-from-right-2 web:data-[side=right]:slide-in-from-left-2 web:data-[side=top]:slide-in-from-bottom-2 web:animate-in web:zoom-in-95 web:fade-in-0',
                className
              )}
              {...props}
            />
          </TextClassContext.Provider>
        </Animated.View>
      </PopoverPrimitive.Overlay>
    </PopoverPrimitive.Portal>
  );
});
PopoverContent.displayName = PopoverPrimitive.Content.displayName;

type PopoverSide = 'top' | 'bottom';

interface PopoverButtonProps extends Omit<ButtonProps, 'children'> {
  side?: PopoverSide;
  triggerContent: React.ReactNode;
  popoverContent: React.ReactNode;
  contentClassName?: string;
  customInsets?: {
    top?: number;
    bottom?: number;
    left?: number;
    right?: number;
  };
}

const PopoverButton = ({
  side = 'top',
  triggerContent,
  popoverContent,
  contentClassName = 'w-80',
  customInsets,
  ...buttonProps
}: PopoverButtonProps) => {
  const insets = useSafeAreaInsets();
  
  const contentInsets = {
    top: customInsets?.top ?? insets.top,
    bottom: customInsets?.bottom ?? insets.bottom,
    left: customInsets?.left ?? 12,
    right: customInsets?.right ?? 12,
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button {...buttonProps}>
          {triggerContent}
        </Button>
      </PopoverTrigger>
      <PopoverContent
        side={side}
        insets={contentInsets}
        className={contentClassName}
      >
        {popoverContent}
      </PopoverContent>
    </Popover>
  );
}

export { Popover, PopoverContent, PopoverTrigger, PopoverButton };

// import React, { useRef, useState } from 'react';
// import { Modal, Pressable, StyleSheet, View, Dimensions } from 'react-native';
// import { Button, ButtonProps } from '~/components/ui/button';

// interface PopoverButtonProps extends Omit<ButtonProps, 'children'> {
//   side?: 'top' | 'bottom';
//   triggerContent: React.ReactNode;
//   popoverContent: React.ReactNode;
// }

// const POPOVER_WIDTH = 320;
// const OFFSET = 8;

// export const PopoverButton = ({
//   side = 'bottom',
//   triggerContent,
//   popoverContent,
//   ...buttonProps
// }: PopoverButtonProps) => {
//   const [isVisible, setIsVisible] = useState(false);
//   const [layout, setLayout] = useState({
//     pageX: 0,
//     pageY: 0,
//     width: 0,
//     height: 0
//   });
//   const buttonRef = useRef<View>(null);

//   const measureButton = () => {
//     if (buttonRef.current) {
//       buttonRef.current.measureInWindow((x, y, width, height) => {
//         setLayout({
//           pageX: x,
//           pageY: y,
//           width,
//           height
//         });
//       });
//     }
//   };

//   return (
//     <>
//       <View ref={buttonRef} collapsable={false}>
//         <Button 
//           {...buttonProps}
//           onPress={() => {
//             measureButton();
//             setIsVisible(true);
//           }}
//         >
//           {triggerContent}
//         </Button>
//       </View>

//       <Modal
//         visible={isVisible}
//         transparent
//         animationType="fade"
//         onRequestClose={() => setIsVisible(false)}
//       >
//         <View style={styles.modalContainer}>
//           <Pressable 
//             style={styles.overlay}
//             onPress={() => setIsVisible(false)}
//           />
//           <View 
//             style={[
//               styles.popoverContainer,
//               {
//                 position: 'absolute',
//                 left: layout.pageX,
//                 [side === 'bottom' ? 'top' : 'bottom']: side === 'bottom' 
//                   ? layout.pageY + layout.height 
//                   : Dimensions.get('window').height - layout.pageY,
//                 width: layout.width,
//                 transform: [{ translateX: -(POPOVER_WIDTH - layout.width) / 2 }]
//               }
//             ]}
//           >
//             <View style={styles.popoverContent}>
//               {popoverContent}
//             </View>
//           </View>
//         </View>
//       </Modal>
//     </>
//   );
// };

// const styles = StyleSheet.create({
//   modalContainer: {
//     flex: 1,
//   },
//   overlay: {
//     ...StyleSheet.absoluteFillObject,
//     backgroundColor: 'rgba(0, 0, 0, 0)',
//   },
//   popoverContainer: {
//     alignItems: 'center',
//     zIndex: 1000,
//   },
//   popoverContent: {
//     backgroundColor: 'white',
//     width: POPOVER_WIDTH,
//     borderRadius: 8,
//     padding: 16,
//     shadowColor: '#000',
//     shadowOffset: {
//       width: 0,
//       height: 2,
//     },
//     shadowOpacity: 0.25,
//     shadowRadius: 4,
//     elevation: 5,
//     marginVertical: 8,
//   }
// });
