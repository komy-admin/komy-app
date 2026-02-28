import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Pressable } from 'react-native';
import { X, Plus, Trash2 } from 'lucide-react-native';
import { Room } from '~/types/room.types';

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
          <X size={24} color="#64748B" strokeWidth={2} />
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
            <Plus size={24} color="#16A34A" strokeWidth={2.5} />
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
                <View style={[styles.roomColorInner, { backgroundColor: room.isActive ? (room.color || '#6366F1') : '#D1D5DB' }]} />
              </View>
              <Text style={[styles.roomName, !room.isActive && styles.roomNameInactive]} numberOfLines={1}>
                {room.name}
              </Text>
              <View style={styles.roomActions}>
                <Pressable onPress={() => onSelectEdit(room)} style={styles.editButton}>
                  <Text style={styles.editButtonText}>Modifier</Text>
                </Pressable>
                <Pressable onPress={() => onDelete(room)} style={styles.deleteButton}>
                  <Trash2 size={16} color="#EF4444" strokeWidth={2} />
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
    backgroundColor: '#FFFFFF',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1E293B',
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
    backgroundColor: '#F0FDF4',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1.5,
    borderColor: '#BBF7D0',
    gap: 14,
  },
  createIconWrapper: {
    width: 44,
    height: 44,
    borderRadius: 10,
    backgroundColor: '#DCFCE7',
    justifyContent: 'center',
    alignItems: 'center',
  },
  createContent: {
    flex: 1,
  },
  createTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#15803D',
    marginBottom: 2,
  },
  createDescription: {
    fontSize: 12,
    color: '#16A34A',
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
    backgroundColor: '#E2E8F0',
  },
  separatorText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#94A3B8',
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
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#F1F5F9',
    gap: 12,
  },
  roomColorOuter: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#1E293B',
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
    color: '#1E293B',
  },
  roomNameInactive: {
    color: '#94A3B8',
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
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FECACA',
    justifyContent: 'center',
    alignItems: 'center',
  },
  editButton: {
    height: 38,
    paddingHorizontal: 14,
    borderRadius: 8,
    backgroundColor: '#2A2E33',
    justifyContent: 'center',
    alignItems: 'center',
  },
  editButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});
