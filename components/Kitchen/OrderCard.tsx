import { useState } from "react";
import { TouchableOpacity, View, StyleSheet } from "react-native";
import { Order } from "~/types/order.types";
import { Status } from "~/types/status.enum";
import { Button, Text } from "../ui";
import { DateFormat, formatDate, getStatusColor, getStatusText, getMostImportantStatus } from "~/lib/utils";
import { ChevronDown, ChevronUp, ArrowLeft, ArrowRight } from "lucide-react-native";
import React from "react";
import { OrderLine, OrderLineType, OrderLineItem } from "~/types/order-line.types";

type GroupedOrderLines = {
  [key: string]: {
    name: string;
    lines: OrderLine[];
    items: OrderLineItem[];
    status: Status;
  };
};

export default function OrderCard({ order, status, onStatusChange, overdueOrderItemIds = [] }: { 
    order: Order;
    status: Status;
    onStatusChange: (order: Order, newStatus: Status) => void;
    overdueOrderItemIds?: string[];
  }) {
    const [isExpanded, setIsExpanded] = useState(false);
    
    // Vérifier si cette commande a des items en alerte
    const hasOverdueItems = order.lines?.some(line => {
      if (line.type === OrderLineType.ITEM) {
        return overdueOrderItemIds.includes(line.id);
      } else if (line.type === OrderLineType.MENU && line.items) {
        return line.items.some(menuItem => overdueOrderItemIds.includes(menuItem.id));
      }
      return false;
    }) ?? false;

    const groupedItems: GroupedOrderLines = React.useMemo(() => {
      if (!order?.lines) return {};
      
      return order.lines.reduce((acc, line) => {
        if (line.type === OrderLineType.ITEM && line.item) {
          const itemTypeId = (line.item as any).itemTypeId;
          const itemTypeName = (line.item as any).itemType?.name || 'Article';
          
          if (!acc[itemTypeId]) {
            acc[itemTypeId] = {
              name: itemTypeName,
              lines: [],
              items: [],
              status: line.status || Status.PENDING
            };
          }
          acc[itemTypeId].lines.push(line);
          
        } else if (line.type === OrderLineType.MENU && line.items) {
          // Pour les menus, grouper par type d'item des items du menu
          line.items.forEach(menuItem => {
            const itemTypeId = (menuItem.item as any).itemTypeId;
            const itemTypeName = (menuItem.item as any).itemType?.name || 'Article';
            
            if (!acc[itemTypeId]) {
              acc[itemTypeId] = {
                name: itemTypeName,
                lines: [],
                items: [],
                status: menuItem.status
              };
            }
            acc[itemTypeId].items.push(menuItem);
            // Recalculer le statut pour ce groupe
            const allStatuses = acc[itemTypeId].items.map(item => item.status)
              .concat(acc[itemTypeId].lines.map(l => l.status).filter(Boolean));
            acc[itemTypeId].status = getMostImportantStatus(allStatuses as Status[]);
          });
        }
        return acc;
      }, {} as GroupedOrderLines);
    }, [order?.lines, status]);

    const handleStatusChange = (itemTypeId: string, newStatus: Status) => {
      const filteredLines = order.lines.filter(line => {
        if (line.type === OrderLineType.ITEM && line.item) {
          return (line.item as any).itemTypeId === itemTypeId;
        } else if (line.type === OrderLineType.MENU && line.items) {
          return line.items.some(menuItem => (menuItem.item as any).itemTypeId === itemTypeId);
        }
        return false;
      });
      
      const filteredOrder = {
        ...order,
        lines: filteredLines
      };
      onStatusChange(filteredOrder, newStatus);
    };

    const toggleExpanded = () => {
      setIsExpanded(!isExpanded);
    };

    const renderStatusButtons = (itemType: string, groupStatus: Status) => (
      <View style={styles.buttonContainer}>
        {(groupStatus === Status.INPROGRESS || groupStatus === Status.READY) && (
          <TouchableOpacity
            onPress={(e) => {
              e.stopPropagation();
              groupStatus === Status.INPROGRESS
                ? handleStatusChange(itemType, Status.PENDING)
                : handleStatusChange(itemType, Status.INPROGRESS);
            }}
            style={[styles.actionButton, styles.previousButton]}
            activeOpacity={0.7}
          >
            <ArrowLeft size={18} color="#6B7280" />
          </TouchableOpacity>
        )}
        {(groupStatus === Status.PENDING || groupStatus === Status.INPROGRESS) && (
          <TouchableOpacity
            onPress={(e) => {
              e.stopPropagation();
              groupStatus === Status.PENDING 
                ? handleStatusChange(itemType, Status.INPROGRESS)
                : handleStatusChange(itemType, Status.READY);
            }}
            style={[styles.actionButton, styles.nextButton]}
            activeOpacity={0.7}
          >
            <ArrowRight size={18} color="#FFFFFF" />
          </TouchableOpacity>
        )}
      </View>
    );
  
    return (
      <TouchableOpacity 
        style={[
          styles.card,
          hasOverdueItems && styles.overdueCard
        ]}
        onPress={toggleExpanded}
        activeOpacity={0.95}
      >
        <View style={styles.cardHeader}>
          <View style={styles.orderInfo}>
            <Text style={styles.orderId}>#{order.id}</Text>
            <Text style={styles.itemCount}>
              {order?.lines?.length || 0} LIGNE{order?.lines?.length > 1 ? 'S' : ''}
            </Text>
          </View>
          <View style={styles.expandButton}>
            {isExpanded ? (
              <ChevronUp size={20} color="#6B7280" />
            ) : (
              <ChevronDown size={20} color="#6B7280" />
            )}
          </View>
        </View>
        
        <View style={styles.cardBody}>
          <View style={styles.tableInfo}>
            <Text style={styles.tableName}>
              Table {order?.table?.name}
            </Text>
            <Text style={styles.orderTime}>
              Commande lancée à {formatDate(order.createdAt, DateFormat.TIME)}
            </Text>
          </View>
        </View>

        {isExpanded && (
          <View style={styles.expandedContent}>
            <View style={styles.divider} />
            {Object.entries(groupedItems).map(([type, group]) => (
              <View key={type} style={styles.itemGroup}>
                <View style={styles.groupHeader}>
                  <Text style={styles.groupName}>{group.name}</Text>
                  <View style={[styles.statusBadge, { backgroundColor: getStatusColor(group.status) }]}>
                    <Text style={styles.statusText}>{getStatusText(group.status)}</Text>
                  </View>
                </View>
                
                <View style={styles.itemsList}>
                  {/* Afficher les lignes d'items individuels */}
                  {group.lines.map((orderLine, index) => {
                    const isItemOverdue = overdueOrderItemIds.includes(orderLine.id);
                    return (
                      <View key={`line-${index}`} style={styles.orderItem}>
                        <View style={[
                          styles.itemBullet,
                          isItemOverdue && { backgroundColor: '#DC2626', width: 8, height: 8, borderRadius: 4 }
                        ]} />
                        <View style={styles.itemDetails}>
                          <Text style={[
                            styles.itemName,
                            isItemOverdue && { color: '#DC2626', fontWeight: '700' }
                          ]}>
                            {orderLine.item?.name} (x{orderLine.quantity})
                          </Text>
                          {orderLine.note && (
                            <Text style={[
                              styles.itemNote,
                              isItemOverdue && { color: '#DC2626', fontWeight: '600' }
                            ]}>
                              {orderLine.note}
                            </Text>
                          )}
                        </View>
                      </View>
                    );
                  })}
                  
                  {/* Afficher les items des menus */}
                  {group.items.map((menuItem, index) => {
                    const isItemOverdue = overdueOrderItemIds.includes(menuItem.id);
                    return (
                      <View key={`menu-item-${index}`} style={styles.orderItem}>
                        <View style={[
                          styles.itemBullet,
                          isItemOverdue && { backgroundColor: '#DC2626', width: 8, height: 8, borderRadius: 4 }
                        ]} />
                        <View style={styles.itemDetails}>
                          <Text style={[
                            styles.itemName,
                            isItemOverdue && { color: '#DC2626', fontWeight: '700' }
                          ]}>
                            {menuItem.item.name} (Menu)
                          </Text>
                        </View>
                      </View>
                    );
                  })}
                </View>
                
                {renderStatusButtons(type, group.status)}
              </View>
            ))}
          </View>
        )}
      </TouchableOpacity>
    );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  overdueCard: {
    borderColor: '#DC2626',
    borderWidth: 2,
    shadowColor: '#DC2626',
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 4,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  orderInfo: {
    flex: 1,
  },
  orderId: {
    fontSize: 16,
    fontWeight: '700',
    color: '#2A2E33',
    marginBottom: 2,
  },
  itemCount: {
    fontSize: 12,
    color: '#9CA3AF',
    fontWeight: '500',
    letterSpacing: 0.5,
  },
  expandButton: {
    padding: 4,
  },
  cardBody: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  tableInfo: {
    gap: 4,
  },
  tableName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#2A2E33',
  },
  orderTime: {
    fontSize: 13,
    color: '#6B7280',
    fontWeight: '400',
  },
  expandedContent: {
    paddingBottom: 16,
  },
  divider: {
    height: 1,
    backgroundColor: '#F3F4F6',
    marginBottom: 16,
  },
  itemGroup: {
    marginBottom: 20,
    paddingHorizontal: 16,
  },
  groupHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 12,
  },
  groupName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2A2E33',
    textTransform: 'capitalize',
    flex: 1,
    minWidth: 100,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 1,
    flexShrink: 0,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#2A2E33',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  itemsList: {
    marginBottom: 16,
    paddingLeft: 8,
  },
  orderItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  itemBullet: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#D1D5DB',
    marginTop: 6,
    marginRight: 12,
  },
  itemDetails: {
    flex: 1,
  },
  itemName: {
    fontSize: 14,
    color: '#374151',
    fontWeight: '500',
  },
  itemNote: {
    fontSize: 12,
    color: '#9CA3AF',
    fontStyle: 'italic',
    marginTop: 2,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
  },
  actionButton: {
    flex: 1,
    height: 40,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  previousButton: {
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  nextButton: {
    backgroundColor: '#2A2E33',
  },
});