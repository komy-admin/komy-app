import React from 'react';
import { View, Text, Pressable, ScrollView, StyleSheet, Platform } from 'react-native';
import { ArrowLeftToLine } from 'lucide-react-native';
import { Button } from '~/components/ui';

// ✅ Composants extraits avec styles originaux préservés
const PrimaryActionButton = ({ children, disabled, style, ...props }: any) => (
  <Button
    disabled={disabled}
    style={[
      {
        flex: 2,
        backgroundColor: disabled ? '#6B7280' : '#2A2E33',
        borderRadius: 12,
        height: 52,
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#2A2E33',
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.2,
        shadowRadius: 6,
        elevation: 4,
        ...(Platform.OS === 'web' && {
          cursor: 'pointer',
          transition: 'all 0.2s ease',
          ':hover': {
            backgroundColor: disabled ? '#6B7280' : '#1A1E23',
            transform: 'translateY(-2px)',
            shadowOpacity: 0.3,
          }
        })
      },
      style
    ]}
    {...props}
  >
    <Text style={{
      color: '#FFFFFF',
      fontWeight: '700',
      fontSize: 16,
      letterSpacing: 0.5,
    }}>
      {children}
    </Text>
  </Button>
);

const SecondaryActionButton = ({ children, disabled, style, ...props }: any) => (
  <Button
    disabled={disabled}
    style={[
      {
        flex: 1,
        backgroundColor: '#FFFFFF',
        borderRadius: 12,
        height: 52,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 2,
        borderColor: '#E5E7EB',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
        elevation: 1,
        ...(Platform.OS === 'web' && {
          cursor: 'pointer',
          transition: 'all 0.2s ease',
          ':hover': {
            borderColor: '#D1D5DB',
            backgroundColor: '#F9FAFB',
            transform: 'translateY(-1px)',
          }
        })
      },
      style
    ]}
    {...props}
  >
    <Text style={{
      color: '#6B7280',
      fontWeight: '600',
      fontSize: 16,
      letterSpacing: 0.3,
    }}>
      {children}
    </Text>
  </Button>
);

const ConfigActionButton = ({ children, disabled, style, backgroundColor = '#059669', textStyle, ...props }: any) => (
  <Button
    disabled={disabled}
    style={[
      {
        borderRadius: 12,
        height: 52,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor,
        shadowColor: backgroundColor,
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.2,
        shadowRadius: 6,
        elevation: 4,
        ...(Platform.OS === 'web' && {
          cursor: 'pointer',
          transition: 'all 0.2s ease',
          ':hover': {
            transform: 'translateY(-2px)',
            shadowOpacity: 0.3,
          }
        })
      },
      style
    ]}
    {...props}
  >
    <Text style={[
      {
        color: '#FFFFFF',
        fontWeight: '700',
        fontSize: 14,
        letterSpacing: 0.5,
      },
      textStyle
    ]}>
      {children}
    </Text>
  </Button>
);

const ConfigCancelButton = ({ children, disabled, style, ...props }: any) => (
  <Button
    disabled={disabled}
    style={[
      {
        backgroundColor: '#FFFFFF',
        borderRadius: 12,
        height: 52,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 2,
        borderColor: '#E5E7EB',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
        elevation: 1,
        ...(Platform.OS === 'web' && {
          cursor: 'pointer',
          transition: 'all 0.2s ease',
          ':hover': {
            borderColor: '#D1D5DB',
            backgroundColor: '#F9FAFB',
            transform: 'translateY(-1px)',
          }
        })
      },
      style
    ]}
    {...props}
  >
    <Text style={{
      color: '#6B7280',
      fontWeight: '600',
      fontSize: 14,
      letterSpacing: 0.3,
    }}>
      {children}
    </Text>
  </Button>
);

// ✅ Constantes de style consolidées
const COMMON_STYLES = {
  shadow: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
  },
  borderRadius: {
    small: 8,
    medium: 12,
    large: 16,
  },
  spacing: {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
  },
  colors: {
    primary: '#2A2E33',
    primaryHover: '#1A1E23',
    secondary: '#6B7280',
    background: '#FFFFFF',
    backgroundSecondary: '#F9FAFB',
    border: '#F3F4F6',
    borderSecondary: '#E5E7EB',
  },
  typography: {
    title: {
      fontSize: 18,
      fontWeight: '800' as const,
      color: '#2A2E33',
      letterSpacing: 0.5,
    },
    buttonPrimary: {
      fontSize: 16,
      fontWeight: '700' as const,
      color: '#FFFFFF',
      letterSpacing: 0.5,
    },
    buttonSecondary: {
      fontSize: 16,
      fontWeight: '600' as const,
      color: '#6B7280',
      letterSpacing: 0.3,
    },
  },
};
import { DeleteConfirmationModal } from '~/components/ui/DeleteConfirmationModal';

export type AdminFormViewMode = 'create' | 'edit';

// Interface standardisée pour tous les formulaires admin
export interface AdminFormData<T = any> {
  data: T;
  isValid: boolean;
  errors: Record<string, string>;
  hasChanges?: boolean;
}

// Interface pour les formulaires qui peuvent être contrôlés par AdminFormView
export interface AdminFormRef<T = any> {
  getFormData: () => AdminFormData<T>;
  resetForm?: () => void;
  validateForm?: () => boolean;
}

// Interface pour le contexte de confirmation
export interface AdminConfirmationContext {
  showConfirmation: (config: Omit<AdminConfirmationModal, 'isVisible' | 'isLoading'>) => void;
  hideConfirmation: () => void;
}

// Interface pour la modal de confirmation intégrée - Compatible avec DeleteConfirmationModal
export interface AdminConfirmationModal {
  isVisible: boolean;
  entityName: string;
  entityType: string;
  isLoading?: boolean;
  onConfirm: () => void | Promise<void>;
  onCancel: () => void;
}

export interface AdminFormViewProps {
  visible: boolean;
  mode: AdminFormViewMode;
  title: string;
  onClose: () => void;
  onCancel?: () => void;
  onSave?: (getFormData: () => AdminFormData) => Promise<boolean>;
  isLoading?: boolean;
  children: React.ReactNode;
  backgroundColor?: string;
  scrollViewRef?: React.RefObject<ScrollView | null>;
  hideHeaderAndActions?: boolean; // Masque le header et les actions pour des interfaces personnalisées
  disableGlobalScroll?: boolean; // Désactive le ScrollView global pour permettre du contenu statique
  // Props pour la configuration de menu (quand hideHeaderAndActions=true)
  configurationActions?: {
    onCancel: () => void;
    onConfirm: () => void;
    cancelLabel?: string;
    confirmLabel?: string;
    confirmButtonColor?: string; // Couleur personnalisée pour le bouton de confirmation
  };
}

export function AdminFormView({
  visible,
  mode,
  title,
  onClose,
  onCancel,
  onSave,
  isLoading = false,
  children,
  backgroundColor = '#FFFFFF',
  scrollViewRef,
  hideHeaderAndActions = false,
  disableGlobalScroll = false,
  configurationActions
}: AdminFormViewProps) {
  // ✅ Return conditionnel AVANT tous les hooks
  if (!visible) {
    return null;
  }

  const [isSaving, setIsSaving] = React.useState(false);
  const [confirmationModal, setConfirmationModal] = React.useState<AdminConfirmationModal | null>(null);
  const formRef = React.useRef<AdminFormRef>(null);

  const handleSave = async () => {
    if (!onSave || !formRef.current) return;

    const getFormData = () => formRef.current!.getFormData();
    const formData = getFormData();

    if (!formData.isValid) {
      // Appeler la méthode de validation du formulaire pour afficher les erreurs
      if (formRef.current.validateForm) {
        formRef.current.validateForm();
      }
      return;
    }

    setIsSaving(true);
    try {
      const success = await onSave(getFormData);
      if (success) {
        onClose();
      }
    } catch (error) {
      console.error('Erreur lors de la sauvegarde:', error);
    } finally {
      setIsSaving(false);
    }
  };

  // Créer le contexte pour les confirmations
  const confirmationContext = React.useMemo(() => ({
    showConfirmation: (config: Omit<AdminConfirmationModal, 'isVisible'>) => {
      setConfirmationModal({ ...config, isVisible: true });
    },
    hideConfirmation: () => {
      setConfirmationModal(null);
    }
  }), []);

  // Clone l'enfant pour lui passer la ref et le contexte de confirmation
  const childWithRef = React.isValidElement(children) 
    ? React.cloneElement(children, { 
        ref: formRef,
        confirmationContext 
      } as any)
    : children;

  return (
    <View style={[styles.container, { backgroundColor }]}>
      {/* Header moderne et professionnel - Toujours dans le DOM, masqué par display */}
      <View style={[
        styles.header,
        {
          display: hideHeaderAndActions ? 'none' : 'flex'
        }
      ]}>
        {/* Section Bouton retour */}
        <Pressable
          onPress={onCancel || onClose}
          style={styles.backButton}
        >
          <ArrowLeftToLine size={20} color={COMMON_STYLES.colors.primary} />
        </Pressable>

        {/* Section Titre */}
        <View style={styles.titleContainer}>
          <Text style={[styles.titleText, COMMON_STYLES.typography.title]}>
            {title}
          </Text>
        </View>
      </View>

      {/* Contenu du formulaire - ScrollView conditionnel */}
      {disableGlobalScroll ? (
        <View style={[
          styles.scrollView, 
          { paddingBottom: 115 }
        ]}>
          {childWithRef}
        </View>
      ) : (
        <ScrollView 
          ref={scrollViewRef}
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          bounces={false}
          overScrollMode="never"
          scrollEventThrottle={16}
        >
          {childWithRef}
        </ScrollView>
      )}
      
      {/* Boutons de configuration - Rendus séparément pour éviter les conflits de state */}
      {hideHeaderAndActions && configurationActions && (
        <View style={styles.stickyActions}>
          <View style={styles.actionsContainer}>
            <ConfigCancelButton
              onPress={configurationActions.onCancel}
              style={{ flex: 1 }}
            >
              {configurationActions.cancelLabel || 'Annuler'}
            </ConfigCancelButton>

            <ConfigActionButton
              onPress={configurationActions.onConfirm}
              backgroundColor={configurationActions.confirmButtonColor || '#059669'}
              style={{ flex: 2 }}
            >
              {configurationActions.confirmLabel || 'Confirmer'}
            </ConfigActionButton>
          </View>
        </View>
      )}

      {/* Boutons AdminFormView normaux - Rendus séparément */}
      {onSave && !hideHeaderAndActions && (
        <View style={styles.stickyActions}>
          <View style={styles.actionsContainer}>
            <PrimaryActionButton
              onPress={handleSave}
              disabled={isLoading || isSaving}
            >
              {isLoading || isSaving ? 'Sauvegarde...' : mode === 'create' ? 'Confirmer la création' : 'Enregistrer les modifications'}
            </PrimaryActionButton>
            
            <SecondaryActionButton 
              onPress={onCancel || onClose}
              disabled={isLoading || isSaving}
            >
              Annuler
            </SecondaryActionButton>
          </View>
        </View>
      )}

      {/* Modal de confirmation intégrée utilisant DeleteConfirmationModal */}
      {confirmationModal && (
        <DeleteConfirmationModal
          isVisible={confirmationModal.isVisible}
          onClose={() => {
            confirmationModal.onCancel();
            setConfirmationModal(null);
          }}
          onConfirm={async () => {
            setConfirmationModal(prev => prev ? { ...prev, isLoading: true } : null);
            try {
              await confirmationModal.onConfirm();
              setConfirmationModal(null);
            } catch (error) {
              console.error('Erreur lors de la confirmation:', error);
              setConfirmationModal(prev => prev ? { ...prev, isLoading: false } : null);
            }
          }}
          entityName={confirmationModal.entityName}
          entityType={confirmationModal.entityType}
          isLoading={confirmationModal.isLoading}
        />
      )}
    </View>
  );
}

// Hook utilitaire pour la gestion des states d'AdminFormView
export function useAdminFormView() {
  const [isVisible, setIsVisible] = React.useState(false);
  const [mode, setMode] = React.useState<AdminFormViewMode>('create');
  
  const openCreate = React.useCallback(() => {
    setMode('create');
    setIsVisible(true);
  }, []);
  
  const openEdit = React.useCallback(() => {
    setMode('edit');
    setIsVisible(true);
  }, []);
  
  const close = React.useCallback(() => {
    setIsVisible(false);
  }, []);
  
  return {
    isVisible,
    mode,
    openCreate,
    openEdit,
    close,
  };
}

// ✅ Styles simplifiés avec consolidation des constantes
const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 1000,
    flex: 1,
  },

  header: {
    backgroundColor: COMMON_STYLES.colors.background,
    borderBottomWidth: 1,
    borderBottomColor: COMMON_STYLES.colors.border,
    flexDirection: 'row',
    alignItems: 'center',
    height: 60,
    paddingHorizontal: COMMON_STYLES.spacing.xs,
    ...COMMON_STYLES.shadow,
    ...(Platform.OS === 'web' && {
      backdropFilter: 'blur(8px)',
    })
  },

  backButton: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: COMMON_STYLES.spacing.lg,
    paddingVertical: COMMON_STYLES.spacing.md,
    borderRightWidth: 1,
    borderRightColor: COMMON_STYLES.colors.border,
    height: '100%',
    ...(Platform.OS === 'web' && {
      cursor: 'pointer',
      transition: 'all 0.2s ease',
      ':hover': {
        backgroundColor: COMMON_STYLES.colors.backgroundSecondary,
      }
    })
  },

  titleContainer: {
    flex: 1,
    justifyContent: 'center',
    paddingLeft: COMMON_STYLES.spacing.lg,
    paddingRight: COMMON_STYLES.spacing.lg,
  },

  titleText: {
    textAlign: 'left',
    ...(Platform.OS === 'web' && {
      fontFamily: 'system-ui, -apple-system, sans-serif',
    })
  },

  scrollView: {
    flex: 1,
    backgroundColor: COMMON_STYLES.colors.backgroundSecondary,
  },

  scrollContent: {
    flexGrow: 1,
    padding: COMMON_STYLES.spacing.xl,
    paddingTop: COMMON_STYLES.spacing.lg,
    paddingBottom: 140, // Espace pour les boutons sticky
  },
  
  stickyActions: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    zIndex: 100,
    backgroundColor: COMMON_STYLES.colors.backgroundSecondary,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
      },
      android: {
        elevation: 8,
      },
      web: {
        boxShadow: '0 -2px 8px rgba(0, 0, 0, 0.1)',
      },
    }),
  },

  actionsContainer: {
    flexDirection: 'row',
    gap: COMMON_STYLES.spacing.md,
    paddingTop: COMMON_STYLES.spacing.xl,
    paddingHorizontal: COMMON_STYLES.spacing.xl,
    paddingBottom: COMMON_STYLES.spacing.xl,
    borderTopWidth: 1,
    borderTopColor: COMMON_STYLES.colors.border,
  },
});