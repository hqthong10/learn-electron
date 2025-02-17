'use strict';

exports.__esModule = true;
// import * as obs from 'obs-studio-node';
const obs = window['require']('obs-studio-node');

/* Use for...in operator to perfectly mirror the osn module */
for (const entry in obs) {
  // const url = new URL(window.location.href);
  exports[entry] = obs[entry];
  
  // if (url.searchParams.get('windowId') === 'worker') {
  //   exports[entry] = obs[entry];
  // } else {
  //   exports[entry] = new Proxy(
  //     {},
  //     {
  //       get(target, property) {
  //         throw new Error(
  //           `Attempted to access OBS property ${property} outside of the worker process. OBS can only be accessed from the worker process.`,
  //         );
  //       },
  //     },
  //   );
  // }
}