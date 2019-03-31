import _ from 'lodash';

const NOOP = Symbol('FORMATOBJECT_NOOP');

// Used to change array style matchings behavior
export const AsArray = Symbol.for('FormatObject_AsArray');
export const AsObject = Symbol.for('FormatObject_AsObject');
export const AsFirstMatch = Symbol('AsFirstMatch');
export const AsAllMatches = Symbol.for('FormatObject_AsMatchedArray');

const MODIFIERS = [AsArray, AsObject, AsFirstMatch, AsAllMatches];

// Default
let AsCurrent = AsObject;
let AsReset = false;

function parseObject(object, schemaKey) {
  let value;
  if (_.has(object, schemaKey)) {
    value = _.get(object, schemaKey);
  } else if (Array.isArray(object)) {
    for (const obj of object) {
      if (typeof obj === 'object') {
        value = parseObject(obj, schemaKey);
        if (value !== NOOP) {
          break;
        }
      }
    }
  } else {
    return NOOP;
  }
  return value;
}

function formatArray(p, c, ...objects) {
  let value;
  let el;
  let elKey;
  let wasSymbol;

  if (AsCurrent === AsFirstMatch && p !== undefined) {
    // need to fix this as it will always iterate all keys
    // even though we already have a match
    return p;
  }
  if (typeof c === 'symbol') {
    if (MODIFIERS.includes(c)) {
      wasSymbol = AsCurrent;
      AsCurrent = c;
    }
  }
  if (p === undefined) {
    if ([AsArray, AsAllMatches].includes(AsCurrent)) {
      p = [];
    } else if (AsCurrent === AsObject) {
      p = {};
    } else if (AsCurrent === AsFirstMatch) {
      p = undefined;
    }
  }
  if (typeof c === 'symbol') {
    return p;
  }
  if (typeof c === 'object') {
    const formatted = AsCurrent === AsArray ? [] : {};
    if (Array.isArray(c)) {
      AsReset = true;
      value = c.reduce((p2, c2) => formatArray(p2, c2, ...objects), formatted);
    } else {
      AsReset = true;
      value = formatObject(formatted, c, ...objects);
    }
  } else {
    for (const object of objects) {
      value = parseObject(object, c);
      if (value !== NOOP) {
        break;
      }
    }
    if (value === NOOP) {
      return p;
    }
    el = c.split('.');
    elKey = el[el.length - 1];
  }

  if (value === NOOP) {
    return p;
  }
  if (AsCurrent === AsFirstMatch) {
    return value;
  }
  if (AsCurrent === AsObject && Array.isArray(p)) {
    if (AsReset === true) {
      p.push(value);
      AsReset = false;
    } else {
      p.push({ [elKey]: value });
    }
  } else if (Array.isArray(p)) {
    p.push(value);
  } else if (elKey) {
    p[elKey] = value;
  } else if (c) {
    if (typeof c === 'object') {
      if (Array.isArray(p)) {
        p.push(value);
      } else {
        Object.assign(p, value);
      }
    } else {
      p[c] = value;
    }
  } else {
    p = value;
  }
  if (typeof wasSymbol === 'symbol') {
    AsCurrent = wasSymbol;
  }
  return p;
}

export function formatObject(format, schema, ...objects) {
  const keys = (Array.isArray(schema) && schema) || Object.keys(schema);
  return keys.reduce((p, c) => {
    let value;
    if (Array.isArray(schema[c])) {
      value = schema[c].reduce((p2, c2) => formatArray(p2, c2, ...objects), undefined);
    } else if (typeof schema[c] === 'object') {
      value = formatObject({}, schema[c], ...objects);
    } else {
      const schemaKey = schema[c] !== undefined ? schema[c] : c;
      for (const object of objects) {
        value = parseObject(object, schemaKey);
        if (value !== NOOP) {
          break;
        }
      }
    }
    if (value === NOOP) {
      return p;
    }
    return _.set(p, c, value);
  }, format);
}

export default formatObject;
