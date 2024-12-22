import React, { useState } from 'react'
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native'
import { ChevronDown } from 'lucide-react-native'
import { InputCustom } from '~/components/ui/input_custom'

interface SingleSelectDropdownProps {
  options: string[]
  selectedOption: string | null
  onSelect: (selected: string) => void
}

export const SingleSelectDropdown = ({
  options,
  selectedOption,
  onSelect,
}: SingleSelectDropdownProps) => {
  const [isDropdownVisible, setDropdownVisible] = useState(false)

  const toggleDropdown = () => setDropdownVisible(!isDropdownVisible)

  const handleSelect = (option: string) => {
    if (option === selectedOption) {
      return // Ne rien faire si l'utilisateur sélectionne l'option déjà sélectionnée
    }
    onSelect(option) // Met à jour la sélection avec le nouvel élément
    setDropdownVisible(false) // Ferme le menu après la sélection
  }

  return (
    <View style={[styles.container, isDropdownVisible && styles.expanded]}>
      <TouchableOpacity style={styles.inputContainer} onPress={toggleDropdown}>
        <InputCustom
          placeholder="Sélectionner le type d'article"
          editable={false}
          icone={ChevronDown}
          iconePosition="right"
          iconeProps={{ strokeWidth: 2, color: '#696969' }}
          style={{ borderWidth: 0 }}
          textStyle={{ fontWeight: '300', color: '#2A2E33' }}
          placeholderStyle={{ color: '#949699' }}
          value={selectedOption || ''}
        />
      </TouchableOpacity>
      {isDropdownVisible && (
        <View style={styles.optionsContainer}>
          {options.map((option, index) => (
            <TouchableOpacity
              key={option}
              style={[styles.option, index === 0 && styles.firstOption, index === options.length - 1 && { borderBottomWidth: 0 }]}
              onPress={() => handleSelect(option)}
            >
              <Text style={styles.optionText}>
                {selectedOption === option ? '✓ ' : ''}
                {option}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    borderColor: '#D7D7D7',
    borderWidth: 1,
    borderRadius: 5,
    overflow: 'hidden',
    marginVertical: 5,
  },
  expanded: {
    height: 'auto',
  },
  inputContainer: {
    backgroundColor: '#FFF',
    zIndex: 2,
  },
  optionsContainer: {
    backgroundColor: '#FFF',
    zIndex: 1,
  },
  option: {
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  optionText: {
    fontSize: 16,
    color: '#2A2E33',
    fontWeight: '300',
  },
  firstOption: {
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
  },
})
