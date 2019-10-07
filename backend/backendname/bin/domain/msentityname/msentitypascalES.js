'use strict'

const { of } = require("rxjs");
const { mergeMap, tap } = require('rxjs/operators');

const { brokerFactory } = require("@nebulae/backend-node-tools").broker;
const { ConsoleLogger } = require('@nebulae/backend-node-tools').log;

const broker = brokerFactory();
const msentitypascalDA = require('./data-access/msentitypascalDA');
const MATERIALIZED_VIEW_TOPIC = process.env.EMI_MATERIALIZED_VIEW_UPDATES_TOPIC;
/**
 * Singleton instance
  * @type { msentitypascalES }
 */
let instance;

class msentitypascalES {

    constructor() {
    }

    /**     
     * Generates and returns an object that defines the Event-Sourcing events handlers.
     * 
     * The map is a relationship of: AGGREGATE_TYPE VS { EVENT_TYPE VS  { fn: rxjsFunction, instance: invoker_instance } }
     * 
     * ## Example
     *  { "User" : { "UserAdded" : {fn: handleUserAdded$, instance: classInstance } } }
     */
    generateEventProcessorMap() {
        return {
            'msentitypascal': {
                "updated": { fn: instance.handlemsentitypascalUpdated$, instance,  processOnlyOnSync: true },
            }
        }
    };


    /**
     * Handles msentitypascal updated event 
     * @param {*} msentitypascalUpdated msentitypascal updated event
     */
    handlemsentitypascalUpdated$({ aid, data, user, timestamp }) {
        const updateFields = {...data};
        return msentitypascalDA.updatemsentitypascal$(aid, updateFields, user, timestamp);
    }
   
}


/**
 * @returns {msentitypascalES}
 */
module.exports = () => {
    if (!instance) {
        instance = new msentitypascalES();
        ConsoleLogger.i(`${instance.constructor.name} Singleton created`);
    }
    return instance;
};