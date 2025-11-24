export const dataOptimizer = {
  trackAPICall(endpoint: string, cached: boolean, duration: number) {},
  generateReport() {
    return { totalCalls: 0, cachedCalls: 0 };
  },
  getQuickStats() {
    return { totalCalls: 0, cachedPercentage: 0 };
  },
  reset() {}
};
