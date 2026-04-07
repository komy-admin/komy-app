import React from 'react'
import { Text, StyleSheet } from 'react-native'

interface FormFieldErrorProps {
  message?: string
}

export const FormFieldError: React.FC<FormFieldErrorProps> = ({ message }) => {
  if (!message) return null
  return <Text style={styles.errorText}>{message}</Text>
}

const styles = StyleSheet.create({
  errorText: {
    fontSize: 12,
    color: '#EF4444',
    marginTop: 4,
    fontWeight: '500',
  },
})
