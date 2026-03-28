import { useState } from 'react';
import { View, Text, StyleSheet, Pressable, ActivityIndicator, Platform } from 'react-native';
import { CalendarDays, CheckCircle, Zap } from 'lucide-react-native';
import { useToast } from '~/components/ToastProvider';

interface ReservationActivationProps {
  reservation: {
    activate: () => Promise<void>;
    isLoading: boolean;
  };
}

export function ReservationActivation({ reservation }: ReservationActivationProps) {
  const [isActivating, setIsActivating] = useState(false);
  const { showToast } = useToast();

  const handleActivate = async () => {
    setIsActivating(true);
    try {
      await reservation.activate();
      showToast('Réservations activées avec succès', 'success');
    } catch (error: any) {
      showToast(error?.response?.data?.error || 'Erreur lors de l\'activation', 'error');
    } finally {
      setIsActivating(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.card}>
        <View style={styles.iconContainer}>
          <CalendarDays size={64} color="#3B82F6" strokeWidth={1.5} />
        </View>

        <Text style={styles.title}>Gérez vos réservations</Text>

        <Text style={styles.description}>
          Activez le module de réservation pour permettre à vos clients de réserver en ligne.
          Vous pourrez configurer vos services, horaires et paramètres de réservation.
        </Text>

        <View style={styles.features}>
          {[
            'Page de réservation en ligne pour vos clients',
            'Gestion des services (déjeuner, dîner...)',
            'Horaires et fermetures exceptionnelles',
            'Confirmation automatique ou manuelle',
          ].map((feature, index) => (
            <View key={index} style={styles.featureItem}>
              <CheckCircle size={16} color="#10B981" />
              <Text style={styles.featureText}>{feature}</Text>
            </View>
          ))}
        </View>

        <Pressable
          style={[styles.activateButton, isActivating && styles.activateButtonDisabled]}
          onPress={handleActivate}
          disabled={isActivating}
        >
          {isActivating ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <>
              <Zap size={20} color="#FFFFFF" />
              <Text style={styles.activateButtonText}>Activer les réservations</Text>
            </>
          )}
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    padding: 24,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 40,
    alignItems: 'center',
    maxWidth: 520,
    width: '100%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.1,
    shadowRadius: 25,
    elevation: 10,
    borderWidth: 1,
    borderColor: 'rgba(226, 232, 240, 0.8)',
    ...(Platform.OS === 'web' && {
      boxShadow: '0 10px 25px rgba(0, 0, 0, 0.1)',
    }),
  },
  iconContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(59, 130, 246, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1E293B',
    textAlign: 'center',
    marginBottom: 12,
  },
  description: {
    fontSize: 15,
    color: '#64748B',
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 22,
  },
  features: {
    width: '100%',
    gap: 12,
    marginBottom: 32,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  featureText: {
    fontSize: 14,
    color: '#475569',
    flex: 1,
  },
  activateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#2A2E33',
    borderRadius: 12,
    height: 52,
    width: '100%',
    ...(Platform.OS === 'web' && {
      cursor: 'pointer',
      transition: 'all 0.2s ease',
    }),
  },
  activateButtonDisabled: {
    opacity: 0.7,
  },
  activateButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
});
