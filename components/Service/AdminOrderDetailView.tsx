import { View, Text, Pressable, ScrollView } from 'react-native';
import { ChevronDown, ChevronUp, Wine, UtensilsCrossed, Soup, Dessert, Trash2, Settings, Menu } from 'lucide-react-native';
import { useState, useEffect, useMemo, useCallback } from 'react';
import * as Haptics from 'expo-haptics';
import { ItemType } from '~/types/item-type.types';
import { OrderItem } from '~/types/order-item.types';
import { Status } from '~/types/status.enum';
import { DateFormat, formatDate, getMostImportantStatus, getStatusColor, getStatusTagColor, getStatusText, getMenuBorderStyle, hasMenuMixedStatuses } from '~/lib/utils';
import { Order } from '~/types/order.types';
import { DeleteConfirmationModal } from '~/components/ui/DeleteConfirmationModal';
import StatusSelector from './StatusSelector';
import { useMenuOrderGroups } from '~/hooks/useMenuOrderGroups';
import { useMenus } from '~/hooks/useMenus';
import { restaurantActions } from '~/store/restaurant';
import { menuOrderGroupApiService } from '~/api/menu-order-group.api';
import { useDispatch } from 'react-redux';
import { useToast } from '~/components/ToastProvider';

interface AdminOrderItemsGroupProps {
  itemType: ItemType;
  status: Status;
  orderItems: OrderItem[];
  isExpanded: boolean;
  onToggle: () => void;
  onDeleteOrderItem: (orderItemId: string) => void;
  onUpdateOrderItemStatus?: (orderItems: OrderItem[], status: Status) => void;
  onDeleteGroup?: (orderItems: OrderItem[]) => void;
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

// Composant pour un élément de commande individuel avec options toujours visibles
const AdminOrderItem = ({ 
  orderItem, 
  onDelete, 
  onUpdateStatus,
  isGroupMenuOpen = false,
  isFirstInCategory = false,
  isMenuItem = false
}: { 
  orderItem: OrderItem, 
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

  // Calculer la hauteur dynamique basée sur le contenu
  const itemHeight = orderItem.note ? 75 : 56; // Plus haut si il y a un commentaire

  return (
    <View style={{ 
      flexDirection: 'row', 
      backgroundColor: isMenuItem ? `${getStatusColor(orderItem.status)}60` : 'white',
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
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: orderItem.note ? 4 : 0 }}>
            <Text style={{ fontSize: 16, flex: 1, marginRight: 8 }}>{orderItem.item.name}</Text>
            {/* Tag du statut */}
            <View style={{
              backgroundColor: getStatusTagColor(orderItem.status),
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
                {getStatusText(orderItem.status)}
              </Text>
            </View>
            {/* Heure */}
            <Text style={{ fontSize: 12, color: '#666666' }}>
              {formatDate(orderItem.updatedAt, DateFormat.TIME)}
            </Text>
          </View>
          {/* Commentaire sur une ligne séparée si présent */}
          {orderItem.note && (
            <Text style={{ fontSize: 14, color: '#666666', fontStyle: 'italic' }}>
              Commentaire : {orderItem.note}
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
          currentStatus={orderItem.status}
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
        entityName={`"${orderItem.item.name}"`}
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
  orderItems: OrderItem[],
  isExpanded: boolean,
  onToggle: () => void,
  onDelete: () => void,
  onDeleteOrderItem: (orderItemId: string) => void,
  onUpdateOrderItemStatus?: (orderItems: OrderItem[], status: Status) => void,
  groupId: string,
  isMenuOpen: boolean,
  onMenuOpenChange: (groupId: string | null) => void
}) => {
  const statuses = orderItems.map(orderItem => orderItem.status);
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
    const borderStyle = getMenuBorderStyle(statuses, baseColor);
    
    return {
      backgroundColor: hasMixed 
        ? 'white' // Statuts mixtes : fond blanc
        : (isExpanded ? `${baseColor}20` : `${baseColor}80`), // Statut uniforme : couleur du statut
      borderRadius: 16,
      overflow: 'hidden' as const,
      ...borderStyle, // Application du style de bordure (normale ou épaisse)
      shadowColor: '#000',
      shadowOffset: {
        width: 0,
        height: 2,
      },
      shadowOpacity: isExpanded ? 0.15 : 0.08,
      shadowRadius: isExpanded ? 8 : 4,
      elevation: isExpanded ? 6 : 3,
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
                        borderWidth: 1,
                        borderColor: '#1A1A1A'
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
              const itemsByCategory = orderItems.reduce((acc, orderItem) => {
                const categoryName = orderItem.item.itemType.name;
                if (!acc[categoryName]) {
                  acc[categoryName] = [];
                }
                acc[categoryName].push(orderItem);
                return acc;
              }, {} as Record<string, OrderItem[]>);

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
                  {categoryItems.map((orderItem, index) => (
                    <AdminOrderItem
                      key={orderItem.id}
                      orderItem={orderItem}
                      onDelete={() => onDeleteOrderItem(orderItem.id)}
                      onUpdateStatus={onUpdateOrderItemStatus ? (newStatus) => onUpdateOrderItemStatus([orderItem], newStatus) : undefined}
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

const AdminOrderItemsGroup = ({ itemType, status, orderItems, isExpanded, onToggle, onDeleteOrderItem, onUpdateOrderItemStatus, onDeleteGroup, groupId, isMenuOpen, onMenuOpenChange }: AdminOrderItemsGroupProps) => {
  const itemStatus = getMostImportantStatus(orderItems.map(orderItem => orderItem.status));
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
    return {
      backgroundColor: isExpanded ? 'white' : `${baseColor}80`,
      borderRadius: 16,
      overflow: 'hidden' as const,
      borderWidth: 2,
      borderColor: isExpanded ? baseColor : 'transparent',
      shadowColor: '#000',
      shadowOffset: {
        width: 0,
        height: 2,
      },
      shadowOpacity: isExpanded ? 0.15 : 0.08,
      shadowRadius: isExpanded ? 8 : 4,
      elevation: isExpanded ? 6 : 3,
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
            {orderItems.map((orderItem, index) => (
              <View key={orderItem.id} style={{
                backgroundColor: index % 2 === 0 ? 'white' : '#F8F9FA'
              }}>
                <AdminOrderItem
                  orderItem={orderItem}
                  onDelete={() => onDeleteOrderItem(orderItem.id)}
                  onUpdateStatus={onUpdateOrderItemStatus ? (newStatus) => onUpdateOrderItemStatus([orderItem], newStatus) : undefined}
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
  onDeleteOrderItem: (orderItemId: string) => void;
  onDeleteManyOrderItems?: (orderItemIds: string[]) => Promise<{ deletedCount: number; deletedIds: string[] }>;
  onUpdateOrderItemStatus?: (orderItems: OrderItem[], status: Status) => void;
}

export default function AdminOrderDetailView({ order, itemTypes, onDeleteOrderItem, onDeleteManyOrderItems, onUpdateOrderItemStatus }: AdminOrderDetailViewProps) {
  const [expandedGroups, setExpandedGroups] = useState<string[]>([]);
  const [openGroupMenuId, setOpenGroupMenuId] = useState<string | null>(null);
  
  // Hooks pour les menus et UI
  const dispatch = useDispatch();
  const { showToast } = useToast();
  const { getMenuOrderGroupsWithItems } = useMenuOrderGroups();
  const { activeMenus, loadAllMenus } = useMenus();

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
    const groups: Array<{
      id: string;
      itemType: ItemType;
      status: Status;
      orderItems: OrderItem[];
    }> = [];

    // Pour chaque type d'item
    itemTypes.forEach(itemType => {
      // Récupérer tous les orderItems de ce type QUI NE SONT PAS dans un menu
      const itemsOfType = order.orderItems.filter(
        orderItem => orderItem.item.itemType.id === itemType.id && !orderItem.menuGroupId
      );

      if (itemsOfType.length === 0) return;

      // Grouper par statut au sein de ce type
      const statusGroups = itemsOfType.reduce((acc, orderItem) => {
        const status = orderItem.status;
        if (!acc[status]) {
          acc[status] = [];
        }
        acc[status].push(orderItem);
        return acc;
      }, {} as Record<Status, OrderItem[]>);

      // Créer un groupe pour chaque combinaison type + statut
      Object.entries(statusGroups).forEach(([status, orderItems]) => {
        groups.push({
          id: `${itemType.id}-${status}`,
          itemType,
          status: status as Status,
          orderItems
        });
      });
    });

    // Trier les groupes : d'abord par type, puis par priorité de statut
    const getStatusPriority = (status: Status): number => {
      const statusOrder = [Status.TERMINATED, Status.DRAFT, Status.INPROGRESS, Status.PENDING, Status.READY, Status.SERVED, Status.ERROR];
      return statusOrder.indexOf(status);
    };

    return groups.sort((a, b) => {
      // D'abord trier par nom de type
      const typeComparison = a.itemType.name.localeCompare(b.itemType.name);
      if (typeComparison !== 0) return typeComparison;

      // Puis par priorité de statut - avec fallback pour les statuts non définis
      const aPriority = getStatusPriority(a.status);
      const bPriority = getStatusPriority(b.status);
      return aPriority - bPriority;
    });
  }, [order.orderItems, itemTypes]); // Dépendances optimisées

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
          const menuOrderGroupsWithItems = getMenuOrderGroupsWithItems(order.id);
          const hasMenus = menuOrderGroupsWithItems && menuOrderGroupsWithItems.length > 0;
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
                  {menuOrderGroupsWithItems.map((menuOrderGroupWithItems) => {
                    // ✅ Les OrderItems sont déjà récupérés par le sélecteur optimisé
                    const menuOrderItems = menuOrderGroupWithItems.orderItems;
                    
                    // Trouver les infos du menu depuis le hook useMenus
                    const menuInfo = activeMenus.find(menu => menu.id === menuOrderGroupWithItems.menuId);
                    
                    const groupId = `menu-${menuOrderGroupWithItems.id}`;
                    
                    return (
                      <AdminMenuOrderGroup
                        key={menuOrderGroupWithItems.id}
                        menuOrderGroup={menuOrderGroupWithItems}
                        menuInfo={menuInfo}
                        orderItems={menuOrderItems}
                        isExpanded={expandedGroups.includes(groupId)}
                        onToggle={() => {
                          setOpenGroupMenuId(null);
                          toggleExpanded(groupId);
                        }}
                        onDelete={async () => {
                          try {
                            // UX optimiste : Mise à jour immédiate de l'UI  
                            const orderItemIds = menuOrderItems.map(item => item.id);
                            dispatch(restaurantActions.deleteOrderItemsBatch({ orderItemIds }));
                            dispatch(restaurantActions.deleteMenuOrderGroup({ 
                              menuOrderGroupId: menuOrderGroupWithItems.id 
                            }));
                            
                            // Appel API en arrière-plan pour confirmation backend
                            await menuOrderGroupApiService.deleteWithResponse(menuOrderGroupWithItems.id);
                            
                            // Les WebSocket events assurent la synchronisation avec les autres clients
                            
                          } catch (error) {
                            console.error('Erreur lors de la suppression du menu:', error);
                            // Afficher un toast d'erreur à l'utilisateur
                            showToast('Erreur lors de la suppression du menu', 'error');
                            // Note: Le rollback automatique n'est pas nécessaire car les WebSocket 
                            // synchroniseront automatiquement l'état correct depuis le serveur
                          }
                        }}
                        onDeleteOrderItem={onDeleteOrderItem}
                        onUpdateOrderItemStatus={onUpdateOrderItemStatus}
                        groupId={groupId}
                        isMenuOpen={openGroupMenuId === groupId}
                        onMenuOpenChange={setOpenGroupMenuId}
                      />
                    );
                  })}
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
              {groupedItems.map((group) => (
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
          onDeleteGroup={async (orderItems) => {
            // Utiliser l'API de suppression en lot si disponible, sinon fallback vers les appels individuels
            if (onDeleteManyOrderItems) {
              const orderItemIds = orderItems.map(orderItem => orderItem.id);
              await onDeleteManyOrderItems(orderItemIds);
            } else {
              // Fallback: supprimer tous les éléments du groupe en parallèle
              const deletePromises = orderItems.map(orderItem => 
                Promise.resolve(onDeleteOrderItem(orderItem.id))
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