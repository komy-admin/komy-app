/**
 * TeamFormModal Component
 *
 * Full-screen modal for creating and editing users with tabbed interface.
 *
 * Features:
 * - Create mode with Quick/Full tabs
 * - Edit mode with full form
 * - AdminFormLayout integration (Header + Keyboard + Footer)
 * - Ref-based form handling for external save triggers
 *
 * @example
 * ```tsx
 * <TeamFormModal
 *   visible={formView.isVisible}
 *   mode={formView.mode}
 *   user={selectedUser}
 *   activeTab="all"
 *   onClose={handleClose}
 *   onSaveQuick={handleQuickCreateSubmit}
 *   onSaveFull={handleSaveUser}
 * />
 * ```
 */

import React, { useState, useRef } from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '~/components/ui';
import { AdminFormLayout } from './AdminFormLayout';
import { AdminFormView, AdminFormViewRef } from './AdminFormView';
import { TeamForm } from '~/components/form/TeamForm';
import { QuickTeamForm } from '~/components/form/QuickTeamForm';
import { User, UserProfile } from '~/types/user.types';

export interface TeamFormModalProps {
  /** Modal visibility */
  visible: boolean;

  /** Form mode: create or edit */
  mode: 'create' | 'edit';

  /** User to edit (null for create mode) */
  user: User | null;

  /** Active tab from parent for filtering */
  activeTab: UserProfile | 'all';

  /** Close handler */
  onClose: () => void;

  /** Save handler for quick create */
  onSaveQuick: (getFormData: () => any) => Promise<boolean>;

  /** Save handler for full form (create and edit) */
  onSaveFull: (getFormData: () => any) => Promise<boolean>;
}

export const TeamFormModal: React.FC<TeamFormModalProps> = ({
  visible,
  mode,
  user,
  activeTab,
  onClose,
  onSaveQuick,
  onSaveFull,
}) => {
  const [creationMode, setCreationMode] = useState<'quick' | 'full'>('quick');

  // Refs for each form type
  const quickFormRef = useRef<AdminFormViewRef>(null);
  const fullFormRef = useRef<AdminFormViewRef>(null);
  const editFormRef = useRef<AdminFormViewRef>(null);

  if (!visible) return null;

  // Determine which ref to use for save button
  const currentFormRef =
    mode === 'create'
      ? creationMode === 'quick'
        ? quickFormRef
        : fullFormRef
      : editFormRef;

  // Determine title
  const title =
    mode === 'edit'
      ? `Modification de "${user?.firstName} ${user?.lastName}"`
      : 'Créer un utilisateur';

  // Determine save button text
  const saveButtonText =
    mode === 'create' ? 'Confirmer la création' : 'Enregistrer les modifications';

  // Check if saving
  const isSaving = currentFormRef.current?.isSaving || false;

  return (
    <AdminFormLayout
      title={title}
      onBack={onClose}
      onCancel={onClose}
      onSave={() => currentFormRef.current?.handleSave()}
      isSaving={isSaving}
      saveButtonText={saveButtonText}
    >
      {mode === 'create' ? (
        // Create mode with tabs
        <Tabs
          value={creationMode}
          onValueChange={(value) => setCreationMode(value as 'quick' | 'full')}
          style={{ flex: 1 }}
        >
          {/* Tabs Navigation - FIXED */}
          <View style={styles.tabsHeader}>
            <TabsList style={styles.tabsList}>
              <TabsTrigger value="quick" style={styles.tabTrigger}>
                <Text style={{ color: creationMode === 'quick' ? '#2A2E33' : '#A0A0A0' }}>
                  Création rapide
                </Text>
              </TabsTrigger>
              <TabsTrigger value="full" style={styles.tabTrigger}>
                <Text style={{ color: creationMode === 'full' ? '#2A2E33' : '#A0A0A0' }}>
                  Formulaire complet
                </Text>
              </TabsTrigger>
            </TabsList>
          </View>

          {/* Quick Create Tab */}
          <TabsContent value="quick" style={{ flex: 1 }}>
            <ScrollView
              style={{ flex: 1 }}
              contentContainerStyle={{ flexGrow: 1 }}
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
            >
              <AdminFormView
                ref={quickFormRef}
                visible={true}
                mode={mode}
                onClose={onClose}
                onCancel={onClose}
                onSave={onSaveQuick}
                hideHeaderAndActions={true}
              >
                <QuickTeamForm activeTab={activeTab} onQuickCreate={async () => {}} />
              </AdminFormView>
            </ScrollView>
          </TabsContent>

          {/* Full Form Tab */}
          <TabsContent value="full" style={{ flex: 1 }}>
            <ScrollView
              style={{ flex: 1 }}
              contentContainerStyle={{ flexGrow: 1 }}
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
            >
              <AdminFormView
                ref={fullFormRef}
                visible={true}
                mode={mode}
                onClose={onClose}
                onCancel={onClose}
                onSave={onSaveFull}
                hideHeaderAndActions={true}
              >
                <TeamForm user={user} activeTab={activeTab} />
              </AdminFormView>
            </ScrollView>
          </TabsContent>
        </Tabs>
      ) : (
        // Edit mode - no tabs
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{ flexGrow: 1 }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <AdminFormView
            ref={editFormRef}
            visible={true}
            mode={mode}
            onClose={onClose}
            onCancel={onClose}
            onSave={onSaveFull}
            hideHeaderAndActions={true}
          >
            <TeamForm user={user} activeTab={activeTab} />
          </AdminFormView>
        </ScrollView>
      )}
    </AdminFormLayout>
  );
};

const styles = StyleSheet.create({
  tabsHeader: {
    backgroundColor: '#FBFBFB',
    height: 50,
  },
  tabsList: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'flex-start',
    height: 50,
    paddingTop: 4,
  },
  tabTrigger: {
    width: 180,
    minWidth: 180,
    height: '100%',
  },
});
