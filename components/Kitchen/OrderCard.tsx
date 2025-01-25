import { useState } from "react";
import { TouchableOpacity, View } from "react-native";
import { Order } from "~/types/order.types";
import { Status } from "~/types/status.enum";
import { Button, Text } from "../ui";
import { DateFormat, formatDate, getStatusColor, getStatusText } from "~/lib/utils";
import { ChevronDown, ChevronUp, MoveLeft, MoveRight } from "lucide-react-native";
import React from "react";

export default function OrderCard({ order, status, onStatusChange }: { 
    order: Order;
    status: Status;
    onStatusChange: (order: Order, newStatus: Status) => void; 
  }) {
    const [isExpanded, setIsExpanded] = useState(false);

    return (
      <View className="bg-white shadow mb-3">
        <View className="p-3">
          <View className="flex-row justify-between items-start mb-2.5 pb-2.5 border-b border-gray-100">
            <Text className="text-gray-900 text-sm font-medium">{order.id}</Text>
            <Text className="text-gray-600 text-sm">{order?.orderItems?.length || 0} ARTICLE{order?.orderItems?.length > 1 ? 'S' : ''}</Text>
          </View>
          
          <View className="w-full flex-row items-start justify-between">
            <View className="flex-1">
              <Text className="text-gray-900 font-bold mb-1">
                Table {order?.table?.name}
              </Text>
              <Text className="text-gray-500 text-xs flex-wrap">
                Commande lancé à {formatDate(order.createdAt, DateFormat.TIME)}
              </Text>
            </View>
            <View className="flex-row items-center ml-2">
              <View className={`shadow px-2 py-1`} style={{ backgroundColor: getStatusColor(status) }}>
                <Text className="text-xs font-medium">{ getStatusText(status) }</Text>
              </View>
              <TouchableOpacity 
                onPress={() => setIsExpanded(!isExpanded)}
                className="ml-2"
              >
                <View>
                  {isExpanded ? (
                    <ChevronUp size={24} color="#2A2E33" />
                  ) : (
                    <ChevronDown size={24} color="#2A2E33" />
                  )}
                </View>
              </TouchableOpacity>
            </View>
          </View>
          {isExpanded && (
            <>
              <View className="p-4">
                {order?.orderItems?.length ? order.orderItems.map((orderItem, index) => (
                  <View key={index} className="flex-row items-center mb-2">
                    <Text className="text-sm mr-3">-</Text>
                    <View>
                      <Text className="text-gray-800 text-sm">{orderItem.item.name}</Text>
                      <Text className="text-gray-500 text-xs">{orderItem.note}</Text>
                    </View>
                  </View>
                )) :
                  <Text className="text-gray-500 text-sm">Aucun article</Text>
                }
              </View>
            </>
          )}
          <View
            className="flex flex-row justify-between gap-3"
            style={{ width: '100%', justifyContent: 'space-between', alignItems: 'center'}}
          >
            {(status === Status.INPROGRESS || status === Status.READY) ? (
              <View className="w-1/3">
                <Button
                  onPress={() =>
                    status === Status.INPROGRESS
                      ? onStatusChange(order, Status.PENDING)
                      : onStatusChange(order, Status.INPROGRESS)
                  }
                  className="mt-2 flex items-center justify-center"
                  style={{ borderWidth: 1, borderColor: '#D7D7D7', backgroundColor: 'white' }}
                >
                  <MoveLeft size={24} color="black" />
                </Button>
              </View>
            ) : (
              <View className="w-1/3" />
            )}
            {(status === Status.PENDING || status === Status.INPROGRESS) && (
              <View className="w-1/3">
                <Button
                  onPress={() => 
                    status === Status.PENDING 
                      ? onStatusChange(order, Status.INPROGRESS) 
                      : onStatusChange(order, Status.READY)
                  }
                  className="mt-2 flex items-center justify-center"
                  style={{ borderWidth: 1, borderColor: '#D7D7D7', backgroundColor: 'white' }}>
                  <MoveRight size={24} color={'black'} />
                </Button>
              </View>
            )}
          </View>
        </View>
      </View>
    );
};