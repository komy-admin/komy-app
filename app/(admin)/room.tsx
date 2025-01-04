import AsyncStorage from '@react-native-async-storage/async-storage';
import { useEffect, useState } from "react";
import { Dimensions, View } from "react-native";
import { tablesApi } from "~/api/tables.api";
import Room from "~/components/Room/Room";
import { SidePanel } from "~/components/SidePanel";
import { Input, Text } from "~/components/ui";
import { Table } from "~/types/table.types";

export default function RoomPage () {
  const screenHeight = Dimensions.get('window').height;

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
      const savedTables = await AsyncStorage.getItem('tables');
      if (savedTables) {
        setTables(JSON.parse(savedTables));
      } else {
        const data = await tablesApi.getAll();
        setTables(data);
      }
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
      setTables(prevTables => {
        const newTables = prevTables.map(table => 
          table.id === id 
            ? { 
                ...table, 
                ...updates,
                updatedAt: new Date().toISOString()
              } 
            : table
        );

        AsyncStorage.setItem('tables', JSON.stringify(newTables))
          .catch(err => console.error('Erreur sauvegarde AsyncStorage:', err));
          
        return newTables;
      });
    } catch (err) {
      console.error('Erreur mise à jour table:', err);
    }
  };

  const handleTablePress = (id: string) => {
    const table = tables.find(t => t.id === id)
    if (table) {
      setSelectedTable(table)
    }
  }

  return (
    <View style={{ flex: 1, flexDirection: 'row' }}>
      <SidePanel title="Filtrage">
        <View style={{ padding: 16 }}>
          { selectedTable ? (
          <View>
            <Text>Nom de la table</Text>
            <Input value={selectedTable?.name} />
          </View>
            ) : null }
        </View>
      </SidePanel>
      <View style={{ flex: 1, height: screenHeight }}>
        <Room
          tables={tables}
          zoom={0.9}
          editionMode={true}
          onTablePress={handleTablePress}
          onTableUpdate={handleTableUpdate}
        />
      </View>
    </View>
  );

}