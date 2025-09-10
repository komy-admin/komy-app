import { useRef, useEffect } from 'react';
import { Keyboard } from 'react-native';

export const useKeyboardDismiss = (options?: { delayReset?: number; disableReset?: boolean }) => {
  const scrollViewRef = useRef<any>(null);
  const { delayReset = 200, disableReset = false } = options || {};

  const handleScrollBeginDrag = () => {
    // Délai pour éviter les conflits avec KeyboardAwareScrollView
    setTimeout(() => {
      Keyboard.dismiss();
    }, 100);
  };

  const resetScroll = () => {
    // Force le retour en haut après fermeture du keyboard
    if (scrollViewRef.current) {
      setTimeout(() => {
        scrollViewRef.current.scrollToPosition(0, 0, true);
      }, delayReset);
    }
  };

  // Écouter automatiquement la fermeture du keyboard
  useEffect(() => {
    if (!disableReset) {
      const keyboardDidHideListener = Keyboard.addListener('keyboardDidHide', resetScroll);
      return () => keyboardDidHideListener?.remove();
    }
  }, [delayReset, disableReset]);

  return { 
    handleScrollBeginDrag, 
    scrollViewRef 
  };
};