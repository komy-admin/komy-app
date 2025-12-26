import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { X, Zap, FileText } from 'lucide-react-native';

interface TeamFormModeSelectionProps {
  onSelectQuick: () => void;
  onSelectFull: () => void;
  onCancel: () => void;
}

export const TeamFormModeSelection: React.FC<TeamFormModeSelectionProps> = ({
  onSelectQuick,
  onSelectFull,
  onCancel,
}) => {
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Créer un membre</Text>
        <TouchableOpacity onPress={onCancel}>
          <X size={24} color="#64748B" strokeWidth={2} />
        </TouchableOpacity>
      </View>

      <View style={styles.content}>
        <Text style={styles.subtitle}>Choisissez le type de création</Text>

        {/* Option Création Rapide */}
        <TouchableOpacity
          style={[styles.modeCard, styles.modeCardQuick]}
          onPress={onSelectQuick}
          activeOpacity={0.7}
        >
          <View style={[styles.iconWrapper, { backgroundColor: '#DBEAFE' }]}>
            <Zap size={32} color="#3B82F6" strokeWidth={2} />
          </View>
          <View style={styles.modeContent}>
            <View style={styles.modeTitleRow}>
              <Text style={styles.modeTitle}>Création rapide</Text>
              <View style={styles.modeBadge}>
                <Text style={styles.modeBadgeText}>Recommandé</Text>
              </View>
            </View>
            <Text style={styles.modeDescription}>
              Créer un membre avec le minimum d'informations (rôle + nom d'affichage).
              Le mot de passe sera généré automatiquement.
            </Text>
          </View>
        </TouchableOpacity>

        {/* Option Création personnalisée */}
        <TouchableOpacity
          style={[styles.modeCard, styles.modeCardFull]}
          onPress={onSelectFull}
          activeOpacity={0.7}
        >
          <View style={[styles.iconWrapper, { backgroundColor: '#F3E8FF' }]}>
            <FileText size={32} color="#A855F7" strokeWidth={2} />
          </View>
          <View style={styles.modeContent}>
            <Text style={styles.modeTitle}>Création personnalisée</Text>
            <Text style={styles.modeDescription}>
              Créer un membre avec toutes les informations détaillées (prénom, nom, email, téléphone, identifiant, mot de passe personnalisé).
            </Text>
          </View>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1E293B',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  subtitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#64748B',
    marginBottom: 20,
  },
  modeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
    borderWidth: 2,
    borderColor: '#E2E8F0',
  },
  modeCardQuick: {
    borderColor: '#3B82F6',
    backgroundColor: '#F8FBFF',
  },
  modeCardFull: {
    borderColor: '#E2E8F0',
  },
  iconWrapper: {
    width: 64,
    height: 64,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  modeContent: {
    flex: 1,
  },
  modeTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 8,
  },
  modeTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1E293B',
  },
  modeDescription: {
    fontSize: 13,
    color: '#64748B',
    lineHeight: 18,
  },
  modeBadge: {
    backgroundColor: '#3B82F6',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  modeBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#FFFFFF',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
});
