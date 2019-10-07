"use strict";

let mongoDB = undefined;
const { map } = require("rxjs/operators");
const { of, Observable, defer } = require("rxjs");

const { CustomError } = require("@nebulae/backend-node-tools").error;

const CollectionName = 'msentitypascal';

class msentitypascalDA {
  static start$(mongoDbInstance) {
    return Observable.create(observer => {
      if (mongoDbInstance) {
        mongoDB = mongoDbInstance;
        observer.next(`${this.name} using given mongo instance`);
      } else {
        mongoDB = require("../../../tools/mongo-db/MongoDB").singleton();
        observer.next(`${this.name} using singleton system-wide mongo instance`);
      }
      observer.next(`${this.name} started`);
      observer.complete();
    });
  }

  /**
   * Gets an user by its username
   */
  static getmsentitypascal$(id) {
    const collection = mongoDB.db.collection(CollectionName);

    const query = {
      _id: id
    };
    return defer(() => collection.findOne(query));
  }

  /**
   * Gets msentitypascal by its ids
   * @param {*} msentitypascalIds msentitypascal ids
   */
  static getmsentitypascalByIds$(msentitypascalIds) {
    const collection = mongoDB.db.collection(CollectionName);

    const query = {
      _id: {$in: msentitypascalIds}
    };
    return defer(() => collection.find(query).toArray());
  }

  static getmsentitypascalList$(filter, pagination) {
    const collection = mongoDB.db.collection(CollectionName);

    const query = {
    };

    if (filter.name) {
      query["generalInfo.name"] = { $regex: filter.name, $options: "i" };
    }

    if (filter.creationTimestamp) {
      query.creationTimestamp = {$gte:  filter.creationTimestamp };
    }

    if (filter.creatorUser) {
      query.creatorUser = { $regex: filter.creatorUser, $options: "i" };
    }

    if (filter.modifierUser) {
      query.modifierUser = { $regex: filter.modifierUser, $options: "i" };
    }

    const cursor = collection
      .find(query)
      .skip(pagination.count * pagination.page)
      .limit(pagination.count)
      .sort({ creationTimestamp: pagination.sort });

    return mongoDB.extractAllFromMongoCursor$(cursor);
  }

  static getmsentitypascalSize$(filter) {
    const collection = mongoDB.db.collection(CollectionName);

    const query = {
    };

    if (filter.name) {
      query["generalInfo.name"] = { $regex: filter.name, $options: "i" };
    }

    if (filter.creationTimestamp) {
      query.creationTimestamp = filter.creationTimestamp;
    }

    if (filter.creatorUser) {
      query.creatorUser = { $regex: filter.creatorUser, $options: "i" };
    }

    if (filter.modifierUser) {
      query.modifierUser = { $regex: filter.modifierUser, $options: "i" };
    }

    return defer(() => collection.countDocuments(query));
  }

  /**
   * Creates a new msentitypascal
   * @param {*} msentitypascal msentitypascal to create
   */
  static createmsentitypascal$(msentitypascal) {
    const collection = mongoDB.db.collection(CollectionName);
    return defer(() => collection.insertOne(msentitypascal))
    .pipe(
      map(response => response.ops[0])
    );
  }


  /**
* modifies the general info of the indicated msentitypascal 
* @param {*} id  msentitypascal ID
* @param {*} msentitypascalGeneralInfo  New general information of the msentitypascal
*/
  static updatemsentitypascalGeneralInfo$(_id, generalInfo, modifierUser, modificationTimestamp) {
    const collection = mongoDB.db.collection(CollectionName);
    return defer(() =>
      collection.findOneAndUpdate(
        { _id },
        {
          $set: { generalInfo, modifierUser, modificationTimestamp }
        }, {
          returnOriginal: false
        }
      )
    ).pipe(
      map(result => result && result.value ? result.value : undefined)
    );
  }

  /**
   * Updates the msentitypascal status 
   * @param {string} id msentitypascal ID
   * @param {boolean} enabled boolean that indicates if the msentitypascal is enabled
   */
  static updatemsentitypascalStatus$(_id, enabled, modifierUser, modificationTimestamp) {
    const collection = mongoDB.db.collection(CollectionName);

    return defer(() =>
      collection.findOneAndUpdate(
        { _id },
        {
          $set: { enabled, modifierUser, modificationTimestamp }
        }, 
        {
          returnOriginal: false
        }
      )
    ).pipe(
      map(result => result && result.value ? result.value : undefined)
    );
  }


    /**
   * Updates the msentitypascal info 
   * @param {string} id msentitypascal ID
   * @param {boolean} updateFields fields to update
   * @param {string} user user that performs the operation
   * @param {modificationTimestamp} modificationTimestamp timestamp when the operation was performed
   */
  static updatemsentitypascal$(_id, updateFields, user, modificationTimestamp) {
    const collection = mongoDB.db.collection(CollectionName);

    return defer(() =>
      collection.findOneAndUpdate(
        { _id },
        {
          $set: { ...updateFields, modifierUser: user, modificationTimestamp: modificationTimestamp },
          $setOnInsert: { creatorUser: user, creationTimestamp: modificationTimestamp }
        }, 
        {
          upsert: true
        }
      )
    );
  }

}
/**
 * @returns {msentitypascalDA}
 */
module.exports = msentitypascalDA;
