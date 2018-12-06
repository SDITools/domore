class User {
  constructor(domoClient) {
    this.domoClient = domoClient;
  }

  /* ====== Wrappers for existing Domo SDK functions ======= */
  async get(userId) {
    return this.domoClient.users.get(userId);
  }

  async list(limit, offset) {
    return this.domoClient.users.list(limit, offset);
  }

  async create(user, sendInvite) {
    return this.domoClient.users.create(user, sendInvite);
  }

  /* ====== The new stuff! ========== */
  async getAll(limit = 500, offset = 0) {
    let list = await this.list(limit, offset);
    if(list.length === limit) {
      // Get the next page of users
      let nextPageUsers = await getUsers(limit, limit + offset);
      return list.concat(nextPageUsers);
    } else {
      // We're on the last page
      return list;
    }
  }
}

module.exports = User;
