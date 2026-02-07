import { View, ScrollView, useWindowDimensions, Text } from "react-native";
import { Tabs, TabsContent, TabsList, TabsTrigger, Button, ForkTable } from "~/components/ui";
import { SidePanel } from "~/components/SidePanel";
import { SlidePanel } from "~/components/ui/SlidePanel";

import { useState, useMemo, useEffect, useCallback } from "react";
import { User, UserProfile } from "~/types/user.types";
import { getUserProfileText } from "~/lib/utils";
import { DeleteConfirmationModal } from "~/components/ui/DeleteConfirmationModal";
import { ModeSelection, QuickFormContent, FullFormContent } from "~/components/admin/TeamForm";
import { UserQrModal } from "~/components/admin/UserQrModal";
import { useToast } from '~/components/ToastProvider';
import { CreditCard as Edit2, QrCode, Trash } from 'lucide-react-native';
import { ActionItem } from '~/components/ActionMenu';
import { useSelector } from 'react-redux';
import { RootState } from '~/store';
import { useUsers } from '~/hooks/useRestaurant';
import { TeamFilters, TeamFilterState } from '~/components/filters/TeamFilters';
import { filterTeamUsers, createEmptyTeamFilters } from '~/utils/teamFilters';
import { useRouter } from 'expo-router';
import { usePanelPortal } from '~/hooks/usePanelPortal';

// Constantes en dehors du composant pour éviter les re-créations
const TEAM_TABLE_COLUMNS = [
  { label: 'Profil', key: 'profil', width: '20%' },
  { label: 'Prénom', key: 'firstName', width: '20%' },
  { label: 'Nom', key: 'lastName', width: '20%' },
  { label: 'Email', key: 'email', width: '20%' },
  { label: 'Téléphone', key: 'phone', width: '20%' },
];

// Filtrer les profils affichables (exclure superadmin et admin)
const DISPLAYABLE_PROFILES = Object.values(UserProfile).filter(
  profile => !['superadmin', 'admin'].includes(profile)
);

export default function TeamPage() {
  const router = useRouter();
  const accountConfig = useSelector((state: RootState) => state.session.accountConfig);

  // Rediriger si la vue est désactivée
  useEffect(() => {
    if (accountConfig && accountConfig.teamEnabled === false) {
      router.replace('/(admin)/service');
    }
  }, [accountConfig, router]);

  // UI State
  const [isPanelCollapsed, setIsPanelCollapsed] = useState(true);
  const [activeTab, setActiveTab] = useState<UserProfile | 'all'>('all');
  const [teamFilters, setTeamFilters] = useState<TeamFilterState>(createEmptyTeamFilters());

  // Form State
  const [isFormPanelVisible, setIsFormPanelVisible] = useState(false);
  const [formMode, setFormMode] = useState<'selection' | 'quick' | 'full' | null>(null);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const { renderPanel, clearPanel } = usePanelPortal();

  // Delete Modal State
  const [isDeleteModalVisible, setIsDeleteModalVisible] = useState(false);
  const [userToDelete, setUserToDelete] = useState<User | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // QR Modal State
  const [qrModalVisible, setQrModalVisible] = useState(false);
  const [selectedUserForQr, setSelectedUserForQr] = useState<User | null>(null);

  const { showToast } = useToast();

  // Vérifier les droits d'accès aux utilisateurs
  const { user } = useSelector((state: RootState) => state.session);
  const canManageUsers = user?.profil && ['superadmin', 'admin', 'manager'].includes(user.profil);
  const canModifyUsers = user?.profil && ['superadmin', 'admin'].includes(user.profil);
  const isManager = user?.profil === 'manager';

  // Utilisation des hooks Redux (seulement si autorisé)
  const { users, loading, error, createUser, createQuickUser, updateUser, deleteUser, getUsersByProfile } = useUsers();

  // Filtrer les utilisateurs avec les filtres appliqués
  const filteredUsers = useMemo(() => {
    let result = activeTab === 'all' ? users : getUsersByProfile(activeTab);

    // Appliquer les filtres TeamFilters
    result = filterTeamUsers(result, teamFilters);

    return result.map(user => ({
      ...user,
      profil: getUserProfileText(user.profil)
    }));
  }, [users, activeTab, teamFilters, getUsersByProfile]);

  // Gestion des filtres
  const handleFiltersChange = useCallback((filters: TeamFilterState) => {
    setTeamFilters(filters);
  }, []);

  const handleClearFilters = useCallback(() => {
    setTeamFilters(createEmptyTeamFilters());
    setActiveTab('all');
  }, []);

  const handleCreateUser = () => {
    // Les managers ne peuvent pas créer d'utilisateurs
    if (isManager) return;
    setSelectedUser(null);
    setFormMode('selection'); // Afficher la sélection du mode
    setIsFormPanelVisible(true);
  };

  const handleEditUser = (id: string) => {
    // Les managers ne peuvent pas modifier les utilisateurs
    if (isManager) return;
    const user = users.find(user => user.id === id);
    if (!user) return;
    setSelectedUser(user);
    setFormMode('full'); // Édition = toujours mode complet
    setIsFormPanelVisible(true);
  };

  const handleCloseFormPanel = useCallback(() => {
    setIsFormPanelVisible(false);
    setFormMode(null);
    setSelectedUser(null);
    clearPanel();
  }, [clearPanel]);

  const handleSelectQuickMode = () => {
    setFormMode('quick');
  };

  const handleSelectFullMode = () => {
    setFormMode('full');
  };

  const handleQuickSave = async (profil: UserProfile, displayName: string) => {
    try {
      await createQuickUser(profil, displayName);
      showToast('Utilisateur créé avec succès', 'success');
      handleCloseFormPanel();
    } catch (err: any) {
      console.error('Error creating quick user:', err);
      const errorMessage = err?.message || 'Erreur lors de la création de l\'utilisateur';
      showToast(errorMessage, 'error');
    }
  };

  const handleSaveUser = async (userData: Partial<User>) => {
    try {
      if (selectedUser?.id) {
        await updateUser(selectedUser.id, userData);
        showToast('Utilisateur modifié avec succès', 'success');
      } else {
        await createUser(userData as User);
        showToast('Utilisateur créé avec succès', 'success');
      }
      handleCloseFormPanel();
    } catch (err: any) {
      console.error('Error saving user:', err);
      const errorMessage = err?.message || 'Erreur lors de la sauvegarde de l\'utilisateur';
      showToast(errorMessage, 'error');
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

    setIsDeleting(true);
    try {
      await deleteUser(userToDelete.id);
      showToast('Utilisateur supprimé avec succès', 'success');
    } catch (err) {
      console.error('Error deleting user:', err);
      showToast('Erreur lors de la suppression de l\'utilisateur', 'error');
    } finally {
      setIsDeleting(false);
      setIsDeleteModalVisible(false);
      setUserToDelete(null);
    }
  };

  const handleCloseDeleteModal = () => {
    setIsDeleteModalVisible(false);
    setUserToDelete(null);
  };

  const handleShowQrCode = (user: User) => {
    setSelectedUserForQr(user);
    setQrModalVisible(true);
  };

  // Synchroniser le panel avec le portal global
  useEffect(() => {
    if (isFormPanelVisible && formMode) {
      let panelContent;

      if (formMode === 'selection') {
        // Écran de sélection du mode
        panelContent = (
          <ModeSelection
            onSelectQuick={handleSelectQuickMode}
            onSelectFull={handleSelectFullMode}
            onCancel={handleCloseFormPanel}
          />
        );
      } else if (formMode === 'quick') {
        // Formulaire de création rapide
        panelContent = (
          <QuickFormContent
            onSave={handleQuickSave}
            onCancel={handleCloseFormPanel}
            activeTab={activeTab}
          />
        );
      } else {
        // Formulaire complet (création ou édition)
        panelContent = (
          <FullFormContent
            user={selectedUser}
            onSave={handleSaveUser}
            onCancel={handleCloseFormPanel}
            activeTab={activeTab}
          />
        );
      }

      renderPanel(
        <SlidePanel visible={true} onClose={handleCloseFormPanel} width={500}>
          {panelContent}
        </SlidePanel>
      );
    } else {
      clearPanel();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isFormPanelVisible, formMode, selectedUser, activeTab]);

  const getUserActions = useCallback((user: User): ActionItem[] => {
    const actions: ActionItem[] = [];

    // Seuls admin et superadmin peuvent modifier
    if (canModifyUsers) {
      actions.push({
        label: 'Modifier',
        icon: <Edit2 size={16} color="#4F46E5" />,
        onPress: () => handleEditUser(user.id)
      });
    }

    // QR Code accessible à tous (admin, superadmin, manager)
    actions.push({
      label: 'QR Code',
      icon: <QrCode size={16} color="#4F46E5" />,
      onPress: () => handleShowQrCode(user)
    });

    // Seuls admin et superadmin peuvent supprimer
    if (canModifyUsers) {
      actions.push({
        label: 'Supprimer',
        icon: <Trash size={16} color="#ef4444" />,
        type: 'destructive',
        onPress: () => handleDeleteUser(user.id)
      });
    }

    return actions;
  }, [canModifyUsers]);

  const { width } = useWindowDimensions();

  return (
    <>
      <View style={{ flex: 1, flexDirection: 'row' }}>
        <SidePanel
          title="Filtrage"
          width={width / 4}
          isCollapsed={isPanelCollapsed}
          onCollapsedChange={setIsPanelCollapsed}
        >
          <TeamFilters
            filters={teamFilters}
            onFiltersChange={handleFiltersChange}
            onClearFilters={handleClearFilters}
          />
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
              flexDirection: 'row'
            }}
          >
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              showsVerticalScrollIndicator={false}
              bounces={false}
              style={{
                flex: 1
              }}
              contentContainerStyle={{
                alignItems: 'center'
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
                {DISPLAYABLE_PROFILES.map((type) => (
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

            {/* Bouton "Créer un utilisateur" - caché pour les managers */}
            {canModifyUsers && (
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
                  onPress={handleCreateUser}
                  className="w-[200px] h-[50px] flex items-center justify-center"
                  style={{
                    backgroundColor: '#2A2E33',
                    borderRadius: 0,
                    height: 50,
                    width: 200
                  }}
                >
                  <Text style={{
                    fontSize: 14,
                    color: '#FBFBFB',
                    fontWeight: '500',
                    textAlign: 'center',
                    textTransform: 'uppercase',
                  }}>
                    Créer un utilisateur
                  </Text>
                </Button>
              </View>
            )}
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
                columns={TEAM_TABLE_COLUMNS}
                onRowPress={canModifyUsers ? handleEditUser : undefined}
                onRowDelete={canModifyUsers ? handleDeleteUser : undefined}
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
      </View>

      {/* Modal de suppression - cachée pour les managers */}
      {canModifyUsers && (
        <DeleteConfirmationModal
          isVisible={isDeleteModalVisible}
          onClose={handleCloseDeleteModal}
          onConfirm={confirmDelete}
          entityName={userToDelete ? `${userToDelete.firstName} ${userToDelete.lastName}` : ''}
          entityType="le profil"
          isLoading={isDeleting}
        />
      )}

      {/* QR Code Modal */}
      <UserQrModal
        user={selectedUserForQr}
        visible={qrModalVisible}
        onClose={() => {
          setQrModalVisible(false);
          setSelectedUserForQr(null);
        }}
      />

      {/* Panel rendu via usePanelPortal - pas de rendu local */}
    </>
  );
}