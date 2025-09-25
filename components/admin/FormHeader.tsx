import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { ArrowLeftToLine } from 'lucide-react-native';

interface FormHeaderProps {
  title: string;
  onBack: () => void;
  rightElement?: React.ReactNode;
}

export function FormHeader({ title, onBack, rightElement }: FormHeaderProps) {
  return (
    <View style={styles.header}>
      <Pressable
        onPress={onBack}
        style={styles.backButton}
      >
        <ArrowLeftToLine size={20} color="#2A2E33" />
      </Pressable>

      <Text style={styles.title}>
        {title}
      </Text>

      {rightElement}
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    backgroundColor: '#FBFBFB',
    height: 50,
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#EFEFEF',
  },
  backButton: {
    paddingHorizontal: 20,
    borderRightWidth: 1,
    borderRightColor: '#EFEFEF',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center'
  },
  title: {
    flex: 1,
    paddingLeft: 20,
    fontSize: 16,
    fontWeight: '600',
    color: '#2A2E33',
  },
});