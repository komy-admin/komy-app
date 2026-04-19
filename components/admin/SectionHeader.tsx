import React from 'react';
import { View, StyleSheet, Platform } from 'react-native';
import { Text } from '~/components/ui';
import { LucideIcon } from 'lucide-react-native';
import { colors } from '~/theme';

interface SectionHeaderProps {
  /**
   * Icône à afficher (composant Lucide)
   */
  icon: LucideIcon;

  /**
   * Titre de la section (ex: "1. Informations générales")
   */
  title: string;

  /**
   * Sous-titre descriptif (ex: "Définissez le nom, prix et catégorie de l'article")
   */
  subtitle: string;

  /**
   * Couleur de l'icône (par défaut: '#2A2E33')
   */
  iconColor?: string;
}

/**
 * Composant d'en-tête de section avec icône, titre et sous-titre
 * Utilisé dans tous les formulaires pour maintenir une cohérence visuelle
 */
export const SectionHeader: React.FC<SectionHeaderProps> = ({
  icon: Icon,
  title,
  subtitle,
  iconColor = colors.brand.dark
}) => {
  return (
    <View style={styles.sectionHeaderInline}>
      <View style={styles.sectionIconContainer}>
        <Icon size={20} color={iconColor} />
      </View>
      <View style={styles.sectionHeaderText}>
        <Text style={[
          styles.sectionHeaderTitle,
          Platform.OS === 'web' && {
            fontSize: 19,
            fontWeight: '700',
            color: colors.brand.dark,
            fontFamily: 'system-ui, -apple-system, sans-serif'
          }
        ]}>
          {title}
        </Text>
        <Text style={[
          styles.sectionHeaderSubtitle,
          Platform.OS === 'web' && {
            fontSize: 14,
            fontWeight: '500',
            color: colors.gray[500],
            fontFamily: 'system-ui, -apple-system, sans-serif'
          }
        ]}>
          {subtitle}
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  sectionHeaderInline: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
    paddingBottom: 12,
    borderBottomWidth: 2,
    borderBottomColor: colors.gray[100],
  },

  sectionIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: colors.gray[50],
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
    borderWidth: 1,
    borderColor: colors.gray[200],
  },

  sectionHeaderText: {
    flex: 1,
  },

  sectionHeaderTitle: {
    fontSize: 19,
    fontWeight: '700',
    color: colors.brand.dark,
    marginBottom: 3,
    letterSpacing: 0.5,
  },

  sectionHeaderSubtitle: {
    fontSize: 14,
    color: colors.gray[500],
    lineHeight: 20,
    fontWeight: '500',
  },
});
