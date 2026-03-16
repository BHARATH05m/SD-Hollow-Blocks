// Utility functions for handling image URLs

const API_BASE_URL = 'http://localhost:4000';

/**
 * Get the full URL for an image
 * @param {string} imagePath - The image path from the database
 * @returns {string} - The full URL for the image
 */
export const getImageUrl = (imagePath) => {
  if (!imagePath) return '';
  
  // If it's already a full URL, return as is
  if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) {
    return imagePath;
  }
  
  // If it's an uploaded file, prepend the API base URL
  if (imagePath.startsWith('/uploads/')) {
    return `${API_BASE_URL}${imagePath}`;
  }
  
  // For static files in public folder, return as is (they're served by Vite in dev)
  return imagePath;
};

/**
 * Get image URLs for a product
 * @param {object} product - The product object
 * @returns {object} - Object with thumbnail and backView URLs
 */
export const getProductImageUrls = (product) => {
  return {
    thumbnail: getImageUrl(product.imageThumbnail || product.image),
    backView: getImageUrl(product.imageBackView || product.image),
  };
};