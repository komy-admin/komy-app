import React, { useState, useEffect } from 'react';
import { View, ScrollView, Pressable, StyleSheet, Platform } from 'react-native';
import { Text, Button } from '~/components/ui';
import { Plus, Minus, Menu as MenuIcon } from 'lucide-react-native';
import { Order } from '~/types/order.types';
import { Item } from '~/types/item.types';
import { ItemType } from '~/types/item-type.types';
import { OrderItem } from '~/types/order-item.types';
import { Status } from '~/types/status.enum';
import { orderItemApiService } from '~/api/order-item.api';
import { orderApiService } from '~/api/order.api';
import { getMostImportantStatus } from '~/lib/utils';
import { useToast } from '~/components/ToastProvider';
import { Menu } from '~/types/menu.types';
import { useMenus } from '~/hooks/useMenus';

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
  const [activeMainTab, setActiveMainTab] = useState<string>('ITEMS');
  const [activeItemType, setActiveItemType] = useState<string>('');
  const [activeMenu, setActiveMenu] = useState<Menu | null>(null);
  const [activeMenuCategory, setActiveMenuCategory] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);

  const { showToast } = useToast();
  const { activeMenus, loadMenuCategoryItems } = useMenus();
  
  // État local pour les modifications (brouillon)
  const [draftItems, setDraftItems] = useState<DraftOrderItem[]>([]);
  const [menuCategoryItems, setMenuCategoryItems] = useState<Record<string, any[]>>({});

  useEffect(() => {
    // Démarrer sur le premier type d'article si disponible
    if (itemTypes.length > 0) {
      setActiveItemType(itemTypes[0].id);
    }
  }, [itemTypes]);

  useEffect(() => {
    // Démarrer sur le premier menu si disponible
    if (activeMenus.length > 0 && !activeMenu) {
      setActiveMenu(activeMenus[0]);
    }
  }, [activeMenus, activeMenu]);

  useEffect(() => {
    // Démarrer sur la première catégorie du menu actif
    if (activeMenu && activeMenu.categories && activeMenu.categories.length > 0) {
      setActiveMenuCategory(activeMenu.categories[0].id);
      // Charger les items pour toutes les catégories du menu
      loadMenuItems();
    }
  }, [activeMenu]);

  const loadMenuItems = async () => {
    if (!activeMenu || !activeMenu.categories) return;
    
    try {
      const itemsData: Record<string, any[]> = {};
      
      await Promise.all(
        activeMenu.categories.map(async (category) => {
          try {
            const categoryItems = await loadMenuCategoryItems(category.id);
            itemsData[category.id] = categoryItems?.filter(item => item?.isAvailable) || [];
          } catch (categoryError) {
            console.error(`Erreur lors du chargement des items de la catégorie ${category.id}:`, categoryError);
            itemsData[category.id] = [];
          }
        })
      );
      
      setMenuCategoryItems(itemsData);
    } catch (error) {
      console.error('Erreur lors du chargement des items du menu:', error);
    }
  };

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

      // 4. Ajouter les nouveaux orderItems en lot (SEULEMENT avec le statut DRAFT)
      let newOrderItems = [];
      if (itemsToAdd.length > 0) {
        const bulkData = {
          orderId: order.id,
          items: itemsToAdd.map(({ itemId, quantity }) => ({
            itemId,
            quantity,
            status: Status.DRAFT // SEULEMENT les nouveaux items sont en DRAFT
          }))
        };
        
        newOrderItems = await orderItemApiService.createBulk(bulkData);
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
          {/* Onglet Menus */}
          <Pressable
            style={[
              styles.tabTrigger,
              activeMainTab === 'MENUS' && styles.activeTabTrigger
            ]}
            onPress={() => setActiveMainTab('MENUS')}
          >
            <Text style={[
              styles.tabText,
              activeMainTab === 'MENUS' && styles.activeTabText
            ]}>
              🍽️ Menus ({activeMenus.length})
            </Text>
          </Pressable>
          
          {/* Onglet Articles */}
          <Pressable
            style={[
              styles.tabTrigger,
              activeMainTab === 'ITEMS' && styles.activeTabTrigger
            ]}
            onPress={() => setActiveMainTab('ITEMS')}
          >
            <Text style={[
              styles.tabText,
              activeMainTab === 'ITEMS' && styles.activeTabText
            ]}>
              📋 Articles
            </Text>
          </Pressable>
        </View>
        
        {/* Sous-tabs pour les types d'articles */}
        {activeMainTab === 'ITEMS' && (
          <View style={[styles.tabsList, { marginTop: 12 }]}>
            {itemTypes.map((itemType) => (
              <Pressable
                key={itemType.id}
                style={[
                  styles.subTabTrigger,
                  activeItemType === itemType.id && styles.activeSubTabTrigger
                ]}
                onPress={() => setActiveItemType(itemType.id)}
              >
                <Text style={[
                  styles.subTabText,
                  activeItemType === itemType.id && styles.activeSubTabText
                ]}>
                  {itemType.name}
                </Text>
              </Pressable>
            ))}
          </View>
        )}

        {/* Sélecteur de menus */}
        {activeMainTab === 'MENUS' && activeMenus.length > 0 && (
          <View style={[styles.tabsList, { marginTop: 12 }]}>
            {activeMenus.map((menu) => (
              <Pressable
                key={menu.id}
                style={[
                  styles.subTabTrigger,
                  activeMenu?.id === menu.id && styles.activeSubTabTrigger
                ]}
                onPress={() => setActiveMenu(menu)}
              >
                <Text style={[
                  styles.subTabText,
                  activeMenu?.id === menu.id && styles.activeSubTabText
                ]}>
                  {menu.name} ({menu.basePrice}€)
                </Text>
              </Pressable>
            ))}
          </View>
        )}

        {/* Catégories du menu sélectionné */}
        {activeMainTab === 'MENUS' && activeMenu && activeMenu.categories && activeMenu.categories.length > 0 && (
          <View style={[styles.tabsList, { marginTop: 12 }]}>
            {activeMenu.categories.map((category) => (
              <Pressable
                key={category.id}
                style={[
                  styles.subTabTrigger,
                  activeMenuCategory === category.id && styles.activeSubTabTrigger
                ]}
                onPress={() => setActiveMenuCategory(category.id)}
              >
                <Text style={[
                  styles.subTabText,
                  activeMenuCategory === category.id && styles.activeSubTabText
                ]}>
                  {category.itemType?.name}
                  {category.isRequired && <Text style={{ color: '#DC2626' }}> *</Text>}
                </Text>
              </Pressable>
            ))}
          </View>
        )}
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
          {activeMainTab === 'MENUS' ? (
            /* Items de la catégorie sélectionnée du menu */
            <>
              {activeMenus.length === 0 ? (
                <View style={styles.emptyState}>
                  <MenuIcon size={48} color="#ccc" />
                  <Text style={styles.emptyStateTitle}>Aucun menu disponible</Text>
                  <Text style={styles.emptyStateSubtitle}>
                    Aucun menu n'est actuellement disponible.
                  </Text>
                </View>
              ) : activeMenu ? (
                <>
                  {/* En-tête du menu sélectionné */}
                  <View style={styles.menuHeader}>
                    <Text style={styles.menuHeaderTitle}>🍽️ {activeMenu.name}</Text>
                    <Text style={styles.menuHeaderPrice}>Prix de base: {activeMenu.basePrice}€</Text>
                    {activeMenu.description && (
                      <Text style={styles.menuHeaderDescription}>{activeMenu.description}</Text>
                    )}
                  </View>

                  {/* Items de la catégorie active */}
                  {activeMenuCategory && menuCategoryItems[activeMenuCategory] ? (
                    menuCategoryItems[activeMenuCategory].length === 0 ? (
                      <View style={styles.emptyState}>
                        <Text style={styles.emptyStateTitle}>Aucun article disponible</Text>
                        <Text style={styles.emptyStateSubtitle}>
                          Pas d'articles disponibles pour cette catégorie.
                        </Text>
                      </View>
                    ) : (
                      menuCategoryItems[activeMenuCategory].map((menuCategoryItem) => {
                        const item = menuCategoryItem?.item;
                        if (!item) return null;
                        
                        const supplement = parseFloat(menuCategoryItem.supplement || '0');
                        const quantity = getItemQuantity(item.id);

                        return (
                          <View key={menuCategoryItem.id} style={styles.itemRow}>
                            <View style={styles.itemInfo}>
                              <Text style={styles.itemName} numberOfLines={2}>
                                {item.name}
                              </Text>
                              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                                <Text style={styles.itemPrice}>
                                  {item.price}€
                                </Text>
                                {supplement > 0 && (
                                  <Text style={styles.supplementText}>
                                    +{supplement}€ supplément
                                  </Text>
                                )}
                              </View>
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
                      })
                    )
                  ) : (
                    <Text style={{ textAlign: 'center', marginTop: 20, color: '#666' }}>
                      Chargement des articles...
                    </Text>
                  )}
                </>
              ) : (
                <Text style={{ textAlign: 'center', marginTop: 20, color: '#666' }}>
                  Sélectionnez un menu pour voir les articles disponibles.
                </Text>
              )}
            </>
          ) : (
            /* Liste des articles par type */
            items
              .filter(item => item.itemType.id === activeItemType)
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
              })
          )}
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
  subTabTrigger: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 8,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
  },
  activeSubTabTrigger: {
    backgroundColor: '#ffffff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  subTabText: {
    fontSize: 13,
    fontWeight: '400',
    color: '#6b7280',
    textAlign: 'center',
  },
  activeSubTabText: {
    color: '#2A2E33',
    fontWeight: '600',
  },
  menuRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
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
  menuDescription: {
    fontSize: 13,
    color: '#6b7280',
    marginTop: 2,
    marginBottom: 6,
    lineHeight: 18,
    fontStyle: 'italic',
  },
  menuButtonContainer: {
    backgroundColor: '#059669',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  menuButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyStateTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#6b7280',
    marginTop: 16,
    textAlign: 'center',
  },
  emptyStateSubtitle: {
    fontSize: 14,
    color: '#9ca3af',
    marginTop: 8,
    textAlign: 'center',
    paddingHorizontal: 40,
  },
  menuHeader: {
    backgroundColor: '#F9FAFB',
    padding: 16,
    marginBottom: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  menuHeaderTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1A1A1A',
    marginBottom: 4,
  },
  menuHeaderPrice: {
    fontSize: 16,
    fontWeight: '600',
    color: '#059669',
    marginBottom: 8,
  },
  menuHeaderDescription: {
    fontSize: 14,
    color: '#6b7280',
    fontStyle: 'italic',
    lineHeight: 20,
  },
  supplementText: {
    fontSize: 12,
    color: '#DC2626',
    fontWeight: '500',
    backgroundColor: '#FEF2F2',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
});