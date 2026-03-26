import * as ImageManipulator from 'expo-image-manipulator';
import * as FileSystem from 'expo-file-system/legacy';
import { Platform } from 'react-native';

/**
 * Configuration de compression pour les images de profil
 */
const PROFILE_IMAGE_CONFIG = {
  maxWidth: 800,           // Largeur maximale pour un avatar
  maxHeight: 800,          // Hauteur maximale
  quality: 0.7,            // Qualité JPEG (70%)
  maxSizeKB: 500,          // Taille max finale en KB
  minQuality: 0.4,         // Qualité minimale acceptable
} as const;

/**
 * Obtient la taille d'un fichier en bytes
 */
export const getFileSize = async (uri: string): Promise<number> => {
  if (Platform.OS === 'web') {
    // Sur web, on ne peut pas facilement obtenir la taille depuis une data URI
    // On estime: base64 string length * 0.75 (approximation)
    const base64Length = uri.length - uri.indexOf(',') - 1;
    return Math.floor(base64Length * 0.75);
  }

  const fileInfo = await FileSystem.getInfoAsync(uri);
  if (!fileInfo.exists) {
    throw new Error('Fichier introuvable');
  }
  return fileInfo.size || 0;
};

/**
 * Compresse une image pour l'optimiser pour un avatar de profil
 * Stratégie: Resize à 800px max, puis compression progressive jusqu'à < 500KB
 */
export const compressForProfile = async (
  uri: string,
  quality: number = PROFILE_IMAGE_CONFIG.quality
): Promise<string> => {
  try {
    // Étape 1: Resize à la taille maximale avec compression
    const resized = await ImageManipulator.manipulateAsync(
      uri,
      [
        {
          resize: {
            width: PROFILE_IMAGE_CONFIG.maxWidth,
            // Height sera calculé automatiquement pour garder l'aspect ratio
          },
        },
      ],
      {
        compress: quality,
        format: 'jpeg' as any, // Type as any pour éviter l'erreur de dépréciation
      }
    );

    // Étape 2: Vérifier la taille
    const fileSize = await getFileSize(resized.uri);
    const fileSizeKB = fileSize / 1024;

    // Si la taille est acceptable, retourner
    if (fileSizeKB <= PROFILE_IMAGE_CONFIG.maxSizeKB) {
      return resized.uri;
    }

    // Si on a atteint la qualité minimale, on retourne quand même
    if (quality <= PROFILE_IMAGE_CONFIG.minQuality) {
      console.warn(`Image taille ${fileSizeKB.toFixed(0)}KB après compression max`);
      return resized.uri;
    }

    // Sinon, re-compresser avec une qualité plus basse (récursif)
    const newQuality = Math.max(quality - 0.1, PROFILE_IMAGE_CONFIG.minQuality);
    console.log(`Recompression: ${fileSizeKB.toFixed(0)}KB -> qualité ${newQuality}`);
    return compressForProfile(resized.uri, newQuality);

  } catch (error) {
    throw new Error('Impossible de compresser l\'image');
  }
};

/**
 * Valide qu'une image respecte les contraintes de taille
 */
export const validateImageSize = async (uri: string): Promise<boolean> => {
  try {
    const fileSize = await getFileSize(uri);
    const maxSize = 5 * 1024 * 1024; // 5MB avant compression
    return fileSize <= maxSize;
  } catch (error) {
    return false;
  }
};

/**
 * Convertit une image en base64
 * - Web: retourne la data URI telle quelle
 * - Mobile: lit le fichier et le convertit en base64
 */
export const convertToBase64 = async (uri: string): Promise<string> => {
  if (Platform.OS === 'web') {
    // Sur web, FileReader retourne déjà une data URI base64
    return uri;
  }

  try {
    const base64 = await FileSystem.readAsStringAsync(uri, {
      encoding: FileSystem.EncodingType.Base64,
    });

    return `data:image/jpeg;base64,${base64}`;
  } catch (error) {
    throw new Error('Impossible de convertir l\'image');
  }
};
