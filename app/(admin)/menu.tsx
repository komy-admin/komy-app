import { Alert, DimensionValue, ScrollView, useWindowDimensions, View } from "react-native";
import { Input, Tabs, TabsContent, TabsList, TabsTrigger, Text, Badge, Table, TableHeader, TableRow, TableHead, TableBody, TableCell, Button, } from "~/components/ui";
import { SidePanel } from "~/components/SidePanel";
import React, { useEffect, useState } from "react";
import { Item } from "~/types/item.types";
import { ItemTypes } from "~/types/item-types.enum";
import { itemsApi } from "~/api/items.api";
import { cn, getItemTypeText } from "~/lib/utils";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Trash2, Search, Euro } from "lucide-react-native";
import { InputCustom } from "~/components/ui/input_custom"
import { SingleSelectDropdown } from '~/components/ui/single_select_dropdown_props';
import { ItemTable } from "~/components/admin/ItemTable"

export default function MenuPage() {
  const [value, setValue] = useState(ItemTypes.DRINK);
  const [menuDrinks, setMenuDrinks] = useState<Item[]>([]);
  const [menuStarters, setMenuStarters] = useState<Item[]>([]);
  const [menuMains, setMenuMains] = useState<Item[]>([]);
  const [menuDesserts, setMenuDesserts] = useState<Item[]>([]);
  const [selectedOption, setSelectedOption] = useState<string | null>(null)

  // SidePanel
  const [title, setTitle] = useState('Filtrage') // Titre par défaut
  const [isEditing, setIsEditing] = useState(false) // Indique si on est en train de modifier un article
  const [currentItem, setCurrentItem] = useState<Item | null>(null) // Article en cours de modification

  const columnWidths = ['65%', '15%', '15%', '5%'] as DimensionValue[];

  useEffect(() => {
    loadData(ItemTypes.DRINK);
    loadData(ItemTypes.STARTER);
    loadData(ItemTypes.MAIN);
    loadData(ItemTypes.DESSERT);
  }, []);

  const loadData = async (itemType: ItemTypes) => {
    try {
      const data = await itemsApi.getItems(itemType);
      switch (itemType) {
        case ItemTypes.DRINK:
          setMenuDrinks(data);
          break;
        case ItemTypes.STARTER:
          setMenuStarters(data);
          break;
        case ItemTypes.MAIN:
          setMenuMains(data);
          break;
        case ItemTypes.DESSERT:
          setMenuDesserts(data);
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
    setSelectedOption(null)
  }

  const handleEditArticle = (item: Item) => {
    setTitle('Modification d’un article')
    setIsEditing(true)
    setCurrentItem(item)
    setSelectedOption(getItemTypeText(item.itemType))
  }

  const handleCancelEditorCreate = () => {
    setTitle('Filtrage')
    setIsEditing(false)
    setCurrentItem(null)
    setSelectedOption(null)
  }

  const renderSidePanelContent = () => {
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
              <Text style={{ fontWeight: '300', fontSize: 15, color: '#2A2E33' }}>
                Nom de l'article
              </Text>
              <InputCustom
                style={{ marginVertical: 2, borderColor: '#D7D7D7', borderRadius: 5, backgroundColor: '#FFFFFF' }}
                textStyle={{ fontWeight: '300', color: '#2A2E33' }}
                placeholderStyle={{ color: '#949699' }}
                value={isEditing && currentItem ? currentItem.name : ''}
              />
              <SingleSelectDropdown
                options={['Entrées', 'Plats', 'Desserts', 'Boissons']}
                selectedOption={selectedOption}
                onSelect={setSelectedOption}
              />
              <Text style={{ fontWeight: '300', fontSize: 15, color: '#2A2E33' }}>
                Prix
              </Text>
              <InputCustom
                placeholder="0.00"
                style={{ marginVertical: 2, borderColor: '#D7D7D7', borderRadius: 5, backgroundColor: '#FFFFFF' }}
                textStyle={{ fontWeight: '300', color: '#2A2E33' }}
                placeholderStyle={{ color: '#949699' }}
                icone={Euro}
                iconePosition="right"
                iconeProps={{
                  strokeWidth: 2,
                  color: '#696969',
                  borderLeftWidth: 1,
                  borderLeftColor: '#D7D7D7',
                }}
                containerIconProps={{
                  borderLeftWidth: 1,
                  borderLeftColor: '#D7D7D7',
                  paddingLeft: 8,
                  height: '100%',
                }}
                value={isEditing && currentItem ? `${currentItem.price}` : ''}
              />
            </View>
            <View>
              <Button
                onPress={() => Alert.alert('Sauvegarde', 'Les modifications ont bien été enregistrées.')}
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
          onValueChange={(newValue: string) => setValue(newValue as ItemTypes)}
          className="w-full mx-auto flex-col gap-1.5"
        >
          <View className="flex flex-row justify-between w-full" style={{ backgroundColor: '#FBFBFB', height: 50 }}>
            <TabsList className="flex-row w-[500px] h-full">
              {Object.values(ItemTypes).map((type) => (
                <TabsTrigger key={type} value={type} className="flex-1 flex-row h-full">
                  <Text
                    className="pr-2"
                    style={{ color: value === type ? '#2A2E33' : '#A0A0A0' }}
                  >
                    {getItemTypeText(type)}
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
                        type === ItemTypes.DRINK
                          ? menuDrinks.length
                          : type === ItemTypes.STARTER
                          ? menuStarters.length
                          : type === ItemTypes.MAIN
                          ? menuMains.length
                          : menuDesserts.length
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
                Créer un article
              </Text>
            </Button>
          </View>
          <TabsContent value={ItemTypes.DRINK}>
            <ItemTable data={menuDrinks} columnWidths={columnWidths} onRowPress={handleEditArticle} />
          </TabsContent>
          <TabsContent value={ItemTypes.STARTER}>
            <ItemTable data={menuStarters} columnWidths={columnWidths} onRowPress={handleEditArticle} />
          </TabsContent>
          <TabsContent value={ItemTypes.MAIN}>
            <ItemTable data={menuMains} columnWidths={columnWidths} onRowPress={handleEditArticle} />
          </TabsContent>
          <TabsContent value={ItemTypes.DESSERT}>
            <ItemTable data={menuDesserts} columnWidths={columnWidths} onRowPress={handleEditArticle} />
          </TabsContent>
        </Tabs>
      </View>
    </View>
  );
} 