import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, TextInput, ScrollView, Switch, TouchableOpacity, Pressable } from 'react-native';
import { Clock, Bell } from 'lucide-react-native';
import { useAccountConfig } from '~/hooks/useAccountConfig';
import { useToast } from '~/components/ToastProvider';
import { showApiError } from '~/lib/apiErrorHandler';

type TabType = 'alerts';

export default function NotificationsPage() {
  const [activeTab, setActiveTab] = useState<TabType>('alerts');
  const [isCompactSidebar, setIsCompactSidebar] = useState(false);

  const {
    isAlertEnabled,
    alertValue,
    error,
    updateConfig,
  } = useAccountConfig();

  const handleLayoutChange = useCallback((event: any) => {
    const { width } = event.nativeEvent.layout;
    setIsCompactSidebar(width < 700);
  }, []);

  return (
    <View style={styles.container} onLayout={handleLayoutChange}>
      <View style={styles.content}>
        {/* Sidebar Navigation */}
        <View style={[styles.sidebar, isCompactSidebar && styles.sidebarCompact]}>
          <TouchableOpacity
            style={[
              styles.sidebarTab,
              isCompactSidebar && styles.sidebarTabCompact,
              activeTab === 'alerts' && styles.sidebarTabActive
            ]}
            onPress={() => setActiveTab('alerts')}
            activeOpacity={1}
          >
            <Bell size={20} color={activeTab === 'alerts' ? '#6366F1' : '#64748B'} strokeWidth={2} />
            {!isCompactSidebar && (
              <Text style={[styles.sidebarTabText, activeTab === 'alerts' && styles.sidebarTabTextActive]}>
                Alerte visuelle
              </Text>
            )}
          </TouchableOpacity>
        </View>

        {/* Main Content */}
        <View style={styles.mainContent}>
          {activeTab === 'alerts' && (
            <AlertsTab
              isAlertEnabled={isAlertEnabled}
              alertValue={alertValue}
              error={error}
              updateConfig={updateConfig}
            />
          )}
        </View>
      </View>
    </View>
  );
}

// Alerts Tab
interface AlertsTabProps {
  isAlertEnabled: boolean;
  alertValue: number;
  error: string | null;
  updateConfig: (updates: {
    reminderNotificationsEnabled?: boolean;
    reminderMinutes?: number;
  }) => Promise<any>;
}

const AlertsTab: React.FC<AlertsTabProps> = ({
  isAlertEnabled,
  alertValue,
  error,
  updateConfig,
}) => {
  const { showToast } = useToast();

  const [localTimeValue, setLocalTimeValue] = useState<string>(alertValue.toString());
  const [localEnabled, setLocalEnabled] = useState<boolean>(isAlertEnabled);
  const [hasChanges, setHasChanges] = useState<boolean>(false);

  useEffect(() => {
    setLocalTimeValue(alertValue.toString());
    setLocalEnabled(isAlertEnabled);
    setHasChanges(false);
  }, [alertValue, isAlertEnabled]);

  const handleTimeChange = (value: string) => {
    const numericValue = value.replace(/[^0-9]/g, '');
    setLocalTimeValue(numericValue);
    const newTimeValue = parseInt(numericValue) || 0;
    setHasChanges(newTimeValue !== alertValue || localEnabled !== isAlertEnabled);
  };

  const handleToggleEnabled = (enabled: boolean) => {
    setLocalEnabled(enabled);
    const newTimeValue = parseInt(localTimeValue) || 0;
    setHasChanges(enabled !== isAlertEnabled || newTimeValue !== alertValue);
  };

  const handleSaveChanges = async () => {
    if (!hasChanges) return;

    try {
      await updateConfig({
        reminderNotificationsEnabled: localEnabled,
        reminderMinutes: parseInt(localTimeValue) || 15
      });
      setHasChanges(false);
      showToast('Configuration sauvegardée avec succès', 'success');
    } catch (error) {
      showApiError(error, showToast, 'Impossible de sauvegarder la configuration');
    }
  };

  const timeValue = parseInt(localTimeValue) || 0;
  const isValidTime = timeValue >= 2 && timeValue <= 60;

  return (
    <View style={styles.tabContent}>
      <View style={styles.tabHeader}>
        <View>
          <Text style={styles.tabTitle}>Alertes</Text>
          <Text style={styles.tabSubtitle}>Configurer les alertes et rappels</Text>
        </View>
        <TouchableOpacity
          style={[
            styles.createButton,
            { backgroundColor: '#6366F1' },
            (!hasChanges || (localEnabled && !isValidTime)) && styles.createButtonDisabled
          ]}
          onPress={handleSaveChanges}
          disabled={!hasChanges || (localEnabled && !isValidTime)}
        >
          <Text style={styles.createButtonText}>Enregistrer</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.viewsScrollContainer}
        contentContainerStyle={styles.viewsContainer}
        showsVerticalScrollIndicator={false}
      >
        <Pressable style={styles.viewsCardsWrapper}>
          {/* Alertes temporelles */}
          <View style={styles.viewCard}>
            <View style={styles.viewCardHeader}>
              <View style={[styles.viewIconWrapper, { backgroundColor: 'rgba(99, 102, 241, 0.1)' }]}>
                <Clock size={24} color="#6366F1" strokeWidth={2} />
              </View>
              <View style={styles.viewCardContent}>
                <Text style={styles.viewCardTitle}>Alerte Cuisine/Bar</Text>
                <Text style={styles.viewCardDescription}>Surveillance automatique des commandes</Text>
              </View>
              <Switch
                value={localEnabled}
                onValueChange={handleToggleEnabled}
                trackColor={{ false: '#D1D5DB', true: '#10B981' }}
                thumbColor={localEnabled ? '#FFFFFF' : '#F3F4F6'}
              />
            </View>

            {/* Submenu - affiché seulement si activé */}
            {localEnabled && (
              <View style={styles.viewModeSection}>
                <Text style={styles.helpText}>
                  Notification visuelle lorsqu'une commande reste sans mise à jour pendant la durée configurée.
                </Text>

                {/* Input */}
                <View style={styles.inputGroup}>
                  <Text style={styles.viewModeTitle}>Délai d'alerte</Text>
                  <View style={styles.inputWrapper}>
                    <TextInput
                      style={styles.textInput}
                      value={localTimeValue}
                      onChangeText={handleTimeChange}
                      placeholder="15"
                      keyboardType="numeric"
                    />
                    <Text style={styles.inputSuffix}>min</Text>
                  </View>
                  {localTimeValue && isValidTime && (
                    <Text style={styles.previewText}>
                      Alerte après {localTimeValue} minute{timeValue > 1 ? 's' : ''} d'inactivité
                    </Text>
                  )}
                  {localTimeValue && !isValidTime && timeValue > 0 && (
                    <Text style={styles.errorText}>
                      La valeur doit être entre 2 et 60 minutes
                    </Text>
                  )}
                </View>
              </View>
            )}

            {error && (
              <View style={styles.errorBox}>
                <Text style={styles.errorText}>{error}</Text>
              </View>
            )}
          </View>
        </Pressable>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  content: {
    flex: 1,
    flexDirection: 'row',
  },

  // Sidebar
  sidebar: {
    width: 240,
    backgroundColor: '#FFFFFF',
    borderLeftWidth: 1,
    borderLeftColor: '#E2E8F0',
    borderRightWidth: 1,
    borderRightColor: '#E2E8F0',
    padding: 16,
    gap: 8,
  },
  sidebarCompact: {
    width: 72,
    padding: 8,
  },
  sidebarTab: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
    gap: 12,
  },
  sidebarTabCompact: {
    justifyContent: 'center',
    padding: 14,
    gap: 0,
  },
  sidebarTabActive: {
    backgroundColor: '#F1F5F9',
  },
  sidebarTabText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#64748B',
  },
  sidebarTabTextActive: {
    color: '#1E293B',
    fontWeight: '600',
  },

  // Main content
  mainContent: {
    flex: 1,
  },
  tabContent: {
    flex: 1,
    padding: 24,
  },
  tabHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 24,
  },
  tabTitle: {
    fontSize: 24,
    fontWeight: '600',
    color: '#1E293B',
    marginBottom: 4,
  },
  tabSubtitle: {
    fontSize: 14,
    color: '#64748B',
  },
  createButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    gap: 8,
  },
  createButtonDisabled: {
    opacity: 0.5,
  },
  createButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },

  // ScrollView
  viewsScrollContainer: {
    flex: 1,
  },
  viewsContainer: {
    paddingBottom: 24,
  },
  viewsCardsWrapper: {
    gap: 16,
  },

  // Cards - même style que viewCard dans configuration.tsx
  viewCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 20,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  viewCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  viewIconWrapper: {
    width: 48,
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  viewCardContent: {
    flex: 1,
  },
  viewCardTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1E293B',
    marginBottom: 4,
  },
  viewCardDescription: {
    fontSize: 14,
    color: '#64748B',
  },

  // Submenu section (quand activé) - même pattern que viewModeSection
  viewModeSection: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
    gap: 16,
  },
  viewModeTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1E293B',
  },

  // Help text
  helpText: {
    fontSize: 13,
    color: '#64748B',
    lineHeight: 18,
  },

  // Input
  inputGroup: {
    gap: 8,
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
  textInput: {
    flex: 1,
    fontSize: 14,
    color: '#1F2937',
    padding: 0,
  },
  inputSuffix: {
    fontSize: 13,
    color: '#64748B',
    fontWeight: '500',
    marginLeft: 8,
  },
  previewText: {
    fontSize: 12,
    color: '#6366F1',
    fontWeight: '500',
  },
  errorText: {
    fontSize: 12,
    color: '#DC2626',
    fontWeight: '500',
  },
  errorBox: {
    backgroundColor: '#FEF2F2',
    padding: 12,
    borderRadius: 8,
    marginTop: 16,
    borderWidth: 1,
    borderColor: '#FECACA',
  },
});
