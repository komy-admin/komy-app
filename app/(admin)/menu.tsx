import { Alert, DimensionValue, ScrollView, useWindowDimensions, View } from "react-native";
import { Input, Tabs, TabsContent, TabsList, TabsTrigger, Text, Badge, Table, TableHeader, TableRow, TableHead, TableBody, TableCell, Button, } from "~/components/ui";
import { SidePanel } from "~/components/SidePanel";
import React, { useEffect, useState } from "react";
import { Item } from "~/types/item.types";
import { ItemTypes } from "~/types/item-type.enum";
import { itemsApi } from "~/api/items.api";
import { cn, getItemTypeText } from "~/lib/utils";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Trash2, Search, Euro } from "lucide-react-native";
import { InputCustom } from "~/components/ui/input_custom"
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from '~/components/ui/select';
import { ItemTable } from "~/components/admin/ItemTable"
import { FilterBar } from '~/components/filters/Filter';
import { useFilter } from '~/components/filters/useFilter';
import { ItemTypeTypes } from '~/types/item-type.types';
import { itemTypeApi } from "~/api/itemTypes.api";
import { FilterConfig } from '~/types/filter.types';

export default function MenuPage() {
  const [title, setTitle] = useState('Filtrage');
  const [itemTypes, setItemTypes] = useState<ItemTypeTypes[]>([]);
  const [selectedTab, setSelectedTab] = useState<string>('');
  const [menuItems, setMenuItems] = useState<{ [key: string]: Item[] }>({});
  const [name, setName] = useState('');
  const [price, setPrice] = useState<number>(0);
  const [isEditing, setIsEditing] = useState(false);
  const [currentItem, setCurrentItem] = useState<Item | null>(null);
  const defaultOption = { value: '', label: 'Choisissez une catégorie', id: '' };
  const [selectedOption, setSelectedOption] = useState(defaultOption);
  const columnWidths = ['65%', '15%', '15%', '5%'] as DimensionValue[];

  const loadAllData = async (types: ItemTypeTypes[]) => {
    const newMenuItems: { [key: string]: Item[] } = {};
    for (const type of types) {
      try {
        const { data } = await itemsApi.getItems(`itemType.name=${type.name}`);
        newMenuItems[type.name] = data;
      } catch (err) {
        console.error(`Error loading ${type.name} items:`, err);
        newMenuItems[type.name] = [];
      }
    }
    setMenuItems(newMenuItems);
  };

  useEffect(() => {
    const loadItemTypes = async () => {
      try {
        const { data } = await itemTypeApi.getItemTypes();
        setItemTypes(data);
        if (data.length > 0) {
          setSelectedTab(data[0].name);
          await loadAllData(data);
        }
      } catch (err) {
        console.error('Error loading item types:', err);
      }
    };
    loadItemTypes();
  }, []);

  const filterItem: FilterConfig<Item>[] = [
    { 
      field: 'name', 
      type: 'text' as const, 
      label: 'Nom',
      // operator: 'like' as const
    },
    { 
      field: 'price', 
      type: 'number' as const, 
      label: 'Prix',
      operator: 'between' as const,
    },
    { 
      field: 'itemTypeId', 
      type: 'select' as const, 
      label: 'Type',
      operator: 'in' as const,
      options: itemTypes.map(type => ({ label: type.name, value: type.id || '' }))
    }
  ];

  const {
    data,
    loading,
    error,
    updateFilter,
    clearFilters,
    changePage,
    queryParams
  } = useFilter({ config: filterItem, model: 'item' });

  useEffect(() => { 
    if (data) {
      const filteredType = selectedTab;
      if (filteredType) {
        setMenuItems(prev => ({
          ...prev,
          [filteredType]: data.data
        }));
      }
    }
  }, [data]);

  const handleCreateArticle = () => {
    setTitle('Création d\'un article');
    setIsEditing(false);
    setCurrentItem(null);
    setSelectedOption(defaultOption);
    setName('');
    setPrice(0);
  };

  const handleEditArticle = (item: Item) => {
    setTitle('Modification d\'un article');
    setIsEditing(true);
    setCurrentItem(item);
    setSelectedOption({
      value: item!.itemType!.name,
      label: item!.itemType!.name,
      id: item!.itemType!.id ?? ''
    });
    setName(item.name);
    setPrice(item.price);
  };

  const handleCancelEditorCreate = () => {
    setTitle('Filtrage')
    setIsEditing(false)
    setCurrentItem(null)
    setSelectedOption(defaultOption)
    setName('')
    setPrice(0)
  }

  const submitArticleAction = async () => {
    const itemType = selectedOption.value as ItemTypes
    let item: Item = {
      id: currentItem?.id,
      itemTypeId: selectedOption.id,
      name,
      price,
      itemType: {
        id: selectedOption.id,
        name: selectedOption.value
      }
    }
    try {
      if (isEditing && item.id) {
        await itemsApi.updateItem(item.id, item);
        setMenuItems(prev => ({
          ...prev,
          [itemType]: prev[itemType].map(i => i.id === item.id ? item : i)
        }));
      } else {
        const newItem = await itemsApi.createItem(item);
        setMenuItems(prev => ({
          ...prev,
          [itemType]: [...(prev[itemType] || []), newItem]
        }));
      }
      handleCancelEditorCreate()
    } catch (err) {
      console.error('Error in submitArticleAction:', err)
    }
  }

  const submitArticleDelete = async (id: string) => {
    try {
      await itemsApi.deleteItem(id);
      setMenuItems(prev => {
        const newMenuItems = { ...prev };
        Object.keys(newMenuItems).forEach(type => {
          newMenuItems[type] = newMenuItems[type].filter(item => item.id !== id);
        });
        return newMenuItems;
      });
    } catch (err) {
      console.error('Error in deleteArticle:', err);
    }
  }

  const renderSidePanelContent = () => {
    if (title === 'Filtrage') {
      return (
        <View style={{ flex: 1, padding: 15, display: 'flex', flexDirection:'column', justifyContent: 'space-between' }}>
          <FilterBar
            config={filterItem}
            onUpdateFilter={updateFilter}
            onClearFilters={clearFilters}
            activeFilters={queryParams.filters || []}
          />
        </View>
      )
    }
    if (title === 'Création d\'un article' || title === 'Modification d\'un article') {
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
              <Input
                style={{ marginVertical: 5, borderColor: '#D7D7D7', borderRadius: 5, backgroundColor: '#FFFFFF' }}
                placeholder='Nom de l’article'
                value={name}
                onChangeText={(text: string) => setName(text)}
                aria-labelledby='inputLabel'
                aria-errormessage='inputError'
              />
              <Select 
                value={selectedOption} 
                onValueChange={(value) => {
                  if (value) {
                    const itemType = itemTypes.find(type => type.name === value.value);
                    if (itemType) {
                      setSelectedOption({
                        value: itemType.name,
                        label: itemType.name,
                        id: itemType.id!
                      });
                    }
                  }
                }}
              >
                <SelectTrigger className='w-100'>
                  <SelectValue
                    className='text-foreground text-sm native:text-lg'
                    placeholder='Choisissez une catégorie'
                  />
                </SelectTrigger>
                <SelectContent className='w-100'>
                  <SelectGroup>
                    <SelectLabel>Catégories</SelectLabel>
                    {itemTypes.map(type => (
                      <SelectItem 
                        key={type.id} 
                        label={type.name} 
                        value={type.name}
                      >
                        {type.name}
                      </SelectItem>
                    ))}
                  </SelectGroup>
                </SelectContent>
              </Select>
              <input
                type="number"
                placeholder="0.00 €"
                value={price}
                onChange={(p) => setPrice(p.target.value === '' ? 0 : parseFloat(p.target.value))}
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
            </View>
            <View>
              <Button
                onPress={submitArticleAction}
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
          value={selectedTab}
          onValueChange={setSelectedTab}
          className="w-full mx-auto flex-col gap-1.5"
        >
          <View className="flex flex-row justify-between w-full" style={{ backgroundColor: '#FBFBFB', height: 50 }}>
            <TabsList className="flex-row w-[500px] h-full">
              {itemTypes.map((type) => (
                <TabsTrigger key={type.name} value={type.name} className="flex-1 flex-row h-full">
                  <Text
                    className="pr-2"
                    style={{ color: selectedTab === type.name ? '#2A2E33' : '#A0A0A0' }}
                  >
                    {type.name}
                  </Text>
                  <Badge
                    style={{
                      backgroundColor: selectedTab === type.name ? '#2A2E33' : '#E0E0E0',
                      borderRadius: 5,
                      paddingHorizontal: 8,
                      paddingVertical: 4,
                    }}
                  >
                    <Text style={{ color: selectedTab === type.name ? '#FFFFFF' : '#A0A0A0' }}>
                      {menuItems[type.name]?.length || 0}
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
          {itemTypes.map((type) => (
            <TabsContent key={type.name} value={type.name}>
              <ItemTable
                data={menuItems[type.name] || []}
                columnWidths={columnWidths}
                onRowPress={handleEditArticle}
                deleteItem={submitArticleDelete}
              />
            </TabsContent>
          ))}
        </Tabs>
      </View>
    </View>
  );
} 