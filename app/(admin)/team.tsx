import { Alert, DimensionValue, ScrollView, useWindowDimensions, View } from "react-native";
import { Input ,Tabs, TabsContent, TabsList, TabsTrigger, Text, Badge, Table, TableHeader, TableRow, TableHead, TableBody, TableCell, Button, } from "~/components/ui";
import { SidePanel } from "~/components/SidePanel";
import React, { useEffect, useState } from "react";
import { Team } from "~/types/team.types";
import { TeamTypes } from "~/types/team-types.enum";
import { teamsApi } from "~/api/teams.api";
import { getTeamTypeText, getEnumValue } from "~/lib/utils";
import { Search, Euro } from "lucide-react-native";
import { InputCustom } from "~/components/ui/input_custom"
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from '~/components/ui/select';
import { TeamTable } from "~/components/admin/TeamTable"

export default function TeamPage() {
  // Table par defaut
  const [value, setValue] = useState(TeamTypes.ALL);
  // Informations Team
  const [firstName, setFirstName] = React.useState('');
  const [lastName, setLastName] = React.useState('');
  const [email, setEmail] = React.useState('');
  const [phone, setPhone] = React.useState<number | ''>('');
  const [loginId, setLoginId] = React.useState('');
  const [password, setPassword] = React.useState('');
  const defaultOption: Option = {
    value: '',
    label: 'Choisissez une rôle',
  }
  type Option = {
    value: string
    label: string
  }
  const [selectedOption, setSelectedOption] = useState<Option>(defaultOption)
  
  // Données Team
  const [teamAll, setTeamAll] = useState<Team[]>([]);
  const [teamManager, setTeamManager] = useState<Team[]>([]);
  const [teamServeur, setTeamServeur] = useState<Team[]>([]);
  const [teamCuisinier, setTeamCuisinier] = useState<Team[]>([]);
  
  
  // SidePanel
  const [title, setTitle] = useState('Filtrage') // Titre par défaut
  const [isEditing, setIsEditing] = useState(false) // Indique si on est en train de modifier un article
  const [currentItem, setCurrentItem] = useState<Team | null>(null) // Article en cours de modification

  // Taille columns
  const columnWidths = ['20%', '20%', '30%', '20%', '10%'] as DimensionValue[];

  useEffect(() => {
    loadData(TeamTypes.ALL);
    loadData(TeamTypes.MANAGER);
    loadData(TeamTypes.SERVEUR);
    loadData(TeamTypes.CUISTO);
  }, []);

  const loadData = async (teamTypes: TeamTypes) => {
    try {
      const filter = teamTypes === TeamTypes.ALL ? undefined : teamTypes;
      const data = await teamsApi.getTeams(filter as any);
      switch (teamTypes) {
        case TeamTypes.ALL:
          setTeamAll(data);
          break;
        case TeamTypes.MANAGER:
          setTeamManager(data);
          break;
        case TeamTypes.SERVEUR:
          setTeamServeur(data);
          break;
        case TeamTypes.CUISTO:
          setTeamCuisinier(data);
          break;
        default:
          break;
      }
    } catch (err) {
      console.error('Error in loadData:', err);
    }
  };

  const handleCreateArticle = () => {
    setTitle('Création d’un article')
    setIsEditing(false)
    setCurrentItem(null)
    setSelectedOption(defaultOption)
    setFirstName('')
    setLastName('')
    setPhone('')
    setEmail('')
    setLoginId('')
    setPassword('')
  }

  const handleEditArticle = (team: Team) => {
    setTitle('Modification d’un article')
    setIsEditing(true)
    setCurrentItem(team)
    const teamTypeKey = Object.keys(TeamTypes).find(
      key => TeamTypes[key as keyof typeof TeamTypes] === team.profil
    )
    if (teamTypeKey) {
      setSelectedOption({
        value: teamTypeKey, // Exemple : MANAGER
        label: team.profil, // Exemple : Manager
      })
    }
    setFirstName(team.firstName)
    setLastName(team.lastName)
    setPhone(team.phone)
    setEmail(team.email)
    setLoginId(team.loginId)
    setPassword(team.password)
  }

  const handleCancelEditorCreate = () => {
    setTitle('Filtrage')
    setIsEditing(false)
    setCurrentItem(null)
    setSelectedOption(defaultOption)
    setFirstName('')
    setLastName('')
    setPhone('')
    setEmail('')
    setLoginId('')
    setPassword('')
  }

  const submitTeamAction = async () => {
    const selectedValue = getEnumValue(TeamTypes, selectedOption.value as keyof typeof TeamTypes)
    const team: Team = {
      id: currentItem?.id,
      firstName,
      lastName,
      email,
      phone: phone as number,
      profil: selectedValue as TeamTypes,
      loginId: loginId,
      password: password
    }
    try {
      if (isEditing && team.id) {
        await teamsApi.updateItem(team?.id, team)
        setTeamAll(teamAll.map(d => d.id === team.id ? team : d))
      } else {
        const newItem = await teamsApi.createItem(team)
        setTeamAll([...teamAll, newItem])
      }
      handleCancelEditorCreate()
    } catch (err) {
      console.error('Error in submitArticleAction:', err)
    }
  }

  const submitTeamDelete = async (id: string) => {
    try {
      await teamsApi.deleteItem(id)
      setTeamAll(teamAll.filter(d => d.id !== id))
    } catch (err) {
      console.error('Error in deleteArticle:', err)
    }
  }

  const renderSidePanelContent = () => {
    const teamTypesArray = Object.entries(TeamTypes)
    .filter(([key]) => key !== 'ALL') // Exclut l'option "ALL"
    .map(([key, label]) => ({
      value: key,
      label,
    }));
    if (title === 'Filtrage') {
      return (
        <View style={{ padding: 16 }}>
          <InputCustom
            placeholder="Rechercher..."
            icone={Search}
            iconePosition="left"
            style={{ marginVertical: 10, borderColor: '#EAEAEB' }}
            iconeProps={{ strokeWidth: 3, color: '#696969' }}
            textStyle={{ fontWeight: '300', color: '#2A2E33' }}
            placeholderStyle={{ color: '#949699' }}
          />
        </View>
      )
    }
    if (title === 'Création d’un article' || title === 'Modification d’un article') {
      return (
        <>
          <Text
            style={{
              textTransform: 'uppercase',
              fontWeight: '700',
              fontSize: 14,
              color: '#2A2E33',
              backgroundColor: '#F1F1F1',
              padding: 5,
              paddingLeft: 16,
            }}
          >
            Informations
          </Text>
          <View style={{ flex: 1, padding: 15, display: 'flex', flexDirection:'column', justifyContent: 'space-between' }}>
            <View>
              <View className="flex flex-row gap-2">
                <Input
                  style={{ marginVertical: 8, borderColor: '#D7D7D7', borderRadius: 5, backgroundColor: '#FFFFFF', paddingVertical: 20, color: '#2A2E33' }}
                  placeholder='Prénom'
                  value={firstName}
                  onChangeText={(text: string) => setFirstName(text)}
                  aria-labelledby='inputLabel'
                  aria-errormessage='inputError'
                />
                <Input
                  style={{ marginVertical: 8, borderColor: '#D7D7D7', borderRadius: 5, backgroundColor: '#FFFFFF', paddingVertical: 20, color: '#2A2E33' }}
                  placeholder='Nom'
                  value={lastName}
                  onChangeText={(text: string) => setLastName(text)}
                  aria-labelledby='inputLabel'
                  aria-errormessage='inputError'
                />
              </View>
              <Select value={selectedOption} onValueChange={(value) => { if (value) { setSelectedOption(value) }
                }}>
                <SelectTrigger className='w-100'>
                  <SelectValue
                    className='text-foreground text-sm native:text-lg'
                    placeholder='Choisissez une catégorie'
                  />
                </SelectTrigger>
                <SelectContent className='w-100'>
                  <SelectGroup>
                    <SelectLabel>Rôles</SelectLabel>
                    {teamTypesArray.map(item => (
                      <SelectItem key={item.value} label={getTeamTypeText(item.label as TeamTypes)} value={item.value}>
                        {item.label}
                      </SelectItem>
                    ))}
                  </SelectGroup>
                </SelectContent>
              </Select>
              <Input
                style={{ marginVertical: 8, borderColor: '#D7D7D7', borderRadius: 5, backgroundColor: '#FFFFFF', paddingVertical: 20, color: '#2A2E33' }}
                placeholder='Email'
                value={email}
                onChangeText={(text: string) => setEmail(text)}
                aria-labelledby='inputLabel'
                aria-errormessage='inputError'
              />
              <input
                type="number"
                placeholder="0635504259"
                value={phone}
                onChange={(p) => setPhone(p.target.value === '' ? '' : parseFloat(p.target.value))}
                style={{
                  marginTop: '8px',
                  marginBottom: '8px',
                  padding: '8px',
                  border: '1px solid #D7D7D7',
                  borderRadius: '5px',
                  backgroundColor: '#FFFFFF',
                  fontWeight: '300',
                  color: '#2A2E33',
                }}
              />
              <Input
                style={{ marginVertical: 8, borderColor: '#D7D7D7', borderRadius: 5, backgroundColor: '#FFFFFF', paddingVertical: 20, color: '#2A2E33' }}
                placeholder='Login'
                value={loginId}
                onChangeText={(text: string) => setLoginId(text)}
                aria-labelledby='inputLabel'
                aria-errormessage='inputError'
              />
              <Input
                style={{ marginVertical: 8, borderColor: '#D7D7D7', borderRadius: 5, backgroundColor: '#FFFFFF', paddingVertical: 20, color: '#2A2E33' }}
                placeholder='Mot de passe'
                value={password}
                onChangeText={(text: string) => setPassword(text)}
                aria-labelledby='inputLabel'
                aria-errormessage='inputError'
              />
            </View>
            <View>
              <Button
                onPress={submitTeamAction}
                style={{ backgroundColor: '#2A2E33', borderRadius: 10, height: 45 }}>
                <Text style={{ color: '#FBFBFB', fontWeight: '400', fontSize: 16}}>
                  {isEditing ? 'Enregistrer les modifications' : 'Confirmer la création'}
                </Text>
              </Button>
              <Button onPress={handleCancelEditorCreate} style={{ backgroundColor: '#FBFBFB', borderRadius: 0, marginTop: 5 }}>
                <Text style={{ color: '#2A2E33', fontWeight: '300', fontSize: 16, textDecorationLine: 'underline'}}>Annuler</Text>
              </Button>
            </View>
            
          </View>
        
        </>
      )
    }
    return null
  }

  return (
    <View style={{ flex: 1, flexDirection: 'row' }}>
      <SidePanel title={title}>
        {renderSidePanelContent()}
      </SidePanel>
      <View style={{ flex: 1 }}>
        <Tabs
          value={value}
          onValueChange={(newValue: string) => setValue(newValue as TeamTypes)}
          className="w-full mx-auto flex-col gap-1.5"
        >
          <View className="flex flex-row justify-between w-full" style={{ backgroundColor: '#FBFBFB', height: 50 }}>
            <TabsList className="flex-row w-[500px] h-full">
              {Object.values(TeamTypes).map((type) => (
                <TabsTrigger key={type} value={type} className="flex-1 flex-row h-full">
                  <Text
                    className="pr-2"
                    style={{ color: value === type ? '#2A2E33' : '#A0A0A0' }}
                  >
                    {getTeamTypeText(type)}
                  </Text>
                  <Badge
                    style={{
                      backgroundColor: value === type ? '#2A2E33' : '#E0E0E0',
                      borderRadius: 5,
                      paddingHorizontal: 8,
                      paddingVertical: 4,
                    }}
                  >
                    <Text style={{ color: value === type ? '#FFFFFF' : '#A0A0A0' }}>
                      {
                        type === TeamTypes.ALL
                          ? teamAll.length
                          : type === TeamTypes.MANAGER
                          ? teamManager.length
                          : type === TeamTypes.SERVEUR
                          ? teamServeur.length
                          : teamCuisinier.length
                      }
                    </Text>
                  </Badge>
                </TabsTrigger>
              ))}
            </TabsList>
            <Button
              onPress={handleCreateArticle}
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
          <TabsContent value={TeamTypes.ALL}>
            <TeamTable data={teamAll} columnWidths={columnWidths} onRowPress={handleEditArticle} deleteItem={submitTeamDelete}/>
          </TabsContent>
          <TabsContent value={TeamTypes.MANAGER}>
            <TeamTable data={teamManager} columnWidths={columnWidths} onRowPress={handleEditArticle} deleteItem={submitTeamDelete}/>
          </TabsContent>
          <TabsContent value={TeamTypes.SERVEUR}>
            <TeamTable data={teamServeur} columnWidths={columnWidths} onRowPress={handleEditArticle} deleteItem={submitTeamDelete}/>
          </TabsContent>
          <TabsContent value={TeamTypes.CUISTO}>
            <TeamTable data={teamCuisinier} columnWidths={columnWidths} onRowPress={handleEditArticle} deleteItem={submitTeamDelete}/>
          </TabsContent>
        </Tabs>
      </View>
    </View>
  );
} 