import { View, ScrollView, useWindowDimensions, Text, StyleSheet, Share, Clipboard, Platform } from "react-native";
import { Tabs, TabsContent, TabsList, TabsTrigger, Button, ForkTable } from "~/components/ui";
import { SidePanel } from "~/components/SidePanel";
import { useState, useMemo, useEffect, useRef } from "react";
import { User, UserProfile } from "~/types/user.types";
import { getUserProfileText } from "~/lib/utils";
import { AdminFormView, useAdminFormView, AdminFormViewRef } from "~/components/admin/AdminFormView";
import { FormHeader } from '~/components/admin/FormHeader';
import { DeleteConfirmationModal } from "~/components/ui/DeleteConfirmationModal";
import { CustomModal } from "~/components/CustomModal";
import { TeamForm } from "~/components/form/TeamForm";
import { QuickTeamForm } from "~/components/form/QuickTeamForm";
import { useToast } from '~/components/ToastProvider';
import { QRCode } from "~/components/ui/QRCode";
import { CreditCard as Edit2, QrCode, Trash, Share2, Copy } from 'lucide-react-native';
import { ActionItem } from '~/components/ActionMenu';
import { useSelector } from 'react-redux';
import { RootState } from '~/store';
import { useUsers } from '~/hooks/useRestaurant';
import { TeamFilters, TeamFilterState } from '~/components/filters/TeamFilters';
import { filterTeamUsers, createEmptyTeamFilters } from '~/utils/teamFilters';
import { useRouter } from 'expo-router';
import { KeyboardSafeFormView } from '~/components/Keyboard';

export default function TeamPage() {
  const router = useRouter();
  const accountConfig = useSelector((state: RootState) => state.session.accountConfig);

  // Refs pour accéder à handleSave depuis les boutons fixes
  const quickFormRef = useRef<AdminFormViewRef>(null);
  const fullFormRef = useRef<AdminFormViewRef>(null);
  const editFormRef = useRef<AdminFormViewRef>(null);

  // Rediriger si la vue est désactivée
  useEffect(() => {
    if (accountConfig && accountConfig.teamEnabled === false) {
      router.replace('/(admin)/service');
    }
  }, [accountConfig, router]);
  const [isPanelCollapsed, setIsPanelCollapsed] = useState(true);
  const [activeTab, setActiveTab] = useState<UserProfile | 'all'>('all');
  const [teamFilters, setTeamFilters] = useState<TeamFilterState>(createEmptyTeamFilters());
  const [qrModalVisible, setQrModalVisible] = useState(false);
  const [selectedUserForQr, setSelectedUserForQr] = useState<User | null>(null);
  const [creationMode, setCreationMode] = useState<'quick' | 'full'>('quick');
  const teamFormView = useAdminFormView();
  const [qrCodeToken, setQrCodeToken] = useState<string | null>(null);
  const [qrMagicLink, setQrMagicLink] = useState<string | null>(null);
  const [qrLoading, setQrLoading] = useState(false);
  const [copiedQrLink, setCopiedQrLink] = useState(false);
  const [isDeleteModalVisible, setIsDeleteModalVisible] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [userToDelete, setUserToDelete] = useState<User | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const { showToast } = useToast();

  // Vérifier les droits d'accès aux utilisateurs
  const { user } = useSelector((state: RootState) => state.session);
  const canManageUsers = user?.profil && ['superadmin', 'admin', 'manager'].includes(user.profil);
  const canModifyUsers = user?.profil && ['superadmin', 'admin'].includes(user.profil);
  const isManager = user?.profil === 'manager';


  // Utilisation des hooks Redux (seulement si autorisé)
  const { users, loading, error, createUser, createQuickUser, updateUser, deleteUser, getOrGenerateQrToken, revokeQrToken, loadUsers, getUsersByProfile } = useUsers();


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
  const handleFiltersChange = (filters: TeamFilterState) => {
    setTeamFilters(filters);
  };

  const handleClearFilters = () => {
    setTeamFilters(createEmptyTeamFilters());
    setActiveTab('all');
  };

  const handleCreateUser = () => {
    // Les managers ne peuvent pas créer d'utilisateurs
    if (isManager) return;
    setSelectedUser(null);
    setCreationMode('quick'); // Default to quick mode
    teamFormView.openCreate();
  };

  const handleQuickCreateSubmit = async (getFormData: () => any) => {
    try {
      const formResult = getFormData();
      if (!formResult.isValid) {
        return false;
      }

      const { profil, displayName } = formResult.data;
      const response = await createQuickUser(profil, displayName);
      showToast('Utilisateur créé avec succès', 'success');
      handleCloseModal();
      return true;
    } catch (error: any) {
      const errorMessage = error?.message || 'Erreur lors de la création de l\'utilisateur';
      showToast(errorMessage, 'error');
      return false;
    }
  };

  const handleEditUser = (id: string) => {
    // Les managers ne peuvent pas modifier les utilisateurs
    if (isManager) return;
    const user = users.find(user => user.id === id);
    if (!user) return;
    setSelectedUser(user);
    teamFormView.openEdit();
  };

  const handleCloseModal = () => {
    teamFormView.close();
    setSelectedUser(null);
    setCreationMode('quick');
  };

  const handleSaveUser = async (getFormData: () => any) => {
    try {
      const formResult = getFormData();
      if (!formResult.isValid) {
        return false;
      }

      const user = formResult.data;
      if (user.id) {
        await updateUser(user.id, user);
        showToast('Utilisateur modifié avec succès', 'success');
      } else {
        await createUser(user);
        showToast('Utilisateur créé avec succès', 'success');
      }
      handleCloseModal();
      return true;
    } catch (err: any) {
      console.error('Error saving user:', err);

      // Afficher le message d'erreur spécifique si disponible
      const errorMessage = err?.message || 'Erreur lors de la sauvegarde de l\'utilisateur';
      showToast(errorMessage, 'error');
      return false;
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

  const handleShowQrCode = async (user: User) => {
    setSelectedUserForQr(user);
    setQrModalVisible(true);
    setQrCodeToken(null);
    setQrMagicLink(null);
    setCopiedQrLink(false);
    setQrLoading(true);

    try {
      // Récupère le QR existant ou en crée un nouveau automatiquement
      const res = await getOrGenerateQrToken(user.id);
      setQrCodeToken(res.qrData.token);
      // Generate magic link from token
      setQrMagicLink(`forkit://auth/qr-login?token=${res.qrData.token}`);
    } catch (e: any) {
      showToast("Erreur lors de la récupération du QR code", 'error');
      setQrModalVisible(false);
    } finally {
      setQrLoading(false);
    }
  };

  const handleShareQr = async () => {
    if (!qrMagicLink || !selectedUserForQr) return;

    try {
      await Share.share({
        message: `Lien de connexion Fork'it pour ${selectedUserForQr.firstName} ${selectedUserForQr.lastName}: ${qrMagicLink}`,
        title: 'Connexion Fork\'it',
      });
    } catch (error) {
      console.error('Error sharing QR link:', error);
    }
  };

  const handleCopyQrLink = async () => {
    if (!qrMagicLink) return;

    if (Platform.OS === 'web') {
      await navigator.clipboard.writeText(qrMagicLink);
    } else {
      Clipboard.setString(qrMagicLink);
    }
    setCopiedQrLink(true);
    showToast('Lien copié !', 'success');
    setTimeout(() => setCopiedQrLink(false), 2000);
  };

  const handleRevokeQr = async () => {
    if (!selectedUserForQr) return;

    try {
      setQrLoading(true);
      setCopiedQrLink(false);

      // Révoquer le QR token sans en générer un nouveau
      await revokeQrToken(selectedUserForQr.id);
      setQrCodeToken(null);
      setQrMagicLink(null);
      setQrModalVisible(false);

      showToast('QR code révoqué avec succès', 'success');
    } catch (error) {
      console.error('Erreur révocation QR:', error);
      showToast('Erreur lors de la révocation du QR code', 'error');
    } finally {
      setQrLoading(false);
    }
  };

  const getUserActions = (user: User): ActionItem[] => {
    const actions: ActionItem[] = [];

    // Seuls admin et superadmin peuvent modifier
    if (canModifyUsers) {
      actions.push({
        label: 'Modifier',
        icon: <Edit2 size={16} color="#4F46E5" />,
        onPress: () => handleEditUser(user.id ? user.id : '')
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
        onPress: () => handleDeleteUser(user.id ? user.id : '')
      });
    }

    return actions;
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

  // Si la modal est visible, afficher SEULEMENT AdminFormView (pas de position absolute)
  if (canModifyUsers && teamFormView.isVisible) {
    // Déterminer quelle ref utiliser pour les boutons
    const currentFormRef = teamFormView.mode === 'create'
      ? (creationMode === 'quick' ? quickFormRef : fullFormRef)
      : editFormRef;

    return (
      <View style={{ flex: 1, backgroundColor: '#F9FAFB' }}>
        {/* FormHeader - FIXE en haut */}
        <FormHeader
          title={
            teamFormView.mode === 'edit'
              ? `Modification de "${selectedUser?.firstName} ${selectedUser?.lastName}"`
              : "Créer un utilisateur"
          }
          onBack={teamFormView.close}
        />

        {/* KeyboardAvoidingView SEULEMENT autour du contenu scrollable */}
        <KeyboardSafeFormView
          role="ADMIN"
          showToolbar={false}
          behavior="padding"
          keyboardVerticalOffset={150}
          style={{ flex: 1 }}
        >
          {teamFormView.mode === 'create' ? (
            // Create mode with tabs
            <Tabs
              value={creationMode}
              onValueChange={(value) => setCreationMode(value as 'quick' | 'full')}
              style={{ flex: 1 }}
            >
              {/* Tabs Navigation - FIXE */}
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

              {/* Contenu des tabs - SCROLLABLE */}
              <TabsContent value="quick" style={{ flex: 1 }}>
                <ScrollView
                  style={{ flex: 1 }}
                  contentContainerStyle={{ flexGrow: 1, paddingBottom: 20 }}
                  keyboardShouldPersistTaps="handled"
                  showsVerticalScrollIndicator={false}
                >
                  <AdminFormView
                    ref={quickFormRef}
                    visible={true}
                    mode={teamFormView.mode}
                    onClose={teamFormView.close}
                    onCancel={teamFormView.close}
                    onSave={handleQuickCreateSubmit}
                    disableGlobalScroll={true}
                    hideHeaderAndActions={true}
                  >
                    <QuickTeamForm
                      activeTab={activeTab}
                      onQuickCreate={createQuickUser}
                    />
                  </AdminFormView>
                </ScrollView>
              </TabsContent>

              <TabsContent value="full" style={{ flex: 1 }}>
                <ScrollView
                  style={{ flex: 1 }}
                  contentContainerStyle={{ flexGrow: 1, paddingBottom: 20 }}
                  keyboardShouldPersistTaps="handled"
                  showsVerticalScrollIndicator={false}
                >
                  <AdminFormView
                    ref={fullFormRef}
                    visible={true}
                    mode={teamFormView.mode}
                    onClose={teamFormView.close}
                    onCancel={teamFormView.close}
                    onSave={handleSaveUser}
                    disableGlobalScroll={true}
                    hideHeaderAndActions={true}
                  >
                    <TeamForm
                      user={selectedUser}
                      activeTab={activeTab}
                    />
                  </AdminFormView>
                </ScrollView>
              </TabsContent>
            </Tabs>
          ) : (
            // Edit mode - SCROLLABLE
            <ScrollView
              style={{ flex: 1 }}
              contentContainerStyle={{ flexGrow: 1, paddingBottom: 20 }}
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
            >
              <AdminFormView
                ref={editFormRef}
                visible={true}
                mode={teamFormView.mode}
                onClose={teamFormView.close}
                onCancel={teamFormView.close}
                onSave={handleSaveUser}
                disableGlobalScroll={true}
                hideHeaderAndActions={true}
              >
                <TeamForm
                  user={selectedUser}
                  activeTab={activeTab}
                />
              </AdminFormView>
            </ScrollView>
          )}
        </KeyboardSafeFormView>

        {/* Boutons FIXES en bas - HORS KeyboardAvoidingView (recouverts par keyboard) */}
        <View style={styles.footerActions}>
          <Button
            onPress={teamFormView.close}
            style={styles.cancelButton}
          >
            <Text style={styles.cancelButtonText}>Annuler</Text>
          </Button>
          <Button
            onPress={() => currentFormRef.current?.handleSave()}
            style={styles.saveButton}
            disabled={currentFormRef.current?.isSaving}
          >
            <Text style={styles.saveButtonText}>
              {currentFormRef.current?.isSaving
                ? 'Sauvegarde...'
                : teamFormView.mode === 'create' ? 'Confirmer la création' : 'Enregistrer les modifications'}
            </Text>
          </Button>
        </View>
      </View>
    );
  }

  return (
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
                columns={teamTableColumns}
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

      <CustomModal
        isVisible={qrModalVisible}
        onClose={() => {
          setQrModalVisible(false);
          setSelectedUserForQr(null);
          setQrCodeToken(null);
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
              {!qrLoading && qrCodeToken && (
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
                <Share2 size={16} color="#2A2E33" />
                <Text style={styles.shareButtonText}>Partager</Text>
              </Button>

              <Button
                onPress={handleCopyQrLink}
                style={[styles.shareButton, copiedQrLink && styles.copiedButton]}
                variant="outline"
                disabled={!qrCodeToken || qrLoading}
              >
                <Copy size={16} color={copiedQrLink ? "#10B981" : "#2A2E33"} />
                <Text style={[styles.shareButtonText, copiedQrLink && styles.copiedButtonText]}>
                  {copiedQrLink ? 'Copié !' : 'Copier lien'}
                </Text>
              </Button>

              <Button
                onPress={handleRevokeQr}
                style={styles.regenerateButton}
                variant="outline"
                disabled={!qrCodeToken || qrLoading}
              >
                <Text style={styles.regenerateButtonText}>Révoquer</Text>
              </Button>
            </View>
          </View>
        )}
      </CustomModal>
    </View>
  );
}

const styles = StyleSheet.create({
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
    gap: 10,
  },
  shareButton: {
    flex: 1,
    paddingVertical: 12,
    borderColor: '#2A2E33',
    borderWidth: 1,
    borderRadius: 6,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  shareButtonText: {
    color: '#2A2E33',
    fontSize: 13,
    fontWeight: '500',
  },
  copiedButton: {
    borderColor: '#10B981',
  },
  copiedButtonText: {
    color: '#10B981',
  },
  regenerateButton: {
    flex: 1,
    paddingVertical: 12,
    borderColor: '#FF4444',
    borderWidth: 1,
    borderRadius: 6,
  },
  regenerateButtonText: {
    color: '#FF4444',
    fontSize: 13,
    fontWeight: '500',
  },

  // Tabs styles
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

  // Footer actions (boutons fixes en bas)
  footerActions: {
    flexDirection: 'row',
    gap: 16,
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    backgroundColor: '#F9FAFB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 8,
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
  },
  cancelButtonText: {
    color: '#6B7280',
    fontWeight: '700',
    fontSize: 16,
    letterSpacing: 0.5,
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
    elevation: 4,
  },
  saveButtonText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 16,
    letterSpacing: 0.5,
  },
});