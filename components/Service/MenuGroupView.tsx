import { View, Text, Pressable } from 'react-native';
import { ChevronDown, ChevronUp, UtensilsCrossed } from 'lucide-react-native';
import { useState } from 'react';
import { MenuGroup } from '~/types/menu.types';
import { OrderItem } from '~/types/order-item.types';
import { Status } from '~/types/status.enum';
import { DateFormat, formatDate, getMostImportantStatus, getStatusColor, getStatusText } from '~/lib/utils';

interface MenuGroupViewProps {
  menuGroup: MenuGroup;
  onStatusUpdate?: (orderItems: OrderItem[], status: Status) => void;
  isExpanded?: boolean;
  onToggle?: () => void;
}

export default function MenuGroupView({ 
  menuGroup, 
  onStatusUpdate, 
  isExpanded = false, 
  onToggle 
}: MenuGroupViewProps) {
  const [showDetails, setShowDetails] = useState(isExpanded);
  
  // Calculer le statut global du menu basé sur les items
  const allStatuses = menuGroup.orderItems.map(item => item.status);
  const globalStatus = getMostImportantStatus(allStatuses);
  const statusColor = getStatusColor(globalStatus);
  const statusText = getStatusText(globalStatus);

  const handleToggle = () => {
    if (onToggle) {
      onToggle();
    } else {
      setShowDetails(!showDetails);
    }
  };

  const displayExpanded = onToggle ? isExpanded : showDetails;

  return (
    <View style={{ marginBottom: 8 }}>
      <Pressable
        onPress={handleToggle}
        style={{
          backgroundColor: `${statusColor}80`,
          borderRadius: 12,
          padding: 16,
          borderWidth: 1,
          borderColor: '#E5E5E5',
        }}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1, gap: 12 }}>
            {/* Icône du menu */}
            <View style={{
              backgroundColor: 'white',
              borderRadius: 20,
              width: 40,
              height: 40,
              justifyContent: 'center',
              alignItems: 'center'
            }}>
              <UtensilsCrossed size={24} color="#1A1A1A" strokeWidth={1.5} />
            </View>
            
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 16, fontWeight: '600', color: '#1A1A1A' }}>
                {menuGroup.menu.name}
              </Text>
              <Text style={{ fontSize: 14, color: '#666666', marginTop: 2 }}>
                {statusText} • {menuGroup.totalPrice}€
              </Text>
              <Text style={{ fontSize: 12, color: '#666666', marginTop: 2 }}>
                {menuGroup.orderItems.length} item{menuGroup.orderItems.length > 1 ? 's' : ''}
              </Text>
            </View>
          </View>
          
          <View style={{ alignItems: 'center' }}>
            {displayExpanded ? (
              <ChevronUp size={24} color="#1A1A1A" />
            ) : (
              <ChevronDown size={24} color="#1A1A1A" />
            )}
          </View>
        </View>

        {displayExpanded && (
          <View style={{ marginTop: 16 }}>
            {/* Description du menu si disponible */}
            {menuGroup.menu.description && (
              <Text style={{ 
                fontSize: 14, 
                color: '#666666', 
                fontStyle: 'italic',
                marginBottom: 12,
                paddingLeft: 52 // Aligné avec le contenu principal
              }}>
                {menuGroup.menu.description}
              </Text>
            )}

            {/* Liste des items du menu */}
            {menuGroup.orderItems.map((orderItem, index) => (
              <View
                key={orderItem.id}
                style={{
                  flexDirection: 'row',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  paddingVertical: 12,
                  paddingHorizontal: 16,
                  marginLeft: 36, // Indenté par rapport à l'icône
                  borderTopWidth: index === 0 ? 1 : 0,
                  borderTopColor: '#E5E7EB',
                  backgroundColor: 'rgba(255, 255, 255, 0.5)',
                  borderRadius: 8,
                  marginBottom: 4,
                }}
              >
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 15, fontWeight: '500', color: '#1A1A1A' }}>
                    {orderItem.item.name}
                  </Text>
                  {orderItem.note && (
                    <Text style={{ 
                      fontSize: 13, 
                      color: '#666666', 
                      fontStyle: 'italic',
                      marginTop: 4 
                    }}>
                      Note : {orderItem.note}
                    </Text>
                  )}
                  {orderItem.item.description && (
                    <Text style={{ 
                      fontSize: 13, 
                      color: '#888888',
                      marginTop: 2 
                    }}>
                      {orderItem.item.description}
                    </Text>
                  )}
                </View>
                
                <View style={{ alignItems: 'flex-end' }}>
                  <Text style={{ 
                    fontSize: 13, 
                    color: '#666666',
                    fontWeight: '500' 
                  }}>
                    {formatDate(orderItem.updatedAt, DateFormat.TIME)}
                  </Text>
                  <View style={{
                    backgroundColor: getStatusColor(orderItem.status),
                    paddingHorizontal: 8,
                    paddingVertical: 2,
                    borderRadius: 12,
                    marginTop: 4,
                  }}>
                    <Text style={{
                      fontSize: 11,
                      color: '#1A1A1A',
                      fontWeight: '600',
                      textTransform: 'uppercase'
                    }}>
                      {getStatusText(orderItem.status)}
                    </Text>
                  </View>
                </View>
              </View>
            ))}

            {/* Informations sur le prix */}
            <View style={{
              marginTop: 12,
              paddingLeft: 52,
              paddingTop: 12,
              borderTopWidth: 1,
              borderTopColor: '#E5E7EB',
            }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                <Text style={{ fontSize: 14, color: '#666666' }}>
                  Prix de base du menu:
                </Text>
                <Text style={{ fontSize: 14, fontWeight: '500' }}>
                  {menuGroup.menu.basePrice}€
                </Text>
              </View>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 4 }}>
                <Text style={{ fontSize: 16, fontWeight: '600', color: '#1A1A1A' }}>
                  Total menu:
                </Text>
                <Text style={{ fontSize: 16, fontWeight: '600', color: '#1A1A1A' }}>
                  {menuGroup.totalPrice}€
                </Text>
              </View>
            </View>

            {/* Bouton d'action si callback fourni */}
            {onStatusUpdate && (
              <Pressable
                onPress={() => onStatusUpdate(menuGroup.orderItems, globalStatus)}
                style={{
                  backgroundColor: '#2A2E33',
                  borderRadius: 8,
                  paddingVertical: 12,
                  paddingHorizontal: 16,
                  marginTop: 16,
                  marginLeft: 36,
                }}
              >
                <Text style={{
                  fontSize: 14,
                  color: '#FBFBFB',
                  fontWeight: '500',
                  textAlign: 'center',
                  textTransform: 'uppercase',
                }}>
                  Modifier statut du menu
                </Text>
              </Pressable>
            )}
          </View>
        )}
      </Pressable>
    </View>
  );
}