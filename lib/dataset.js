class Dataset {
  constructor(domoClient) {
    this.domoClient = domoClient;
  }

  /* ====== Wrappers for existing Domo SDK functions ======= */
  async get(datasetId) {
    return this.domoClient.datasets.get(datasetId);
  }

  async list(limit, offset) {
    return this.domoClient.datasets.list(limit, offset);
  }

  async create(dataset) {
    return this.domoClient.datasets.create(dataset);
  }

  /* ====== The new stuff! ========== */
}

module.exports = Dataset;
