import { useState, useEffect, useCallback } from 'react';
import {
  View,
  FlatList,
  RefreshControl,
  Pressable,
  TextInput,
  Alert,
  ActivityIndicator,
  Modal,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Text, Button } from '~/components/ui';
import { useCashRegister } from '~/hooks/useCashRegister';
import { useToast } from '~/components/ToastProvider';
import { showApiError } from '~/lib/apiErrorHandler';
import { usePayments } from '~/hooks/usePayments';
import { formatPrice } from '~/lib/utils';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import type { Payment } from '~/types/payment.types';
import {
  Lock,
  Unlock,
  Banknote,
  X,
  User,
  Clock,
  Hash,
} from 'lucide-react-native';
import { colors } from '~/theme';

/**
 * CashRegisterScreen
 *
 * Écran de gestion de la caisse :
 * - Ouverture avec fond de caisse
 * - Suivi en temps réel des encaissements
 * - Clôture avec comptage et calcul des écarts
 * - Génération du Z
 */
export default function CashRegisterScreen() {
  const { showToast } = useToast();
  const {
    currentSession,
    isLoading,
    openSession,
    closeSession,
    refreshSession,
  } = useCashRegister();

  const { payments } = usePayments();

  // État local
  const [showOpenModal, setShowOpenModal] = useState(false);
  const [showCloseModal, setShowCloseModal] = useState(false);
  const [openingBalance, setOpeningBalance] = useState('');
  const [actualCash, setActualCash] = useState('');
  const [notes, setNotes] = useState('');

  // Transactions espèces filtrées
  const [cashTransactions, setCashTransactions] = useState<Payment[]>([]);
  const [isRefreshing, setIsRefreshing] = useState(false);

  /**
   * Filtrer les transactions espèces de la session en cours
   */
  useEffect(() => {
    if (currentSession && payments.length > 0) {
      // Filtrer uniquement les paiements espèces de la session en cours
      const cashPayments = payments.filter(p =>
        p.paymentMethod === 'cash' &&
        p.cashRegisterSessionId === currentSession.id &&
        p.status === 'completed'
      ).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

      setCashTransactions(cashPayments);
    } else {
      setCashTransactions([]);
    }
  }, [currentSession, payments]);

  /**
   * Rafraîchir au montage
   */
  useEffect(() => {
    refreshSession();
    // Les paiements sont maintenant chargés automatiquement via Redux
  }, []);

  /**
   * Ouvrir la caisse
   */
  const handleOpenSession = useCallback(async () => {
    const balance = parseFloat(openingBalance) * 100; // Convertir en cents

    if (isNaN(balance) || balance < 0) {
      showToast('Veuillez entrer un fond de caisse valide', 'error');
      return;
    }

    try {
      await openSession(balance, notes);
      setShowOpenModal(false);
      setOpeningBalance('');
      setNotes('');
      showToast('Caisse ouverte avec succès', 'success');
    } catch (error) {
      showApiError(error, showToast, 'Impossible d\'ouvrir la caisse');
    }
  }, [openingBalance, notes, openSession]);

  /**
   * Fermer la caisse
   */
  const handleCloseSession = useCallback(async () => {
    const cash = parseFloat(actualCash) * 100; // Convertir en cents

    if (isNaN(cash) || cash < 0) {
      showToast('Veuillez entrer un montant valide', 'error');
      return;
    }

    try {
      const result = await closeSession(cash, notes);
      setShowCloseModal(false);
      setActualCash('');
      setNotes('');

      // Afficher le résumé
      const { summary, zNumber } = result;
      const { discrepancy } = summary;
      const message = discrepancy === 0
        ? 'Caisse équilibrée !'
        : discrepancy > 0
        ? `Surplus de ${formatPrice(discrepancy)}`
        : `Manquant de ${formatPrice(Math.abs(discrepancy))}`;

      // A SUPPRIMER POUR UNE MDOALE OU AUTRE
      Alert.alert(
        'Caisse fermée',
        `${message}\nNuméro Z: ${zNumber}`,
        [
          { text: 'OK' },
          {
            text: 'Télécharger le Z',
            onPress: () => {
              // TODO: Implémenter le téléchargement
            },
          },
        ]
      );
    } catch (error) {
      showApiError(error, showToast, 'Impossible de fermer la caisse');
    }
  }, [actualCash, notes, closeSession]);

  /**
   * Modal d'ouverture de caisse
   */
  const renderOpenModal = () => (
    <Modal
      visible={showOpenModal}
      animationType="slide"
      transparent={true}
      onRequestClose={() => setShowOpenModal(false)}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        className="flex-1"
      >
        <Pressable
          className="flex-1 bg-black/50 justify-end"
          onPress={() => setShowOpenModal(false)}
        >
          <Pressable
            className="bg-white rounded-t-3xl p-6 pb-10"
            onPress={(e) => e.stopPropagation()}
          >
            <View className="flex-row justify-between items-center mb-6">
              <Text className="text-xl font-semibold">Ouvrir la caisse</Text>
              <Pressable onPress={() => setShowOpenModal(false)}>
                <X size={24} color={colors.gray[500]} />
              </Pressable>
            </View>

            <View className="mb-4">
              <Text className="text-sm font-medium text-gray-700 mb-2">
                Fond de caisse (€)
              </Text>
              <TextInput
                className="border border-gray-300 rounded-lg px-4 py-3 text-lg"
                placeholder="200.00"
                keyboardType="decimal-pad"
                value={openingBalance}
                onChangeText={setOpeningBalance}
                autoFocus
              />
            </View>

            <View className="mb-6">
              <Text className="text-sm font-medium text-gray-700 mb-2">
                Notes (optionnel)
              </Text>
              <TextInput
                className="border border-gray-300 rounded-lg px-4 py-3"
                placeholder="Ex: Fond de caisse du matin"
                value={notes}
                onChangeText={setNotes}
                multiline
                numberOfLines={3}
              />
            </View>

            <Button
              onPress={handleOpenSession}
              className="bg-green-600 py-3"
            >
              <View className="flex-row items-center justify-center gap-2">
                <Unlock size={20} color="white" />
                <Text className="text-white font-semibold text-base">
                  Ouvrir la caisse
                </Text>
              </View>
            </Button>
          </Pressable>
        </Pressable>
      </KeyboardAvoidingView>
    </Modal>
  );

  /**
   * Modal de fermeture de caisse
   */
  const renderCloseModal = () => {
    if (!currentSession) return null;

    const expectedCash = currentSession.openingBalance + (currentSession.stats?.totalCash || 0);

    return (
      <Modal
        visible={showCloseModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowCloseModal(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          className="flex-1"
        >
          <Pressable
            className="flex-1 bg-black/50 justify-end"
            onPress={() => setShowCloseModal(false)}
          >
            <Pressable
              className="bg-white rounded-t-3xl p-6 pb-10"
              onPress={(e) => e.stopPropagation()}
            >
              <View className="flex-row justify-between items-center mb-6">
                <Text className="text-xl font-semibold">Fermer la caisse</Text>
                <Pressable onPress={() => setShowCloseModal(false)}>
                  <X size={24} color={colors.gray[500]} />
                </Pressable>
              </View>

              {/* Résumé */}
              <View className="bg-blue-50 rounded-lg p-4 mb-4">
                <View className="flex-row justify-between mb-2">
                  <Text className="text-sm text-gray-600">Fond de caisse</Text>
                  <Text className="font-semibold">
                    {formatPrice(currentSession.openingBalance)}
                  </Text>
                </View>
                <View className="flex-row justify-between mb-2">
                  <Text className="text-sm text-gray-600">+ Espèces encaissées</Text>
                  <Text className="font-semibold text-green-600">
                    {formatPrice(currentSession.stats?.totalCash || 0)}
                  </Text>
                </View>
                <View className="border-t border-blue-200 pt-2 mt-2">
                  <View className="flex-row justify-between">
                    <Text className="font-medium text-blue-900">Espèces attendues</Text>
                    <Text className="font-bold text-blue-600">
                      {formatPrice(expectedCash)}
                    </Text>
                  </View>
                </View>
              </View>

              <View className="mb-4">
                <Text className="text-sm font-medium text-gray-700 mb-2">
                  Espèces comptées (€)
                </Text>
                <TextInput
                  className="border border-gray-300 rounded-lg px-4 py-3 text-lg"
                  placeholder={`${(expectedCash / 100).toFixed(2)}`}
                  keyboardType="decimal-pad"
                  value={actualCash}
                  onChangeText={setActualCash}
                  autoFocus
                />
              </View>

              <View className="mb-6">
                <Text className="text-sm font-medium text-gray-700 mb-2">
                  Notes (optionnel)
                </Text>
                <TextInput
                  className="border border-gray-300 rounded-lg px-4 py-3"
                  placeholder="Ex: RAS, caisse équilibrée"
                  value={notes}
                  onChangeText={setNotes}
                  multiline
                  numberOfLines={3}
                />
              </View>

              <Button
                onPress={handleCloseSession}
                className="bg-red-600 py-3"
              >
                <View className="flex-row items-center justify-center gap-2">
                  <Lock size={20} color="white" />
                  <Text className="text-white font-semibold text-base">
                    Fermer la caisse et générer le Z
                  </Text>
                </View>
              </Button>
            </Pressable>
          </Pressable>
        </KeyboardAvoidingView>
      </Modal>
    );
  };

  /**
   * Header avec résumé et actions
   */
  const renderHeader = () => {
    if (!currentSession) {
      // Header pour caisse fermée
      return (
        <View className="bg-white shadow-sm">
          <View className="px-4 py-4 flex-row items-center justify-between">
            <View className="flex-row items-center gap-3">
              <View className="w-3 h-3 bg-gray-400 rounded-full" />
              <Text className="text-lg font-semibold text-gray-900">
                Caisse fermée
              </Text>
            </View>
            <Button
              onPress={() => setShowOpenModal(true)}
              className="bg-green-600 px-4 py-2"
              size="sm"
            >
              <View className="flex-row items-center gap-2">
                <Unlock size={16} color="white" />
                <Text className="text-white font-medium">Ouvrir</Text>
              </View>
            </Button>
          </View>
        </View>
      );
    }

    const expectedCash = currentSession.openingBalance + (currentSession.stats?.totalCash || 0);

    // Header pour caisse ouverte
    return (
      <View className="bg-white shadow-sm">
        {/* Ligne 1 : État et actions */}
        <View className="px-4 py-3 flex-row items-center justify-between border-b border-gray-200">
          <View className="flex-row items-center gap-3">
            <View className="w-3 h-3 bg-green-500 rounded-full" />
            <Text className="text-lg font-semibold text-gray-900">
              Caisse ouverte
            </Text>
            <View className="flex-row items-center gap-1 ml-2">
              <Clock size={14} color={colors.gray[500]} />
              <Text className="text-xs text-gray-600">
                depuis {format(new Date(currentSession.openedAt), 'HH:mm', { locale: fr })}
              </Text>
            </View>
            {currentSession.user && (
              <View className="flex-row items-center gap-1 ml-2">
                <User size={14} color={colors.gray[500]} />
                <Text className="text-xs text-gray-600">
                  {currentSession.user.firstName}
                </Text>
              </View>
            )}
          </View>
          <Button
            onPress={() => setShowCloseModal(true)}
            className="bg-red-600 px-4 py-2"
            size="sm"
          >
            <View className="flex-row items-center gap-2">
              <Lock size={16} color="white" />
              <Text className="text-white font-medium">Fermer</Text>
            </View>
          </Button>
        </View>

        {/* Ligne 2 : Montant attendu */}
        <View className="px-4 py-4">
          <View className="bg-blue-50 rounded-xl p-4">
            <View className="flex-row items-center justify-between">
              <View>
                <View className="flex-row items-center gap-2 mb-1">
                  <Banknote size={20} color="#2563EB" />
                  <Text className="text-sm font-semibold text-blue-900">
                    Espèces en caisse
                  </Text>
                </View>
                <Text className="text-3xl font-bold text-blue-600">
                  {formatPrice(expectedCash)}
                </Text>
                <View className="flex-row items-center gap-4 mt-2">
                  <Text className="text-xs text-blue-700">
                    Fond: {formatPrice(currentSession.openingBalance)}
                  </Text>
                  {currentSession.stats?.totalCash && currentSession.stats.totalCash > 0 && (
                    <Text className="text-xs text-blue-700">
                      + Encaissé: {formatPrice(currentSession.stats.totalCash)}
                    </Text>
                  )}
                </View>
              </View>

              {/* Indicateur de transactions */}
              {currentSession.stats && (
                <View className="items-end">
                  <View className="flex-row items-center gap-1 mb-1">
                    <Hash size={14} color={colors.gray[500]} />
                    <Text className="text-sm font-medium text-gray-700">
                      {currentSession.stats.paymentsCount}
                    </Text>
                  </View>
                  <Text className="text-xs text-gray-500">transactions</Text>
                </View>
              )}
            </View>
          </View>
        </View>
      </View>
    );
  };

  /**
   * Render d'une transaction espèces
   */
  const renderCashTransaction = ({ item }: { item: Payment }) => {
    const isRefund = item.status === 'refunded';
    const amount = item.amount;

    return (
      <View className="px-4 py-2">
        <View className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
          <View className="flex-row justify-between items-center">
            <View className="flex-1">
              <View className="flex-row items-center gap-2 mb-1">
                <Text className="text-sm font-semibold text-gray-900">
                  Commande #{item.orderId.substring(0, 8).toUpperCase()}
                </Text>
                <Text className="text-xs text-gray-500">
                  {format(new Date(item.createdAt), 'HH:mm', { locale: fr })}
                </Text>
                {isRefund && (
                  <View className="px-2 py-0.5 bg-red-100 rounded">
                    <Text className="text-xs font-medium text-red-700">
                      Remboursé
                    </Text>
                  </View>
                )}
              </View>
              {item.user && (
                <View className="flex-row items-center gap-1">
                  <User size={12} color={colors.gray[400]} />
                  <Text className="text-xs text-gray-500">
                    {item.user.firstName} {item.user.lastName}
                  </Text>
                </View>
              )}
              {item.notes && (
                <Text className="text-xs text-gray-600 mt-1">
                  {item.notes}
                </Text>
              )}
            </View>
            <View className="flex-row items-center gap-2">
              <Banknote size={18} color={isRefund ? colors.error.base : colors.success.base} />
              <Text className={`text-lg font-bold ${isRefund ? 'text-red-600' : 'text-gray-900'}`}>
                {isRefund && '-'}{formatPrice(Math.abs(amount))}
              </Text>
            </View>
          </View>
        </View>
      </View>
    );
  };

  /**
   * Message quand pas de transactions
   */
  const renderEmpty = () => {
    return (
      <View className="flex-1 items-center justify-center p-8">
        <Banknote size={48} color={colors.gray[300]} />
        <Text className="text-gray-500 text-center mt-4">
          {currentSession
            ? "Aucune transaction espèces aujourd'hui"
            : "Ouvrez la caisse pour commencer"}
        </Text>
      </View>
    );
  };

  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    try {
      await refreshSession();
      // Les paiements sont maintenant chargés automatiquement via Redux
    } finally {
      setIsRefreshing(false);
    }
  }, [refreshSession]);

  if (isLoading && !currentSession) {
    return (
      <View className="flex-1 items-center justify-center bg-gray-50">
        <ActivityIndicator size="large" color={colors.info.base} />
      </View>
    );
  }

  return (
    <View className="flex-1 bg-gray-50">
      {renderOpenModal()}
      {renderCloseModal()}

      <FlatList
        data={cashTransactions}
        keyExtractor={(item) => item.id || Math.random().toString()}
        renderItem={renderCashTransaction}
        ListHeaderComponent={renderHeader}
        ListEmptyComponent={renderEmpty}
        stickyHeaderIndices={[0]}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={handleRefresh}
            colors={[colors.info.base]}
          />
        }
        contentContainerStyle={{ flexGrow: 1 }}
      />
    </View>
  );
}