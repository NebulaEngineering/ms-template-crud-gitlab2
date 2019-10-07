import gql from "graphql-tag";

// We use the gql tag to parse our query string into a query document
export const msnamepascalmsentitypascal = gql`
  query msnamepascalmsentitypascal($id: String!) {
    msnamepascalmsentitypascal(id: $id) {
      _id
      generalInfo {
        name
        description
      }
      enabled
      creationTimestamp
      creatorUser
      modificationTimestamp
      modifierUser
    }
  }
`;

export const msnamepascalmsentitiespascal = gql`
  query msnamepascalmsentitiespascal($filterInput: msnamepascalmsentitypascalFilterInput!, $paginationInput: msnamepascalmsentitypascalPaginationInput!) {
    msnamepascalmsentitiespascal(filterInput: $filterInput, paginationInput: $paginationInput) {
      _id
      generalInfo {
        name
        description
      }
      enabled
      creationTimestamp
      creatorUser
      modificationTimestamp
      modifierUser
    }
  }
`;

export const msnamepascalmsentitiespascalSize = gql`
  query msnamepascalmsentitiespascalSize($filterInput: msnamepascalmsentitypascalFilterInput!) {
    msnamepascalmsentitiespascalSize(filterInput: $filterInput)
  }
`;

export const msnamepascalCreatemsentitypascal = gql `
  mutation msnamepascalCreatemsentitypascal($input: msnamepascalmsentitypascalInput!){
    msnamepascalCreatemsentitypascal(input: $input){
      _id
      generalInfo {
        name
        description
      }
      enabled
      creationTimestamp
      creatorUser
      modificationTimestamp
      modifierUser
    }
  }
`;

export const msnamepascalUpdatemsentitypascalGeneralInfo = gql `
  mutation msnamepascalUpdatemsentitypascalGeneralInfo($id: ID!, $input: msnamepascalmsentitypascalGeneralInfoInput!){
    msnamepascalUpdatemsentitypascalGeneralInfo(id: $id, input: $input){
      _id
      generalInfo {
        name
        description
      }
      enabled
      creationTimestamp
      creatorUser
      modificationTimestamp
      modifierUser
    }
  }
`;

export const msnamepascalUpdatemsentitypascalState = gql `
  mutation msnamepascalUpdatemsentitypascalState($id: ID!, $enabled: Boolean!){
    msnamepascalUpdatemsentitypascalState(id: $id, enabled: $enabled){
      _id
      generalInfo {
        name
        description
      }
      enabled
      creationTimestamp
      creatorUser
      modificationTimestamp
      modifierUser
    }
  }
`;

// SUBSCRIPTION
export const msentitypascalUpdatedSubscription = gql`
  subscription{
    msentitypascalUpdatedSubscription{
      _id
      generalInfo {
        name
        description
      }
      enabled
      creationTimestamp
      creatorUser
      modificationTimestamp
      modifierUser
    }
  }
`;
