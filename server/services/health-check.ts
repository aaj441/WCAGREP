export const healthCheck = {
  async checkHealth(url: string) {
    return { status: "ok", responseTime: 100 };
  },
  async batchCheck(urls: string[]) {
    return urls.map(url => ({ url, status: "ok", responseTime: 100 }));
  },
  getStats() {
    return { totalChecks: 0, cacheHits: 0 };
  },
  clearCache() {}
};
