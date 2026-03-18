import { View, ScrollView, StyleSheet, Platform, ViewStyle } from 'react-native';

interface TabsHeaderProps {
  children: React.ReactNode;
  rightSlot?: React.ReactNode;
  height?: number;
  style?: ViewStyle;
}

export function TabsHeader({ children, rightSlot, height = 61, style }: TabsHeaderProps) {
  return (
    <View style={[styles.container, { height }, style]}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        bounces={false}
        style={{ flex: 1 }}
        contentContainerStyle={{ alignItems: 'flex-end' }}
      >
        {children}
      </ScrollView>
      {rightSlot}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    backgroundColor: '#FBFBFB',
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
  } as ViewStyle,
});
