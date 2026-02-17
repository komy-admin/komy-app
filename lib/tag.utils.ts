export const getTagFieldTypeConfig = (fieldType: string): { bgColor: string; textColor: string } => {
  switch (fieldType) {
    case 'select':
      return { bgColor: '#DBEAFE', textColor: '#1D4ED8' };
    case 'multi-select':
      return { bgColor: '#EDE9FE', textColor: '#6D28D9' };
    case 'toggle':
      return { bgColor: '#D1FAE5', textColor: '#047857' };
    case 'number':
      return { bgColor: '#FDE68A', textColor: '#D97706' };
    case 'text':
      return { bgColor: '#FBCFE8', textColor: '#BE185D' };
    default:
      return { bgColor: '#E2E8F0', textColor: '#475569' };
  }
};

export const getFieldTypeConfig = (fieldType: string) => {
  switch (fieldType) {
    case 'select':
      return { bgColor: '#DBEAFE', textColor: '#1D4ED8', priceBgColor: '#BFDBFE' };
    case 'multi-select':
      return { bgColor: '#EDE9FE', textColor: '#6D28D9', priceBgColor: '#DDD6FE' };
    case 'toggle':
      return { bgColor: '#D1FAE5', textColor: '#047857', priceBgColor: '#A7F3D0' };
    case 'number':
      return { bgColor: '#FDE68A', textColor: '#D97706', priceBgColor: '#FCD34D' };
    case 'text':
      return { bgColor: '#FBCFE8', textColor: '#BE185D', priceBgColor: '#F9A8D4' };
    default:
      return { bgColor: '#E2E8F0', textColor: '#475569', priceBgColor: '#CBD5E1' };
  }
};

export const formatTagValue = (tag: any): string => {
  if (tag.value === null || tag.value === undefined) return '';
  if (typeof tag.value === 'boolean') return tag.value ? 'Oui' : 'Non';
  if (Array.isArray(tag.value)) return tag.value.join(', ');
  return String(tag.value);
};
