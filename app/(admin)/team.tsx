import { Alert, useWindowDimensions, View } from "react-native";
import { TextInput ,Tabs, TabsContent, TabsList, TabsTrigger, Text, Button, ForkTable, } from "~/components/ui";
import { SidePanel } from "~/components/SidePanel";
import React, { useEffect, useState } from "react";
import { User, UserProfile } from "~/types/user.types";
import { userApiService } from "~/api/user.api";
import { getEnumValue, getUserProfileText } from "~/lib/utils";
import { Select } from '~/components/ui/select';
import { FilterBar } from '~/components/filters/Filter';
import { useFilter } from "~/hooks/useFilter";
import { FilterConfig } from "~/hooks/useFilter/types";

export default function TeamPage() {
  const [isPanelCollapsed, setIsPanelCollapsed] = useState(false);
  const [activeTab, setActiveTab] = useState<UserProfile | 'all'>('all');
  const [isLoading, setIsLoading] = useState(true);
  const [title, setTitle] = useState('Filtrage');
  const [isEditing, setIsEditing] = useState(false);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    loginId: '',
    password: '',
  });
  
  const defaultOption = {
    value: '',
    label: 'Choisissez une rôle',
  };
  
  const handleBack = () => {
    setTitle('Filtrage');
  };

  const [selectedOption, setSelectedOption] = useState(defaultOption);

  const filterUser: FilterConfig<User>[] = [
    { 
      field: 'firstName', 
      type: 'text' as const, 
      label: 'Prénom',
      operator: 'like' as const,
      show: true
    },
    { 
      field: 'lastName', 
      type: 'text' as const, 
      label: 'Nom',
      operator: 'like' as const,
      show: true
    },
    { 
      field: 'email', 
      type: 'text' as const, 
      label: 'Email',
      operator: 'like' as const,
      show: true
    },
    { 
      field: 'phone', 
      type: 'text' as const, 
      label: 'Numéro de téléphone',
      operator: 'like' as const,
      show: true
    },
    {
      field: 'profil',
      type: 'select',
      label: 'Profile',
      operator: '=' as const,
      show: false
    }
  ];
  // filtre
  const { updateFilter, loading, clearFilters, queryParams, error } = useFilter<User>({
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
    if (isPanelCollapsed) {
      setIsPanelCollapsed(false);
    }
    setTitle('Création d\'un utilisateur');
    setIsEditing(false);
    setCurrentUser(null);
    setSelectedOption(defaultOption);
    setFormData({
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
      loginId: '',
      password: '',
    });
  };

  useEffect(() => {
    if (error) {
      Alert.alert('Error', 'Failed to load filtered data');
    }
  }, [error]);

  const handleEditUser = (id: string) => {
    if (isPanelCollapsed) {
      setIsPanelCollapsed(false);
    }
    setTitle('Modification d\'un utilisateur');
    const user = users.find(user => user.id === id);
    if (!user) return;
    
    setIsEditing(true);
    setCurrentUser(user);
    
    const userTypeKey = Object.keys(UserProfile).find(
      key => UserProfile[key as keyof typeof UserProfile] === user.profil
    );
    
    if (userTypeKey) {
      setSelectedOption({
        value: userTypeKey,
        label: user.profil,
      });
    }
    
    setFormData({
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      phone: user.phone,
      loginId: user.loginId,
      password: user.password,
    });
  };

  const handleCancelEditorCreate = () => {
    setTitle('Filtrage');
    setIsEditing(false);
    setCurrentUser(null);
    setSelectedOption(defaultOption);
    setFormData({
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
      loginId: '',
      password: '',
    });
  };
  const submitUserAction = async () => {
    if (!currentUser) return
    const selectedValue = getEnumValue(UserProfile, selectedOption.value as keyof typeof UserProfile);
    const user: User = {
      id: currentUser.id,
      accountId: currentUser.accountId,
      profil: selectedValue as UserProfile,
      ...formData,
    };
  
    try {
      if (isEditing && user.id) {
        await userApiService.update(user.id, user);
        updateFilter('profil', queryParams.filters?.[0]?.value || '', queryParams.filters?.[0]?.operator);
      } else {
        await userApiService.create(user);
        updateFilter('profil', queryParams.filters?.[0]?.value || '', queryParams.filters?.[0]?.operator);
      }
      handleCancelEditorCreate();
    } catch (err) {
      console.error('Error in submitUserAction:', err);
      Alert.alert('Error', 'Failed to save user');
    }
  };
  
  const submitTeamDelete = async (id: string) => {
    try {
      await userApiService.delete(id);
      updateFilter('profil', queryParams.filters?.[0]?.value || '', queryParams.filters?.[0]?.operator);
    } catch (err) {
      console.error('Error in deleteUser:', err);
      Alert.alert('Error', 'Failed to delete user');
    }
  };

  const renderSidePanelContent = () => {
    const userTypesArray = Object.entries(UserProfile)
      .map(([key, label]) => ({
        value: key,
        label,
      }));
    if (title === 'Filtrage') {
      return (
        <View style={{ padding: 15 }}>
          <FilterBar
            config={filterUser}
            onUpdateFilter={updateFilter}
            onClearFilters={() => {
              setActiveTab('all');
              clearFilters()
            }}
            activeFilters={queryParams.filters || []}
          />
        </View>
      )
    }
    if (title.includes('utilisateur')) {
      return (
        <>
          <Text style={{
            textTransform: 'uppercase',
            fontWeight: '700',
            fontSize: 14,
            color: '#2A2E33',
            backgroundColor: '#F1F1F1',
            padding: 5,
            paddingLeft: 16,
          }}>
            Informations
          </Text>
          <View style={{ flex: 1, padding: 15, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
            <View>
              <Select
                style={{ marginVertical: 8 }}
                choices={userTypesArray}
                selectedValue={selectedOption}
                onValueChange={(value) => { if (value) setSelectedOption(value) }}
              />
              {['firstName', 'lastName', 'email', 'phone', 'loginId', 'password'].map((field) => (
                <TextInput
                  key={field}
                  value={formData[field as keyof typeof formData]}
                  onChangeText={(text: string) => setFormData(prev => ({ ...prev, [field]: text }))}
                  placeholder={field.charAt(0).toUpperCase() + field.slice(1)}
                  style={{ borderWidth: 1, borderColor: '#D7D7D7', borderRadius: 5, backgroundColor: '#FFFFFF', color: '#2A2E33', marginVertical: 8, padding: 10 }}
                />
              ))}
            </View>
            <View>
              <Button
                onPress={submitUserAction}
                style={{ backgroundColor: '#2A2E33', borderRadius: 10, height: 45 }}
              >
                <Text style={{ color: '#FBFBFB', fontWeight: '400', fontSize: 16}}>
                  {isEditing ? 'Enregistrer les modifications' : 'Confirmer la création'}
                </Text>
              </Button>
              <Button 
                onPress={handleCancelEditorCreate} 
                style={{ backgroundColor: '#FBFBFB', borderRadius: 0, marginTop: 5 }}
              >
                <Text style={{ color: '#2A2E33', fontWeight: '300', fontSize: 16, textDecorationLine: 'underline'}}>
                  Annuler
                </Text>
              </Button>
            </View>
          </View>
        </>
      );
    }
  }

  const { width } = useWindowDimensions()

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
  ]

  return (
    <View style={{ flex: 1, flexDirection: 'row' }}>
      <SidePanel title={title} width={width / 4} onBack={title !== 'Filtrage' ? handleBack : undefined} isCollapsed={isPanelCollapsed} onCollapsedChange={setIsPanelCollapsed}>
        {renderSidePanelContent()}
      </SidePanel>
      <View style={{ flex: 1 }}>
        <Tabs
          style={{ flex: 1, backgroundColor: '#FFFFFF' }}
          value={activeTab}
          onValueChange={(newValue: string) => {
            setActiveTab(newValue as UserProfile | 'all');
            if (newValue === 'all') {
              clearFilters();
            } else {
              console.log('newValue', newValue)
              updateFilter('profil', newValue, '=');
            }
          }}
          className="w-full mx-auto flex-col gap-1.5"
        >
          <View className="flex flex-row justify-between w-full" style={{ backgroundColor: '#FBFBFB', height: 50 }}>
            <TabsList className="flex-row w-[500px] h-full">
                  <TabsTrigger key="all" value="all" className="flex-1 flex-row h-full">
                    <Text
                      style={{ color: activeTab === 'all' ? '#2A2E33' : '#A0A0A0' }}
                    >
                      Tous
                    </Text>
                  </TabsTrigger>
              {Object.values(UserProfile)
                .filter(type => !['superadmin', 'admin'].includes(type))
                .map((type) => (
                  <TabsTrigger key={type} value={type} className="flex-1 flex-row h-full">
                    <Text
                      style={{ color: activeTab === type ? '#2A2E33' : '#A0A0A0' }}
                    >
                      {getUserProfileText(type)}
                    </Text>
                  </TabsTrigger>
                ))}
            </TabsList>
            <Button
              onPress={handleCreateUser}
              className="w-[200px] h-[50px] flex items-center justify-center"
              style={{ backgroundColor: '#2A2E33', borderRadius: 0, height: 50 }}
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
                Créer un utilisateur
              </Text>
            </Button>
          </View>
          <TabsContent style={{ flex: 1 }} value={activeTab}>
            <ForkTable 
              data={users}
              columns={teamTableColumns}
              onRowPress={handleEditUser}
              onRowDelete={submitTeamDelete}
            />
          </TabsContent>
        </Tabs>
      </View>
    </View>
  );
} 