import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { View, ScrollView, Pressable, StyleSheet, Platform, useWindowDimensions } from 'react-native';
import { Text } from '~/components/ui';
import { Plus, Minus, Menu as MenuIcon } from 'lucide-react-native';
import { Order } from '~/types/order.types';
import { Item } from '~/types/item.types';
import { ItemType } from '~/types/item-type.types';
import { OrderLine, OrderLineType, CreateOrderLineRequest } from '~/types/order-line.types';
import { Status } from '~/types/status.enum';
import { useToast } from '~/components/ToastProvider';
import { Menu, MenuCategoryItem } from '~/types/menu.types';
import { useMenus } from '~/hooks/useMenus';
import { useMenuOrderGroups } from '~/hooks/useMenuOrderGroups';
import { useOrderLines } from '~/hooks/useOrderLines';
import { AdminFormData, AdminFormRef } from '~/components/admin/AdminFormView';

interface OrderItemsFormProps {
  order: Order;
  items: Item[];
  itemTypes: ItemType[];
  onConfigurationModeChange?: (isConfiguring: boolean) => void;
  onConfigurationActionsChange?: (actions: { onCancel: () => void; onConfirm: () => void } | null) => void;
}

// Interface pour les lignes en brouillon (local) - nouvelle structure unifiée
interface DraftOrderLine {
  type: OrderLineType;
  quantity: number;
  
  // Pour les items individuels
  itemId?: string;
  
  // Pour les menus
  menuId?: string;
  selectedItems?: Record<string, string>; // categoryName -> itemId (un seul item par catégorie)
  
  // Note optionnelle
  note?: string;
}

const OrderItemsForm = React.forwardRef<AdminFormRef<Order>, OrderItemsFormProps>(function OrderItemsForm({
  order,
  items,
  itemTypes,
  onConfigurationModeChange,
  onConfigurationActionsChange
}: OrderItemsFormProps, ref) {
  // ✅ Détection taille écran pour optimiser tactile tablette
  const { width } = useWindowDimensions();
  const isTablet = width >= 768; // iPad et tablettes
  
  // ✅ Styles dynamiques pour boutons optimisés tablette
  const dynamicButtonSize = isTablet ? 38 : 32; // +6px sur tablette
  const dynamicButtonStyles = {
    ...styles.compactQuantityButton,
    width: dynamicButtonSize,
    height: dynamicButtonSize,
  };
  
  const [activeMainTab, setActiveMainTab] = useState<string>('ITEMS');
  const [activeItemType, setActiveItemType] = useState<string>('');
  
  // États pour la configuration de menu
  const [isConfiguringMenu, setIsConfiguringMenu] = useState(false);
  const [menuBeingConfigured, setMenuBeingConfigured] = useState<Menu | null>(null);
  const menuBeingConfiguredRef = useRef<Menu | null>(null); // Référence stable
  const [tempMenuSelections, setTempMenuSelections] = useState<Record<string, string[]>>({});
  const tempMenuSelectionsRef = useRef<Record<string, string[]>>({});
  // Dead code supprimé : activeConfigCategory n'est jamais utilisé

  const { showToast } = useToast();
  const { activeMenus, getMenuCategoryItems } = useMenus();
  const { getMenuOrderGroupsByOrderId } = useMenuOrderGroups();
  const { 
    createOrderLines,
    createOrderWithLines,
    getOrderLinesByOrderId,
    calculateOrderStatus 
  } = useOrderLines();
  
  // État local pour les modifications (brouillon) - nouvelle structure unifiée
  const [draftOrderLines, setDraftOrderLines] = useState<DraftOrderLine[]>([]);
  const [menuCategoryItems, setMenuCategoryItems] = useState<Record<string, any[]>>({});
  const isSavingRef = useRef(false);
  
  // Dérivés de draftOrderLines pour compatibilité
  const draftItems = useMemo(() => 
    draftOrderLines.filter(draft => draft.type === OrderLineType.ITEM && draft.itemId)
      .map(draft => ({ itemId: draft.itemId!, quantity: draft.quantity })),
    [draftOrderLines]
  );
  
  const draftMenus = useMemo(() => 
    draftOrderLines.filter(draft => draft.type === OrderLineType.MENU && draft.menuId)
      .map(draft => ({ menuId: draft.menuId!, quantity: draft.quantity, selectedItems: draft.selectedItems || {} })),
    [draftOrderLines]
  );
  
  // Fonctions de mise à jour pour compatibilité
  const setDraftItems = useCallback((updater: any) => {
    setDraftOrderLines(prevLines => {
      const nonItemLines = prevLines.filter(line => line.type !== OrderLineType.ITEM);
      const currentItems = prevLines.filter(line => line.type === OrderLineType.ITEM && line.itemId)
        .map(line => ({ itemId: line.itemId!, quantity: line.quantity }));
      
      const newItems = typeof updater === 'function' ? updater(currentItems) : updater;
      const newItemLines = newItems.map((item: any) => ({
        type: OrderLineType.ITEM,
        quantity: item.quantity,
        itemId: item.itemId
      }));
      
      return [...nonItemLines, ...newItemLines];
    });
  }, []);
  
  const setDraftMenus = useCallback((updater: any) => {
    setDraftOrderLines(prevLines => {
      const nonMenuLines = prevLines.filter(line => line.type !== OrderLineType.MENU);
      const currentMenus = prevLines.filter(line => line.type === OrderLineType.MENU && line.menuId)
        .map(line => ({ menuId: line.menuId!, quantity: line.quantity, selectedItems: line.selectedItems || {} }));
      
      const newMenus = typeof updater === 'function' ? updater(currentMenus) : updater;
      const newMenuLines = newMenus.map((menu: any) => ({
        type: OrderLineType.MENU,
        quantity: menu.quantity,
        menuId: menu.menuId,
        selectedItems: menu.selectedItems
      }));
      
      return [...nonMenuLines, ...newMenuLines];
    });
  }, []);
  
  // Snapshot des quantités totales au moment de la sauvegarde pour éviter la disparition/réapparition
  const savingQuantitySnapshotRef = useRef<Record<string, number>>({});
  const savingMenuQuantitySnapshotRef = useRef<Record<string, number>>({});

  // Initialisation des itemTypes (une seule fois)
  useEffect(() => {
    if (itemTypes.length > 0 && !activeItemType) {
      setActiveItemType(itemTypes[0].id);
    }
  }, [itemTypes]); // Retirer activeItemType de la dépendance pour éviter la boucle


  // ✅ Index mémorisés pour performances O(1) au lieu de O(n)
  const quantitiesIndex = useMemo(() => {
    const index: Record<string, number> = {};
    draftOrderLines.forEach(draft => {
      if (draft.type === OrderLineType.ITEM && draft.itemId) {
        index[draft.itemId] = draft.quantity;
      }
    });
    return index;
  }, [draftOrderLines]);

  const menuQuantitiesIndex = useMemo(() => {
    const index: Record<string, number> = {};
    draftOrderLines.forEach(draft => {
      if (draft.type === OrderLineType.MENU && draft.menuId) {
        index[draft.menuId] = draft.quantity;
      }
    });
    return index;
  }, [draftOrderLines]);

  const itemsIndex = useMemo(() => {
    const index: Record<string, Item> = {};
    items.forEach(item => {
      index[item.id] = item;
    });
    return index;
  }, [items]);

  const menusIndex = useMemo(() => {
    const index: Record<string, Menu> = {};
    activeMenus.forEach(menu => {
      index[menu.id] = menu;
    });
    return index;
  }, [activeMenus]);

  // ✅ Fonctions optimisées avec accès O(1)
  // 🔧 NOUVELLE LOGIQUE : Obtenir les quantités existantes dans la commande sauvegardée
  const getExistingItemQuantity = useCallback((itemId: string) => {
    let count = 0;
    if (order.lines) {
      order.lines.forEach((line) => {
        // Pour les items individuels
        if (line.type === OrderLineType.ITEM && line.item && (line.item as any).id === itemId) {
          count += line.quantity;
        }
      });
    }
    return count;
  }, [order.lines]);

  // Obtenir la quantité draft (ajoutée localement dans cette session)
  const getDraftItemQuantity = useCallback((itemId: string) => {
    return quantitiesIndex[itemId] || 0;
  }, [quantitiesIndex]);

  // Obtenir la quantité totale affichée avec gestion stable pendant la sauvegarde
  const getTotalItemQuantity = useCallback((itemId: string) => {
    // Pendant la sauvegarde, utiliser le snapshot pour éviter les scintillements
    if (isSavingRef.current && savingQuantitySnapshotRef.current[itemId] !== undefined) {
      return savingQuantitySnapshotRef.current[itemId];
    }
    
    // Fonctionnement normal
    return getExistingItemQuantity(itemId) + getDraftItemQuantity(itemId);
  }, [getExistingItemQuantity, getDraftItemQuantity]);

  // 🔧 NOUVELLE LOGIQUE : Mêmes fonctions pour les menus
  const getExistingMenuQuantity = useCallback((menuId: string) => {
    let count = 0;
    if (order.lines) {
      order.lines.forEach((line) => {
        // Pour les menus
        if (line.type === OrderLineType.MENU && line.menu && line.menu.id === menuId) {
          count += line.quantity;
        }
      });
    }
    return count;
  }, [order.lines]);

  const getDraftMenuQuantity = useCallback((menuId: string) => {
    return menuQuantitiesIndex[menuId] || 0;
  }, [menuQuantitiesIndex]);

  const getTotalMenuQuantity = useCallback((menuId: string) => {
    // Pendant la sauvegarde, utiliser le snapshot pour éviter les scintillements
    if (isSavingRef.current && savingMenuQuantitySnapshotRef.current[menuId] !== undefined) {
      return savingMenuQuantitySnapshotRef.current[menuId];
    }
    
    // Fonctionnement normal
    return getExistingMenuQuantity(menuId) + getDraftMenuQuantity(menuId);
  }, [getExistingMenuQuantity, getDraftMenuQuantity]);

  // 🔧 NOUVELLES FONCTIONS : Calcul des totaux pour le recap avec gestion des snapshots
  const getTotalItemsCount = useCallback(() => {
    // Pendant la sauvegarde, utiliser snapshots pour les items avec drafts + existants pour les autres
    if (isSavingRef.current) {
      const existingItemLines = order.lines?.filter(line => 
        line.type === OrderLineType.ITEM && 
        !savingQuantitySnapshotRef.current[(line.item as any)?.id]
      ) || [];
      
      const itemsWithoutDraftsCount = existingItemLines.reduce((total, line) => total + line.quantity, 0);
      const snapshotItemsCount = Object.values(savingQuantitySnapshotRef.current).reduce((total, quantity) => total + quantity, 0);
      
      return itemsWithoutDraftsCount + snapshotItemsCount;
    }
    
    // Fonctionnement normal
    const existingItemsCount = order.lines
      ?.filter(line => line.type === OrderLineType.ITEM)
      .reduce((total, line) => total + line.quantity, 0) || 0;
    
    const draftItemsCount = draftOrderLines
      .filter(draft => draft.type === OrderLineType.ITEM)
      .reduce((total, draft) => total + draft.quantity, 0);
    
    return existingItemsCount + draftItemsCount;
  }, [order.lines, draftOrderLines]);

  const getTotalMenusCount = useCallback(() => {
    // Pendant la sauvegarde, utiliser snapshots pour les menus avec drafts + existants pour les autres
    if (isSavingRef.current) {
      const existingMenuLines = order.lines?.filter(line => 
        line.type === OrderLineType.MENU && 
        !savingMenuQuantitySnapshotRef.current[line.menu?.id || '']
      ) || [];
      
      const menusWithoutDraftsCount = existingMenuLines.reduce((total, line) => total + line.quantity, 0);
      const snapshotMenusCount = Object.values(savingMenuQuantitySnapshotRef.current).reduce((total, quantity) => total + quantity, 0);
      
      return menusWithoutDraftsCount + snapshotMenusCount;
    }
    
    // Fonctionnement normal
    const existingMenusCount = order.lines
      ?.filter(line => line.type === OrderLineType.MENU)
      .reduce((total, line) => total + line.quantity, 0) || 0;
      
    const draftMenusCount = draftMenus.reduce((total, draft) => total + draft.quantity, 0);
    
    return existingMenusCount + draftMenusCount;
  }, [order.lines, draftMenus]);

  const onUpdateQuantity = (itemId: string, action: 'remove' | 'add') => {
    setDraftItems(prevDraft => {
      const existingDraft = prevDraft.find(draft => draft.itemId === itemId);
      let newDraft = prevDraft;

      if (action === 'add') {
        if (existingDraft) {
          newDraft = prevDraft.map(draft =>
            draft.itemId === itemId
              ? { ...draft, quantity: draft.quantity + 1 }
              : draft
          );
        } else {
          newDraft = [...prevDraft, { itemId, quantity: 1 }];
        }
      } else if (action === 'remove') {
        // 🔧 NOUVELLE SÉCURITÉ : Ne permettre la décrémentation que des items ajoutés localement
        if (existingDraft && existingDraft.quantity > 0) {
          if (existingDraft.quantity <= 1) {
            newDraft = prevDraft.filter(draft => draft.itemId !== itemId);
          } else {
            newDraft = prevDraft.map(draft =>
              draft.itemId === itemId
                ? { ...draft, quantity: draft.quantity - 1 }
                : draft
            );
          }
        } else {
          // Pas d'items draft à supprimer - utiliser AdminOrderDetailView pour supprimer des items sauvegardés
          newDraft = prevDraft;
        }
      }


      return newDraft;
    });
  };

  // Fonction de sauvegarde simplifiée - NOUVELLE LOGIQUE 100% AJOUT
  const processOrderSave = async () => {
    isSavingRef.current = true; // Empêcher les réinitialisations pendant la sauvegarde
    
    // 🔧 NOUVEAU : Créer des snapshots des quantités actuelles pour éviter les scintillements
    const itemQuantitySnapshot: Record<string, number> = {};
    const menuQuantitySnapshot: Record<string, number> = {};
    
    // Snapshot optimisé - seulement les items avec des drafts (car les existants seuls n'ont pas de problème de double comptage)
    draftItems.forEach(draft => {
      itemQuantitySnapshot[draft.itemId] = getExistingItemQuantity(draft.itemId) + draft.quantity;
    });
    
    // Snapshot optimisé - seulement les menus avec des drafts
    draftMenus.forEach(draft => {
      menuQuantitySnapshot[draft.menuId] = getExistingMenuQuantity(draft.menuId) + draft.quantity;
    });
    
    savingQuantitySnapshotRef.current = itemQuantitySnapshot;
    savingMenuQuantitySnapshotRef.current = menuQuantitySnapshot;
    
    // 🔧 NOUVELLE LOGIQUE : Seulement ajouter les drafts (pas de comparaison complexe)
    const itemsToAdd: { itemId: string; quantity: number }[] = [];
    
    // 1. Ajouter tous les items des drafts (ils représentent seulement les nouveaux ajouts)
    draftItems.forEach(draft => {
      if (draft.quantity > 0) {
        itemsToAdd.push({ itemId: draft.itemId, quantity: draft.quantity });
      }
    });

    // 2. Ajouter tous les menus des drafts (ils représentent seulement les nouveaux ajouts)
    const menusToAdd: { menuId: string; selectedItems: Record<string, string[]>; quantity: number }[] = [];
    
    draftMenus.forEach(draftMenu => {
      if (draftMenu.quantity > 0) {
        menusToAdd.push({
          menuId: draftMenu.menuId,
          selectedItems: draftMenu.selectedItems,
          quantity: draftMenu.quantity
        });
      }
    });

    // 3. Préparer les données pour l'API bulk unifiée
    const bulkItems: Array<{
      itemId?: string;
      quantity?: number;
      status?: Status;
      menuId?: string;
      selectedItems?: Record<string, string[]>;
    }> = [];

    // Ajouter les items individuels
    itemsToAdd.forEach(({ itemId, quantity }) => {
      bulkItems.push({
        itemId,
        quantity,
        status: Status.DRAFT
      });
    });

    // Ajouter les menus à créer (calculés dans l'analyse précédente)
    menusToAdd.forEach(menuToAdd => {
      for (let i = 0; i < menuToAdd.quantity; i++) {
        bulkItems.push({
          menuId: menuToAdd.menuId,
          selectedItems: menuToAdd.selectedItems,
          status: Status.DRAFT
        });
      }
    });

    // 4. Envoyer tout en une seule requête bulk
    if (bulkItems.length > 0) {
      const bulkData = {
        orderId: order.id,
        items: bulkItems
      };
      
      // Convertir en CreateOrderLineRequest[]
      const createRequests: CreateOrderLineRequest[] = [];
      
      // Ajouter les items individuels
      itemsToAdd.forEach(({ itemId, quantity }) => {
        createRequests.push({
          type: OrderLineType.ITEM,
          quantity,
          itemId
        });
      });
      
      // Ajouter les menus
      menusToAdd.forEach(menuToAdd => {
        // Convertir selectedItems de Record<string, string[]> vers Record<string, string>
        const selectedItemsConverted: Record<string, string> = {};
        Object.entries(menuToAdd.selectedItems || {}).forEach(([categoryId, itemIds]) => {
          // Prendre le premier item de chaque catégorie (les menus n'autorisent qu'un item par catégorie)
          selectedItemsConverted[categoryId] = Array.isArray(itemIds) ? itemIds[0] : itemIds;
        });
        
        createRequests.push({
          type: OrderLineType.MENU,
          quantity: menuToAdd.quantity,
          menuId: menuToAdd.menuId,
          selectedItems: selectedItemsConverted
        });
      });
      
      // Détecter si c'est une nouvelle commande ou une modification
      if (order.id.startsWith('new-order-')) {
        // NOUVELLE COMMANDE : Créer la commande avec toutes les lignes
        const newOrder = await createOrderWithLines(order.tableId, createRequests);
        // Retourner la nouvelle commande pour que Redux soit mis à jour
        return newOrder;
      } else {
        // COMMANDE EXISTANTE : Ajouter les lignes à la commande existante  
        await createOrderLines(order.id, createRequests);
      }
      
      // 5. 🔧 CORRECTION : Vider les drafts après la sauvegarde
      setDraftItems([]);
      setDraftMenus([]);
      
      // 6. Nettoyer les snapshots et réactiver les réinitialisations
      savingQuantitySnapshotRef.current = {};
      savingMenuQuantitySnapshotRef.current = {};
      isSavingRef.current = false;
    }

    // 7. Retourner l'ordre actuel - les mises à jour seront gérées par le store Redux/WebSocket
    // Si aucun ajout n'a été fait, nettoyer les snapshots et réactiver immédiatement
    if (bulkItems.length === 0) {
      savingQuantitySnapshotRef.current = {};
      savingMenuQuantitySnapshotRef.current = {};
      isSavingRef.current = false;
    }
    return order;
  };



  // Initialisation des draftItems et draftMenus (après définition des fonctions)
  // Utiliser une ref pour suivre l'ID de l'order et ne réinitialiser que lors d'un vrai changement d'order
  const currentOrderIdRef = useRef(order.id);
  useEffect(() => {
    // Ne pas réinitialiser pendant la sauvegarde pour éviter les scintillements
    if (isSavingRef.current) return;
    
    // Ne réinitialiser que si l'order ID a vraiment changé (pas juste une mise à jour WebSocket)
    if (currentOrderIdRef.current !== order.id) {
      currentOrderIdRef.current = order.id;
      setDraftItems([]);
      setDraftMenus([]);
    }
  }, [order]);

  // Implémenter l'interface AdminFormRef pour AdminFormView
  React.useImperativeHandle(ref, () => ({
    getFormData: (): AdminFormData<Order> => {
      const hasChanges = draftItems.length > 0 || draftMenus.length > 0;
      
      return {
        data: {
          ...order,
          draftItems,
          draftMenus,
          processComplexSave: processOrderSave
        } as any,
        isValid: true,
        errors: {},
        hasChanges
      };
    },
    validateForm: () => true,
    resetForm: () => {
      setDraftItems([]);
      setDraftMenus([]);
    }
  }), [order, draftItems, draftMenus, processOrderSave]);


  // Calculer le prix d'un menu avec les suppléments des items sélectionnés
  const calculateMenuPriceWithSupplements = (menu: Menu, selectedItems: Record<string, string | string[]>) => {
    let totalPrice = menu.basePrice;
    
    // Parcourir chaque catégorie et ses items sélectionnés
    Object.entries(selectedItems).forEach(([categoryId, itemSelection]) => {
      const itemIds = Array.isArray(itemSelection) ? itemSelection : [itemSelection];
      const category = menu.categories.find(c => c.id === categoryId);
      if (!category) return;
      
      // Ajouter le priceModifier de la catégorie (supplément par catégorie)
      // Le priceModifier s'applique une seule fois par catégorie qui a des sélections
      if (itemIds.length > 0) {
        const categoryModifier = parseFloat(String(category.priceModifier || '0'));
        totalPrice += categoryModifier;
      }
      
      // Ajouter les suppléments des items individuels
      itemIds.forEach(itemId => {
        const menuCategoryItem = category.items?.find(mci => mci.itemId === itemId);
        if (menuCategoryItem) {
          const supplement = parseFloat(String(menuCategoryItem.supplement || '0'));
          totalPrice += supplement;
        }
      });
    });
    
    return totalPrice;
  };

  // Calculer le prix en temps réel pendant la configuration
  const getCurrentConfigurationPrice = () => {
    if (!menuBeingConfigured) return 0;
    return calculateMenuPriceWithSupplements(menuBeingConfigured, tempMenuSelections);
  };

  // ✅ Calcul mémorisé du prix total avec gestion des snapshots pendant la sauvegarde
  const totalPrice = useMemo(() => {
    // Pendant la sauvegarde, éviter le double comptage en excluant les items/menus qui ont des drafts
    if (isSavingRef.current) {
      // 1. Prix des articles existants qui n'ont PAS de drafts
      const existingItemsWithoutDrafts = (order.lines || [])
        .filter(line => line.type === OrderLineType.ITEM && line.item && !savingQuantitySnapshotRef.current[(line.item as any).id]);
      const existingItemsTotal = existingItemsWithoutDrafts
        .reduce((total, line) => total + line.totalPrice, 0);
      
      // 2. Prix des menus existants qui n'ont PAS de drafts
      const menuGroups = getMenuOrderGroupsByOrderId(order.id) || [];
      const existingMenusWithoutDrafts = menuGroups.filter(mg => !savingMenuQuantitySnapshotRef.current[mg.menuId]);
      const existingMenusTotal = existingMenusWithoutDrafts
        .reduce((total, menuGroup) => total + parseFloat(menuGroup.totalPrice.toString()), 0);
      
      // 3. Prix des articles depuis les snapshots (existants + drafts)
      const snapshotItemsTotal = draftItems.reduce((total, draft) => {
        const item = itemsIndex[draft.itemId];
        if (item && savingQuantitySnapshotRef.current[draft.itemId]) {
          // Utiliser la quantité du snapshot (existant + draft) au prix unitaire
          return total + (item.price * savingQuantitySnapshotRef.current[draft.itemId]);
        }
        return total;
      }, 0);
      
      // 4. Prix des menus depuis les snapshots (existants + drafts)
      const snapshotMenusTotal = draftMenus.reduce((total, draft) => {
        const menu = menusIndex[draft.menuId];
        if (menu && savingMenuQuantitySnapshotRef.current[draft.menuId]) {
          const menuPriceWithSupplements = calculateMenuPriceWithSupplements(menu, draft.selectedItems || {});
          // Utiliser la quantité du snapshot (existant + draft) au prix unitaire
          return total + (menuPriceWithSupplements * savingMenuQuantitySnapshotRef.current[draft.menuId]);
        }
        return total;
      }, 0);
      
      return existingItemsTotal + existingMenusTotal + snapshotItemsTotal + snapshotMenusTotal;
    }
    
    // Fonctionnement normal
    // 1. Prix des articles existants (sauvegardés)
    const existingItemsTotal = (order.lines || [])
      .filter(line => line.type === OrderLineType.ITEM)
      .reduce((total, line) => total + line.totalPrice, 0);
    
    // 2. Prix des menus existants (sauvegardés)
    const menuGroups = getMenuOrderGroupsByOrderId(order.id);
    const existingMenusTotal = menuGroups.reduce((total, menuGroup) => {
      return total + parseFloat(menuGroup.totalPrice.toString());
    }, 0);
    
    // 3. Prix des articles ajoutés localement
    const draftItemsTotal = draftItems.reduce((total, draft) => {
      const item = itemsIndex[draft.itemId];
      return total + (item ? item.price * draft.quantity : 0);
    }, 0);
    
    // 4. Prix des menus ajoutés localement
    const draftMenusTotal = draftMenus.reduce((total, draft) => {
      const menu = menusIndex[draft.menuId];
      if (menu) {
        const menuPriceWithSupplements = calculateMenuPriceWithSupplements(menu, draft.selectedItems || {});
        return total + (menuPriceWithSupplements * draft.quantity);
      }
      return total;
    }, 0);
    
    return existingItemsTotal + existingMenusTotal + draftItemsTotal + draftMenusTotal;
  }, [order.lines, getMenuOrderGroupsByOrderId, order.id, draftItems, draftMenus, itemsIndex, menusIndex]);


  // ✅ Vérifier si un menu peut être ajouté directement (toutes catégories requises = 1 article ou 0 article)
  const canAddMenuDirectly = useCallback((menu: Menu): boolean => {
    if (!menu || !menu.categories || menu.categories.length === 0) {
      return false;
    }

    // Vérifier chaque catégorie
    for (const category of menu.categories) {
      // ✅ Si la catégorie est optionnelle, on ne peut pas ajouter directement
      if (!category.isRequired) {
        return false;
      }

      const menuCategoryItems = getMenuCategoryItems(category.id);
      const availableItems = menuCategoryItems.filter((menuCategoryItem: MenuCategoryItem) => {
        const fullItem = items.find(item => item.id === menuCategoryItem.itemId);
        return menuCategoryItem.isAvailable && fullItem && fullItem.isActive;
      });

      // ✅ Catégorie requise doit avoir exactement 1 article OU 0 article (cas rare mais possible)
      if (availableItems.length !== 1 && availableItems.length !== 0) {
        return false;
      }
    }

    return true;
  }, [getMenuCategoryItems, items]);

  // ✅ Ajouter un menu directement sans configuration
  const addMenuDirectly = useCallback((menu: Menu) => {
    if (!menu || !menu.categories) return;

    // Construire automatiquement les sélections (1 article par catégorie ou vide si 0 article)
    const autoSelections: Record<string, string[]> = {};
    let selectedItemsCount = 0;
    
    menu.categories.forEach((category) => {
      const menuCategoryItems = getMenuCategoryItems(category.id);
      const availableItems = menuCategoryItems.filter((menuCategoryItem: MenuCategoryItem) => {
        const fullItem = items.find(item => item.id === menuCategoryItem.itemId);
        return menuCategoryItem.isAvailable && fullItem && fullItem.isActive;
      });

      if (availableItems.length === 1) {
        // Catégorie avec 1 article : sélectionner automatiquement
        autoSelections[category.id] = [availableItems[0].itemId];
        selectedItemsCount++;
      } else if (availableItems.length === 0) {
        // ✅ Catégorie vide : tableau vide (considérée comme auto-select)
        autoSelections[category.id] = [];
      }
    });

    // Ajouter le menu aux brouillons
    const newDraftMenu = {
      menuId: menu.id,
      quantity: 1,
      selectedItems: autoSelections
    };

    setDraftMenus(prevDraft => {
      const existingDraft = prevDraft.find(draft => draft.menuId === menu.id);
      if (existingDraft) {
        return prevDraft.map(draft =>
          draft.menuId === menu.id
            ? { ...draft, quantity: draft.quantity + 1 }
            : draft
        );
      } else {
        return [...prevDraft, newDraftMenu];
      }
    });
  }, [getMenuCategoryItems, items]);

  const onUpdateMenuQuantity = (menuId: string, action: 'remove' | 'add') => {
    if (action === 'add') {
      const menu = activeMenus.find(m => m.id === menuId);
      if (menu) {
        // D'abord, vérifier s'il y a déjà un menu existant avec la même configuration
        const existingMenuDraft = draftMenus.find(draft => draft.menuId === menuId);
        
        // ✅ Vérifier d'abord si ce menu nécessite une configuration
        if (canAddMenuDirectly(menu)) {
          // Menu simple : peut être ajouté directement
          if (existingMenuDraft) {
            // Incrémenter le menu existant
            setDraftMenus(prevDraft => {
              const newDraft = prevDraft.map(draft =>
                draft.menuId === menuId
                  ? { ...draft, quantity: draft.quantity + 1 }
                  : draft
              );
              return newDraft;
            });
          } else {
            // Ajouter un nouveau menu simple
            addMenuDirectly(menu);
          }
        } else {
          // Menu avec configuration : toujours ouvrir la configuration
          // même s'il y en a déjà un, pour permettre différentes sélections
          startMenuConfiguration(menu);
        }
      }
    } else if (action === 'remove') {
      // 🔧 NOUVELLE SÉCURITÉ : Ne permettre la décrémentation que des menus ajoutés localement
      setDraftMenus(prevDraft => {
        const existingDraft = prevDraft.find(draft => draft.menuId === menuId);
        if (existingDraft && existingDraft.quantity > 0) {
          if (existingDraft.quantity <= 1) {
            return prevDraft.filter(draft => draft.menuId !== menuId);
          } else {
            return prevDraft.map(draft =>
              draft.menuId === menuId
                ? { ...draft, quantity: draft.quantity - 1 }
                : draft
            );
          }
        } else {
          // Pas de menus draft à supprimer - utiliser AdminOrderDetailView pour supprimer des menus sauvegardés
          return prevDraft;
        }
      });
    }
  };

  // Fonction pour démarrer la configuration d'un menu (optimisée pour les performances mobiles)
  const startMenuConfiguration = async (menu: Menu) => {
    // Utiliser React.startTransition pour batching optimal des re-renders
    React.startTransition(() => {
      // 1. Notifier le parent EN PREMIER pour déclencher immédiatement le changement d'interface
      if (onConfigurationModeChange) {
        onConfigurationModeChange(true);
      }
      
      if (onConfigurationActionsChange) {
        onConfigurationActionsChange({
          onCancel: () => cancelMenuConfiguration(),
          onConfirm: () => confirmMenuConfiguration()
        });
      }
      
      // 2. Configurer l'état local APRÈS pour éviter les re-renders intermédiaires
      setIsConfiguringMenu(true);
      setMenuBeingConfigured(menu);
      // ✅ tempMenuSelections sera initialisé après l'analyse des catégories
      
      // activeConfigCategory supprimé car inutilisé
    });
    
    // 3. Préparer les données de référence (synchrone, n'affecte pas les re-renders)
    menuBeingConfiguredRef.current = menu;
    tempMenuSelectionsRef.current = {};
    
    // Préparer les items des catégories depuis la structure du menu
    prepareMenuItemsFromCategories(menu);
    
    // ✅ 4. Optimisation : Sélection automatique des articles uniques par catégorie
    autoSelectUniqueItemsInCategories(menu);
  };

  // Préparer les items depuis les catégories du menu
  const prepareMenuItemsFromCategories = (menu: Menu) => {
    if (!menu || !menu.categories) {
      return;
    }
    
    const itemsData: Record<string, any[]> = {};
    
    menu.categories.forEach((category) => {
      // ✅ Utiliser le store Redux au lieu de category.items pour avoir les données à jour
      const menuCategoryItems = getMenuCategoryItems(category.id);
      
      const categoryItems = menuCategoryItems.map((menuCategoryItem: MenuCategoryItem) => {
        // Trouver l'item complet dans le store
        const fullItem = items.find(item => item.id === menuCategoryItem.itemId);
        return {
          ...menuCategoryItem,
          item: fullItem
        };
      }).filter((item: any) => item.isAvailable && item.item) || [];
      
      itemsData[category.id] = categoryItems;
    });
    
    setMenuCategoryItems(itemsData);
  };

  // ✅ Optimisation : Sélection automatique des articles uniques par catégorie
  const autoSelectUniqueItemsInCategories = (menu: Menu) => {
    if (!menu || !menu.categories) {
      return;
    }

    const autoSelections: Record<string, string[]> = {};
    let hasAutoSelections = false;

    menu.categories.forEach((category) => {
      // ✅ Filtrer les items disponibles depuis le store Redux
      const menuCategoryItems = getMenuCategoryItems(category.id);
      const availableItems = menuCategoryItems.filter((menuCategoryItem: MenuCategoryItem) => {
        const fullItem = items.find(item => item.id === menuCategoryItem.itemId);
        return menuCategoryItem.isAvailable && fullItem && fullItem.isActive;
      });

      // ✅ Si la catégorie est requise ET n'a qu'un seul article, le sélectionner automatiquement
      if (category.isRequired && availableItems.length === 1) {
        autoSelections[category.id] = [availableItems[0].itemId];
        hasAutoSelections = true;
      } else if (category.isRequired && availableItems.length === 0) {
        // ✅ Catégorie requise vide : considérée comme auto-sélectée
        autoSelections[category.id] = [];
        hasAutoSelections = true;
      } else {
        // ✅ Catégorie optionnelle ou avec choix multiples : laisser vide (non sélectionnée)
        autoSelections[category.id] = [];
      }
    });

    // Appliquer les sélections automatiques si il y en a
    if (hasAutoSelections) {
      React.startTransition(() => {
        setTempMenuSelections(autoSelections);
        tempMenuSelectionsRef.current = autoSelections;
      });
    } else {
      // Pas de sélections automatiques, initialiser vide
      React.startTransition(() => {
        setTempMenuSelections({});
        tempMenuSelectionsRef.current = {};
      });
    }
  };

  // Fonction pour obtenir le nom de la catégorie depuis l'itemTypeId
  const getCategoryNameFromItemTypeId = (itemTypeId: string | undefined) => {
    if (!itemTypeId) return 'Catégorie';
    const itemType = itemTypes.find(type => type.id === itemTypeId);
    return itemType ? itemType.name : 'Catégorie';
  };

  // Fonction pour basculer la sélection d'un item dans une catégorie
  const toggleItemSelection = (categoryId: string, itemId: string) => {
    // Vérifier qu'on est encore en mode configuration pour éviter les conflits
    if (!isConfiguringMenu || !menuBeingConfigured) {
      return;
    }
    
    setTempMenuSelections(prev => {
      const currentSelections = prev[categoryId] || [];
      const isSelected = currentSelections.includes(itemId);
      
      let newSelections;
      if (isSelected) {
        // Retirer l'item
        newSelections = {
          ...prev,
          [categoryId]: currentSelections.filter(id => id !== itemId)
        };
      } else {
        // Ajouter l'item (en respectant maxSelections)
        const category = menuBeingConfigured?.categories.find(c => c.id === categoryId);
        if (category && currentSelections.length >= category.maxSelections) {
          showToast(`Maximum ${category.maxSelections} sélection(s) pour cette catégorie`, 'warning');
          return prev;
        }
        newSelections = {
          ...prev,
          [categoryId]: [...currentSelections, itemId]
        };
      }
      
      // Synchroniser avec la référence
      tempMenuSelectionsRef.current = newSelections;
      return newSelections;
    });
  };

  // Annuler la configuration (optimisée pour les performances mobiles)
  const cancelMenuConfiguration = () => {
    // Utiliser React.startTransition pour batching optimal des updates
    React.startTransition(() => {
      // 1. Notifier le parent AVANT les changements d'état locaux pour transition fluide
      if (onConfigurationActionsChange) {
        onConfigurationActionsChange(null);
      }
      
      if (onConfigurationModeChange) {
        onConfigurationModeChange(false);
      }
      
      // 2. Nettoyer l'état local EN DERNIER pour éviter les re-renders intermédiaires
      setIsConfiguringMenu(false);
      setMenuBeingConfigured(null);
      setTempMenuSelections({});
      setMenuCategoryItems({});
      // activeConfigCategory supprimé car inutilisé
    });
    
    // 3. Nettoyer les refs (synchrone, n'affecte pas les re-renders)
    menuBeingConfiguredRef.current = null;
    tempMenuSelectionsRef.current = {};
  };

  // Confirmer et ajouter le menu
  const confirmMenuConfiguration = () => {
    const currentMenu = menuBeingConfiguredRef.current || menuBeingConfigured;
    if (!currentMenu) {
      return;
    }

    // Utiliser la référence stable pour les sélections
    const currentSelections = tempMenuSelectionsRef.current;

    // Vérifier que toutes les catégories obligatoires sont remplies
    const missingRequired = currentMenu.categories.filter(category => {
      if (!category.isRequired) return false;
      const selections = currentSelections[category.id] || [];
      return selections.length === 0;
    });

    if (missingRequired.length > 0) {
      const categoryNames = missingRequired.map(cat => getCategoryNameFromItemTypeId(cat.itemTypeId)).join(', ');
      showToast(`Veuillez sélectionner des articles pour : ${categoryNames}`, 'warning');
      return;
    }

    // Ajouter le menu aux drafts
    setDraftMenus(prev => {
      const existingDraft = prev.find(draft => draft.menuId === currentMenu.id);
      const newDrafts = existingDraft ? 
        prev.map(draft =>
          draft.menuId === currentMenu.id
            ? { ...draft, quantity: draft.quantity + 1, selectedItems: currentSelections }
            : draft
        ) :
        [...prev, { 
          menuId: currentMenu.id, 
          quantity: 1, 
          selectedItems: currentSelections 
        }];
      
      return newDrafts;
    });

    showToast(`Menu "${currentMenu.name}" ajouté avec succès`, 'success');
    
    // Fermer immédiatement sans délai pour éviter la latence
    cancelMenuConfiguration();
  };



  return (
    <View style={styles.container}>
      {/* Header Compact - Navigation uniquement */}
      {!isConfiguringMenu && (
        <View style={styles.compactHeader}>
          {/* Navigation principale - Menu et Articles sur la même ligne */}
          <View style={styles.mainNavigation}>
          {Platform.OS === 'web' ? (
            <>
              <div
                style={{
                  ...styles.mainNavButton,
                  ...(activeMainTab === 'MENUS' && {
                    backgroundColor: '#2A2E33',
                    borderColor: '#2A2E33',
                  }),
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
                onClick={() => setActiveMainTab('MENUS')}
              >
                <span style={{
                  ...styles.mainNavButtonText,
                  ...(activeMainTab === 'MENUS' && {
                    color: '#FFFFFF',
                    fontWeight: '700'
                  })
                }}>
                  Menus
                </span>
              </div>
              
              <div
                style={{
                  ...styles.mainNavButton,
                  ...(activeMainTab === 'ITEMS' && {
                    backgroundColor: '#2A2E33',
                    borderColor: '#2A2E33',
                  }),
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
                onClick={() => setActiveMainTab('ITEMS')}
              >
                <span style={{
                  ...styles.mainNavButtonText,
                  ...(activeMainTab === 'ITEMS' && {
                    color: '#FFFFFF',
                    fontWeight: '700'
                  })
                }}>
                  Articles
                </span>
              </div>
            </>
          ) : (
            <>
              <Pressable
                style={[
                  styles.mainNavButton,
                  activeMainTab === 'MENUS' && styles.mainNavButtonActive
                ]}
                onPress={() => setActiveMainTab('MENUS')}
              >
                <Text style={[
                  styles.mainNavButtonText,
                  activeMainTab === 'MENUS' && styles.mainNavButtonTextActive
                ]}>
                  Menus
                </Text>
              </Pressable>
              
              <Pressable
                style={[
                  styles.mainNavButton,
                  activeMainTab === 'ITEMS' && styles.mainNavButtonActive
                ]}
                onPress={() => setActiveMainTab('ITEMS')}
              >
                <Text style={[
                  styles.mainNavButtonText,
                  activeMainTab === 'ITEMS' && styles.mainNavButtonTextActive
                ]}>
                  Articles
                </Text>
              </Pressable>
            </>
          )}
        </View>

        {/* Types d'articles - en dessous si Articles sélectionné */}
        {activeMainTab === 'ITEMS' && (
          <View style={styles.subNavigation}>
            <View style={styles.categoryButtons}>
              {itemTypes.map((itemType) => {
                return Platform.OS === 'web' ? (
                  <div
                    key={itemType.id}
                    style={{
                      ...styles.subCategoryButton,
                      ...(activeItemType === itemType.id && {
                        backgroundColor: '#2A2E33',
                        borderColor: '#2A2E33',
                      }),
                      paddingLeft: '20px', // Padding 10px de chaque côté
                      paddingRight: '20px',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}
                    onClick={() => setActiveItemType(itemType.id)}
                  >
                    <span style={{
                      ...styles.subCategoryButtonText,
                      ...(activeItemType === itemType.id && {
                        color: '#FFFFFF',
                        fontWeight: '600'
                      })
                    }}>
                      {itemType.name}
                    </span>
                  </div>
                ) : (
                  <Pressable
                    key={itemType.id}
                    style={[
                      styles.subCategoryButton,
                      activeItemType === itemType.id && styles.subCategoryButtonActive
                    ]}
                    onPress={() => setActiveItemType(itemType.id)}
                  >
                    <Text style={[
                      styles.subCategoryButtonText,
                      activeItemType === itemType.id && styles.subCategoryButtonTextActive
                    ]}>
                      {itemType.name}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </View>
        )}
      </View>
      )}


      {/* Section Articles - Bloc principal */}
      <View style={styles.mainArticlesSection}>
        
        {/* Version une ligne par article */}
        <ScrollView
          style={styles.optimizedScrollView}
          contentContainerStyle={styles.optimizedScrollContent}
          showsVerticalScrollIndicator={true}
          scrollEventThrottle={16}
          bounces={true}
          keyboardShouldPersistTaps="handled"
        >
          {isConfiguringMenu && menuBeingConfigured ? (
            // Vue de configuration du menu - Structure avec navigation
            <>
              {/* 1. Header de configuration style MenuEditor */}
              <View style={styles.menuEditorConfigHeader}>
                <View style={styles.sectionHeaderInline}>
                  <View style={styles.sectionIconContainer}>
                    <MenuIcon size={20} color="#2A2E33" />
                  </View>
                  <View style={styles.sectionHeaderText}>
                    {Platform.OS === 'web' ? (
                      <>
                        <span style={{
                          fontSize: '18px',
                          fontWeight: '700',
                          color: '#2A2E33',
                          letterSpacing: '0.5px',
                          marginBottom: '4px',
                          fontFamily: 'system-ui, -apple-system, sans-serif',
                          display: 'block'
                        }}>
                          Configuration "{menuBeingConfigured.name}"
                        </span>
                        <span style={{
                          fontSize: '14px',
                          color: '#6B7280',
                          fontWeight: '500',
                          fontFamily: 'system-ui, -apple-system, sans-serif'
                        }}>
                          {getCurrentConfigurationPrice().toFixed(2)}€ • Personnalisez votre sélection d'articles
                        </span>
                      </>
                    ) : (
                      <>
                        <Text style={styles.sectionHeaderTitle}>Configuration "{menuBeingConfigured.name}"</Text>
                        <Text style={styles.sectionHeaderSubtitle}>
                          {getCurrentConfigurationPrice().toFixed(2)}€ • Personnalisez votre sélection d'articles
                        </Text>
                      </>
                    )}
                  </View>
                </View>
              </View>

              {/* 2. Sections de catégories style MenuEditor */}
              {menuBeingConfigured.categories.map((category, index) => {
                const categoryName = getCategoryNameFromItemTypeId(category.itemTypeId);
                const selectedItems = tempMenuSelections[category.id] || [];
                const hasSupplementPrice = parseFloat(category.priceModifier?.toString() || '0') > 0;
                
                return (
                  <View key={category.id} style={styles.categoryCardMenuConfig}>
                    {/* Header de catégorie style MenuEditor */}
                    <View style={styles.categoryHeaderMenuEditor}>
                      <View style={styles.categoryHeaderContent}>
                        {Platform.OS === 'web' ? (
                          <div style={{
                            width: '32px',
                            height: '32px',
                            borderRadius: '8px',
                            backgroundColor: '#2A2E33',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            marginRight: '16px'
                          }}>
                            <span style={{
                              color: '#FFFFFF',
                              fontSize: '14px',
                              fontWeight: '700',
                              fontFamily: 'system-ui, -apple-system, sans-serif'
                            }}>
                              {index + 1}
                            </span>
                          </div>
                        ) : (
                          <View style={styles.categoryNumberBadge}>
                            <Text style={styles.categoryNumberText}>{index + 1}</Text>
                          </View>
                        )}
                        <View style={styles.categoryHeaderInfo}>
                          {Platform.OS === 'web' ? (
                            <>
                              <span style={{
                                fontSize: '16px',
                                fontWeight: '700',
                                color: '#2A2E33',
                                marginBottom: '1px',
                                letterSpacing: '0.3px',
                                fontFamily: 'system-ui, -apple-system, sans-serif',
                                display: 'block'
                              }}>
                                {categoryName}
                              </span>
                              <span style={{
                                fontSize: '13px',
                                color: '#6B7280',
                                fontWeight: '500',
                                fontFamily: 'system-ui, -apple-system, sans-serif'
                              }}>
                                {category.isRequired ? 'Obligatoire' : 'Optionnel'} • {selectedItems.length} / {category.maxSelections || 1} sélection{(category.maxSelections || 1) > 1 ? 's' : ''}
                              </span>
                            </>
                          ) : (
                            <>
                              <Text style={styles.categoryHeaderTitle}>
                                {categoryName}
                              </Text>
                              <Text style={styles.categoryHeaderSubtitle}>
                                {category.isRequired ? 'Obligatoire' : 'Optionnel'} • {selectedItems.length} / {category.maxSelections || 1} sélection{(category.maxSelections || 1) > 1 ? 's' : ''}
                              </Text>
                            </>
                          )}
                        </View>
                        {hasSupplementPrice && (
                          Platform.OS === 'web' ? (
                            <div style={{
                              backgroundColor: '#EEF2FF',
                              paddingLeft: '8px',
                              paddingRight: '8px',
                              paddingTop: '4px',
                              paddingBottom: '4px',
                              borderRadius: '6px',
                              alignSelf: 'center'
                            }}>
                              <span style={{
                                fontSize: '12px',
                                fontWeight: '500',
                                color: '#4338CA',
                                fontFamily: 'system-ui, -apple-system, sans-serif'
                              }}>
                                + {category.priceModifier} € de Supplément
                              </span>
                            </div>
                          ) : (
                            <View style={styles.categorySupplementTag}>
                              <Text style={styles.categorySupplementTagText}>+ {category.priceModifier} € de Supplément</Text>
                            </View>
                          )
                        )}
                      </View>
                    </View>

                    {/* Articles de la catégorie */}
                    <View style={styles.categoryItemsListContainer}>
                      {!menuCategoryItems[category.id] && (
                        <Text style={styles.noCategoryItemsText}>
                          Aucun article disponible pour cette catégorie
                        </Text>
                      )}
                      {menuCategoryItems[category.id] && menuCategoryItems[category.id]
                        .filter((item: any) => item.isAvailable)
                        .map((menuCategoryItem: any) => {
                          const item = menuCategoryItem?.item;
                          if (!item) return null;
                          
                          const supplement = parseFloat(menuCategoryItem.supplement || '0');
                          const isSelected = selectedItems.includes(item.id);
                          const hasSupplementPrice = supplement > 0;

                          return (
                            <Pressable
                              key={menuCategoryItem.id}
                              style={[
                                styles.menuEditorItemCard,
                                isSelected && styles.menuEditorItemCardSelected
                              ]}
                              onPress={() => {
                                // Éviter les clics multiples pendant la transition
                                if (isConfiguringMenu && menuBeingConfigured) {
                                  toggleItemSelection(category.id, item.id);
                                }
                              }}
                            >
                              <View style={styles.menuEditorItemMainContent}>
                                <View style={styles.menuEditorItemInfoNew}>
                                  <View style={styles.menuEditorItemNameRow}>
                                    {Platform.OS === 'web' ? (
                                      <span style={{
                                        fontSize: '15px',
                                        fontWeight: '700',
                                        color: '#1E293B',
                                        letterSpacing: '0.2px',
                                        flex: 1,
                                        fontFamily: 'system-ui, -apple-system, sans-serif'
                                      }}>
                                        {item.name}
                                      </span>
                                    ) : (
                                      <Text style={styles.menuEditorItemNameNew}>
                                        {item.name}
                                      </Text>
                                    )}
                                    {hasSupplementPrice && (
                                      Platform.OS === 'web' ? (
                                        <div style={{
                                          backgroundColor: '#FEF3C7',
                                          paddingLeft: '8px',
                                          paddingRight: '8px',
                                          paddingTop: '4px',
                                          paddingBottom: '4px',
                                          borderRadius: '6px'
                                        }}>
                                          <span style={{
                                            fontSize: '12px',
                                            fontWeight: '700',
                                            color: '#92400E',
                                            fontFamily: 'system-ui, -apple-system, sans-serif'
                                          }}>
                                            +{supplement.toFixed(2)}€
                                          </span>
                                        </div>
                                      ) : (
                                        <View style={styles.menuEditorItemSupplement}>
                                          <Text style={styles.menuEditorItemSupplementText}>
                                            +{supplement.toFixed(2)}€
                                          </Text>
                                        </View>
                                      )
                                    )}
                                  </View>
                                </View>
                                
                                <View style={styles.menuEditorItemActionsNew}>
                                  <View style={[
                                    styles.menuEditorItemCheckbox,
                                    isSelected && styles.menuEditorItemCheckboxSelected
                                  ]}>
                                    {isSelected && (
                                      <Text style={styles.menuEditorItemCheckboxIcon}>✓</Text>
                                    )}
                                  </View>
                                </View>
                              </View>
                            </Pressable>
                          );
                        })}
                    </View>
                  </View>
                );
              })}
            </>
          ) : activeMainTab === 'MENUS' ? (
            activeMenus.length === 0 ? (
              <View style={styles.emptyState}>
                <MenuIcon size={48} color="#ccc" />
                <Text style={styles.emptyStateTitle}>Aucun menu disponible</Text>
                <Text style={styles.emptyStateSubtitle}>
                  Aucun menu n'est actuellement disponible.
                </Text>
              </View>
            ) : (
              // Liste simple des menus comme des articles
              activeMenus.map((menu) => {
                const totalQuantity = getTotalMenuQuantity(menu.id);
                const draftQuantity = getDraftMenuQuantity(menu.id);

                return (
                  <View key={menu.id} style={styles.compactItemCard}>
                    <View style={styles.compactItemRow}>
                      <View style={styles.compactItemInfo}>
                        {Platform.OS === 'web' ? (
                          <>
                            <span style={{
                              fontSize: '14px',
                              fontWeight: '600',
                              color: '#1E293B',
                              marginBottom: '2px',
                              letterSpacing: '0.2px',
                              fontFamily: 'system-ui, -apple-system, sans-serif',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap'
                            }}>
                              {menu.name}
                            </span>
                            <span style={{
                              fontSize: '13px',
                              fontWeight: '700',
                              color: '#475569',
                              fontFamily: 'system-ui, -apple-system, sans-serif'
                            }}>
                              {menu.basePrice}€
                            </span>
                          </>
                        ) : (
                          <>
                            <Text style={styles.compactItemName} numberOfLines={1}>
                              {menu.name}
                            </Text>
                            <Text style={styles.compactItemPrice}>
                              {menu.basePrice}€
                            </Text>
                          </>
                        )}
                      </View>

                      <View style={styles.compactQuantityContainer}>
                        <Pressable
                          onPress={() => onUpdateMenuQuantity(menu.id, 'remove')}
                          style={[
                            dynamicButtonStyles, 
                            // 🔧 NOUVELLE LOGIQUE : Désactiver si pas de menus draft à supprimer
                            draftQuantity === 0 && styles.compactQuantityButtonDisabled
                          ]}
                          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                          disabled={draftQuantity === 0}
                        >
                          <Minus size={14} color={draftQuantity === 0 ? "#D1D5DB" : "#2A2E33"} strokeWidth={2} />
                        </Pressable>

                        <Text style={styles.compactQuantityText}>
                          {totalQuantity}
                        </Text>

                        <Pressable
                          onPress={() => onUpdateMenuQuantity(menu.id, 'add')}
                          style={dynamicButtonStyles}
                          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                                                  >
                          <Plus size={14} color="#2A2E33" strokeWidth={2} />
                        </Pressable>
                      </View>
                    </View>
                  </View>
                );
              })
            )
          ) : (
            (() => {
              const filteredItems = items.filter(item => item.itemType.id === activeItemType);
              
              if (filteredItems.length === 0) {
                return (
                  <View style={styles.emptyState}>
                    <Text style={styles.emptyStateTitle}>Aucun article disponible</Text>
                    <Text style={styles.emptyStateSubtitle}>
                      Aucun article n'est disponible pour cette catégorie.
                    </Text>
                  </View>
                );
              }
              
              return filteredItems.map((item) => {
                const totalQuantity = getTotalItemQuantity(item.id);
                const draftQuantity = getDraftItemQuantity(item.id);

                return (
                  <View key={item.id} style={styles.compactItemCard}>
                    <View style={styles.compactItemRow}>
                      <View style={styles.compactItemInfo}>
                        {Platform.OS === 'web' ? (
                          <>
                            <span style={{
                              fontSize: '14px',
                              fontWeight: '600',
                              color: '#1E293B',
                              marginBottom: '2px',
                              letterSpacing: '0.2px',
                              fontFamily: 'system-ui, -apple-system, sans-serif',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap'
                            }}>
                              {item.name}
                            </span>
                            <span style={{
                              fontSize: '13px',
                              fontWeight: '700',
                              color: '#475569',
                              fontFamily: 'system-ui, -apple-system, sans-serif'
                            }}>
                              {item.price}€
                            </span>
                          </>
                        ) : (
                          <>
                            <Text style={styles.compactItemName} numberOfLines={1}>
                              {item.name}
                            </Text>
                            <Text style={styles.compactItemPrice}>
                              {item.price}€
                            </Text>
                          </>
                        )}
                      </View>

                      <View style={styles.compactQuantityContainer}>
                        <Pressable
                          onPress={() => onUpdateQuantity(item.id, 'remove')}
                          style={[
                            dynamicButtonStyles, 
                            // 🔧 NOUVELLE LOGIQUE : Désactiver si pas d'items draft à supprimer
                            draftQuantity === 0 && styles.compactQuantityButtonDisabled
                          ]}
                          disabled={draftQuantity === 0}
                          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                        >
                          <Minus size={14} color={draftQuantity === 0 ? "#D1D5DB" : "#2A2E33"} strokeWidth={2} />
                        </Pressable>

                        <Text style={styles.compactQuantityText}>
                          {totalQuantity}
                        </Text>

                        <Pressable
                          onPress={() => onUpdateQuantity(item.id, 'add')}
                          style={dynamicButtonStyles}
                          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                                                  >
                          <Plus size={14} color="#2A2E33" strokeWidth={2} />
                        </Pressable>
                      </View>
                    </View>
                  </View>
                );
              });
            })()
          )}
        </ScrollView>
      </View>



      {/* Résumé en bas - Masqué pendant la configuration - Repositionné au niveau du container principal */}
      {!isConfiguringMenu && (
        <View style={styles.bottomSummary}>
          <View style={styles.bottomSummaryContent}>
            {/* Articles */}
            <View style={styles.bottomSummaryItem}>
              {Platform.OS === 'web' ? (
                <>
                  <span style={{
                    fontSize: '16px',
                    fontWeight: '700',
                    color: '#2A2E33',
                    textAlign: 'center',
                    fontFamily: 'system-ui, -apple-system, sans-serif'
                  }}>
                    {getTotalItemsCount()}
                  </span>
                  <span style={{
                    fontSize: '10px',
                    fontWeight: '500',
                    color: '#6B7280',
                    textAlign: 'center',
                    marginTop: '1px',
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px',
                    fontFamily: 'system-ui, -apple-system, sans-serif'
                  }}>
                    articles
                  </span>
                </>
              ) : (
                <>
                  <Text style={styles.bottomSummaryValue}>
                    {getTotalItemsCount()}
                  </Text>
                  <Text style={styles.bottomSummaryLabel}>articles</Text>
                </>
              )}
            </View>
            
            {/* Séparateur */}
            {getTotalMenusCount() > 0 && <View style={styles.bottomSummaryDivider} />}
            
            {/* Menus - Affiché seulement s'il y en a */}
            {getTotalMenusCount() > 0 && (
              <View style={styles.bottomSummaryItem}>
                {Platform.OS === 'web' ? (
                  <>
                    <span style={{
                      fontSize: '16px',
                      fontWeight: '700',
                      color: '#7C3AED',
                      textAlign: 'center',
                      fontFamily: 'system-ui, -apple-system, sans-serif'
                    }}>
                      {getTotalMenusCount()}
                    </span>
                    <span style={{
                      fontSize: '10px',
                      fontWeight: '500',
                      color: '#6B7280',
                      textAlign: 'center',
                      marginTop: '1px',
                      textTransform: 'uppercase',
                      letterSpacing: '0.5px',
                      fontFamily: 'system-ui, -apple-system, sans-serif'
                    }}>
                      menus
                    </span>
                  </>
                ) : (
                  <>
                    <Text style={[styles.bottomSummaryValue, { color: '#7C3AED' }]}>
                      {getTotalMenusCount()}
                    </Text>
                    <Text style={styles.bottomSummaryLabel}>menus</Text>
                  </>
                )}
              </View>
            )}
            
            {/* Séparateur avant total */}
            <View style={styles.bottomSummaryDivider} />
            
            {/* Total */}
            <View style={styles.bottomSummaryItem}>
              {Platform.OS === 'web' ? (
                <>
                  <span style={{
                    fontSize: '16px',
                    fontWeight: '700',
                    color: '#059669',
                    textAlign: 'center',
                    fontFamily: 'system-ui, -apple-system, sans-serif'
                  }}>
                    {totalPrice.toFixed(2)}€
                  </span>
                  <span style={{
                    fontSize: '10px',
                    fontWeight: '500',
                    color: '#6B7280',
                    textAlign: 'center',
                    marginTop: '1px',
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px',
                    fontFamily: 'system-ui, -apple-system, sans-serif'
                  }}>
                    total
                  </span>
                </>
              ) : (
                <>
                  <Text style={styles.bottomSummaryPrice}>{totalPrice.toFixed(2)}€</Text>
                  <Text style={styles.bottomSummaryLabel}>total</Text>
                </>
              )}
            </View>
          </View>
        </View>
      )}

    </View>
  );
});

export default OrderItemsForm;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },

  // Structure des sections - Inspirée de MenuForm
  section: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    paddingHorizontal: 26,
    paddingVertical: 20,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#F3F4F6',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },

  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#2A2E33',
    marginBottom: 24,
    paddingBottom: 12,
    borderBottomWidth: 2,
    borderBottomColor: '#F3F4F6',
    letterSpacing: 0.5,
  },

  // Système de lignes et colonnes - Inspiré de MenuForm
  row: {
    flexDirection: 'row',
    marginBottom: 24,
    ...(Platform.OS === 'web' ? {} : {
      gap: 16,
    })
  },

  // Éléments de form - Cohérent avec MenuForm
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2A2E33',
    marginBottom: 8,
    letterSpacing: 0.5,
    ...(Platform.OS === 'web' && {
      fontFamily: 'system-ui, -apple-system, sans-serif',
    })
  },


  // Boutons de catégorie - Inspirés de MenuForm
  categoryButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    width: '100%',
  },

  categoryButton: {
    paddingVertical: 12,
    paddingHorizontal: 18,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 120,
    minHeight: 48,
    flexShrink: 0,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 1,
    elevation: 1,
    ...(Platform.OS === 'web' && {
      cursor: 'pointer',
      transition: 'all 0.2s ease',
      ':hover': {
        borderColor: '#D1D5DB',
        shadowOpacity: 0.08,
        transform: 'translateY(-1px)',
      }
    }),
  },

  categoryButtonActive: {
    backgroundColor: '#2A2E33',
    borderColor: '#2A2E33',
    shadowColor: '#2A2E33',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },

  categoryButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7280',
    textAlign: 'center',
    letterSpacing: 0.3,
  },

  categoryButtonTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },

  // Sous-catégories - Plus petites
  subCategoryButton: {
    flexDirection: 'row',
    paddingVertical: 8,
    paddingHorizontal: Platform.OS === 'web' ? 16 : 12, // Plus de padding horizontal sur web
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    backgroundColor: '#FAFAFA',
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 80,
    minHeight: 36,
    flexShrink: 0,
    ...(Platform.OS === 'web' && {
      cursor: 'pointer',
      transition: 'all 0.2s ease',
    }),
  },

  subCategoryButtonActive: {
    backgroundColor: '#2A2E33',
    borderColor: '#2A2E33',
  },

  subCategoryButtonText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#6B7280',
    textAlign: 'center',
  },

  subCategoryButtonTextActive: {
    color: '#FFFFFF',
    fontWeight: '600',
  },

  // Badge compteur d'articles
  itemCountBadge: {
    backgroundColor: '#10B981',
    borderRadius: 12,
    paddingHorizontal: 6,
    paddingVertical: 2,
    marginLeft: 6,
    minWidth: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },

  itemCountText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#FFFFFF',
    textAlign: 'center',
  },

  // Scroll view pour les articles
  itemsScrollView: {
    maxHeight: 400,
  },

  itemsScrollContent: {
    paddingBottom: 16,
  },

  // Cards modernes pour les articles
  modernItemCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#F3F4F6',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },

  itemContentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },

  itemMainInfo: {
    flex: 1,
    marginRight: 16,
  },

  modernItemName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2A2E33',
    marginBottom: 6,
    lineHeight: 20,
  },

  itemMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },

  modernItemPrice: {
    fontSize: 15,
    fontWeight: '600',
    color: '#2A2E33',
    marginRight: 8,
  },

  supplementBadge: {
    backgroundColor: '#FEF2F2',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#FECACA',
  },


  // Zone pour les tags/allergènes futurs
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 4,
    minHeight: 20, // Réserver l'espace même si vide
  },

  tagItem: {
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },

  tagText: {
    fontSize: 10,
    fontWeight: '500',
    color: '#6B7280',
  },

  // Système de quantité moderne
  modernQuantityContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    overflow: 'hidden',
  },

  modernQuantityButton: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 0,
  },

  modernQuantityButtonDisabled: {
    backgroundColor: '#F9FAFB',
    opacity: 0.5,
  },

  quantityDisplay: {
    minWidth: 40,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    backgroundColor: '#FFFFFF',
  },

  modernQuantityText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#2A2E33',
    textAlign: 'center',
  },

  // Résumé moderne
  modernSummaryCard: {
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    padding: 20,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },

  summaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  summaryItem: {
    flex: 1,
    alignItems: 'center',
  },

  summaryDivider: {
    width: 1,
    height: 40,
    backgroundColor: '#E5E7EB',
    marginHorizontal: 20,
  },

  summaryLabel: {
    fontSize: 13,
    fontWeight: '500',
    color: '#6B7280',
    marginBottom: 4,
    textAlign: 'center',
  },

  summaryValue: {
    fontSize: 24,
    fontWeight: '700',
    color: '#2A2E33',
    textAlign: 'center',
  },

  summaryPrice: {
    fontSize: 24,
    fontWeight: '700',
    color: '#059669',
    textAlign: 'center',
  },

  summaryExtras: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },

  summaryNote: {
    fontSize: 12,
    fontStyle: 'italic',
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 16,
  },

  // Anciens styles conservés pour compatibilité
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
    flex: 1, // Reprendre flex: 1 avec flexGrow du parent
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
    minHeight: 250, // Hauteur minimum pour assurer le centrage
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

  // Styles pour le layout compact
  compactHeader: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#F3F4F6',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },

  // Navigation principale - Menu/Articles sur même ligne
  mainNavigation: {
    flexDirection: 'row',
    gap: 12,
  },

  mainNavButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 48,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 1,
    elevation: 1,
    ...(Platform.OS === 'web' && {
      cursor: 'pointer',
      transition: 'all 0.2s ease',
      ':hover': {
        borderColor: '#D1D5DB',
        shadowOpacity: 0.08,
        transform: 'translateY(-1px)',
      }
    }),
  },

  mainNavButtonActive: {
    backgroundColor: '#2A2E33',
    borderColor: '#2A2E33',
    shadowColor: '#2A2E33',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },

  mainNavButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7280',
    textAlign: 'center',
    letterSpacing: 0.3,
  },

  mainNavButtonTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },

  // Navigation secondaire - Types d'articles
  subNavigation: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },


  compactLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6B7280',
    marginBottom: 8,
    letterSpacing: 0.3,
    textTransform: 'uppercase',
  },

  // Section principale d'articles (plus grande) - Restructurée
  mainArticlesSection: {
    flex: 1,
    minHeight: 400,
  },

  // Header de section inline inspiré du MenuEditor (supprimé car dupliqué)


  // Scroll view optimisé pour plus d'items
  optimizedScrollView: {
    flex: 1,
    minHeight: 300,
  },

  optimizedScrollContent: {
    paddingBottom: 16, // Padding normal puisque la barre est maintenant statique
    gap: 6,
    flexGrow: 1, // Permettre à l'emptyState de prendre tout l'espace
  },

  // ScrollView content responsive avec flexWrap et largeur minimum
  responsiveCompactScrollContent: {
    paddingBottom: 8,
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 8,
  },

  // PROPOSITION: ScrollView content pour grille 2 colonnes
  ultraCompactScrollContent: {
    paddingBottom: 8,
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },

  // Cartes d'articles compactes (inspirées du MenuEditor) - Version originale
  compactItemCard: {
    marginHorizontal: 20,
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    marginBottom: 6,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    minHeight: 58,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 2,
    elevation: 1,
    ...(Platform.OS === 'web' && {
      transition: 'all 0.2s ease',
      ':hover': {
        borderColor: '#CBD5E1',
        shadowOpacity: 0.08,
        transform: 'translateY(-1px)',
      }
    })
  },

  // Cartes d'articles responsives compactes avec largeur minimum
  responsiveCompactItemCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    marginBottom: 4,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    minHeight: 56,
    minWidth: 280, // Largeur minimum pour éviter des cartes trop petites
    maxWidth: '48%', // Maximum 48% pour permettre 2 colonnes
    flex: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 2,
    elevation: 1,
    ...(Platform.OS === 'web' && {
      transition: 'all 0.2s ease',
      ':hover': {
        borderColor: '#CBD5E1',
        shadowOpacity: 0.08,
        transform: 'translateY(-1px)',
      }
    })
  },

  // PROPOSITION: Version ultra-compacte avec grille 2 colonnes
  ultraCompactItemCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 6,
    marginBottom: 4,
    marginHorizontal: 2,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    minHeight: 48,
    width: '48%', // 2 colonnes avec espacement
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 1,
    elevation: 1,
    ...(Platform.OS === 'web' && {
      transition: 'all 0.2s ease',
      ':hover': {
        borderColor: '#CBD5E1',
        shadowOpacity: 0.06,
        transform: 'translateY(-1px)',
      }
    })
  },

  compactItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
    minHeight: 56,
  },

  compactItemInfo: {
    flex: 1,
    marginRight: 12,
    justifyContent: 'center',
  },

  compactItemName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1E293B',
    marginBottom: 2,
    letterSpacing: 0.2,
  },

  compactItemMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },

  compactItemPrice: {
    fontSize: 13,
    fontWeight: '700',
    color: '#475569',
  },

  compactSupplement: {
    fontSize: 12,
    fontWeight: '700',
    color: '#92400E',
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },

  // Système de quantité compact
  compactQuantityContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    overflow: 'hidden',
  },

  compactQuantityButton: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    ...(Platform.OS === 'web' && {
      cursor: 'pointer',
      transition: 'all 0.2s ease',
      ':hover': {
        backgroundColor: '#F1F5F9',
      }
    })
  },

  compactQuantityButtonDisabled: {
    backgroundColor: '#F8FAFC',
    opacity: 0.5,
  },

  compactQuantityText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#2A2E33',
    textAlign: 'center',
    minWidth: 32,
    paddingHorizontal: 8,
  },

  // PROPOSITION: Styles ultra-compacts
  ultraCompactItemRow: {
    flexDirection: 'column',
    alignItems: 'stretch',
    justifyContent: 'space-between',
    padding: 8,
    minHeight: 46,
  },

  ultraCompactItemInfo: {
    flex: 1,
    marginBottom: 6,
    justifyContent: 'center',
  },

  ultraCompactItemName: {
    fontSize: 12,
    fontWeight: '600',
    color: '#1E293B',
    marginBottom: 2,
    letterSpacing: 0.1,
    textAlign: 'center',
  },

  ultraCompactItemPrice: {
    fontSize: 11,
    fontWeight: '700',
    color: '#475569',
    textAlign: 'center',
  },

  ultraCompactQuantityContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    alignSelf: 'center',
  },

  ultraCompactQuantityButton: {
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    ...(Platform.OS === 'web' && {
      cursor: 'pointer',
      transition: 'all 0.2s ease',
      ':hover': {
        backgroundColor: '#F1F5F9',
      }
    })
  },

  ultraCompactQuantityText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#2A2E33',
    textAlign: 'center',
    minWidth: 20,
    paddingHorizontal: 4,
  },

  // Résumé en bas compact et discret - Harmonisé avec AdminFormView (sans ombre pour éviter la redondance)
  bottomSummary: {
    backgroundColor: '#F9FAFB', // Même couleur que AdminFormView
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6', // Bordure plus subtile comme AdminFormView
    paddingVertical: 16, // Padding plus généreux comme AdminFormView
    paddingHorizontal: 32, // Même padding horizontal que AdminFormView
  },

  bottomSummaryContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },

  bottomSummaryItem: {
    alignItems: 'center',
    justifyContent: 'center',
  },

  bottomSummaryValue: {
    fontSize: 16,
    fontWeight: '700',
    color: '#2A2E33',
    textAlign: 'center',
  },

  bottomSummaryPrice: {
    fontSize: 16,
    fontWeight: '700',
    color: '#059669',
    textAlign: 'center',
  },

  bottomSummaryLabel: {
    fontSize: 10,
    fontWeight: '500',
    color: '#6B7280',
    textAlign: 'center',
    marginTop: 1,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },

  bottomSummaryDivider: {
    width: 1,
    height: 24,
    backgroundColor: '#CBD5E1',
    marginHorizontal: 16,
  },

  // === STYLES POUR LA SÉLECTION DE MENUS ===
  
  // Sélection du menu (première étape)
  menuSelectionContainer: {
    flex: 1,
    gap: 20,
  },

  menuSelectionHeader: {
    alignItems: 'center',
    marginBottom: 20,
    paddingBottom: 16,
    borderBottomWidth: 2,
    borderBottomColor: '#F3F4F6',
  },

  menuSelectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#2A2E33',
    textAlign: 'center',
    letterSpacing: 0.5,
    marginBottom: 8,
  },

  menuSelectionSubtitle: {
    fontSize: 15,
    color: '#6B7280',
    textAlign: 'center',
    fontWeight: '500',
  },

  menuCardsContainer: {
    gap: 16,
  },

  menuCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
    ...(Platform.OS === 'web' && {
      cursor: 'pointer',
      transition: 'all 0.3s ease',
      ':hover': {
        borderColor: '#2A2E33',
        shadowOpacity: 0.15,
        transform: 'translateY(-4px)',
      }
    })
  },

  menuCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },

  menuCardIcon: {
    width: 48,
    height: 48,
    backgroundColor: '#2A2E33',
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },

  menuCardInfo: {
    flex: 1,
  },

  menuCardName: {
    fontSize: 18,
    fontWeight: '700',
    color: '#2A2E33',
    marginBottom: 4,
    letterSpacing: 0.3,
  },

  menuCardPrice: {
    fontSize: 16,
    fontWeight: '600',
    color: '#059669',
  },

  menuCardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },

  menuCardCategoriesCount: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '500',
  },

  menuCardArrow: {
    width: 32,
    height: 32,
    backgroundColor: '#F3F4F6',
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },

  menuCardArrowText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#2A2E33',
  },

  // Configuration du menu (deuxième étape)
  menuConfigurationContainer: {
    flex: 1,
    gap: 24,
  },

  selectedMenuHeader: {
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },

  backToMenusButton: {
    alignSelf: 'flex-start',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#D1D5DB',
    marginBottom: 12,
    ...(Platform.OS === 'web' && {
      cursor: 'pointer',
      transition: 'all 0.2s ease',
      ':hover': {
        backgroundColor: '#F9FAFB',
      }
    })
  },

  backToMenusButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#6B7280',
  },

  selectedMenuInfo: {
    alignItems: 'center',
  },

  selectedMenuName: {
    fontSize: 20,
    fontWeight: '700',
    color: '#2A2E33',
    marginBottom: 4,
    textAlign: 'center',
  },

  selectedMenuBasePrice: {
    fontSize: 16,
    fontWeight: '600',
    color: '#059669',
    textAlign: 'center',
  },

  // Progression des catégories
  categoriesProgressContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },

  categoriesProgressTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#2A2E33',
    marginBottom: 16,
    textAlign: 'center',
    letterSpacing: 0.3,
  },

  categoriesProgress: {
    gap: 12,
  },

  categoryProgressButton: {
    backgroundColor: '#FAFAFA',
    borderRadius: 12,
    padding: 14,
    borderWidth: 2,
    borderColor: '#E5E7EB',
    ...(Platform.OS === 'web' && {
      cursor: 'pointer',
      transition: 'all 0.2s ease',
      ':hover': {
        backgroundColor: '#F3F4F6',
        borderColor: '#D1D5DB',
      }
    })
  },

  categoryProgressButtonActive: {
    backgroundColor: '#EBF8FF',
    borderColor: '#3B82F6',
    shadowColor: '#3B82F6',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },

  categoryProgressButtonCompleted: {
    backgroundColor: '#ECFDF5',
    borderColor: '#10B981',
  },

  categoryProgressContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  categoryProgressIndicator: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#E5E7EB',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },

  categoryProgressIndicatorActive: {
    backgroundColor: '#3B82F6',
  },

  categoryProgressIndicatorCompleted: {
    backgroundColor: '#10B981',
  },

  categoryProgressNumber: {
    fontSize: 14,
    fontWeight: '700',
    color: '#6B7280',
  },

  categoryProgressNumberActive: {
    color: '#FFFFFF',
  },

  categoryProgressInfo: {
    flex: 1,
  },

  categoryProgressName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2A2E33',
    marginBottom: 4,
  },

  categoryProgressNameActive: {
    color: '#1E40AF',
  },

  categoryProgressMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },

  categoryProgressLabel: {
    fontSize: 13,
    fontWeight: '500',
    color: '#6B7280',
    paddingHorizontal: 8,
    paddingVertical: 2,
    backgroundColor: '#F3F4F6',
    borderRadius: 4,
  },

  categoryProgressLabelRequired: {
    backgroundColor: '#FEF3E2',
    color: '#92400E',
    fontWeight: '600',
  },

  categoryProgressLabelActive: {
    backgroundColor: '#DBEAFE',
    color: '#1E40AF',
  },

  categoryProgressSelections: {
    fontSize: 13,
    fontWeight: '500',
    color: '#6B7280',
  },

  categoryProgressSelectionsActive: {
    color: '#1E40AF',
    fontWeight: '600',
  },


  categoryItemsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },

  categoryItemsTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#2A2E33',
    letterSpacing: 0.3,
  },

  categoryItemsProgress: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6B7280',
  },

  categoryItemsProgressActive: {
    color: '#059669',
    fontWeight: '600',
  },

  categoryItemsList: {
    gap: 12,
  },

  // Cartes d'articles du menu
  menuItemCard: {
    backgroundColor: '#FAFAFA',
    borderRadius: 12,
    padding: 16,
    borderWidth: 2,
    borderColor: '#E5E7EB',
    ...(Platform.OS === 'web' && {
      cursor: 'pointer',
      transition: 'all 0.2s ease',
      ':hover': {
        backgroundColor: '#F3F4F6',
        borderColor: '#D1D5DB',
      }
    })
  },

  menuItemCardSelected: {
    backgroundColor: '#ECFDF5',
    borderColor: '#10B981',
    shadowColor: '#10B981',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },

  menuItemCardContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  menuItemCardCheckbox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: '#D1D5DB',
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },

  menuItemCardCheckboxSelected: {
    backgroundColor: '#10B981',
    borderColor: '#10B981',
  },

  menuItemCardCheckboxIcon: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },

  menuItemCardInfo: {
    flex: 1,
  },

  menuItemCardName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2A2E33',
    marginBottom: 6,
  },

  menuItemCardNameSelected: {
    color: '#047857',
    fontWeight: '700',
  },

  menuItemCardPricing: {
    gap: 4,
  },

  menuItemCardBasePrice: {
    fontSize: 13,
    color: '#6B7280',
    fontWeight: '500',
  },

  menuItemCardSupplement: {
    fontSize: 13,
    color: '#92400E',
    fontWeight: '600',
  },

  menuItemCardSupplementBadge: {
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
    marginLeft: 12,
  },

  menuItemCardSupplementBadgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#92400E',
  },

  // Placeholder pour catégorie
  categoryPlaceholder: {
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    padding: 32,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#E5E7EB',
    borderStyle: 'dashed',
  },

  categoryPlaceholderText: {
    fontSize: 15,
    color: '#6B7280',
    textAlign: 'center',
    fontWeight: '500',
  },

  // Styles compacts pour les catégories
  categoriesCompactContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#F3F4F6',
  },


  categoriesCompactList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 4,
  },

  categoryCompactButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    backgroundColor: '#FFFFFF',
    minHeight: 36,
  },

  categoryCompactButtonActive: {
    backgroundColor: '#EBF4FF',
    borderColor: '#3B82F6',
  },

  categoryCompactButtonCompleted: {
    backgroundColor: '#ECFDF5',
    borderColor: '#10B981',
  },

  categoryCompactContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  categoryCompactIndicator: {
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },

  categoryCompactIndicatorActive: {
    backgroundColor: '#3B82F6',
  },

  categoryCompactIndicatorCompleted: {
    backgroundColor: '#10B981',
  },

  categoryCompactNumber: {
    fontSize: 10,
    fontWeight: '700',
    color: '#6B7280',
  },

  categoryCompactNumberActive: {
    color: '#FFFFFF',
  },

  categoryCompactInfo: {
    flex: 1,
    justifyContent: 'center',
  },

  categoryCompactName: {
    fontSize: 13,
    fontWeight: '600',
    color: '#374151',
    letterSpacing: 0.2,
  },

  categoryCompactNameActive: {
    color: '#3B82F6',
    fontWeight: '700',
  },

  categoryCompactMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
  },

  categoryRequiredBadge: {
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 4,
    paddingVertical: 1,
    borderRadius: 3,
    marginRight: 6,
  },

  categoryRequiredText: {
    fontSize: 8,
    fontWeight: '600',
    color: '#D97706',
    textTransform: 'uppercase',
  },

  categoryCompactSelections: {
    fontSize: 10,
    color: '#6B7280',
    fontWeight: '500',
  },

  categoryCompactSelectionsActive: {
    color: '#10B981',
    fontWeight: '600',
  },

  // Styles compacts pour les articles
  categoryItemsCompactContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#F3F4F6',
  },

  categoryItemsCompactHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },

  categoryItemsCompactTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2A2E33',
  },

  categoryItemsCompactScroll: {
    maxHeight: 300,
    marginBottom: 20,
  },

  categoryItemsCompactList: {
    gap: 8,
  },

  menuItemCompactCard: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    backgroundColor: '#FFFFFF',
  },

  menuItemCompactCardSelected: {
    backgroundColor: '#EBF4FF',
    borderColor: '#3B82F6',
  },

  menuItemCompactContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },

  menuItemCompactCheckbox: {
    width: 16,
    height: 16,
    borderRadius: 3,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },

  menuItemCompactCheckboxSelected: {
    backgroundColor: '#3B82F6',
    borderColor: '#3B82F6',
  },

  menuItemCompactCheckboxIcon: {
    fontSize: 10,
    color: '#FFFFFF',
    fontWeight: '700',
  },

  menuItemCompactInfo: {
    flex: 1,
    justifyContent: 'center',
  },

  menuItemCompactName: {
    fontSize: 13,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 2,
  },

  menuItemCompactNameSelected: {
    color: '#3B82F6',
  },

  menuItemCompactPrice: {
    fontSize: 13,
    fontWeight: '600',
    color: '#10B981',
    marginLeft: 'auto',
  },

  menuItemCompactSupplementBadge: {
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 4,
    paddingVertical: 1,
    borderRadius: 3,
    marginLeft: 6,
  },

  menuItemCompactSupplementText: {
    fontSize: 8,
    fontWeight: '600',
    color: '#D97706',
    textTransform: 'uppercase',
  },

  // === STYLES POUR LA CONFIGURATION DE MENU ===
  
  menuConfigurationView: {
    flex: 1,
  },

  // Bloc titre professionnel style MenuEditor
  menuConfigTitleCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#E5F3FF',
    shadowColor: '#2A2E33',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
  },

  menuConfigHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },

  menuConfigIconBadge: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: '#2A2E33',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },

  menuConfigHeaderInfo: {
    flex: 1,
  },

  menuConfigTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#2A2E33',
    marginBottom: 8,
    letterSpacing: 0.3,
  },

  menuConfigTagsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },

  menuConfigPriceTag: {
    backgroundColor: '#059669',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },

  menuConfigPriceTagText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
  },

  menuConfigSubtitle: {
    fontSize: 13,
    color: '#6B7280',
    fontWeight: '500',
  },

  menuConfigDetails: {
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },

  menuConfigRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 6,
  },

  menuConfigLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6B7280',
  },

  menuConfigValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2A2E33',
  },

  menuConfigPrice: {
    fontSize: 16,
    fontWeight: '700',
    color: '#059669',
  },

  // === STYLES MenuEditor EXACTS ===
  
  // Header de configuration identique à MenuEditor
  menuEditorConfigHeader: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    paddingHorizontal: 26,
    paddingVertical: 20,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#F3F4F6',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },

  sectionHeaderInline: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  categoryTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },

  categorySupplementTag: {
    backgroundColor: '#EEF2FF',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    alignSelf: 'center',
  },

  categorySupplementTagText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#4338CA',
  },

  sectionIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },

  sectionHeaderText: {
    flex: 1,
  },

  sectionHeaderTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#2A2E33',
    letterSpacing: 0.5,
    marginBottom: 4,
  },

  sectionHeaderSubtitle: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '500',
  },


  // Header de catégorie MenuEditor
  categoryHeaderMenuEditor: {
    marginBottom: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },


  // Articles style MenuEditor exact
  menuEditorItemCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 14,
    minHeight: 58,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 2,
    marginBottom: 8,
  },

  menuEditorItemCardSelected: {
    borderColor: '#3B82F6',
    borderWidth: 2,
    backgroundColor: '#F8FAFC',
  },

  menuEditorItemMainContent: {
    flexDirection: 'row',
    alignItems: 'stretch',
    justifyContent: 'space-between',
    minHeight: 44,
  },

  menuEditorItemInfoNew: {
    flex: 1,
    marginRight: 16,
    justifyContent: 'center',
  },

  menuEditorItemNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    flex: 1,
  },

  menuEditorItemNameNew: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1E293B',
    letterSpacing: 0.2,
    flex: 1,
  },

  menuEditorItemMetrics: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },

  menuEditorItemSupplement: {
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },

  menuEditorItemSupplementText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#92400E',
  },

  menuEditorItemActionsNew: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'center',
  },

  menuEditorItemCheckbox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: '#D1D5DB',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
  },

  menuEditorItemCheckboxSelected: {
    backgroundColor: '#3B82F6',
    borderColor: '#3B82F6',
  },

  menuEditorItemCheckboxIcon: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },

  // Sections de catégories style MenuEditor
  categoryCardMenuConfig: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E5F3FF',
    shadowColor: '#2A2E33',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },

  categoryHeaderMenuConfig: {
    marginBottom: 16,
  },

  categoryNumberBadge: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: '#2A2E33',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },

  categoryNumberText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },

  categoryHeaderContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginBottom: 12,
  },

  categoryHeaderInfo: {
    flex: 1,
  },

  categoryHeaderTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#2A2E33',
    marginBottom: 1,
    letterSpacing: 0.3,
  },

  categoryHeaderSubtitle: {
    fontSize: 13,
    color: '#6B7280',
    fontWeight: '500',
  },

  categoryStatusText: {
    fontSize: 11,
    fontWeight: '600',
    marginTop: 2,
  },

  categoryStatusRequired: {
    color: '#DC2626',
  },

  categoryStatusOptional: {
    color: '#059669',
  },

  categoryTagsContainer: {
    flexDirection: 'row',
    gap: 8,
  },

  categoryTag: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },

  categoryTagRequired: {
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FECACA',
  },

  categoryTagOptional: {
    backgroundColor: '#F0F9FF',
    borderWidth: 1,
    borderColor: '#BAE6FD',
  },

  categoryTagText: {
    fontSize: 12,
    fontWeight: '600',
  },

  categoryTagTextRequired: {
    color: '#DC2626',
  },

  categoryTagTextOptional: {
    color: '#0369A1',
  },

  categoryTagSupplement: {
    backgroundColor: '#FEF3C7',
    borderWidth: 1,
    borderColor: '#FDE68A',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },

  categoryTagSupplementText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#D97706',
  },

  categoryItemsListContainer: {
    gap: 8,
  },

  noCategoryItemsText: {
    fontSize: 14,
    color: '#9CA3AF',
    fontStyle: 'italic',
    textAlign: 'center',
    paddingVertical: 20,
  },

  menuConfigItemCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },

  menuConfigItemCardSelected: {
    backgroundColor: '#EFF6FF',
    borderColor: '#3B82F6',
    borderWidth: 2,
  },

  menuConfigItemCheckbox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: '#D1D5DB',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },

  menuConfigItemCheckboxIcon: {
    color: '#3B82F6',
    fontSize: 16,
    fontWeight: '700',
  },

  menuConfigItemContent: {
    flex: 1,
  },

  menuConfigItemName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
    flex: 1,
  },

  menuConfigItemNameSelected: {
    color: '#1D4ED8',
  },

  menuConfigItemNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },

  menuConfigSupplementBadge: {
    backgroundColor: '#FEF3C7',
    borderWidth: 1,
    borderColor: '#FDE68A',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },

  menuConfigSupplementText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#D97706',
  },

  configurationHeader: {
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    marginBottom: 20,
  },

  configurationTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#2A2E33',
    marginBottom: 4,
  },

  configurationSubtitle: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '500',
  },

  categoriesNavigation: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 20,
  },


  requiredIndicator: {
    color: '#EF4444',
    fontWeight: '700',
  },

  configCategoryItemsList: {
    flex: 1,
    marginBottom: 16,
  },

  configItemsScrollView: {
    flex: 1,
    maxHeight: 300, // Limite la hauteur pour éviter que ça pousse les boutons
  },

  configCategoryItemsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2A2E33',
    marginBottom: 12,
  },

  configItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginBottom: 8,
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    ...(Platform.OS === 'web' && {
      cursor: 'pointer',
      transition: 'all 0.2s ease',
      ':hover': {
        borderColor: '#D1D5DB',
        backgroundColor: '#F9FAFB',
      }
    })
  },

  configItemRowSelected: {
    backgroundColor: '#EBF4FF',
    borderColor: '#3B82F6',
  },

  configItemInfo: {
    flex: 1,
  },

  configItemName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2A2E33',
    marginBottom: 2,
  },

  configItemNameSelected: {
    color: '#1E40AF',
  },

  configItemPrice: {
    fontSize: 13,
    color: '#6B7280',
    fontWeight: '500',
  },

  configItemCheckbox: {
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: '#D1D5DB',
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },

  configItemCheckboxSelected: {
    backgroundColor: '#3B82F6',
    borderColor: '#3B82F6',
  },

  configItemCheckboxIcon: {
    fontSize: 12,
    color: '#FFFFFF',
    fontWeight: '700',
  },

  configurationActions: {
    flexDirection: 'row',
    gap: 12,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    marginTop: 'auto', // Pour pousser les boutons vers le bas
  },

  configCancelButton: {
    flex: 1,
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    ...(Platform.OS === 'web' && {
      cursor: 'pointer',
      transition: 'all 0.2s ease',
      ':hover': {
        backgroundColor: '#F9FAFB',
        borderColor: '#9CA3AF',
      }
    })
  },

  configCancelButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7280',
  },

  confirmButton: {
    flex: 2,
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 8,
    backgroundColor: '#2A2E33',
    alignItems: 'center',
    ...(Platform.OS === 'web' && {
      cursor: 'pointer',
      transition: 'all 0.2s ease',
      ':hover': {
        backgroundColor: '#1F2937',
      }
    })
  },

  confirmButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },


  configurationActionsFixed: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    gap: 12,
  },


  // Header de section (utilisé pour configuration ET catégories)
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },

  sectionHeaderIcon: {
    width: 40,
    height: 40,
    borderRadius: 8,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },



  // Navigation catégories (style onglets MENU/ARTICLES)
  categoryNavigation: {
    marginVertical: 16,
  },

  categoryNavScrollView: {
    flexGrow: 0,
  },

  categoryNavContent: {
    paddingHorizontal: 16,
    gap: 8,
  },

  categoryNavButton: {
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 25,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    flexDirection: 'row',
    alignItems: 'center',
    minWidth: 120,
  },

  categoryNavButtonActive: {
    backgroundColor: '#2A2E33',
    borderColor: '#2A2E33',
  },

  categoryNavButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7280',
    textAlign: 'center',
    flex: 1,
  },

  categoryNavButtonTextActive: {
    color: '#FFFFFF',
  },

  requiredIndicatorNav: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#EF4444',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8,
  },

  requiredIndicatorNavText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#FFFFFF',
  },

  // Header catégorie active
  activeCategoryHeader: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginTop: 8,
  },

  activeCategoryTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#2A2E33',
    marginBottom: 4,
  },

  activeCategorySubtitle: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6B7280',
  },


  categoryItemsContainer: {
    gap: 8,
  },

  categoryItemNew: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    backgroundColor: '#FAFAFA',
  },

  categoryItemSelectedNew: {
    borderColor: '#4F46E5',
    backgroundColor: '#EEF2FF',
  },

  itemContentNew: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },

  itemNameNew: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
    flex: 1,
  },

  itemNameSelectedNew: {
    color: '#4F46E5',
    fontWeight: '600',
  },

  itemPriceNew: {
    fontSize: 13,
    fontWeight: '600',
    color: '#6B7280',
    marginLeft: 8,
  },

  supplementTag: {
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    marginLeft: 8,
  },

  supplementTagText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#92400E',
  },

  itemCheckbox: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 12,
  },

  itemCheckboxSelected: {
    backgroundColor: '#4F46E5',
    borderColor: '#4F46E5',
  },

  itemCheckboxIcon: {
    fontSize: 12,
    color: '#FFFFFF',
    fontWeight: '600',
  },

});