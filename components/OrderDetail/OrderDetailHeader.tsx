import { memo, useState, useRef, useCallback, useMemo } from 'react';
import { View, Text, Pressable, StyleSheet, Platform, Modal, LayoutChangeEvent, TouchableOpacity } from 'react-native';
import { X, Bell, ConciergeBell, FilePlus, ArrowRightLeft, CreditCard, CheckCircle, Trash2, Menu, LucideIcon } from 'lucide-react-native';

// Constantes de style inspirées d'OrderLinesForm
const COMMON_STYLES = {
  colors: {
    primary: '#2A2E33',
    background: '#FFFFFF',
    backgroundSecondary: '#F9FAFB',
    border: '#F3F4F6',
    accent: '#6366F1',
  },
  typography: {
    title: {
      fontSize: 18,
      fontWeight: '800' as const,
      color: '#2A2E33',
      letterSpacing: 0.5,
    },
  },
  spacing: {
    xs: 4,
    md: 16,
    lg: 24,
  },
  shadow: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
  },
};

export interface OrderDetailHeaderProps {
  title: string;
  onBack: () => void;
  onAddItem?: () => void;
  onClaim?: () => void;
  onServe?: () => void;
  hasDraftItems?: boolean;
  hasReadyItems?: boolean;
  onReassignTable?: () => void;
  onPayment?: () => void;
  onTerminate?: () => void;
  onDelete?: () => void;
  orderStatus?: string;
}

/**
 * Composant mémoïsé pour rendre un item du menu dropdown
 */
interface MenuItemProps {
  icon: LucideIcon;
  iconColor: string;
  iconBackgroundStyle: 'blue' | 'green' | 'yellow' | 'red';
  text: string;
  isDanger?: boolean;
  showSeparator?: boolean;
  onPress: () => void;
}

const MenuItem = memo<MenuItemProps>(({
  icon: Icon,
  iconColor,
  iconBackgroundStyle,
  text,
  isDanger = false,
  showSeparator = true,
  onPress
}) => {
  // ✅ useMemo : Style de l'icône selon la variante
  const iconContainerStyle = useMemo(() => {
    const baseStyle = styles.iconContainer;
    switch (iconBackgroundStyle) {
      case 'blue':
        return [baseStyle, styles.iconContainerBlue];
      case 'green':
        return [baseStyle, styles.iconContainerGreen];
      case 'yellow':
        return [baseStyle, styles.iconContainerYellow];
      case 'red':
        return [baseStyle, styles.iconContainerRed];
      default:
        return baseStyle;
    }
  }, [iconBackgroundStyle]);

  // ✅ useMemo : Style du texte
  const textStyle = useMemo(
    () => isDanger ? [styles.menuItemText, styles.menuItemTextDanger] : styles.menuItemText,
    [isDanger]
  );

  return (
    <>
      <Pressable
        style={styles.menuItem}
        onPress={onPress}
      >
        <View style={iconContainerStyle}>
          <Icon size={18} color={iconColor} strokeWidth={2} />
        </View>
        <Text style={textStyle}>{text}</Text>
      </Pressable>
      {showSeparator && <View style={styles.menuSeparator} />}
    </>
  );
});

MenuItem.displayName = 'MenuItem';

export const OrderDetailHeader = memo<OrderDetailHeaderProps>(({
  title,
  onBack,
  onAddItem,
  onClaim,
  onServe,
  hasDraftItems = false,
  hasReadyItems = false,
  onReassignTable,
  onPayment,
  onTerminate,
  onDelete,
  orderStatus,
}) => {
  const [showActionsMenu, setShowActionsMenu] = useState(false);
  const [buttonLayout, setButtonLayout] = useState<{ x: number; y: number; width: number; height: number } | null>(null);
  const buttonRef = useRef<View>(null);

  // Fonction utilitaire pour capturer la position du bouton sur web (comme SearchBar)
  const captureWebButtonPosition = useCallback(() => {
    if (Platform.OS === 'web' && buttonRef.current) {
      const element = buttonRef.current as any;
      if (element.getBoundingClientRect) {
        const rect = element.getBoundingClientRect();
        setButtonLayout({
          x: rect.left,
          y: rect.top,
          width: rect.width,
          height: rect.height
        });
      }
    }
  }, []);

  // Capturer la position du bouton (comme SearchBar)
  const handleLayout = useCallback((event: LayoutChangeEvent) => {
    if (Platform.OS === 'web') {
      // Web: capturer via getBoundingClientRect
      captureWebButtonPosition();
    } else {
      // Mobile: utiliser measureInWindow via event.target (LA CLÉ!)
      const eventTarget = event.target as any;
      if (eventTarget?.measureInWindow) {
        eventTarget.measureInWindow((pageX: number, pageY: number, w: number, h: number) => {
          setButtonLayout({ x: pageX, y: pageY, width: w, height: h });
        });
      }
    }
  }, [captureWebButtonPosition]);

  const handleToggleMenu = useCallback(() => {
    if (!showActionsMenu) {
      if (Platform.OS === 'web') {
        // Sur web, toujours capturer la position avant d'ouvrir
        captureWebButtonPosition();
        // Utiliser setTimeout pour s'assurer que le state est mis à jour avant d'ouvrir
        setTimeout(() => setShowActionsMenu(true), 0);
      } else if (buttonLayout) {
        // Sur mobile, ouvrir seulement si on a la position
        setShowActionsMenu(true);
      }
    } else {
      setShowActionsMenu(false);
    }
  }, [showActionsMenu, buttonLayout, captureWebButtonPosition]);

  // ✅ useCallback : Fermer le menu
  const handleCloseMenu = useCallback(() => {
    setShowActionsMenu(false);
  }, []);

  // ✅ useCallback : Handlers pour les menu items
  const handleReassignTable = useCallback(() => {
    setShowActionsMenu(false);
    onReassignTable?.();
  }, [onReassignTable]);

  const handlePayment = useCallback(() => {
    setShowActionsMenu(false);
    onPayment?.();
  }, [onPayment]);

  const handleTerminate = useCallback(() => {
    setShowActionsMenu(false);
    onTerminate?.();
  }, [onTerminate]);

  const handleDelete = useCallback(() => {
    setShowActionsMenu(false);
    onDelete?.();
  }, [onDelete]);

  // ✅ useMemo : Position du dropdown menu
  const dropdownPosition = useMemo(() => {
    if (!buttonLayout) return {};
    return {
      top: buttonLayout.y + buttonLayout.height + 4,
      left: buttonLayout.x + buttonLayout.width - 240 - 8, // Menu avec 8px d'espace à droite
    };
  }, [buttonLayout]);

  // ✅ useMemo : Style du dropdown container
  const dropdownContainerStyle = useMemo(
    () => [styles.dropdownMenuContainer, dropdownPosition],
    [dropdownPosition]
  );

  return (
    <View style={styles.header}>
      {/* Bouton retour */}
      <Pressable
        onPress={onBack}
        style={styles.backButton}
      >
        <X size={20} color={COMMON_STYLES.colors.primary} />
      </Pressable>

      {/* Titre */}
      <View style={styles.titleContainer}>
        <Text
          style={styles.titleText}
          numberOfLines={1}
          ellipsizeMode="tail"
        >
          {title}
        </Text>
      </View>

      {/* Bouton Réclamer / Servir */}
      {(hasDraftItems || hasReadyItems) && (onClaim || onServe) && (
        <Pressable
          onPress={hasReadyItems ? onServe : onClaim}
          style={[
            styles.claimButton,
            hasReadyItems && styles.serveButton
          ]}
        >
          {hasReadyItems ? (
            <ConciergeBell size={18} color="#FFFFFF" strokeWidth={2.5} />
          ) : (
            <Bell size={18} color="#FFFFFF" strokeWidth={2.5} />
          )}
          <Text style={styles.claimText}>
            {hasReadyItems ? 'Servir' : 'Réclamer'}
          </Text>
        </Pressable>
      )}

      {/* Bouton Ajouter un item */}
      {onAddItem && (
        <Pressable
          onPress={onAddItem}
          style={styles.addButton}
        >
          <FilePlus size={18} color="#FFFFFF" strokeWidth={2} />
          <Text style={styles.addText}>Ajouter un item</Text>
        </Pressable>
      )}

      {/* Bouton Menu Actions */}
      <View onLayout={handleLayout} collapsable={false} style={styles.actionsButtonContainer}>
        <Pressable
          ref={buttonRef}
          onPress={handleToggleMenu}
          style={styles.actionsButton}
        >
          <Menu size={24} color="#FBFBFB" strokeWidth={2.5} />
        </Pressable>
      </View>

      {/* Menu dropdown avec Modal */}
      {showActionsMenu && (
        <Modal
          visible={showActionsMenu}
          transparent={true}
          animationType="fade"
          onRequestClose={handleCloseMenu}
        >
          <TouchableOpacity
            style={styles.modalOverlay}
            activeOpacity={1}
            onPress={handleCloseMenu}
          >
            <View style={dropdownContainerStyle}>
              <TouchableOpacity activeOpacity={1}>
                <View style={styles.dropdownMenuModal}>
                  {/* ✅ Utiliser le composant MenuItem mémoïsé */}

                  {/* Assigner table */}
                  {onReassignTable && (
                    <MenuItem
                      icon={ArrowRightLeft}
                      iconColor="#1E40AF"
                      iconBackgroundStyle="blue"
                      text="Assigner une autre table"
                      onPress={handleReassignTable}
                    />
                  )}

                  {/* Régler la note */}
                  {onPayment && (
                    <MenuItem
                      icon={CreditCard}
                      iconColor="#065F46"
                      iconBackgroundStyle="green"
                      text="Régler la note"
                      onPress={handlePayment}
                    />
                  )}

                  {/* Terminer */}
                  {onTerminate && orderStatus !== 'TERMINATED' && (
                    <MenuItem
                      icon={CheckCircle}
                      iconColor="#92400E"
                      iconBackgroundStyle="yellow"
                      text="Terminer la commande"
                      onPress={handleTerminate}
                    />
                  )}

                  {/* Supprimer */}
                  {onDelete && (
                    <MenuItem
                      icon={Trash2}
                      iconColor="#991B1B"
                      iconBackgroundStyle="red"
                      text="Supprimer"
                      isDanger={true}
                      showSeparator={false}
                      onPress={handleDelete}
                    />
                  )}
                </View>
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        </Modal>
      )}
    </View>
  );
});

OrderDetailHeader.displayName = 'OrderDetailHeader';

const styles = StyleSheet.create({
  header: {
    backgroundColor: COMMON_STYLES.colors.background,
    borderBottomWidth: 1,
    borderBottomColor: COMMON_STYLES.colors.border,
    flexDirection: 'row',
    alignItems: 'center',
    height: 50,
    paddingLeft: COMMON_STYLES.spacing.xs,
    paddingRight: 0, // Pas de padding à droite pour coller le bouton au bord
    ...COMMON_STYLES.shadow,
    overflow: 'visible',
    ...(Platform.OS === 'web' && {
      backdropFilter: 'blur(8px)',
    })
  },
  backButton: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: COMMON_STYLES.spacing.lg,
    paddingVertical: COMMON_STYLES.spacing.md,
    borderRightWidth: 1,
    borderRightColor: COMMON_STYLES.colors.border,
    height: '100%',
    ...(Platform.OS === 'web' && {
      cursor: 'pointer',
    })
  },
  titleContainer: {
    flex: 1,
    flexShrink: 1,
    minWidth: 0,
    justifyContent: 'center',
    paddingLeft: COMMON_STYLES.spacing.lg,
    paddingRight: COMMON_STYLES.spacing.lg,
  },
  titleText: {
    ...COMMON_STYLES.typography.title,
    textAlign: 'left',
    ...(Platform.OS === 'web' && {
      fontFamily: 'system-ui, -apple-system, sans-serif',
    })
  },
  claimButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderLeftWidth: 1,
    borderLeftColor: COMMON_STYLES.colors.border,
    height: '100%',
    minWidth: 130,
    justifyContent: 'center',
    backgroundColor: '#FB923C',
    ...(Platform.OS === 'web' && {
      cursor: 'pointer',
    })
  },
  serveButton: {
    backgroundColor: '#10B981',
  },
  claimText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#FFFFFF',
    ...Platform.select({
      ios: {
        fontWeight: '800',
      },
      android: {
        fontWeight: '900',
      }
    })
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 20,
    paddingVertical: 10,
    height: '100%',
    justifyContent: 'center',
    backgroundColor: '#6366F1',
    ...(Platform.OS === 'web' && {
      cursor: 'pointer',
    })
  },
  addText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  actionsButtonContainer: {
    height: '100%',
  },
  actionsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
    backgroundColor: '#2A2E33',
    height: '100%',
    minWidth: 60,
    ...(Platform.OS === 'web' && {
      cursor: 'pointer',
    })
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  dropdownMenuContainer: {
    position: 'absolute',
    zIndex: 1000,
  },
  dropdownMenuModal: {
    width: 240,
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    overflow: 'hidden',
  },
  iconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconContainerBlue: {
    backgroundColor: '#DBEAFE',
  },
  iconContainerGreen: {
    backgroundColor: '#D1FAE5',
  },
  iconContainerYellow: {
    backgroundColor: '#FEF3C7',
  },
  iconContainerRed: {
    backgroundColor: '#FEE2E2',
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    ...(Platform.OS === 'web' && {
      cursor: 'pointer',
    })
  },
  menuItemText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    flex: 1,
  },
  menuItemTextDanger: {
    color: '#991B1B',
  },
  menuSeparator: {
    height: 1,
    backgroundColor: '#F3F4F6',
    marginHorizontal: 12,
  },
});
