/**
 * Product catalog configuration constants
 */

export const PRODUCT_CARD_CONFIG = {
  DEFAULT_IMAGE: 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=300&h=300&fit=crop&crop=center',
  GRADIENT_BACKGROUND: 'linear-gradient(298deg, #CADEFF 49.51%, #FFF 116.51%)',
  DEFAULT_CATEGORY_COLOR: '#3B82F6',
} as const;

export const GRID_CONFIG = {
  MOBILE_COLUMNS: 1,
  TABLET_COLUMNS: 2,
  DESKTOP_COLUMNS: 2,
  LARGE_DESKTOP_COLUMNS: 3,
  EXTRA_LARGE_COLUMNS: 4,
  GAP_SIZES: {
    MOBILE: 4,
    TABLET: 6,
    DESKTOP: 8,
  },
} as const;

export const STOCK_THRESHOLDS = {
  LOW_STOCK: 5,
  OUT_OF_STOCK: 0,
} as const;

export const PRICE_CONFIG = {
  CURRENCY: 'USD',
  DECIMAL_PLACES: 2,
} as const;

export const CATEGORY_COLORS = {
  GENERAL: '#3B82F6',
  SPECIALTY: '#8B5CF6',
  PREMIUM: '#F59E0B',
  WELLNESS: '#10B981',
} as const; 