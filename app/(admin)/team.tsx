import { View, useWindowDimensions, Text } from "react-native";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "~/components/ui";
import { TabsHeader } from '~/components/ui/TabsHeader';
import { TabBadgeItem } from '~/components/ui/TabBadgeItem';
import { HeaderActionButton } from '~/components/ui/HeaderActionButton';
import { ForkTable } from "~/components/ui/table";
import { SidePanel } from "~/components/SidePanel";
import { SlidePanel } from "~/components/ui/SlidePanel";

import { useState, useMemo, useEffect, useCallback } from "react";
import { User, UserProfile } from "~/types/user.types";
import { getUserProfileText } from "~/lib/utils";
import { DeleteConfirmationModal } from "~/components/ui/DeleteConfirmationModal";
import { QuickFormContent } from "~/components/admin/TeamForm";
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
import { getColorWithOpacity } from '~/lib/color-utils';
import { showApiError } from '~/lib/apiErrorHandler';

const TEAM_TABLE_COLUMNS = [
  {
    label: '',
    key: 'profil',
    width: 64,
    render: (user: User) => (
      <View style={{
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: getColorWithOpacity('#2A2E33', 0.12),
        borderWidth: 1.5,
        borderColor: '#2A2E33',
        alignItems: 'center',
        justifyContent: 'center',
      }}>
        <Text style={{ color: '#2A2E33', fontSize: 14, fontWeight: '600' }}>
          {user.firstName?.charAt(0)?.toUpperCase() || '?'}
        </Text>
      </View>
    ),
  },
  {
    label: 'Nom',
    key: 'name',
    width: '60%',
    render: (user: User) => (
      <Text style={{ fontSize: 15, color: '#2A2E33' }}>
        {[user.firstName, user.lastName].filter(Boolean).join(' ') || '—'}
      </Text>
    ),
  },
  {
    label: 'Date de création',
    key: 'createdAt',
    width: '33%',
    render: (user: any) => (
      <Text style={{ fontSize: 15, color: '#2A2E33' }}>
        {user.createdAt ? new Date(user.createdAt).toLocaleDateString('fr-FR') : '—'}
      </Text>
    ),
  },
];

// Filtrer les profils affichables (exclure superadmin et admin)
const DISPLAYABLE_PROFILES = Object.values(UserProfile).filter(
  profile => profile !== 'superadmin' && profile !== 'admin'
);

// États consolidés via unions discriminantes
type FormPanel =
  | null
  | { mode: 'quick'; user?: User | null };

type DeleteModal =
  | null
  | { user: User; deleting: boolean };

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

  // États consolidés
  const [formPanel, setFormPanel] = useState<FormPanel>(null);
  const [deleteModal, setDeleteModal] = useState<DeleteModal>(null);
  const [qrUser, setQrUser] = useState<User | null>(null);
  const { renderPanel, clearPanel } = usePanelPortal();

  const { showToast } = useToast();

  // Vérifier les droits d'accès aux utilisateurs
  const { user } = useSelector((state: RootState) => state.session);
  const canManageUsers = user?.profil && ['superadmin', 'admin', 'manager'].includes(user.profil);
  const canModifyUsers = user?.profil && ['superadmin', 'admin'].includes(user.profil);
  const isManager = user?.profil === 'manager';

  // Utilisation des hooks Redux (seulement si autorisé)
  const { users, loading, error, createQuickUser, updateUser, deleteUser, getUsersByProfile } = useUsers();

  // Filtrer les utilisateurs avec les filtres appliqués
  const filteredUsers = useMemo(() => {
    if (activeTab === 'all') return [];
    return filterTeamUsers(getUsersByProfile(activeTab), teamFilters);
  }, [users, activeTab, teamFilters, getUsersByProfile]);

  // Compteurs par profil
  const userCountByProfile = useMemo(() => {
    const counts: Record<string, number> = {};
    let total = 0;
    for (const profile of DISPLAYABLE_PROFILES) {
      const count = filterTeamUsers(getUsersByProfile(profile), teamFilters).length;
      counts[profile] = count;
      total += count;
    }
    counts['all'] = total;
    return counts;
  }, [users, teamFilters, getUsersByProfile]);

  // Sections pour tab "Tous"
  const teamSections = useMemo(() => {
    if (activeTab !== 'all') return undefined;
    const sections: { title: string; data: User[] }[] = [];
    for (const profile of DISPLAYABLE_PROFILES) {
      const profileUsers = filterTeamUsers(getUsersByProfile(profile), teamFilters);
      if (profileUsers.length > 0) {
        sections.push({ title: getUserProfileText(profile), data: profileUsers });
      }
    }
    return sections;
  }, [activeTab, users, teamFilters, getUsersByProfile]);

  // Gestion des filtres
  const handleFiltersChange = useCallback((filters: TeamFilterState) => {
    setTeamFilters(filters);
  }, []);

  const handleClearFilters = useCallback(() => {
    setTeamFilters(createEmptyTeamFilters());
    setActiveTab('all');
  }, []);

  const handleCloseFormPanel = useCallback(() => {
    setFormPanel(null);
    clearPanel();
  }, [clearPanel]);

  const handleCreateUser = useCallback(() => {
    if (isManager) return;
    // Aller directement sur la création rapide
    setFormPanel({ mode: 'quick' });
  }, [isManager]);

  const handleEditUser = useCallback((id: string) => {
    if (isManager) return;
    const found = users.find(u => u.id === id);
    if (!found) return;
    setFormPanel({ mode: 'quick', user: found });
  }, [isManager, users]);

  const handleQuickSave = useCallback(async (profil: UserProfile, displayName: string, userId?: string) => {
    try {
      if (userId) {
        // Mode édition
        await updateUser(userId, {
          profil,
          firstName: displayName || undefined
        });
        showToast('Utilisateur modifié avec succès', 'success');
      } else {
        // Mode création
        await createQuickUser(profil, displayName);
        showToast('Utilisateur créé avec succès', 'success');
      }
      handleCloseFormPanel();
    } catch (err) {
      showApiError(err, showToast, userId ? 'Erreur lors de la modification de l\'utilisateur' : 'Erreur lors de la création de l\'utilisateur');
    }
  }, [createQuickUser, updateUser, showToast, handleCloseFormPanel]);

  const handleDeleteUser = useCallback((id: string) => {
    const found = users.find(u => u.id === id);
    if (!found) return;
    setDeleteModal({ user: found, deleting: false });
  }, [users]);

  const confirmDelete = useCallback(async () => {
    if (!deleteModal) return;
    setDeleteModal(prev => prev ? { ...prev, deleting: true } : null);
    try {
      await deleteUser(deleteModal.user.id);
      showToast('Utilisateur supprimé avec succès', 'success');
    } catch (err) {
      showApiError(err, showToast, 'Erreur lors de la suppression de l\'utilisateur');
    } finally {
      setDeleteModal(null);
    }
  }, [deleteModal, deleteUser, showToast]);

  const handleShowQrCode = useCallback((user: User) => {
    setQrUser(user);
  }, []);

  // Synchroniser le panel avec le portal global
  useEffect(() => {
    if (!formPanel) {
      clearPanel();
      return;
    }

    const panelContent = (
      <QuickFormContent
        user={formPanel.user}
        onSave={handleQuickSave}
        onCancel={handleCloseFormPanel}
        activeTab={activeTab}
      />
    );

    renderPanel(
      <SlidePanel visible={true} onClose={handleCloseFormPanel} width={500}>
        {panelContent}
      </SlidePanel>
    );
  }, [formPanel, activeTab, handleCloseFormPanel, handleQuickSave, renderPanel, clearPanel]);

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
  }, [canModifyUsers, handleEditUser, handleDeleteUser, handleShowQrCode]);

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
          <TabsHeader
            rightSlot={canModifyUsers ? (
              <HeaderActionButton label="AJOUTER" onPress={handleCreateUser} />
            ) : undefined}
          >
            <TabsList
              className="flex-row justify-start h-full"
              style={{ height: 60 }}
            >
              <TabsTrigger value="all" className="">
                <TabBadgeItem
                  name="Tous"
                  stats={`${userCountByProfile['all'] || 0} utilisateur${(userCountByProfile['all'] || 0) !== 1 ? 's' : ''}`}
                  isActive={activeTab === 'all'}
                />
              </TabsTrigger>
              {DISPLAYABLE_PROFILES.map((type) => (
                <TabsTrigger key={type} value={type} className="">
                  <TabBadgeItem
                    name={getUserProfileText(type)}
                    stats={`${userCountByProfile[type] || 0} utilisateur${(userCountByProfile[type] || 0) !== 1 ? 's' : ''}`}
                    isActive={activeTab === type}
                  />
                </TabsTrigger>
              ))}
            </TabsList>
          </TabsHeader>

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
                sections={teamSections}
                columns={TEAM_TABLE_COLUMNS}
                onRowPress={canModifyUsers ? handleEditUser : undefined}
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
          isVisible={deleteModal !== null}
          onClose={() => setDeleteModal(null)}
          onConfirm={confirmDelete}
          entityName={deleteModal ? `${deleteModal.user.firstName} ${deleteModal.user.lastName}` : ''}
          entityType="le profil"
          isLoading={deleteModal?.deleting ?? false}
        />
      )}

      {/* QR Code Modal */}
      <UserQrModal
        user={qrUser}
        visible={qrUser !== null}
        onClose={() => setQrUser(null)}
      />

      {/* Panel rendu via usePanelPortal - pas de rendu local */}
    </>
  );
}

