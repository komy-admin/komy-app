import React, { useState, useEffect } from 'react';
import { View, StyleSheet, Text, Platform } from 'react-native';
import { Button, TextInput, NumberInput } from '~/components/ui';
import { Room } from '~/types/room.types';
import { validateForm, ValidationRules } from '~/components/lib/formValidation';
import { useToast } from '~/components/ToastProvider';

interface RoomFormProps {
  room: Room | null;
  onSave: (room: Room) => void;
  onCancel: () => void;
}

export const RoomForm: React.FC<RoomFormProps> = ({ 
  room, 
  onSave, 
  onCancel 
}) => {
  const [formData, setFormData] = useState({
    name: '',
    width: 15,
    height: 15
  });
  
  const { showToast } = useToast();

  const validationRules: ValidationRules = {
    name: {
      required: true,
      message: 'Le nom est requis'
    },
    width: {
      required: true,
      custom: (value) => value >= 5 && value <= 50,
      message: 'La largeur doit être comprise entre 5 et 50'
    },
    height: {
      required: true,
      custom: (value) => value >= 5 && value <= 50,
      message: 'La hauteur doit être comprise entre 5 et 50'
    }
  };

  useEffect(() => {
    if (room) {
      setFormData({
        name: room.name || '',
        width: room.width || 15,
        height: room.height || 15
      });
    } else {
      setFormData({
        name: '',
        width: 15,
        height: 15
      });
    }
  }, [room]);

  const handleSubmit = () => {
    const errors = validateForm(formData, validationRules);
    
    if (errors.length > 0) {
      showToast(errors[0].message, 'error');
      return;
    }

    const updatedRoom: Room = {
      ...(room?.id && { id: room.id }),
      name: formData.name,
      width: formData.width,
      height: formData.height,
      tables: room?.tables || [],
      account: '',
      createdAt: '',
      updatedAt: ''
    };

    onSave(updatedRoom);
  };

  return (
    <View style={styles.container}>
      <View style={styles.form}>
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Nom de la salle *</Text>
          <TextInput
            value={formData.name}
            onChangeText={(text) => setFormData(prev => ({ ...prev, name: text }))}
            placeholder="Entrez le nom de la salle"
            placeholderTextColor="#A0A0A0"
            style={[styles.input, { height: 48 }]}
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Largeur *</Text>
          <NumberInput
            value={formData.width}
            onChangeText={(value) => setFormData(prev => ({ ...prev, width: value || 15 }))}
            placeholder="Largeur"
            decimalPlaces={0}
            min={5}
            max={50}
            style={[styles.input, { height: 48 }]}
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Hauteur *</Text>
          <NumberInput
            value={formData.height}
            onChangeText={(value) => setFormData(prev => ({ ...prev, height: value || 15 }))}
            placeholder="Hauteur"
            decimalPlaces={0}
            min={5}
            max={50}
            style={[styles.input, { height: 48 }]}
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
            {room ? 'Enregistrer les modifications' : 'Créer la salle'}
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