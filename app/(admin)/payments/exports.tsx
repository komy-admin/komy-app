import React, { useState } from 'react';
import {
  View,
  ScrollView,
  Pressable,
  Alert,
} from 'react-native';
import { Text, Button } from '~/components/ui';
import {
  Download,
  FileText,
  FileSpreadsheet,
  FilePlus,
  Calendar,
  TrendingUp,
  ReceiptEuro,
  Euro,
  Filter,
  ChevronDown,
} from 'lucide-react-native';
import { format, startOfMonth, endOfMonth, startOfWeek, endOfWeek } from 'date-fns';
import { fr } from 'date-fns/locale';
import { formatPrice } from '~/lib/utils';
import { useToast } from '~/components/ToastProvider';
import { colors } from '~/theme';

/**
 * ExportsScreen
 *
 * Écran pour générer et télécharger des exports comptables :
 * - Journal des encaissements (CSV/PDF)
 * - Ventilation TVA
 * - Rapports périodiques
 * - Analyses
 */
export default function ExportsScreen() {
  const { showToast } = useToast();
  const [selectedPeriod, setSelectedPeriod] = useState<'day' | 'week' | 'month' | 'custom'>('month');
  const [selectedFormat, setSelectedFormat] = useState<'csv' | 'pdf' | 'xlsx'>('csv');
  const [isGenerating, setIsGenerating] = useState(false);

  /**
   * Générer un export
   */
  const handleGenerateExport = (type: 'journal' | 'tva' | 'detailed' | 'summary') => {
    // A SUPPRIMER POUR UNE MDOALE OU AUTRE
    Alert.alert(
      'Générer l\'export',
      `Export ${type} en ${selectedFormat.toUpperCase()} pour la période sélectionnée`,
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Générer',
          onPress: async () => {
            setIsGenerating(true);
            // TODO: Appeler l'API pour générer l'export
            setTimeout(() => {
              setIsGenerating(false);
              showToast('Le fichier a été téléchargé avec succès', 'success');
            }, 2000);
          },
        },
      ]
    );
  };

  /**
   * Carte d'export
   */
  const ExportCard = ({
    icon,
    title,
    description,
    type,
    badge,
  }: {
    icon: React.ReactNode;
    title: string;
    description: string;
    type: 'journal' | 'tva' | 'detailed' | 'summary';
    badge?: string;
  }) => (
    <Pressable
      onPress={() => handleGenerateExport(type)}
      className="bg-white rounded-lg p-4 mb-3 border border-gray-200 active:bg-gray-50"
    >
      <View className="flex-row items-start">
        <View className="w-10 h-10 bg-blue-50 rounded-lg items-center justify-center mr-3">
          {icon}
        </View>
        <View className="flex-1 mr-2">
          <View className="flex-row items-center gap-2 mb-1">
            <Text className="font-semibold text-gray-900">{title}</Text>
            {badge && (
              <View className="px-2 py-0.5 bg-green-100 rounded">
                <Text className="text-xs font-medium text-green-700">{badge}</Text>
              </View>
            )}
          </View>
          <Text className="text-sm text-gray-600">{description}</Text>
        </View>
        <Download size={20} color={colors.gray[500]} />
      </View>
    </Pressable>
  );

  return (
    <ScrollView className="flex-1 bg-gray-50">
      {/* Configuration */}
      <View className="bg-white border-b border-gray-200 px-4 py-4">
        <Text className="text-lg font-semibold mb-4">Configuration de l'export</Text>

        {/* Période */}
        <View className="mb-4">
          <Text className="text-sm font-medium text-gray-700 mb-2">Période</Text>
          <View className="flex-row gap-2">
            {(['day', 'week', 'month', 'custom'] as const).map((period) => (
              <Pressable
                key={period}
                onPress={() => setSelectedPeriod(period)}
                className={`px-3 py-2 rounded-lg border ${
                  selectedPeriod === period
                    ? 'bg-blue-50 border-blue-500'
                    : 'bg-white border-gray-300'
                }`}
              >
                <Text
                  className={`text-sm font-medium ${
                    selectedPeriod === period ? 'text-blue-600' : 'text-gray-700'
                  }`}
                >
                  {period === 'day' && 'Jour'}
                  {period === 'week' && 'Semaine'}
                  {period === 'month' && 'Mois'}
                  {period === 'custom' && 'Personnalisé'}
                </Text>
              </Pressable>
            ))}
          </View>

          {/* Affichage de la période sélectionnée */}
          <View className="mt-2 flex-row items-center gap-2">
            <Calendar size={16} color={colors.gray[500]} />
            <Text className="text-sm text-gray-600">
              {selectedPeriod === 'month' &&
                `${format(startOfMonth(new Date()), 'dd MMM', { locale: fr })} - ${format(
                  endOfMonth(new Date()),
                  'dd MMM yyyy',
                  { locale: fr }
                )}`}
              {selectedPeriod === 'week' &&
                `${format(startOfWeek(new Date(), { weekStartsOn: 1 }), 'dd MMM', {
                  locale: fr,
                })} - ${format(endOfWeek(new Date(), { weekStartsOn: 1 }), 'dd MMM yyyy', {
                  locale: fr,
                })}`}
              {selectedPeriod === 'day' && format(new Date(), 'dd MMMM yyyy', { locale: fr })}
              {selectedPeriod === 'custom' && 'Sélectionner les dates'}
            </Text>
          </View>
        </View>

        {/* Format */}
        <View>
          <Text className="text-sm font-medium text-gray-700 mb-2">Format</Text>
          <View className="flex-row gap-2">
            <Pressable
              onPress={() => setSelectedFormat('csv')}
              className={`flex-1 py-2 px-3 rounded-lg border items-center ${
                selectedFormat === 'csv'
                  ? 'bg-blue-50 border-blue-500'
                  : 'bg-white border-gray-300'
              }`}
            >
              <FileText size={20} color={selectedFormat === 'csv' ? '#2563EB' : colors.gray[500]} />
              <Text
                className={`text-sm font-medium mt-1 ${
                  selectedFormat === 'csv' ? 'text-blue-600' : 'text-gray-700'
                }`}
              >
                CSV
              </Text>
            </Pressable>

            <Pressable
              onPress={() => setSelectedFormat('pdf')}
              className={`flex-1 py-2 px-3 rounded-lg border items-center ${
                selectedFormat === 'pdf'
                  ? 'bg-blue-50 border-blue-500'
                  : 'bg-white border-gray-300'
              }`}
            >
              <FileText size={20} color={selectedFormat === 'pdf' ? '#2563EB' : colors.gray[500]} />
              <Text
                className={`text-sm font-medium mt-1 ${
                  selectedFormat === 'pdf' ? 'text-blue-600' : 'text-gray-700'
                }`}
              >
                PDF
              </Text>
            </Pressable>

            <Pressable
              onPress={() => setSelectedFormat('xlsx')}
              className={`flex-1 py-2 px-3 rounded-lg border items-center ${
                selectedFormat === 'xlsx'
                  ? 'bg-blue-50 border-blue-500'
                  : 'bg-white border-gray-300'
              }`}
            >
              <FileSpreadsheet
                size={20}
                color={selectedFormat === 'xlsx' ? '#2563EB' : colors.gray[500]}
              />
              <Text
                className={`text-sm font-medium mt-1 ${
                  selectedFormat === 'xlsx' ? 'text-blue-600' : 'text-gray-700'
                }`}
              >
                Excel
              </Text>
            </Pressable>
          </View>
        </View>
      </View>

      {/* Types d'exports disponibles */}
      <View className="p-4">
        <Text className="text-lg font-semibold mb-3">Exports disponibles</Text>

        <ExportCard
          icon={<ReceiptEuro size={20} color="#2563EB" />}
          title="Journal des encaissements"
          description="Liste chronologique de tous les paiements avec détails complets"
          type="journal"
          badge="Recommandé"
        />

        <ExportCard
          icon={<Euro size={20} color={colors.success.base} />}
          title="Ventilation TVA"
          description="Répartition de la TVA par taux pour déclaration fiscale"
          type="tva"
        />

        <ExportCard
          icon={<TrendingUp size={20} color={colors.warning.base} />}
          title="Rapport détaillé"
          description="Analyse complète avec statistiques et graphiques"
          type="detailed"
        />

        <ExportCard
          icon={<FilePlus size={20} color={colors.purple.alt} />}
          title="Résumé comptable"
          description="Synthèse pour rapprochement bancaire et comptabilité"
          type="summary"
        />
      </View>

      {/* Exports récents */}
      <View className="p-4">
        <Text className="text-lg font-semibold mb-3">Exports récents</Text>

        <View className="bg-white rounded-lg border border-gray-200">
          <Pressable className="p-3 border-b border-gray-100 flex-row items-center justify-between">
            <View className="flex-row items-center gap-3">
              <FileText size={20} color={colors.gray[500]} />
              <View>
                <Text className="text-sm font-medium">Journal_Novembre_2024.csv</Text>
                <Text className="text-xs text-gray-500">Généré le 01/12/2024 à 09:00</Text>
              </View>
            </View>
            <Download size={18} color={colors.info.base} />
          </Pressable>

          <Pressable className="p-3 border-b border-gray-100 flex-row items-center justify-between">
            <View className="flex-row items-center gap-3">
              <FileText size={20} color={colors.gray[500]} />
              <View>
                <Text className="text-sm font-medium">TVA_T3_2024.pdf</Text>
                <Text className="text-xs text-gray-500">Généré le 01/10/2024 à 14:30</Text>
              </View>
            </View>
            <Download size={18} color={colors.info.base} />
          </Pressable>

          <Pressable className="p-3 flex-row items-center justify-between">
            <View className="flex-row items-center gap-3">
              <FileSpreadsheet size={20} color={colors.gray[500]} />
              <View>
                <Text className="text-sm font-medium">Rapport_Septembre_2024.xlsx</Text>
                <Text className="text-xs text-gray-500">Généré le 01/10/2024 à 10:15</Text>
              </View>
            </View>
            <Download size={18} color={colors.info.base} />
          </Pressable>
        </View>
      </View>

      {/* Bouton d'action flottant */}
      <View className="px-4 pb-6">
        <Button
          onPress={() => handleGenerateExport('journal')}
          disabled={isGenerating}
          className="bg-blue-600 py-3"
        >
          <View className="flex-row items-center justify-center gap-2">
            <Download size={20} color="white" />
            <Text className="text-white font-semibold text-base">
              {isGenerating ? 'Génération en cours...' : 'Générer l\'export'}
            </Text>
          </View>
        </Button>
      </View>
    </ScrollView>
  );
}