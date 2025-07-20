import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Platform, TextInput, ScrollView, Switch, TouchableOpacity } from 'react-native';
import { Clock, AlertTriangle, Save } from 'lucide-react-native';
import { useAccountConfig } from '~/hooks/useAccountConfig';
import { useToast } from '~/components/ToastProvider';

export default function NotificationsPage() {
  const {
    isAlertEnabled,
    alertValue,
    isLoading,
    error,
    canUpdate,
    updateAlertTime,
    clearError
  } = useAccountConfig();
  
  const { showToast } = useToast();
  
  const [localTimeValue, setLocalTimeValue] = useState<string>(alertValue.toString());
  const [localEnabled, setLocalEnabled] = useState<boolean>(isAlertEnabled);
  const [hasChanges, setHasChanges] = useState<boolean>(false);

  // Synchroniser l'état local avec la config
  useEffect(() => {
    setLocalTimeValue(alertValue.toString());
    setLocalEnabled(isAlertEnabled);
    setHasChanges(false);
  }, [alertValue, isAlertEnabled]);

  const handleTimeChange = (value: string) => {
    const numericValue = value.replace(/[^0-9]/g, '');
    setLocalTimeValue(numericValue);
    
    // Marquer comme ayant des changements
    const newTimeValue = parseInt(numericValue) || 0;
    setHasChanges(newTimeValue !== alertValue || localEnabled !== isAlertEnabled);
  };

  const handleToggleEnabled = (enabled: boolean) => {
    if (!canUpdate) return; // Bloque si pas les permissions
    
    setLocalEnabled(enabled);
    const newTimeValue = parseInt(localTimeValue) || 0;
    setHasChanges(enabled !== isAlertEnabled || newTimeValue !== alertValue);
  };

  const handleSaveChanges = async () => {
    if (!hasChanges) return;
    
    try {
      await updateAlertTime(localEnabled, parseInt(localTimeValue) || 15);
      setHasChanges(false);
      showToast('Configuration sauvegardée avec succès', 'success');
    } catch (error) {
      console.error('Erreur lors de la sauvegarde:', error);
      showToast('Impossible de sauvegarder la configuration', 'error');
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.blurOverlay}>
        <ScrollView 
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Première rangée */}
          <View style={styles.row}>
            {/* Section Temps d'alerte - Fonctionnelle */}
            <View style={styles.activeCard}>
              {/* Header avec switch intégré */}
              <View style={styles.cardHeader}>
                <View style={styles.iconContainer}>
                  <Clock size={20} color="#6366F1" strokeWidth={1.5} />
                </View>
                <View style={styles.headerContent}>
                  <Text style={styles.cardTitle}>Alertes temporelles</Text>
                  <Text style={styles.cardSubtitle}>Surveillance automatique</Text>
                </View>
                
                {/* Switch pour activer/désactiver les alertes */}
                <View style={styles.switchContainer}>
                  <Switch
                    value={localEnabled}
                    onValueChange={handleToggleEnabled}
                    trackColor={{ false: '#E2E8F0', true: canUpdate ? '#6366F1' : '#94A3B8' }}
                    thumbColor={localEnabled ? '#FFFFFF' : '#94A3B8'}
                    disabled={isLoading || !canUpdate}
                  />
                  {!canUpdate && (
                    <Text style={styles.disabledSwitchText}>
                      (Lecture seule)
                    </Text>
                  )}
                </View>
              </View>
              
              {/* Contenu conditionnel selon l'état du switch */}
              {localEnabled ? (
                <>
                  {/* Description quand activé */}
                  <View style={styles.infoContainer}>
                    <View style={styles.infoIconContainer}>
                      <AlertTriangle size={12} color="#6366F1" strokeWidth={1.5} />
                    </View>
                    <Text style={styles.infoText}>
                      Déclenche une notification visuel lorsqu'une commande reste sans mise à jour 
                      pendant une durée déterminée.
                    </Text>
                  </View>
                  
                  {/* Configuration pour admin */}
                  {canUpdate && (
                    <View style={styles.inputSection}>
                      <Text style={styles.inputLabel}>Délai d'alerte</Text>
                      <View style={styles.inputWrapper}>
                        <TextInput
                          style={[styles.timeInput, isLoading && styles.timeInputDisabled]}
                          value={localTimeValue}
                          onChangeText={handleTimeChange}
                          placeholder="15"
                          keyboardType="numeric"
                          editable={!isLoading}
                        />
                        <Text style={styles.inputSuffix}>min</Text>
                      </View>
                      {localTimeValue && parseInt(localTimeValue) >= 5 && parseInt(localTimeValue) <= 120 && (
                        <Text style={styles.previewText}>
                          → Alerte déclenchée après {localTimeValue} minute{parseInt(localTimeValue) > 1 ? 's' : ''}
                        </Text>
                      )}
                      {localTimeValue && (parseInt(localTimeValue) < 5 || parseInt(localTimeValue) > 120) && (
                        <Text style={styles.errorText}>
                          ⚠️ La valeur doit être entre 5 et 120 minutes
                        </Text>
                      )}
                    </View>
                  )}
                  
                  {/* Affichage lecture seule pour les autres rôles */}
                  {!canUpdate && (
                    <View style={styles.readOnlySection}>
                      <Text style={styles.readOnlyTitle}>Configuration actuelle</Text>
                      <View style={styles.readOnlyRow}>
                        <Text style={styles.readOnlyLabel}>Délai d'alerte :</Text>
                        <Text style={styles.readOnlyValue}>{localTimeValue} minute{parseInt(localTimeValue) > 1 ? 's' : ''}</Text>
                      </View>
                    </View>
                  )}
                </>
              ) : (
                /* Affichage quand désactivé */
                <View style={styles.disabledContainer}>
                  <Text style={styles.disabledText}>
                    Les alertes temporelles sont désactivées
                  </Text>
                </View>
              )}
              
              {/* Affichage d'erreur */}
              {error && (
                <View style={styles.errorContainer}>
                  <Text style={styles.errorText}>{error}</Text>
                </View>
              )}
              
              {/* Indicateur de chargement */}
              {isLoading && (
                <View style={styles.loadingContainer}>
                  <Text style={styles.loadingText}>Sauvegarde en cours...</Text>
                </View>
              )}
            </View>

            {/* Espace pour future modale */}
            {/* <View style={styles.activeCard}>
              // Future config 2
            </View> */}
          </View>

          {/* Futures rangées pour d'autres configurations */}
          {/* <View style={styles.row}>
            <View style={styles.activeCard}>
              // Future config 3
            </View>
            <View style={styles.activeCard}>
              // Future config 4
            </View>
          </View> */}
          
        </ScrollView>
        
        {/* Bouton de sauvegarde global en sticky */}
        {canUpdate && hasChanges && (
          <View style={styles.stickyButtonContainer}>
            <TouchableOpacity
              style={styles.globalSaveButton}
              onPress={handleSaveChanges}
              disabled={isLoading}
            >
              <Save size={18} color="#FFFFFF" strokeWidth={2} />
              <Text style={styles.globalSaveButtonText}>
                Enregistrer les modifications
              </Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1E1E1E',
  },
  blurOverlay: {
    flex: 1,
    backgroundColor: 'rgba(248, 250, 252, 0.9)',
    ...Platform.select({
      web: {
        backdropFilter: 'blur(8px)',
        WebkitBackdropFilter: 'blur(8px)',
      },
    }),
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    padding: 20,
    paddingBottom: 100, // Espace pour le bouton sticky
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
    alignItems: 'stretch',
    gap: 20,
    marginBottom: 20,
    flexWrap: 'wrap',
  },
  activeCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    width: 300,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 8,
    borderWidth: 1,
    borderColor: 'rgba(226, 232, 240, 0.8)',
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  iconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(99, 102, 241, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  headerContent: {
    flex: 1,
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1E293B',
    marginBottom: 2,
  },
  cardSubtitle: {
    fontSize: 11,
    color: '#64748B',
    fontWeight: '500',
  },
  infoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#6366F1',
  },
  infoIconContainer: {
    width: 16,
    height: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  infoText: {
    fontSize: 12,
    color: '#475569',
    lineHeight: 16,
    flex: 1,
  },
  inputSection: {
    marginBottom: 4,
  },
  inputLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 8,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  timeInput: {
    flex: 1,
    fontSize: 14,
    color: '#1F2937',
    padding: 0,
  },
  inputSuffix: {
    fontSize: 12,
    color: '#64748B',
    fontWeight: '500',
    marginLeft: 8,
  },
  previewText: {
    fontSize: 10,
    color: '#6366F1',
    marginTop: 6,
    fontWeight: '500',
    fontStyle: 'italic',
  },
  switchSection: {
    marginBottom: 16,
  },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  switchLabel: {
    flex: 1,
    marginRight: 12,
  },
  switchTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 2,
  },
  switchSubtitle: {
    fontSize: 12,
    color: '#64748B',
  },
  timeInputDisabled: {
    opacity: 0.6,
  },
  errorText: {
    fontSize: 10,
    color: '#DC2626',
    marginTop: 6,
    fontWeight: '500',
  },
  errorContainer: {
    backgroundColor: '#FEE2E2',
    padding: 8,
    borderRadius: 6,
    marginTop: 8,
    borderWidth: 1,
    borderColor: '#FECACA',
  },
  loadingContainer: {
    backgroundColor: '#F3F4F6',
    padding: 8,
    borderRadius: 6,
    marginTop: 8,
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 12,
    color: '#6B7280',
    fontStyle: 'italic',
  },
  readOnlySection: {
    backgroundColor: '#F8FAFC',
    padding: 16,
    borderRadius: 8,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  readOnlyTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 12,
  },
  readOnlyRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  readOnlyLabel: {
    fontSize: 13,
    color: '#64748B',
    fontWeight: '500',
  },
  readOnlyValue: {
    fontSize: 13,
    color: '#374151',
    fontWeight: '600',
  },
  readOnlyEnabled: {
    color: '#059669',
  },
  readOnlyDisabled: {
    color: '#DC2626',
  },
  disabledContainer: {
    backgroundColor: '#F8FAFC',
    padding: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    alignItems: 'center',
  },
  disabledText: {
    fontSize: 13,
    color: '#64748B',
    fontStyle: 'italic',
    textAlign: 'center',
  },
  switchContainer: {
    alignItems: 'center',
  },
  disabledSwitchText: {
    fontSize: 10,
    color: '#94A3B8',
    fontStyle: 'italic',
    marginTop: 4,
  },
  saveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#6366F1',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginTop: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  saveButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 8,
  },
  stickyButtonContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 20,
    paddingVertical: 16,
    paddingBottom: Platform.OS === 'ios' ? 20 : 16, // Safe area pour iOS
    borderTopWidth: 1,
    borderTopColor: 'rgba(226, 232, 240, 0.8)',
  },
  globalSaveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#6366F1',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    shadowColor: '#6366F1',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 5,
  },
  globalSaveButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
    marginLeft: 10,
  },
});