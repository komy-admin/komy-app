import AsyncStorage from '@react-native-async-storage/async-storage';
import { Plus, Trash } from 'lucide-react-native';
import { useEffect, useState } from "react";
import { Pressable, ScrollView, StyleSheet, View } from "react-native";
import { roomApiService } from '~/api/room.api';
import { tableApiService } from '~/api/table.api';
import RoomComponent from '~/components/Room/Room';
import { SidePanel } from "~/components/SidePanel";
import { Badge, Button, Input, Text, NumberInput } from "~/components/ui";
import { Room } from '~/types/room.types';
import { Status } from '~/types/status.enum';
import { Table } from "~/types/table.types";

export default function RoomPage () {
  const [newRoomName, setNewRoomName] = useState("")
  const [currentRoom, setCurrentRoom] = useState<Room | null>();
  const [rooms, setRooms] = useState<Room[]>([]);
  const [tables, setTables] = useState<Table[]>([]);
  const [selectedTable, setSelectedTable] = useState<Table | null>(null)
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadTables();
  }, []);

  const loadTables = async () => {
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
    } catch (error) {
      setTables(prevTables =>
        prevTables.map(table =>
          table.id === id
            ? tables.find(t => t.id === id) || table
            : table
        )
    );

    // Gestion de l'erreur
    console.error('Erreur lors de la mise à jour de la table:', error);
    // Notification d'erreur (à implémenter selon vos besoins)
    throw new Error(`Échec de la mise à jour de la table: ${error instanceof Error ? error.message : 'Erreur inconnue'}`);
  }
  };

  const handleTablePress = (id: string) => {
    const table = tables.find(t => t.id === id)
    if (table) {
      setSelectedTable(table)
    } else {
      setSelectedTable(null)
    }
  }

  const handleAddTable = async () => {
    const tableToCreate = {
      name: Date.now().toString().slice(-5),
      xStart: 5,
      yStart: 5,
      width: 2,
      height: 2,
      roomId: currentRoom!.id
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
      await AsyncStorage.setItem('tables', JSON.stringify(tables))
    }
  }

  const handleChangeRoom = (room: Room): void => {
    if (room.id !== currentRoom?.id) initRoomEdition(room)
  }

  const deleteRoom = async () => {
    if (currentRoom) {
      await roomApiService.delete(currentRoom.id)
    }
  }

  const initRoomEdition = (room: Room) => {
    setCurrentRoom(room)
    setTables(room.tables)
    setSelectedTable(null)
  }

  const setCreateRoomPanel = () => {
    setSelectedTable(null)
    setCurrentRoom(null)
  }

  const createRoom = async () => {
    const newRoom = await roomApiService.create({ name: newRoomName, tables: [], number: 1 })
    setRooms([...rooms, newRoom])
    setCurrentRoom(newRoom)
    setTables([])
    setNewRoomName("")
  }

  return (
    <View style={{ flex: 1, flexDirection: 'row' }}>
      <SidePanel
        style={{ flex: 1}}
        title={selectedTable ?
          `Modification table ${selectedTable.name}` :
          currentRoom ?
            `Modification salle ${currentRoom?.name}` :
            'Création de salle'}
      >
        <View style={{ padding: 16, flex: 1 }}>
          { selectedTable ? (
            <View style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', flex: 1}}>
              <View>
                <Text>Nom de la table</Text>
                <Input value={selectedTable?.name} />
              </View>
              <Button
                onPress={deleteTable}
                className="h-[50px] mt-2 flex items-center justify-center"
                variant='destructive'
                style={styles.deleteTableButton}>
                <Trash
                  size={24} 
                  color={'white'}
                  className='mr-2'
                />
                <Text>Supprimer la table</Text>
              </Button>
            </View>
          ) : currentRoom ? (
            <View style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', flex: 1}}>
              <View>
                <Text>Nom</Text>
                <Input value={currentRoom?.name} />
                <Text>Largeur</Text>
                <NumberInput value={10} decimalPlaces={0} onChangeText={() => {}} />
                <Text>Longueur</Text>
                <NumberInput value={10} decimalPlaces={0} onChangeText={() => {}} />
              </View>
              <Button
                onPress={deleteRoom}
                className="h-[50px] mt-2 flex items-center justify-center"
                variant='destructive'
                style={styles.deleteTableButton}>
                <Trash
                  size={24} 
                  color={'white'}
                  className='mr-2'
                />
                <Text>Supprimer la salle</Text>
              </Button>
            </View>
          ) : (
            <View style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', flex: 1}}>
              <View>
                <Text>Nom</Text>
                <Input value={newRoomName} onChangeText={(value) => setNewRoomName(value)} />
                <Text>Largeur</Text>
                <NumberInput value={10} decimalPlaces={0} onChangeText={() => {}} />
                <Text>Longueur</Text>
                <NumberInput value={10} decimalPlaces={0} onChangeText={() => {}} />
              </View>
              <Button
                onPress={createRoom}
                className="h-[50px] mt-2 flex items-center justify-center"
                style={styles.deleteTableButton}>
                <Text>Créer la salle</Text>
              </Button>
            </View>
          ) }
        </View>
      </SidePanel>
      <View style={{ flex: 1, height: '100%', position: 'relative' }}>
        <View className='flex-row w-full justify-between'>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            className='flex-row p-2 flex-1'
          >
            {rooms.map((room, index) => (
              <Pressable
                key={`${room.name}-badge-${index}`}
                onPress={() => handleChangeRoom(room)}>
                <Badge
                  variant="outline"
                  className='mx-1'
                  active={room.name === currentRoom?.name}
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
        <Button
          onPress={handleAddTable}
          className="w-[200px] h-[50px] flex items-center justify-center"
          style={styles.addTableButton}>
          <Plus
            size={24} 
            color={'white'}
            className='mr-2'
          />
          <Text>Ajouter une table</Text>
        </Button>
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
})