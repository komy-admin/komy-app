/**
 * RoomFormModal Component
 *
 * Full-screen modal for creating and editing rooms.
 * Follows the same pattern as TeamFormModal and MenuFormModal.
 *
 * Features:
 * - Create/Edit modes
 * - AdminFormLayout integration (Header + Keyboard + Footer)
 * - Ref-based form handling for external save triggers
 * - Optional "Mode édition" button in header (edit mode only)
 *
 * @example
 * ```tsx
 * <RoomFormModal
 *   visible={roomFormView.isVisible}
 *   mode={roomFormView.mode}
 *   room={currentRoom}
 *   onClose={handleCloseRoomModal}
 *   onSave={handleSaveRoom}
 *   onNavigateToEditionMode={navigateToEditionMode}
 * />
 * ```
 */

import React, { useRef } from 'react';
import { View, Text, ScrollView } from 'react-native';
import { Button } from '~/components/ui';
import { AdminFormLayout } from './AdminFormLayout';
import { AdminFormView, AdminFormViewRef } from './AdminFormView';
import { RoomForm } from '~/components/form/RoomForm';
import { Room } from '~/types/room.types';

export interface RoomFormModalProps {
  /** Modal visibility */
  visible: boolean;

  /** Form mode: create or edit */
  mode: 'create' | 'edit';

  /** Room to edit (null for create mode) */
  room: Room | null;

  /** Close handler */
  onClose: () => void;

  /** Save handler */
  onSave: (getFormData: () => any) => Promise<boolean>;

  /** Navigate to edition mode handler (edit mode only) */
  onNavigateToEditionMode?: () => void;
}

export const RoomFormModal: React.FC<RoomFormModalProps> = ({
  visible,
  mode,
  room,
  onClose,
  onSave,
  onNavigateToEditionMode,
}) => {
  const formRef = useRef<AdminFormViewRef>(null);

  if (!visible) return null;

  // Determine title
  const title =
    mode === 'create'
      ? "Création d'une nouvelle salle"
      : room
        ? `Modification de "${room.name}"`
        : 'Chargement...';

  // Determine save button text
  const saveButtonText = mode === 'create' ? 'Créer la salle' : 'Enregistrer';

  // Check if saving
  const isSaving = formRef.current?.isSaving || false;

  // Edition mode button (only in edit mode)
  const headerRight =
    mode === 'edit' && onNavigateToEditionMode ? (
      <View
        style={{
          width: 200,
          backgroundColor: '#FBFBFB',
          shadowColor: '#000',
          shadowOffset: { width: -4, height: 0 },
          shadowOpacity: 0.05,
          shadowRadius: 2,
        }}
      >
        <Button
          onPress={onNavigateToEditionMode}
          className="w-[200px] h-[50px] flex items-center justify-center"
          style={{
            backgroundColor: '#2A2E33',
            borderRadius: 0,
            height: 50,
            width: 200,
          }}
        >
          <Text
            style={{
              fontSize: 14,
              color: '#FBFBFB',
              fontWeight: '500',
              textAlign: 'center',
              textTransform: 'uppercase',
            }}
          >
            Mode édition
          </Text>
        </Button>
      </View>
    ) : undefined;

  return (
    <AdminFormLayout
      title={title}
      onBack={onClose}
      onCancel={onClose}
      onSave={() => formRef.current?.handleSave()}
      isSaving={isSaving}
      saveButtonText={saveButtonText}
      headerRight={headerRight}
    >
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ flexGrow: 1 }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <AdminFormView
          ref={formRef}
          visible={true}
          mode={mode}
          onClose={onClose}
          onCancel={onClose}
          onSave={onSave}
          hideHeaderAndActions={true}
        >
          <RoomForm room={room} />
        </AdminFormView>
      </ScrollView>
    </AdminFormLayout>
  );
};
