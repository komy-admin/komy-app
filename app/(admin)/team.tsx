import { View, useWindowDimensions, Text } from "react-native";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "~/components/ui";
import { AppHeader } from '~/components/ui/AppHeader';
import { TabBadgeItem } from '~/components/ui/TabBadgeItem';
import { HeaderActionButton } from '~/components/ui/HeaderActionButton';
import { ForkTable } from "~/components/ui/table";
import { SidePanel } from "~/components/SidePanel";
import { SlidePanel } from "~/components/ui/SlidePanel";

import { useState, useMemo, useEffect, useCallback } from "react";
import { User, UserProfile } from "~/types/user.types";
import { getUserProfileText } from "~/lib/utils";
import { QuickFormContent } from "~/components/admin/TeamForm";
import { UserQrPanelContent } from "~/components/admin/UserQrPanel";
import { colors } from '~/theme';
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
import { DeleteConfirmPanel } from '~/components/ui/DeleteConfirmPanel';
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
        backgroundColor: getColorWithOpacity(colors.brand.dark, 0.12),
        borderWidth: 1.5,
        borderColor: colors.brand.dark,
        alignItems: 'center',
        justifyContent: 'center',
      }}>
        <Text style={{ color: colors.brand.dark, fontSize: 14, fontWeight: '600' }}>
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
      <Text style={{ fontSize: 15, color: colors.brand.dark }}>
        {[user.firstName, user.lastName].filter(Boolean).join(' ') || '—'}
      </Text>
    ),
  },
  {
    label: 'Date de création',
    key: 'createdAt',
    width: '33%',
    render: (user: any) => (
      <Text style={{ fontSize: 15, color: colors.brand.dark }}>
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
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);
  const [pendingDeleteName, setPendingDeleteName] = useState<string>('');
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
    setPendingDeleteId(null);
    setFormPanel({ mode: 'quick' });
  }, [isManager]);

  const handleEditUser = useCallback((id: string) => {
    if (isManager) return;
    setPendingDeleteId(null);
    const found = users.find(u => u.id === id);
    if (!found) return;
    setFormPanel({ mode: 'quick', user: found });
  }, [isManager, users]);

  const handleQuickSave = useCallback(async (profil: UserProfile, displayName: string, userId?: string) => {
    if (userId) {
      await updateUser(userId, {
        profil,
        firstName: displayName || undefined
      });
      showToast('Utilisateur modifié avec succès', 'success');
    } else {
      await createQuickUser(profil, displayName);
      showToast('Utilisateur créé avec succès', 'success');
    }
    handleCloseFormPanel();
  }, [createQuickUser, updateUser, showToast, handleCloseFormPanel]);

  const handleDeleteUser = useCallback((id: string) => {
    const found = users.find(u => u.id === id);
    setPendingDeleteId(id);
    setPendingDeleteName([found?.firstName, found?.lastName].filter(Boolean).join(' ') || '');
  }, [users]);

  const confirmDelete = useCallback(async () => {
    if (!pendingDeleteId) return;
    try {
      await deleteUser(pendingDeleteId);
      showToast('Utilisateur supprimé avec succès', 'success');
    } catch (err) {
      showApiError(err, showToast, 'Erreur lors de la suppression de l\'utilisateur');
    } finally {
      setPendingDeleteId(null);
      setPendingDeleteName('');
    }
  }, [pendingDeleteId, deleteUser, showToast]);

  const handleShowQrCode = useCallback((user: User) => {
    setFormPanel(null);
    setPendingDeleteId(null);
    setQrUser(user);
  }, []);

  const handleCloseQrPanel = useCallback(() => {
    setQrUser(null);
    clearPanel();
  }, [clearPanel]);

  // Synchroniser le panel avec le portal global
  useEffect(() => {
    if (qrUser) {
      renderPanel(
        <SlidePanel visible={true} onClose={handleCloseQrPanel} width={450}>
          <UserQrPanelContent user={qrUser} onClose={handleCloseQrPanel} />
        </SlidePanel>
      );
      return;
    }

    if (formPanel) {
      renderPanel(
        <SlidePanel visible={true} onClose={handleCloseFormPanel} width={430}>
          <QuickFormContent
            user={formPanel.user}
            onSave={handleQuickSave}
            onCancel={handleCloseFormPanel}
            activeTab={activeTab}
          />
        </SlidePanel>
      );
      return;
    }

    clearPanel();
  }, [qrUser, formPanel, activeTab, handleCloseFormPanel, handleCloseQrPanel, handleQuickSave, renderPanel, clearPanel]);

  const getUserActions = useCallback((user: User): ActionItem[] => {
    const actions: ActionItem[] = [];

    // Seuls admin et superadmin peuvent modifier
    if (canModifyUsers) {
      actions.push({
        label: 'Modifier',
        icon: <Edit2 size={16} color={colors.brand.accentDark} />,
        onPress: () => handleEditUser(user.id)
      });
    }

    // QR Code accessible à tous (admin, superadmin, manager)
    actions.push({
      label: 'QR Code',
      icon: <QrCode size={16} color={colors.brand.accentDark} />,
      onPress: () => handleShowQrCode(user)
    });

    // Seuls admin et superadmin peuvent supprimer
    if (canModifyUsers) {
      actions.push({
        label: 'Supprimer',
        icon: <Trash size={16} color={colors.error.base} />,
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
          style={{ flex: 1, backgroundColor: colors.white }}
          value={activeTab}
          onValueChange={(newValue: string) => {
            const newTab = newValue as UserProfile | 'all';
            setPendingDeleteId(null);
            setActiveTab(newTab);
          }}
        >
          <AppHeader
            rightSlot={canModifyUsers ? (
              <HeaderActionButton label="AJOUTER" onPress={handleCreateUser} />
            ) : undefined}
            tabs={
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
            }
          />

          <TabsContent style={{ flex: 1 }} value={activeTab}>
            {!canManageUsers ? (
              <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 }}>
                <Text style={{ color: colors.error.base, fontSize: 16, textAlign: 'center' }}>
                  Accès non autorisé{'\n'}
                  Vous n'avez pas les droits nécessaires pour gérer les utilisateurs.
                </Text>
              </View>
            ) : loading || error ? (
              <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 }}>
                <Text style={{ color: error ? colors.error.base : colors.gray[500], fontSize: 16 }}>
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

      <DeleteConfirmPanel
        visible={!!pendingDeleteId}
        onClose={() => { setPendingDeleteId(null); setPendingDeleteName(''); }}
        onConfirm={confirmDelete}
        entityName={`"${pendingDeleteName}"`}
        entityType="l'utilisateur"
      />

      {/* Panel rendu via usePanelPortal - pas de rendu local */}
    </>
  );
}

