import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { SidePanel } from "~/components/SidePanel";

interface OrderItem {
  id: string;
  name: string;
  note: string;
}

interface Order {
  id: string;
  tableNumber: string;
  time: string;
  items: OrderItem[];
  itemCount: number;
}

const StatusBadge = ({ status }: { status: string }) => {
  const getStatusStyle = () => {
    switch (status) {
      case 'waiting':
        return 'bg-gray-200 text-gray-700';
      case 'inProgress':
        return 'bg-yellow-200 text-yellow-800';
      case 'ready':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-200 text-gray-700';
    }
  };

  const getStatusText = () => {
    switch (status) {
      case 'waiting':
        return 'En attente';
      case 'inProgress':
        return 'En cours';
      case 'ready':
        return 'Prêt';
      default:
        return '';
    }
  };

  return (
    <View className={`shadow rounded-md px-2 py-1 ${getStatusStyle()}`}>
      <Text className="text-xs font-medium">{getStatusText()}</Text>
    </View>
  );
};

const OrderCard = ({ order, status }: { order: Order; status: string }) => {
  const [isExpanded, setIsExpanded] = useState(true);

  return (
    <View className="bg-white rounded-lg shadow mb-3">
      <View className="px-4 pt-3 pb-2">
        <View className="flex-row justify-between items-start mb-1 border-b border-gray-100">
          <Text className="text-gray-900 text-sm font-medium">{order.id}</Text>
          <Text className="text-gray-600 text-sm">{order.itemCount} ARTICLES</Text>
        </View>
        
        <View className="flex-row justify-between items-center">
          <View>
            <Text className="text-gray-900 font-bold mb-1">Table {order.tableNumber}</Text>
            <Text className="text-gray-500 text-xs">Commande lancé {order.time}</Text>
          </View>
          <View className="flex-row items-center">
            <StatusBadge status={status}/>
            <TouchableOpacity 
              onPress={() => setIsExpanded(!isExpanded)}
              className="ml-2"
            >
              <MaterialIcons 
                name={isExpanded ? "expand-less" : "expand-more"} 
                size={24} 
                color="#666"
              />
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {isExpanded && (
        <>
          <View className="px-4 py-2">
            <Text className="text-gray-900 font-medium mb-2">Entrées</Text>
            {order.items.map((item, index) => (
              <View key={index} className="flex-row items-center mb-2">
                <View className={`w-5 h-5 rounded-full border ${
                  status === 'ready' ? 'border-green-500 bg-green-500' : 
                  'border-gray-300'
                } mr-3 items-center justify-center`}>
                  {status === 'ready' && (
                    <MaterialIcons name="check" size={14} color="white" />
                  )}
                </View>
                <View>
                  <Text className="text-gray-800 text-sm">{item.name}</Text>
                  <Text className="text-gray-500 text-xs">{item.note}</Text>
                </View>
              </View>
            ))}
          </View>

          {status === 'inProgress' && (
            <TouchableOpacity className="px-4 py-3 bg-red-500 rounded-b-lg">
              <Text className="text-white text-center text-sm font-medium">
                Mettre la commande en erreur
              </Text>
            </TouchableOpacity>
          )}
        </>
      )}
    </View>
  );
};

const OrderColumn = ({ title, orders, status, headerColor }: { 
  title: string; 
  orders: Order[]; 
  status: string;
  headerColor: string;
}) => {
  return (
    <View className="flex-1 bg-gray-100 rounded-lg shadow">
      <View className={`rounded-t-lg ${headerColor}`}>
        <Text className="font-bold text-center py-3 text-sm">{title}</Text>
      </View>
      <ScrollView className="flex-1 flex-column p-3">
        {orders.map((order) => (
          <OrderCard key={order.id} order={order} status={status} />
        ))}
      </ScrollView>
    </View>
  );
};

export default function KitchenPage() {
  const sampleOrder: Order = {
    id: '09283774892900',
    tableNumber: '01',
    time: '13:17',
    itemCount: 5,
    items: Array(5).fill({
      id: '1',
      name: 'Tartare de saumon',
      note: '(Avec persil)',
    }),
  };

  return (
    <View style={{ flex: 1, flexDirection: 'row' }}>
      <SidePanel title="">
        <View>
        </View>
      </SidePanel>
      <View className="flex-1 flex-row gap-7 p-7">
        <OrderColumn 
          title="EN ATTENTE" 
          orders={[sampleOrder, sampleOrder]} 
          status="waiting"
          headerColor="bg-gray-200"
        />
        <OrderColumn 
          title="EN COURS" 
          orders={[sampleOrder, sampleOrder, sampleOrder]} 
          status="inProgress"
          headerColor="bg-yellow-300"
        />
        <OrderColumn 
          title="PRÊT À SERVIR" 
          orders={[sampleOrder]} 
          status="ready"
          headerColor="bg-blue-100"
        />
      </View>
    </View>
  );
}