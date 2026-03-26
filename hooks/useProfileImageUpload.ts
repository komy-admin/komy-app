import { useState } from 'react';
import { Platform } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { useDispatch, useSelector } from 'react-redux';
import { compressForProfile, convertToBase64, validateImageSize } from '~/utils/imageCompression';
import { RootState, AppDispatch } from '~/store';
import { uploadProfileImage } from '~/store/thunks/uploadProfileImage.thunk';
import { useToast } from '~/components/ToastProvider';
import { showApiError } from '~/lib/apiErrorHandler';

/**
 * Hook personnalisé pour gérer l'upload de photo de profil
 * Gère web et mobile de manière unifiée avec compression optimisée
 */
export const useProfileImageUpload = () => {
  const dispatch = useDispatch<AppDispatch>();
  const user = useSelector((state: RootState) => state.session.user);
  const isLoading = useSelector((state: RootState) => state.session.isLoading);
  const { showToast } = useToast();

  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [previewUri, setPreviewUri] = useState<string | null>(null);

  /**
   * Valide une image avant traitement
   */
  const validateImage = async (uri: string): Promise<boolean> => {
    try {
      const isValid = await validateImageSize(uri);
      if (!isValid) {
        showToast('Image trop volumineuse (max 5MB)', 'error');
        return false;
      }
      return true;
    } catch (error) {
      showToast('Impossible de valider l\'image', 'error');
      return false;
    }
  };

  /**
   * Gère l'upload depuis le web (FileReader)
   */
  const handleWebImagePicker = async (): Promise<void> => {
    return new Promise((resolve, reject) => {
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = 'image/jpeg,image/jpg,image/png,image/webp';
      input.style.display = 'none';

      input.onchange = async (e) => {
        try {
          const file = (e.target as HTMLInputElement).files?.[0];
          if (!file) {
            resolve();
            return;
          }

          // Validation taille
          if (file.size > 5 * 1024 * 1024) {
            showToast('Image trop volumineuse (max 5MB)', 'error');
            resolve();
            return;
          }

          // Validation type
          const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
          if (!allowedTypes.includes(file.type)) {
            showToast('Format non supporté (JPG, PNG, WEBP uniquement)', 'error');
            resolve();
            return;
          }

          const reader = new FileReader();
          reader.onload = async (event) => {
            try {
              const base64Uri = event.target?.result as string;
              setPreviewUri(base64Uri);
              await uploadImage(base64Uri);
              resolve();
            } catch (error) {
              reject(error);
            }
          };
          reader.onerror = () => {
            reject(new Error('Erreur lecture fichier'));
          };
          reader.readAsDataURL(file);
        } catch (error) {
          reject(error);
        }
      };

      document.body.appendChild(input);
      input.click();
      document.body.removeChild(input);
    });
  };

  /**
   * Gère l'upload depuis mobile (ImagePicker)
   */
  const handleMobileImagePicker = async (): Promise<void> => {
    try {
      // Demander permissions
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        showToast('Accès à la galerie nécessaire', 'warning');
        return;
      }

      // Ouvrir la galerie
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (result.canceled || !result.assets[0]) {
        return;
      }

      const uri = result.assets[0].uri;

      // Validation
      const isValid = await validateImage(uri);
      if (!isValid) return;

      // Compression
      setUploadProgress(30);
      const compressedUri = await compressForProfile(uri);
      setUploadProgress(50);

      // Preview
      setPreviewUri(compressedUri);

      // Conversion base64
      setUploadProgress(70);
      const base64 = await convertToBase64(compressedUri);

      // Upload
      await uploadImage(base64);
    } catch (error) {
      showToast(error instanceof Error ? error.message : 'Impossible de charger l\'image', 'error');
      setUploadProgress(0);
    }
  };

  /**
   * Upload l'image vers le backend
   */
  const uploadImage = async (base64: string): Promise<void> => {
    if (!user?.id) {
      showToast('Utilisateur non connecté', 'error');
      return;
    }

    try {
      setIsUploading(true);
      setUploadProgress(80);

      await dispatch(uploadProfileImage({
        userId: user.id,
        imageBase64: base64,
      })).unwrap();

      setUploadProgress(100);
      showToast('Photo de profil mise à jour !', 'success');
      setPreviewUri(null);
    } catch (error) {
      showApiError(error, showToast, 'Échec de l\'upload');
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  /**
   * Point d'entrée principal - détecte la plateforme et appelle la bonne méthode
   */
  const pickImage = async (): Promise<void> => {
    try {
      if (Platform.OS === 'web') {
        await handleWebImagePicker();
      } else {
        await handleMobileImagePicker();
      }
    } catch (error) {
      showToast('Une erreur est survenue', 'error');
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  /**
   * Annule le preview
   */
  const cancelPreview = (): void => {
    setPreviewUri(null);
    setUploadProgress(0);
  };

  return {
    pickImage,
    isUploading: isUploading || isLoading,
    uploadProgress,
    previewUri,
    cancelPreview,
  };
};
