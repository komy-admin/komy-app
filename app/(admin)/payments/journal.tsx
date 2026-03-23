import { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View,
  FlatList,
  RefreshControl,
  ActivityIndicator,
  Pressable,
  Alert,
} from 'react-native';
import { Text } from '~/components/ui';
import {
  CreditCard,
  Banknote,
  Ticket,
  FileCheck,
  Printer,
  RotateCcw,
  User,
  MapPin,
  ReceiptEuro,
  Euro,
  List,
  Layers,
  ChevronRight,
  ChevronDown,
  Calendar,
} from 'lucide-react-native';
import { formatPrice } from '~/lib/utils';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { paymentApi } from '~/api/payment.api';
import RefundModal from '~/components/Payment/RefundModal';
import type { Payment } from '~/types/payment.types';
import { extractApiError } from '~/lib/apiErrorHandler';

// Types pour le journal
interface Allocation {
  id: string;
  amount: number;
  quantityFraction: number;
  percentage: number;
  itemName: string;
  itemType: 'ITEM' | 'MENU';
  unitPrice: number;
  totalPrice: number;
}

interface JournalEntry {
  id: string;
  createdAt: string;
  amount: number;
  tipAmount?: number;
  paymentMethod: 'cash' | 'card' | 'ticket_resto' | 'check';
  status: 'pending' | 'completed' | 'failed' | 'refunded';
  transactionReference?: string;
  order: {
    id: string;
    totalAmount: number;
    table?: {
      name: string;
      room?: {
        name: string;
      };
    };
  };
  user?: {
    firstName: string;
    lastName: string;
  };
  allocations: Allocation[];
  isPartialPayment: boolean;
  remainingOnOrder: number;
}

interface PeriodSummary {
  totalAmount: number;
  byMethod: {
    cash: number;
    card: number;
    ticket_resto: number;
    check: number;
  };
  transactionsCount: number;
  averageAmount: number;
}

// Type pour les commandes groupées
interface GroupedOrder {
  orderId: string;
  table?: {
    name: string;
    room?: {
      name: string;
    };
  };
  totalAmount: number;
  paidAmount: number;
  remainingAmount: number;
  payments: JournalEntry[];
  firstPaymentDate: string;
  lastPaymentDate: string;
  paymentMethods: string[];
  server?: {
    firstName: string;
    lastName: string;
  };
}

/**
 * PaymentScreen
 *
 * Vue unifiée des paiements avec deux modes d'affichage :
 * - Chronologique : Liste plate des paiements par ordre de création
 * - Par commande : Paiements regroupés par commande avec vue expandable
 *
 * Fonctionnalités :
 * - Toggle entre vue chronologique et vue par commande
 * - Filtres par période, méthode de paiement
 * - Actions rapides (réimprimer ticket, rembourser)
 * - Résumé en temps réel des encaissements
 * - Pagination infinie avec curseur
 * - Vue détaillée des paiements multiples sur une commande
 */
export default function PaymentJournalScreen() {
  // État local
  const [journalEntries, setJournalEntries] = useState<JournalEntry[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [cursor, setCursor] = useState<string | null>(null);
  const [periodSummary, setPeriodSummary] = useState<PeriodSummary | null>(null);

  // Mode d'affichage
  const [viewMode, setViewMode] = useState<'chronological' | 'byOrder'>('chronological');
  const [expandedOrders, setExpandedOrders] = useState<Set<string>>(new Set());

  // Filtres
  const [selectedPeriod, setSelectedPeriod] = useState<'today' | 'yesterday' | 'week' | 'month' | 'all'>('today');
  const [selectedMethod, setSelectedMethod] = useState<string | null>(null);
  const [selectedStatus] = useState<string>('completed');

  // État pour le modal de remboursement
  const [isRefundModalOpen, setIsRefundModalOpen] = useState(false);
  const [selectedPaymentForRefund, setSelectedPaymentForRefund] = useState<JournalEntry | null>(null);

  /**
   * Grouper les paiements par commande
   */
  const groupedOrders = useMemo((): GroupedOrder[] => {
    if (viewMode === 'chronological') return [];

    const orderMap = new Map<string, GroupedOrder>();

    journalEntries.forEach(payment => {
      const orderId = payment.order.id;

      if (!orderMap.has(orderId)) {
        orderMap.set(orderId, {
          orderId,
          table: payment.order.table,
          totalAmount: payment.order.totalAmount,
          paidAmount: 0,
          remainingAmount: 0,
          payments: [],
          firstPaymentDate: payment.createdAt,
          lastPaymentDate: payment.createdAt,
          paymentMethods: [],
          server: payment.user,
        });
      }

      const group = orderMap.get(orderId)!;
      group.payments.push(payment);
      group.paidAmount += payment.amount;
      group.remainingAmount = payment.remainingOnOrder;

      // Mettre à jour les dates
      if (payment.createdAt < group.firstPaymentDate) {
        group.firstPaymentDate = payment.createdAt;
      }
      if (payment.createdAt > group.lastPaymentDate) {
        group.lastPaymentDate = payment.createdAt;
      }

      // Ajouter la méthode de paiement si pas déjà présente
      if (!group.paymentMethods.includes(payment.paymentMethod)) {
        group.paymentMethods.push(payment.paymentMethod);
      }

      // Garder le serveur du dernier paiement
      if (payment.user) {
        group.server = payment.user;
      }
    });

    // Convertir en array et trier par date du dernier paiement
    return Array.from(orderMap.values()).sort((a, b) =>
      b.lastPaymentDate.localeCompare(a.lastPaymentDate)
    );
  }, [journalEntries, viewMode]);

  /**
   * Toggle l'expansion d'une commande
   */
  const toggleOrderExpansion = useCallback((orderId: string) => {
    setExpandedOrders(prev => {
      const newSet = new Set(prev);
      if (newSet.has(orderId)) {
        newSet.delete(orderId);
      } else {
        newSet.add(orderId);
      }
      return newSet;
    });
  }, []);

  /**
   * Charger les entrées du journal
   */
  const loadJournalEntries = useCallback(async (isRefresh = false) => {
    if (isLoading && !isRefresh) return;

    try {
      setIsLoading(true);

      // Calculer les dates selon la période
      let startDate = '';
      let endDate = '';
      const now = new Date();

      switch (selectedPeriod) {
        case 'today':
          startDate = format(now, 'yyyy-MM-dd');
          endDate = format(now, 'yyyy-MM-dd');
          break;
        case 'yesterday':
          const yesterday = new Date(now);
          yesterday.setDate(yesterday.getDate() - 1);
          startDate = format(yesterday, 'yyyy-MM-dd');
          endDate = format(yesterday, 'yyyy-MM-dd');
          break;
        case 'week':
          const weekAgo = new Date(now);
          weekAgo.setDate(weekAgo.getDate() - 7);
          startDate = format(weekAgo, 'yyyy-MM-dd');
          endDate = format(now, 'yyyy-MM-dd');
          break;
        case 'month':
          const monthAgo = new Date(now);
          monthAgo.setMonth(monthAgo.getMonth() - 1);
          startDate = format(monthAgo, 'yyyy-MM-dd');
          endDate = format(now, 'yyyy-MM-dd');
          break;
      }

      // Construire les params
      const params: any = {
        status: selectedStatus,
        limit: 50,
      };

      if (startDate) params.startDate = startDate;
      if (endDate) params.endDate = endDate;
      if (selectedMethod) params.paymentMethod = selectedMethod;
      if (!isRefresh && cursor) params.cursor = cursor;

      // Appel API
      const response = await paymentApi.getJournal(params);
      const { data, meta } = response;

      if (isRefresh) {
        setJournalEntries(data);
      } else {
        setJournalEntries(prev => [...prev, ...data]);
      }

      setCursor(meta.cursor);
      setHasMore(meta.hasMore);
      setPeriodSummary(meta.periodSummary);
    } catch (error) {
      console.error('Erreur chargement journal:', error);
      Alert.alert('Erreur', 'Impossible de charger le journal des encaissements');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [selectedPeriod, selectedMethod, selectedStatus, cursor]);

  /**
   * Charger au montage et quand les filtres changent
   */
  useEffect(() => {
    setCursor(null);
    setJournalEntries([]);
    loadJournalEntries(true);
  }, [selectedPeriod, selectedMethod, selectedStatus]);

  /**
   * Rafraîchir la liste
   */
  const handleRefresh = useCallback(() => {
    setIsRefreshing(true);
    setCursor(null);
    loadJournalEntries(true);
  }, [loadJournalEntries]);

  /**
   * Charger plus d'entrées
   */
  const handleLoadMore = useCallback(() => {
    if (!isLoading && hasMore) {
      loadJournalEntries(false);
    }
  }, [isLoading, hasMore, loadJournalEntries]);

  /**
   * Action réimprimer
   */
  const handlePrintTicket = useCallback(async (paymentId: string) => {
    try {
      await paymentApi.printTicket(paymentId);
      Alert.alert('Succès', 'Ticket imprimé avec succès');
    } catch (error) {
      Alert.alert('Erreur', 'Impossible d\'imprimer le ticket');
    }
  }, []);

  /**
   * Action rembourser - ouvre le modal
   */
  const handleRefund = useCallback((payment: JournalEntry) => {
    setSelectedPaymentForRefund(payment);
    setIsRefundModalOpen(true);
  }, []);

  /**
   * Traiter le remboursement depuis le modal
   */
  const handleProcessRefund = useCallback(async (amount: number, reason: string, method: 'original' | 'cash') => {
    if (!selectedPaymentForRefund) return;

    try {
      await paymentApi.refundPayment(selectedPaymentForRefund.id, {
        amount,
        reason,
        refundMethod: method,
      });

      Alert.alert('Succès', `Remboursement de ${formatPrice(amount)} effectué avec succès`);

      // Fermer le modal et rafraîchir la liste
      setIsRefundModalOpen(false);
      setSelectedPaymentForRefund(null);
      handleRefresh();
    } catch (error) {
      const info = extractApiError(error);
      throw new Error(info.message || 'Erreur lors du remboursement');
    }
  }, [selectedPaymentForRefund, handleRefresh]);

  /**
   * Obtenir l'icône de la méthode de paiement
   */
  const getPaymentMethodIcon = (method: string) => {
    switch (method) {
      case 'cash':
        return <Banknote size={20} color="#10B981" />;
      case 'card':
        return <CreditCard size={20} color="#3B82F6" />;
      case 'ticket_resto':
        return <Ticket size={20} color="#F59E0B" />;
      case 'check':
        return <FileCheck size={20} color="#8B5CF6" />;
      default:
        return <Euro size={20} color="#6B7280" />;
    }
  };

  /**
   * Render d'une commande groupée
   */
  const renderGroupedOrder = ({ item }: { item: GroupedOrder }) => {
    const isExpanded = expandedOrders.has(item.orderId);

    return (
      <View className="px-4 py-2">
        <View className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          {/* Carte principale de la commande */}
          <Pressable
            className="p-4 active:bg-gray-50"
            onPress={() => toggleOrderExpansion(item.orderId)}
          >
            <View className="flex-row items-center">
              {/* Chevron centré verticalement */}
              <View className="mr-2">
                {isExpanded ? (
                  <ChevronDown
                    size={16}
                    color="#6B7280"
                  />
                ) : (
                  <ChevronRight
                    size={16}
                    color="#6B7280"
                  />
                )}
              </View>

              {/* Partie gauche : infos principales */}
              <View className="flex-1">
                {/* Header : Table/Room + Heure */}
                <View className="flex-row items-center gap-3 mb-1">
                  <View className="flex-row items-center gap-1">
                    <MapPin size={16} color="#6B7280" />
                    <Text className="text-sm font-semibold text-gray-900">
                      {item.table?.name || 'Sans table'}
                      {item.table?.room && ` • ${item.table.room.name}`}
                    </Text>
                  </View>

                  <Text className="text-sm text-gray-600">
                    {format(new Date(item.lastPaymentDate), 'HH:mm', { locale: fr })}
                  </Text>
                </View>

                {/* Ligne 2 : Commande + Serveur + Nombre de paiements */}
                <View className="flex-row items-center gap-3 mb-1">
                  <Text className="text-xs text-gray-500">
                    #{item.orderId.substring(0, 8).toUpperCase()}
                  </Text>

                  {item.server && (
                    <View className="flex-row items-center gap-1">
                      <User size={12} color="#9CA3AF" />
                      <Text className="text-xs text-gray-500">
                        {item.server.firstName}
                      </Text>
                    </View>
                  )}

                  <Text className="text-xs text-gray-500">
                    {item.payments.length} paiement{item.payments.length > 1 ? 's' : ''}
                  </Text>

                  {item.remainingAmount > 0 && (
                    <View className="px-2 py-0.5 bg-orange-100 rounded">
                      <Text className="text-xs font-medium text-orange-700">
                        Incomplet
                      </Text>
                    </View>
                  )}
                </View>
              </View>

              {/* Partie droite : montants sans chevron */}
              <View className="items-end ml-3">
                {/* Montants avec icônes */}
                <View className="flex-row items-center gap-1 mb-1">
                  {item.paymentMethods.map((method) => (
                    <View key={method}>
                      {getPaymentMethodIcon(method)}
                    </View>
                  ))}
                  <Text className="text-lg font-bold text-gray-900 ml-1">
                    {formatPrice(item.paidAmount)}
                  </Text>
                </View>

                {/* Info complémentaire */}
                {item.remainingAmount > 0 && (
                  <Text className="text-xs text-gray-500">
                    sur {formatPrice(item.totalAmount)}
                  </Text>
                )}
                {item.remainingAmount > 0 && (
                  <Text className="text-xs font-medium text-red-600">
                    Reste {formatPrice(item.remainingAmount)}
                  </Text>
                )}
              </View>
            </View>
          </Pressable>

          {/* Liste des paiements si expanded - dans la même carte */}
          {isExpanded && (
            <View className="bg-gray-50 border-t border-gray-200">
              {item.payments.map((payment, index) => {
                const paymentDate = new Date(payment.createdAt);
                const isNegative = payment.amount < 0;

                return (
                  <View
                    key={payment.id}
                    className={index < item.payments.length - 1 ? 'border-b border-gray-200' : ''}
                  >
                    {/* Paiement individuel - pas de carte, directement le contenu */}
                    <View className="px-4 py-3 bg-white">
                      <View className="flex-row justify-between items-start">
                        {/* Partie gauche : détails du paiement */}
                        <View className="flex-1">
                          {/* Ligne 1 : Heure + Serveur */}
                          <View className="flex-row items-center gap-3 mb-1">
                            <Text className="text-sm text-gray-600">
                              {format(paymentDate, 'HH:mm', { locale: fr })}
                            </Text>

                            {payment.user && (
                              <View className="flex-row items-center gap-1">
                                <User size={12} color="#9CA3AF" />
                                <Text className="text-xs text-gray-500">
                                  {payment.user.firstName}
                                </Text>
                              </View>
                            )}

                            {payment.status === 'refunded' && (
                              <View className="px-2 py-0.5 bg-purple-100 rounded">
                                <Text className="text-xs font-medium text-purple-700">
                                  Remboursé
                                </Text>
                              </View>
                            )}
                          </View>

                          {/* Ligne 2 : Items/Allocations */}
                          {payment.allocations && payment.allocations.length > 0 && (
                            <Text className="text-xs text-gray-600" numberOfLines={1}>
                              {payment.allocations.map((alloc) => {
                                return alloc.percentage < 100
                                  ? `${alloc.itemName} (${alloc.percentage}%)`
                                  : alloc.itemName;
                              }).join(', ')}
                            </Text>
                          )}
                        </View>

                        {/* Partie droite : montant + actions sur une ligne */}
                        <View className="flex-row items-center gap-2 ml-3">
                          {/* Icône méthode */}
                          {getPaymentMethodIcon(payment.paymentMethod)}

                          {/* Montant */}
                          <Text className={`text-base font-bold ${
                            isNegative ? 'text-red-600' : 'text-gray-900'
                          }`}>
                            {isNegative && '-'}{formatPrice(Math.abs(payment.amount))}
                          </Text>

                          {/* Actions */}
                          <View className="flex-row gap-1 ml-2">
                            <Pressable
                              onPress={() => handlePrintTicket(payment.id)}
                              className="p-1.5 bg-gray-50 rounded-lg border border-gray-200 active:bg-gray-100"
                            >
                              <Printer size={14} color="#6B7280" />
                            </Pressable>

                            {payment.status === 'completed' && !isNegative && (
                              <Pressable
                                onPress={() => handleRefund(payment)}
                                className="p-1.5 bg-gray-50 rounded-lg border border-gray-200 active:bg-gray-100"
                              >
                                <RotateCcw size={14} color="#6B7280" />
                              </Pressable>
                            )}
                          </View>
                        </View>
                      </View>
                    </View>
                  </View>
                );
              })}
            </View>
          )}
        </View>
      </View>
    );
  };

  /**
   * Render d'une entrée du journal
   */
  const renderJournalEntry = ({ item }: { item: JournalEntry }) => {
    const date = new Date(item.createdAt);
    const isNegative = item.amount < 0;

    return (
      <View className="px-4 py-2">
        <View className="bg-white rounded-xl shadow overflow-hidden">
          <Pressable
            className="p-4 active:bg-gray-50"
            onPress={() => {
              // Navigation vers détail si besoin
            }}
          >
            <View className="flex-row justify-between items-start">
              {/* Partie gauche : infos principales */}
              <View className="flex-1">
                {/* Header : Table/Room + Heure */}
                <View className="flex-row items-center gap-3 mb-1">
                  <View className="flex-row items-center gap-1">
                    <MapPin size={16} color="#6B7280" />
                    <Text className="text-sm font-semibold text-gray-900">
                      {item.order.table?.name || 'Sans table'}
                      {item.order.table?.room && ` • ${item.order.table.room.name}`}
                    </Text>
                  </View>

                  <Text className="text-sm text-gray-600">
                    {format(date, 'HH:mm', { locale: fr })}
                  </Text>
                </View>

                {/* Ligne 2 : Commande + Serveur */}
                <View className="flex-row items-center gap-3 mb-1">
                  <Text className="text-xs text-gray-500">
                    #{item.order.id.substring(0, 8).toUpperCase()}
                  </Text>

                  {item.user && (
                    <View className="flex-row items-center gap-1">
                      <User size={12} color="#9CA3AF" />
                      <Text className="text-xs text-gray-500">
                        {item.user.firstName}
                      </Text>
                    </View>
                  )}

                  {item.isPartialPayment && (
                    <View className="px-2 py-0.5 bg-orange-100 rounded">
                      <Text className="text-xs font-medium text-orange-700">
                        Partiel
                      </Text>
                    </View>
                  )}

                  {item.status === 'refunded' && (
                    <View className="px-2 py-0.5 bg-purple-100 rounded">
                      <Text className="text-xs font-medium text-purple-700">
                        Remboursé
                      </Text>
                    </View>
                  )}
                </View>

                {/* Ligne 3 : Items/Allocations */}
                {item.allocations && item.allocations.length > 0 && (
                  <Text className="text-xs text-gray-600" numberOfLines={1}>
                    {item.allocations.map((alloc) => {
                      return alloc.percentage < 100
                        ? `${alloc.itemName} (${alloc.percentage}%)`
                        : alloc.itemName;
                    }).join(', ')}
                  </Text>
                )}
              </View>

              {/* Partie droite : montant + méthode + actions */}
              <View className="items-end ml-3">
                {/* Montant principal */}
                <View className="flex-row items-center gap-2 mb-1">
                  {getPaymentMethodIcon(item.paymentMethod)}
                  <Text className={`text-lg font-bold ${
                    isNegative ? 'text-red-600' : 'text-gray-900'
                  }`}>
                    {isNegative && '-'}{formatPrice(Math.abs(item.amount))}
                  </Text>
                </View>

                {/* Actions */}
                <View className="flex-row gap-2">
                  <Pressable
                    onPress={() => handlePrintTicket(item.id)}
                    className="p-2 bg-gray-50 rounded-lg border border-gray-200 active:bg-gray-100"
                  >
                    <Printer size={16} color="#6B7280" />
                  </Pressable>

                  {item.status === 'completed' && !isNegative && (
                    <Pressable
                      onPress={() => handleRefund(item)}
                      className="p-2 bg-gray-50 rounded-lg border border-gray-200 active:bg-gray-100"
                    >
                      <RotateCcw size={16} color="#6B7280" />
                    </Pressable>
                  )}
                </View>
              </View>
            </View>
          </Pressable>
        </View>
      </View>
    );
  };

  /**
   * Header avec filtres et résumé
   */
  const renderHeader = () => (
    <View className="bg-white shadow">
      {/* Ligne 1: Résumé compact + Toggle de vue */}
      <View className="px-4 py-3 flex-row items-center justify-between border-b border-gray-200">
        {/* Résumé à gauche */}
        <View className="flex-1">
          <View className="flex-row items-center gap-3">
            <View>
              <Text className="text-xs text-gray-500 uppercase tracking-wide">
                {selectedPeriod === 'today' ? "Aujourd'hui" :
                 selectedPeriod === 'yesterday' ? 'Hier' :
                 selectedPeriod === 'week' ? 'Cette semaine' :
                 selectedPeriod === 'month' ? 'Ce mois' : 'Total'}
              </Text>
              <Text className="text-xl font-bold text-gray-900">
                {periodSummary ? formatPrice(periodSummary.totalAmount) : '0,00€'}
              </Text>
            </View>

            {/* Mini stats */}
            {periodSummary && (
              <View className="flex-row gap-4">
                {periodSummary.byMethod.cash > 0 && (
                  <View className="flex-row items-center gap-1">
                    <Banknote size={14} color="#10B981" />
                    <Text className="text-xs font-medium text-gray-600">
                      {formatPrice(periodSummary.byMethod.cash)}
                    </Text>
                  </View>
                )}
                {periodSummary.byMethod.card > 0 && (
                  <View className="flex-row items-center gap-1">
                    <CreditCard size={14} color="#3B82F6" />
                    <Text className="text-xs font-medium text-gray-600">
                      {formatPrice(periodSummary.byMethod.card)}
                    </Text>
                  </View>
                )}
                {periodSummary.byMethod.ticket_resto > 0 && (
                  <View className="flex-row items-center gap-1">
                    <Ticket size={14} color="#F59E0B" />
                    <Text className="text-xs font-medium text-gray-600">
                      {formatPrice(periodSummary.byMethod.ticket_resto)}
                    </Text>
                  </View>
                )}
                {periodSummary.byMethod.check > 0 && (
                  <View className="flex-row items-center gap-1">
                    <FileCheck size={14} color="#8B5CF6" />
                    <Text className="text-xs font-medium text-gray-600">
                      {formatPrice(periodSummary.byMethod.check)}
                    </Text>
                  </View>
                )}
              </View>
            )}
          </View>
        </View>

        {/* Toggle de vue à droite */}
        <View className="flex-row bg-gray-100 rounded-xl p-1">
          <Pressable
            onPress={() => setViewMode('chronological')}
            className={`px-3 py-2 rounded-xl ${
              viewMode === 'chronological' ? 'bg-white shadow-sm' : ''
            }`}
          >
            <List size={20} color={viewMode === 'chronological' ? '#3B82F6' : '#6B7280'} />
          </Pressable>
          <Pressable
            onPress={() => setViewMode('byOrder')}
            className={`px-3 py-2 rounded-xl ${
              viewMode === 'byOrder' ? 'bg-white shadow-sm' : ''
            }`}
          >
            <Layers size={20} color={viewMode === 'byOrder' ? '#3B82F6' : '#6B7280'} />
          </Pressable>
        </View>
      </View>

      {/* Ligne 2: Filtres avec boutons plus grands */}
      <View className="px-4 py-3 flex-row items-center justify-between">
        {/* Filtres période */}
        <View className="flex-row items-center gap-2">
          <Calendar size={16} color="#6B7280" />
          {(['today', 'yesterday', 'week', 'month', 'all'] as const).map((period) => (
            <Pressable
              key={period}
              onPress={() => setSelectedPeriod(period)}
              className={`px-3 py-1.5 rounded-full ${
                selectedPeriod === period
                  ? 'bg-blue-500 shadow-sm'
                  : 'bg-gray-100'
              }`}
            >
              <Text
                className={`text-sm font-semibold ${
                  selectedPeriod === period ? 'text-white' : 'text-gray-600'
                }`}
              >
                {period === 'today' && "Auj."}
                {period === 'yesterday' && 'Hier'}
                {period === 'week' && '7j'}
                {period === 'month' && '30j'}
                {period === 'all' && 'Tout'}
              </Text>
            </Pressable>
          ))}
        </View>

        {/* Filtres méthode */}
        <View className="flex-row items-center gap-2">
          <Euro size={16} color="#6B7280" />
          <Pressable
            onPress={() => setSelectedMethod(null)}
            className={`px-3 py-1.5 rounded-full ${
              !selectedMethod ? 'bg-blue-500 shadow-sm' : 'bg-gray-100'
            }`}
          >
            <Text
              className={`text-sm font-semibold ${
                !selectedMethod ? 'text-white' : 'text-gray-600'
              }`}
            >
              Tous
            </Text>
          </Pressable>

          {(['cash', 'card', 'ticket_resto', 'check'] as const).map((method) => (
            <Pressable
              key={method}
              onPress={() => setSelectedMethod(method)}
              className={`p-2 rounded-full ${
                selectedMethod === method ? 'bg-blue-500 shadow-sm' : 'bg-gray-100'
              }`}
            >
              {method === 'cash' && <Banknote size={18} color={selectedMethod === method ? '#FFFFFF' : '#6B7280'} />}
              {method === 'card' && <CreditCard size={18} color={selectedMethod === method ? '#FFFFFF' : '#6B7280'} />}
              {method === 'ticket_resto' && <Ticket size={18} color={selectedMethod === method ? '#FFFFFF' : '#6B7280'} />}
              {method === 'check' && <FileCheck size={18} color={selectedMethod === method ? '#FFFFFF' : '#6B7280'} />}
            </Pressable>
          ))}
        </View>
      </View>
    </View>
  );

  /**
   * Footer avec loader
   */
  const renderFooter = () => {
    if (!isLoading) return null;

    return (
      <View className="py-4 items-center">
        <ActivityIndicator size="small" color="#3B82F6" />
      </View>
    );
  };

  /**
   * État vide
   */
  const renderEmpty = () => {
    if (isLoading) return null;

    return (
      <View className="flex-1 items-center justify-center p-8">
        <ReceiptEuro size={48} color="#D1D5DB" />
        <Text className="text-gray-500 text-center mt-4">
          Aucun encaissement trouvé pour cette période
        </Text>
      </View>
    );
  };

  // Render conditionnel basé sur le mode de vue
  if (viewMode === 'byOrder') {
    return (
      <View className="flex-1 bg-gray-50">
        <FlatList
          data={groupedOrders}
          keyExtractor={(item) => item.orderId}
          renderItem={renderGroupedOrder}
          ListHeaderComponent={renderHeader}
          ListFooterComponent={renderFooter}
          ListEmptyComponent={renderEmpty}
          stickyHeaderIndices={[0]}
          refreshControl={
            <RefreshControl
              refreshing={isRefreshing}
              onRefresh={handleRefresh}
              colors={['#3B82F6']}
            />
          }
          onEndReached={handleLoadMore}
          onEndReachedThreshold={0.5}
          contentContainerStyle={{ flexGrow: 1 }}
        />

        {/* Modal de remboursement */}
        {selectedPaymentForRefund && (
          <RefundModal
            isOpen={isRefundModalOpen}
            onClose={() => {
              setIsRefundModalOpen(false);
              setSelectedPaymentForRefund(null);
            }}
            payment={selectedPaymentForRefund as unknown as Payment}
            onRefund={handleProcessRefund}
          />
        )}
      </View>
    );
  }

  return (
    <View className="flex-1 bg-gray-50">
      <FlatList
        data={journalEntries}
        keyExtractor={(item) => item.id}
        renderItem={renderJournalEntry}
        ListHeaderComponent={renderHeader}
        ListFooterComponent={renderFooter}
        ListEmptyComponent={renderEmpty}
        stickyHeaderIndices={[0]}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={handleRefresh}
            colors={['#3B82F6']}
          />
        }
        onEndReached={handleLoadMore}
        onEndReachedThreshold={0.5}
        contentContainerStyle={{ flexGrow: 1 }}
      />

      {/* Modal de remboursement */}
      {selectedPaymentForRefund && (
        <RefundModal
          isOpen={isRefundModalOpen}
          onClose={() => {
            setIsRefundModalOpen(false);
            setSelectedPaymentForRefund(null);
          }}
          payment={selectedPaymentForRefund as unknown as Payment}
          onRefund={handleProcessRefund}
        />
      )}
    </View>
  );
}