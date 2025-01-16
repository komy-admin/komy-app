// app/(server)/index.tsx
import { View, ScrollView, Pressable, Dimensions } from 'react-native';
import BottomSheet, { BottomSheetScrollView } from '@gorhom/bottom-sheet';
import { useMemo, useRef, useCallback, useState, useEffect } from 'react';
import { Table } from '~/types/table.types';
import { Card, CardContent, CardHeader, CardTitle, Text } from '~/components/ui';
import { tableApiService } from '~/api/table.api';
import { getStatusColor, getStatusText } from '~/lib/utils';
import { router } from 'expo-router';
import RoomComponent from '~/components/Room/Room';
import { Status } from '~/types/status.enum';

export default function ServerHome() {
  const bottomSheetRef = useRef<BottomSheet>(null);
  const snapPoints = useMemo(() => ['25%', '50%', '90%'], []);
  const screenHeight = Dimensions.get('window').height;

  const [tables, setTables] = useState<Table[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadTables();
  }, []);

  const loadTables = async () => {
    try {
      setIsLoading(true);
      const { data } = await tableApiService.getAll();
      setTables(data);
      setError(null);
    } catch (err) {
      setError('Erreur lors du chargement des tables');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleTablePress = (table: Table | null) => {
    if (!table) return;
    try {
      router.push({
        pathname: "/table/[id]",
        params: { id: table.id }
      });
    } catch (error) {
      console.error('Navigation error:', error);
    }
  }

  const renderTableList = useCallback(() => (
    <BottomSheetScrollView className="px-4">
      <View className="py-2">
        <Text className="text-lg font-bold mb-4">Liste des Tables</Text>
        {tables.map((table) => (
          <Pressable
            key={table.id}
            onPress={() => handleTablePress(table)}
          >
            <Card
              className="mb-3 border border-gray-200"
              style={{backgroundColor: getStatusColor(Status.DRAFT)}}>
              <CardContent className="flex-row justify-between items-center py-3">
                <View>
                  <Text className="font-medium">Table {table.name}</Text>
                  <Text className="text-sm text-gray-500">{table.seats} places</Text>
                </View>
                <View className="px-3 py-1 rounded-full bg-white">
                  <Text className="text-sm">
                    {getStatusText(Status.DRAFT)}
                  </Text>
                </View>
              </CardContent>
            </Card>
          </Pressable>
        ))}
      </View>
    </BottomSheetScrollView>
  ), [tables]);

  return (
    <View className="flex-1 bg-background maisoutes">
      <View className="" style={{
        height : screenHeight * 0.75 - 88,
      }}>
        <RoomComponent tables={tables} onTablePress={handleTablePress} onTableLongPress={handleTablePress} onTableUpdate={() => {}} />
      </View>

      {/* Bottom Sheet avec style amélioré */}
      <BottomSheet
        ref={bottomSheetRef}
        snapPoints={snapPoints}
        enablePanDownToClose={false}
        index={0}
        handleIndicatorStyle={{
          backgroundColor: '#94A3B8',
          width: 40,
          height: 4,
        }}
        handleStyle={{
          backgroundColor: 'white',
          borderTopLeftRadius: 15,
          borderTopRightRadius: 15,
          paddingVertical: 12,
        }}
        backgroundStyle={{
          backgroundColor: 'white',
        }}
        style={{
          shadowColor: "#000",
          shadowOffset: {
            width: 0,
            height: -4,
          },
          shadowOpacity: 0.15,
          shadowRadius: 5,
          elevation: 5,
        }}
      >
        {renderTableList()}
      </BottomSheet>
    </View>
  );
}