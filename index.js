const mongodb = require('mongodb');
const Database = require('./lib/database');
const Collection = require('./lib/collection');
const Cursor = require('./lib/cursor');
const Bulk = require('./lib/bulk');

function isValidCollectionName(name) {
  return typeof name === 'string' && name &&
    !(name.includes('$') || name.includes('\0') || name.startsWith('system.'));
}
module.exports = init
/**
 *
 * @param {*} connectionString
 * @param {*} options
 * @returns {Database}
 */
function init (connectionString, options) {
  const db = new Database(connectionString, options);
  const dbMethods = Object.create(null);

  return new Proxy(db, {
    get: function(obj, prop) {
      const dbProp = obj[prop];

      if (typeof dbProp === 'function') {
        //lazily cache function bound to underlying db
        dbMethods[prop] = dbMethods[prop] || dbProp.bind(db);
        return dbMethods[prop];
      }

      if (isValidCollectionName(prop)) {
        return db.collection(prop);
      }

      return dbProp;
    }
  });
}

// hack for joi error annotation to avoid cloning objectIds
mongodb.ObjectId.prototype.isImmutable = true;

const ObjectIdProxy = new Proxy(mongodb.ObjectId, {
  apply: function(target, thisArg, argumentsList) {
    return new mongodb.ObjectId(...argumentsList)
  }
})

function isMongoError(error) { return error?.name === 'MongoServerError' || error?.name === 'MongoError' }

// expose prototypes
module.exports.Database = Database
module.exports.Collection = Collection
module.exports.Cursor = Cursor
module.exports.Bulk = Bulk

// expose bson stuff visible in the shell
module.exports.Binary = mongodb.Binary
module.exports.Code = mongodb.Code
module.exports.DBRef = mongodb.DBRef
module.exports.Double = mongodb.Double
module.exports.Long = mongodb.Long
module.exports.NumberLong = mongodb.Long // Alias for shell compatibility
module.exports.MinKey = mongodb.MinKey
module.exports.MaxKey = mongodb.MaxKey
module.exports.ObjectId = ObjectIdProxy
module.exports.objectId = ObjectIdProxy
module.exports.Timestamp = mongodb.Timestamp
module.exports.isMongoError = isMongoError
// Add support for default ES6 module imports
module.exports.default = module.exports
