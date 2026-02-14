import {
  OrderLine,
  OrderLineState,
  OrderLineOperation,
  OrderFormState,
  OrderLineType
} from '~/types/order-line.types';
import { Status } from '~/types/status.enum';
import { deepEquals } from '~/utils/deep-equals';

/**
 * Initialiser les états des lignes à partir des lignes existantes
 */
export const initializeLineStates = (lines: OrderLine[]): OrderLineState[] => {
  return lines.map(line => ({
    original: line,
    current: { ...line },
    status: 'unchanged' as const,
    changes: undefined
  }));
};

/**
 * Détecter si une ligne a été modifiée
 */
export const isLineModified = (original: OrderLine | null, current: OrderLine): boolean => {
  if (!original) return true; // Nouvelle ligne

  // Vérifier les champs principaux
  if (original.note !== current.note) return true;
  if (original.status !== current.status) return true;

  // Vérifier les tags (pour ITEM) - comparaison profonde
  if (current.type === OrderLineType.ITEM) {
    if (!deepEquals(original.tags || [], current.tags || [])) return true;
  }

  // Vérifier les items (pour MENU) - comparaison profonde
  if (current.type === OrderLineType.MENU) {
    if (!deepEquals(original.items || [], current.items || [])) return true;
  }

  return false;
};

/**
 * Calculer les changements entre deux lignes
 */
export const calculateChanges = (original: OrderLine, current: OrderLine): Partial<OrderLine> => {
  const changes: Partial<OrderLine> = {};

  if (original.note !== current.note) {
    changes.note = current.note;
  }

  if (original.status !== current.status) {
    changes.status = current.status;
  }

  // Tags pour ITEM - comparaison profonde
  if (current.type === OrderLineType.ITEM) {
    if (!deepEquals(original.tags || [], current.tags || [])) {
      changes.tags = current.tags;
    }
  }

  // Items pour MENU - comparaison profonde
  if (current.type === OrderLineType.MENU) {
    if (!deepEquals(original.items || [], current.items || [])) {
      changes.items = current.items;
    }
  }

  return changes;
};

/**
 * Générer les opérations CRUD à partir des états
 */
export const detectOperations = (lineStates: OrderLineState[]): OrderLineOperation[] => {
  const operations: OrderLineOperation[] = [];

  for (const lineState of lineStates) {
    if (lineState.status === 'created') {
      operations.push({
        type: 'create',
        lineId: lineState.current.id,
        currentData: lineState.current
      });
    } else if (lineState.status === 'modified') {
      operations.push({
        type: 'update',
        lineId: lineState.current.id,
        originalData: lineState.original!,
        currentData: lineState.current,
        changes: lineState.changes
      });
    } else if (lineState.status === 'deleted') {
      operations.push({
        type: 'delete',
        lineId: lineState.current.id,
        originalData: lineState.original!
      });
    }
  }

  return operations;
};

/**
 * Type pour le payload de l'API bulk update
 */
export interface BulkUpdatePayload {
  lines: OrderLinePayload[];
}

export interface OrderLinePayload {
  id?: string;
  type: OrderLineType;
  note?: string;
  status?: Status;
  itemId?: string;
  menuId?: string;
  tags?: Record<string, any>;
  selectedItems?: Record<string, Array<{
    itemId: string;
    tags?: Record<string, any>;
    note?: string;
  }>>;
}

/**
 * Générer le payload pour l'API bulk update
 */
export const generateBulkPayload = (lineStates: OrderLineState[]): BulkUpdatePayload => {
  const lines: OrderLinePayload[] = [];

  // Lignes existantes non supprimées (modified ou unchanged)
  const existingLines = lineStates.filter(ls =>
    ls.original && ls.status !== 'deleted'
  );

  // Nouvelles lignes
  const newLines = lineStates.filter(ls =>
    !ls.original && ls.status === 'created'
  );

  // Pour les lignes existantes, inclure toutes (même unchanged)
  // Car l'API supprime celles non présentes dans le payload
  for (const lineState of existingLines) {
    const line = lineState.current;
    const payload: OrderLinePayload = {
      id: line.id, // ID requis pour les existantes
      type: line.type,
      note: line.note,
      status: line.status
    };

    if (line.type === OrderLineType.ITEM) {
      // Convertir les tags au format API
      if (line.tags && line.tags.length > 0) {
        const tags: Record<string, any> = {};
        line.tags.forEach(tag => {
          tags[tag.tagId] = tag.value;
        });
        payload.tags = tags;
      } else if (lineState.status === 'modified') {
        // Tags vidés : envoyer {} pour que l'API supprime les tags existants
        payload.tags = {};
      }
    } else if (line.type === OrderLineType.MENU) {
      if (line.menu) {
        payload.menuId = line.menu.id;
      }

      // ✅ IMPORTANT: On envoie selectedItems SEULEMENT si le menu a été modifié
      // Pour un menu inchangé (unchanged), on ne touche pas aux items
      if (lineState.status === 'modified' && line.items && line.items.length > 0) {
        const selectedItems: Record<string, any[]> = {};

        line.items.forEach((item: any) => {
          if (item.categoryId) {
            const tags: Record<string, any> = {};
            if (item.tags && item.tags.length > 0) {
              item.tags.forEach((tag: any) => {
                tags[tag.tagId] = tag.value;
              });
            }

            if (!selectedItems[item.categoryId]) {
              selectedItems[item.categoryId] = [];
            }
            selectedItems[item.categoryId].push({
              itemId: item.item.id,
              tags: Object.keys(tags).length > 0 ? tags : undefined,
              note: item.note
            });
          }
        });

        // Ne pas envoyer selectedItems si vide
        if (Object.keys(selectedItems).length > 0) {
          payload.selectedItems = selectedItems;
        }
      }
    }

    lines.push(payload);
  }

  // Pour les nouvelles lignes, pas d'ID
  for (const lineState of newLines) {
    const line = lineState.current;
    const payload: OrderLinePayload = {
      // Pas d'ID pour la création
      type: line.type,
      note: line.note,
      status: line.status
    };

    if (line.type === OrderLineType.ITEM) {
      // Pour création, on a besoin de itemId
      if (line.item) {
        payload.itemId = line.item.id;
      }

      // Tags
      if (line.tags && line.tags.length > 0) {
        const tags: Record<string, any> = {};
        line.tags.forEach(tag => {
          tags[tag.tagId] = tag.value;
        });
        payload.tags = tags;
      }
    } else if (line.type === OrderLineType.MENU) {
      // Pour création, on a besoin de menuId
      if (line.menu) {
        payload.menuId = line.menu.id;
      }

      // selectedItems
      if (line.items) {
        const selectedItems: Record<string, any[]> = {};

        line.items.forEach((item: any) => {
          if (item.categoryId) {
            const tags: Record<string, any> = {};
            if (item.tags && item.tags.length > 0) {
              item.tags.forEach((tag: any) => {
                tags[tag.tagId] = tag.value;
              });
            }

            if (!selectedItems[item.categoryId]) {
              selectedItems[item.categoryId] = [];
            }
            selectedItems[item.categoryId].push({
              itemId: item.item.id,
              tags: Object.keys(tags).length > 0 ? tags : undefined
            });
          }
        });

        payload.selectedItems = selectedItems;
      }
    }

    lines.push(payload);
  }

  // Note: Les lignes avec status 'deleted' ne sont pas incluses
  // Elles seront supprimées automatiquement par l'API

  return { lines };
};

/**
 * Mettre à jour les états après une sauvegarde réussie
 */
export const mergeServerResponse = (
  localStates: OrderLineState[],
  serverLines: OrderLine[]
): OrderLineState[] => {
  const newStates: OrderLineState[] = [];

  // Mapper les lignes du serveur
  for (const serverLine of serverLines) {
    const localState = localStates.find(ls =>
      ls.current.id === serverLine.id ||
      (ls.status === 'created' && !serverLine.id.startsWith('draft-'))
    );

    if (localState) {
      // Mettre à jour avec les données du serveur
      newStates.push({
        original: serverLine,
        current: serverLine,
        status: 'unchanged',
        changes: undefined
      });
    } else {
      // Nouvelle ligne depuis le serveur
      newStates.push({
        original: serverLine,
        current: serverLine,
        status: 'unchanged',
        changes: undefined
      });
    }
  }

  return newStates;
};

/**
 * Ajouter une nouvelle ligne
 */
export const addNewLine = (
  currentStates: OrderLineState[],
  newLine: OrderLine
): OrderLineState[] => {
  return [
    ...currentStates,
    {
      original: null,
      current: newLine,
      status: 'created',
      changes: undefined
    }
  ];
};

/**
 * Modifier une ligne existante
 */
export const updateLine = (
  currentStates: OrderLineState[],
  lineId: string,
  updates: Partial<OrderLine>
): OrderLineState[] => {
  return currentStates.map(lineState => {
    if (lineState.current.id === lineId) {
      const updatedLine = { ...lineState.current, ...updates };
      const isModified = lineState.original && isLineModified(lineState.original, updatedLine);

      return {
        ...lineState,
        current: updatedLine,
        status: lineState.original ? (isModified ? 'modified' : 'unchanged') : 'created',
        changes: lineState.original && isModified ? calculateChanges(lineState.original, updatedLine) : undefined
      };
    }
    return lineState;
  });
};

/**
 * Supprimer une ligne (soft delete)
 */
export const deleteLine = (
  currentStates: OrderLineState[],
  lineId: string
): OrderLineState[] => {
  return currentStates.map(lineState => {
    if (lineState.current.id === lineId) {
      // Si c'est une nouvelle ligne, on la supprime complètement
      if (lineState.status === 'created') {
        return null;
      }
      // Sinon, on la marque comme supprimée
      return {
        ...lineState,
        status: 'deleted'
      };
    }
    return lineState;
  }).filter(Boolean) as OrderLineState[];
};

/**
 * Restaurer une ligne à son état original
 */
export const revertLine = (
  currentStates: OrderLineState[],
  lineId: string
): OrderLineState[] => {
  return currentStates.map(lineState => {
    if (lineState.current.id === lineId && lineState.original) {
      return {
        ...lineState,
        current: { ...lineState.original },
        status: 'unchanged',
        changes: undefined
      };
    }
    return lineState;
  });
};

/**
 * Vérifier s'il y a des changements non sauvegardés
 */
export const hasUnsavedChanges = (lineStates: OrderLineState[]): boolean => {
  return lineStates.some(ls => ls.status !== 'unchanged');
};

/**
 * Compter les changements par type
 */
export const countChanges = (lineStates: OrderLineState[]): {
  created: number;
  modified: number;
  deleted: number;
  total: number;
} => {
  const counts = {
    created: 0,
    modified: 0,
    deleted: 0,
    total: 0
  };

  for (const lineState of lineStates) {
    if (lineState.status === 'created') counts.created++;
    else if (lineState.status === 'modified') counts.modified++;
    else if (lineState.status === 'deleted') counts.deleted++;
  }

  counts.total = counts.created + counts.modified + counts.deleted;

  return counts;
};