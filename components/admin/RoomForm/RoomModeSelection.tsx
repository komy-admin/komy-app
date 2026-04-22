import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Pressable } from 'react-native';
import { X, Plus, Trash2 } from 'lucide-react-native';
import { Room } from '~/types/room.types';
import { colors } from '~/theme';

interface RoomModeSelectionProps {
  rooms: Room[];
  onSelectCreate: () => void;
  onSelectEdit: (room: Room) => void;
  onDelete: (room: Room) => void;
  onCancel: () => void;
}

export const RoomModeSelection: React.FC<RoomModeSelectionProps> = ({
  rooms,
  onSelectCreate,
  onSelectEdit,
  onDelete,
  onCancel,
}) => {
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Gestion des salles</Text>
        <TouchableOpacity onPress={onCancel}>
          <X size={24} color={colors.neutral[500]} strokeWidth={2} />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer}>
        {/* Option Créer */}
        <TouchableOpacity
          style={styles.createCard}
          onPress={onSelectCreate}
          activeOpacity={0.7}
        >
          <View style={styles.createIconWrapper}>
            <Plus size={22} color={colors.brand.dark} strokeWidth={2.5} />
          </View>
          <View style={styles.createContent}>
            <Text style={styles.createTitle}>Créer une salle</Text>
            <Text style={styles.createDescription}>
              Ajouter une nouvelle salle au restaurant.
            </Text>
          </View>
        </TouchableOpacity>

        {/* Séparation */}
        <View style={styles.separator}>
          <View style={styles.separatorLine} />
          <Text style={styles.separatorText}>Salles existantes</Text>
          <View style={styles.separatorLine} />
        </View>

        {/* Liste des rooms */}
        <View style={styles.roomList}>
          {rooms.map((room) => (
            <View key={room.id} style={styles.roomItem}>
              <View style={styles.roomColorOuter}>
                <View style={[styles.roomColorInner, { backgroundColor: room.isActive ? (room.color || colors.brand.accent) : colors.gray[300] }]} />
              </View>
              <Text style={[styles.roomName, !room.isActive && styles.roomNameInactive]} numberOfLines={1}>
                {room.name}
              </Text>
              <View style={styles.roomActions}>
                <Pressable onPress={() => onSelectEdit(room)} style={styles.editButton}>
                  <Text style={styles.editButtonText}>Modifier</Text>
                </Pressable>
                <Pressable onPress={() => onDelete(room)} style={styles.deleteButton}>
                  <Trash2 size={16} color={colors.error.base} strokeWidth={2} />
                </Pressable>
              </View>
            </View>
          ))}
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.white,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: colors.neutral[200],
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.neutral[800],
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: 20,
  },
  createCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.gray[100],
    borderRadius: 12,
    padding: 16,
    borderWidth: 1.5,
    borderColor: colors.brand.dark,
    gap: 14,
  },
  createIconWrapper: {
    width: 44,
    height: 44,
    borderRadius: 10,
    backgroundColor: colors.white,
    justifyContent: 'center',
    alignItems: 'center',
  },
  createContent: {
    flex: 1,
  },
  createTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.brand.dark,
    marginBottom: 2,
  },
  createDescription: {
    fontSize: 12,
    color: colors.neutral[500],
  },
  separator: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 20,
    gap: 12,
  },
  separatorLine: {
    flex: 1,
    height: 1,
    backgroundColor: colors.neutral[200],
  },
  separatorText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.neutral[400],
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  roomList: {
    gap: 10,
  },
  roomItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 10,
    backgroundColor: colors.neutral[50],
    borderWidth: 1,
    borderColor: colors.neutral[100],
    gap: 12,
  },
  roomColorOuter: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: colors.neutral[800],
    justifyContent: 'center',
    alignItems: 'center',
  },
  roomColorInner: {
    width: 14,
    height: 14,
    borderRadius: 7,
  },
  roomName: {
    flex: 1,
    fontSize: 14,
    fontWeight: '500',
    color: colors.neutral[800],
  },
  roomNameInactive: {
    color: colors.neutral[400],
    textDecorationLine: 'line-through',
  },
  roomActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  deleteButton: {
    width: 38,
    height: 38,
    borderRadius: 8,
    backgroundColor: colors.error.bg,
    borderWidth: 1,
    borderColor: colors.error.border,
    justifyContent: 'center',
    alignItems: 'center',
  },
  editButton: {
    height: 38,
    paddingHorizontal: 14,
    borderRadius: 8,
    backgroundColor: colors.brand.dark,
    justifyContent: 'center',
    alignItems: 'center',
  },
  editButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.white,
  },
});
