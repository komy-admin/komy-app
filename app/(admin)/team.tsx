import { Alert, DimensionValue, ScrollView, useWindowDimensions, View } from "react-native";
import { Input ,Tabs, TabsContent, TabsList, TabsTrigger, Text, Button, ForkTable, } from "~/components/ui";
import { SidePanel } from "~/components/SidePanel";
import React, { useEffect, useState } from "react";
import { Team, filterTeam } from "~/types/team.types";
import { TeamTypes } from "~/types/team.enum";
import { TeamApiService, teamApiService } from "~/api/team.api";
import { getTeamTypeText, getEnumValue } from "~/lib/utils";
import { Search, Euro } from "lucide-react-native";
import { InputCustom } from "~/components/ui/input_custom"
import { ForkSelect } from '~/components/ui/select';
import { FilterBar } from '~/components/filters/Filter';
import { useFilter } from '~/components/filters/useFilter';
import { TextInput } from 'react-native';

export default function TeamPage() {
  const [activeTab, setActiveTab] = useState<TeamTypes>(TeamTypes.ALL);
  const [teams, setTeams] = useState<Team[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  // Table par defaut
  const [value, setValue] = useState(TeamTypes.ALL);
  // Informations Team
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
  
  const [selectedOption, setSelectedOption] = useState(defaultOption);
  const [title, setTitle] = useState('Filtrage');
  const [isEditing, setIsEditing] = useState(false);
  const [currentItem, setCurrentItem] = useState<Team | null>(null);

  useEffect(() => {
    const loadTeams = async () => {
      try {
        setIsLoading(true);
        const { data } = await teamApiService.getAll();
        setTeams(data);
      } catch (err) {
        console.error('Error loading teams:', err);
        Alert.alert('Error', 'Failed to load teams');
      } finally {
        setIsLoading(false);
      }
    };

    loadTeams();
  }, []);

  // filtre
  const {
    data,
    loading,
    error,
    updateFilter,
    clearFilters,
    changePage,
    queryParams
  } = useFilter({ config: filterTeam, service: teamApiService as TeamApiService });

  useEffect(() => { 
    if (data) {
      setTeams(data.data) 
    }
  }, [data]);

  const handleCreateTeam = () => {
    setTitle('Création d\'un utilisateur');
    setIsEditing(false);
    setCurrentItem(null);
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

  const handleEditTeam = (id: string) => {
    setTitle('Modification d\'un utilisateur');
    const team = teams.find(team => team.id === id)
    if (!team) return
    setIsEditing(true);
    setCurrentItem(team);
    const teamTypeKey = Object.keys(TeamTypes).find(
      key => TeamTypes[key as keyof typeof TeamTypes] === team.profil
    );
    
    if (teamTypeKey) {
      setSelectedOption({
        value: teamTypeKey,
        label: team.profil,
      });
    }
    
    setFormData({
      firstName: team.firstName,
      lastName: team.lastName,
      email: team.email,
      phone: team.phone,
      loginId: team.loginId,
      password: team.password,
    });
  };

  const handleCancelEditorCreate = () => {
    setTitle('Filtrage');
    setIsEditing(false);
    setCurrentItem(null);
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
  const submitTeamAction = async () => {
    const selectedValue = getEnumValue(TeamTypes, selectedOption.value as keyof typeof TeamTypes);
    const team: Team = {
      id: currentItem?.id,
      profil: selectedValue as TeamTypes,
      ...formData,
    };

    try {
      if (isEditing && team.id) {
        await teamApiService.update(team.id, team);
        setTeams(teams.map(t => t.id === team.id ? team : t));
      } else {
        const newItem = await teamApiService.create(team);
        setTeams([...teams, newItem]);
      }
      handleCancelEditorCreate();
    } catch (err) {
      console.error('Error in submitTeamAction:', err);
      Alert.alert('Error', 'Failed to save team');
    }
  };

  const submitTeamDelete = async (id: string) => {
    try {
      await teamApiService.delete(id);
      setTeams(teams.filter(t => t.id !== id));
    } catch (err) {
      console.error('Error in deleteTeam:', err);
      Alert.alert('Error', 'Failed to delete team');
    }
  };

  const renderSidePanelContent = () => {
    const teamTypesArray = Object.entries(TeamTypes)
    .filter(([key]) => key !== 'ALL')
    .map(([key, label]) => ({
      value: key,
      label,
    }));
    if (title === 'Filtrage') {
      return (
        <View style={{ padding: 15 }}>
          <FilterBar
            config={filterTeam}
            onUpdateFilter={updateFilter}
            onClearFilters={clearFilters}
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
            marginVertical: 4,
            padding: 5,
            paddingLeft: 16,
          }}>
            Informations
          </Text>
          <View style={{ flex: 1, padding: 15, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
            <View>
              <View className="flex flex-row gap-4">
                <TextInput
                  value={formData.firstName}
                  onChangeText={(text: string) => setFormData(prev => ({ ...prev, firstName: text }))}
                  placeholder='Prénom'
                  className="flex-1"
                  style={{ borderWidth: 1, borderColor: '#D7D7D7', borderRadius: 5, backgroundColor: '#FFFFFF', color: '#2A2E33', marginVertical: 8, padding: 10 }}
                />
                <TextInput
                  value={formData.lastName}
                  onChangeText={(text: string) => setFormData(prev => ({ ...prev, lastName: text }))}
                  placeholder='Nom'
                  className="flex-1"
                  style={{ borderWidth: 1, borderColor: '#D7D7D7', borderRadius: 5, backgroundColor: '#FFFFFF', color: '#2A2E33', marginVertical: 8, padding: 10 }}
                />
              </View>
              <ForkSelect
                style={{ marginVertical: 8 }}
                choices={teamTypesArray}
                selectedValue={selectedOption}
                onValueChange={(value) => { if (value) setSelectedOption(value) }}
              />
              {['email', 'phone', 'loginId', 'password'].map((field) => (
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
                onPress={submitTeamAction}
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
      <SidePanel title={title} width={width / 5}>
        {renderSidePanelContent()}
      </SidePanel>
      <View style={{ flex: 1 }}>
        <Tabs
          style={{ flex: 1 }}
          value={activeTab}
          onValueChange={(newValue: string) => {
             // !!!!
              if (newValue !== 'Tous') updateFilter('profil', newValue)
              else updateFilter('profil', '')
              setActiveTab(newValue as TeamTypes)
            }
          }
          className="w-full mx-auto flex-col gap-1.5"
        >
          <View className="flex flex-row justify-between w-full" style={{ backgroundColor: '#FBFBFB', height: 50 }}>
            <TabsList className="flex-row w-[500px] h-full">
              {Object.values(TeamTypes)
                .filter(type => !['superadmin', 'admin'].includes(type))
                .map((type) => (
                  <TabsTrigger key={type} value={type} className="flex-1 flex-row h-full">
                    <Text
                      className="pr-2"
                      style={{ color: activeTab === type ? '#2A2E33' : '#A0A0A0' }}
                    >
                      {getTeamTypeText(type)}
                    </Text>
                    {/* <Badge
                      style={{
                        backgroundColor: activeTab === type ? '#2A2E33' : '#E0E0E0',
                        borderRadius: 5,
                        paddingHorizontal: 8,
                        paddingVertical: 4,
                      }}
                    >
                      <Text style={{ color: activeTab === type ? '#FFFFFF' : '#A0A0A0' }}>
                      </Text>
                    </Badge> */}
                  </TabsTrigger>
                ))}
            </TabsList>
            <Button
              onPress={handleCreateTeam}
              className="w-[200px] h-[50px] flex items-center justify-center"
              style={{ backgroundColor: '#2A2E33', borderRadius: 0 }}
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
              data={teams}
              columns={teamTableColumns}
              onRowPress={handleEditTeam}
              onRowDelete={submitTeamDelete}
            />
          </TabsContent>
        </Tabs>
      </View>
    </View>
  );
} 