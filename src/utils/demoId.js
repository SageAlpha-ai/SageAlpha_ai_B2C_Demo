/**
 * Demo ID utility for tracking demo users
 * Generates and stores a unique ID in localStorage for persistent tracking
 */

const DEMO_ID_KEY = 'sagealpha_demo_id';

/**
 * Get or create demo ID
 * @returns {string} Demo ID (UUID)
 */
export function getDemoId() {
  // Check if demo ID already exists in localStorage
  let demoId = localStorage.getItem(DEMO_ID_KEY);
  
  if (!demoId) {
    // Generate a new UUID v4
    demoId = generateUUID();
    localStorage.setItem(DEMO_ID_KEY, demoId);
  }
  
  return demoId;
}

/**
 * Generate a UUID v4
 * @returns {string} UUID
 */
function generateUUID() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

/**
 * Get headers with demo ID for API requests
 * @returns {Object} Headers object with x-demo-id
 */
export function getDemoHeaders() {
  return {
    'x-demo-id': getDemoId()
  };
}
