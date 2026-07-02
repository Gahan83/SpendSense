export const CATEGORY_META = {
  'Food & Dining':            { icon: 'restaurant',          color: '#4F46E5', tint: '#EEF0FE' },
  'Online Shopping':          { icon: 'shopping_bag',        color: '#2563EB', tint: '#E8F0FE' },
  'Fuel':                     { icon: 'local_gas_station',   color: '#0EA5E9', tint: '#E4F5FD' },
  'Utilities & Bills':        { icon: 'bolt',                color: '#0D9488', tint: '#E1F5F2' },
  'Transport & Cab':          { icon: 'local_taxi',          color: '#7C3AED', tint: '#F1EAFD' },
  'Vegetables & Fruits':      { icon: 'nutrition',           color: '#059669', tint: '#E3F5EC' },
  'Gym & Fitness':            { icon: 'fitness_center',      color: '#E11D48', tint: '#FCE7EC' },
  'Transfers (P2P)':          { icon: 'swap_horiz',          color: '#64748B', tint: '#EEF1F5' },
  'Subscriptions':            { icon: 'subscriptions',       color: '#C026D3', tint: '#FBEAFC' },
  'Health & Pharmacy':        { icon: 'medication',          color: '#0891B2', tint: '#E2F4F9' },
  'Entertainment & Outings':  { icon: 'confirmation_number', color: '#D97706', tint: '#FDF0E1' },
  'Clothing & Personal Care': { icon: 'checkroom',           color: '#9333EA', tint: '#F5EAFD' },
  'Metro Recharge':           { icon: 'tram',                color: '#16A34A', tint: '#E5F6EA' },
  'Parking':                  { icon: 'local_parking',       color: '#94A3B8', tint: '#F1F3F6' },
  'Travel':                   { icon: 'flight',              color: '#0284C7', tint: '#E3F2FC' },
  'Other':                    { icon: 'category',            color: '#64748B', tint: '#EEF1F5' },
}

export function getCategoryMeta(name) {
  return CATEGORY_META[name] || CATEGORY_META['Other']
}
