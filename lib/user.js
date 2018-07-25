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

  /* ====== The new stuff! ========== */
  async getAll(limit = 500, offset = 0) {
    let userList = await this.list(limit, offset);
    if(userList.length === limit) {
      // Get the next page of users
      let nextPageUsers = await getAllUsers(limit, limit + offset);
      return userList.concat(nextPageUsers);
    } else {
      // We're on the last page
      return userList;
    }
  }
}

module.exports = User;
