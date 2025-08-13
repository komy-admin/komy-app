import { View, Text, Pressable, ScrollView, Animated, Platform } from 'react-native';
import { ChevronDown, ChevronUp, Wine, UtensilsCrossed, Soup, Dessert, Trash2, AlertTriangle, Settings } from 'lucide-react-native';
import { useState, useRef, useCallback, useEffect } from 'react';
import { Gesture, GestureDetector, GestureHandlerRootView } from 'react-native-gesture-handler';
import Reanimated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  runOnJS,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { ItemType } from '~/types/item-type.types';
import { OrderItem } from '~/types/order-item.types';
import { Status } from '~/types/status.enum';
import { DateFormat, formatDate, getMostImportantStatus, getStatusColor, getStatusText } from '~/lib/utils';
import { Order } from '~/types/order.types';
import { ConfirmDialog } from '~/components/ui';
import StatusSelector from './StatusSelector';

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

// Composant pour un élément de commande individuel avec swipe menu
const AdminOrderItem = ({ 
  orderItem, 
  onDelete, 
  onUpdateStatus,
  isGroupMenuOpen = false
}: { 
  orderItem: OrderItem, 
  onDelete: () => void,
  onUpdateStatus?: (status: Status) => void,
  isGroupMenuOpen?: boolean
}) => {
  const translateX = useSharedValue(0);
  const [showStatusSelector, setShowStatusSelector] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  
  const SWIPE_THRESHOLD = -120; // Plus large pour afficher 2 boutons
  
  const handleDeleteItem = () => {
    setIsDeleting(true);
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    } catch (error) {
      // Haptic feedback non critique
    }
    
    try {
      onDelete();
    } catch (error) {
      console.error('Erreur dans onDelete:', error);
      setIsDeleting(false);
    }
  };

  const handleDeleteClick = () => {
    // Fermer le menu et ouvrir la modal de confirmation
    translateX.value = withSpring(0);
    setShowConfirmDialog(true);
  };

  const handleStatusClick = () => {
    translateX.value = withSpring(0);
    if (onUpdateStatus) {
      setShowStatusSelector(true);
    }
  };

  const panGesture = Gesture.Pan()
    // .enabled(!isGroupMenuOpen && Platform.OS !== 'web') // Désactiver les gestes sur web et si le menu du groupe est ouvert
    .enabled(!isGroupMenuOpen) // Désactiver si le menu du groupe est ouvert
    .activeOffsetX([-10, 10]) // Seuil d'activation horizontal
    .failOffsetY([-15, 15]) // Échouer si mouvement vertical trop important
    .onStart((event) => {
      // Déterminer l'intention du geste dès le début
      const isHorizontalIntent = Math.abs(event.velocityX) > Math.abs(event.velocityY) * 1.5;
      if (!isHorizontalIntent) {
        // Si l'intention est verticale, ne pas intercepter le geste
        return;
      }
    })
    .onUpdate((event) => {
      // Vérifier que le geste reste principalement horizontal
      const isHorizontalGesture = Math.abs(event.translationX) > Math.abs(event.translationY) * 1.2;
      if (!isHorizontalGesture) return;
      
      // Swipe vers la gauche seulement, limité à la largeur du menu
      if (event.translationX <= 0) {
        translateX.value = Math.max(event.translationX, SWIPE_THRESHOLD);
      }
    })
    .onEnd((event) => {
      if (event.translationX <= SWIPE_THRESHOLD) {
        // Maintenir la position swipée pour afficher le menu
        translateX.value = withSpring(SWIPE_THRESHOLD);
      } else {
        translateX.value = withSpring(0);
      }
    });

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ translateX: translateX.value }],
    };
  });

  const menuOpacity = useAnimatedStyle(() => {
    const isMenuVisible = translateX.value < 0;
    return {
      opacity: isMenuVisible ? Math.abs(translateX.value) / Math.abs(SWIPE_THRESHOLD) : 0,
      pointerEvents: isMenuVisible && Math.abs(translateX.value) > 20 ? 'auto' : 'none',
    };
  });

  if (isDeleting) {
    return null; // Masquer le composant pendant la suppression
  }

  return (
    <View style={{ position: 'relative' }}>
      {/* Menu avec options suppression et statut */}
      <Reanimated.View
        style={[
          {
            position: 'absolute',
            top: 0,
            right: 0,
            bottom: 0,
            width: 120,
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
          },
          menuOpacity,
        ]}
      >
        {/* Bouton modification statut */}
        {onUpdateStatus && (
          <Pressable
            onPress={handleStatusClick}
            style={{
              width: 60,
              height: '100%',
              backgroundColor: '#3B82F6',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Settings size={20} color="white" strokeWidth={2} />
          </Pressable>
        )}
        
        {/* Bouton suppression */}
        <Pressable
          onPress={handleDeleteClick}
          style={{
            width: 60,
            height: '100%',
            backgroundColor: '#EF4444',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Trash2 size={20} color="white" strokeWidth={2} />
        </Pressable>
      </Reanimated.View>

      <GestureDetector gesture={panGesture}>
        <Reanimated.View
          style={[
            {
              backgroundColor: 'white',
              flexDirection: 'row',
              justifyContent: 'space-between',
              alignItems: 'center',
              paddingVertical: 12,
              paddingLeft: 16,
              paddingRight: 16,
              borderTopWidth: 1,
              borderTopColor: '#E5E7EB',
            },
            animatedStyle,
          ]}
        >
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 16 }}>{orderItem.item.name}</Text>
            {orderItem.note && (
              <Text style={{ fontSize: 14, color: '#666666', fontStyle: 'italic' }}>
                Commentaire : {orderItem.note}
              </Text>
            )}
            <Text style={{ fontSize: 12, color: '#999999', marginTop: 4 }}>
              ← Swiper pour options (statut/suppression)
            </Text>
          </View>
          <View>
            <Text style={{ fontSize: 14, color: '#666666' }}>
              {formatDate(orderItem.updatedAt, DateFormat.TIME)}
            </Text>
            <Text style={{
              fontSize: 14,
              color: '#666666',
              textAlign: 'right'
            }}>
              {getStatusText(orderItem.status)}
            </Text>
          </View>
        </Reanimated.View>
      </GestureDetector>
      
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
      <ConfirmDialog
        open={showConfirmDialog}
        onOpenChange={setShowConfirmDialog}
        title="Confirmer la suppression"
        content={`Êtes-vous sûr de vouloir supprimer l'élément "${orderItem.item.name}" ?`}
        onCancel={() => setShowConfirmDialog(false)}
        onConfirm={() => {
          setShowConfirmDialog(false);
          handleDeleteItem();
        }}
        confirmText="Supprimer"
        variant="destructive"
      />
    </View>
  );
};

const AdminOrderItemsGroup = ({ itemType, status, orderItems, isExpanded, onToggle, onDeleteOrderItem, onUpdateOrderItemStatus, onDeleteGroup, groupId, isMenuOpen, onMenuOpenChange }: AdminOrderItemsGroupProps) => {
  const itemStatus = getMostImportantStatus(orderItems.map(orderItem => orderItem.status));
  const translateX = useSharedValue(0);
  const [showGroupConfirmDialog, setShowGroupConfirmDialog] = useState(false);
  const [showGroupStatusSelector, setShowGroupStatusSelector] = useState(false);
  
  const SWIPE_THRESHOLD = -120; // Plus large pour 2 boutons

  // Fermer le menu si un autre groupe devient actif
  useEffect(() => {
    if (!isMenuOpen) {
      translateX.value = 0; // Fermeture instantanée
    }
  }, [isMenuOpen]);

  const handleGroupDeleteClick = () => {
    translateX.value = 0; // Fermeture instantanée
    onMenuOpenChange(null);
    if (onDeleteGroup) {
      setShowGroupConfirmDialog(true);
    }
  };

  const handleGroupStatusClick = () => {
    translateX.value = 0; // Fermeture instantanée
    onMenuOpenChange(null);
    if (onUpdateOrderItemStatus) {
      setShowGroupStatusSelector(true);
    }
  };

  const groupPanGesture = Gesture.Pan()
    // .enabled(Platform.OS !== 'web') // Désactiver les gestes sur web
    .activeOffsetX([-10, 10]) // Seuil d'activation horizontal
    .failOffsetY([-15, 15]) // Échouer si mouvement vertical trop important
    .onStart((event) => {
      // Déterminer l'intention du geste dès le début
      const isHorizontalIntent = Math.abs(event.velocityX) > Math.abs(event.velocityY) * 1.5;
      if (!isHorizontalIntent) {
        // Si l'intention est verticale, ne pas intercepter le geste
        return;
      }
    })
    .onUpdate((event) => {
      // Vérifier que le geste reste principalement horizontal
      const isHorizontalGesture = Math.abs(event.translationX) > Math.abs(event.translationY) * 1.2;
      if (!isHorizontalGesture) return;
      
      // Si le menu est déjà ouvert et qu'on swipe encore vers la gauche, ne rien faire
      if (translateX.value === SWIPE_THRESHOLD && event.translationX <= 0) {
        return;
      }
      
      // Swipe vers la gauche seulement, limité à la largeur du menu
      if (event.translationX <= 0) {
        translateX.value = Math.max(event.translationX, SWIPE_THRESHOLD);
      }
    })
    .onEnd((event) => {
      if (event.translationX <= SWIPE_THRESHOLD) {
        // Si pas déjà ouvert, ouvrir avec animation
        if (translateX.value !== SWIPE_THRESHOLD) {
          translateX.value = withSpring(SWIPE_THRESHOLD);
        }
        runOnJS(onMenuOpenChange)(groupId);
      } else {
        translateX.value = 0; // Fermeture instantanée
        runOnJS(onMenuOpenChange)(null);
      }
    });

  const groupAnimatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ translateX: translateX.value }],
    };
  });

  const groupMenuOpacity = useAnimatedStyle(() => {
    const isMenuVisible = translateX.value < 0;
    return {
      opacity: isMenuVisible ? Math.abs(translateX.value) / Math.abs(SWIPE_THRESHOLD) : 0,
      pointerEvents: isMenuVisible && Math.abs(translateX.value) > 20 ? 'auto' : 'none',
    };
  });

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

  const GroupContent = () => (
    <View style={[
      getGroupStyle()
    ]}>
      {/* Menu avec options intégré dans le groupe */}
      <Reanimated.View
        style={[
          {
            position: 'absolute',
            top: 0,
            right: 0,
            bottom: 0,
            width: 120,
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1,
          },
          groupMenuOpacity,
        ]}
      >
        {/* Bouton modification statut du groupe */}
        {onUpdateOrderItemStatus && (
          <Pressable
            onPress={handleGroupStatusClick}
            style={{
              width: 60,
              height: '100%',
              backgroundColor: '#3B82F6',
              alignItems: 'center',
              justifyContent: 'center',
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
              width: 60,
              height: '100%',
              backgroundColor: '#EF4444',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Trash2 size={20} color="white" strokeWidth={2} />
          </Pressable>
        )}
      </Reanimated.View>
      
      <Pressable
        onPress={() => {
          // Fermer le menu si ouvert quand on clique sur le header
          if (isMenuOpen) {
            onMenuOpenChange(null);
          }
          onToggle();
        }}
        style={getHeaderStyle()}
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
                    backgroundColor: getStatusColor(itemStatus),
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
            <View style={{ 
              flexDirection: 'row', 
              alignItems: 'center', 
              gap: 8,
              backgroundColor: isExpanded ? `${getStatusColor(itemStatus)}30` : `${getStatusColor(itemStatus)}20`,
              paddingHorizontal: 12,
              paddingVertical: 8,
              borderRadius: 20,
            }}>
              {(onUpdateOrderItemStatus || onDeleteGroup) && (
                <Text style={{ 
                  fontSize: 10, 
                  color: '#666666',
                  marginRight: 4
                }}>
                  ← Options
                </Text>
              )}
              {isExpanded ? (
                <ChevronUp size={20} color="#1A1A1A" strokeWidth={2.5} />
              ) : (
                <ChevronDown size={20} color="#1A1A1A" strokeWidth={2.5} />
              )}
            </View>
          </View>
        </Pressable>

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
                  isGroupMenuOpen={isMenuOpen}
                />
              </View>
            ))}
          </View>
        )}
      </View>
  );

  return (
    <View style={{ marginBottom: 12 }}>
      {/* Toujours permettre le swipe pour accéder au menu */}
      <GestureDetector gesture={groupPanGesture}>
        <GroupContent />
      </GestureDetector>

      <ConfirmDialog
        open={showGroupConfirmDialog}
        onOpenChange={setShowGroupConfirmDialog}
        title="Supprimer tout le groupe"
        content={`Êtes-vous sûr de vouloir supprimer tous les articles de "${itemType.name}" (${orderItems.length} article${orderItems.length > 1 ? 's' : ''}) ?`}
        onCancel={() => setShowGroupConfirmDialog(false)}
        onConfirm={() => {
          setShowGroupConfirmDialog(false);
          onDeleteGroup?.(orderItems);
        }}
        confirmText="Supprimer le groupe"
        variant="destructive"
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

  const toggleExpanded = (groupId: string) => {
    setExpandedGroups(prev =>
      prev.includes(groupId)
        ? prev.filter(id => id !== groupId)
        : [...prev, groupId]
    );
  };

  // Créer une structure de groupement par type ET par statut
  const createGroupedItems = () => {
    const groups: Array<{
      id: string;
      itemType: ItemType;
      status: Status;
      orderItems: OrderItem[];
    }> = [];

    // Pour chaque type d'item
    itemTypes.forEach(itemType => {
      // Récupérer tous les orderItems de ce type
      const itemsOfType = order.orderItems.filter(
        orderItem => orderItem.item.itemType.id === itemType.id
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
      const order = [Status.TERMINATED, Status.DRAFT, Status.INPROGRESS, Status.PENDING, Status.READY, Status.SERVED, Status.ERROR];
      return order.indexOf(status);
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
  };

  const groupedItems = createGroupedItems();

  const RootComponent = Platform.OS === 'web' ? View : GestureHandlerRootView;

  return (
    <RootComponent style={{ flex: 1 }}>
      <ScrollView
        style={{ flex: 1, padding: 16 }}
        showsVerticalScrollIndicator={true}
        bounces={true}
        scrollEventThrottle={16}
        keyboardShouldPersistTaps="handled"
        removeClippedSubviews={false}
        scrollEnabled={true}
        nestedScrollEnabled={true}
        // Optimisations pour la gestion des gestes
        directionalLockEnabled={true}
        // Priorité au scroll vertical sur tablette
        alwaysBounceVertical={true}
      >
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
        <View style={{ height: 20 }} />
      </ScrollView>
    </RootComponent>
  );
}