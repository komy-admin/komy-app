import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  ScrollView,
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
import { formatPrice } from '~/lib/utils';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import {
  Calculator,
  Lock,
  Unlock,
  Euro,
  CreditCard,
  Banknote,
  Ticket,
  FileCheck,
  AlertCircle,
  TrendingUp,
  TrendingDown,
  User,
  Calendar,
  Hash,
  X,
} from 'lucide-react-native';

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
  const {
    currentSession,
    isLoading,
    openSession,
    closeSession,
    refreshSession,
  } = useCashRegister();

  // État local
  const [showOpenModal, setShowOpenModal] = useState(false);
  const [showCloseModal, setShowCloseModal] = useState(false);
  const [openingBalance, setOpeningBalance] = useState('');
  const [actualCash, setActualCash] = useState('');
  const [notes, setNotes] = useState('');

  /**
   * Rafraîchir au montage
   */
  useEffect(() => {
    refreshSession();
  }, []);

  /**
   * Ouvrir la caisse
   */
  const handleOpenSession = useCallback(async () => {
    const balance = parseFloat(openingBalance) * 100; // Convertir en cents

    if (isNaN(balance) || balance < 0) {
      Alert.alert('Erreur', 'Veuillez entrer un fond de caisse valide');
      return;
    }

    try {
      await openSession(balance, notes);
      setShowOpenModal(false);
      setOpeningBalance('');
      setNotes('');
      Alert.alert('Succès', 'Caisse ouverte avec succès');
    } catch (error) {
      Alert.alert('Erreur', 'Impossible d\'ouvrir la caisse');
    }
  }, [openingBalance, notes, openSession]);

  /**
   * Fermer la caisse
   */
  const handleCloseSession = useCallback(async () => {
    const cash = parseFloat(actualCash) * 100; // Convertir en cents

    if (isNaN(cash) || cash < 0) {
      Alert.alert('Erreur', 'Veuillez entrer un montant valide');
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
      Alert.alert('Erreur', 'Impossible de fermer la caisse');
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
                <X size={24} color="#6B7280" />
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
                  <X size={24} color="#6B7280" />
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
   * Carte de statistique
   */
  const StatCard = ({
    icon,
    label,
    value,
    trend,
  }: {
    icon: React.ReactNode;
    label: string;
    value: string | number;
    trend?: number;
  }) => (
    <View className="bg-white rounded-lg p-4 flex-1 min-w-[150px]">
      <View className="flex-row items-center gap-2 mb-2">
        {icon}
        <Text className="text-xs text-gray-600">{label}</Text>
      </View>
      <Text className="text-lg font-bold text-gray-900">{value}</Text>
      {trend !== undefined && (
        <View className="flex-row items-center gap-1 mt-1">
          {trend > 0 ? (
            <TrendingUp size={16} color="#10B981" />
          ) : trend < 0 ? (
            <TrendingDown size={16} color="#EF4444" />
          ) : null}
          <Text
            className={`text-xs font-medium ${
              trend > 0
                ? 'text-green-600'
                : trend < 0
                ? 'text-red-600'
                : 'text-gray-500'
            }`}
          >
            {trend > 0 ? '+' : ''}{trend}%
          </Text>
        </View>
      )}
    </View>
  );

  if (isLoading && !currentSession) {
    return (
      <View className="flex-1 items-center justify-center bg-gray-50">
        <ActivityIndicator size="large" color="#3B82F6" />
      </View>
    );
  }

  return (
    <ScrollView className="flex-1 bg-gray-50">
      {renderOpenModal()}
      {renderCloseModal()}

      {/* État de la caisse */}
      <View className="bg-white border-b border-gray-200 px-4 py-4">
        {currentSession ? (
          <View>
            <View className="flex-row items-center justify-between mb-3">
              <View className="flex-row items-center gap-2">
                <View className="w-3 h-3 bg-green-500 rounded-full" />
                <Text className="text-lg font-semibold text-gray-900">
                  Caisse ouverte
                </Text>
              </View>
              <Button
                onPress={() => setShowCloseModal(true)}
                className="bg-red-600 px-4 py-2"
                size="sm"
              >
                <View className="flex-row items-center gap-2">
                  <Lock size={16} color="white" />
                  <Text className="text-white font-medium text-sm">Fermer</Text>
                </View>
              </Button>
            </View>

            <View className="flex-row gap-4 text-sm text-gray-600">
              <View className="flex-row items-center gap-1">
                <Calendar size={14} color="#6B7280" />
                <Text className="text-xs">
                  {format(new Date(currentSession.openedAt), 'dd/MM à HH:mm', { locale: fr })}
                </Text>
              </View>
              <View className="flex-row items-center gap-1">
                <User size={14} color="#6B7280" />
                <Text className="text-xs">
                  {currentSession.user?.firstName} {currentSession.user?.lastName}
                </Text>
              </View>
              <View className="flex-row items-center gap-1">
                <Euro size={14} color="#6B7280" />
                <Text className="text-xs">
                  Fond: {formatPrice(currentSession.openingBalance)}
                </Text>
              </View>
            </View>
          </View>
        ) : (
          <View>
            <View className="flex-row items-center justify-between mb-3">
              <View className="flex-row items-center gap-2">
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
                  <Text className="text-white font-medium text-sm">Ouvrir</Text>
                </View>
              </Button>
            </View>
            <Text className="text-sm text-gray-500">
              Aucune session de caisse active
            </Text>
          </View>
        )}
      </View>

      {currentSession && currentSession.stats && (
        <>
          {/* Statistiques générales */}
          <View className="p-4">
            <Text className="text-lg font-semibold mb-3">Vue d'ensemble</Text>
            <View className="flex-row flex-wrap gap-3">
              <StatCard
                icon={<Hash size={20} color="#3B82F6" />}
                label="Transactions"
                value={currentSession.stats.paymentsCount}
                trend={12}
              />
              <StatCard
                icon={<Euro size={20} color="#10B981" />}
                label="Total encaissé"
                value={formatPrice(currentSession.stats.totalAmount)}
                trend={8}
              />
            </View>
          </View>

          {/* Répartition par méthode */}
          <View className="p-4">
            <Text className="text-lg font-semibold mb-3">Par méthode de paiement</Text>
            <View className="flex-row flex-wrap gap-3">
              <StatCard
                icon={<Banknote size={20} color="#10B981" />}
                label="Espèces"
                value={formatPrice(currentSession.stats.totalCash)}
              />
              <StatCard
                icon={<CreditCard size={20} color="#3B82F6" />}
                label="Carte bancaire"
                value={formatPrice(currentSession.stats.totalCard)}
              />
              <StatCard
                icon={<Ticket size={20} color="#F59E0B" />}
                label="Tickets resto"
                value={formatPrice(currentSession.stats.totalTicketResto)}
              />
              <StatCard
                icon={<FileCheck size={20} color="#8B5CF6" />}
                label="Chèques"
                value={formatPrice(currentSession.stats.totalCheck)}
              />
            </View>
          </View>

          {/* Calcul espèces attendues */}
          <View className="mx-4 mb-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
            <View className="flex-row items-start gap-2 mb-3">
              <AlertCircle size={20} color="#2563EB" />
              <View className="flex-1">
                <Text className="font-semibold text-blue-900 mb-1">
                  Espèces attendues en caisse
                </Text>
                <Text className="text-sm text-blue-700 mb-3">
                  Fond de caisse + encaissements espèces
                </Text>
              </View>
            </View>

            <View className="bg-white rounded-lg p-3">
              <View className="flex-row justify-between mb-2">
                <Text className="text-sm text-gray-600">Fond de caisse</Text>
                <Text className="font-medium">{formatPrice(currentSession.openingBalance)}</Text>
              </View>
              <View className="flex-row justify-between mb-2">
                <Text className="text-sm text-gray-600">+ Espèces encaissées</Text>
                <Text className="font-medium text-green-600">
                  {formatPrice(currentSession.stats.totalCash)}
                </Text>
              </View>
              <View className="border-t border-gray-200 pt-2 mt-2">
                <View className="flex-row justify-between">
                  <Text className="font-semibold text-gray-900">Total attendu</Text>
                  <Text className="font-bold text-lg text-blue-600">
                    {formatPrice(currentSession.openingBalance + currentSession.stats.totalCash)}
                  </Text>
                </View>
              </View>
            </View>
          </View>
        </>
      )}

      {/* Message si caisse fermée */}
      {!currentSession && (
        <View className="flex-1 items-center justify-center p-8">
          <Calculator size={48} color="#D1D5DB" />
          <Text className="text-gray-500 text-center mt-4 mb-6">
            La caisse est actuellement fermée.
            {'\n'}
            Ouvrez une session pour commencer à encaisser.
          </Text>
        </View>
      )}
    </ScrollView>
  );
}