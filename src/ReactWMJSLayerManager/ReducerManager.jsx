/*

Based on https://redux.js.org/recipes/code-splitting

*/


import { combineReducers } from 'redux';

export function createReducerManager (initialReducers) {
  // Create an object which maps keys to reducers
  const reducers = { ...initialReducers };

  // Create the initial combinedReducer
  let combinedReducer = combineReducers(reducers);

  // An array which is used to delete state keys when reducers are removed
  const keysToRemove = [];

  return {
    getReducerMap: () => reducers,

    // The root reducer function exposed by this object
    // This will be passed to the store
    reduce: (state, action) => {
      // If any reducers have been removed, clean up their state first
      if (keysToRemove.length > 0) {
        state = { ...state };
        for (let key of keysToRemove) {
          delete state[key];
        }
        keysToRemove.length = 0;
      }

      // Delegate to the combined reducer
      return combinedReducer(state, action);
    },

    // Adds a new reducer with the specified key
    add: (key, reducer) => {
      if (!key || reducers[key]) {
        return false;
      }
      reducers[key] = reducer;
      console.log('Adding reducer [' + key + ']');
      // Generate a new combined reducer
      combinedReducer = combineReducers(reducers);
      return true;
    },

    // Removes a reducer with the specified key
    remove: key => {
      if (!key || !reducers[key]) {
        return;
      }

      // Remove it from the reducer mapping
      delete reducers[key];

      // Add the key to the list of keys to clean up
      keysToRemove.push(key);

      // Generate a new combined reducer
      combinedReducer = combineReducers(reducers);
    }
  };
}
