"use strict";

const uuidv4 = require("uuid/v4");
const { of } = require("rxjs");
const { mergeMap, catchError, map, toArray, tap, mapTo } = require('rxjs/operators');

const Event = require("@nebulae/event-store").Event;
const { CqrsResponseHelper } = require('@nebulae/backend-node-tools').cqrs;
const { ConsoleLogger } = require('@nebulae/backend-node-tools').log;
const { CustomError, INTERNAL_SERVER_ERROR_CODE, PERMISSION_DENIED } = require("@nebulae/backend-node-tools").error;

const eventSourcing = require("../../tools/event-sourcing").eventSourcing;
const msentitypascalDA = require("./data-access/msentitypascalDA");

const READ_ROLES = ["PLATFORM-ADMIN"];
const WRITE_ROLES = ["PLATFORM-ADMIN"];
const REQUIRED_ATTRIBUTES = [];

/**
 * Singleton instance
 * @type {msentitypascalCQRS}
 */
let instance;

class msentitypascalCQRS {
  constructor() {
  }

  /**     
   * Generates and returns an object that defines the CQRS request handlers.
   * 
   * The map is a relationship of: AGGREGATE_TYPE VS { MESSAGE_TYPE VS  { fn: rxjsFunction, instance: invoker_instance } }
   * 
   * ## Example
   *  { "CreateUser" : { "somegateway.someprotocol.mutation.CreateUser" : {fn: createUser$, instance: classInstance } } }
   */
  generateRequestProcessorMap() {
    return {
      'msentitypascal': {
        "emigateway.graphql.query.msnamepascalmsentitiespascal": { fn: instance.getmsentitypascalList$, instance, jwtValidation: { roles: READ_ROLES, attributes: REQUIRED_ATTRIBUTES } },
        "emigateway.graphql.query.msnamepascalmsentitiespascalSize": { fn: instance.getmsentitypascalListSize$, instance, jwtValidation: { roles: READ_ROLES, attributes: REQUIRED_ATTRIBUTES } },
        "emigateway.graphql.query.msnamepascalmsentitypascal": { fn: instance.getmsentitypascal$, instance, jwtValidation: { roles: READ_ROLES, attributes: REQUIRED_ATTRIBUTES } },
        "emigateway.graphql.mutation.msnamepascalCreatemsentitypascal": { fn: instance.createmsentitypascal$, instance, jwtValidation: { roles: WRITE_ROLES, attributes: REQUIRED_ATTRIBUTES } },
        "emigateway.graphql.mutation.msnamepascalUpdatemsentitypascalState": { fn: instance.updatemsentitypascalStatus$, jwtValidation: { roles: WRITE_ROLES, attributes: REQUIRED_ATTRIBUTES } },
        "emigateway.graphql.mutation.msnamepascalUpdatemsentitypascalGeneralInfo": { fn: instance.updatemsentitypascalGeneralInfo$, jwtValidation: { roles: WRITE_ROLES, attributes: REQUIRED_ATTRIBUTES } },
      }
    }
  };

  /**
   * Emit event
   * @param {*} msentitypascal 
   * @param {*} authToken
   */
  static emitEvent$(msentitypascalId, msentitypascalDataChange, authToken) {
    return of(msentitypascalDataChange).pipe(
      mergeMap(data => eventSourcing.emitEvent$(
        new Event({
          eventType: "Updated",
          eventTypeVersion: 1,
          aggregateType: 'msentitypascal',
          aggregateId: msentitypascalId,
          data: data,
          user: authToken.preferred_username
      })))
    )
  }

  /**  
   * Gets the msentitypascal
   *
   * @param {*} args args
   */
  getmsentitypascal$({ args }, authToken) {
    const { id } = args;
    return msentitypascalDA.getmsentitypascal$(id).pipe(
      mergeMap(rawResponse => CqrsResponseHelper.buildSuccessResponse$(rawResponse)),
      catchError(err => CqrsResponseHelper.handleError$(err))
    );
  }

  /**  
   * Gets the msentitypascal list
   *
   * @param {*} args args
   */
  getmsentitypascalList$({ args }, authToken) {
    const { filterInput, paginationInput } = args;
    return msentitypascalDA.getmsentitypascalList$(filterInput, paginationInput).pipe(
      toArray(),
      mergeMap(rawResponse => CqrsResponseHelper.buildSuccessResponse$(rawResponse)),
      catchError(err => CqrsResponseHelper.handleError$(err))
    );
  }

  /**  
 * Gets the amount of the msentitypascal according to the filter
 *
 * @param {*} args args
 */
getmsentitypascalListSize$({ args }, authToken) {
    const { filterInput } = args;
    return msentitypascalDA.getmsentitypascalSize$(filterInput).pipe(
      mergeMap(rawResponse => CqrsResponseHelper.buildSuccessResponse$(rawResponse)),
      catchError(err => CqrsResponseHelper.handleError$(err))
    );
  }

  /**
  * Create a msentitypascal
  */
 createmsentitypascal$({ root, args, jwt }, authToken) {
    const { enabled, generalInfo } = args.input;
    const msentitypascal = {
      _id: uuidv4(),
      enabled: enabled,
      generalInfo: {
        name: generalInfo.name,
        description: generalInfo.description,
      },
      creatorUser: authToken.preferred_username,
      creationTimestamp: Date.now(),
      modifierUser: authToken.preferred_username,
      modificationTimestamp: Date.now()
    };

  
    return msentitypascalDA.createmsentitypascal$(msentitypascal)
    .pipe(
      mergeMap(msentitypascalCreated => 
        of(msentitypascalCreated).pipe(
          map(msentitypascalData => ({
            _id: msentitypascalData._id,
            enabled: msentitypascalData.enabled,
            generalInfo: {
              name: msentitypascalData.generalInfo.name,
              description: msentitypascalData.generalInfo.description
          }})),
          mergeMap(generalInfo => msentitypascalCQRS.emitEvent$(msentitypascal._id, generalInfo, authToken)),
          mapTo(msentitypascalCreated)
        )
      ),
      mergeMap(response => CqrsResponseHelper.buildSuccessResponse$(response)),
      catchError(err => CqrsResponseHelper.handleError$(err))
    );
  }

  /**
 * Edit the msentitypascal general info
 */
updatemsentitypascalGeneralInfo$({ root, args, jwt }, authToken) {
    const { id, input} = args;
    return msentitypascalDA.updatemsentitypascalGeneralInfo$(id, input, authToken.preferred_username, Date.now())
    .pipe(
      mergeMap(msentitypascalUpdated => 
        of(msentitypascalUpdated).pipe(
          map(msentitypascalData => ({generalInfo: msentitypascalData.generalInfo})),
          mergeMap(generalInfo => msentitypascalCQRS.emitEvent$(id, generalInfo, authToken)),
          mapTo(msentitypascalUpdated)
        )
      ),
      mergeMap(response => CqrsResponseHelper.buildSuccessResponse$(response)),
      catchError(err => CqrsResponseHelper.handleError$(err))
    );
  }


  /**
   * Edit the msentitypascal status
   */
  updatemsentitypascalStatus$({ root, args, jwt }, authToken) {
    const { id, enabled } = args;
    console.log(enabled);
    return msentitypascalDA.updatemsentitypascalStatus$(id, enabled, authToken.preferred_username, Date.now())
    .pipe(
      mergeMap(msentitypascalUpdated => 
        of(msentitypascalUpdated).pipe(
          tap(() => console.log('msentitypascalUpdated => ', msentitypascalUpdated)),
          map(msentitypascalData => ({enabled: msentitypascalData.enabled})),
          mergeMap(status => msentitypascalCQRS.emitEvent$(id, status, authToken)),
          mapTo(msentitypascalUpdated)
        )
      ),
      mergeMap(response => CqrsResponseHelper.buildSuccessResponse$(response)),
      catchError(err => CqrsResponseHelper.handleError$(err))
    );
  }

  //#endregion
}

/**
 * @returns {msentitypascalCQRS}
 */
module.exports = () => {
  if (!instance) {
    instance = new msentitypascalCQRS();
    ConsoleLogger.i(`${instance.constructor.name} Singleton created`);
  }
  return instance;
};
