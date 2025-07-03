import React, { useState, useEffect } from 'react';
import { View, ScrollView, Pressable, StyleSheet, Platform } from 'react-native';
import { Text, Button } from '~/components/ui';
import { Plus, Minus } from 'lucide-react-native';
import { Order } from '~/types/order.types';
import { Item } from '~/types/item.types';
import { ItemType } from '~/types/item-type.types';
import { OrderItem } from '~/types/order-item.types';
import { Status } from '~/types/status.enum';
import { orderItemApiService } from '~/api/order-item.api';
import { orderApiService } from '~/api/order.api';
import { getMostImportantStatus } from '~/lib/utils';
import { useToast } from '~/components/ToastProvider';

interface OrderItemsFormProps {
  order: Order;
  items: Item[];
  itemTypes: ItemType[];
  onSave: (order: Order) => void;
  onCancel: () => void;
}

// Interface pour les items en brouillon (local)
interface DraftOrderItem {
  itemId: string;
  quantity: number;
}

export default function OrderItemsForm({
  order,
  items,
  itemTypes,
  onSave,
  onCancel
}: OrderItemsFormProps) {
  const [activeTab, setActiveTab] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);

  const { showToast } = useToast();
  // État local pour les modifications (brouillon)
  const [draftItems, setDraftItems] = useState<DraftOrderItem[]>([]);

  useEffect(() => {
    if (itemTypes.length > 0) {
      setActiveTab(itemTypes[0].id);
    }
  }, [itemTypes]);

  // Initialiser le brouillon avec les items existants de la commande
  useEffect(() => {
    const initialDraft: DraftOrderItem[] = [];

    // Compter les quantités des items existants
    order.orderItems.forEach((orderItem: OrderItem) => {
      const existingDraft = initialDraft.find(draft => draft.itemId === orderItem.item.id);
      if (existingDraft) {
        existingDraft.quantity += 1;
      } else {
        initialDraft.push({
          itemId: orderItem.item.id,
          quantity: 1
        });
      }
    });

    setDraftItems(initialDraft);
  }, [order]);

  const getItemQuantity = (itemId: string) => {
    const draftItem = draftItems.find(draft => draft.itemId === itemId);
    return draftItem ? draftItem.quantity : 0;
  };

  const onUpdateQuantity = (itemId: string, action: 'remove' | 'add') => {
    setDraftItems(prevDraft => {
      const existingDraft = prevDraft.find(draft => draft.itemId === itemId);

      if (action === 'add') {
        if (existingDraft) {
          return prevDraft.map(draft =>
            draft.itemId === itemId
              ? { ...draft, quantity: draft.quantity + 1 }
              : draft
          );
        } else {
          return [...prevDraft, { itemId, quantity: 1 }];
        }
      } else if (action === 'remove') {
        if (existingDraft) {
          if (existingDraft.quantity <= 1) {
            return prevDraft.filter(draft => draft.itemId !== itemId);
          } else {
            return prevDraft.map(draft =>
              draft.itemId === itemId
                ? { ...draft, quantity: draft.quantity - 1 }
                : draft
            );
          }
        }
      }

      return prevDraft;
    });
  };

  const handleSave = async () => {
    setIsLoading(true);
    try {
      // 1. Analyser les changements par rapport à l'état actuel
      const currentItemCounts = new Map<string, number>();
      order.orderItems.forEach((orderItem: OrderItem) => {
        const itemId = orderItem.item.id;
        currentItemCounts.set(itemId, (currentItemCounts.get(itemId) || 0) + 1);
      });

      const newItemCounts = new Map<string, number>();
      draftItems.forEach(draft => {
        newItemCounts.set(draft.itemId, draft.quantity);
      });

      // 2. Identifier les items à supprimer et à ajouter
      const itemsToRemove: string[] = [];
      const itemsToAdd: { itemId: string; quantity: number }[] = [];

      // Vérifier les items existants
      for (const [itemId, currentCount] of currentItemCounts) {
        const newCount = newItemCounts.get(itemId) || 0;
        const difference = newCount - currentCount;

        if (difference < 0) {
          // Il faut supprimer des items (on supprime les plus récents)
          const orderItemsToRemove = order.orderItems
            .filter((oi: OrderItem) => oi.item.id === itemId)
            .sort((a: OrderItem, b: OrderItem) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
            .slice(0, Math.abs(difference));

          itemsToRemove.push(...orderItemsToRemove.map((oi: OrderItem) => oi.id));
        } else if (difference > 0) {
          // Il faut ajouter des items
          itemsToAdd.push({ itemId, quantity: difference });
        }
      }

      // Vérifier les nouveaux items
      for (const [itemId, newCount] of newItemCounts) {
        if (!currentItemCounts.has(itemId) && newCount > 0) {
          itemsToAdd.push({ itemId, quantity: newCount });
        }
      }

      // 3. Supprimer les orderItems en trop
      if (itemsToRemove.length > 0) {
        const deletePromises = itemsToRemove.map(orderItemId =>
          orderItemApiService.delete(orderItemId)
        );
        await Promise.all(deletePromises);
      }

      // 4. Ajouter les nouveaux orderItems (SEULEMENT avec le statut DRAFT)
      const newOrderItems = [];
      for (const { itemId, quantity } of itemsToAdd) {
        const item = items.find(i => i.id === itemId);
        if (item) {
          for (let i = 0; i < quantity; i++) {
            const orderItem = await orderItemApiService.create({
              orderId: order.id,
              itemId: item.id,
              status: Status.DRAFT // SEULEMENT les nouveaux items sont en DRAFT
            });
            newOrderItems.push(orderItem);
          }
        }
      }

      // 5. Récupérer la commande mise à jour avec tous les orderItems
      const updatedOrder = await orderApiService.get(order.id);

      // 6. Calculer le nouveau statut global
      const mostImportantStatus = updatedOrder.orderItems.length > 0
        ? getMostImportantStatus(updatedOrder.orderItems.map((orderItem: OrderItem) => orderItem.status))
        : Status.DRAFT;

      // 7. Mettre à jour le statut de la commande si nécessaire
      const finalOrder = await orderApiService.update(order.id, {
        status: mostImportantStatus
      });

      // 8. Retourner la commande finale
      onSave({
        ...finalOrder,
        orderItems: updatedOrder.orderItems,
        status: mostImportantStatus
      });
    } catch (error) {
      showToast('Erreur lors de l\'enregistrement de la commande');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    // Simplement fermer sans sauvegarder les modifications locales
    onCancel();
  };

  const getTotalQuantity = () => {
    return draftItems.reduce((total, draft) => total + draft.quantity, 0);
  };

  const getTotalPrice = () => {
    return draftItems.reduce((total, draft) => {
      const item = items.find(i => i.id === draft.itemId);
      return total + (item ? item.price * draft.quantity : 0);
    }, 0);
  };

  return (
    <View style={styles.container}>
      {/* Header avec les tabs */}
      <View style={styles.header}>
        <View style={styles.tabsList}>
          {itemTypes.map((itemType) => (
            <Pressable
              key={itemType.id}
              style={[
                styles.tabTrigger,
                activeTab === itemType.id && styles.activeTabTrigger
              ]}
              onPress={() => setActiveTab(itemType.id)}
            >
              <Text style={[
                styles.tabText,
                activeTab === itemType.id && styles.activeTabText
              ]}>
                {itemType.name}
              </Text>
            </Pressable>
          ))}
        </View>
      </View>

      {/* ScrollView principal */}
      <View style={styles.scrollContainer}>
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={true}
          scrollEventThrottle={16}
          bounces={true}
          keyboardShouldPersistTaps="handled"
          removeClippedSubviews={false}
          scrollEnabled={true}
          nestedScrollEnabled={true}
          directionalLockEnabled={false}
          alwaysBounceVertical={Platform.OS === 'ios'}
          contentInsetAdjustmentBehavior="automatic"
          pagingEnabled={false}
          decelerationRate="normal"
          maximumZoomScale={1}
          minimumZoomScale={1}
          {...Platform.select({
            ios: {
              indicatorStyle: 'default',
              scrollIndicatorInsets: { right: 1 },
            },
            android: {
              overScrollMode: 'auto',
              fadingEdgeLength: 0,
              endFillColor: 'transparent',
            },
          })}
        >
          {items
            .filter(item => item.itemType.id === activeTab)
            .map((item) => {
              const quantity = getItemQuantity(item.id);

              return (
                <View key={item.id} style={styles.itemRow}>
                  <View style={styles.itemInfo}>
                    <Text style={styles.itemName} numberOfLines={2}>
                      {item.name}
                    </Text>
                    <Text style={styles.itemPrice}>
                      {item.price}€
                    </Text>
                  </View>

                  <View style={styles.quantityContainer}>
                    <Pressable
                      onPress={() => onUpdateQuantity(item.id, 'remove')}
                      style={[styles.quantityButton, quantity === 0 && styles.disabledButton]}
                      disabled={quantity === 0 || isLoading}
                      hitSlop={{ top: 15, bottom: 15, left: 15, right: 15 }}
                      android_ripple={{ color: 'rgba(0,0,0,0.1)', borderless: true }}
                    >
                      <Minus size={20} color={quantity === 0 ? "#ccc" : "#666"} strokeWidth={2.5} />
                    </Pressable>

                    <Text style={styles.quantityText}>
                      {quantity}
                    </Text>

                    <Pressable
                      onPress={() => onUpdateQuantity(item.id, 'add')}
                      style={[styles.quantityButton, isLoading && styles.disabledButton]}
                      disabled={isLoading}
                      hitSlop={{ top: 15, bottom: 15, left: 15, right: 15 }}
                      android_ripple={{ color: 'rgba(0,0,0,0.1)', borderless: true }}
                    >
                      <Plus size={20} color={isLoading ? "#ccc" : "#666"} strokeWidth={2.5} />
                    </Pressable>
                  </View>
                </View>
              );
            })}
        </ScrollView>
      </View>

      {/* Footer avec résumé et boutons */}
      <View style={styles.footer}>
        <View style={styles.summary}>
          <Text style={styles.summaryText}>
            Total articles: {getTotalQuantity()}
          </Text>
          <Text style={styles.summaryPrice}>
            Total: {getTotalPrice().toFixed(2)}€
          </Text>
        </View>

        <View style={styles.buttonContainer}>
          <Button
            onPress={handleCancel}
            variant="ghost"
            style={styles.cancelButton}
            disabled={isLoading}
          >
            <Text style={styles.cancelButtonText}>Annuler</Text>
          </Button>

          <Button
            onPress={handleSave}
            style={styles.saveButton}
            disabled={isLoading}
          >
            <Text style={styles.saveButtonText}>
              {isLoading ? 'Enregistrement...' : 'Valider la commande'}
            </Text>
          </Button>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
    backgroundColor: '#ffffff',
  },
  tabsList: {
    flexDirection: 'row',
    backgroundColor: '#f8f9fa',
    borderRadius: 10,
    padding: 6,
  },
  tabTrigger: {
    flex: 1,
    paddingVertical: 14,
    paddingHorizontal: 12,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
  },
  activeTabTrigger: {
    backgroundColor: '#ffffff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  tabText: {
    fontSize: 15,
    fontWeight: '500',
    color: '#6b7280',
    textAlign: 'center',
  },
  activeTabText: {
    color: '#2A2E33',
    fontWeight: '700',
  },
  scrollContainer: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  scrollView: {
    flex: 1,
    paddingHorizontal: 20,
  },
  scrollContent: {
    paddingTop: 15,
    paddingBottom: 30,
  },
  itemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 18,
    marginBottom: 14,
    backgroundColor: '#ffffff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
    minHeight: 80,
  },
  itemInfo: {
    flex: 1,
    marginRight: 20,
  },
  itemName: {
    fontSize: 17,
    fontWeight: '600',
    color: '#2A2E33',
    marginBottom: 6,
    lineHeight: 22,
  },
  itemPrice: {
    fontSize: 15,
    color: '#6b7280',
    fontWeight: '600',
  },
  quantityContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f3f4f6',
    borderRadius: 25,
    paddingHorizontal: 2,
    minHeight: 40,
  },
  quantityButton: {
    width: 34,
    height: 34,
    borderRadius: 22,
    backgroundColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.05)',
  },
  disabledButton: {
    backgroundColor: '#f9fafb',
    shadowOpacity: 0,
    elevation: 0,
    borderColor: 'rgba(0,0,0,0.02)',
  },
  quantityText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#2A2E33',
    minWidth: 45,
    textAlign: 'center',
    marginHorizontal: 12,
  },
  footer: {
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 15,
    backgroundColor: '#ffffff',
  },
  summary: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
    paddingHorizontal: 12,
  },
  summaryText: {
    fontSize: 16,
    color: '#6b7280',
    fontWeight: '500',
    fontStyle: 'italic',
  },
  summaryPrice: {
    fontSize: 20,
    fontWeight: '800',
    color: '#2A2E33',
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: 14,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 16,
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 10,
  },
  cancelButtonText: {
    color: '#6b7280',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
  saveButton: {
    flex: 2,
    backgroundColor: '#2A2E33',
    paddingVertical: 16,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '700',
    textAlign: 'center',
  },
});