import React, { useState, useMemo } from 'react';
import { View, ScrollView, Pressable } from 'react-native';
import { Button, Text } from '~/components/ui';
import { X, CheckSquare, Square, Plus, Minus, DivideIcon, Equal } from 'lucide-react-native';
import { Order } from '~/types/order.types';
import { OrderLine } from '~/types/order-line.types';

interface PaymentViewProps {
  order: Order;
  onClose: () => void;
  onPaymentComplete: (paymentData: PaymentData) => void;
}

interface PaymentData {
  orderId: string;
  selectedItems: string[];
  totalAmount: number;
  calculatorTotal: number;
}

export default function PaymentView({ order, onClose, onPaymentComplete }: PaymentViewProps) {
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
  const [paidItems, setPaidItems] = useState<Set<string>>(new Set());

  // État de la calculatrice
  const [display, setDisplay] = useState('0');
  const [previousValue, setPreviousValue] = useState<number | null>(null);
  const [operation, setOperation] = useState<string | null>(null);
  const [waitingForNext, setWaitingForNext] = useState(false);
  const [calculationHistory, setCalculationHistory] = useState<string[]>([]);

  // Grouper les OrderLines par type
  const groupedItems = useMemo(() => {
    const groups: { [key: string]: OrderLine[] } = {};

    (order.lines || []).forEach(line => {
      let typeName = 'Articles';
      if (line.type === 'MENU') {
        typeName = 'Menus';
      }
      if (!groups[typeName]) {
        groups[typeName] = [];
      }
      groups[typeName].push(line);
    });

    return Object.entries(groups).sort(([a], [b]) => a.localeCompare(b));
  }, [order.lines]);

  // Calculer le total des OrderLines sélectionnées
  const selectedTotal = useMemo(() => {
    return Array.from(selectedItems).reduce((total, lineId) => {
      const line = (order.lines || []).find(ol => ol.id === lineId);
      return total + (line?.totalPrice || 0);
    }, 0);
  }, [selectedItems, order.lines]);

  // Affichage des calculs ligne par ligne
  const calculationLines = useMemo(() => {
    if (selectedItems.size === 0) return [];

    const lines: { operator: string; value: string; price: number }[] = [];

    Array.from(selectedItems).forEach((lineId, index) => {
      const line = (order.lines || []).find(ol => ol.id === lineId);
      if (line) {
        const name = line.type === 'MENU' ? (line.menu?.name || 'Menu') : (line.item?.name || 'Article');
        lines.push({
          operator: index === 0 ? '' : '+',
          value: name,
          price: line.totalPrice
        });
      }
    });

    return lines;
  }, [selectedItems, order.lines]);

  const handleItemToggle = (itemId: string) => {
    if (paidItems.has(itemId)) return;

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

  // Vérifier si toutes les OrderLines disponibles sont sélectionnées
  const availableItems = useMemo(() => {
    return (order.lines || []).filter(line => !paidItems.has(line.id));
  }, [order.lines, paidItems]);

  const allAvailableSelected = useMemo(() => {
    return availableItems.length > 0 && availableItems.every(line => selectedItems.has(line.id));
  }, [availableItems, selectedItems]);

  const handleToggleSelectAll = () => {
    if (allAvailableSelected) {
      // Tout désélectionner
      setSelectedItems(new Set());
    } else {
      // Tout sélectionner
      const availableItemIds = availableItems.map(item => item.id);
      setSelectedItems(new Set(availableItemIds));
    }
  };

  // Fonctions de la calculatrice
  const inputNumber = (num: string) => {
    if (waitingForNext) {
      setDisplay(num);
      setWaitingForNext(false);
    } else {
      setDisplay(display === '0' ? num : display + num);
    }
  };

  const inputDecimal = () => {
    if (waitingForNext) {
      setDisplay('0.');
      setWaitingForNext(false);
    } else if (display.indexOf('.') === -1) {
      setDisplay(display + '.');
    }
  };

  const clear = () => {
    setDisplay('0');
    setPreviousValue(null);
    setOperation(null);
    setWaitingForNext(false);
    setCalculationHistory([]);
  };

  const performOperation = (nextOperation: string) => {
    const inputValue = parseFloat(display);

    if (previousValue === null) {
      setPreviousValue(inputValue);
    } else if (operation) {
      const currentValue = previousValue || 0;
      const newValue = calculate(currentValue, inputValue, operation);

      setDisplay(String(newValue));
      setPreviousValue(newValue);

      // Ajouter à l'historique
      setCalculationHistory(prev => [
        ...prev,
        `${currentValue} ${operation} ${inputValue} = ${newValue}`
      ]);
    }

    setWaitingForNext(true);
    setOperation(nextOperation);
  };

  const calculate = (firstValue: number, secondValue: number, operation: string) => {
    switch (operation) {
      case '+':
        return firstValue + secondValue;
      case '-':
        return firstValue - secondValue;
      case '×':
        return firstValue * secondValue;
      case '÷':
        return firstValue / secondValue;
      case '=':
        return secondValue;
      default:
        return secondValue;
    }
  };

  const addSelectedTotal = () => {
    if (selectedTotal > 0) {
      inputNumber(selectedTotal.toString());
    }
  };

  const handlePayment = () => {
    const calculatorTotal = parseFloat(display);

    if (calculatorTotal <= 0) return;

    const paymentData: PaymentData = {
      orderId: order.id,
      selectedItems: Array.from(selectedItems),
      totalAmount: selectedTotal,
      calculatorTotal
    };

    // Marquer les items comme payés
    setPaidItems(prev => new Set([...prev, ...selectedItems]));
    setSelectedItems(new Set());

    onPaymentComplete(paymentData);
  };

  const formatPrice = (price: number) => {
    return `${price.toFixed(2)}€`;
  };

  const renderItem = ({ item }: { item: OrderLine }) => {
    const isSelected = selectedItems.has(item.id);
    const isPaid = paidItems.has(item.id);
    const itemName = item.type === 'MENU' ? (item.menu?.name || 'Menu') : (item.item?.name || 'Article');
    const itemTypeLabel = item.type === 'MENU' ? 'Menu' : (item.item?.itemType?.name || 'Article');

    return (
      <Pressable
        onPress={() => handleItemToggle(item.id)}
        className={`flex-row items-center justify-between p-2 border-b border-gray-100 ${isPaid ? 'bg-gray-50 opacity-50' :
          isSelected ? 'bg-blue-50' : 'bg-white'
          }`}
        disabled={isPaid}
      >
        <View className="flex-row items-center flex-1">
          <View className="mr-2">
            {isPaid ? (
              <CheckSquare size={16} color="#10B981" />
            ) : isSelected ? (
              <CheckSquare size={16} color="#3B82F6" />
            ) : (
              <Square size={16} color="#6B7280" />
            )}
          </View>
          <View className="flex-1">
            <Text className={`text-sm font-medium ${isPaid ? 'text-gray-400' : 'text-gray-900'}`}>
              {itemName}
            </Text>
            <Text className={`text-sm ${isPaid ? 'text-gray-300' : 'text-gray-600'}`}>
              {itemTypeLabel}
            </Text>
          </View>
        </View>
        <Text className={`text-sm font-semibold ${isPaid ? 'text-gray-400' : 'text-gray-900'}`}>
          {formatPrice(item.totalPrice)}
        </Text>
      </Pressable>
    );
  };

  const CalculatorButton = ({
    onPress,
    className = '',
    children,
    variant = 'default'
  }: {
    onPress: () => void;
    className?: string;
    children: React.ReactNode;
    variant?: 'default' | 'operator' | 'equals' | 'clear';
  }) => {
    const baseClass = 'h-12 justify-center items-center rounded-lg border border-gray-300';
    const variantClass = {
      default: 'bg-white',
      operator: 'bg-blue-500',
      equals: 'bg-green-500',
      clear: 'bg-red-500'
    }[variant];

    return (
      <Pressable
        onPress={onPress}
        className={`${baseClass} ${variantClass} ${className}`}
      >
        {children}
      </Pressable>
    );
  };

  return (
    <View className="flex-1 bg-white flex-row">
      {/* Liste des items à gauche */}
      <View className="w-80 border-r border-gray-200">
        <View className="p-3 bg-gray-50 border-b border-gray-200 flex-row justify-between items-center">
          <Text className="font-semibold text-gray-900">Articles ({(order.lines || []).length - paidItems.size} restants)</Text>
          <Pressable onPress={onClose} className="p-1">
            <X size={20} color="#6B7280" />
          </Pressable>
        </View>

        <View className="p-3 border-b border-gray-200">
          <Button
            variant="outline"
            onPress={handleToggleSelectAll}
            className="w-full h-8"
          >
            <Text className="text-xs">
              {allAvailableSelected ? "Tout désélectionner" : "Tout sélectionner"}
            </Text>
          </Button>
        </View>

        <ScrollView className="flex-1">
          {groupedItems.map(([typeName, items]) => (
            <View key={typeName}>
              <View className="px-3 py-1 bg-gray-100">
                <Text className="text-sm font-semibold text-gray-700 uppercase">
                  {typeName} ({items.length})
                </Text>
              </View>
              {items.map(item => renderItem({ item }))}
            </View>
          ))}
        </ScrollView>
      </View>

      {/* Calculatrice à droite */}
      <View className="flex-1 bg-gray-50 p-4">
        {/* Écran de la calculatrice avec affichage des opérations - Height fixe */}
        <View className="bg-white border-2 border-gray-300 p-4 rounded-lg mb-4 h-64">
          {/* Zone d'affichage des opérations sélectionnées - Scrollable */}
          <ScrollView className="flex-1 mb-4" showsVerticalScrollIndicator={false}>
            {calculationLines.length > 0 ? (
              <>
                {calculationLines.map((line, index) => (
                  <View key={index} className="flex-row items-center mb-1">
                    <Text className="w-6 text-sm text-blue-600 font-mono">
                      {line.operator}
                    </Text>
                    <Text className="flex-1 text-sm text-gray-900 ml-2">
                      {line.value}
                    </Text>
                    <Text className="text-sm text-gray-900 font-mono">
                      {line.price.toFixed(2)}
                    </Text>
                  </View>
                ))}
                <View className="border-t border-gray-300 mt-2 pt-2">
                  <View className="flex-row items-center">
                    <Text className="w-6 text-sm text-blue-600 font-mono">=</Text>
                    <Text className="flex-1 text-sm text-blue-600 ml-2 font-semibold">
                      Sélection
                    </Text>
                    <Text className="text-lg text-blue-600 font-mono font-bold">
                      {selectedTotal.toFixed(2)}
                    </Text>
                  </View>
                </View>

                {/* Affichage des calculs de la calculatrice */}
                {calculationHistory.length > 0 && (
                  <View className="border-t border-gray-300 mt-2 pt-2">
                    {calculationHistory.slice(-2).map((calc, index) => (
                      <Text key={index} className="text-xs text-gray-600 font-mono">
                        {calc}
                      </Text>
                    ))}
                  </View>
                )}
              </>
            ) : (
              <Text className="text-gray-500 text-center italic text-sm">
                Sélectionnez des articles ou utilisez la calculatrice
              </Text>
            )}
          </ScrollView>

          {/* Ligne d'affichage principal */}
          <View className="border-t border-gray-300 pt-2">
            <Text className="text-gray-900 text-right text-3xl font-mono font-bold">
              {display}
            </Text>
          </View>
        </View>

        {/* Boutons actions rapides */}
        <View className="flex-row gap-2 mb-4">
          <Button
            onPress={addSelectedTotal}
            disabled={selectedTotal === 0}
            variant="outline"
            className="flex-1 h-10"
          >
            <Text className="text-xs">Ajouter sélection ({formatPrice(selectedTotal)})</Text>
          </Button>
          <Button
            onPress={clear}
            variant="outline"
            className="w-16 h-10"
          >
            <Text className="text-xs">Clear</Text>
          </Button>
        </View>

        {/* Boutons de la calculatrice */}
        <View className="gap-2">
          {/* Première ligne */}
          <View className="flex-row gap-2">
            <CalculatorButton onPress={() => performOperation('÷')} variant="operator" className="flex-1">
              <DivideIcon size={20} color="white" />
            </CalculatorButton>
            <CalculatorButton onPress={() => performOperation('×')} variant="operator" className="flex-1">
              <Text className="text-white font-semibold text-lg">×</Text>
            </CalculatorButton>
            <CalculatorButton onPress={() => performOperation('-')} variant="operator" className="flex-1">
              <Minus size={20} color="white" />
            </CalculatorButton>
            <CalculatorButton onPress={() => performOperation('+')} variant="operator" className="flex-1">
              <Plus size={20} color="white" />
            </CalculatorButton>
          </View>

          {/* Deuxième ligne */}
          <View className="flex-row gap-2">
            <CalculatorButton onPress={() => inputNumber('7')} className="flex-1">
              <Text className="text-lg font-semibold">7</Text>
            </CalculatorButton>
            <CalculatorButton onPress={() => inputNumber('8')} className="flex-1">
              <Text className="text-lg font-semibold">8</Text>
            </CalculatorButton>
            <CalculatorButton onPress={() => inputNumber('9')} className="flex-1">
              <Text className="text-lg font-semibold">9</Text>
            </CalculatorButton>
            <CalculatorButton onPress={() => performOperation('=')} variant="equals" className="flex-1">
              <Equal size={20} color="white" />
            </CalculatorButton>
          </View>

          {/* Troisième ligne */}
          <View className="flex-row gap-2">
            <CalculatorButton onPress={() => inputNumber('4')} className="flex-1">
              <Text className="text-lg font-semibold">4</Text>
            </CalculatorButton>
            <CalculatorButton onPress={() => inputNumber('5')} className="flex-1">
              <Text className="text-lg font-semibold">5</Text>
            </CalculatorButton>
            <CalculatorButton onPress={() => inputNumber('6')} className="flex-1">
              <Text className="text-lg font-semibold">6</Text>
            </CalculatorButton>
            <CalculatorButton onPress={() => inputNumber('0')} className="flex-1">
              <Text className="text-lg font-semibold">0</Text>
            </CalculatorButton>
          </View>

          {/* Quatrième ligne */}
          <View className="flex-row gap-2">
            <CalculatorButton onPress={() => inputNumber('1')} className="flex-1">
              <Text className="text-lg font-semibold">1</Text>
            </CalculatorButton>
            <CalculatorButton onPress={() => inputNumber('2')} className="flex-1">
              <Text className="text-lg font-semibold">2</Text>
            </CalculatorButton>
            <CalculatorButton onPress={() => inputNumber('3')} className="flex-1">
              <Text className="text-lg font-semibold">3</Text>
            </CalculatorButton>
            <CalculatorButton onPress={inputDecimal} className="flex-1">
              <Text className="text-lg font-semibold">.</Text>
            </CalculatorButton>
          </View>
        </View>

        {/* Bouton de paiement */}
        <Button
          onPress={handlePayment}
          disabled={parseFloat(display) <= 0}
          className={`w-full h-12 mt-4 ${parseFloat(display) <= 0
            ? 'bg-gray-300'
            : 'bg-green-600'
            }`}
        >
          <Text className="text-white font-medium">
            Encaisser {formatPrice(parseFloat(display) || 0)}
          </Text>
        </Button>
      </View>
    </View>
  );
}