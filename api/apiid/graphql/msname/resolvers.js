const withFilter = require("graphql-subscriptions").withFilter;
const PubSub = require("graphql-subscriptions").PubSub;
const pubsub = new PubSub();
const { ApolloError } = require("apollo-server");
const { of } = require("rxjs");
const { map, mergeMap, catchError } = require('rxjs/operators');
const broker = require("../../broker/BrokerFactory")();
const RoleValidator = require('../../tools/RoleValidator');
const {handleError$} = require('../../tools/GraphqlResponseTools');

const INTERNAL_SERVER_ERROR_CODE = 1;
const PERMISSION_DENIED_ERROR_CODE = 2;
const contextName = "msname";

/**
 * map the response value or generate an Apollo error if result code is not 200
 * @param {Object} response Raw response from backend
 */
function getResponseFromBackEnd$(response){
    return of(response)
    .pipe(
        map(({result, data}) => {       
            if (result.code != 200 && result.error) {
                throw new ApolloError(result.error.msg, result.code, result.error );
            }
            return data;
        })
    );
}

/**
 * Validate user roles and send request to backend handler
 * @param {object} root root of GraphQl
 * @param {object} OperationArguments arguments for query or mutation
 * @param {object} context graphQl context
 * @param { Array } requiredRoles Roles required to use the query or mutation
 * @param {string} operationType  sample: query || mutation
 * @param {string} aggregateName sample: Vehicle, Client, FixedFile 
 * @param {string} methodName method name
 * @param {number} timeout timeout for query or mutation in milliseconds
 */
function sendToBackEndHandler$(root, OperationArguments, context, requiredRoles, operationType, aggregateName, methodName, timeout = 2000){  
    return RoleValidator.checkPermissions$(
      context.authToken.realm_access.roles,
      contextName,
      methodName,
      PERMISSION_DENIED_ERROR_CODE,
      "Permission denied",
      requiredRoles
    )
    .pipe(          
      mergeMap(() =>
        broker.forwardAndGetReply$(
          aggregateName,
          `emigateway.graphql.${operationType}.${methodName}`,
          { root, args: OperationArguments, jwt: context.encodedToken },
          timeout
        )
      ),          
      catchError(err => handleError$(err, methodName)),
      mergeMap(response => getResponseFromBackEnd$(response))
    )
}

module.exports = {

    //// QUERY ///////

    Query: {
        msnamepascalmsentitiespascal(root, args, context) {
            const requiredRoles = ["PLATFORM-ADMIN"];
            return sendToBackEndHandler$(root, args, context, requiredRoles, 'query', 'msentitypascal', 'msnamepascalmsentitiespascal')  
            .toPromise();
        },
        msnamepascalmsentitiespascalSize(root, args, context) {
            const requiredRoles = ["PLATFORM-ADMIN"];
            return sendToBackEndHandler$(root, args, context, requiredRoles, 'query', 'msentitypascal', 'msnamepascalmsentitiespascalSize')  
            .toPromise();
        },
        msnamepascalmsentitypascal(root, args, context) {
            const requiredRoles = ["PLATFORM-ADMIN"];
            return sendToBackEndHandler$(root, args, context, requiredRoles, 'query', 'msentitypascal', 'msnamepascalmsentitypascal')  
            .toPromise();
        }
    },

    ////// MUTATIONS ///////
    Mutation: {
        msnamepascalCreatemsentitypascal(root, args, context) {
            const requiredRoles = ["PLATFORM-ADMIN"];
            return sendToBackEndHandler$(root, args, context, requiredRoles, 'mutation', 'msentitypascal', 'msnamepascalCreatemsentitypascal')  
            .toPromise();
        },
        msnamepascalUpdatemsentitypascalGeneralInfo(root, args, context) {
            const requiredRoles = ["PLATFORM-ADMIN"];
            return sendToBackEndHandler$(root, args, context, requiredRoles, 'mutation', 'msentitypascal', 'msnamepascalUpdatemsentitypascalGeneralInfo')
            .toPromise();
        },
        msnamepascalUpdatemsentitypascalState(root, args, context) {
            const requiredRoles = ["PLATFORM-ADMIN"];
            return sendToBackEndHandler$(root, args, context, requiredRoles, 'mutation', 'msentitypascal', 'msnamepascalUpdatemsentitypascalState')  
            .toPromise();
        },        
    },

    ////// SUBSCRIPTIONS ///////
    Subscription: {
        msentitypascalUpdatedSubscription: {
            subscribe: withFilter(
                (payload, variables, context, info) => {
                    return pubsub.asyncIterator("msentitypascalUpdatedSubscription");
                },
                (payload, variables, context, info) => {
                    const READ_ROLES = ["PLATFORM-ADMIN"];
                    return  RoleValidator.hasPermissions(context.authToken.realm_access.roles,READ_ROLES);
                }
            )
        }

    }
};



//// SUBSCRIPTIONS SOURCES ////

const eventDescriptors = [
    {
        backendEventName: 'msentitypascalUpdatedSubscription',
        gqlSubscriptionName: 'msentitypascalUpdatedSubscription',
        dataExtractor: (evt) => evt.data,// OPTIONAL, only use if needed
        onError: (error, descriptor) => console.log(`Error processing ${descriptor.backendEventName}`),// OPTIONAL, only use if needed
        onEvent: (evt, descriptor) => console.log(`Event of type  ${descriptor.backendEventName} arrived`),// OPTIONAL, only use if needed
    },
];


/**
 * Connects every backend event to the right GQL subscription
 */
eventDescriptors.forEach(descriptor => {
    broker
        .getMaterializedViewsUpdates$([descriptor.backendEventName])
        .subscribe(
            evt => {
                if (descriptor.onEvent) {
                    descriptor.onEvent(evt, descriptor);
                }
                const payload = {};
                payload[descriptor.gqlSubscriptionName] = descriptor.dataExtractor ? descriptor.dataExtractor(evt) : evt.data
                pubsub.publish(descriptor.gqlSubscriptionName, payload);
            },

            error => {
                if (descriptor.onError) {
                    descriptor.onError(error, descriptor);
                }
                console.error(
                    `Error listening ${descriptor.gqlSubscriptionName}`,
                    error
                );
            },

            () =>
                console.log(
                    `${descriptor.gqlSubscriptionName} listener STOPPED`
                )
        );
});


