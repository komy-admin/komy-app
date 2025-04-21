export interface ValidationRule {
  required?: boolean | ((value: any, data: any) => boolean);
  minLength?: number;
  maxLength?: number;
  pattern?: RegExp;
  email?: boolean;
  phone?: boolean;
  custom?: (value: any) => boolean;
  message?: string;
}

export interface ValidationRules {
  [key: string]: ValidationRule;
}

export interface ValidationError {
  field: string;
  message: string;
}

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_REGEX = /^[+]?[(]?[0-9]{3}[)]?[-\s.]?[0-9]{3}[-\s.]?[0-9]{4,6}$/;

export function validateForm(data: any, rules: ValidationRules): ValidationError[] {
  const errors: ValidationError[] = [];

  Object.entries(rules).forEach(([field, rule]) => {
    const value = data[field];

    // Required field validation
    if (rule.required) {
      const isRequired = typeof rule.required === 'function' 
        ? rule.required(value, data)
        : rule.required;

      if (isRequired && (value === undefined || value === null || value === '')) {
        errors.push({
          field,
          message: rule.message || `Le champ ${field} est requis`,
        });
        return;
      }
    }

    if (value) {
      // Email validation
      if (rule.email && !EMAIL_REGEX.test(value)) {
        errors.push({
          field,
          message: rule.message || `L'adresse email n'est pas valide`,
        });
      }

      // Phone validation
      if (rule.phone && !PHONE_REGEX.test(value)) {
        errors.push({
          field,
          message: rule.message || `Le numéro de téléphone n'est pas valide`,
        });
      }

      // Min length validation
      if (rule.minLength && value.length < rule.minLength) {
        errors.push({
          field,
          message: rule.message || `Le champ doit contenir au moins ${rule.minLength} caractères`,
        });
      }

      // Max length validation
      if (rule.maxLength && value.length > rule.maxLength) {
        errors.push({
          field,
          message: rule.message || `Le champ ne doit pas dépasser ${rule.maxLength} caractères`,
        });
      }

      // Pattern validation
      if (rule.pattern && !rule.pattern.test(value)) {
        errors.push({
          field,
          message: rule.message || `Le format n'est pas valide`,
        });
      }

      // Custom validation
      if (rule.custom && !rule.custom(value)) {
        errors.push({
          field,
          message: rule.message || `La validation personnalisée a échoué`,
        });
      }
    }
  });

  return errors;
}