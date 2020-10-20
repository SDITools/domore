const pLimit = require('p-limit');
const defaultLimit = 5;

class Group {
  constructor(domoClient) {
    this.domoClient = domoClient;
  }

  async get(groupId) {
    return this.domoClient.groups.get(groupId);
  }

  async list(limit, offset) {
    return this.domoClient.groups.list(limit, offset);
  }

  async create(group) {
    return this.domoClient.groups.create(group);
  }

  async update(id, group) {
    return this.domoClient.groups.update(id, group);
  }

  async delete(id) {
    await this.removeAllUsers(id);
    return this.domoClient.groups.delete(id);
  }

  async listUsers(id, limit, offset) {
    return this.domoClient.groups.listUsers(id, limit, offset);
  }

  async addUser(id, userId) {
    return this.domoClient.groups.addUser(id, userId);
  }

  async removeUser(id, userId) {
    return this.domoClient.groups.removeUser(id, userId);
  }

  /* ====== The new stuff! ========== */
  async getAll(limit = 500, offset = 0) {
    const list = await this.list(limit, offset);
    if(list.length === limit) {
      const nextPage = await this.getAll(limit, limit + offset);
      return list.concat(nextPage)
    } else {
      return list;
    }
  }

  async findByName(groupName, cachedGroups) {
    const listPromise = cachedGroups ? cachedGroups : this.getAll();
    const list = await listPromise;
    return list.find(({ name }) => name === groupName);
  }

  async listAllUsers(id, limit = 500, offset = 0) {
    const list = await this.listUsers(id, limit, offset);
    if(list.length === limit) {
      const nextPage = await this.listAllUsers(id, limit, limit + offset);
      return list.concat(nextPage);
    } else {
      return list;
    }
  }

  async removeAllUsers(id) {
    const groupUserIds = await this.listAllUsers(id)
    let responses = []
    for (const userId of groupUserIds) {
      const response = await this.removeUser(id, userId)
      responses = [...responses, response]
    }
    return responses
  }

  async setUsers(id, userIds, maxLimit) {
    const limit = pLimit(maxLimit || defaultLimit);
    const groupUserIds = await this.listAllUsers(id);
    const existingUserIds = new Set(groupUserIds);
    const newUserIds = new Set(userIds);

    const userIdsToDelete = [...existingUserIds].filter(x => !newUserIds.has(x));
    const userIdsToAdd = [...newUserIds].filter(x => !existingUserIds.has(x));

    const removals = userIdsToDelete.map(userId => limit(() => this.removeUser(id, userId)));
    const additions = userIdsToAdd.map(userId => limit(() => this.addUser(id, userId)));
    return Promise.all([...removals, ...additions]);
  }

  async upsert(group, cachedGroups) {
    const foundGroup = await this.findByName(group.name, cachedGroups)
    return foundGroup || this.create(group)
  }
};

module.exports = Group;
