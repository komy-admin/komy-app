import { useState } from "react";
import { TouchableOpacity, View, StyleSheet } from "react-native";
import { Status } from "~/types/status.enum";
import { Text } from "../ui";
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
    status?: Status;
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
    <TouchableOpacity 
      style={[
        styles.card,
        itemGroup.isOverdue && styles.overdueCard
      ]}
      onPress={() => setIsExpanded(!isExpanded)}
      activeOpacity={0.95}
    >
      {/* En-tête de la carte - Style OrderCard */}
      <View style={styles.cardHeader}>
        <View style={styles.orderInfo}>
          <Text style={styles.orderId}>{itemGroup.orderNumber}</Text>
          <Text style={styles.itemCount}>
            {itemGroup.items.length} article{itemGroup.items.length > 1 ? 's' : ''}
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

      {/* Corps de la carte - Style OrderCard */}
      <View style={styles.cardBody}>
        <View style={styles.tableInfo}>
          <Text style={styles.tableName}>
            Table {itemGroup.tableName}
          </Text>
          <Text style={styles.orderTime}>
            Commande lancée à {formatDate(itemGroup.createdAt, DateFormat.TIME)}
          </Text>
          {itemGroup.isOverdue && (
            <View style={styles.overdueIndicator}>
              <Text style={styles.overdueText}>RETARD</Text>
            </View>
          )}
        </View>
      </View>

      {/* Contenu expansible - Style OrderCard */}
      {isExpanded && (
        <View style={styles.expandedContent}>
          <View style={styles.divider} />
          <View style={styles.itemGroup}>
            <View style={styles.groupHeader}>
              <Text style={styles.groupName}>Détails des articles</Text>
              <View style={[styles.statusBadge, { backgroundColor: getStatusColor(itemGroup.status) }]}>
                <Text style={styles.statusText}>{getStatusText(itemGroup.status)}</Text>
              </View>
            </View>
            
            <View style={styles.itemsList}>
              {itemGroup.items.map((item) => {
                return (
                  <View key={item.id} style={styles.orderItem}>
                    {/* Zone gauche - Bouton précédent */}
                    <View style={styles.leftButtonZone}>
                      {itemGroup.status !== Status.PENDING && (item.status === Status.INPROGRESS || item.status === Status.READY || item.status === Status.PENDING || !item.status) && (
                        <TouchableOpacity
                          onPress={(e) => {
                            e.stopPropagation();
                            if (onIndividualItemStatusChange) {
                              const newStatus = STATUS_ORDER[STATUS_ORDER.indexOf(itemGroup.status) - 1];
                              onIndividualItemStatusChange(item, newStatus);
                            }
                          }}
                          style={[styles.itemActionButton, styles.itemPreviousButton]}
                          activeOpacity={0.7}
                        >
                          <ArrowLeft size={14} color="#6B7280" />
                        </TouchableOpacity>
                      )}
                    </View>
                    
                    {/* Zone centrale - Texte */}
                    <View style={styles.itemDetails}>
                      <Text style={[
                        styles.itemName,
                        item.isOverdue && { color: '#DC2626', fontWeight: '700' }
                      ]}>
                        {item.itemName}
                      </Text>
                      {(item.type === 'MENU_ITEM' && item.menuName) || item.itemType ? (
                        <Text style={[
                          styles.itemNote,
                          item.isOverdue && { color: '#DC2626', fontWeight: '600' }
                        ]}>
                          {[
                            item.type === 'MENU_ITEM' && item.menuName ? `Menu: ${item.menuName}` : null,
                            item.itemType || null
                          ].filter(Boolean).join(' - ')}
                        </Text>
                      ) : null}
                    </View>
                    
                    {/* Zone droite - Bouton suivant */}
                    <View style={styles.rightButtonZone}>
                      {itemGroup.status !== Status.READY && (item.status === Status.PENDING || item.status === Status.INPROGRESS || !item.status) && (
                        <TouchableOpacity
                          onPress={(e) => {
                            e.stopPropagation();
                            if (onIndividualItemStatusChange) {
                              const newStatus = STATUS_ORDER[STATUS_ORDER.indexOf(itemGroup.status) + 1];
                              onIndividualItemStatusChange(item, newStatus);
                            }
                          }}
                          style={[styles.itemActionButton, styles.itemNextButton]}
                          activeOpacity={0.7}
                        >
                          <ArrowRight size={14} color="#FFFFFF" />
                        </TouchableOpacity>
                      )}
                    </View>
                  </View>
                );
              })}
            </View>
            
            {/* Boutons de contrôle de statut au niveau groupe */}
            <View style={styles.buttonContainer}>
              {(itemGroup.status === Status.INPROGRESS || itemGroup.status === Status.READY) && (
                <TouchableOpacity
                  onPress={(e) => {
                    e.stopPropagation();
                    handleStatusBack();
                  }}
                  style={[styles.actionButton, styles.previousButton]}
                  activeOpacity={0.7}
                >
                  <ArrowLeft size={18} color="#6B7280" />
                </TouchableOpacity>
              )}
              {(itemGroup.status === Status.PENDING || itemGroup.status === Status.INPROGRESS) && (
                <TouchableOpacity
                  onPress={(e) => {
                    e.stopPropagation();
                    handleStatusForward();
                  }}
                  style={[styles.actionButton, styles.nextButton]}
                  activeOpacity={0.7}
                >
                  <ArrowRight size={18} color="#FFFFFF" />
                </TouchableOpacity>
              )}
            </View>
          </View>
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
  overdueIndicator: {
    backgroundColor: '#DC2626',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    marginTop: 4,
    alignSelf: 'flex-start',
  },
  overdueText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '700',
    textTransform: 'uppercase',
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
  },
  orderItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  leftButtonZone: {
    width: 32,
    alignItems: 'flex-start',
  },
  rightButtonZone: {
    width: 32,
    alignItems: 'flex-end',
  },
  itemDetails: {
    flex: 1,
    alignItems: 'center',
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
  itemActionButton: {
    width: 28,
    height: 28,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 1,
    elevation: 1,
  },
  itemPreviousButton: {
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  itemNextButton: {
    backgroundColor: '#2A2E33',
  },
});