import { Platform, ViewStyle } from 'react-native';

/**
 * Style partagé pour la barre de tabs admin (onglets + bouton action)
 */
export const tabsBarStyle: ViewStyle = {
  backgroundColor: '#FBFBFB',
  height: 51,
  flexDirection: 'row',
  zIndex: 10,
  borderBottomWidth: 1,
  borderBottomColor: '#E5E7EB',
  ...Platform.select({
    ios: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.08,
      shadowRadius: 8,
    },
    android: {
      elevation: 5,
    },
    web: {
      boxShadow: '0 2px 8px rgba(0, 0, 0, 0.08)',
    },
  }),
} as ViewStyle;