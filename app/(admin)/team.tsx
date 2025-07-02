import { View, ScrollView, useWindowDimensions, Text, StyleSheet } from "react-native";
import { Tabs, TabsContent, TabsList, TabsTrigger, Button, ForkTable } from "~/components/ui";
import { SidePanel } from "~/components/SidePanel";
import React, { useEffect, useState, useMemo } from "react";
import { User, UserProfile } from "~/types/user.types";
import { getUserProfileText } from "~/lib/utils";
import { CustomModal } from "~/components/CustomModal";
import { TeamForm } from "~/components/form/TeamForm";
import { useToast } from '~/components/ToastProvider';
import { QRCode } from "~/components/ui/QRCode";
import { CreditCard as Edit2, QrCode, Trash } from 'lucide-react-native';
import { ActionMenu, ActionItem } from '~/components/ActionMenu';
import { useSelector } from 'react-redux';
import { RootState } from '~/store';
import { useUsers, useRestaurant } from '~/hooks/useRestaurant';
import { FilterBar } from '~/components/filters/Filter';
import { FilterConfig } from "~/hooks/useFilter/types";

export default function TeamPage() {
  const [isPanelCollapsed, setIsPanelCollapsed] = useState(true);
  const [activeTab, setActiveTab] = useState<UserProfile | 'all'>('all');
  const [filterValues, setFilterValues] = useState<Record<string, any>>({});
  const [qrModalVisible, setQrModalVisible] = useState(false);
  const [selectedUserForQr, setSelectedUserForQr] = useState<User | null>(null);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [qrCodeToken, setQrCodeToken] = useState<string | null>(null);
  const [qrLoading, setQrLoading] = useState(false);
  const [qrError, setQrError] = useState<string | null>(null);
  const [qrSuccess, setQrSuccess] = useState<string | null>(null);
  const [isDeleteModalVisible, setIsDeleteModalVisible] = useState(false);
  const { currentUser } = useSelector((state: RootState) => state.auth);
  const [User, setUser] = useState<User | null>(null);
  const [userToDelete, setUserToDelete] = useState<User | null>(null);
  const { showToast } = useToast();

  // Vérifier les droits d'accès aux utilisateurs
  const { userProfile } = useSelector((state: RootState) => state.auth);
  const canManageUsers = userProfile && ['superadmin', 'admin', 'manager'].includes(userProfile);

  // Initialiser la connexion WebSocket via useRestaurant
  const { isLoading: globalLoading } = useRestaurant();

  // Utilisation des hooks Redux (seulement si autorisé)
  const { users, loading, error, createUser, updateUser, deleteUser, generateQrToken, revokeQrToken, loadUsers, getUsersByProfile } = useUsers();

  // Configuration des filtres
  const filterConfig: FilterConfig<User>[] = [
    {
      field: 'firstName',
      type: 'text',
      label: 'Prénom',
      operator: 'like',
      show: true
    },
    {
      field: 'lastName',
      type: 'text',
      label: 'Nom',
      operator: 'like',
      show: true
    },
    {
      field: 'email',
      type: 'text',
      label: 'Email',
      operator: 'like',
      show: true
    },
    {
      field: 'phone',
      type: 'number',
      label: 'Numéro de téléphone',
      operator: 'like',
      show: true
    },
  ];

  // Plus besoin de charger manuellement - useAppInit gère l'initialisation automatique

  // Filtrer les utilisateurs avec les filtres appliqués
  const filteredUsers = useMemo(() => {
    let result = activeTab === 'all' ? users : getUsersByProfile(activeTab);

    // Appliquer les filtres
    Object.entries(filterValues).forEach(([field, value]) => {
      if (value && value !== '') {
        result = result.filter(user => {
          // Type-safe access aux propriétés User
          switch (field) {
            case 'firstName':
              return user.firstName?.toLowerCase().includes(value.toString().toLowerCase()) ?? false;
            case 'lastName':
              return user.lastName?.toLowerCase().includes(value.toString().toLowerCase()) ?? false;
            case 'email':
              return user.email?.toLowerCase().includes(value.toString().toLowerCase()) ?? false;
            case 'phone':
              return user.phone?.toString().includes(value.toString()) ?? false;
            default:
              return false;
          }
        });
      }
    });

    return result;
  }, [users, activeTab, filterValues, getUsersByProfile]);

  // Gestion des filtres
  const handleUpdateFilter = (field: string, value: any) => {
    setFilterValues(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleClearFilters = () => {
    setFilterValues({});
    setActiveTab('all');
  };

  const handleCreateUser = () => {
    setUser(null);
    setIsModalVisible(true);
  };

  const handleEditUser = (id: string) => {
    const user = users.find(user => user.id === id);
    if (!user) return;
    setUser(user);
    setIsModalVisible(true);
  };

  const handleCloseModal = () => {
    setIsModalVisible(false);
    setUser(null);
  };

  const handleSaveUser = async (user: User) => {
    try {
      if (user.id) {
        await updateUser(user.id, user);
        showToast('Utilisateur modifié avec succès', 'success');
      } else {
        await createUser(user);
        showToast('Utilisateur créé avec succès', 'success');
      }
      handleCloseModal();
    } catch (err) {
      console.error('Error saving user:', err);
      showToast('Erreur lors de la sauvegarde de l\'utilisateur', 'error');
    }
  };

  const handleDeleteUser = async (id: string) => {
    const user = users.find(user => user.id === id);
    if (!user) return;
    setUserToDelete(user);
    setIsDeleteModalVisible(true);
  };

  const confirmDelete = async () => {
    if (!userToDelete) return;

    try {
      await deleteUser(userToDelete.id);
      showToast('Utilisateur supprimé avec succès', 'success');
    } catch (err) {
      console.error('Error deleting user:', err);
      showToast('Erreur lors de la suppression de l\'utilisateur', 'error');
    } finally {
      setIsDeleteModalVisible(false);
      setUserToDelete(null);
    }
  };

  const handleShowQrCode = async (user: User) => {
    setSelectedUserForQr(user);
    setQrModalVisible(true);
    setQrCodeToken(null);
    setQrError(null);
    setQrSuccess(null);
    setQrLoading(true);

    try {
      const res = await generateQrToken(user.id);
      console.log('QR API response:', res);
      setQrCodeToken(res.qrData.token);
    } catch (e: any) {
      setQrError("Erreur lors de la génération du QR code");
    } finally {
      setQrLoading(false);
    }
  };

  const handleShareQr = () => {
    console.log('Partager QR Code pour:', selectedUserForQr?.firstName, selectedUserForQr?.lastName);
  };

  const handleRevokeQr = async () => {
    if (!selectedUserForQr) return;
    await revokeQrToken(selectedUserForQr.id);
    showToast('QR code révoqué avec succès', 'success');
  };

  const getUserActions = (user: User): ActionItem[] => {
    return [
      {
        label: 'Modifier',
        icon: <Edit2 size={16} color="#4F46E5" />,
        onPress: () => handleEditUser(user.id ? user.id : '')
      },
      ...(currentUser?.profil === 'admin' || 'superadmin' ? [{
        label: 'QR Code',
        icon: <QrCode size={16} color="#4F46E5" />,
        onPress: () => handleShowQrCode(user)
      }] : []),
      {
        label: 'Supprimer',
        icon: <Trash size={16} color="#ef4444" />,
        type: 'destructive',
        onPress: () => handleDeleteUser(user.id ? user.id : '')
      }
    ];
  };

  const { width } = useWindowDimensions();

  const teamTableColumns = [
    {
      label: 'Profil',
      key: 'profil',
      width: '20%',
    },
    {
      label: 'Prénom',
      key: 'firstName',
      width: '20%',
    },
    {
      label: 'Nom',
      key: 'lastName',
      width: '20%',
    },
    {
      label: 'Email',
      key: 'email',
      width: '20%',
    },
    {
      label: 'Téléphone',
      key: 'phone',
      width: '20%',
    },
  ];

  return (
    <View style={{ flex: 1, flexDirection: 'row' }}>
      <SidePanel
        title="Filtrage"
        width={width / 4}
        isCollapsed={isPanelCollapsed}
        onCollapsedChange={setIsPanelCollapsed}
      >
        <View style={{ padding: 15 }}>
          <FilterBar
            config={filterConfig}
            onUpdateFilter={handleUpdateFilter}
            onClearFilters={handleClearFilters}
            activeFilters={Object.entries(filterValues).map(([field, value]) => ({ field, value, operator: 'like' }))}
          />
        </View>
      </SidePanel>

      <View style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        <Tabs
          style={{ flex: 1, backgroundColor: '#FFFFFF' }}
          value={activeTab}
          onValueChange={(newValue: string) => {
            const newTab = newValue as UserProfile | 'all';
            setActiveTab(newTab);
          }}
        >
          <View
            style={{
              backgroundColor: '#FBFBFB',
              height: 50,
              position: 'relative'
            }}
          >
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={{
                maxWidth: '80%'
              }}
              contentContainerStyle={{
                alignItems: 'center',
                height: 50
              }}
            >
              <TabsList
                className="flex-row justify-start h-full"
                style={{
                  paddingTop: 4,
                  height: 50
                }}
              >
                <TabsTrigger
                  value="all"
                  className="flex-row h-full"
                  style={{ width: 100, minWidth: 100 }}
                >
                  <Text style={{ color: activeTab === 'all' ? '#2A2E33' : '#A0A0A0' }}>
                    Tous
                  </Text>
                </TabsTrigger>
                {Object.values(UserProfile)
                  .filter(type => !['superadmin', 'admin'].includes(type))
                  .map((type) => (
                    <TabsTrigger
                      key={type}
                      value={type}
                      className="flex-row h-full"
                      style={{ width: 100, minWidth: 100 }}
                    >
                      <Text style={{ color: activeTab === type ? '#2A2E33' : '#A0A0A0' }}>
                        {getUserProfileText(type)}
                      </Text>
                    </TabsTrigger>
                  ))}
              </TabsList>
            </ScrollView>

            <View
              style={{
                width: 200,
                position: 'absolute',
                right: 0,
                top: 0,
                bottom: 0,
                backgroundColor: '#FBFBFB',
                zIndex: 10,
                shadowColor: '#000',
                shadowOffset: { width: -4, height: 0 },
                shadowOpacity: 0.05,
                shadowRadius: 2,
              }}
            >
              <Button
                onPress={handleCreateUser}
                className="w-[200px] h-[50px] flex items-center justify-center"
                style={{
                  backgroundColor: canManageUsers ? '#2A2E33' : '#CCCCCC',
                  borderRadius: 0,
                  height: 50,
                  width: 200
                }}
                disabled={!canManageUsers}
              >
                <Text style={{
                  fontSize: 14,
                  color: canManageUsers ? '#FBFBFB' : '#888888',
                  fontWeight: '500',
                  textAlign: 'center',
                  textTransform: 'uppercase',
                }}>
                  Créer un utilisateur
                </Text>
              </Button>
            </View>
          </View>

          <TabsContent style={{ flex: 1 }} value={activeTab}>
            {!canManageUsers ? (
              <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 }}>
                <Text style={{ color: '#ef4444', fontSize: 16, textAlign: 'center' }}>
                  Accès non autorisé{'\n'}
                  Vous n'avez pas les droits nécessaires pour gérer les utilisateurs.
                </Text>
              </View>
            ) : loading || error ? (
              <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 }}>
                <Text style={{ color: error ? '#ef4444' : '#666', fontSize: 16 }}>
                  {loading ? 'Chargement...' : error || 'Erreur lors du chargement'}
                </Text>
              </View>
            ) : (
              <ForkTable
                data={filteredUsers}
                columns={teamTableColumns}
                onRowPress={handleEditUser}
                onRowDelete={handleDeleteUser}
                useActionMenu={true}
                getActions={getUserActions}
                isLoading={loading}
                loadingMessage="Chargement des utilisateurs..."
                emptyMessage="Aucun utilisateur trouvé"
              />
            )}
          </TabsContent>
        </Tabs>
      </View>

      <CustomModal
        isVisible={isModalVisible}
        onClose={handleCloseModal}
        width={600}
        height={675}
        title={User ? "Modifier l'utilisateur" : "Créer un utilisateur"}
      >
        <TeamForm
          user={User}
          onSave={handleSaveUser}
          onCancel={handleCloseModal}
          activeTab={activeTab}
        />
      </CustomModal>

      <CustomModal
        isVisible={isDeleteModalVisible}
        onClose={() => {
          setIsDeleteModalVisible(false);
          setUserToDelete(null);
        }}
        width={600}
        height={320}
        title="Confirmation de suppression"
        titleColor="#FF4444"
      >
        <View style={styles.deleteModalContent}>
          <View style={{ paddingTop: 20 }}>
            <Text style={styles.deleteMessage}>
              Êtes-vous sûr de vouloir supprimer le profil {userToDelete?.firstName} {userToDelete?.lastName} ?
            </Text>
            <Text style={styles.deleteWarning}>
              {'(Cette action est irréversible.)'}
            </Text>
          </View>
          <View style={styles.deleteButtonContainer}>
            <Button
              onPress={confirmDelete}
              style={styles.deleteButton}
              variant="destructive"
            >
              <Text style={styles.deleteButtonText}>Supprimer</Text>
            </Button>
            <Button
              onPress={() => {
                setIsDeleteModalVisible(false);
                setUserToDelete(null);
              }}
              style={styles.cancelButton}
              variant="ghost"
            >
              <Text style={styles.cancelButtonText}>Annuler</Text>
            </Button>
          </View>
        </View>
      </CustomModal>

      <CustomModal
        isVisible={qrModalVisible}
        onClose={() => {
          setQrModalVisible(false);
          setSelectedUserForQr(null);
          setQrCodeToken(null);
          setQrError(null);
          setQrSuccess(null);
        }}
        width={450}
        height={500}
        title="QR Code Utilisateur"
      >
        {selectedUserForQr && (
          <View style={styles.qrModalContent}>
            <View style={styles.qrCodeContainer}>
              {qrLoading && (
                <Text style={styles.loadingText}>Chargement du QR code...</Text>
              )}
              {qrError && (
                <Text style={styles.errorText}>{qrError}</Text>
              )}
              {qrSuccess && (
                <Text style={styles.successText}>{qrSuccess}</Text>
              )}
              {!qrLoading && !qrError && qrCodeToken && (
                <QRCode value={qrCodeToken} size={220} />
              )}
            </View>

            <Text style={styles.userNameText}>
              {selectedUserForQr.firstName} {selectedUserForQr.lastName}
            </Text>

            <View style={styles.qrButtonContainer}>
              <Button
                onPress={handleShareQr}
                style={styles.shareButton}
                variant="outline"
                disabled={!qrCodeToken || qrLoading}
              >
                <Text style={styles.shareButtonText}>Partager</Text>
              </Button>

              <Button
                onPress={handleRevokeQr}
                style={styles.revokeButton}
                variant="destructive"
                disabled={!qrCodeToken || qrLoading}
              >
                <Text style={styles.revokeButtonText}>Révoquer</Text>
              </Button>
            </View>
          </View>
        )}
      </CustomModal>
    </View>
  );
}

const styles = StyleSheet.create({
  deleteModalContent: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 10,
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  deleteMessage: {
    fontSize: 16,
    marginBottom: 8,
    textAlign: 'center',
    color: '#2A2E33',
  },
  deleteWarning: {
    fontSize: 14,
    color: '#FF4444',
    marginBottom: 40,
    textAlign: 'center',
  },
  deleteButtonContainer: {
    width: '100%',
    flexDirection: 'column',
    justifyContent: 'center',
    gap: 12,
  },
  cancelButton: {
    width: '100%',
    paddingHorizontal: 20,
    paddingVertical: 10,
    marginBottom: 7,
  },
  cancelButtonText: {
    color: '#2A2E33',
    fontSize: 14,
    fontWeight: '500',
  },
  deleteButton: {
    width: '100%',
    backgroundColor: '#FF4444',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 6,
  },
  deleteButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '500',
  },
  qrModalContent: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 20,
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  qrCodeContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  loadingText: {
    fontSize: 16,
    color: '#666',
    marginVertical: 40,
  },
  errorText: {
    fontSize: 16,
    color: '#FF4444',
    marginVertical: 40,
    textAlign: 'center',
  },
  successText: {
    fontSize: 16,
    color: '#00AA00',
    marginVertical: 40,
    textAlign: 'center',
  },
  userNameText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#2A2E33',
    textAlign: 'center',
    marginBottom: 30,
  },
  qrButtonContainer: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 15,
  },
  shareButton: {
    flex: 1,
    paddingVertical: 12,
    borderColor: '#2A2E33',
    borderWidth: 1,
    borderRadius: 6,
  },
  shareButtonText: {
    color: '#2A2E33',
    fontSize: 14,
    fontWeight: '500',
  },
  revokeButton: {
    flex: 1,
    paddingVertical: 12,
    backgroundColor: '#FF4444',
    borderRadius: 6,
  },
  revokeButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '500',
  },
});