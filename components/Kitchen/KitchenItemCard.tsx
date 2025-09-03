import { useState } from "react";
import { TouchableOpacity, View, StyleSheet } from "react-native";
import { Status } from "~/types/status.enum";
import { Button, Text } from "../ui";
import { DateFormat, formatDate, getStatusColor, getStatusText } from "~/lib/utils";
import { ChevronDown, ChevronUp, ArrowLeft, ArrowRight } from "lucide-react-native";
import React from "react";

// Interface pour les groupes d'items
interface KitchenItemGroup {
  id: string;
  orderId: string;
  orderNumber: string;
  tableName: string;
  status: Status;
  items: Array<{
    id: string;
    type: 'ITEM' | 'MENU_ITEM';
    itemName: string;
    itemType?: string;
    menuName?: string;
    menuId?: string;
    orderLineId?: string;
    isOverdue: boolean;
  }>;
  isOverdue: boolean;
  createdAt: string;
}

const STATUS_ORDER = [Status.PENDING, Status.INPROGRESS, Status.READY];

export default function KitchenItemCard({ itemGroup, onStatusChange, onIndividualItemStatusChange }: {
  itemGroup: KitchenItemGroup;
  onStatusChange: (itemGroup: KitchenItemGroup, newStatus: Status) => void;
  onIndividualItemStatusChange?: (item: any, newStatus: Status) => void;
}) {
  const [isExpanded, setIsExpanded] = useState(false);

  const currentStatusIndex = STATUS_ORDER.indexOf(itemGroup.status);
  const canGoBack = currentStatusIndex > 0;
  const canGoForward = currentStatusIndex < STATUS_ORDER.length - 1;

  const handleStatusBack = () => {
    if (canGoBack) {
      const newStatus = STATUS_ORDER[currentStatusIndex - 1];
      onStatusChange(itemGroup, newStatus);
    }
  };

  const handleStatusForward = () => {
    if (canGoForward) {
      const newStatus = STATUS_ORDER[currentStatusIndex + 1];
      onStatusChange(itemGroup, newStatus);
    }
  };

  return (
    <View style={[
      styles.card,
      itemGroup.isOverdue && styles.overdueCard
    ]}>
      {/* En-tête de la carte */}
      <View style={styles.header}>
        <View style={styles.orderInfo}>
          <Text style={styles.orderNumber}>{itemGroup.orderNumber}</Text>
          <Text style={styles.tableName}>{itemGroup.tableName}</Text>
        </View>

        <View style={styles.headerRight}>
          <Text style={styles.timestamp}>
            {formatDate(itemGroup.createdAt, DateFormat.TIME)}
          </Text>
          {itemGroup.isOverdue && (
            <View style={styles.overdueIndicator}>
              <Text style={styles.overdueText}>!</Text>
            </View>
          )}
        </View>
      </View>

      {/* Liste des items */}
      <View style={styles.itemsContainer}>
        <TouchableOpacity
          style={styles.itemsSummary}
          onPress={() => setIsExpanded(!isExpanded)}
        >
          <Text style={styles.itemsCount}>
            {itemGroup.items.length} article{itemGroup.items.length > 1 ? 's' : ''}
          </Text>
          {isExpanded ? (
            <ChevronUp size={16} color="#6B7280" />
          ) : (
            <ChevronDown size={16} color="#6B7280" />
          )}
        </TouchableOpacity>

        {isExpanded && (
          <View style={styles.expandedItems}>
            {itemGroup.items.map((item, index) => {
              const currentStatusIndex = STATUS_ORDER.indexOf(itemGroup.status);
              const canGoBack = currentStatusIndex > 0;
              const canGoForward = currentStatusIndex < STATUS_ORDER.length - 1;

              const handleItemStatusBack = () => {
                if (canGoBack && onIndividualItemStatusChange) {
                  const newStatus = STATUS_ORDER[currentStatusIndex - 1];
                  onIndividualItemStatusChange(item, newStatus);
                }
              };

              const handleItemStatusForward = () => {
                if (canGoForward && onIndividualItemStatusChange) {
                  const newStatus = STATUS_ORDER[currentStatusIndex + 1];
                  onIndividualItemStatusChange(item, newStatus);
                }
              };

              return (
                <View key={item.id} style={styles.itemRow}>
                  <View style={styles.itemInfo}>
                    <Text style={styles.itemName}>
                      {item.itemName}
                    </Text>
                    {item.type === 'MENU_ITEM' && item.menuName && (
                      <Text style={styles.menuName}>
                        {item.menuName}
                      </Text>
                    )}
                    {item.itemType && (
                      <Text style={styles.itemType}>
                        {item.itemType}
                      </Text>
                    )}
                  </View>
                  
                  <View style={styles.itemControls}>
                    {item.isOverdue && (
                      <View style={styles.itemOverdueIndicator}>
                        <Text style={styles.overdueText}>!</Text>
                      </View>
                    )}
                    
                    {/* Contrôles individuels si la fonction est fournie */}
                    {onIndividualItemStatusChange && (
                      <View style={styles.itemStatusControls}>
                        <Button
                          variant="outline"
                          size="xs"
                          disabled={!canGoBack}
                          onPress={handleItemStatusBack}
                          style={[
                            styles.itemStatusButton,
                            !canGoBack && styles.disabledButton
                          ]}
                        >
                          <ArrowLeft size={12} color={canGoBack ? "#374151" : "#D1D5DB"} />
                        </Button>

                        <Button
                          variant="outline"
                          size="xs"
                          disabled={!canGoForward}
                          onPress={handleItemStatusForward}
                          style={[
                            styles.itemStatusButton,
                            !canGoForward && styles.disabledButton
                          ]}
                        >
                          <ArrowRight size={12} color={canGoForward ? "#374151" : "#D1D5DB"} />
                        </Button>
                      </View>
                    )}
                  </View>
                </View>
              );
            })}
          </View>
        )}
      </View>

      {/* Boutons de contrôle de statut */}
      <View style={styles.statusControls}>
        <Button
          variant="outline"
          size="sm"
          disabled={!canGoBack}
          onPress={handleStatusBack}
          style={[
            styles.statusButton,
            !canGoBack && styles.disabledButton
          ]}
        >
          <ArrowLeft size={16} color={canGoBack ? "#374151" : "#D1D5DB"} />
        </Button>

        <View style={[
          styles.statusBadge,
          { backgroundColor: getStatusColor(itemGroup.status) }
        ]}>
          <Text style={styles.statusText}>
            {getStatusText(itemGroup.status)}
          </Text>
        </View>

        <Button
          variant="outline"
          size="sm"
          disabled={!canGoForward}
          onPress={handleStatusForward}
          style={[
            styles.statusButton,
            !canGoForward && styles.disabledButton
          ]}
        >
          <ArrowRight size={16} color={canGoForward ? "#374151" : "#D1D5DB"} />
        </Button>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  overdueCard: {
    borderColor: '#F59E0B',
    borderWidth: 2,
    backgroundColor: '#FFFBF0',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  orderInfo: {
    flex: 1,
  },
  orderNumber: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 2,
  },
  tableName: {
    fontSize: 14,
    color: '#6B7280',
  },
  headerRight: {
    alignItems: 'flex-end',
    flexDirection: 'row',
    gap: 8,
  },
  timestamp: {
    fontSize: 12,
    color: '#9CA3AF',
  },
  overdueIndicator: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#F59E0B',
    alignItems: 'center',
    justifyContent: 'center',
  },
  overdueText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  itemsContainer: {
    marginBottom: 16,
  },
  itemsSummary: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  itemsCount: {
    fontSize: 14,
    color: '#374151',
    fontWeight: '500',
  },
  expandedItems: {
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  itemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 6,
  },
  itemInfo: {
    flex: 1,
  },
  itemName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 2,
  },
  menuName: {
    fontSize: 12,
    color: '#7C3AED',
    fontWeight: '500',
    marginBottom: 1,
  },
  itemType: {
    fontSize: 11,
    color: '#9CA3AF',
  },
  itemOverdueIndicator: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#F59E0B',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  itemControls: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  itemStatusControls: {
    flexDirection: 'row',
    gap: 4,
  },
  itemStatusButton: {
    minWidth: 28,
    height: 28,
    borderRadius: 6,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 6,
  },
  statusControls: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  statusButton: {
    minWidth: 40,
    height: 40,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  disabledButton: {
    opacity: 0.3,
  },
  statusBadge: {
    flex: 1,
    marginHorizontal: 12,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    alignItems: 'center',
  },
  statusText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
});