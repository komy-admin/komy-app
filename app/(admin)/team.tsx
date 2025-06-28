import { View, ScrollView, useWindowDimensions, Text, StyleSheet, Platform } from "react-native";
import { Tabs, TabsContent, TabsList, TabsTrigger, Button, ForkTable } from "~/components/ui";
import { SidePanel } from "~/components/SidePanel";
import React, { useEffect, useState } from "react";
import { User, UserProfile } from "~/types/user.types";
import { userApiService } from "~/api/user.api";
import { getUserProfileText } from "~/lib/utils";
import { FilterBar } from '~/components/filters/Filter';
import { useFilter } from "~/hooks/useFilter";
import { FilterConfig } from "~/hooks/useFilter/types";
import { CustomModal } from "~/components/CustomModal";
import { TeamForm } from "~/components/form/TeamForm";
import { useToast } from '~/components/ToastProvider';

export default function TeamPage() {
  const [isPanelCollapsed, setIsPanelCollapsed] = useState(true);
  const [activeTab, setActiveTab] = useState<UserProfile | 'all'>('all');
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [isDeleteModalVisible, setIsDeleteModalVisible] = useState(false);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [userToDelete, setUserToDelete] = useState<User | null>(null);
  const { showToast } = useToast();
  
  const filterUser: FilterConfig<User>[] = [
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
    {
      field: 'profil',
      type: 'select',
      label: 'Profile',
      operator: '=',
      show: false
    }
  ];

  const { updateFilter, loading, clearFilters, queryParams } = useFilter<User>({
    config: filterUser,
    service: userApiService,
    onDataChange: (response) => setUsers(response.data)
  });

  useEffect(() => {
    if (users) {
      setIsLoading(false);
    }
  }, [users]);

  const handleCreateUser = () => {
    setCurrentUser(null);
    setIsModalVisible(true);
  };

  const handleEditUser = (id: string) => {
    const user = users.find(user => user.id === id);
    if (!user) return;
    setCurrentUser(user);
    setIsModalVisible(true);
  };

  const handleCloseModal = () => {
    setIsModalVisible(false);
    setCurrentUser(null);
  };

  const handleSaveUser = async (user: User) => {
    try {
      if (user.id) {
        await userApiService.update(user.id, user);
        setUsers(prevUsers => 
          prevUsers.map(u => u.id === user.id ? user : u)
        );
        showToast('Utilisateur modifié avec succès', 'success');
      } else {
        const newUser = await userApiService.create(user);
        if (activeTab === 'all' || activeTab === user.profil) {
          setUsers(prevUsers => [...prevUsers, newUser]);
        }
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
      await userApiService.delete(userToDelete.id);
      setUsers(users.filter(user => user.id !== userToDelete.id));
      showToast('Utilisateur supprimé avec succès', 'success');
    } catch (err) {
      console.error('Error deleting user:', err);
      showToast('Erreur lors de la suppression de l\'utilisateur', 'error');
    } finally {
      setIsDeleteModalVisible(false);
      setUserToDelete(null);
    }
  };

  const { width, height } = useWindowDimensions();

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
            config={filterUser}
            onUpdateFilter={updateFilter}
            onClearFilters={() => {
              setActiveTab('all');
              clearFilters();
            }}
            activeFilters={queryParams.filters || []}
          />
        </View>
      </SidePanel>
      
      <View style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        <Tabs
          style={{ flex: 1, backgroundColor: '#FFFFFF' }}
          value={activeTab}
          onValueChange={(newValue: string) => {
            const newTab = newValue as UserProfile | 'all';
            if (newTab !== 'all') {
              updateFilter('profil', newTab, '=');
            } else {
              updateFilter('profil', '', '=');
            }
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
          </View>

          <TabsContent style={{ flex: 1 }} value={activeTab}>
            <ForkTable 
              data={users}
              columns={teamTableColumns}
              onRowPress={handleEditUser}
              onRowDelete={handleDeleteUser}
            />
          </TabsContent>
        </Tabs>
      </View>

      <CustomModal
        isVisible={isModalVisible}
        onClose={handleCloseModal}
        width={600}
        height={675}
        title={currentUser ? "Modifier l'utilisateur" : "Créer un utilisateur"}
      >
        <TeamForm
          user={currentUser}
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
});