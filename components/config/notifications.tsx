import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TextInput, Switch, TouchableOpacity, Pressable, Platform, Keyboard } from 'react-native';
import { KeyboardAwareScrollViewWrapper } from '~/components/Keyboard';
import { Clock, Bell } from 'lucide-react-native';
import { useAccountConfig } from '~/hooks/useAccountConfig';
import { useToast } from '~/components/ToastProvider';
import { showApiError } from '~/lib/apiErrorHandler';
import { getColorWithOpacity } from '~/lib/color-utils';
import { colors } from '~/theme';

type TabType = 'alerts';

export default function NotificationsPage({ isCompactSidebar }: { isCompactSidebar?: boolean | null }) {
  const [activeTab, setActiveTab] = useState<TabType>('alerts');

  const {
    isAlertEnabled,
    alertValue,
    error,
    updateConfig,
  } = useAccountConfig();

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        {/* Sidebar Navigation */}
        <View style={[styles.sidebar, isCompactSidebar !== false && styles.sidebarCompact]}>
          <TouchableOpacity
            style={[
              styles.sidebarTab,
              isCompactSidebar !== false && styles.sidebarTabCompact,
              activeTab === 'alerts' && styles.sidebarTabActive
            ]}
            onPress={() => setActiveTab('alerts')}
            activeOpacity={1}
          >
            <Bell size={20} color={activeTab === 'alerts' ? colors.brand.dark : colors.neutral[500]} strokeWidth={2} />
            {isCompactSidebar === false && (
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
            { backgroundColor: colors.brand.dark },
            (!hasChanges || (localEnabled && !isValidTime)) && styles.createButtonDisabled
          ]}
          onPress={handleSaveChanges}
          disabled={!hasChanges || (localEnabled && !isValidTime)}
        >
          <Text style={styles.createButtonText}>Enregistrer</Text>
        </TouchableOpacity>
      </View>

      <KeyboardAwareScrollViewWrapper
        style={styles.viewsScrollContainer}
        contentContainerStyle={styles.viewsContainer}
        showsVerticalScrollIndicator={false}
        bottomOffset={40}
        keyboardShouldPersistTaps="handled"
      >
        <Pressable style={styles.viewsCardsWrapper} onPress={() => { if (Platform.OS !== 'web') Keyboard.dismiss(); }}>
          {/* Alertes temporelles */}
          <View style={styles.viewCard}>
            <View style={styles.viewCardHeader}>
              <View style={[styles.viewIconWrapper, { backgroundColor: getColorWithOpacity(colors.brand.accent, 0.1) }]}>
                <Clock size={24} color={colors.brand.accent} strokeWidth={2} />
              </View>
              <View style={styles.viewCardContent}>
                <Text style={styles.viewCardTitle}>Alerte Cuisine/Bar</Text>
                <Text style={styles.viewCardDescription}>Surveillance automatique des commandes</Text>
              </View>
              <Switch
                value={localEnabled}
                onValueChange={handleToggleEnabled}
                trackColor={{ false: colors.gray[300], true: colors.success.base }}
                thumbColor={localEnabled ? colors.white : colors.gray[100]}
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
      </KeyboardAwareScrollViewWrapper>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.neutral[50],
  },
  content: {
    flex: 1,
    flexDirection: 'row',
  },

  // Sidebar
  sidebar: {
    width: 240,
    backgroundColor: colors.white,
    borderLeftWidth: 1,
    borderLeftColor: colors.neutral[200],
    borderRightWidth: 1,
    borderRightColor: colors.neutral[200],
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
    backgroundColor: colors.neutral[100],
  },
  sidebarTabText: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.neutral[500],
  },
  sidebarTabTextActive: {
    color: colors.neutral[800],
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
    color: colors.neutral[800],
    marginBottom: 4,
  },
  tabSubtitle: {
    fontSize: 14,
    color: colors.neutral[500],
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
    backgroundColor: '#949799',
  },
  createButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.white,
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
    backgroundColor: colors.white,
    borderRadius: 12,
    padding: 20,
    borderWidth: 1,
    borderColor: colors.neutral[200],
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
    color: colors.neutral[800],
    marginBottom: 4,
  },
  viewCardDescription: {
    fontSize: 14,
    color: colors.neutral[500],
  },

  // Submenu section (quand activé) - même pattern que viewModeSection
  viewModeSection: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: colors.neutral[200],
    gap: 16,
  },
  viewModeTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.neutral[800],
  },

  // Help text
  helpText: {
    fontSize: 13,
    color: colors.neutral[500],
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
    borderColor: colors.neutral[200],
    borderRadius: 8,
    backgroundColor: colors.white,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  textInput: {
    flex: 1,
    fontSize: 14,
    color: colors.gray[800],
    padding: 0,
  },
  inputSuffix: {
    fontSize: 13,
    color: colors.neutral[500],
    fontWeight: '500',
    marginLeft: 8,
  },
  previewText: {
    fontSize: 12,
    color: colors.brand.accent,
    fontWeight: '500',
  },
  errorText: {
    fontSize: 12,
    color: colors.error.text,
    fontWeight: '500',
  },
  errorBox: {
    backgroundColor: colors.error.bg,
    padding: 12,
    borderRadius: 8,
    marginTop: 16,
    borderWidth: 1,
    borderColor: colors.error.border,
  },
});
