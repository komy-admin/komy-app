import { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, Pressable, TextInput, ActivityIndicator, Switch, Platform } from 'react-native';
import { Plus, Pencil, Trash2, X } from 'lucide-react-native';
import { useToast } from '~/components/ToastProvider';
import { DeleteConfirmationModal } from '~/components/ui/DeleteConfirmationModal';
import type { ReservationService, CreateReservationServiceDto, UpdateReservationServiceDto } from '~/types/reservation.types';

interface ReservationServicesProps {
  reservation: {
    services: ReservationService[];
    loadServices: () => Promise<ReservationService[]>;
    createService: (data: CreateReservationServiceDto) => Promise<ReservationService>;
    updateService: (id: string, data: UpdateReservationServiceDto) => Promise<ReservationService>;
    deleteService: (id: string) => Promise<void>;
  };
}

interface ServiceFormData {
  name: string;
  maxCapacity: string;
  slotIntervalMinutes: string;
  serviceDurationMinutes: string;
  color: string;
  isActive: boolean;
}

const INITIAL_FORM: ServiceFormData = {
  name: '',
  maxCapacity: '50',
  slotIntervalMinutes: '30',
  serviceDurationMinutes: '90',
  color: '#3B82F6',
  isActive: true,
};

const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#A855F7', '#EC4899', '#06B6D4', '#84CC16'];

export function ReservationServices({ reservation }: ReservationServicesProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingService, setEditingService] = useState<ReservationService | null>(null);
  const [form, setForm] = useState<ServiceFormData>(INITIAL_FORM);
  const [isSaving, setIsSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<ReservationService | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const { showToast } = useToast();

  useEffect(() => {
    reservation.loadServices()
      .catch(() => showToast('Erreur chargement des services', 'error'))
      .finally(() => setIsLoading(false));
  }, []);

  const openCreate = useCallback(() => {
    setForm(INITIAL_FORM);
    setEditingService(null);
    setShowForm(true);
  }, []);

  const openEdit = useCallback((service: ReservationService) => {
    setForm({
      name: service.name,
      maxCapacity: String(service.maxCapacity),
      slotIntervalMinutes: String(service.slotIntervalMinutes),
      serviceDurationMinutes: String(service.serviceDurationMinutes),
      color: service.color || '#3B82F6',
      isActive: service.isActive,
    });
    setEditingService(service);
    setShowForm(true);
  }, []);

  const closeForm = useCallback(() => {
    setShowForm(false);
    setEditingService(null);
  }, []);

  const handleSave = async () => {
    if (!form.name.trim()) {
      showToast('Le nom est requis', 'error');
      return;
    }

    setIsSaving(true);
    try {
      const data = {
        name: form.name.trim(),
        maxCapacity: parseInt(form.maxCapacity) || 50,
        slotIntervalMinutes: parseInt(form.slotIntervalMinutes) || 30,
        serviceDurationMinutes: parseInt(form.serviceDurationMinutes) || 90,
        color: form.color,
        isActive: form.isActive,
      };

      if (editingService) {
        await reservation.updateService(editingService.id, data);
        showToast('Service modifié', 'success');
      } else {
        await reservation.createService(data);
        showToast('Service créé', 'success');
      }
      closeForm();
    } catch (error: any) {
      showToast(error?.response?.data?.error || 'Erreur lors de la sauvegarde', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setIsDeleting(true);
    try {
      await reservation.deleteService(deleteTarget.id);
      showToast('Service supprimé', 'success');
      setDeleteTarget(null);
    } catch (error: any) {
      showToast(error?.response?.data?.message || 'Erreur lors de la suppression', 'error');
    } finally {
      setIsDeleting(false);
    }
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#2A2E33" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <View>
          <Text style={styles.pageTitle}>Services</Text>
          <Text style={styles.pageSubtitle}>Configurez vos services de restauration (déjeuner, dîner...)</Text>
        </View>
        <Pressable style={styles.addButton} onPress={openCreate}>
          <Plus size={18} color="#FFFFFF" />
          <Text style={styles.addButtonText}>Ajouter</Text>
        </Pressable>
      </View>

      {/* Form */}
      {showForm && (
        <View style={styles.formCard}>
          <View style={styles.formHeader}>
            <Text style={styles.formTitle}>
              {editingService ? 'Modifier le service' : 'Nouveau service'}
            </Text>
            <Pressable onPress={closeForm}>
              <X size={20} color="#64748B" />
            </Pressable>
          </View>

          <View style={styles.formFields}>
            <View style={styles.formField}>
              <Text style={styles.fieldLabel}>Nom du service</Text>
              <TextInput
                style={styles.textInput}
                value={form.name}
                onChangeText={(text) => setForm(prev => ({ ...prev, name: text }))}
                placeholder="Ex: Déjeuner, Dîner, Brunch..."
                placeholderTextColor="#9CA3AF"
              />
            </View>

            <View style={styles.formRow}>
              <View style={[styles.formField, { flex: 1 }]}>
                <Text style={styles.fieldLabel}>Capacité max (couverts)</Text>
                <TextInput
                  style={styles.textInput}
                  value={form.maxCapacity}
                  onChangeText={(text) => setForm(prev => ({ ...prev, maxCapacity: text }))}
                  keyboardType="number-pad"
                  placeholder="50"
                  placeholderTextColor="#9CA3AF"
                />
              </View>

              <View style={[styles.formField, { flex: 1 }]}>
                <Text style={styles.fieldLabel}>Intervalle créneaux (min)</Text>
                <TextInput
                  style={styles.textInput}
                  value={form.slotIntervalMinutes}
                  onChangeText={(text) => setForm(prev => ({ ...prev, slotIntervalMinutes: text }))}
                  keyboardType="number-pad"
                  placeholder="30"
                  placeholderTextColor="#9CA3AF"
                />
              </View>
            </View>

            <View style={styles.formRow}>
              <View style={[styles.formField, { flex: 1 }]}>
                <Text style={styles.fieldLabel}>Durée du service (min)</Text>
                <TextInput
                  style={styles.textInput}
                  value={form.serviceDurationMinutes}
                  onChangeText={(text) => setForm(prev => ({ ...prev, serviceDurationMinutes: text }))}
                  keyboardType="number-pad"
                  placeholder="90"
                  placeholderTextColor="#9CA3AF"
                />
              </View>
            </View>

            <View style={styles.formField}>
              <Text style={styles.fieldLabel}>Couleur</Text>
              <View style={styles.colorPicker}>
                {COLORS.map((color) => (
                  <Pressable
                    key={color}
                    style={[
                      styles.colorOption,
                      { backgroundColor: color },
                      form.color === color && styles.colorOptionSelected,
                    ]}
                    onPress={() => setForm(prev => ({ ...prev, color }))}
                  />
                ))}
              </View>
            </View>

            <View style={styles.switchRow}>
              <Text style={styles.fieldLabel}>Actif</Text>
              <Switch
                value={form.isActive}
                onValueChange={(value) => setForm(prev => ({ ...prev, isActive: value }))}
                trackColor={{ false: '#D1D5DB', true: '#86EFAC' }}
                thumbColor={form.isActive ? '#10B981' : '#9CA3AF'}
              />
            </View>
          </View>

          <View style={styles.formActions}>
            <Pressable
              style={[styles.saveButton, isSaving && styles.saveButtonDisabled]}
              onPress={handleSave}
              disabled={isSaving}
            >
              <Text style={styles.saveButtonText}>
                {isSaving ? 'Sauvegarde...' : editingService ? 'Modifier' : 'Créer'}
              </Text>
            </Pressable>
            <Pressable style={styles.cancelButton} onPress={closeForm}>
              <Text style={styles.cancelButtonText}>Annuler</Text>
            </Pressable>
          </View>
        </View>
      )}

      {/* Services list */}
      {reservation.services.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyText}>Aucun service configuré</Text>
          <Text style={styles.emptySubtext}>Créez votre premier service pour commencer</Text>
        </View>
      ) : (
        <View style={styles.servicesList}>
          {reservation.services.map((service) => (
            <View key={service.id} style={styles.serviceCard}>
              <View style={[styles.serviceColorBar, { backgroundColor: service.color || '#3B82F6' }]} />
              <View style={styles.serviceInfo}>
                <View style={styles.serviceNameRow}>
                  <Text style={styles.serviceName}>{service.name}</Text>
                  {!service.isActive && (
                    <View style={styles.inactiveBadge}>
                      <Text style={styles.inactiveBadgeText}>Inactif</Text>
                    </View>
                  )}
                </View>
                <Text style={styles.serviceDetails}>
                  {service.maxCapacity} couverts max · Créneaux tous les {service.slotIntervalMinutes} min · Durée {service.serviceDurationMinutes} min
                </Text>
                <Text style={styles.serviceDetails}>
                  {service.reservationsCount != null && service.reservationsCount > 0
                    ? `Réservation${service.reservationsCount > 1 ? 's' : ''} à venir : ${service.reservationsCount}`
                    : ''}
                </Text>
              </View>
              <View style={styles.serviceActions}>
                <Switch
                  value={service.isActive}
                  onValueChange={(value) => { reservation.updateService(service.id, { isActive: value }); }}
                  trackColor={{ false: '#D1D5DB', true: '#86EFAC' }}
                  thumbColor={service.isActive ? '#10B981' : '#9CA3AF'}
                />
                <Pressable style={styles.iconButton} onPress={() => openEdit(service)}>
                  <Pencil size={16} color="#64748B" />
                </Pressable>
                <Pressable style={styles.iconButton} onPress={() => setDeleteTarget(service)}>
                  <Trash2 size={16} color="#EF4444" />
                </Pressable>
              </View>
            </View>
          ))}
        </View>
      )}

      <DeleteConfirmationModal
        isVisible={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        entityName={deleteTarget?.name || ''}
        entityType="le service"
        isLoading={isDeleting}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 24,
  },
  pageTitle: { fontSize: 22, fontWeight: '700', color: '#1E293B', marginBottom: 4 },
  pageSubtitle: { fontSize: 14, color: '#64748B' },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#2A2E33',
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingVertical: 10,
    ...(Platform.OS === 'web' && { cursor: 'pointer' }),
  },
  addButtonText: { color: '#FFFFFF', fontWeight: '600', fontSize: 14 },
  formCard: {
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 20,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  formHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  formTitle: { fontSize: 16, fontWeight: '600', color: '#1E293B' },
  formFields: { gap: 16 },
  formRow: { flexDirection: 'row', gap: 16 },
  formField: {},
  fieldLabel: { fontSize: 13, fontWeight: '600', color: '#475569', marginBottom: 6 },
  textInput: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: '#1E293B',
  },
  colorPicker: { flexDirection: 'row', gap: 8 },
  colorOption: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  colorOptionSelected: {
    borderColor: '#1E293B',
    borderWidth: 3,
  },
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  formActions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 20,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
  },
  saveButton: {
    flex: 2,
    backgroundColor: '#2A2E33',
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
    ...(Platform.OS === 'web' && { cursor: 'pointer' }),
  },
  saveButtonDisabled: { opacity: 0.7 },
  saveButtonText: { color: '#FFFFFF', fontWeight: '700', fontSize: 14 },
  cancelButton: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    ...(Platform.OS === 'web' && { cursor: 'pointer' }),
  },
  cancelButtonText: { color: '#64748B', fontWeight: '600', fontSize: 14 },
  emptyState: { alignItems: 'center', paddingVertical: 60 },
  emptyText: { fontSize: 16, fontWeight: '600', color: '#94A3B8', marginBottom: 4 },
  emptySubtext: { fontSize: 14, color: '#CBD5E1' },
  servicesList: { gap: 12 },
  serviceCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    overflow: 'hidden',
  },
  serviceColorBar: { width: 4, alignSelf: 'stretch' },
  serviceInfo: { flex: 1, padding: 16 },
  serviceNameRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 },
  serviceName: { fontSize: 15, fontWeight: '600', color: '#1E293B' },
  inactiveBadge: {
    backgroundColor: '#FEF2F2',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  inactiveBadgeText: { fontSize: 11, color: '#EF4444', fontWeight: '600' },
  serviceDetails: { fontSize: 13, color: '#64748B' },
  serviceActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingRight: 12,
  },
  iconButton: {
    padding: 8,
    borderRadius: 8,
    ...(Platform.OS === 'web' && { cursor: 'pointer' }),
  },
});
