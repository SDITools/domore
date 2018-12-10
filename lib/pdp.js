class Pdp {
  constructor(domoClient) {
    this.domoClient = domoClient;
  }

  /* ====== Wrappers for existing Domo SDK functions ======= */
  async create(datasetId, policy) {
    return this.domoClient.policies.create(datasetId, policy)
  }

  async get(datasetId, policyId) {
    return this.domoClient.policies.get(datasetId, policyId)
  }

  async update(datasetId, policyId, policy) {
    return this.domoClient.policies.update(datasetId, policyId, policy)
  }

  async list(datasetId) {
    return this.domoClient.policies.list(datasetId)
  }

  async delete(datasetId, policyId) {
    return this.domoClient.policies.delete(datasetId, policyId)
  }

  /* ====== The new stuff! ========== */
  async find(datasetId, searchName) {
    const list = await this.list(datasetId);
    return list.find(({ name }) => name === searchName);
  }
}

module.exports = Pdp;
