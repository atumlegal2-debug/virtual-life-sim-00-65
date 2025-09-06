// Utility to trigger global malnutrition cure for all active users
export const triggerGlobalMalnutritionCure = () => {
  // Dispatch custom event to all active components
  window.dispatchEvent(new CustomEvent('globalMalnutritionCure'));
  console.log('🔄 Global malnutrition cure event dispatched');
};

// Auto-trigger on page load to catch any users that need retroactive curing
if (typeof window !== 'undefined') {
  window.addEventListener('load', () => {
    setTimeout(() => {
      triggerGlobalMalnutritionCure();
    }, 2000); // Wait 2 seconds for components to load
  });
}