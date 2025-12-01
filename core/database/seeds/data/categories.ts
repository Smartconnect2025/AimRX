/**
 * Categories seed data for development, testing, and demonstration
 *
 * This data supports realistic testing of:
 * - Product categorization and organization
 * - Category management in admin dashboard
 * - Product filtering by categories
 * - Storefront category navigation
 */

export const categoriesData = [
  {
    name: "Weight Loss",
    slug: "weight-loss",
    description:
      "Clinically proven weight loss medications and natural supplements to support your weight management goals",
    color: "#3B82F6",
    image_url:
      "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=300&h=300&fit=crop&crop=center",
    display_order: 1,
    is_active: true,
  },
  {
    name: "Supplements",
    slug: "supplements",
    description:
      "Essential vitamins, minerals, and nutritional supplements for optimal health and wellness",
    color: "#10B981",
    image_url:
      "https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=300&h=300&fit=crop&crop=center",
    display_order: 2,
    is_active: true,
  },
  {
    name: "Digestive",
    slug: "digestive",
    description:
      "Probiotics, fiber supplements, and digestive support products for gut health",
    color: "#8B5CF6",
    image_url:
      "https://images.unsplash.com/photo-1607619056574-7b8d3ee536b2?w=300&h=300&fit=crop&crop=center",
    display_order: 3,
    is_active: true,
  },
  {
    name: "Heart Health",
    slug: "heart-health",
    description:
      "Cardiovascular support supplements including omega-3s and heart-healthy nutrients",
    color: "#EF4444",
    image_url:
      "https://images.unsplash.com/photo-1559757148-5c350d0d3c56?w=300&h=300&fit=crop&crop=center",
    display_order: 4,
    is_active: true,
  },
];
