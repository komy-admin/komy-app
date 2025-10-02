export type TagFieldType = 'select' | 'multi-select' | 'number' | 'text' | 'toggle'

export interface TagConfig {
  minSelection?: number
  maxSelection?: number
  min?: number
  max?: number
  defaultValue?: any
  placeholder?: string
}

export interface Tag {
  id: string
  accountId: string
  name: string
  label: string
  fieldType: TagFieldType
  isRequired: boolean
  config: TagConfig | null
  position: number
  options?: TagOption[]
  createdAt: string
  updatedAt: string
}

export interface TagOption {
  id: string
  tagId: string
  value: string
  label: string
  priceModifier: number | null
  isDefault: boolean
  position: number
  accountId: string
  createdAt: string
  updatedAt: string
}
