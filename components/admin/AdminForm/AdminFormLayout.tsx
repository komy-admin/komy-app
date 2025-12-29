/**
 * AdminFormLayout Component
 *
 * Unified layout wrapper for admin form screens (team, menu, room management)
 *
 * Handles:
 * - FormHeader (fixed at top)
 * - KeyboardSafeFormView with ADMIN role (scrollable content)
 * - Footer actions with Cancel/Save buttons (fixed at bottom, covered by keyboard)
 *
 * Architecture Pattern:
 * ┌─────────────────────────────────┐
 * │ FormHeader (FIXED)              │
 * ├─────────────────────────────────┤
 * │                                 │
 * │ KeyboardSafeFormView            │
 * │ (SCROLLABLE + Keyboard Aware)   │
 * │                                 │
 * │ {children}                      │
 * │                                 │
 * ├─────────────────────────────────┤
 * │ Footer Actions (FIXED)          │
 * │ [Cancel] [Save]                 │
 * └─────────────────────────────────┘
 *
 * @example
 * ```tsx
 * <AdminFormLayout
 *   title="Modifier l'utilisateur"
 *   onBack={handleClose}
 *   onCancel={handleCancel}
 *   onSave={handleSave}
 *   isSaving={false}
 *   saveButtonText="Enregistrer"
 * >
 *   <TeamForm user={selectedUser} />
 * </AdminFormLayout>
 * ```
 */

import React from 'react';
import { View, Text as RNText, Pressable, StyleSheet, Platform } from 'react-native';
import { FormHeader } from '~/components/admin/AdminForm/FormHeader';
import { KeyboardSafeFormView } from '~/components/Keyboard';

export interface AdminFormLayoutProps {
  /** Title displayed in the header */
  title: string;

  /** Back button handler */
  onBack: () => void;

  /** Cancel button handler */
  onCancel: () => void;

  /** Save button handler */
  onSave: () => void;

  /** Is save operation in progress */
  isSaving?: boolean;

  /** Save button text (default: "Enregistrer") */
  saveButtonText?: string;

  /** Cancel button text (default: "Annuler") */
  cancelButtonText?: string;

  /** Form content */
  children: React.ReactNode;

  /** Optional custom keyboard vertical offset (default: 150) */
  keyboardVerticalOffset?: number;

  /** Optional right element in header (tabs, buttons, etc.) */
  headerRight?: React.ReactNode;
}

export const AdminFormLayout: React.FC<AdminFormLayoutProps> = ({
  title,
  onBack,
  onCancel,
  onSave,
  isSaving = false,
  saveButtonText = 'Enregistrer',
  cancelButtonText = 'Annuler',
  children,
  keyboardVerticalOffset = 150,
  headerRight,
}) => {
  return (
    <View style={styles.container}>
      {/* FormHeader - FIXED at top */}
      <FormHeader title={title} onBack={onBack} rightElement={headerRight} />

      {/* KeyboardSafeFormView - SCROLLABLE content with keyboard handling */}
      <KeyboardSafeFormView
        role="ADMIN"
        behavior="padding"
        keyboardVerticalOffset={keyboardVerticalOffset}
        style={styles.keyboardView}
      >
        {children}
      </KeyboardSafeFormView>

      {/* Footer Actions - FIXED at bottom (covered by keyboard when open) */}
      <View style={styles.footerActions}>
        <Pressable onPress={onCancel} style={styles.cancelButton}>
          <RNText style={styles.cancelButtonText}>{cancelButtonText}</RNText>
        </Pressable>
        <Pressable onPress={onSave} style={styles.saveButton} disabled={isSaving}>
          <RNText style={styles.saveButtonText}>
            {isSaving ? 'Sauvegarde...' : saveButtonText}
          </RNText>
        </Pressable>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  keyboardView: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  footerActions: {
    flexDirection: 'row',
    ...(Platform.OS === 'web' ? {} : { gap: 16 }),
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    backgroundColor: '#F9FAFB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    ...Platform.select({
      ios: { elevation: 8 },
      android: { elevation: 8 },
      web: { boxShadow: '0 -2px 8px rgba(0, 0, 0, 0.1)' },
    }),
  },
  cancelButton: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    height: 48,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#E5E7EB',
    ...(Platform.OS === 'web' && {
      marginRight: 16,
      cursor: 'pointer',
      transition: 'all 0.2s ease',
    }),
  },
  cancelButtonText: {
    color: '#6B7280',
    fontWeight: '700',
    fontSize: 16,
    letterSpacing: 0.5,
    ...(Platform.OS === 'web' && {
      fontFamily: 'system-ui, -apple-system, sans-serif',
    }),
  },
  saveButton: {
    flex: 2,
    backgroundColor: '#2A2E33',
    borderRadius: 12,
    height: 48,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#2A2E33',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    ...Platform.select({
      ios: { elevation: 4 },
      android: { elevation: 4 },
      web: {
        boxShadow: '0 3px 6px rgba(42, 46, 51, 0.2)',
        cursor: 'pointer',
        transition: 'all 0.2s ease',
      },
    }),
  },
  saveButtonText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 16,
    letterSpacing: 0.5,
    ...(Platform.OS === 'web' && {
      fontFamily: 'system-ui, -apple-system, sans-serif',
    }),
  },
});
