import React, { useState, useEffect } from 'react';
import { View, StyleSheet, Platform } from 'react-native';
import { Text, Button, TextInput, NumberInput } from '~/components/ui';
import { Select } from '~/components/ui/select';
import { Item } from '~/types/item.types';
import { ItemType } from '~/types/item-type.types';
import { validateForm, ValidationRules } from '~/components/lib/formValidation';
import { useToast } from '~/components/ToastProvider';

interface MenuFormProps {
  item: Item | null;
  itemTypes: ItemType[];
  onSave: (item: Item) => void;
  onCancel: () => void;
  activeTab: string;
}

export function MenuForm({ item, itemTypes, onSave, onCancel, activeTab }: MenuFormProps) {
  const defaultOption = {
    value: '',
    label: 'Choisissez une catégorie',
    id: ''
  };

  const [formData, setFormData] = useState({
    name: '',
    price: null as number | null,
    itemTypeId: ''
  });

  const [selectedOption, setSelectedOption] = useState(defaultOption);
  const { showToast } = useToast();

  const validationRules: ValidationRules = {
    itemTypeId: {
      required: true,
      message: 'La catégorie est requise'
    },
    name: {
      required: true,
      message: 'Le nom de l\'article est requis'
    },
    price: {
      required: true,
      custom: (value) => value !== '' && value > 0,
      message: 'Le prix doit être supérieur à 0'
    }
  };

  useEffect(() => {
    if (item) {
      setFormData({
        name: item.name,
        price: item.price,
        itemTypeId: item.itemType?.id || ''
      });
      
      if (item.itemType) {
        setSelectedOption({
          value: item.itemType.name,
          label: item.itemType.name,
          id: item.itemType.id
        });
      }
    } else {
      setFormData({
        name: '',
        price: null,
        itemTypeId: activeTab !== 'ALL' ? activeTab : ''
      });
      
      if (activeTab !== 'ALL') {
        const activeItemType = itemTypes.find(type => type.id === activeTab);
        if (activeItemType) {
          setSelectedOption({
            value: activeItemType.name,
            label: activeItemType.name,
            id: activeItemType.id
          });
        } else {
          setSelectedOption(defaultOption);
        }
      } else {
        setSelectedOption(defaultOption);
      }
    }
  }, [item, activeTab, itemTypes]);

  const handleSubmit = () => {
    const dataToValidate = {
      ...formData,
      itemTypeId: selectedOption.id
    };

    const errors = validateForm(dataToValidate, validationRules);
    
    if (errors.length > 0) {
      showToast(errors[0].message, 'error');
      return;
    }

    if (!selectedOption.id) {
      showToast('La catégorie est requise', 'error');
      return;
    }

    const selectedItemType = itemTypes.find(type => type.id === selectedOption.id);
    if (!selectedItemType) {
      showToast('Catégorie invalide', 'error');
      return;
    }

    const submittedItem: Item = {
      id: item?.id || '',
      name: formData.name,
      price: formData.price!,
      itemTypeId: selectedOption.id,
      itemType: selectedItemType
    };

    onSave(submittedItem);
  };

  return (
    <View style={styles.container}>
      <View style={styles.form}>
        <View style={[styles.inputGroup, { zIndex: 1000 }]}>
          <Text style={styles.label}>Catégorie *</Text>
          <Select
            choices={itemTypes.map(type => ({ 
              label: type.name, 
              value: type.name, 
              id: type.id 
            }))}
            selectedValue={selectedOption}
            onValueChange={(value) => {
              if (value) {
                const itemType = itemTypes.find(type => type.name === value.value);
                if (itemType) {
                  setSelectedOption({
                    value: itemType.name,
                    label: itemType.name,
                    id: itemType.id!
                  });
                  setFormData(prev => ({ ...prev, itemTypeId: itemType.id! }));
                }
              }
            }}
          />
        </View>
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Nom de l'article *</Text>
          <TextInput
            value={formData.name}
            onChangeText={(text: string) => setFormData(prev => ({ ...prev, name: text }))}
            placeholder="Nom de l'article"
            placeholderTextColor="#A0A0A0"
            style={[styles.input, { height: 48 }]}
          />
        </View>
        
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Prix *</Text>
          <NumberInput
            style={[styles.input, { height: 48 }]}
            value={formData.price?? 0}
            onChangeText={(value) => setFormData(prev => ({
              ...prev, 
              price: value
            }))}
            decimalPlaces={2}
            min={0}
            max={1000}
            currency="€"
            placeholder="Prix"
          />
        </View>
      </View>

      <View style={styles.buttons}>
        <Button
          onPress={handleSubmit}
          variant="default"
          size={null}
          style={styles.submitButton}
        >
          <Text style={styles.submitButtonText}>
            {item ? 'Enregistrer les modifications' : 'Confirmer la création'}
          </Text>
        </Button>
        
        <Button 
          onPress={onCancel}
          variant="ghost"
          size={null}
          style={styles.cancelButton}
        >
          <Text style={styles.cancelButtonText}>
            Annuler
          </Text>
        </Button>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 24,
    paddingBottom: 18,
    paddingLeft: 24,
    paddingRight: 24,
  },
  form: {
    flex: 1,
    gap: 24,
  },
  inputGroup: {
    gap: 8,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: '#2A2E33',
    marginBottom: 4,
  },
  input: {
    borderWidth: 1,
    borderColor: '#D7D7D7',
    borderRadius: 8,
    backgroundColor: '#FFFFFF',
    color: '#2A2E33',
    padding: 16,
    fontSize: 16,
    ...(Platform.OS === 'web' && {
      cursor: 'text'
    })
  },
  buttons: {
    gap: 12,
    marginTop: 34,
  },
  submitButton: {
    backgroundColor: '#2A2E33',
    borderRadius: 8,
    height: 48,
    ...(Platform.OS === 'web' && {
      cursor: 'pointer'
    })
  },
  submitButtonText: {
    color: '#FBFBFB',
    fontWeight: '600',
    fontSize: 16,
  },
  cancelButton: {
    backgroundColor: 'transparent',
    borderRadius: 8,
    height: 48,
    ...(Platform.OS === 'web' && {
      cursor: 'pointer'
    })
  },
  cancelButtonText: {
    color: '#2A2E33',
    fontWeight: '500',
    fontSize: 16,
    textDecorationLine: 'underline',
  },
});