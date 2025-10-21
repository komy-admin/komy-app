import { useState } from 'react';
import { View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { OrderLinesForm, OrderLinesHeader, OrderLinesButton } from '~/components/order/OrderLinesForm';
import { useToast } from '~/components/ToastProvider';
import { useOrders, useMenu, useTables } from '~/hooks/useRestaurant';
import { useOrderLinesManager } from '~/hooks/order/useOrderLinesManager';

/**
 * OrderFormPage - Version refactorisée avec useOrderLinesManager
 *
 * Changements:
 * - Suppression de toute la logique métier (déléguée au hook)
 * - Suppression de ~150 lignes de code
 * - Plus simple et maintenable
 */
export default function OrderFormPage() {
  const { orderId, tableId, mode } = useLocalSearchParams();
  const { showToast } = useToast();

  // Données
  const { getOrderById } = useOrders();
  const { getTableById } = useTables();
  const { items, itemTypes } = useMenu();

  const existingOrder = orderId ? getOrderById(orderId as string) : null;
  const table = getTableById(tableId as string);

  // États UI
  const [isConfiguringMenu, setIsConfiguringMenu] = useState(false);
  const [menuConfigActions, setMenuConfigActions] = useState<any>(null);

  // ✅ TOUTE LA LOGIQUE dans le hook
  const manager = useOrderLinesManager({
    initialLines: existingOrder?.lines || [],
    mode: mode === 'create' ? 'create' : 'edit',
    orderId: orderId as string,
    tableId: tableId as string,
    onSuccess: () => {
      showToast('Commande sauvegardée avec succès', 'success');
      router.back();
    },
    onError: () => {
      showToast('Erreur lors de la sauvegarde', 'error');
    },
  });

  return (
    <View style={{ flex: 1, flexDirection: 'column' }}>
      {/* Header */}
      <OrderLinesHeader
        title={
          mode === 'create'
            ? `Prendre la commande - ${table?.name || 'Table'}`
            : `Modifier la commande - ${table?.name || 'Table'}`
        }
        onClose={() => router.back()}
        isVisible={!isConfiguringMenu}
      />

      {/* Formulaire */}
      <View style={{ flex: 1 }}>
        <OrderLinesForm
          lines={manager.orderLines}
          items={items.filter((item) => item.isActive)}
          itemTypes={itemTypes}
          onAddItem={manager.addItem}
          onUpdateItem={manager.updateItem}
          onAddMenu={manager.addMenu}
          onUpdateMenu={manager.updateMenu}
          onDeleteLine={manager.deleteLine}
          onClearAll={manager.clearAllLines}
          onConfigurationModeChange={setIsConfiguringMenu}
          onConfigurationActionsChange={setMenuConfigActions}
        />
      </View>

      {/* Boutons d'action */}
      {!isConfiguringMenu && (
        <View
          style={{
            backgroundColor: '#ffffff',
            borderTopWidth: 1,
            borderTopColor: '#e5e7eb',
            flexDirection: 'row',
            justifyContent: 'flex-end',
            padding: 16,
            gap: 12,
          }}
        >
          <OrderLinesButton
            variant="secondary"
            onPress={() => {
              manager.reset();
              router.back();
            }}
          >
            Annuler
          </OrderLinesButton>
          <OrderLinesButton
            variant="primary"
            onPress={manager.save}
            disabled={!manager.hasChanges || manager.isProcessing}
            flex={2}
          >
            {manager.isProcessing ? 'Sauvegarde...' : 'Sauvegarder'}
          </OrderLinesButton>
        </View>
      )}

      {/* Boutons de configuration de menu */}
      {isConfiguringMenu && menuConfigActions && (
        <View
          style={{
            backgroundColor: '#ffffff',
            borderTopWidth: 1,
            borderTopColor: '#e5e7eb',
            flexDirection: 'row',
            justifyContent: 'flex-end',
            padding: 16,
            gap: 12,
          }}
        >
          <OrderLinesButton variant="configCancel" onPress={menuConfigActions.onCancel}>
            Annuler
          </OrderLinesButton>
          <OrderLinesButton
            variant="config"
            onPress={menuConfigActions.onConfirm}
            disabled={!menuConfigActions.isValid}
            flex={2}
          >
            Confirmer la sélection
          </OrderLinesButton>
        </View>
      )}
    </View>
  );
}
