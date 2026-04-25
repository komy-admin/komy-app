import { View, Text, StyleSheet, ScrollView, useWindowDimensions } from 'react-native';
import { Utensils, Clock, CalendarOff, Settings, Share2, AlertTriangle } from 'lucide-react-native';
import { getColorWithOpacity } from '~/lib/color-utils';
import { colors } from '~/theme';

const GUIDE_STEPS = [
  {
    number: '1',
    Icon: Utensils,
    title: 'Créez vos services',
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
  const isWide = width >= 1100;
  const isMobile = width < 640;

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[styles.scrollContent, isMobile && styles.scrollContentMobile]}
        showsVerticalScrollIndicator={false}
      >
        {/* Page header (iso autres écrans config) */}
        <View style={styles.tabHeader}>
          <View style={{ flex: 1, minWidth: 0 }}>
            <Text style={styles.tabTitle}>Guide</Text>
            <Text style={styles.tabSubtitle}>
              Suivez ces étapes pour configurer votre système de réservation
            </Text>
          </View>
        </View>

        {/* Steps */}
        <View style={isWide ? styles.stepsGrid : styles.stepsList}>
          {GUIDE_STEPS.map((step, index) => {
            const { Icon } = step;
            const isLastOrphan = isWide && GUIDE_STEPS.length % 2 !== 0 && index === GUIDE_STEPS.length - 1;
            return (
              <View key={index} style={[styles.stepCard, isWide && styles.stepCardHalf, isLastOrphan && styles.stepCardFull]}>
                <View style={styles.stepHeader}>
                  <View style={styles.stepIconWrap}>
                    <Icon size={22} color={colors.brand.dark} strokeWidth={2} />
                  </View>
                  <View style={styles.stepHeaderContent}>
                    <View style={styles.stepTitleRow}>
                      <View style={styles.stepNumber}>
                        <Text style={styles.stepNumberText}>{step.number}</Text>
                      </View>
                      <Text style={styles.stepTitle} numberOfLines={2}>{step.title}</Text>
                    </View>
                    <Text style={styles.stepDescription}>{step.description}</Text>
                  </View>
                </View>

                <View style={styles.stepBody}>
                  <View style={styles.stepDetails}>
                    {step.details.map((detail, i) => (
                      <View key={i} style={styles.detailRow}>
                        <View style={styles.detailBullet} />
                        <Text style={styles.detailText}>{detail}</Text>
                      </View>
                    ))}
                  </View>

                  <View style={styles.tipContainer}>
                    <AlertTriangle size={14} color={colors.warning.text} />
                    <Text style={styles.tipText}>{step.tip}</Text>
                  </View>
                </View>
              </View>
            );
          })}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.neutral[50] },
  scroll: { flex: 1 },
  scrollContent: { padding: 24, paddingBottom: 24, gap: 16 },
  scrollContentMobile: { padding: 16, gap: 12 },

  // Page header (iso configuration.tsx, security.tsx, notifications.tsx)
  tabHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 16,
  },
  tabTitle: {
    fontSize: 24,
    fontWeight: '600',
    color: colors.neutral[800],
    marginBottom: 4,
  },
  tabSubtitle: {
    fontSize: 14,
    color: colors.neutral[500],
  },

  // Steps layout
  stepsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
  },
  stepsList: {
    gap: 16,
  },

  // viewCard pattern (iso le reste de la config)
  stepCard: {
    backgroundColor: colors.white,
    borderRadius: 12,
    padding: 20,
    borderWidth: 1,
    borderColor: colors.neutral[200],
  },
  stepCardHalf: {
    width: '48.5%',
    minWidth: 0,
  },
  stepCardFull: {
    width: '100%',
  },

  // Header (icon + number + title + description)
  stepHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 14,
  },
  stepIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: getColorWithOpacity(colors.brand.dark, 0.08),
    justifyContent: 'center',
    alignItems: 'center',
    flexShrink: 0,
  },
  stepHeaderContent: {
    flex: 1,
    minWidth: 0,
    gap: 4,
  },
  stepTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  stepNumber: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: colors.neutral[100],
    justifyContent: 'center',
    alignItems: 'center',
    flexShrink: 0,
  },
  stepNumberText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.neutral[600],
  },
  stepTitle: {
    flex: 1,
    minWidth: 0,
    fontSize: 16,
    fontWeight: '700',
    color: colors.neutral[800],
  },
  stepDescription: {
    fontSize: 13,
    color: colors.neutral[500],
    lineHeight: 18,
  },

  // Body section under header (iso viewModeSection)
  stepBody: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: colors.neutral[200],
    gap: 12,
  },

  // Details
  stepDetails: {
    backgroundColor: colors.neutral[50],
    borderRadius: 10,
    padding: 14,
    gap: 10,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },
  detailBullet: {
    width: 5,
    height: 5,
    borderRadius: 3,
    marginTop: 7,
    backgroundColor: colors.brand.dark,
  },
  detailText: {
    flex: 1,
    fontSize: 13,
    color: colors.neutral[600],
    lineHeight: 19,
  },

  // Tip
  tipContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    backgroundColor: colors.warning.bg,
    borderRadius: 8,
    padding: 12,
    borderWidth: 1,
    borderColor: colors.warning.border,
  },
  tipText: {
    flex: 1,
    fontSize: 12,
    color: colors.warning.text,
    lineHeight: 18,
    fontWeight: '500',
  },
});
