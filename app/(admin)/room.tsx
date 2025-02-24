import React from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Plus, Trash } from 'lucide-react-native';
import { useEffect, useState } from "react";
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
import { current } from '@reduxjs/toolkit';

export default function RoomPage() {
  const [newRoomName, setNewRoomName] = useState("")
  const [currentRoom, setCurrentRoom] = useState<Room | null>();
  const [rooms, setRooms] = useState<Room[]>([]);
  const [tables, setTables] = useState<Table[]>([]);
  const [selectedTable, setSelectedTable] = useState<Table | null>(null)
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [newRoomWidth, setNewRoomWidth] = useState(10)
  const [newRoomHeight, setNewRoomHeight] = useState(10)
  const [isPanelCollapsed, setIsPanelCollapsed] = useState(false);
  const [title, setTitle] = useState('Création de salle');

  const [initialRoom, setInitialRoom] = useState<Room | null>(null);
  const [hasChanges, setHasChanges] = useState(false);
  const [tempTableName, setTempTableName] = useState<string>("");
  const [tempSeats, setTempSeats] = useState<number>(0);
  const [isEditingName, setIsEditingName] = useState(false);

  useEffect(() => {
    if (currentRoom && initialRoom) {
      const hasNameChange = currentRoom.name !== initialRoom.name;
      const hasWidthChange = currentRoom.width !== initialRoom.width;
      const hasHeightChange = currentRoom.height !== initialRoom.height;
      
      setHasChanges(hasNameChange || hasWidthChange || hasHeightChange);
    }
  }, [currentRoom, initialRoom]);

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
    initData();
  }, []);

  const initData = async () => {
    try {
      setIsLoading(true);
      const { data } = await roomApiService.getAll();
      if (!data.length) return
      setRooms(data)
      initRoomEdition(data[0])
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
    }
  };

  const handleSaveRoom = async () => {
    if (!currentRoom) return;
    
    try {
      const updatedRoom = await roomApiService.update(currentRoom.id, {
        name: currentRoom.name,
        width: currentRoom.width,
        height: currentRoom.height
      });
      
      setCurrentRoom(updatedRoom);
      setInitialRoom(updatedRoom);
      setHasChanges(false);
      
      setRooms(prevRooms => 
        prevRooms.map(room => 
          room.id === updatedRoom.id ? updatedRoom : room
        )
      );
    } catch (error) {
      console.error('Erreur lors de la sauvegarde de la salle:', error);
      setCurrentRoom(initialRoom);
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
  }

  const handleAddTable = async () => {
    function generateName() {
      const letter = String.fromCharCode(65 + Math.floor(Math.random() * 26));
      const number = Math.floor(Math.random() * 100).toString().padStart(2, '0');
      return `${letter}${number}`;
    }
    const tableToCreate = {
      name: generateName(),
      xStart: 5,
      yStart: 5,
      width: 2,
      height: 2,
      roomId: currentRoom!.id,
      seats: 2
    }
    const newTable = await tableApiService.create(tableToCreate)
    setTables([...tables, newTable])
    setSelectedTable(newTable)
    await AsyncStorage.setItem('tables', JSON.stringify(tables))
  }

  const deleteTable = async () => {
    if (selectedTable) {
      await tableApiService.delete(selectedTable.id)
      setTables(tables.filter(table => table.id !== selectedTable.id))
      setSelectedTable(null)
      setTitle('Modification salle');
      await AsyncStorage.setItem('tables', JSON.stringify(tables))
    }
  }

  const handleChangeRoom = (room: Room): void => {
    setIsPanelCollapsed(false);
    if (room.id !== currentRoom?.id) {
      initRoomEdition(room);
      setTitle('Modification salle');
    }
  }

  const deleteRoom = async () => {
    if (currentRoom) {
      await roomApiService.delete(currentRoom.id)
      setTitle('Création de salle');
    }
  }

  const initRoomEdition = (room: Room) => {
    setCurrentRoom(room);
    setInitialRoom({ ...room });
    setTables(room.tables);
    setSelectedTable(null);
    setHasChanges(false);
  };

  const setCreateRoomPanel = () => {
    setIsPanelCollapsed(false);
    setSelectedTable(null)
    setCurrentRoom(null)
    setTitle('Création de salle');
  }

  const createRoom = async () => {
    const newRoom = await roomApiService.create({ name: newRoomName, tables: [], width: newRoomWidth, height: newRoomHeight })
    setRooms([...rooms, newRoom])
    setCurrentRoom(newRoom)
    setTables([])
    setNewRoomName("")
    setNewRoomWidth(10)
    setNewRoomHeight(10)
    setTitle('Modification salle');
  }

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
          { selectedTable ? (
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
                  value={newRoomWidth}
                  decimalPlaces={0}
                  onChangeText={(value) => {
                    setNewRoomWidth(value!);
                    setHasChanges(true);
                  }}
                  placeholder='Largeur'
                  style={{ marginVertical: 8 }}
                />
                <Text style={{fontSize: 14.5}}>Hauteur</Text>
                <NumberInput
                  value={newRoomHeight}
                  decimalPlaces={0}
                  onChangeText={(value) => {
                    setNewRoomHeight(value!);
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
                  value={10}
                  decimalPlaces={0}
                  onChangeText={() => {}}
                  style={{ marginVertical: 8 }}
                  placeholder='Largeur'
                />
                <Text style={{fontSize: 14.5}}>Hauteur</Text>
                <NumberInput
                  value={10}
                  decimalPlaces={0}
                  onChangeText={() => {}}
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
          tables={tables}
          zoom={0.9}
          editingTableId={selectedTable?.id}
          editionMode={true}
          onTablePress={handleTablePress}
          onTableLongPress={handleTablePress}
          onTableUpdate={handleTableUpdate}
        />
        <View 
          style={{ position: 'absolute', bottom: 20, right: 10, left: 10 }}
          className="flex items-center justify-center">
          {currentRoom && (
            <RoomCard
              roomName={`${currentRoom.name}`}
              capacity={{ current: currentRoom.tables ? currentRoom.tables.length : 0 }}
              EditMode={() => {
                handleAddTable()
              }}
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