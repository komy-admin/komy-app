import { View, Text, Pressable, ScrollView } from 'react-native';
import { ChevronDown, ChevronUp, Wine, UtensilsCrossed, Soup, Dessert, Trash2, Settings, Menu } from 'lucide-react-native';
import { useState, useEffect, useMemo, useCallback } from 'react';
import * as Haptics from 'expo-haptics';
import { ItemType } from '~/types/item-type.types';
import { OrderLine, OrderLineType, OrderLineItem } from '~/types/order-line.types';
import { Status } from '~/types/status.enum';
import { DateFormat, formatDate, getMostImportantStatus, getStatusColor, getStatusTagColor, getStatusText, getBorderStyle, hasMenuMixedStatuses } from '~/lib/utils';
import { Order } from '~/types/order.types';
import { DeleteConfirmationModal } from '~/components/ui/DeleteConfirmationModal';
import StatusSelector from './StatusSelector';
import { useOrderLines } from '~/hooks/useOrderLines';
import { useOrders } from '~/hooks/useOrders';
import { useMenus } from '~/hooks/useMenus';
import { restaurantActions } from '~/store/restaurant';
import { useDispatch } from 'react-redux';
import { useToast } from '~/components/ToastProvider';

interface AdminOrderLinesGroupProps {
  itemType: ItemType;
  status: Status;
  orderLines: OrderLine[];
  isExpanded: boolean;
  onToggle: () => void;
  onDeleteOrderLine: (orderLineId: string) => void;
  onUpdateOrderLineStatus?: (orderLines: OrderLine[], status: Status) => void;
  onDeleteGroup?: (orderLines: OrderLine[]) => void;
  groupId: string;
  isMenuOpen: boolean;
  onMenuOpenChange: (groupId: string | null) => void;
}

const getItemTypeIcon = (itemTypeName: string) => {
  switch (itemTypeName) {
    case 'Boissons':
      return <Wine size={24} color="#1A1A1A" strokeWidth={1.5} />;
    case 'Entrées':
      return <UtensilsCrossed size={24} color="#1A1A1A" strokeWidth={1.5} />;
    case 'Plats':
      return <Soup size={24} color="#1A1A1A" strokeWidth={1.5} />;
    case 'Desserts':
      return <Dessert size={24} color="#1A1A1A" strokeWidth={1.5} />;
    default:
      return <UtensilsCrossed size={24} color="#1A1A1A" strokeWidth={1.5} />;
  }
};

// Composant pour une ligne de commande individuelle avec options toujours visibles
const AdminOrderLineItem = ({
  orderLine,
  orderLineItem,
  onDelete,
  onUpdateStatus,
  isGroupMenuOpen = false,
  isFirstInCategory = false,
  isMenuItem = false
}: {
  orderLine?: OrderLine,
  orderLineItem?: OrderLineItem,
  onDelete?: () => void,
  onUpdateStatus?: (status: Status) => void,
  isGroupMenuOpen?: boolean,
  isFirstInCategory?: boolean,
  isMenuItem?: boolean
}) => {
  const [showStatusSelector, setShowStatusSelector] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDeleteItem = () => {
    setIsDeleting(true);
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    } catch (error) {
      // Haptic feedback non critique
    }

    try {
      onDelete?.();
    } catch (error) {
      console.error('Erreur dans onDelete:', error);
      setIsDeleting(false);
    }
  };

  const handleDeleteClick = () => {
    setShowConfirmDialog(true);
  };

  const handleStatusClick = () => {
    if (onUpdateStatus) {
      setShowStatusSelector(true);
    }
  };

  if (isDeleting) {
    return null; // Masquer le composant pendant la suppression
  }

  // Obtenir les données de l'item (OrderLine ou OrderLineItem)
  const itemName = orderLine?.item?.name || orderLineItem?.item?.name || 'Article inconnu';
  const itemNote = orderLine?.note || null;
  const itemStatus = orderLine?.status || orderLineItem?.status || Status.PENDING;
  const updatedAt = new Date().toISOString(); // OrderLine n'a pas de updatedAt, utiliser date actuelle

  // Calculer la hauteur dynamique basée sur le contenu
  const itemHeight = itemNote ? 75 : 56; // Plus haut si il y a un commentaire

  return (
    <View style={{
      flexDirection: 'row',
      backgroundColor: isMenuItem ? `${getStatusColor(itemStatus)}60` : 'white',
      borderTopWidth: isFirstInCategory ? 0 : 1,
      borderTopColor: '#E5E7EB',
      minHeight: itemHeight,
    }}>
      {/* Contenu principal de l'item */}
      <View style={{
        flex: 1,
        paddingVertical: 12,
        paddingLeft: 16,
        paddingRight: 8,
        justifyContent: 'center',
      }}>
        <View style={{ flex: 1, justifyContent: 'center' }}>
          {/* Nom, tag statut et heure sur la même ligne */}
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: itemNote ? 4 : 0 }}>
            <Text style={{ fontSize: 16, flex: 1, marginRight: 8 }}>{itemName}</Text>
            {/* Tag du statut */}
            <View style={{
              backgroundColor: getStatusTagColor(itemStatus),
              paddingHorizontal: 8,
              paddingVertical: 3,
              borderRadius: 12,
              marginRight: 8,
            }}>
              <Text style={{
                fontSize: 11,
                fontWeight: '600',
                color: '#1A1A1A'
              }}>
                {getStatusText(itemStatus)}
              </Text>
            </View>
            {/* Heure */}
            <Text style={{ fontSize: 12, color: '#666666' }}>
              {formatDate(updatedAt, DateFormat.TIME)}
            </Text>
          </View>
          {/* Commentaire sur une ligne séparée si présent */}
          {itemNote && (
            <Text style={{ fontSize: 14, color: '#666666', fontStyle: 'italic' }}>
              Commentaire : {itemNote}
            </Text>
          )}
        </View>
      </View>

      {/* Boutons d'action toujours visibles - s'étirent pour coller aux bords */}
      <View style={{ flexDirection: 'row', alignSelf: 'stretch' }}>
        {/* Bouton modification statut */}
        {onUpdateStatus && (
          <Pressable
            onPress={handleStatusClick}
            style={{
              backgroundColor: '#3B82F6',
              width: 60,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Settings size={18} color="white" strokeWidth={2} />
          </Pressable>
        )}

        {/* Bouton suppression - masqué pour les items de menu */}
        {!isMenuItem && onDelete && (
          <Pressable
            onPress={handleDeleteClick}
            style={{
              backgroundColor: '#EF4444',
              width: 60,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Trash2 size={18} color="white" strokeWidth={2} />
          </Pressable>
        )}
      </View>

      {/* StatusSelector */}
      {onUpdateStatus && (
        <StatusSelector
          visible={showStatusSelector}
          currentStatus={itemStatus}
          onClose={() => setShowStatusSelector(false)}
          onStatusSelect={(newStatus) => {
            setShowStatusSelector(false);
            onUpdateStatus(newStatus);
          }}
        />
      )}

      {/* Modal de confirmation de suppression */}
      <DeleteConfirmationModal
        isVisible={showConfirmDialog}
        onClose={() => setShowConfirmDialog(false)}
        onConfirm={() => {
          setShowConfirmDialog(false);
          handleDeleteItem();
        }}
        entityName={`"${itemName}"`}
        entityType="l'article"
        usePortal={true}
      />
    </View>
  );
};

// Composant pour afficher un menu avec le même style que les articles individuels
const AdminMenuOrderGroup = ({
  menuOrderGroup,
  menuInfo,
  orderItems,
  isExpanded,
  onToggle,
  onDelete,
  onDeleteOrderItem,
  onUpdateOrderItemStatus,
  groupId,
  isMenuOpen,
  onMenuOpenChange
}: {
  menuOrderGroup: any,
  menuInfo: any, // Info du menu depuis order.menus
  orderItems: any[], // OrderLineItems du menu
  isExpanded: boolean,
  onToggle: () => void,
  onDelete: () => void,
  onDeleteOrderItem: (orderLineId: string) => void,
  onUpdateOrderItemStatus?: (orderLines: any[], status: Status) => void,
  groupId: string,
  isMenuOpen: boolean,
  onMenuOpenChange: (groupId: string | null) => void
}) => {
  const statuses = orderItems.map((orderLineItem: any) => orderLineItem.status);
  const itemStatus = getMostImportantStatus(statuses); // Utilisation de la fonction générique
  const hasMixed = hasMenuMixedStatuses(statuses);

  const [showGroupConfirmDialog, setShowGroupConfirmDialog] = useState(false);
  const [showGroupStatusSelector, setShowGroupStatusSelector] = useState(false);

  const handleGroupDeleteClick = () => {
    setShowGroupConfirmDialog(true);
  };

  const handleGroupStatusClick = () => {
    if (onUpdateOrderItemStatus) {
      setShowGroupStatusSelector(true);
    }
  };

  const getGroupStyle = () => {
    const baseColor = getStatusColor(itemStatus);
    const borderStyle = getBorderStyle(statuses, baseColor);

    return {
      backgroundColor: hasMixed
        ? 'white' // Statuts mixtes : fond blanc
        : (isExpanded ? `${baseColor}20` : `${baseColor}80`), // Statut uniforme : couleur du statut
      borderRadius: 16,
      overflow: 'hidden' as const,
      ...borderStyle, // Application du style de bordure (normale ou épaisse)
    };
  };

  const getHeaderStyle = () => {
    const baseColor = getStatusColor(itemStatus);
    return {
      backgroundColor: isExpanded ? `${baseColor}20` : 'transparent',
      padding: 18,
      borderBottomWidth: isExpanded ? 1 : 0,
      borderBottomColor: isExpanded ? `${baseColor}30` : 'transparent',
    };
  };

  return (
    <View style={{ marginBottom: 12 }}>
      <View style={[getGroupStyle()]}>
        <View style={{ flexDirection: 'row', alignItems: 'center', minHeight: 84 }}>
          {/* Zone cliquable principale */}
          <Pressable
            onPress={onToggle}
            style={[getHeaderStyle(), { flex: 1 }]}
            android_ripple={{ color: `${getStatusColor(itemStatus)}40` }}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1, gap: 16 }}>
                <View style={{
                  backgroundColor: getStatusColor(itemStatus),
                  borderRadius: 24,
                  width: 48,
                  height: 48,
                  justifyContent: 'center',
                  alignItems: 'center',
                  shadowColor: '#000',
                  shadowOffset: {
                    width: 0,
                    height: 2,
                  },
                  shadowOpacity: 0.2,
                  shadowRadius: 4,
                  elevation: 4,
                }}>
                  <Menu size={24} color="#1A1A1A" strokeWidth={1.5} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{
                    fontSize: 18,
                    fontWeight: '700',
                    color: '#1A1A1A',
                    marginBottom: 2
                  }}>
                    Menu : {menuInfo?.name || 'Menu'}
                  </Text>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                    {/* Indicateur de statuts mixtes */}
                    {hasMixed && (
                      <View style={{
                        backgroundColor: getStatusTagColor(itemStatus),
                        borderRadius: 6,
                        paddingHorizontal: 8,
                        paddingVertical: 4,
                      }}>
                        <Text style={{ fontSize: 10, color: '#1A1A1A', fontWeight: '600' }}>
                          STATUTS MIXTES
                        </Text>
                      </View>
                    )}
                    {/* Afficher le tag de statut global seulement si pas de statuts mixtes */}
                    {!hasMixed && (
                      <View style={{
                        backgroundColor: getStatusTagColor(itemStatus),
                        paddingHorizontal: 8,
                        paddingVertical: 3,
                        borderRadius: 12,
                      }}>
                        <Text style={{
                          fontSize: 12,
                          fontWeight: '600',
                          color: '#1A1A1A'
                        }}>
                          {itemStatus ? getStatusText(itemStatus) : 'Aucun statut'}
                        </Text>
                      </View>
                    )}
                    <Text style={{
                      fontSize: 13,
                      color: '#666666',
                      fontWeight: '500'
                    }}>
                      {orderItems.length} article{orderItems.length > 1 ? 's' : ''}
                    </Text>
                  </View>
                </View>
              </View>

              {/* Chevron */}
              {isExpanded ? (
                <ChevronUp size={20} color="#1A1A1A" strokeWidth={2.5} />
              ) : (
                <ChevronDown size={20} color="#1A1A1A" strokeWidth={2.5} />
              )}
            </View>
          </Pressable>

          {/* Boutons d'action sans padding (masqués quand ouvert) */}
          {!isExpanded && (
            <View style={{ flexDirection: 'row', alignSelf: 'stretch', height: '100%' }}>
              {/* Bouton modification statut du groupe */}
              {onUpdateOrderItemStatus && (
                <Pressable
                  onPress={handleGroupStatusClick}
                  style={{
                    backgroundColor: '#3B82F6',
                    width: 60,
                    alignItems: 'center',
                    justifyContent: 'center',
                    alignSelf: 'stretch',
                  }}
                >
                  <Settings size={20} color="white" strokeWidth={2} />
                </Pressable>
              )}

              {/* Bouton suppression du groupe */}
              <Pressable
                onPress={handleGroupDeleteClick}
                style={{
                  backgroundColor: '#EF4444',
                  width: 60,
                  alignItems: 'center',
                  justifyContent: 'center',
                  alignSelf: 'stretch',
                }}
              >
                <Trash2 size={20} color="white" strokeWidth={2} />
              </Pressable>
            </View>
          )}
        </View>

        {isExpanded && (
          <View style={{
            backgroundColor: '#FAFBFC',
          }}>
            {/* Grouper les items par type d'item */}
            {(() => {
              // Grouper les orderItems par type d'item
              const itemsByCategory = orderItems.reduce((acc, orderLineItem) => {
                const categoryName = orderLineItem.item.itemType.name;
                if (!acc[categoryName]) {
                  acc[categoryName] = [];
                }
                acc[categoryName].push(orderLineItem);
                return acc;
              }, {} as Record<string, any[]>);

              return Object.entries(itemsByCategory).map(([categoryName, categoryItems]) => (
                <View key={categoryName}>
                  {/* Header de catégorie */}
                  <View style={{
                    backgroundColor: '#E5E7EB',
                    paddingHorizontal: 16,
                    paddingVertical: 10,
                  }}>
                    <Text style={{
                      fontSize: 14,
                      fontWeight: '700',
                      color: '#1F2937',
                    }}>
                      {categoryName}
                    </Text>
                  </View>

                  {/* Items de la catégorie */}
                  {(categoryItems as any[]).map((orderLineItem: any, index: number) => (
                    <AdminOrderLineItem
                      key={orderLineItem.id}
                      orderLineItem={orderLineItem}
                      onDelete={() => onDeleteOrderItem(orderLineItem.id)}
                      onUpdateStatus={onUpdateOrderItemStatus ? (newStatus) => onUpdateOrderItemStatus([orderLineItem], newStatus) : undefined}
                      isGroupMenuOpen={isMenuOpen}
                      isFirstInCategory={index === 0}
                      isMenuItem={true}
                    />
                  ))}
                </View>
              ));
            })()}
          </View>
        )}
      </View>

      <DeleteConfirmationModal
        isVisible={showGroupConfirmDialog}
        onClose={() => setShowGroupConfirmDialog(false)}
        onConfirm={() => {
          setShowGroupConfirmDialog(false);
          onDelete();
        }}
        entityName={`"${menuInfo?.name || 'Menu'}" (${orderItems.length} article${orderItems.length > 1 ? 's' : ''})`}
        entityType="le menu"
        usePortal={true}
      />

      {/* StatusSelector pour le groupe */}
      {onUpdateOrderItemStatus && itemStatus && (
        <StatusSelector
          visible={showGroupStatusSelector}
          currentStatus={itemStatus}
          onClose={() => setShowGroupStatusSelector(false)}
          onStatusSelect={(newStatus) => {
            setShowGroupStatusSelector(false);
            onUpdateOrderItemStatus(orderItems, newStatus);
          }}
        />
      )}
    </View>
  );
};

const AdminOrderItemsGroup = ({
  itemType,
  status,
  orderItems,
  isExpanded,
  onToggle,
  onDeleteOrderItem,
  onUpdateOrderItemStatus,
  onDeleteGroup,
  groupId,
  isMenuOpen,
  onMenuOpenChange
}: {
  itemType: ItemType;
  status: Status;
  orderItems: OrderLine[];
  isExpanded: boolean;
  onToggle: () => void;
  onDeleteOrderItem: (orderLineId: string) => void;
  onUpdateOrderItemStatus?: (orderLines: OrderLine[], status: Status) => void;
  onDeleteGroup?: (orderLines: OrderLine[]) => void;
  groupId: string;
  isMenuOpen: boolean;
  onMenuOpenChange: (groupId: string | null) => void;
}) => {
  const itemStatus = getMostImportantStatus(orderItems.map((orderLine: OrderLine) => orderLine.status || Status.PENDING));
  const [showGroupConfirmDialog, setShowGroupConfirmDialog] = useState(false);
  const [showGroupStatusSelector, setShowGroupStatusSelector] = useState(false);

  const handleGroupDeleteClick = () => {
    if (onDeleteGroup) {
      setShowGroupConfirmDialog(true);
    }
  };

  const handleGroupStatusClick = () => {
    if (onUpdateOrderItemStatus) {
      setShowGroupStatusSelector(true);
    }
  };

  const getGroupStyle = () => {
    const baseColor = getStatusColor(itemStatus);
    const statuses = orderItems.map(orderItem => orderItem.status || Status.PENDING);
    const borderStyle = getBorderStyle(statuses, baseColor);

    return {
      backgroundColor: isExpanded ? 'white' : `${baseColor}80`,
      borderRadius: 16,
      overflow: 'hidden' as const,
      ...borderStyle,
    };
  };

  const getHeaderStyle = () => {
    const baseColor = getStatusColor(itemStatus);
    return {
      backgroundColor: isExpanded ? `${baseColor}20` : 'transparent',
      padding: 18,
      borderBottomWidth: isExpanded ? 1 : 0,
      borderBottomColor: isExpanded ? `${baseColor}30` : 'transparent',
    };
  };

  return (
    <View style={{ marginBottom: 12 }}>
      <View style={[getGroupStyle()]}>
        <View style={{ flexDirection: 'row', alignItems: 'center', minHeight: 84 }}>
          {/* Zone cliquable principale */}
          <Pressable
            onPress={onToggle}
            style={[getHeaderStyle(), { flex: 1 }]}
            android_ripple={{ color: `${getStatusColor(itemStatus)}40` }}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1, gap: 16 }}>
                <View style={{
                  backgroundColor: getStatusColor(itemStatus),
                  borderRadius: 24,
                  width: 48,
                  height: 48,
                  justifyContent: 'center',
                  alignItems: 'center',
                  shadowColor: '#000',
                  shadowOffset: {
                    width: 0,
                    height: 2,
                  },
                  shadowOpacity: 0.2,
                  shadowRadius: 4,
                  elevation: 4,
                }}>
                  {getItemTypeIcon(itemType.name)}
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{
                    fontSize: 18,
                    fontWeight: '700',
                    color: '#1A1A1A',
                    marginBottom: 2
                  }}>
                    {itemType.name}
                  </Text>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                    <View style={{
                      backgroundColor: getStatusTagColor(itemStatus),
                      paddingHorizontal: 8,
                      paddingVertical: 3,
                      borderRadius: 12,
                    }}>
                      <Text style={{
                        fontSize: 12,
                        fontWeight: '600',
                        color: '#1A1A1A'
                      }}>
                        {itemStatus ? getStatusText(itemStatus) : 'Aucun statut'}
                      </Text>
                    </View>
                    <Text style={{
                      fontSize: 13,
                      color: '#666666',
                      fontWeight: '500'
                    }}>
                      {orderItems.length} article{orderItems.length > 1 ? 's' : ''}
                    </Text>
                  </View>
                </View>
              </View>

              {/* Chevron */}
              {isExpanded ? (
                <ChevronUp size={20} color="#1A1A1A" strokeWidth={2.5} />
              ) : (
                <ChevronDown size={20} color="#1A1A1A" strokeWidth={2.5} />
              )}
            </View>
          </Pressable>

          {/* Boutons d'action sans padding (masqués quand ouvert) */}
          {!isExpanded && (
            <View style={{ flexDirection: 'row', alignSelf: 'stretch', height: '100%' }}>
              {/* Bouton modification statut du groupe */}
              {onUpdateOrderItemStatus && (
                <Pressable
                  onPress={handleGroupStatusClick}
                  style={{
                    backgroundColor: '#3B82F6',
                    width: 60,
                    alignItems: 'center',
                    justifyContent: 'center',
                    alignSelf: 'stretch',
                  }}
                >
                  <Settings size={20} color="white" strokeWidth={2} />
                </Pressable>
              )}

              {/* Bouton suppression du groupe */}
              {onDeleteGroup && (
                <Pressable
                  onPress={handleGroupDeleteClick}
                  style={{
                    backgroundColor: '#EF4444',
                    width: 60,
                    alignItems: 'center',
                    justifyContent: 'center',
                    alignSelf: 'stretch',
                  }}
                >
                  <Trash2 size={20} color="white" strokeWidth={2} />
                </Pressable>
              )}
            </View>
          )}
        </View>

        {isExpanded && (
          <View style={{
            backgroundColor: '#FAFBFC',
          }}>
            {orderItems.map((orderLine: any, index: number) => (
              <View key={orderLine.id} style={{
                backgroundColor: index % 2 === 0 ? 'white' : '#F8F9FA'
              }}>
                <AdminOrderLineItem
                  orderLine={orderLine}
                  onDelete={() => onDeleteOrderItem(orderLine.id)}
                  onUpdateStatus={onUpdateOrderItemStatus ? (newStatus) => onUpdateOrderItemStatus([orderLine], newStatus) : undefined}
                  isGroupMenuOpen={false}
                />
              </View>
            ))}
          </View>
        )}
      </View>

      {/* Modals */}
      <DeleteConfirmationModal
        isVisible={showGroupConfirmDialog}
        onClose={() => setShowGroupConfirmDialog(false)}
        onConfirm={() => {
          setShowGroupConfirmDialog(false);
          onDeleteGroup?.(orderItems);
        }}
        entityName={`"${itemType.name}" (${orderItems.length} article${orderItems.length > 1 ? 's' : ''})`}
        entityType="le groupe"
        usePortal={true}
      />

      {onUpdateOrderItemStatus && itemStatus && (
        <StatusSelector
          visible={showGroupStatusSelector}
          currentStatus={itemStatus}
          onClose={() => setShowGroupStatusSelector(false)}
          onStatusSelect={(newStatus) => {
            setShowGroupStatusSelector(false);
            onUpdateOrderItemStatus(orderItems, newStatus);
          }}
        />
      )}
    </View>
  );

};

interface AdminOrderDetailViewProps {
  order: Order;
  itemTypes: ItemType[];
  onDeleteOrderItem: (orderLineId: string) => void;
  onDeleteManyOrderItems?: (orderLineIds: string[]) => Promise<{ deletedCount: number; deletedIds: string[] }>;
  onUpdateOrderItemStatus?: (orderLines: OrderLine[], status: Status) => void;
}

export default function AdminOrderDetailView({ order, itemTypes, onDeleteOrderItem, onDeleteManyOrderItems, onUpdateOrderItemStatus }: AdminOrderDetailViewProps) {
  const [expandedGroups, setExpandedGroups] = useState<string[]>([]);
  const [openGroupMenuId, setOpenGroupMenuId] = useState<string | null>(null);

  // Hooks pour les menus et UI
  const dispatch = useDispatch();
  const { showToast } = useToast();
  const { activeMenus, loadAllMenus } = useMenus();
  const { updateOrderLineItemsStatus } = useOrders();

  // Si les menus ne sont pas chargés, les charger
  useEffect(() => {
    if (activeMenus.length === 0) {
      loadAllMenus();
    }
  }, [activeMenus, loadAllMenus]);

  // OPTIMISÉ : Callback memoized pour éviter re-renders
  const toggleExpanded = useCallback((groupId: string) => {
    setExpandedGroups(prev =>
      prev.includes(groupId)
        ? prev.filter(id => id !== groupId)
        : [...prev, groupId]
    );
  }, []);

  // OPTIMISÉ : Memoization du groupement coûteux
  const groupedItems = useMemo(() => {
    // Récupérer toutes les OrderLines de type ITEM
    const individualItems = (order.lines || []).filter((line: OrderLine) => line.type === OrderLineType.ITEM);

    if (individualItems.length === 0) return [];

    const groups: Array<{
      id: string;
      itemType: ItemType;
      status: Status;
      orderItems: OrderLine[];
    }> = [];

    // Grouper d'abord par itemType, puis par statut
    const itemTypeGroups: Record<string, OrderLine[]> = {};

    individualItems.forEach(line => {
      const itemTypeId = line.item?.itemType.id;
      if (itemTypeId) {
        if (!itemTypeGroups[itemTypeId]) {
          itemTypeGroups[itemTypeId] = [];
        }
        itemTypeGroups[itemTypeId].push(line);
      }
    });

    // Pour chaque itemType, créer des groupes par statut
    Object.entries(itemTypeGroups).forEach(([itemTypeId, itemsOfType]) => {
      // Récupérer les infos du premier item pour l'itemType
      const itemTypeInfo = itemsOfType[0]?.item?.itemType

      // Grouper par statut au sein de ce type
      const statusGroups = itemsOfType.reduce((acc, line) => {
        const status = line.status || Status.PENDING;
        if (!acc[status]) {
          acc[status] = [];
        }
        acc[status].push(line);
        return acc;
      }, {} as Record<Status, OrderLine[]>);

      // Créer un groupe pour chaque combinaison itemType + statut
      Object.entries(statusGroups).forEach(([status, orderLines]) => {
        groups.push({
          id: `${itemTypeId}-${status}`,
          itemType: itemTypeInfo as ItemType,
          status: status as Status,
          orderItems: orderLines
        });
      });
    });

    // Trier les groupes : d'abord par itemType, puis par priorité de statut
    const getStatusPriority = (status: Status): number => {
      const statusOrder = [Status.TERMINATED, Status.DRAFT, Status.INPROGRESS, Status.PENDING, Status.READY, Status.SERVED, Status.ERROR];
      return statusOrder.indexOf(status);
    };

    return groups.sort((a, b) => {
      // D'abord trier par nom de type d'item
      const typeComparison = a.itemType.name.localeCompare(b.itemType.name);
      if (typeComparison !== 0) return typeComparison;

      // Puis par priorité de statut au sein du même type
      const aPriority = getStatusPriority(a.status);
      const bPriority = getStatusPriority(b.status);
      return aPriority - bPriority;
    });
  }, [order.lines]); // Dépendances optimisées

  const RootComponent = View;

  return (
    <RootComponent style={{ flex: 1 }}>
      <ScrollView
        style={{ flex: 1, padding: 16 }}
        showsVerticalScrollIndicator={true}
        bounces={true}
        scrollEventThrottle={16}
        keyboardShouldPersistTaps="handled"
        removeClippedSubviews={true} // OPTIMISÉ : Activer pour grandes listes
        scrollEnabled={true}
        nestedScrollEnabled={true}
        // Optimisations pour la gestion des gestes
        directionalLockEnabled={true}
        // Priorité au scroll vertical sur tablette
        alwaysBounceVertical={true}
        // OPTIMISATIONS AJOUTÉES :
        decelerationRate="normal" // Meilleure expérience scroll
        maintainVisibleContentPosition={{
          minIndexForVisible: 0,
          autoscrollToTopThreshold: 10
        }} // Maintien position lors des updates
      >
        {(() => {
          // Vérifier s'il y a des menus dans les OrderLines
          const menuLines = (order.lines || []).filter((line: OrderLine) => line.type === OrderLineType.MENU);
          const hasMenus = menuLines.length > 0;
          const hasIndividualItems = groupedItems && groupedItems.length > 0;


          return (
            <>
              {/* Section Menus */}
              {hasMenus && (
                <>
                  <View style={{ marginBottom: 16 }}>
                    <Text style={{
                      fontSize: 20,
                      fontWeight: '700',
                      color: '#1A1A1A',
                      marginBottom: 12
                    }}>
                      🍽️ Menus
                    </Text>
                  </View>

                  {/* Affichage des menus avec le style original */}
                  {menuLines.map((menuLine: OrderLine) => (
                    <AdminMenuOrderGroup
                      key={menuLine.id}
                      menuOrderGroup={menuLine}
                      menuInfo={menuLine.menu}
                      orderItems={menuLine.items || []}
                      isExpanded={expandedGroups.includes(`menu-${menuLine.id}`)}
                      onToggle={() => {
                        // Fermer tout menu ouvert avant de toggle
                        setOpenGroupMenuId(null);
                        toggleExpanded(`menu-${menuLine.id}`);
                      }}
                      onDelete={async () => {
                        // TODO: Implémenter la suppression du menu complet
                        showToast('Suppression du menu non implémentée', 'info');
                      }}
                      onDeleteOrderItem={onDeleteOrderItem}
                      onUpdateOrderItemStatus={onUpdateOrderItemStatus ? async (orderLines: any[], newStatus: Status) => {
                        // Pour les items de menu, utiliser la nouvelle API spécialisée
                        try {
                          const orderLineIds = orderLines.map(ol => ol.id);
                          await updateOrderLineItemsStatus(order.id, orderLineIds, newStatus);
                          showToast('Statut mis à jour avec succès.', 'success');
                        } catch (error) {
                          console.error('Erreur lors de la mise à jour du statut:', error);
                          showToast('Erreur lors de la mise à jour du statut.', 'error');
                        }
                      } : undefined}
                      groupId={`menu-${menuLine.id}`}
                      isMenuOpen={openGroupMenuId === `menu-${menuLine.id}`}
                      onMenuOpenChange={setOpenGroupMenuId}
                    />
                  ))}
                </>
              )}

              {/* Section Articles Individuels */}
              {hasIndividualItems && (
                <>
                  {hasMenus && <View style={{ height: 24 }} />}
                  <View style={{ marginBottom: 16 }}>
                    <Text style={{
                      fontSize: 20,
                      fontWeight: '700',
                      color: '#1A1A1A',
                      marginBottom: 12
                    }}>
                      📋 Articles individuels
                    </Text>
                  </View>
                </>
              )}

              {/* Affichage des groupes d'items individuels */}
              {groupedItems.map((group: { id: string; itemType: ItemType; status: Status; orderItems: OrderLine[] }) => (
                <AdminOrderItemsGroup
                  key={group.id}
                  itemType={group.itemType}
                  status={group.status}
                  orderItems={group.orderItems}
                  isExpanded={expandedGroups.includes(group.id)}
                  onToggle={() => {
                    // Fermer tout menu ouvert avant de toggle
                    setOpenGroupMenuId(null);
                    toggleExpanded(group.id);
                  }}
                  onDeleteOrderItem={onDeleteOrderItem}
                  onUpdateOrderItemStatus={onUpdateOrderItemStatus}
                  onDeleteGroup={async (orderLines: OrderLine[]) => {
                    // Utiliser l'API de suppression en lot si disponible, sinon fallback vers les appels individuels
                    if (onDeleteManyOrderItems) {
                      const orderLineIds = orderLines.map((orderLine: OrderLine) => orderLine.id);
                      await onDeleteManyOrderItems(orderLineIds);
                    } else {
                      // Fallback: supprimer tous les éléments du groupe en parallèle
                      const deletePromises = orderLines.map((orderLine: OrderLine) =>
                        Promise.resolve(onDeleteOrderItem(orderLine.id))
                      );
                      await Promise.all(deletePromises);
                    }

                  }}
                  groupId={group.id}
                  isMenuOpen={openGroupMenuId === group.id}
                  onMenuOpenChange={setOpenGroupMenuId}
                />
              ))}
            </>
          );
        })()}
        <View style={{ height: 20 }} />
      </ScrollView>
    </RootComponent>
  );
}