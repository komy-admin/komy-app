import React from 'react';
import { View, TextInput, TextInputProps, StyleSheet, TextStyle } from 'react-native';
import type { LucideIcon } from 'lucide-react-native'; // Import du type d'icône

interface InputProps extends TextInputProps {
  icone?: LucideIcon;
  iconePosition?: 'left' | 'right';
  iconeProps?: object;
  containerIconProps?: object
  textStyle?: TextStyle;
  placeholderStyle?: TextStyle;
}

const InputCustom = React.forwardRef<TextInput, InputProps>(
  ({
    icone: Icon,
    iconePosition = 'left',
    containerIconProps = {},
    iconeProps = {},
    textStyle,
    placeholderStyle,
    style,
    ...props
  },
  ref
) => {
    return (
      <View style={[styles.container, style]}>
        {Icon && iconePosition === 'left' && (
          <Icon style={[styles.icon]} size={20} color="gray" {...iconeProps} />
        )}
        <TextInput
          ref={ref}
          style={[styles.input, textStyle]}
          placeholderTextColor={placeholderStyle?.color || 'gray'}
          {...props}
        />
        {Icon && iconePosition === 'right' && (
          <View style={[styles.iconContainer, containerIconProps]}>
            <Icon style={[styles.icon]} size={20} color="gray" {...iconeProps} />
          </View>
        )}
      </View>
    );
  }
);

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'gray',
    borderRadius: 25,
    paddingHorizontal: 10,
    height: 45,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: 'black',
  },
  icon: {
    marginHorizontal: 5,
  },
  iconContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
});

InputCustom.displayName = 'Input';

export { InputCustom };
