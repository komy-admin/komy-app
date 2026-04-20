import React from 'react';
import { View, Text, StyleSheet, Platform } from 'react-native';
import { Database, TrendingUp, Users, Activity } from 'lucide-react-native';
import { getColorWithOpacity } from '~/lib/color-utils';
import { shadows, colors } from '~/theme';

export default function DashboardPage() {
  return (
    <View style={styles.container}>
      {/* Effet de flou en arrière-plan */}
      <View style={styles.blurOverlay}>
        {/* Card principale */}
        <View style={styles.comingSoonCard}>
          {/* Icône avec animation */}
          <View style={styles.iconContainer}>
            <Database size={48} color="#6366F1" strokeWidth={1.5} />
          </View>

          <View style={{ alignItems: 'center' }}>
            {/* Titre principal */}
            <Text style={styles.title}>Dashboard en construction</Text>
            {/* Sous-titre */}
            <Text style={styles.subtitle}>
              Statistiques et métriques arrivent bientôt
            </Text>
          </View>
          
          
          {/* Barre de progression */}
          <View style={styles.progressContainer}>
            <View style={styles.progressBar}>
              <View style={[styles.progressFill, { width: '75%' }]} />
            </View>
            <Text style={styles.progressText}>75% terminé</Text>
          </View>
          
          {/* Fonctionnalités à venir */}
          <View style={styles.featuresContainer}>
            <View style={styles.featureItem}>
              <TrendingUp size={16} color="#10B981" />
              <Text style={styles.featureText}>Graphiques en temps réel</Text>
            </View>
            <View style={styles.featureItem}>
              <Users size={16} color="#10B981" />
              <Text style={styles.featureText}>Statistiques utilisateurs</Text>
            </View>
            <View style={styles.featureItem}>
              <Activity size={16} color="#10B981" />
              <Text style={styles.featureText}>Métriques de performance</Text>
            </View>
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1E1E1E',
  },
  blurOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: getColorWithOpacity(colors.neutral[50], 0.9),
    ...Platform.select({
      web: {
        backdropFilter: 'blur(8px)',
        WebkitBackdropFilter: 'blur(8px)',
      },
    }),
  },
  comingSoonCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    paddingVertical: 50,
    paddingHorizontal: 40,
    alignItems: 'center',
    justifyContent: 'space-between',
    maxWidth: 400,
    marginHorizontal: 20,
    height: 500,
    width: '60%',
    borderWidth: 1,
    borderColor: getColorWithOpacity(colors.neutral[200], 0.8),
    ...shadows.bottom,
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: getColorWithOpacity(colors.brand.accent, 0.1),
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1E293B',
    textAlign: 'center',
    marginBottom: 8,
    lineHeight: 32,
  },
  subtitle: {
    fontSize: 16,
    color: '#64748B',
    textAlign: 'center',
    marginBottom: 32,
    lineHeight: 24,
  },
  progressContainer: {
    width: '100%',
    marginBottom: 32,
  },
  progressBar: {
    width: '100%',
    height: 6,
    backgroundColor: '#E2E8F0',
    borderRadius: 3,
    marginBottom: 8,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#6366F1',
    borderRadius: 3,
  },
  progressText: {
    fontSize: 14,
    color: '#64748B',
    fontWeight: '500',
    textAlign: 'center',
  },
  featuresContainer: {
    width: '100%',
    gap: 12,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  featureText: {
    fontSize: 14,
    color: '#475569',
    fontWeight: '500',
  },
});