var CONF = require('../config/' + process.env.NODE_ENV + '/conf');

const {DomoClient} = require('domo-sdk');
const {API_SCOPE} = require('domo-sdk/dist/common/Constants');
const clientId = CONF.domoApiAuth.clientId;
const clientSecret = CONF.domoApiAuth.clientSecret;
const host = 'api.domo.com';
const scopes = [API_SCOPE.USER];

const domo = new DomoClient(clientId, clientSecret, scopes, host);

const domoUser = require('./domoUser');

const exported = {
  getGroup: async function(groupId) {
    return domo.groups.get(groupId);
  },

  getGroupByName: async function(groupName, limit = 500, offset = 0) {
    const groupList = await domo.groups.list(limit, offset);
    const group = groupList.find( (grp) => grp.name === groupName);
    if(group) {
      return group;
    } else if(groupList.length === limit) {
      // Check the next page
      return this.getGroupByName(groupName, limit, limit + offset);
    } else {
      return Promise.reject(new Error(`group ${groupName} not found`));
    }
  },

  getGroupUsers: async function(groupId, limit = 500, offset = 0) {
    const userList = await domo.groups.listUsers(groupId, limit, offset);
    if(userList.length === limit) {
      // Get the next page of users
      const nextPageUsers = await this.getGroupUsers(groupId, limit, limit + offset);
      return userList.concat(nextPageUsers);
    } else {
      // We're on the last page
      return userList;
    }
  },

  getGroupWithMembers: async function(groupId) {
    const p1 = this.getGroupUsers(groupId);
    const p2 = domoUser.getAllUsers();
    const p3 = this.getGroup(groupId);

    const groupUserIds = await p1;
    const allUsers = await p2;

    const memberList = groupUserIds.map( (userId) => allUsers.find( (user) => user.id === userId))
      .filter( (user) => !!user);

    const group = await p3;

    group.members = memberList;
    return group;
  },

  addUser: async function(groupId, userId) {
    return domo.groups.addUser(groupId, userId);
  }
};


module.exports = exported;
