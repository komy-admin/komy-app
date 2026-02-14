import { View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { OrderLinesForm } from '~/components/order/OrderLinesForm';
import { useToast } from '~/components/ToastProvider';
import { useOrders, useMenu, useTables, useRooms } from '~/hooks/useRestaurant';
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
  const { getRoomById } = useRooms();
  const { items, itemTypes } = useMenu();

  const existingOrder = orderId ? getOrderById(orderId as string) : null;
  const table = getTableById(tableId as string);
  const room = table ? getRoomById(table.roomId) : null;

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
      {/* Formulaire */}
      <View style={{ flex: 1 }}>
        <OrderLinesForm
          title={`${room?.name || 'Salle'} - ${table?.name || 'Table'}`}
          lines={manager.orderLines}
          items={items.filter((item) => item.isActive)}
          itemTypes={itemTypes}
          onAddItem={manager.addItem}
          onUpdateItem={manager.updateItem}
          onAddMenu={manager.addMenu}
          onUpdateMenu={manager.updateMenu}
          onDeleteLine={manager.deleteLine}
          onClearAll={manager.clearAllLines}
          onSave={manager.save}
          onCancel={() => {
            manager.reset();
            router.back();
          }}
          hasChanges={manager.hasChanges}
          isProcessing={manager.isProcessing}
        />
      </View>

    </View>
  );
}
