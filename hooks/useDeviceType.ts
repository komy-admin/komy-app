import { Dimensions } from 'react-native';

export const useDeviceType = () => {
  const { width } = Dimensions.get('window');
  return width < 768 ? 'mobile' : 'tablet';
};