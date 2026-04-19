import { View, Text, StyleSheet, Platform, ScrollView, useWindowDimensions } from 'react-native';
import { Lightbulb, Utensils, Clock, CalendarOff, Settings, Share2, AlertTriangle } from 'lucide-react-native';

const GUIDE_STEPS = [
  {
    number: '1',
    Icon: Utensils,
    title: 'Créez vos services',
    bgColor: '#DBEAFE',
    textColor: '#3B82F6',
    description: 'Commencez par définir les différents services que vous proposez à vos clients.',
    details: [
      'Rendez-vous dans l\'onglet Configuration puis dans la section "Services".',
      'Ajoutez un service pour chaque moment de la journée : Déjeuner, Dîner, Brunch, etc.',
      'Capacité maximale : le nombre de couverts que vous pouvez accueillir en même temps sur ce service.',
      'Intervalle des créneaux : l\'écart entre chaque horaire proposé au client (ex: 30 min → 12h00, 12h30, 13h00…).',
      'Durée du service : la durée estimée d\'un repas. Elle sert à calculer les chevauchements entre réservations. Par exemple, si la durée est de 1h30 et qu\'une table est réservée à 12h00, le système considère qu\'elle sera occupée jusqu\'à 13h30 pour vérifier que la capacité n\'est pas dépassée.',
    ],
    tip: 'Commencez avec des capacités réduites pour tester, vous pourrez les augmenter ensuite.',
  },
  {
    number: '2',
    Icon: Clock,
    title: 'Définissez vos horaires',
    bgColor: '#FEF3C7',
    textColor: '#D97706',
    description: 'Indiquez les jours et heures d\'ouverture pour chaque service.',
    details: [
      'Dans Configuration, allez dans la section "Horaires".',
      'Sélectionnez un service puis ajoutez les créneaux jour par jour.',
      'Indiquez l\'heure de début et l\'heure de fin. Ex: Déjeuner le lundi de 12h00 à 14h00.',
      'Les créneaux proposés aux clients sont générés automatiquement entre ces deux horaires selon l\'intervalle du service (ex: 12h00, 12h30, 13h00, 13h30, 14h00).',
      'Vous pouvez définir des horaires différents pour chaque jour de la semaine.',
    ],
    tip: 'L\'heure de fin est incluse dans les créneaux proposés. Par exemple, un horaire de 12h00 à 14h00 avec un intervalle de 30 min proposera bien le créneau de 14h00.',
  },
  {
    number: '3',
    Icon: CalendarOff,
    title: 'Ajoutez vos fermetures exceptionnelles',
    bgColor: '#FEE2E2',
    textColor: '#EF4444',
    description: 'Bloquez les dates où votre établissement ne prend pas de réservations.',
    details: [
      'Dans Configuration, accédez à la section "Fermetures".',
      'Ajoutez les jours fériés, congés annuels, événements privés, travaux, etc.',
      'Vous pouvez fermer un jour complet ou seulement un service spécifique (ex: fermer le Brunch un jour férié mais garder le Dîner).',
      'Les fermetures s\'appliquent immédiatement : les créneaux concernés ne seront plus proposés aux clients.',
      'Pensez à ajouter vos fermetures à l\'avance pour éviter les réservations sur des dates indisponibles.',
    ],
    tip: 'Les réservations déjà confirmées sur une date que vous fermez ne seront pas automatiquement annulées. Pensez à prévenir les clients concernés.',
  },
  {
    number: '4',
    Icon: Settings,
    title: 'Ajustez vos paramètres',
    bgColor: '#E0E7FF',
    textColor: '#6366F1',
    description: 'Personnalisez les règles de réservation et les communications.',
    details: [
      'Dans l\'onglet Paramètres, configurez les contraintes : délai minimum de réservation, taille des groupes acceptés.',
      'Définissez le délai d\'annulation : passé ce délai, le client ne peut plus annuler en ligne.',
      'Configurez les notifications : choisissez quels emails vous recevez (nouvelles réservations, confirmations, annulations).',
      'Activez les rappels clients pour réduire les no-shows : un email est envoyé automatiquement avant la réservation.',
      'Personnalisez le message inclus dans les emails envoyés à vos clients.',
    ],
    tip: 'Passé le délai d\'annulation, le client ne peut plus annuler en ligne. Pensez à bien configurer ce délai selon votre politique.',
  },
  {
    number: '5',
    Icon: Share2,
    title: 'Partagez votre page de réservation',
    bgColor: '#D1FAE5',
    textColor: '#10B981',
    description: 'Rendez votre système de réservation accessible à vos clients.',
    details: [
      'Votre page publique de réservation est accessible via le lien "Page publique" en haut de la barre latérale.',
      'Copiez ce lien et ajoutez-le sur votre site internet, votre page Google My Business, vos réseaux sociaux.',
      'Vous pouvez aussi l\'envoyer directement par email ou SMS à vos clients réguliers.',
      'La page est responsive : elle s\'adapte automatiquement aux mobiles, tablettes et ordinateurs.',
      'Vos clients peuvent réserver en quelques clics sans avoir besoin de créer un compte.',
    ],
    tip: 'Ajoutez le lien dans votre bio Instagram et dans la description de votre page Facebook pour maximiser les réservations en ligne.',
  },
];

export function ReservationGuide() {
  const { width } = useWindowDimensions();
  const isCompact = width < 1100;
  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerIconWrap}>
          <Lightbulb size={22} color="#F59E0B" />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.headerTitle}>Guide de configuration</Text>
          <Text style={styles.headerSubtitle}>
            Suivez ces étapes pour configurer votre système de réservation et être opérationnel en quelques minutes.
          </Text>
        </View>
      </View>

      {/* Steps grid */}
      <View style={[styles.stepsGrid, isCompact && styles.stepsGridCompact]}>
        {GUIDE_STEPS.map((step, index) => (
          <View key={index} style={[styles.stepCard, (isCompact || (GUIDE_STEPS.length % 2 !== 0 && index === GUIDE_STEPS.length - 1)) && styles.stepCardFull]}>
            {/* Step header */}
            <View style={styles.stepHeader}>
              <View style={[styles.stepNumber, { backgroundColor: step.bgColor }]}>
                <Text style={[styles.stepNumberText, { color: step.textColor }]}>{step.number}</Text>
              </View>
              <View style={styles.stepHeaderContent}>
                <Text style={styles.stepTitle}>{step.title}</Text>
                <Text style={styles.stepDescription}>{step.description}</Text>
              </View>
            </View>

            {/* Step details */}
            <View style={styles.stepDetails}>
              {step.details.map((detail, i) => (
                <View key={i} style={styles.detailRow}>
                  <View style={[styles.detailBullet, { backgroundColor: step.textColor }]} />
                  <Text style={styles.detailText}>{detail}</Text>
                </View>
              ))}
            </View>

            {/* Tip */}
            <View style={styles.tipContainer}>
              <AlertTriangle size={14} color="#D97706" />
              <Text style={styles.tipText}>{step.tip}</Text>
            </View>
          </View>
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFFFFF' },
  contentContainer: { padding: 24, paddingBottom: 40 },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 14,
    marginBottom: 28,
    backgroundColor: '#FFFBEB',
    borderRadius: 14,
    padding: 20,
    borderWidth: 1,
    borderColor: '#FDE68A',
  },
  headerIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: '#FEF3C7',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 2,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#92400E',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#B45309',
    lineHeight: 20,
  },

  // Steps grid
  stepsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 20,
  },
  stepsGridCompact: {
    flexDirection: 'column',
  },
  stepCard: {
    width: '48.5%',
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 24,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    ...(Platform.OS === 'web' && {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.04,
      shadowRadius: 6,
    }),
  },
  stepCardFull: {
    width: '100%',
  },
  stepHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 14,
    marginBottom: 16,
  },
  stepNumber: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 2,
  },
  stepNumberText: {
    fontSize: 15,
    fontWeight: '700',
  },
  stepHeaderContent: {
    flex: 1,
  },
  stepTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1E293B',
    marginBottom: 4,
  },
  stepDescription: {
    fontSize: 14,
    color: '#64748B',
    lineHeight: 20,
  },

  // Details
  stepDetails: {
    backgroundColor: '#F8FAFC',
    borderRadius: 10,
    padding: 16,
    gap: 10,
    marginBottom: 12,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },
  detailBullet: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginTop: 6,
  },
  detailText: {
    flex: 1,
    fontSize: 13,
    color: '#475569',
    lineHeight: 19,
  },

  // Tip
  tipContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    backgroundColor: '#FFFBEB',
    borderRadius: 8,
    padding: 12,
    borderWidth: 1,
    borderColor: '#FDE68A',
  },
  tipText: {
    flex: 1,
    fontSize: 12,
    color: '#92400E',
    lineHeight: 18,
    fontWeight: '500',
  },
});
