import React, { useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Plus, Trash } from 'lucide-react-native';
import { Pressable, ScrollView, StyleSheet, View, useWindowDimensions } from "react-native";
import { roomApiService } from '~/api/room.api';
import { tableApiService } from '~/api/table.api';
import RoomComponent from '~/components/Room/Room';
import { SidePanel } from "~/components/SidePanel";
import { Badge, Button, Text, NumberInput, TextInput } from "~/components/ui";
import { Room } from '~/types/room.types';
import { Status } from '~/types/status.enum';
import { Table } from "~/types/table.types";
import { RoomCard } from '~/components/Room/RoomCard';

export default function RoomPage() {
  const [newRoomName, setNewRoomName] = useState("");
  const [currentRoom, setCurrentRoom] = useState<Room | null>(null);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [tables, setTables] = useState<Table[]>([]);
  const [selectedTable, setSelectedTable] = useState<Table | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [newRoomWidth, setNewRoomWidth] = useState(15);
  const [newRoomHeight, setNewRoomHeight] = useState(15);
  const [isPanelCollapsed, setIsPanelCollapsed] = useState(false);
  const [title, setTitle] = useState('Création de salle');
  const [tempWidth, setTempWidth] = useState(10);
  const [tempHeight, setTempHeight] = useState(10);

  const [initialRoom, setInitialRoom] = useState<Room | null>(null);
  const [hasChanges, setHasChanges] = useState(false);
  const [tempTableName, setTempTableName] = useState<string>("");
  const [tempSeats, setTempSeats] = useState<number>(0);
  const [isEditingName, setIsEditingName] = useState(false);
  const [isCreatingTable, setIsCreatingTable] = useState(false);
  const [tempBadge, setTempBadge] = useState<{ name: string } | null>(null);

  useEffect(() => {
    if (currentRoom) {
      setTempWidth(currentRoom.width);
      setTempHeight(currentRoom.height);
    }
  }, [currentRoom]);

  useEffect(() => {
    if (selectedTable) {
      setTempTableName(selectedTable.name);
      setTempSeats(selectedTable.seats || 0);
      setTitle('Modification table');
    } else if (currentRoom) {
      setTitle('Modification salle');
    } else {
      setTitle('Création de salle');
    }
  }, [selectedTable, currentRoom]);

  useEffect(() => {
    if (currentRoom && initialRoom) {
      const hasNameChange = currentRoom.name !== initialRoom.name;
      const hasWidthChange = tempWidth !== initialRoom.width;
      const hasHeightChange = tempHeight !== initialRoom.height;
      
      setHasChanges(hasNameChange || hasWidthChange || hasHeightChange);
    }
  }, [currentRoom, initialRoom, tempWidth, tempHeight]);

  useEffect(() => {
    initData();
  }, []);

  const initData = async () => {
    try {
      setIsLoading(true);
      const { data } = await roomApiService.getAll();
      if (!data.length) return;
      setRooms(data);
      initRoomEdition(data[0]);
      setError(null);
    } catch (err) {
      setError('Erreur lors du chargement des tables');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleBack = () => {
    if (selectedTable) {
      setSelectedTable(null);
      setTitle('Modification salle');
    } else if (currentRoom) {
      setCurrentRoom(null);
      setTitle('Création de salle');
      requestAnimationFrame(() => {
        setTables([]);
      });
    }
  };

  const handleSaveRoom = async () => {
    if (!currentRoom) return;
    
    try {
      // Sauvegarde de la salle avec ses dimensions actuelles
      const updatedRoom = await roomApiService.update(currentRoom.id, {
        name: currentRoom.name,
        width: tempWidth,
        height: tempHeight
      });
      
      // Récupération des données à jour de la salle, incluant les tables
      const refreshedRoom = await roomApiService.get(currentRoom.id);
      
      if (refreshedRoom) {
        setCurrentRoom(refreshedRoom);
        setInitialRoom(refreshedRoom);
        setTables(refreshedRoom.tables || []);
        setHasChanges(false);
        
        // Mise à jour de la liste des salles
        setRooms(prevRooms => 
          prevRooms.map(room => 
            room.id === refreshedRoom.id ? refreshedRoom : room
          )
        );
      }
    } catch (error) {
      console.error('Erreur lors de la sauvegarde de la salle:', error);
      if (initialRoom) {
        setCurrentRoom(initialRoom);
        setTempWidth(initialRoom.width);
        setTempHeight(initialRoom.height);
        setTables(initialRoom.tables || []);
      }
    }
  };

  const handleTableUpdate = async (id: string, updates: Partial<Table>) => {
    try {
      setTables(prevTables => 
        prevTables.map(table => 
          table.id === id ? { ...table, ...updates } : table
        )
      );
  
      const updatedTable = await tableApiService.update(id, updates);
      setTables(prevTables =>
        prevTables.map(table =>
          table.id === updatedTable.id ? updatedTable : table
        )
      );
  
      if (selectedTable?.id === id) {
        setSelectedTable(updatedTable);
      }
    } catch (error) {
      setTables(prevTables =>
        prevTables.map(table =>
          table.id === id
            ? tables.find(t => t.id === id) || table
            : table
        )
      );
      console.error('Erreur lors de la mise à jour de la table:', error);
      throw new Error(`Échec de la mise à jour de la table: ${error instanceof Error ? error.message : 'Erreur inconnue'}`);
    }
  };

  const handleTablePress = (table: Table | null) => {
    setSelectedTable(table);
    if (table) {
      setTitle('Modification table');
    }
  };

  const handleAddTable = async () => {
    if (!currentRoom) return;

    if (isCreatingTable) return;
    setIsCreatingTable(true);
    setError(null);

    function generateName() {
      const letter = String.fromCharCode(65 + Math.floor(Math.random() * 26));
      const number = Math.floor(Math.random() * 100).toString().padStart(2, '0');
      return `${letter}${number}`;
    }

    const DEFAULT_TABLE_SIZE = 2;
    const SPACING = 0;
    
    const isPositionValid = (x: number, y: number): boolean => {
      if (x < 0 || y < 0 || x >= currentRoom.width || y >= currentRoom.height) {
        return false;
      }

      if (x + DEFAULT_TABLE_SIZE > currentRoom.width || 
          y + DEFAULT_TABLE_SIZE > currentRoom.height) {
        return false;
      }

      return !tables.some(table => {
        const hasCollision = (x < table.xStart + table.width + SPACING &&
                            x + DEFAULT_TABLE_SIZE + SPACING > table.xStart &&
                            y < table.yStart + table.height + SPACING &&
                            y + DEFAULT_TABLE_SIZE + SPACING > table.yStart);
        return hasCollision;
      });
    };

    let validPosition = null;
    
    const maxX = currentRoom.width - DEFAULT_TABLE_SIZE;
    const maxY = currentRoom.height - DEFAULT_TABLE_SIZE;

    for (let y = 0; y <= maxY && !validPosition; y++) {
      for (let x = 0; x <= maxX && !validPosition; x++) {
        if (isPositionValid(x, y)) {
          validPosition = { x, y };
          break;
        }
      }
    }

    if (!validPosition) {
      const errorMessage = "Pas d'espace disponible pour une nouvelle table";
      console.error(errorMessage);
      setError(errorMessage);
      setIsCreatingTable(false);
      return;
    }

    const tableToCreate = {
      name: generateName(),
      xStart: validPosition.x,
      yStart: validPosition.y,
      width: DEFAULT_TABLE_SIZE,
      height: DEFAULT_TABLE_SIZE,
      roomId: currentRoom.id,
      seats: 2
    };

    try {
      const newTable = await tableApiService.create(tableToCreate);
      setTables(prevTables => [...prevTables, newTable]);
      setSelectedTable(newTable);
      await AsyncStorage.setItem('tables', JSON.stringify([...tables, newTable]));
    } catch (error) {
      console.error("Erreur lors de la création de la table:", error);
      setError("Erreur lors de la création de la table");
    } finally {
      setIsCreatingTable(false);
    }
  };

  const deleteTable = async () => {
    if (selectedTable) {
      await tableApiService.delete(selectedTable.id);
      setTables(tables.filter(table => table.id !== selectedTable.id));
      setSelectedTable(null);
      setTitle('Modification salle');
      await AsyncStorage.setItem('tables', JSON.stringify(tables))
    }
  };

  const handleChangeRoom = async (room: Room) => {
    setIsPanelCollapsed(false);
    if (room.id !== currentRoom?.id) {
      try {
        // Si des modifications sont en attente, les sauvegarder
        if (currentRoom && hasChanges) {
          await handleSaveRoom();
        }
        
        // Récupérer les données à jour de la nouvelle salle
        const freshRoom = await roomApiService.get(room.id);
        if (freshRoom) {
          initRoomEdition(freshRoom);
          setTitle('Modification salle');
        }
      } catch (error) {
        console.error('Erreur lors du changement de salle:', error);
      }
    }
  };

  const deleteRoom = async () => {
    if (!currentRoom) return;
    
    try {
      await roomApiService.delete(currentRoom.id);
      
      // Mettre à jour la liste des salles
      const updatedRooms = rooms.filter(room => room.id !== currentRoom.id);
      setRooms(updatedRooms);
      
      // Réinitialiser les états liés à la salle courante
      setSelectedTable(null);
      setTables([]);
      setHasChanges(false);
      
      // Si d'autres salles existent, sélectionner la première
      if (updatedRooms.length > 0) {
        const nextRoom = await roomApiService.get(updatedRooms[0].id);
        if (nextRoom) {
          initRoomEdition(nextRoom);
          setTitle('Modification salle');
        }
      } else {
        // Si plus aucune salle n'existe, revenir à l'état initial
        setCurrentRoom(null);
        setInitialRoom(null);
        setTitle('Création de salle');
        setTempWidth(15);
        setTempHeight(15);
        setNewRoomWidth(15);
        setNewRoomHeight(15);
      }
    } catch (error) {
      console.error('Erreur lors de la suppression de la salle:', error);
      setError('Erreur lors de la suppression de la salle');
    }
  };

  const initRoomEdition = (room: Room) => {
    setCurrentRoom(room);
    setInitialRoom({ ...room });
    setTables(room.tables || []);
    setSelectedTable(null);
    setHasChanges(false);
    setTempWidth(room.width);
    setTempHeight(room.height);
  };
  
  useEffect(() => {
    if (!currentRoom) {
      setTempBadge(newRoomName ? { name: newRoomName } : { name: 'Nouvelle salle' });
    } else {
      setTempBadge(null);
    }
  }, [currentRoom, newRoomName]);

  const setCreateRoomPanel = () => {
    // Réinitialiser complètement l'état
    setIsPanelCollapsed(false);
    setSelectedTable(null);
    setCurrentRoom(null);
    setTables([]);
    setTitle('Création de salle');
    setTempWidth(15);
    setTempHeight(15);
    setNewRoomWidth(15);
    setNewRoomHeight(15);
    setInitialRoom(null); // Important: réinitialiser l'état initial
    setHasChanges(false);
    // Forcer une réinitialisation du composant RoomComponent
    requestAnimationFrame(() => {
      setTables([]); // Double réinitialisation pour forcer le re-render
    });
  };


  const createRoom = async () => {
    try {
      // Réinitialiser les tables avant la création
      setTables([]);
      
      const newRoom = await roomApiService.create({ 
        name: newRoomName, 
        tables: [], // S'assurer qu'aucune table n'est créée initialement
        width: newRoomWidth, 
        height: newRoomHeight 
      });
      
      // Mettre à jour l'état avec la nouvelle salle
      setRooms([...rooms, newRoom]);
      setCurrentRoom(newRoom);
      setInitialRoom(newRoom);
      setTables([]); // S'assurer que les tables sont vides
      setNewRoomName("");
      setNewRoomWidth(15);
      setNewRoomHeight(15);
      setTitle('Modification salle');
      
      // Forcer une réinitialisation du composant RoomComponent
      requestAnimationFrame(() => {
        setTables([]); // Double réinitialisation pour forcer le re-render
      });
    } catch (error) {
      console.error("Erreur lors de la création de la salle:", error);
      setError("Erreur lors de la création de la salle");
    }
  };

  const renderSidePanelContent = () => {
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
        <View style={{ padding: 16, flex: 1 }}>
          {selectedTable ? (
            <View style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', flex: 1}}>
              <View>
                <Text style={{fontSize: 14.5}}>Nom de la table</Text>
                <TextInput
                  value={tempTableName}
                  onChangeText={(value) => {
                    setTempTableName(value);
                    setTables(prevTables => 
                      prevTables.map(table => 
                        table.id === selectedTable?.id 
                          ? { ...table, name: value || table.name }
                          : table
                      )
                    );
                  }}
                  onBlur={() => {
                    if (!tempTableName.trim()) {
                      const originalName = selectedTable!.name;
                      setTempTableName(originalName);
                      setTables(prevTables => 
                        prevTables.map(table => 
                          table.id === selectedTable?.id 
                            ? { ...table, name: originalName }
                            : table
                        )
                      );
                    } else {
                      handleTableUpdate(selectedTable!.id, { name: tempTableName.trim() });
                    }
                  }}
                  style={{ 
                    borderWidth: 1, 
                    borderColor: '#D7D7D7', 
                    borderRadius: 5, 
                    backgroundColor: '#FFFFFF', 
                    color: '#2A2E33', 
                    marginVertical: 8, 
                    padding: 10 
                  }}
                />
                <Text style={{fontSize: 14.5}}>Couverts</Text>
                <NumberInput
                  style={{ marginVertical: 8 }}
                  value={tempSeats}
                  onChangeText={(value) => {
                    const newValue = value === null ? 0 : value;
                    setTempSeats(newValue);
                    handleTableUpdate(selectedTable!.id, { seats: newValue });
                  }}
                  decimalPlaces={0}
                  min={0}
                  max={20}
                  placeholder="0"
                />
              </View>
              <Button
                onPress={deleteTable}
                className="h-[50px] mt-2 flex items-center justify-center bg-transparent hover:bg-red-50 transition-colors"
                variant="ghost"
                style={{
                  display: 'flex',
                  flexDirection: 'row'
                }}>
                <Text style={{ color: '#ef4444', textDecorationLine: 'underline', fontSize: 15 }}>
                  Supprimer la table
                </Text>
              </Button>
            </View>
          ) : currentRoom ? (
            <View style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', flex: 1}}>
              <View>
                <Text style={{fontSize: 14.5}}>Nom</Text>
                <TextInput
                  value={currentRoom?.name}
                  onChangeText={(value) => {
                    setCurrentRoom(prev => prev ? { ...prev, name: value } : prev);
                    setHasChanges(true);
                  }}
                  style={{ 
                    borderWidth: 1, 
                    borderColor: '#D7D7D7', 
                    borderRadius: 5, 
                    backgroundColor: '#FFFFFF', 
                    color: '#2A2E33', 
                    marginVertical: 8, 
                    padding: 10 
                  }}
                />
                <Text style={{fontSize: 14.5}}>Largeur</Text>
                <NumberInput
                  value={tempWidth}
                  decimalPlaces={0}
                  onChangeText={(value) => {
                    setTempWidth(value || 10);
                    setHasChanges(true);
                  }}
                  placeholder='Largeur'
                  style={{ marginVertical: 8 }}
                />
                <Text style={{fontSize: 14.5}}>Hauteur</Text>
                <NumberInput
                  value={tempHeight}
                  decimalPlaces={0}
                  onChangeText={(value) => {
                    setTempHeight(value || 10);
                    setHasChanges(true);
                  }}
                  placeholder='Hauteur'
                  style={{ marginVertical: 8 }}
                />
              </View>
              <View>
                <Button
                  onPress={handleSaveRoom}
                  className="h-[50px] flex items-center justify-center"
                  disabled={!hasChanges}
                  style={{
                    backgroundColor: '#2A2E33',
                    opacity: hasChanges ? 0.8 : 0.3,
                  }}>
                  <Text style={{ color: 'white', fontSize: 16 }}>
                    Enregistrer les modifications
                  </Text>
                </Button>
                <Button
                  onPress={deleteRoom}
                  className="h-[50px] mt-2 flex items-center justify-center bg-transparent hover:bg-red-50 transition-colors"
                  variant="ghost"
                  style={{
                    display: 'flex',
                    flexDirection: 'row'
                  }}>
                  <View style={{ borderBottomWidth: 1, borderBottomColor: '#ef4444', paddingBottom: 2 }}>
                    <Text style={{ color: '#ef4444', fontSize: 15 }}>
                      Supprimer la salle
                    </Text>
                  </View>
                </Button>
              </View>
            </View>
          ) : (
            <View style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', flex: 1}}>
              <View>
                <Text style={{fontSize: 14.5}}>Nom</Text>
                <TextInput
                  value={newRoomName}
                  onChangeText={(value) => setNewRoomName(value)}
                  style={{ 
                    borderWidth: 1, 
                    borderColor: '#D7D7D7', 
                    borderRadius: 5, 
                    backgroundColor: '#FFFFFF', 
                    color: '#2A2E33', 
                    marginVertical: 8, 
                    padding: 10 
                  }}
                />
                <Text style={{fontSize: 14.5}}>Largeur</Text>
                <NumberInput
                  value={newRoomWidth}
                  decimalPlaces={0}
                  onChangeText={(value) => setNewRoomWidth(value || 10)}
                  style={{ marginVertical: 8 }}
                  placeholder='Largeur'
                />
                <Text style={{fontSize: 14.5}}>Hauteur</Text>
                <NumberInput
                  value={newRoomHeight}
                  decimalPlaces={0}
                  onChangeText={(value) => setNewRoomHeight(value || 10)}
                  style={{ marginVertical: 8 }}
                  placeholder='Hauteur'
                />
              </View>
              <Button
                onPress={createRoom}
                className="h-[50px] flex items-center justify-center"
                style={{
                  backgroundColor: '#2A2E33',
                  opacity: 0.8,
                }}>
                <Text style={{ color: 'white', fontSize: 16 }}>
                  Créer la salle
                </Text>
              </Button>
            </View>
          )}
        </View>
      </>
    );
  };

  const { width } = useWindowDimensions();

  return (
    <View style={{ flex: 1, flexDirection: 'row' }}>
      <SidePanel
        title={title}
        width={width / 4}
        onBack={title !== 'Création de salle' ? handleBack : undefined}
        isCollapsed={isPanelCollapsed}
        onCollapsedChange={setIsPanelCollapsed}
      >
        {renderSidePanelContent()}
      </SidePanel>
      <View style={{ flex: 1, height: '100%', position: 'relative' }}>
        <View className='flex-row w-full justify-between' style={{ backgroundColor: '#FBFBFB', height: 50 }}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            className='flex-row p-2 flex-1'
            contentContainerStyle={{ 
              alignItems: 'center',
              height: '100%'
            }}
          >
            {rooms.map((room, index) => (
              <Pressable
                key={`${room.name}-badge-${index}`}
                onPress={() => handleChangeRoom(room)}>
                <Badge
                  variant="outline"
                  className='mx-1'
                  active={room.id === currentRoom?.id}
                  size='lg'
                >
                  <Text>{room.name}</Text>
                </Badge>
              </Pressable>
            ))}
            {!currentRoom && tempBadge && !isLoading && (
              <Badge
                variant="outline"
                className='mx-1'
                active={true}
                size='lg'
              >
                <Text>{tempBadge.name}</Text>
              </Badge>
            )}
          </ScrollView>
          <Button
            onPress={setCreateRoomPanel}
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
              Créer une salle
            </Text>
          </Button>
        </View>
        <RoomComponent
          key={currentRoom?.id || 'new-room'}
          tables={tables}
          editingTableId={selectedTable?.id}
          editionMode={true}
          width={currentRoom?.width}
          height={currentRoom?.height}
          isLoading={isLoading}
          onTablePress={handleTablePress}
          onTableLongPress={handleTablePress}
          onTableUpdate={handleTableUpdate}
        />
        <View 
          style={{ position: 'absolute', bottom: 5, right: 10, left: 10 }}
          className="flex items-center justify-center"
          pointerEvents="box-none">
          {currentRoom && (
            <RoomCard
              roomName={`${currentRoom.name}`}
              capacity={{ current: tables.length }}
              EditMode={handleAddTable}
            />
          )}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  addTableButton: {
    position: 'absolute',
    bottom: 30,
    right: 30,
    display: 'flex',
    flexDirection: 'row'
  },
  deleteTableButton: {
    display: 'flex',
    flexDirection: 'row'
  }
});