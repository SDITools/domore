class Dataset {
  constructor(domoClient) {
    this.domoClient = domoClient;
  }

  /* ====== Wrappers for existing Domo SDK functions ======= */
  async get(datasetId) {
    return this.domoClient.datasets.get(datasetId);
  }

  async list(limit, offset, sort) {
    return this.domoClient.datasets.list(limit, offset, sort);
  }

  async create(dataset) {
    return this.domoClient.datasets.create(dataset);
  }

  async update(datasetId, dataset) {
    return this.domoClient.datasets.update(datasetId, dataset);
  }

  async delete(datasetId) {
    return this.domoClient.datasets.delete(datasetId);
  }

  async importData(datasetId, csvData) {
    return this.domoClient.datasets.importData(datasetId, csvData)
  }

  async exportData(datasetId, csvData) {
    return this.domoClient.datasets.exportData(datasetId)
  }

  /* ====== The new stuff! ========== */

  /**
   * Returns all the datasets.
   *
   * @param {int} limit - Optional limit for pagination
   * @param {int} offset - Optional offset for pagination
   * @return Array of datasets
   */
  async getAll(limit = 50, offset = 0) {
    let datasetList = await this.list(limit, offset);
    if(datasetList.length === limit) {
      // Get the next page
      let nextPage = await this.getAll(limit, limit + offset);
      return datasetList.concat(nextPage);
    } else {
      // We're on the last page
      return datasetList;
    }
  }

  /**
   * Returns the first dataset to satisfy the callback function, similar to Array#find.
   * If no dataset is found, returns undefined
   *
   * The callback receives (element, index)
   * @return Promise (resolves to a dataset or undefined)
   */
  async find(callback) {
    let datasets = await this.getAll()
    return datasets.find((element, index) => callback(element, index))
  }
}

module.exports = Dataset;
