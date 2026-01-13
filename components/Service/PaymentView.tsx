import React, { useState, useMemo } from 'react';
import { View, ScrollView, Pressable } from 'react-native';
import { Button, Text } from '~/components/ui';
import { ChevronLeft, Check, Minus, Plus } from 'lucide-react-native';
import { Order } from '~/types/order.types';
import { OrderLine } from '~/types/order-line.types';
import { formatPrice } from '~/lib/utils';
import { usePayments } from '~/hooks/usePayments';

interface PaymentViewProps {
  order: Order;
  tableName: string;
  onBack: () => void;
  onPaymentComplete: () => void;
}

type PaymentType = 'full' | 'split' | 'items';
type PaymentMethod = 'cash' | 'card' | 'check' | 'ticket_resto';

export default function PaymentView({ order, tableName, onBack, onPaymentComplete }: PaymentViewProps) {
  const { createPayment } = usePayments();

  // États principaux
  const [paymentType, setPaymentType] = useState<PaymentType>('items');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod | null>(null);
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
  const [splitCount, setSplitCount] = useState(2);
  const [isProcessing, setIsProcessing] = useState(false);

  // Calculer les montants depuis les payments existants de la commande
  const orderTotals = useMemo(() => {
    const totalAmount = order.lines?.reduce((sum, line) => sum + line.totalPrice, 0) || 0;

    // Les paiements complétés de cette commande
    const completedPayments = order.payments?.filter(p => p.status === 'completed') || [];
    const paidAmount = completedPayments.reduce((sum, p) => sum + p.amount, 0);

    // Retrouver quels orderLines ont été payés via les allocations
    const paidOrderLineIds = new Set<string>();
    completedPayments.forEach(payment => {
      payment.allocations?.forEach(allocation => {
        // Si quantityFraction === 1.0, l'orderLine est complètement payé
        if (allocation.quantityFraction === 1.0) {
          paidOrderLineIds.add(allocation.orderLineId);
        }
      });
    });

    return {
      totalAmount,
      paidAmount,
      remainingAmount: totalAmount - paidAmount,
      paidOrderLineIds
    };
  }, [order]);

  // Items disponibles (non complètement payés)
  const availableItems = useMemo(() => {
    return order.lines?.filter(line => !orderTotals.paidOrderLineIds.has(line.id)) || [];
  }, [order.lines, orderTotals.paidOrderLineIds]);

  // Montant à payer selon le mode
  const amountToPay = useMemo(() => {
    switch (paymentType) {
      case 'full':
        return orderTotals.remainingAmount;

      case 'split':
        return Math.round(orderTotals.remainingAmount / splitCount);

      case 'items':
        return selectedItems.size === 0
          ? 0
          : availableItems
              .filter(line => selectedItems.has(line.id))
              .reduce((sum, line) => sum + line.totalPrice, 0);

      default:
        return 0;
    }
  }, [paymentType, splitCount, selectedItems, availableItems, orderTotals.remainingAmount]);

  // Toggle sélection d'un item
  const handleItemToggle = (itemId: string) => {
    setSelectedItems(prev => {
      const newSet = new Set(prev);
      if (newSet.has(itemId)) {
        newSet.delete(itemId);
      } else {
        newSet.add(itemId);
      }
      return newSet;
    });
  };

  // Créer les allocations selon le mode de paiement
  const buildAllocations = () => {
    switch (paymentType) {
      case 'full':
        return availableItems.map(line => ({
          orderLineId: line.id,
          quantityFraction: 1.0,
          allocatedAmount: line.totalPrice // 100% du prix
        }));

      case 'split':
        const fraction = 1.0 / splitCount;
        return availableItems.map(line => ({
          orderLineId: line.id,
          quantityFraction: fraction,
          allocatedAmount: Math.round(line.totalPrice * fraction) // fraction du prix
        }));

      case 'items':
        return Array.from(selectedItems).map(lineId => {
          const line = availableItems.find(l => l.id === lineId);
          return {
            orderLineId: lineId,
            quantityFraction: 1.0,
            allocatedAmount: line?.totalPrice || 0 // 100% du prix de l'item
          };
        });

      default:
        return [];
    }
  };

  // Traiter le paiement
  const handlePayment = async () => {
    if (!paymentMethod || amountToPay <= 0) return;

    setIsProcessing(true);
    try {
      const allocations = buildAllocations();

      await createPayment({
        orderId: order.id,
        amount: amountToPay,
        paymentMethod,
        allocations: allocations as any
      });

      onPaymentComplete();
      onBack();
    } catch (error) {
      console.error('Erreur lors de la création du paiement:', error);
      alert('Erreur lors du paiement');
    } finally {
      setIsProcessing(false);
    }
  };

  // Render d'un item de la liste
  const renderOrderLine = (line: OrderLine) => {
    const isPaid = orderTotals.paidOrderLineIds.has(line.id);
    const isSelected = selectedItems.has(line.id);
    const showCheckbox = paymentType === 'items' && !isPaid;

    const itemName = line.type === 'MENU'
      ? line.menu?.name || 'Menu'
      : line.item?.name || 'Article';

    // Récupérer les sous-items pour les menus
    const subItems = line.type === 'MENU' && line.items
      ? line.items.map(menuItem => menuItem.item?.name).filter(Boolean)
      : [];

    return (
      <Pressable
        key={line.id}
        onPress={() => showCheckbox && handleItemToggle(line.id)}
        disabled={isPaid || paymentType !== 'items'}
        className="py-3 border-b border-gray-100"
      >
        <View className="flex-row items-start">
          {/* Checkbox ou Check vert */}
          <View className="w-8 items-center pt-0.5">
            {showCheckbox && (
              <View className={`w-5 h-5 border-2 rounded items-center justify-center ${
                isSelected ? 'bg-green-500 border-green-500' : 'border-gray-300'
              }`}>
                {isSelected && <Check size={14} color="white" strokeWidth={3} />}
              </View>
            )}
            {isPaid && (
              <Check size={18} color="#10B981" strokeWidth={2} />
            )}
          </View>

          {/* Nom et prix */}
          <View className="flex-1">
            <View className="flex-row items-start justify-between">
              <View className="flex-1 mr-2">
                <Text className={`font-medium ${
                  isPaid ? 'text-gray-400 line-through' : 'text-gray-900'
                }`}>
                  {itemName}
                </Text>
                {subItems.length > 0 && (
                  <View className="mt-1">
                    {subItems.map((subItem, idx) => (
                      <Text key={idx} className={`text-xs ${
                        isPaid ? 'text-gray-300' : 'text-gray-500'
                      }`}>
                        • {subItem}
                      </Text>
                    ))}
                  </View>
                )}
                {isPaid && (
                  <Text className="text-xs text-green-600 mt-1">✓ Payé</Text>
                )}
              </View>
              <Text className={`font-medium ${
                isPaid ? 'text-gray-400 line-through' : 'text-gray-900'
              }`}>
                {formatPrice(line.totalPrice)}
              </Text>
            </View>
          </View>
        </View>
      </Pressable>
    );
  };

  return (
    <View className="flex-1 bg-white">
      {/* HEADER */}
      <View className="bg-white border-b border-gray-200 px-6 py-4">
        <View className="flex-row items-center">
          <Pressable onPress={onBack} className="mr-3">
            <ChevronLeft size={24} color="#000" />
          </Pressable>
          <Text className="text-lg font-semibold">Paiement - {tableName}</Text>
        </View>
      </View>

      {/* CONTENU */}
      <View className="flex-1 flex-row">
        {/* PANNEAU GAUCHE: Articles */}
        <View className="w-[380px] border-r border-gray-200 bg-white">
          <View className="px-6 py-4 border-b border-gray-100">
            <Text className="font-semibold text-gray-900 mb-1">Articles de la commande</Text>
            <Text className="text-sm text-gray-500">{order.lines?.length || 0} article(s)</Text>
          </View>

          <ScrollView className="flex-1 px-6">
            {order.lines?.map(line => renderOrderLine(line))}
          </ScrollView>
        </View>

        {/* PANNEAU DROIT: Configuration */}
        <View className="flex-1 bg-gray-50">
          <View className="flex-1 px-6 py-4">
            {/* RÉSUMÉ */}
            <View className="bg-white rounded-lg p-4 mb-4 border border-gray-200">
              <Text className="font-semibold text-gray-900 mb-2">Résumé</Text>
              <View className="flex-row justify-between mb-1">
                <Text className="text-sm text-gray-600">Total:</Text>
                <Text className="text-sm font-semibold text-gray-900">
                  {formatPrice(orderTotals.totalAmount)}
                </Text>
              </View>
              <View className="flex-row justify-between mb-2">
                <Text className="text-sm text-gray-600">Déjà payé:</Text>
                <Text className="text-sm font-semibold text-green-600">
                  {formatPrice(orderTotals.paidAmount)}
                </Text>
              </View>
              <View className="border-t border-gray-200 pt-2">
                <View className="flex-row justify-between">
                  <Text className="font-bold text-gray-900">Restant:</Text>
                  <Text className="font-bold text-lg text-blue-600">
                    {formatPrice(orderTotals.remainingAmount)}
                  </Text>
                </View>
              </View>
            </View>

            {/* TYPE DE PAIEMENT */}
            <View className="mb-4">
              <Text className="font-semibold text-gray-900 mb-2">Type de paiement</Text>
              <View className="gap-2">
                <Pressable
                  onPress={() => setPaymentType('full')}
                  disabled={orderTotals.remainingAmount === 0}
                  className={`h-10 rounded-lg border-2 items-center justify-center ${
                    paymentType === 'full'
                      ? 'bg-blue-50 border-blue-500'
                      : orderTotals.remainingAmount === 0
                      ? 'bg-gray-100 border-gray-200'
                      : 'bg-white border-gray-300'
                  }`}
                >
                  <Text className={`font-medium ${
                    paymentType === 'full'
                      ? 'text-blue-700'
                      : orderTotals.remainingAmount === 0
                      ? 'text-gray-400'
                      : 'text-gray-700'
                  }`}>
                    Paiement complet
                  </Text>
                </Pressable>

                <Pressable
                  onPress={() => setPaymentType('split')}
                  disabled={orderTotals.remainingAmount === 0}
                  className={`h-10 rounded-lg border-2 items-center justify-center ${
                    paymentType === 'split'
                      ? 'bg-blue-50 border-blue-500'
                      : orderTotals.remainingAmount === 0
                      ? 'bg-gray-100 border-gray-200'
                      : 'bg-white border-gray-300'
                  }`}
                >
                  <Text className={`font-medium ${
                    paymentType === 'split'
                      ? 'text-blue-700'
                      : orderTotals.remainingAmount === 0
                      ? 'text-gray-400'
                      : 'text-gray-700'
                  }`}>
                    Split égal
                  </Text>
                </Pressable>

                <Pressable
                  onPress={() => setPaymentType('items')}
                  disabled={availableItems.length === 0}
                  className={`h-10 rounded-lg border-2 items-center justify-center ${
                    paymentType === 'items'
                      ? 'bg-blue-50 border-blue-500'
                      : availableItems.length === 0
                      ? 'bg-gray-100 border-gray-200'
                      : 'bg-white border-gray-300'
                  }`}
                >
                  <Text className={`font-medium ${
                    paymentType === 'items'
                      ? 'text-blue-700'
                      : availableItems.length === 0
                      ? 'text-gray-400'
                      : 'text-gray-700'
                  }`}>
                    Par articles
                  </Text>
                </Pressable>
              </View>
            </View>

            {/* COMPTEUR SPLIT */}
            {paymentType === 'split' && (
              <View className="bg-white rounded-lg p-3 mb-4 border border-gray-200">
                <Text className="text-xs font-medium text-gray-700 mb-2 text-center">
                  Nombre de personnes
                </Text>
                <View className="flex-row items-center justify-center gap-4">
                  <Pressable
                    onPress={() => setSplitCount(Math.max(2, splitCount - 1))}
                    className="w-8 h-8 bg-gray-100 rounded items-center justify-center"
                  >
                    <Minus size={16} color="#374151" />
                  </Pressable>

                  <Text className="text-2xl font-bold text-gray-900 w-12 text-center">
                    {splitCount}
                  </Text>

                  <Pressable
                    onPress={() => setSplitCount(Math.min(10, splitCount + 1))}
                    className="w-8 h-8 bg-gray-100 rounded items-center justify-center"
                  >
                    <Plus size={16} color="#374151" />
                  </Pressable>
                </View>
              </View>
            )}

            {/* ARTICLES SÉLECTIONNÉS */}
            {paymentType === 'items' && (
              <View className="bg-white rounded-lg p-3 mb-4 border border-gray-200">
                <Text className="font-semibold text-sm text-gray-900 mb-1">Articles sélectionnés</Text>
                <Text className="text-xs text-gray-500 mb-2">
                  Cliquez sur les articles à gauche
                </Text>
                <Text className="text-lg font-bold text-blue-600">
                  {formatPrice(amountToPay)}
                </Text>
              </View>
            )}

            {/* MOYEN DE PAIEMENT */}
            <View className="mb-2">
              <Text className="font-semibold text-gray-900 mb-2">Moyen de paiement</Text>
              <View className="flex-row flex-wrap gap-2">
                {/* Espèces */}
                <Pressable
                  onPress={() => setPaymentMethod('cash')}
                  className={`flex-1 min-w-[48%] h-20 rounded-lg border-2 items-center justify-center ${
                    paymentMethod === 'cash'
                      ? 'bg-blue-50 border-blue-500'
                      : 'bg-white border-gray-300'
                  }`}
                >
                  <Text className="text-2xl mb-2">💵</Text>
                  <Text className={`font-medium ${
                    paymentMethod === 'cash' ? 'text-blue-700' : 'text-gray-700'
                  }`}>
                    Espèces
                  </Text>
                </Pressable>

                {/* Carte */}
                <Pressable
                  onPress={() => setPaymentMethod('card')}
                  className={`flex-1 min-w-[48%] h-20 rounded-lg border-2 items-center justify-center ${
                    paymentMethod === 'card'
                      ? 'bg-blue-50 border-blue-500'
                      : 'bg-white border-gray-300'
                  }`}
                >
                  <Text className="text-2xl mb-2">💳</Text>
                  <Text className={`font-medium ${
                    paymentMethod === 'card' ? 'text-blue-700' : 'text-gray-700'
                  }`}>
                    Carte
                  </Text>
                </Pressable>

                {/* Ticket Resto */}
                <Pressable
                  onPress={() => setPaymentMethod('ticket_resto')}
                  className={`flex-1 min-w-[48%] h-20 rounded-lg border-2 items-center justify-center ${
                    paymentMethod === 'ticket_resto'
                      ? 'bg-blue-50 border-blue-500'
                      : 'bg-white border-gray-300'
                  }`}
                >
                  <Text className="text-2xl mb-2">🎫</Text>
                  <Text className={`font-medium ${
                    paymentMethod === 'ticket_resto' ? 'text-blue-700' : 'text-gray-700'
                  }`}>
                    Ticket Resto
                  </Text>
                </Pressable>

                {/* Chèque */}
                <Pressable
                  onPress={() => setPaymentMethod('check')}
                  className={`flex-1 min-w-[48%] h-20 rounded-lg border-2 items-center justify-center ${
                    paymentMethod === 'check'
                      ? 'bg-blue-50 border-blue-500'
                      : 'bg-white border-gray-300'
                  }`}
                >
                  <Text className="text-2xl mb-2">✓</Text>
                  <Text className={`font-medium ${
                    paymentMethod === 'check' ? 'text-blue-700' : 'text-gray-700'
                  }`}>
                    Chèque
                  </Text>
                </Pressable>
              </View>
            </View>
          </View>

          {/* BOUTON PAYER FIXE EN BAS */}
          <View className="px-6 py-3 bg-white border-t border-gray-200">
            <Button
              onPress={handlePayment}
              disabled={!paymentMethod || amountToPay <= 0 || isProcessing}
              className={`w-full h-12 ${
                !paymentMethod || amountToPay <= 0 || isProcessing
                  ? 'bg-gray-300'
                  : 'bg-blue-600'
              }`}
            >
              <View className="flex-row items-center gap-2">
                <Text className="text-2xl">💳</Text>
                <Text className="text-white font-bold text-base">
                  {isProcessing
                    ? 'Traitement...'
                    : `Payer ${formatPrice(amountToPay)}`
                  }
                </Text>
              </View>
            </Button>
          </View>
        </View>
      </View>
    </View>
  );
}
