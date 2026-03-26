/**
 * AdminFormView Component
 *
 * ════════════════════════════════════════════════════════════════════════════
 * PATTERN B: Admin Forms (Long forms with ScrollView)
 * ════════════════════════════════════════════════════════════════════════════
 *
 * AdminFormView is a CONTENT CONTAINER that:
 * - Provides form structure and action buttons
 * - Does NOT manage keyboard (parent handles it)
 * - Is always used with external KeyboardAwareScrollViewWrapper
 *
 * IMPORTANT: Keyboard management is ALWAYS handled by the parent screen!
 * ════════════════════════════════════════════════════════════════════════════
 */

import React from 'react';
import { View, Text, StyleSheet, Platform } from 'react-native';
import { Button } from '~/components/ui';
import { DeleteConfirmationModal } from '~/components/ui/DeleteConfirmationModal';
import { useToast } from '~/components/ToastProvider';
import { showApiError } from '~/lib/apiErrorHandler';

// ════════════════════════════════════════════════════════════════════════════
// Action Button Components
// ════════════════════════════════════════════════════════════════════════════

const PrimaryActionButton = ({ children, disabled, style, ...props }: any) => (
  <Button
    disabled={disabled}
    style={[
      {
        flex: 2,
        backgroundColor: disabled ? '#6B7280' : '#2A2E33',
        borderRadius: 12,
        height: 44,
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
        height: 44,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 2,
        borderColor: '#E5E7EB',
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
      fontWeight: '700',
      fontSize: 16,
      letterSpacing: 0.5,
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
        height: 44,
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
        height: 44,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 2,
        borderColor: '#E5E7EB',
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
      fontWeight: '700',
      fontSize: 16,
      letterSpacing: 0.5,
    }}>
      {children}
    </Text>
  </Button>
);

// ════════════════════════════════════════════════════════════════════════════
// Style Constants
// ════════════════════════════════════════════════════════════════════════════

const COMMON_STYLES = {
  spacing: {
    md: 16,
    lg: 24,
    xl: 32,
  },
  colors: {
    backgroundSecondary: '#F9FAFB',
    border: '#F3F4F6',
  },
};

// ════════════════════════════════════════════════════════════════════════════
// TypeScript Interfaces
// ════════════════════════════════════════════════════════════════════════════

export type AdminFormViewMode = 'create' | 'edit';

export interface AdminFormData<T = any> {
  data: T;
  isValid: boolean;
  errors: Record<string, string>;
  hasChanges?: boolean;
}

export interface AdminFormRef<T = any> {
  getFormData: () => AdminFormData<T>;
  resetForm?: () => void;
  validateForm?: () => boolean;
}

export interface AdminConfirmationContext {
  showConfirmation: (config: Omit<AdminConfirmationModal, 'isVisible' | 'isLoading'>) => void;
  hideConfirmation: () => void;
}

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
  onClose: () => void;
  onCancel?: () => void;
  onSave?: (getFormData: () => AdminFormData) => Promise<boolean>;
  isLoading?: boolean;
  children: React.ReactNode;
  backgroundColor?: string;
  hideHeaderAndActions?: boolean; // For custom interfaces (parent manages header/footer)
  // Props for configuration screens (when hideHeaderAndActions=true)
  configurationActions?: {
    onCancel: () => void;
    onConfirm: () => void;
    cancelLabel?: string;
    confirmLabel?: string;
    confirmButtonColor?: string;
  };
}

export interface AdminFormViewRef {
  handleSave: () => Promise<void>;
  isSaving: boolean;
}

// ════════════════════════════════════════════════════════════════════════════
// Main Component
// ════════════════════════════════════════════════════════════════════════════

export const AdminFormView = React.forwardRef<AdminFormViewRef, AdminFormViewProps>(({
  visible,
  mode,
  onClose,
  onCancel,
  onSave,
  isLoading = false,
  children,
  backgroundColor = '#FFFFFF',
  hideHeaderAndActions = false,
  configurationActions
}, ref) => {
  const [isSaving, setIsSaving] = React.useState(false);
  const [confirmationModal, setConfirmationModal] = React.useState<AdminConfirmationModal | null>(null);
  const formRef = React.useRef<AdminFormRef>(null);
  const { showToast } = useToast();

  // ═══════════════════════════════════════════════════════════════════════════
  // Form Save Handler
  // ═══════════════════════════════════════════════════════════════════════════

  const handleSave = React.useCallback(async () => {
    if (!onSave || !formRef.current) return;

    const getFormData = () => formRef.current!.getFormData();
    const formData = getFormData();

    if (!formData.isValid) {
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
      showApiError(error, showToast, 'Erreur lors de la sauvegarde');
    } finally {
      setIsSaving(false);
    }
  }, [onSave, onClose]);

  // Expose handleSave via ref for external buttons
  React.useImperativeHandle(ref, () => ({
    handleSave,
    isSaving,
  }), [handleSave, isSaving]);

  // ═══════════════════════════════════════════════════════════════════════════
  // Confirmation Modal Context
  // ═══════════════════════════════════════════════════════════════════════════

  const confirmationContext = React.useMemo(() => ({
    showConfirmation: (config: Omit<AdminConfirmationModal, 'isVisible'>) => {
      setConfirmationModal({ ...config, isVisible: true });
    },
    hideConfirmation: () => {
      setConfirmationModal(null);
    }
  }), []);

  // ═══════════════════════════════════════════════════════════════════════════
  // Child with Context
  // ═══════════════════════════════════════════════════════════════════════════

  const childWithRef = React.isValidElement(children)
    ? React.cloneElement(children, {
        ref: formRef,
        confirmationContext
      } as any)
    : children;

  // Early return if not visible (after all hooks - Rules of Hooks)
  if (!visible) {
    return null;
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // Render
  // ═══════════════════════════════════════════════════════════════════════════

  return (
    <View style={[styles.container, { backgroundColor }]}>
      {/* Form Content */}
      {childWithRef}

      {/* Configuration Actions (for config screens like login/pin) */}
      {hideHeaderAndActions && configurationActions && (
        <View style={styles.actionsInFlow}>
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
      )}

      {/* Standard AdminFormView Actions */}
      {onSave && !hideHeaderAndActions && (
        <View style={styles.actionsInFlow}>
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
      )}

      {/* Confirmation Modal */}
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
              showApiError(error, showToast, 'Erreur lors de la confirmation');
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
});

AdminFormView.displayName = 'AdminFormView';

// ════════════════════════════════════════════════════════════════════════════
// Utility Hook
// ════════════════════════════════════════════════════════════════════════════

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

// ════════════════════════════════════════════════════════════════════════════
// Styles
// ════════════════════════════════════════════════════════════════════════════

const styles = StyleSheet.create({
  container: {
    backgroundColor: COMMON_STYLES.colors.backgroundSecondary,
    padding: COMMON_STYLES.spacing.lg,
  },

  actionsInFlow: {
    flexDirection: 'row',
    gap: COMMON_STYLES.spacing.md,
    marginTop: COMMON_STYLES.spacing.xl,
    paddingTop: COMMON_STYLES.spacing.xl,
    borderTopWidth: 1,
    borderTopColor: COMMON_STYLES.colors.border,
  },
});
