import React from 'react';
import { View, Text } from 'react-native';
import { Status } from '~/types/status.enum';
import { getStatusColor, getStatusText } from '~/lib/utils';

type StatusPillProps = {
  status: Status;
  size?: 'sm' | 'md';
  showText?: boolean;
};

export function StatusPill({ status, size = 'sm', showText = true }: StatusPillProps) {
  const backgroundColor = getStatusColor(status);
  const text = getStatusText(status);
  
  const sizeStyles = {
    sm: {
      paddingHorizontal: 8,
      paddingVertical: 2,
      borderRadius: 10,
    },
    md: {
      paddingHorizontal: 10,
      paddingVertical: 4,
      borderRadius: 12,
    }
  };
  
  const textSizeStyles = {
    sm: {
      fontSize: 11,
      fontWeight: '500' as const,
    },
    md: {
      fontSize: 12,
      fontWeight: '500' as const,
    }
  };

  return (
    <View
      style={[
        sizeStyles[size],
        {
          backgroundColor,
          alignSelf: 'flex-start',
        }
      ]}
    >
      {showText && (
        <Text
          style={[
            textSizeStyles[size],
            {
              color: '#374151',
              textAlign: 'center',
            }
          ]}
        >
          {text}
        </Text>
      )}
    </View>
  );
}