import { useState, useMemo, useEffect } from 'react';
import { View, ScrollView, Pressable, Alert, TextInput, Modal, StyleSheet, Platform } from 'react-native';
import { Button, Text } from '~/components/ui';
import {
  ChevronLeft,
  Check,
  CreditCard,
  Banknote,
  Ticket,
  FileCheck,
  X,
  Percent
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
  onTerminate?: () => void;
}

type PaymentMethod = 'cash' | 'card' | 'check' | 'ticket_resto';

export default function PaymentView({ order, tableName, onBack, onPaymentComplete, onTerminate }: PaymentViewProps) {
  const { createPayment, getPaymentsByOrder, getAllocationsByOrderLine, payments: allPayments } = usePayments();

  // États principaux
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
  const [itemFractions, setItemFractions] = useState<Map<string, number>>(new Map()); // Fraction personnalisée par item
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showCustomDialog, setShowCustomDialog] = useState<string | null>(null); // ID de l'item pour le dialog custom

  // Récupérer les paiements depuis l'API
  const [payments, setPayments] = useState<any[]>([]);

  useEffect(() => {
    const loadPayments = async () => {
      const data = await getPaymentsByOrder(order.id);
      setPayments(data);
    };
    loadPayments();
  }, [order.id, getPaymentsByOrder]);

  // Utiliser directement les données de paiement du backend
  const getLinePaymentStatus = (line: OrderLine): { isPaid: boolean; isPartiallyPaid: boolean; paidFraction: number } => {
    // Les données du backend sont maintenant toujours disponibles avec des valeurs par défaut
    return {
      isPaid: line.paymentStatus === 'paid',
      isPartiallyPaid: line.paymentStatus === 'partial',
      paidFraction: line.paidFraction
    };
  };

  const orderTotals = useMemo(() => {
    return {
      totalAmount: order.totalAmount || 0,
      paidAmount: order.paidAmount || 0,
      remainingAmount: Math.max(0, (order.totalAmount || 0) - (order.paidAmount || 0))
    };
  }, [order.totalAmount, order.paidAmount]);

  // Items disponibles (non complètement payés)
  const availableItems = useMemo(() => {
    return order.lines?.filter(line => {
      const status = getLinePaymentStatus(line);
      return !status.isPaid; // Inclure les items non payés ET partiellement payés
    }) || [];
  }, [order.lines, getAllocationsByOrderLine, allPayments]);

  // Calculer le montant total sélectionné (en tenant compte des fractions personnalisées et paiements partiels)
  const selectedAmount = useMemo(() => {
    if (selectedItems.size === 0) return 0;
    return availableItems
      .filter(line => selectedItems.has(line.id))
      .reduce((sum, line) => {
        const status = getLinePaymentStatus(line);
        const remainingFraction = Math.max(0, 1.0 - status.paidFraction); // S'assurer que c'est jamais négatif
        // Pour les articles partiellement payés, utiliser le reste par défaut au lieu de 100%
        const defaultFraction = remainingFraction < 1.0 ? remainingFraction : 1.0;
        const selectedFraction = itemFractions.get(line.id) ?? defaultFraction;
        const actualFraction = Math.min(selectedFraction, remainingFraction);
        // Le montant à payer pour cette ligne selon la fraction choisie
        const lineAmount = Math.round(line.totalPrice * actualFraction);
        return sum + (isNaN(lineAmount) ? 0 : lineAmount);
      }, 0);
  }, [selectedItems, availableItems, itemFractions, getAllocationsByOrderLine, allPayments]);


  // Toggle sélection d'un item
  const handleItemToggle = (itemId: string) => {
    setSelectedItems(prev => {
      const newSet = new Set(prev);
      if (newSet.has(itemId)) {
        newSet.delete(itemId);
        // Enlever aussi la fraction personnalisée si elle existe
        const newFractions = new Map(itemFractions);
        newFractions.delete(itemId);
        setItemFractions(newFractions);
      } else {
        newSet.add(itemId);
      }
      return newSet;
    });
  };

  // Sélectionner/désélectionner tout
  const handleSelectAll = () => {
    if (selectedItems.size === availableItems.length) {
      // Tout est sélectionné, on désélectionne tout
      setSelectedItems(new Set());
      setItemFractions(new Map());
      setPaymentMethod(null);
    } else {
      // Sélectionner tout
      const allIds = new Set(availableItems.map(item => item.id));
      setSelectedItems(allIds);
    }
  };

  // Gérer le changement de fraction pour un item
  const handleFractionChange = (itemId: string, fraction: number) => {
    const newFractions = new Map(itemFractions);
    if (fraction === 1.0) {
      // Si 100%, on peut supprimer de la map (valeur par défaut)
      newFractions.delete(itemId);
    } else {
      newFractions.set(itemId, fraction);
    }
    setItemFractions(newFractions);
  };

  // Créer les allocations en utilisant les fractions individuelles
  const buildAllocations = (): Array<{
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
      const status = getLinePaymentStatus(line);
      const remainingFraction = Math.max(0, 1.0 - status.paidFraction); // S'assurer que c'est jamais négatif

      // Pour les articles partiellement payés, utiliser le reste par défaut au lieu de 100%
      const defaultFraction = remainingFraction < 1.0 ? remainingFraction : 1.0;
      const selectedFraction = itemFractions.get(lineId) ?? defaultFraction;
      const actualFraction = Math.min(selectedFraction, remainingFraction);

      // Calculer le montant alloué et s'assurer qu'il est valide
      const allocatedAmount = Math.round(line.totalPrice * actualFraction);

      return {
        orderLineId: lineId,
        quantityFraction: actualFraction,
        allocatedAmount: isNaN(allocatedAmount) ? 0 : allocatedAmount
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
      await createPayment({
        orderId: order.id,
        amount: selectedAmount,
        paymentMethod,
        allocations: buildAllocations()
      });
      setSelectedItems(new Set());
      setItemFractions(new Map());
      setPaymentMethod(null);
      const updatedPayments = await getPaymentsByOrder(order.id);
      setPayments(updatedPayments);
      onPaymentComplete();

      setIsProcessing(false);
    } catch (error) {
      console.error('Erreur lors de la création du paiement:', error);
      Alert.alert('Erreur', 'Une erreur est survenue lors du paiement');
      setIsProcessing(false);
    }
  };

  // Render d'un item de la liste
  const renderOrderLine = (line: OrderLine) => {
    const paymentStatus = getLinePaymentStatus(line);
    const { isPaid, isPartiallyPaid, paidFraction } = paymentStatus;
    const isSelected = selectedItems.has(line.id);
    const isSelectable = !isPaid; // On peut sélectionner si pas complètement payé

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
              <View className={`w-5 h-5 border-2 rounded items-center justify-center ${
                isSelected ? 'bg-blue-500 border-blue-500' : 'border-gray-300'
              }`}>
                {isSelected && <Check size={14} color="white" strokeWidth={3} />}
              </View>
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
    return selectedAmount > 0 && paymentMethod !== null;
  }, [selectedAmount, paymentMethod]);

  // Composant pour afficher un article sélectionné avec les boutons de fraction
  const renderSelectedItemCard = (line: OrderLine) => {
    const status = getLinePaymentStatus(line);
    const remainingFraction = Math.max(0, 1.0 - status.paidFraction);
    // Pour les articles partiellement payés, utiliser le reste par défaut au lieu de 100%
    const defaultFraction = remainingFraction < 1.0 ? remainingFraction : 1.0;
    const selectedFraction = itemFractions.get(line.id) ?? defaultFraction;
    const actualFraction = Math.min(selectedFraction, remainingFraction);
    const itemAmount = Math.round(line.totalPrice * actualFraction);

    const itemName = line.type === 'MENU'
      ? line.menu?.name || 'Menu'
      : line.item?.name || 'Article';

    const fractionButtons = [
      { label: '100%', value: 1.0 },
      { label: '50%', value: 0.5 },
      { label: '33%', value: 0.33 },
      { label: '25%', value: 0.25 },
    ];

    return (
      <View key={line.id} className="bg-white rounded-lg p-4 mb-3 border border-gray-200">
        <View className="flex-row justify-between items-center mb-3">
          <Text className="font-semibold text-gray-900 flex-1 mr-2">{itemName}</Text>
          <Text className="text-sm text-gray-500">{formatPrice(line.totalPrice)}</Text>
        </View>

        {/* Boutons de fraction */}
        <View className="flex-row flex-wrap gap-2 mb-2">
          {fractionButtons.map(({ label, value }) => (
            <Pressable
              key={label}
              onPress={() => handleFractionChange(line.id, value)}
              disabled={value > remainingFraction}
              className={`px-3 py-1.5 rounded-md border ${
                selectedFraction === value
                  ? 'bg-blue-500 border-blue-500'
                  : value > remainingFraction
                  ? 'bg-gray-100 border-gray-200'
                  : 'bg-white border-gray-300'
              }`}
            >
              <Text className={`text-xs font-medium ${
                selectedFraction === value
                  ? 'text-white'
                  : value > remainingFraction
                  ? 'text-gray-400'
                  : 'text-gray-700'
              }`}>
                {label}
              </Text>
            </Pressable>
          ))}

          {/* Bouton Custom */}
          <Pressable
            onPress={() => setShowCustomDialog(line.id)}
            className={`px-3 py-1.5 rounded-md border ${
              !fractionButtons.some(b => b.value === selectedFraction)
                ? 'bg-blue-500 border-blue-500'
                : 'bg-white border-gray-300'
            }`}
          >
            <View className="flex-row items-center gap-1">
              <Percent size={12} color={!fractionButtons.some(b => b.value === selectedFraction) ? 'white' : '#6B7280'} />
              <Text className={`text-xs font-medium ${
                !fractionButtons.some(b => b.value === selectedFraction)
                  ? 'text-white'
                  : 'text-gray-700'
              }`}>
                {!fractionButtons.some(b => b.value === selectedFraction)
                  ? `${Math.round(selectedFraction * 100)}%`
                  : 'Custom'
                }
              </Text>
            </View>
          </Pressable>
        </View>

        {/* Montant à payer pour cet article */}
        <View className="pt-2 border-t border-gray-100">
          <View className="flex-row justify-between items-center">
            <Text className="text-sm text-gray-600">Montant à payer :</Text>
            <Text className="font-bold text-blue-600">
              {formatPrice(itemAmount)}
              {selectedFraction !== 1.0 && (
                <Text className="text-xs text-gray-500"> ({Math.round(selectedFraction * 100)}%)</Text>
              )}
            </Text>
          </View>
        </View>

        {/* Avertissement si partiellement payé */}
        {status.isPartiallyPaid && (
          <Text className="text-xs text-orange-600 mt-2">
            Déjà {Math.round(status.paidFraction * 100)}% payé
          </Text>
        )}
      </View>
    );
  };

  // Modal pour le pourcentage personnalisé
  const [customPercentage, setCustomPercentage] = useState('');

  const CustomPercentageModal = () => {
    if (!showCustomDialog) return null;

    const line = availableItems.find(l => l.id === showCustomDialog);
    if (!line) return null;

    const status = getLinePaymentStatus(line);
    const maxPercentage = Math.round((1.0 - status.paidFraction) * 100);

    const handleCustomSubmit = () => {
      const percentage = parseInt(customPercentage);
      if (!isNaN(percentage) && percentage > 0 && percentage <= maxPercentage) {
        handleFractionChange(showCustomDialog, percentage / 100);
        setShowCustomDialog(null);
        setCustomPercentage('');
      } else {
        Alert.alert('Erreur', `Veuillez entrer un pourcentage entre 1 et ${maxPercentage}`);
      }
    };

    return (
      <Modal
        visible={true}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowCustomDialog(null)}
      >
        <Pressable
          className="flex-1 bg-black/50 justify-center items-center"
          onPress={() => setShowCustomDialog(null)}
        >
          <Pressable
            className="bg-white rounded-lg p-6 w-80"
            onPress={(e) => e.stopPropagation()}
          >
            <View className="flex-row justify-between items-center mb-4">
              <Text className="text-lg font-semibold">Pourcentage personnalisé</Text>
              <Pressable onPress={() => setShowCustomDialog(null)}>
                <X size={20} color="#6B7280" />
              </Pressable>
            </View>

            <Text className="text-sm text-gray-600 mb-4">
              Entrez le pourcentage à payer pour cet article
              {status.isPartiallyPaid && ` (max: ${maxPercentage}%)`}
            </Text>

            <View className="flex-row items-center gap-2 mb-6">
              <TextInput
                className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-center"
                placeholder="50"
                keyboardType="number-pad"
                value={customPercentage}
                onChangeText={setCustomPercentage}
                autoFocus
                maxLength={3}
              />
              <Text className="text-xl font-bold text-gray-700">%</Text>
            </View>

            <View className="flex-row gap-2">
              <Button
                className="flex-1 bg-gray-200"
                onPress={() => {
                  setShowCustomDialog(null);
                  setCustomPercentage('');
                }}
              >
                <Text className="text-gray-700">Annuler</Text>
              </Button>
              <Button
                className="flex-1 bg-blue-500"
                onPress={handleCustomSubmit}
              >
                <Text className="text-white">Valider</Text>
              </Button>
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    );
  };

  return (
    <View className="flex-1 bg-white">
      {CustomPercentageModal()}

      {/* HEADER */}
      <View className="bg-white border-b border-gray-200 pl-4">
        <View className="flex-row items-center justify-between">
          <View className="flex-row items-center">
            <Pressable onPress={onBack} className="mr-3">
              <ChevronLeft size={24} color="#000" />
            </Pressable>
            <Text className="text-lg font-semibold">Paiement - {tableName}</Text>
          </View>
          {/* Bouton Clôturer la commande */}
          {onTerminate && (
            <Pressable
              onPress={onTerminate}
              style={{
                backgroundColor: '#2A2E33',
                height: 60,
                paddingHorizontal: 20,
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'center',
                ...Platform.select({
                  web: { cursor: 'pointer' as any },
                }),
              }}
            >
              <Text style={{
                fontSize: 14,
                color: '#FBFBFB',
                fontWeight: '600',
                textAlign: 'center',
                letterSpacing: 0.5,
              }}>
                CLÔTURER LA COMMANDE
              </Text>
            </Pressable>
          )}
        </View>
      </View>

      {/* CONTENU */}
      <View className="flex-1 flex-row">
        {/* PANNEAU GAUCHE: Articles */}
        <View className="w-[380px] border-r border-gray-200 bg-white">
          <View className="px-6 py-4 border-b border-gray-100">
            <View className="flex-row items-center justify-between mb-2">
              <Text className="font-semibold text-gray-900">Articles de la commande</Text>
              {availableItems.length > 0 && (
                <Pressable
                  onPress={handleSelectAll}
                  className="flex-row items-center gap-2"
                >
                  <View className={`w-5 h-5 border-2 rounded items-center justify-center ${
                    selectedItems.size === availableItems.length && availableItems.length > 0
                      ? 'bg-blue-500 border-blue-500'
                      : 'border-gray-300'
                  }`}>
                    {selectedItems.size === availableItems.length && availableItems.length > 0 && (
                      <Check size={14} color="white" strokeWidth={3} />
                    )}
                  </View>
                  <Text className="text-sm text-gray-700">Tout sélectionner</Text>
                </Pressable>
              )}
            </View>
            <Text className="text-sm text-gray-500">{order.lines?.length || 0} article(s)</Text>
          </View>

          <ScrollView className="flex-1 px-6">
            {order.lines?.map(line => renderOrderLine(line))}
          </ScrollView>

          {/* Résumé en bas */}
          <View className={`px-6 py-3 border-t border-gray-200 ${
            orderTotals.remainingAmount === 0 ? 'bg-green-50' : 'bg-gray-50'
          }`}>
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
                <Text className={`font-bold ${
                  orderTotals.remainingAmount === 0 ? 'text-green-600' : 'text-blue-600'
                }`}>
                  {formatPrice(orderTotals.remainingAmount)}
                </Text>
              </View>
            </View>
            {orderTotals.remainingAmount === 0 && (
              <View className="mt-2 pt-2 border-t border-gray-300">
                <View className="flex-row items-center justify-center gap-2">
                  <Check size={20} color="#10B981" strokeWidth={3} />
                  <Text className="text-green-600 font-semibold">
                    Commande entièrement payée
                  </Text>
                </View>
              </View>
            )}
          </View>
        </View>

        {/* PANNEAU DROIT: Configuration */}
        <View className="flex-1 bg-gray-50">
          {/* Zone scrollable pour les articles sélectionnés */}
          <ScrollView className="flex-1">
            <View className="px-6 py-4">
              {/* Articles sélectionnés avec fractions personnalisées */}
              {orderTotals.remainingAmount === 0 ? (
                <View className="flex-1 justify-center items-center py-12">
                  <View className="bg-green-100 rounded-full p-6 mb-4">
                    <Check size={48} color="#10B981" strokeWidth={3} />
                  </View>
                  <Text className="text-xl font-bold text-green-700 mb-2">
                    Paiement complet
                  </Text>
                  <Text className="text-gray-600 text-center px-8">
                    La commande a été entièrement payée.
                    Vous pouvez fermer cette vue ou consulter l'historique des paiements.
                  </Text>
                </View>
              ) : selectedItems.size > 0 ? (
                <View>
                  <Text className="font-semibold text-gray-900 mb-3">Articles sélectionnés</Text>

                  {/* Liste des articles sélectionnés avec contrôles de fraction */}
                  <View>
                    {Array.from(selectedItems).map(itemId => {
                      const line = availableItems.find(l => l.id === itemId);
                      return line ? renderSelectedItemCard(line) : null;
                    })}
                  </View>

                  {/* Récapitulatif du montant total */}
                  <View className="bg-blue-50 rounded-lg p-3 mt-3 border border-blue-200">
                    <View className="flex-row justify-between items-center">
                      <Text className="font-medium text-blue-900">Total à payer :</Text>
                      <Text className="font-bold text-xl text-blue-600">
                        {formatPrice(selectedAmount)}
                      </Text>
                    </View>
                  </View>
                </View>
              ) : (
                <View className="flex-1 justify-center items-center py-12">
                  <Text className="text-gray-500 text-center">
                    Sélectionnez des articles dans la liste de gauche
                  </Text>
                </View>
              )}
            </View>
          </ScrollView>

          {/* Section méthode de paiement sticky */}
          {orderTotals.remainingAmount > 0 && (
            <View className="bg-white border-t border-gray-200">
              <View className={`px-6 py-4 ${selectedItems.size === 0 ? 'opacity-50' : ''}`}>
                <Text className="font-semibold text-gray-900 mb-3">Méthode de paiement</Text>

              {/* Affichage unifié des méthodes de paiement */}
              <View className="flex-row flex-wrap gap-2">
                <Pressable
                  onPress={() => setPaymentMethod('cash')}
                  disabled={selectedItems.size === 0}
                  className={`flex-1 min-w-[48%] h-16 rounded-lg border-2 items-center justify-center ${
                    paymentMethod === 'cash'
                      ? 'bg-blue-50 border-blue-500'
                      : selectedItems.size === 0
                      ? 'bg-gray-100 border-gray-200'
                      : 'bg-white border-gray-300'
                  }`}
                >
                  <Banknote size={20} color={paymentMethod === 'cash' ? '#1D4ED8' : '#6B7280'} />
                  <Text className={`text-sm font-medium mt-1 ${
                    paymentMethod === 'cash' ? 'text-blue-700' : selectedItems.size === 0 ? 'text-gray-400' : 'text-gray-700'
                  }`}>
                    Espèces
                  </Text>
                </Pressable>

                <Pressable
                  onPress={() => setPaymentMethod('card')}
                  disabled={selectedItems.size === 0}
                  className={`flex-1 min-w-[48%] h-16 rounded-lg border-2 items-center justify-center ${
                    paymentMethod === 'card'
                      ? 'bg-blue-50 border-blue-500'
                      : selectedItems.size === 0
                      ? 'bg-gray-100 border-gray-200'
                      : 'bg-white border-gray-300'
                  }`}
                >
                  <CreditCard size={20} color={paymentMethod === 'card' ? '#1D4ED8' : '#6B7280'} />
                  <Text className={`text-sm font-medium mt-1 ${
                    paymentMethod === 'card' ? 'text-blue-700' : selectedItems.size === 0 ? 'text-gray-400' : 'text-gray-700'
                  }`}>
                    Carte
                  </Text>
                </Pressable>

                <Pressable
                  onPress={() => setPaymentMethod('ticket_resto')}
                  disabled={selectedItems.size === 0}
                  className={`flex-1 min-w-[48%] h-16 rounded-lg border-2 items-center justify-center ${
                    paymentMethod === 'ticket_resto'
                      ? 'bg-blue-50 border-blue-500'
                      : selectedItems.size === 0
                      ? 'bg-gray-100 border-gray-200'
                      : 'bg-white border-gray-300'
                  }`}
                >
                  <Ticket size={20} color={paymentMethod === 'ticket_resto' ? '#1D4ED8' : '#6B7280'} />
                  <Text className={`text-sm font-medium mt-1 ${
                    paymentMethod === 'ticket_resto' ? 'text-blue-700' : selectedItems.size === 0 ? 'text-gray-400' : 'text-gray-700'
                  }`}>
                    Ticket Resto
                  </Text>
                </Pressable>

                <Pressable
                  onPress={() => setPaymentMethod('check')}
                  disabled={selectedItems.size === 0}
                  className={`flex-1 min-w-[48%] h-16 rounded-lg border-2 items-center justify-center ${
                    paymentMethod === 'check'
                      ? 'bg-blue-50 border-blue-500'
                      : selectedItems.size === 0
                      ? 'bg-gray-100 border-gray-200'
                      : 'bg-white border-gray-300'
                  }`}
                >
                  <FileCheck size={20} color={paymentMethod === 'check' ? '#1D4ED8' : '#6B7280'} />
                  <Text className={`text-sm font-medium mt-1 ${
                    paymentMethod === 'check' ? 'text-blue-700' : selectedItems.size === 0 ? 'text-gray-400' : 'text-gray-700'
                  }`}>
                    Chèque
                  </Text>
                </Pressable>
              </View>
            </View>

            {/* BOUTON PAYER FIXE EN BAS */}
            <View className="px-6 py-3 border-t border-gray-100">
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
                      : `Payer ${formatPrice(selectedAmount)}`
                    }
                  </Text>
                </View>
              </Button>
            </View>
          </View>
          )}
        </View>
      </View>
    </View>
  );
}