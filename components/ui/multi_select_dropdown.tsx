import React, { useState, useRef } from 'react'
import {
  View,
  Text,
  FlatList,
  Pressable,
  StyleSheet,
  TouchableOpacity,
} from 'react-native'
import { ChevronDown } from 'lucide-react-native'
import { InputCustom } from '~/components/ui/input_custom'

interface MultiSelectDropdownProps {
  options: string[]
  selectedOptions: string[]
  onSelect: (selected: string[]) => void
}

export const MultiSelectDropdown = ({
  options,
  selectedOptions,
  onSelect,
}: MultiSelectDropdownProps) => {
  const [isDropdownVisible, setDropdownVisible] = useState(false)
  const inputRef = useRef(null)

  const toggleDropdown = () => setDropdownVisible(!isDropdownVisible)

  const handleSelect = (option: string) => {
    const updatedSelection = selectedOptions.includes(option)
      ? selectedOptions.filter((item) => item !== option)
      : [...selectedOptions, option]
    onSelect(updatedSelection)
  }

  const renderItem = ({ item }: { item: string }) => (
    <TouchableOpacity
      style={styles.option}
      onPress={() => handleSelect(item)}
    >
      <Text style={styles.optionText}>
        {selectedOptions.includes(item) ? '✓ ' : ''}
        {item}
      </Text>
    </TouchableOpacity>
  )

  return (
    <View style={styles.container}>
      <Pressable style={styles.inputContainer} onPress={toggleDropdown}>
        <InputCustom
          ref={inputRef}
          placeholder="Sélectionnez..."
          editable={false}
          icone={ChevronDown}
          iconePosition="right"
          style={{ paddingRight: 30 }}
          value={selectedOptions.join(', ')}
        />
      </Pressable>
      {isDropdownVisible && (
        <View style={styles.dropdown}>
          <FlatList
            data={options}
            renderItem={renderItem}
            keyExtractor={(item) => item}
            nestedScrollEnabled
          />
        </View>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    position: 'relative',
  },
  inputContainer: {
    zIndex: 2,
  },
  dropdown: {
    position: 'absolute',
    top: 50,
    width: '100%',
    backgroundColor: 'white',
    borderRadius: 5,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    maxHeight: 200,
    overflow: 'hidden',
  },
  option: {
    padding: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  optionText: {
    fontSize: 16,
    color: 'black',
  },
})