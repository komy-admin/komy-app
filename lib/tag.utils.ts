import { colors } from '~/theme';

export const getTagFieldTypeConfig = (fieldType: string): { bgColor: string; textColor: string } => {
  switch (fieldType) {
    case 'select':
      return { bgColor: colors.info.bg, textColor: colors.info.text };
    case 'multi-select':
      return { bgColor: colors.neutral[100], textColor: colors.purple.alt };
    case 'toggle':
      return { bgColor: colors.success.bg, textColor: colors.success.text };
    case 'number':
      return { bgColor: colors.warning.border, textColor: colors.warning.dark };
    case 'text':
      return { bgColor: colors.pink, textColor: colors.pink };
    default:
      return { bgColor: colors.neutral[200], textColor: colors.neutral[600] };
  }
};

export const getFieldTypeConfig = (fieldType: string) => {
  switch (fieldType) {
    case 'select':
      return { bgColor: colors.info.bg, textColor: colors.info.text, priceBgColor: colors.info.bg };
    case 'multi-select':
      return { bgColor: colors.neutral[100], textColor: colors.purple.alt, priceBgColor: colors.neutral[200] };
    case 'toggle':
      return { bgColor: colors.success.bg, textColor: colors.success.text, priceBgColor: colors.success.border };
    case 'number':
      return { bgColor: colors.warning.border, textColor: colors.warning.dark, priceBgColor: colors.warning.border };
    case 'text':
      return { bgColor: colors.pink, textColor: colors.pink, priceBgColor: colors.pink };
    default:
      return { bgColor: colors.neutral[200], textColor: colors.neutral[600], priceBgColor: colors.neutral[300] };
  }
};

export const formatTagValue = (tag: any): string => {
  if (tag.value === null || tag.value === undefined) return '';
  if (typeof tag.value === 'boolean') return tag.value ? 'Oui' : 'Non';
  if (Array.isArray(tag.value)) return tag.value.join(', ');
  return String(tag.value);
};
