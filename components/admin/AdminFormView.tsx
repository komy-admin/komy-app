import React from 'react';
import { View, Text, Pressable, ScrollView, StyleSheet, Platform } from 'react-native';
import { ArrowLeftToLine } from 'lucide-react-native';
import { Button } from '~/components/ui';
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
  scrollViewRef
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
      {/* Header moderne et professionnel */}
      <View style={styles.header}>
        {/* Section Bouton retour */}
        <Pressable
          onPress={onCancel || onClose}
          style={styles.backButton}
        >
          <ArrowLeftToLine size={20} color="#2A2E33" />
        </Pressable>

        {/* Section Titre */}
        <View style={styles.titleContainer}>
          <Text style={styles.titleText}>
            {title}
          </Text>
        </View>
      </View>

      {/* Contenu du formulaire */}
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
      
      {/* Actions sticky en bas - Intégrées dans AdminFormView */}
      {onSave && (
        <View style={styles.stickyActions}>
          <View style={styles.actionsContainer}>
            <Button
              onPress={handleSave}
              disabled={isLoading || isSaving}
              style={[
                styles.submitButton,
                // pour le web obligé de mettre dans le dom
                { backgroundColor: '#2A2E33', borderRadius: 12, height: 52,}
              ]}
            >
              <Text style={[
                styles.submitButtonText,
                // pour le web obligé de mettre dans le dom
                { color: '#FFFFFF', fontWeight: '700', fontSize: 16, letterSpacing: 0.5,}
              ]}>
                {isLoading || isSaving ? 'Sauvegarde...' : mode === 'create' ? 'Confirmer la création' : 'Enregistrer les modifications'}
              </Text>
            </Button>
            
            <Button 
              onPress={onCancel || onClose}
              disabled={isLoading || isSaving}
              style={[
                styles.cancelButton, 
                // pour le web obligé de mettre dans le dom
                { backgroundColor: '#FFFFFF', borderRadius: 12, height: 52}
              ]}
            >
              <Text style={[
                styles.cancelButtonText,
                // pour le web obligé de mettre dans le dom
                { color: '#6B7280', fontWeight: '600', fontSize: 16, letterSpacing: 0.3,}
              ]}>
                Annuler
              </Text>
            </Button>
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
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
    flexDirection: 'row',
    alignItems: 'center',
    height: 60,
    paddingHorizontal: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
    ...(Platform.OS === 'web' && {
      backdropFilter: 'blur(8px)',
    })
  },

  backButton: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderRightWidth: 1,
    borderRightColor: '#F3F4F6',
    height: '100%',
    ...(Platform.OS === 'web' && {
      cursor: 'pointer',
      transition: 'all 0.2s ease',
      ':hover': {
        backgroundColor: '#F9FAFB',
      }
    })
  },

  titleContainer: {
    flex: 1,
    justifyContent: 'center',
    paddingLeft: 24,
    paddingRight: 24,
  },

  titleText: {
    fontSize: 18,
    fontWeight: '800',
    color: '#2A2E33',
    textAlign: 'left',
    letterSpacing: 0.5,
    ...(Platform.OS === 'web' && {
      fontFamily: 'system-ui, -apple-system, sans-serif',
    })
  },

  scrollView: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },

  scrollContent: {
    flexGrow: 1,
    padding: 32,
    paddingTop: 24,
    paddingBottom: 140, // Espace pour les boutons sticky (116px + marge)
  },
  
  stickyActions: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    zIndex: 100,
    backgroundColor: '#F9FAFB',
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
    gap: 16,
    paddingTop: 32,
    paddingHorizontal: 32,
    paddingBottom: 32,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },

  submitButton: {
    flex: 2,
    backgroundColor: '#2A2E33',
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
        backgroundColor: '#1A1E23',
        transform: 'translateY(-2px)',
        shadowOpacity: 0.3,
      }
    })
  },

  submitButtonText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 16,
    letterSpacing: 0.5,
  },

  cancelButton: {
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

  cancelButtonText: {
    color: '#6B7280',
    fontWeight: '600',
    fontSize: 16,
    letterSpacing: 0.3,
  },
});