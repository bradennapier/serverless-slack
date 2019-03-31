/* @flow */
// Invoke an objects functions and return new object with values
/*
  const foo = {
    one: 'two',
    three: 'four',
    five: () => 'six'
  } ==>
  { one: 'two', three: 'four', five: 'six' }
*/
export const invokeObject = (obj, ...args) => {
  const n = { ...obj };
  for (const k of Object.keys(n)) {
    if (typeof n[k] === 'function') {
      n[k] = n[k](...args);
    }
  }
  return n;
};

export const invokeObjectDeep = (obj, ...args) => {
  const n = { ...obj };
  for (const k of Object.keys(n)) {
    const v = n[k];
    if (v) {
      switch (typeof v) {
        case 'function': {
          n[k] = v(...args);
          break;
        }
        case 'object': {
          if (!Array.isArray(v)) {
            n[k] = invokeObjectDeep(n[k], ...args);
          }
          break;
        }
        default: {
          break;
        }
      }
    }
  }
  return n;
};
