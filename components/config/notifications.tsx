import React from 'react';
import { View, Text, StyleSheet, Platform } from 'react-native';
import { Bell, MessageSquare, Mail, Smartphone } from 'lucide-react-native';

export default function NotificationsPage() {
  return (
    <View style={styles.container}>
      {/* Effet de flou en arrière-plan */}
      <View style={styles.blurOverlay}>
        {/* Card principale */}
        <View style={styles.comingSoonCard}>
          {/* Icône avec animation */}
          <View style={styles.iconContainer}>
            <Bell size={48} color="#F59E0B" strokeWidth={1.5} />
          </View>
          
          <View style={{ alignItems: 'center' }}>
            {/* Titre principal */}
            <Text style={styles.title}>Notifications à venir</Text>
            
            {/* Sous-titre */}
            <Text style={styles.subtitle}>
              Paramètres de notification en préparation
            </Text>
          </View>

          {/* Barre de progression */}
          <View style={styles.progressContainer}>
            <View style={styles.progressBar}>
              <View style={[styles.progressFill, { width: '30%' }]} />
            </View>
            <Text style={styles.progressText}>30% terminé</Text>
          </View>
        
          {/* Fonctionnalités à venir */}
          <View style={styles.featuresContainer}>
            <View style={styles.featureItem}>
              <MessageSquare size={16} color="#10B981" />
              <Text style={styles.featureText}>Notifications push</Text>
            </View>
            <View style={styles.featureItem}>
              <Mail size={16} color="#10B981" />
              <Text style={styles.featureText}>Alertes email</Text>
            </View>
            <View style={styles.featureItem}>
              <Smartphone size={16} color="#10B981" />
              <Text style={styles.featureText}>Notifications mobiles</Text>
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
    backgroundColor: 'rgba(248, 250, 252, 0.9)',
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
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 10,
    },
    height: 500,
    width: '60%',
    shadowOpacity: 0.1,
    shadowRadius: 25,
    elevation: 10,
    borderWidth: 1,
    borderColor: 'rgba(226, 232, 240, 0.8)',
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(245, 158, 11, 0.1)',
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
    backgroundColor: '#F59E0B',
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