import React, { useState, useEffect } from 'react';
import { View, StyleSheet, Text, Platform } from 'react-native';
import { Button, TextInput, NumberInput } from '~/components/ui';
import { Table } from '~/types/table.types';
import { validateForm, ValidationRules } from '~/components/lib/formValidation';
import { useToast } from '~/components/ToastProvider';

interface TableFormProps {
  table: Table | null;
  onSave: (updates: Partial<Table>) => void;
  onCancel: () => void;
}

const TableForm: React.FC<TableFormProps> = ({ 
  table, 
  onSave, 
  onCancel 
}) => {
  const [formData, setFormData] = useState({
    name: '',
    seats: ''
  });
  
  const { showToast } = useToast();

  const validationRules: ValidationRules = {
    name: {
      required: true,
      message: 'Le nom est requis'
    },
    seats: {
      required: true,
      custom: (value) => parseInt(value) > 0,
      message: 'Le nombre de couverts doit être supérieur à 0'
    }
  };

  useEffect(() => {
    if (table) {
      setFormData({
        name: table.name || '',
        seats: table.seats?.toString() || ''
      });
    }
  }, [table]);

  const handleSubmit = () => {
    const errors = validateForm(formData, validationRules);
    
    if (errors.length > 0) {
      showToast(errors[0].message, 'error');
      return;
    }

    onSave({
      name: formData.name,
      seats: parseInt(formData.seats)
    });
  };

  return (
    <View style={styles.container}>
      <View style={styles.form}>
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Nom de la table *</Text>
          <TextInput
            value={formData.name}
            onChangeText={(text) => setFormData(prev => ({ ...prev, name: text }))}
            placeholder="Entrez le nom de la table"
            placeholderTextColor="#A0A0A0"
            style={[styles.input, { height: 48 }]}
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Nombre de couverts *</Text>
          <NumberInput
            value={parseInt(formData.seats)}
            onChangeText={(value) => setFormData(prev => ({ ...prev, seats: value?.toString() || '' }))}
            placeholder="Nombre de couverts"
            decimalPlaces={0}
            min={1}
            style={[styles.input, { height: 48, width: '100%' }]}
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
            Enregistrer les modifications
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
};

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

export default TableForm;