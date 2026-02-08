import { useState, useMemo } from 'react';
import { View, ScrollView, Pressable, Alert } from 'react-native';
import { Button, Text } from '~/components/ui';
import {
  ChevronLeft,
  Check,
  Minus,
  Plus,
  CreditCard,
  Banknote,
  Ticket,
  FileCheck,
  Users,
  User
} from 'lucide-react-native';
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

type PaymentMethod = 'cash' | 'card' | 'check' | 'ticket_resto';
type SelectionMode = 'all' | 'manual';
type PaymentMode = 'single' | 'split';

export default function PaymentView({ order, tableName, onBack, onPaymentComplete }: PaymentViewProps) {
  const { createPayment, getPaymentsByOrder, getAllocationsByOrderLine, payments: allPayments } = usePayments();

  // États principaux
  const [selectionMode, setSelectionMode] = useState<SelectionMode | null>(null);
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
  const [paymentMode, setPaymentMode] = useState<PaymentMode | null>(null);
  const [splitCount, setSplitCount] = useState(2);
  const [currentSplitPayer, setCurrentSplitPayer] = useState(1); // Pour suivre qui paie actuellement
  const [completedSplitPayments, setCompletedSplitPayments] = useState<number[]>([]); // Pour suivre qui a déjà payé
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  // Récupérer les paiements depuis Redux
  const payments = useMemo(() => {
    return getPaymentsByOrder(order.id);
  }, [order.id, getPaymentsByOrder]);

  // Calculer le statut de paiement d'une ligne (complètement payée, partiellement, ou non payée)
  const getLinePaymentStatus = (lineId: string): { isPaid: boolean; isPartiallyPaid: boolean; paidFraction: number } => {
    const allocations = getAllocationsByOrderLine(lineId);

    // Filtrer uniquement les allocations des paiements complétés
    const validAllocations = allocations.filter(allocation => {
      const payment = allPayments.find(p => p.id === allocation.paymentId);
      return payment && payment.status === 'completed';
    });

    if (validAllocations.length === 0) {
      return { isPaid: false, isPartiallyPaid: false, paidFraction: 0 };
    }

    const totalFraction = validAllocations.reduce((sum, alloc) => sum + alloc.quantityFraction, 0);

    // Considérer comme complètement payé si la fraction est >= 0.999 (pour gérer les arrondis)
    const isPaid = totalFraction >= 0.999;
    const isPartiallyPaid = totalFraction > 0 && totalFraction < 0.999;

    return { isPaid, isPartiallyPaid, paidFraction: totalFraction };
  };

  // Calculer les montants depuis les paiements Redux
  const orderTotals = useMemo(() => {
    const totalAmount = order.lines?.reduce((sum, line) => sum + line.totalPrice, 0) || 0;
    const completedPayments = payments.filter(p => p.status === 'completed');
    const paidAmount = completedPayments.reduce((sum, p) => sum + p.amount, 0);

    return {
      totalAmount,
      paidAmount,
      remainingAmount: totalAmount - paidAmount
    };
  }, [order.lines, payments]);

  // Items disponibles (non complètement payés)
  const availableItems = useMemo(() => {
    return order.lines?.filter(line => {
      const status = getLinePaymentStatus(line.id);
      return !status.isPaid; // Inclure les items non payés ET partiellement payés
    }) || [];
  }, [order.lines]);

  // Calculer le montant total sélectionné (en tenant compte des paiements partiels)
  const selectedAmount = useMemo(() => {
    if (selectedItems.size === 0) return 0;
    return availableItems
      .filter(line => selectedItems.has(line.id))
      .reduce((sum, line) => {
        const status = getLinePaymentStatus(line.id);
        const remainingFraction = 1.0 - status.paidFraction;
        // Le montant restant à payer pour cette ligne
        return sum + Math.round(line.totalPrice * remainingFraction);
      }, 0);
  }, [selectedItems, availableItems]);

  // Calculer le montant pour le paiement courant
  const currentPaymentAmount = useMemo(() => {
    if (paymentMode === 'single') {
      return selectedAmount;
    } else if (paymentMode === 'split') {
      const baseAmount = Math.floor(selectedAmount / splitCount);
      const remainder = selectedAmount - (baseAmount * splitCount);
      // Le dernier payeur paie le reste (centimes supplémentaires)
      return currentSplitPayer === splitCount ? baseAmount + remainder : baseAmount;
    }
    return 0;
  }, [paymentMode, selectedAmount, splitCount, currentSplitPayer]);

  // Calculer le montant restant après les paiements split déjà effectués
  const remainingAfterSplits = useMemo(() => {
    if (paymentMode !== 'split') return selectedAmount;

    const baseAmount = Math.floor(selectedAmount / splitCount);
    const paidSoFar = completedSplitPayments.length * baseAmount;
    return selectedAmount - paidSoFar;
  }, [paymentMode, selectedAmount, splitCount, completedSplitPayments]);

  // Gérer le changement de mode de sélection
  const handleSelectionModeChange = (mode: SelectionMode) => {
    setSelectionMode(mode);
    if (mode === 'all') {
      const allIds = new Set(availableItems.map(item => item.id));
      setSelectedItems(allIds);
    } else {
      setSelectedItems(new Set());
    }
    // Reset les étapes suivantes
    setPaymentMode(null);
    setPaymentMethod(null);
    setCurrentSplitPayer(1);
    setCompletedSplitPayments([]);
  };

  // Toggle sélection d'un item
  const handleItemToggle = (itemId: string) => {
    if (selectionMode !== 'manual') return;

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

  // Gérer le changement de mode de paiement
  const handlePaymentModeChange = (mode: PaymentMode) => {
    setPaymentMode(mode);
    setPaymentMethod(null);
    setCurrentSplitPayer(1);
    setCompletedSplitPayments([]);
  };

  // Créer les allocations selon le mode de paiement
  const buildAllocations = (fraction: number): Array<{
    orderLineId: string;
    quantityFraction: number;
    allocatedAmount: number;
  }> => {
    return Array.from(selectedItems).map(lineId => {
      const line = availableItems.find(l => l.id === lineId);
      if (!line) {
        throw new Error(`OrderLine ${lineId} not found`);
      }

      // Vérifier si la ligne est partiellement payée
      const status = getLinePaymentStatus(lineId);
      const remainingFraction = 1.0 - status.paidFraction;

      // La fraction à allouer est soit la fraction demandée (pour split),
      // soit le reste à payer (pour paiement complet)
      const actualFraction = paymentMode === 'split'
        ? Math.min(fraction, remainingFraction)  // Pour split, on prend le minimum entre la fraction et ce qui reste
        : remainingFraction;  // Pour paiement unique, on prend tout ce qui reste

      return {
        orderLineId: lineId,
        quantityFraction: actualFraction,
        allocatedAmount: Math.round(line.totalPrice * actualFraction)
      };
    });
  };

  // Traiter le paiement
  const handlePayment = async () => {
    if (selectedAmount === 0) {
      Alert.alert('Erreur', 'Veuillez sélectionner au moins un article');
      return;
    }

    if (!paymentMethod) {
      Alert.alert('Erreur', 'Veuillez sélectionner une méthode de paiement');
      return;
    }

    setIsProcessing(true);
    try {
      if (paymentMode === 'single') {
        // Un seul paiement
        await createPayment({
          orderId: order.id,
          amount: selectedAmount,
          paymentMethod,
          allocations: buildAllocations(1.0)
        });

        setIsProcessing(false);
        onPaymentComplete();
        onBack();
      } else {
        // Mode split : paiement de la personne courante
        const fraction = 1.0 / splitCount;

        await createPayment({
          orderId: order.id,
          amount: currentPaymentAmount,
          paymentMethod,
          allocations: buildAllocations(fraction)
        });

        // Marquer ce paiement comme complété
        const newCompletedPayments = [...completedSplitPayments, currentSplitPayer];
        setCompletedSplitPayments(newCompletedPayments);

        // Vérifier si tous les paiements sont terminés
        if (newCompletedPayments.length === splitCount) {
          // Tous les paiements sont terminés
          setIsProcessing(false);
          onPaymentComplete();
          onBack();
        } else {
          // Passer au prochain payeur
          setCurrentSplitPayer(currentSplitPayer + 1);
          setPaymentMethod(null); // Reset la méthode pour le prochain payeur
          setIsProcessing(false); // Important : réactiver le bouton après le changement d'état
          Alert.alert(
            'Paiement enregistré',
            `Personne ${currentSplitPayer} a payé ${formatPrice(currentPaymentAmount)}.\n\nAu tour de la personne ${currentSplitPayer + 1}.`
          );
          return; // Important : sortir ici pour éviter le finally
        }
      }
    } catch (error) {
      console.error('Erreur lors de la création du paiement:', error);
      Alert.alert('Erreur', 'Une erreur est survenue lors du paiement');
      setIsProcessing(false);
    }
  };

  // Render d'un item de la liste
  const renderOrderLine = (line: OrderLine) => {
    const paymentStatus = getLinePaymentStatus(line.id);
    const { isPaid, isPartiallyPaid, paidFraction } = paymentStatus;
    const isSelected = selectedItems.has(line.id);
    const isSelectable = selectionMode === 'manual' && !isPaid; // On peut sélectionner si pas complètement payé

    const itemName = line.type === 'MENU'
      ? line.menu?.name || 'Menu'
      : line.item?.name || 'Article';

    const subItems = line.type === 'MENU' && line.items
      ? line.items.map(menuItem => menuItem.item?.name).filter(Boolean)
      : [];

    return (
      <Pressable
        key={line.id}
        onPress={() => isSelectable && handleItemToggle(line.id)}
        disabled={!isSelectable}
        className="py-3 border-b border-gray-100"
      >
        <View className="flex-row items-start">
          <View className="w-10 items-center pt-0.5">
            {/* Affichage pour les lignes complètement payées */}
            {isPaid && (
              <Check size={18} color="#10B981" strokeWidth={2} />
            )}

            {/* Affichage pour les lignes non payées ou partiellement payées */}
            {!isPaid && (
              <>
                {/* Checkbox seulement si en mode sélection manuelle */}
                {selectionMode === 'manual' && (
                  <View className={`w-5 h-5 border-2 rounded items-center justify-center ${
                    isSelected ? 'bg-blue-500 border-blue-500' : 'border-gray-300'
                  }`}>
                    {isSelected && <Check size={14} color="white" strokeWidth={3} />}
                  </View>
                )}

                {/* Pour le mode "Tout sélectionner", afficher un check si sélectionné */}
                {selectionMode === 'all' && isSelected && !isPartiallyPaid && (
                  <View className="w-5 h-5 bg-blue-500 rounded items-center justify-center">
                    <Check size={14} color="white" strokeWidth={3} />
                  </View>
                )}
              </>
            )}
          </View>

          <View className="flex-1">
            <View className="flex-row items-start justify-between">
              <View className="flex-1 mr-2">
                <Text className={`font-medium ${
                  isPaid ? 'text-gray-400 line-through' : isPartiallyPaid ? 'text-orange-600' : 'text-gray-900'
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
                  <Text className="text-xs text-green-600 mt-1">Payé</Text>
                )}
                {isPartiallyPaid && !isPaid && (
                  <Text className="text-xs text-orange-600 mt-1">
                    Partiellement payé ({Math.round(paidFraction * 100)}%)
                  </Text>
                )}
              </View>
              <View className="items-end">
                <Text className={`font-medium ${
                  isPaid ? 'text-gray-400 line-through' : isPartiallyPaid ? 'text-orange-600' : 'text-gray-900'
                }`}>
                  {formatPrice(line.totalPrice)}
                </Text>
                {isPartiallyPaid && !isPaid && (
                  <Text className="text-xs text-orange-600 mt-1">
                    Reste: {formatPrice(Math.round(line.totalPrice * (1 - paidFraction)))}
                  </Text>
                )}
              </View>
            </View>
          </View>
        </View>
      </Pressable>
    );
  };

  // Vérifier si on peut passer au paiement
  const canProceedToPayment = useMemo(() => {
    return selectedAmount > 0 && paymentMode !== null && paymentMethod !== null;
  }, [selectedAmount, paymentMode, paymentMethod]);

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

          {/* Résumé en bas */}
          <View className="px-6 py-3 bg-gray-50 border-t border-gray-200">
            <View className="flex-row justify-between mb-1">
              <Text className="text-sm text-gray-600">Total:</Text>
              <Text className="text-sm font-semibold text-gray-900">
                {formatPrice(orderTotals.totalAmount)}
              </Text>
            </View>
            <View className="flex-row justify-between mb-1">
              <Text className="text-sm text-gray-600">Déjà payé:</Text>
              <Text className="text-sm font-semibold text-green-600">
                {formatPrice(orderTotals.paidAmount)}
              </Text>
            </View>
            <View className="border-t border-gray-300 pt-1 mt-1">
              <View className="flex-row justify-between">
                <Text className="font-bold text-gray-900">Restant:</Text>
                <Text className="font-bold text-blue-600">
                  {formatPrice(orderTotals.remainingAmount)}
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* PANNEAU DROIT: Configuration */}
        <View className="flex-1 bg-gray-50">
          <ScrollView className="flex-1 px-6 py-4">
            {/* ÉTAPE 1: Mode de sélection */}
            <View className="mb-6">
              <Text className="font-semibold text-gray-900 mb-3">1. Sélection des articles</Text>
              <View className="flex-row gap-2">
                <Pressable
                  onPress={() => handleSelectionModeChange('all')}
                  disabled={availableItems.length === 0}
                  className={`flex-1 h-10 rounded-lg border-2 items-center justify-center ${
                    selectionMode === 'all'
                      ? 'bg-blue-50 border-blue-500'
                      : availableItems.length === 0
                      ? 'bg-gray-100 border-gray-200'
                      : 'bg-white border-gray-300'
                  }`}
                >
                  <Text className={`font-medium ${
                    selectionMode === 'all'
                      ? 'text-blue-700'
                      : availableItems.length === 0
                      ? 'text-gray-400'
                      : 'text-gray-700'
                  }`}>
                    Tout sélectionner
                  </Text>
                </Pressable>

                <Pressable
                  onPress={() => handleSelectionModeChange('manual')}
                  disabled={availableItems.length === 0}
                  className={`flex-1 h-10 rounded-lg border-2 items-center justify-center ${
                    selectionMode === 'manual'
                      ? 'bg-blue-50 border-blue-500'
                      : availableItems.length === 0
                      ? 'bg-gray-100 border-gray-200'
                      : 'bg-white border-gray-300'
                  }`}
                >
                  <Text className={`font-medium ${
                    selectionMode === 'manual'
                      ? 'text-blue-700'
                      : availableItems.length === 0
                      ? 'text-gray-400'
                      : 'text-gray-700'
                  }`}>
                    Sélection manuelle
                  </Text>
                </Pressable>
              </View>

              {/* Montant sélectionné */}
              {selectionMode && selectedAmount > 0 && (
                <View className="bg-white rounded-lg p-3 mt-3 border border-gray-200">
                  <View className="flex-row justify-between">
                    <Text className="text-sm text-gray-600">Montant sélectionné:</Text>
                    <Text className="font-bold text-blue-600">
                      {formatPrice(selectedAmount)}
                    </Text>
                  </View>
                </View>
              )}
            </View>

            {/* ÉTAPE 2: Mode de répartition */}
            <View className={`mb-6 ${!selectionMode || selectedAmount === 0 ? 'opacity-50' : ''}`}>
              <Text className="font-semibold text-gray-900 mb-3">2. Mode de répartition</Text>
              <View className="gap-2">
                <Pressable
                  onPress={() => handlePaymentModeChange('single')}
                  disabled={!selectionMode || selectedAmount === 0}
                  className={`p-3 rounded-lg border-2 ${
                    paymentMode === 'single'
                      ? 'bg-blue-50 border-blue-500'
                      : !selectionMode || selectedAmount === 0
                      ? 'bg-gray-100 border-gray-200'
                      : 'bg-white border-gray-300'
                  }`}
                >
                  <View className="flex-row items-center gap-2">
                    <User size={20} color={paymentMode === 'single' ? '#1D4ED8' : '#6B7280'} />
                    <View className="flex-1">
                      <Text className={`font-medium ${
                        paymentMode === 'single'
                          ? 'text-blue-700'
                          : !selectionMode || selectedAmount === 0
                          ? 'text-gray-400'
                          : 'text-gray-700'
                      }`}>
                        Paiement unique
                      </Text>
                      <Text className={`text-xs ${
                        paymentMode === 'single'
                          ? 'text-blue-600'
                          : !selectionMode || selectedAmount === 0
                          ? 'text-gray-300'
                          : 'text-gray-500'
                      }`}>
                        Une personne paie la totalité
                      </Text>
                    </View>
                  </View>
                </Pressable>

                <Pressable
                  onPress={() => handlePaymentModeChange('split')}
                  disabled={!selectionMode || selectedAmount === 0}
                  className={`p-3 rounded-lg border-2 ${
                    paymentMode === 'split'
                      ? 'bg-blue-50 border-blue-500'
                      : !selectionMode || selectedAmount === 0
                      ? 'bg-gray-100 border-gray-200'
                      : 'bg-white border-gray-300'
                  }`}
                >
                  <View className="flex-row items-center gap-2">
                    <Users size={20} color={paymentMode === 'split' ? '#1D4ED8' : '#6B7280'} />
                    <View className="flex-1">
                      <Text className={`font-medium ${
                        paymentMode === 'split'
                          ? 'text-blue-700'
                          : !selectionMode || selectedAmount === 0
                          ? 'text-gray-400'
                          : 'text-gray-700'
                      }`}>
                        Split égal
                      </Text>
                      <Text className={`text-xs ${
                        paymentMode === 'split'
                          ? 'text-blue-600'
                          : !selectionMode || selectedAmount === 0
                          ? 'text-gray-300'
                          : 'text-gray-500'
                      }`}>
                        Division entre plusieurs personnes
                      </Text>
                    </View>
                  </View>
                </Pressable>
              </View>

              {/* Sélecteur de nombre pour le split */}
              {paymentMode === 'split' && (
                <View className="bg-white rounded-lg p-4 mt-3 border border-gray-200">
                  <Text className="text-sm font-medium text-gray-700 mb-3 text-center">
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

                  <View className="mt-3 pt-3 border-t border-gray-200">
                    <Text className="text-center text-sm text-gray-500">
                      Par personne: {formatPrice(Math.floor(selectedAmount / splitCount))}
                    </Text>
                    {selectedAmount % splitCount !== 0 && (
                      <Text className="text-center text-xs text-gray-400 mt-1">
                        (dernière personne: +{formatPrice(selectedAmount % splitCount)})
                      </Text>
                    )}
                  </View>

                  {/* Indicateur de progression du split */}
                  {completedSplitPayments.length > 0 && (
                    <View className="mt-3 pt-3 border-t border-gray-200">
                      <Text className="text-xs font-medium text-gray-700 text-center mb-2">
                        Progression des paiements
                      </Text>
                      <View className="flex-row justify-center gap-1">
                        {Array.from({ length: splitCount }, (_, i) => i + 1).map(num => (
                          <View
                            key={num}
                            className={`w-8 h-8 rounded-full items-center justify-center ${
                              completedSplitPayments.includes(num)
                                ? 'bg-green-500'
                                : num === currentSplitPayer
                                ? 'bg-blue-500'
                                : 'bg-gray-200'
                            }`}
                          >
                            {completedSplitPayments.includes(num) ? (
                              <Check size={14} color="white" strokeWidth={3} />
                            ) : (
                              <Text className={`text-xs font-bold ${
                                num === currentSplitPayer ? 'text-white' : 'text-gray-500'
                              }`}>
                                {num}
                              </Text>
                            )}
                          </View>
                        ))}
                      </View>
                      <Text className="text-center text-xs text-gray-500 mt-2">
                        {completedSplitPayments.length}/{splitCount} personnes ont payé
                      </Text>
                    </View>
                  )}
                </View>
              )}
            </View>

            {/* ÉTAPE 3: Méthode de paiement */}
            <View className={`${!paymentMode ? 'opacity-50' : ''}`}>
              <Text className="font-semibold text-gray-900 mb-3">
                3. Méthode de paiement
                {paymentMode === 'split' && (
                  <Text className="font-normal text-sm text-gray-500">
                    {' '}(Personne {currentSplitPayer} - {formatPrice(currentPaymentAmount)})
                  </Text>
                )}
              </Text>

              {/* Affichage unifié des méthodes de paiement */}
              <View className="flex-row flex-wrap gap-2">
                <Pressable
                  onPress={() => setPaymentMethod('cash')}
                  disabled={!paymentMode}
                  className={`flex-1 min-w-[48%] h-20 rounded-lg border-2 items-center justify-center ${
                    paymentMethod === 'cash'
                      ? 'bg-blue-50 border-blue-500'
                      : !paymentMode
                      ? 'bg-gray-100 border-gray-200'
                      : 'bg-white border-gray-300'
                  }`}
                >
                  <Banknote size={24} color={paymentMethod === 'cash' ? '#1D4ED8' : '#6B7280'} />
                  <Text className={`font-medium mt-1 ${
                    paymentMethod === 'cash' ? 'text-blue-700' : !paymentMode ? 'text-gray-400' : 'text-gray-700'
                  }`}>
                    Espèces
                  </Text>
                </Pressable>

                <Pressable
                  onPress={() => setPaymentMethod('card')}
                  disabled={!paymentMode}
                  className={`flex-1 min-w-[48%] h-20 rounded-lg border-2 items-center justify-center ${
                    paymentMethod === 'card'
                      ? 'bg-blue-50 border-blue-500'
                      : !paymentMode
                      ? 'bg-gray-100 border-gray-200'
                      : 'bg-white border-gray-300'
                  }`}
                >
                  <CreditCard size={24} color={paymentMethod === 'card' ? '#1D4ED8' : '#6B7280'} />
                  <Text className={`font-medium mt-1 ${
                    paymentMethod === 'card' ? 'text-blue-700' : !paymentMode ? 'text-gray-400' : 'text-gray-700'
                  }`}>
                    Carte
                  </Text>
                </Pressable>

                <Pressable
                  onPress={() => setPaymentMethod('ticket_resto')}
                  disabled={!paymentMode}
                  className={`flex-1 min-w-[48%] h-20 rounded-lg border-2 items-center justify-center ${
                    paymentMethod === 'ticket_resto'
                      ? 'bg-blue-50 border-blue-500'
                      : !paymentMode
                      ? 'bg-gray-100 border-gray-200'
                      : 'bg-white border-gray-300'
                  }`}
                >
                  <Ticket size={24} color={paymentMethod === 'ticket_resto' ? '#1D4ED8' : '#6B7280'} />
                  <Text className={`font-medium mt-1 ${
                    paymentMethod === 'ticket_resto' ? 'text-blue-700' : !paymentMode ? 'text-gray-400' : 'text-gray-700'
                  }`}>
                    Ticket Resto
                  </Text>
                </Pressable>

                <Pressable
                  onPress={() => setPaymentMethod('check')}
                  disabled={!paymentMode}
                  className={`flex-1 min-w-[48%] h-20 rounded-lg border-2 items-center justify-center ${
                    paymentMethod === 'check'
                      ? 'bg-blue-50 border-blue-500'
                      : !paymentMode
                      ? 'bg-gray-100 border-gray-200'
                      : 'bg-white border-gray-300'
                  }`}
                >
                  <FileCheck size={24} color={paymentMethod === 'check' ? '#1D4ED8' : '#6B7280'} />
                  <Text className={`font-medium mt-1 ${
                    paymentMethod === 'check' ? 'text-blue-700' : !paymentMode ? 'text-gray-400' : 'text-gray-700'
                  }`}>
                    Chèque
                  </Text>
                </Pressable>
              </View>

              {/* Information sur le paiement en cours */}
              {paymentMode === 'split' && (
                <View className="bg-blue-50 rounded-lg p-3 mt-3 border border-blue-200">
                  <Text className="text-sm text-blue-900 text-center">
                    Personne {currentSplitPayer} sur {splitCount}
                  </Text>
                  <Text className="text-xs text-blue-700 text-center mt-1">
                    Montant à payer : {formatPrice(currentPaymentAmount)}
                  </Text>
                  {remainingAfterSplits > currentPaymentAmount && (
                    <Text className="text-xs text-blue-600 text-center mt-1">
                      Restant après ce paiement : {formatPrice(remainingAfterSplits - currentPaymentAmount)}
                    </Text>
                  )}
                </View>
              )}
            </View>
          </ScrollView>

          {/* BOUTON PAYER FIXE EN BAS */}
          <View className="px-6 py-3 bg-white border-t border-gray-200">
            <Button
              onPress={handlePayment}
              disabled={!canProceedToPayment || isProcessing}
              className={`w-full h-12 ${
                !canProceedToPayment || isProcessing
                  ? 'bg-gray-300'
                  : 'bg-green-600'
              }`}
            >
              <View className="flex-row items-center justify-center gap-2">
                <CreditCard size={20} color="white" />
                <Text className="text-white font-bold text-base">
                  {isProcessing
                    ? 'Traitement...'
                    : paymentMode === 'split'
                    ? `Payer ${formatPrice(currentPaymentAmount)} (${currentSplitPayer}/${splitCount})`
                    : `Payer ${formatPrice(selectedAmount)}`
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