import React from 'react';
import { ActivityIndicator, View } from 'react-native';

export const Loader = () => {
  return (
    <View className="absolute inset-0 bg-white/80 flex items-center justify-center">
      <ActivityIndicator size="large" color="#2A2E33" />
    </View>
  );
};
