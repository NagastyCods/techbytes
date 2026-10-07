// Single import point: const { User, Post } = require('../models');
module.exports = {
  User: require('./User'),
  Category: require('./Category'),
  Tag: require('./Tag'),
  Post: require('./Post'),
  Comment: require('./Comment'),
  Subscriber: require('./Subscriber')
};
