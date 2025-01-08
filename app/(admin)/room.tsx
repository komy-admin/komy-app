import AsyncStorage from '@react-native-async-storage/async-storage';
import { Plus, Trash } from 'lucide-react-native';
import { useEffect, useState } from "react";
import { StyleSheet, View } from "react-native";
import { roomApiService } from '~/api/room.api';
import { tableApiService } from '~/api/table.api';
import RoomComponent from '~/components/Room/Room';
import { SidePanel } from "~/components/SidePanel";
import { Button, Input, Text } from "~/components/ui";
import { Room } from '~/types/room.types';
import { Status } from '~/types/status.enum';
import { Table } from "~/types/table.types";

export default function RoomPage () {
  const [room, setRoom] = useState<Room>();
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
      const room = await roomApiService.get('podfj9r28kgzq7al48378iqx');
      setRoom(room)
      setTables(room.tables);
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
      roomId: room!.id
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

  return (
    <View style={{ flex: 1, flexDirection: 'row' }}>
      <SidePanel style={{ flex: 1}} title={selectedTable ? `Modification table ${selectedTable.name}` : `Modification salle Terrasse`}>
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
            ) : null }
        </View>
      </SidePanel>
      <View style={{ flex: 1, height: '100%', position: 'relative' }}>
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
    backgroundColor: '#FF00FF',
    display: 'flex',
    flexDirection: 'row'
  },
  deleteTableButton: {
    display: 'flex',
    flexDirection: 'row'
  }
})