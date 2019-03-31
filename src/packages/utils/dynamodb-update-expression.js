/* eslint-disable */
/**
 * Created by jazarja, 4ossiblellc on 9/20/16.
 * Updated for ES6 & Efficiency by DashOS on 06/28/17
 */
import merge from 'deepmerge';
import _ from 'lodash';

function isEmpty(map) {
  for (const key of Object.keys(map)) {
    if (map[key]) {
      return false;
    }
  }
  return true;
}

const deepDiffMapper = (function() {
  return {
    VALUE_CREATED: 'created',
    VALUE_UPDATED: 'updated',
    VALUE_DELETED: 'deleted',
    VALUE_UNCHANGED: 'unchanged',
    map(obj1, obj2) {
      if (this.isFunction(obj1) || this.isFunction(obj2)) {
        throw new Error('Invalid argument. Function given, object expected.');
      }
      if (this.isValue(obj1) || this.isValue(obj2)) {
        return {
          type: this.compareValues(obj1, obj2),
          data: obj2,
          dataType: obj1 === undefined ? typeof obj2 : typeof obj1,
        };
      }
      if (this.isArray(obj1) || this.isArray(obj2)) {
        return {
          type: this.compareValues(obj1, obj2),
          data: obj2,
          dataType: 'list',
        };
      }

      const diff = {};
      let key;
      for (key in obj1) {
        if (this.isFunction(obj1[key])) {
          continue;
        }

        let value2;
        if (typeof obj2[key] !== 'undefined') {
          value2 = obj2[key];
        }

        diff[key] = this.map(obj1[key], value2);
      }
      for (key in obj2) {
        if (this.isFunction(obj2[key]) || typeof diff[key] !== 'undefined') {
          continue;
        }

        diff[key] = this.map(undefined, obj2[key]);
      }

      return diff;
    },
    compareValues(value1, value2) {
      if (value1 === value2) {
        return this.VALUE_UNCHANGED;
      }
      if (typeof value1 === 'undefined') {
        return this.VALUE_CREATED;
      }
      if (typeof value2 === 'undefined') {
        return this.VALUE_DELETED;
      }

      return this.VALUE_UPDATED;
    },
    isFunction(obj) {
      return {}.toString.apply(obj) === '[object Function]';
    },
    isArray(obj) {
      return {}.toString.apply(obj) === '[object Array]';
    },
    isObject(obj) {
      return {}.toString.apply(obj) === '[object Object]';
    },
    isValue(obj) {
      return !this.isObject(obj) && !this.isArray(obj);
    },
  };
})();

const removeSpecialChars = function(s) {
  return s
    .replace(/\./g, '')
    .replace(/:/g, '')
    .replace(/#/g, '')
    .replace(/-/g, '')
    .replace(/_/g, '')
    .replace(/;/g, '');
};

const updateExpressionGenerator = function(compareResult, options, path, excludeFields) {
  const request = {
    UpdateExpression: '',
    ExpressionAttributeNames: {},
    ExpressionAttributeValues: {},
  };

  let setExpression = '';
  let hasSetExpression = false;
  let removeExpression = '';
  let hasRemoveExpression = false;

  var filterOutDeleteFields = function(obj, path) {
    const wholeList = {
      updateList: [],
      removeList: [],
    };
    let name;
    for (const i in obj) {
      // console.log(i + " = " + JSON.stringify(obj[i], null, 4) +
      //   ", hasOwnProperty: " + obj.hasOwnProperty(
      //     i));
      // console.log("");

      // if(Array.isArray(obj[i])) {
      //   obj[i].forEach(arrayRemoveFunc);
      // } else

      if (obj.hasOwnProperty(i) && typeof obj[i] === 'object') {
        if (obj[i].type === 'updated' && (obj[i].data === '' || obj[i].data === undefined)) {
          wholeList.removeList.push({
            name: (path ? `${path}.` : '') + i,
          });
        } else if (
          (obj[i].type === 'updated' || obj[i].type === 'created') &&
          obj[i].data !== undefined
        ) {
          // console.log("pushed => " + obj[i].dataType, (path ?  path + "." : "") +  i + " = " + obj[i].data);
          wholeList.updateList.push({
            name: (path ? `${path}.` : '') + i,
            value: obj[i].data,
            dataType: obj[i].dataType,
          });
        } else if (
          (obj[i].type === undefined && obj[i].data === undefined) ||
          (obj[i].type && obj[i].type !== 'deleted' && obj[i].type !== 'unchanged')
        ) {
          const partial = isNaN(parseInt(i, 10)) ? `.${i}` : `[${i}]`;
          name = path !== null ? path + partial : i;
          // console.log("- nested object ->", name, obj[i].dataType);
          const childList = filterOutDeleteFields(obj[i], name);
          wholeList.updateList = wholeList.updateList.concat(childList.updateList);
          wholeList.removeList = wholeList.removeList.concat(childList.removeList);
        }
      }
    }

    // console.log("returning updateList: " + updateList);
    return wholeList;
  };

  const wholeList = filterOutDeleteFields(compareResult, null);
  wholeList.updateList.forEach(expr => {
    // change this logic to have # in front of .
    const propName = expr.name
      .replace(/&/g, '')
      .replace(/_/g, '')
      .replace(/\[/g, '')
      .replace(/\]/g, '');

    const splittedByDotPropName = expr.name.split('.');
    const propNameExpressionName = `#${splittedByDotPropName.map(removeSpecialChars).join('.#')}`;
    splittedByDotPropName.forEach(partialName => {
      request.ExpressionAttributeNames[`#${removeSpecialChars(partialName)}`] = partialName;
    });
    const propNameExpressionValue = `:${removeSpecialChars(propName)}`;

    if (hasSetExpression) {
      setExpression += `, ${propNameExpressionName} = ${propNameExpressionValue}`;
    } else {
      setExpression += `SET ${propNameExpressionName} = ${propNameExpressionValue}`;
      hasSetExpression = true;
    }

    request.ExpressionAttributeValues[propNameExpressionValue] = expr.value;
  });

  wholeList.removeList.forEach((expr, index) => {
    // var propName = expr.name.replace(/&/g, "").replace(/_/g, "").replace(
    //   /\[/g, "").replace(/\]/g, "");

    const splittedByDotPropName = expr.name.split('.');
    const propNameExpressionName = `#${splittedByDotPropName.map(removeSpecialChars).join('.#')}`;
    splittedByDotPropName.forEach(partialName => {
      request.ExpressionAttributeNames[`#${removeSpecialChars(partialName)}`] = partialName;
    });

    if (hasRemoveExpression) {
      removeExpression += `, ${propNameExpressionName}`;
    } else {
      removeExpression += `REMOVE ${propNameExpressionName}`;
      hasRemoveExpression = true;
    }
  });

  if (isEmpty(request.ExpressionAttributeNames)) {
    delete request.ExpressionAttributeNames;
  }

  if (hasSetExpression && hasRemoveExpression) {
    request.UpdateExpression = `${setExpression.trim()} ${removeExpression.trim()}`;
  } else if (hasSetExpression) {
    request.UpdateExpression = setExpression.trim();
  } else if (hasRemoveExpression) {
    request.UpdateExpression = removeExpression.trim();
  }

  return request;
};

const removeExpressionGenerator = function(original, removes, compareResult, path, itemUniqueId) {
  const request = {
    UpdateExpression: '',
    ExpressionAttributeNames: {},
    ExpressionAttributeValues: {},
  };

  let setExpression = '';
  let hasSetExpression = false;
  let removeExpression = '';
  let hasRemoveExpression = false;

  var filterOutCreateFields = function(obj, path) {
    let updateList = [];
    let name;
    for (const i in obj) {
      // console.log(i + " = " + JSON.stringify(obj[i], null, 4) +
      //   ", hasOwnProperty: " + obj.hasOwnProperty(
      //     i));
      // console.log("");

      // if(Array.isArray(obj[i])) {
      //   obj[i].forEach(arrayRemoveFunc);
      // } else

      if (obj.hasOwnProperty(i) && typeof obj[i] === 'object') {
        if ((obj[i].type === 'updated' || obj[i].type === 'deleted') && obj[i].data) {
          // console.log("pushed => " + obj[i].dataType, (path ?  path + "." : "") +  i + " = " + obj[i].data);
          updateList.push({
            name: (path ? `${path}.` : '') + i,
            value: obj[i].data,
            dataType: obj[i].dataType,
          });
        } else if (
          (obj[i].type === undefined && obj[i].data === undefined) ||
          (obj[i].type && obj[i].type !== 'created' && obj[i].type !== 'unchanged')
        ) {
          const partial = isNaN(parseInt(i, 10)) ? `.${i}` : `[${i}]`;
          name = path !== null ? path + partial : i;
          // console.log("- nested object ->", name, obj[i].dataType);
          updateList = updateList.concat(filterOutCreateFields(obj[i], name));
        }
      }
    }

    // console.log("returning updateList: " + updateList);
    return updateList;
  };

  const updateList = filterOutCreateFields(compareResult, null);

  updateList.forEach(expr => {
    const propName = expr.name
      .replace(/&/g, '')
      .replace(/_/g, '')
      .replace(/\[/g, '')
      .replace(/\]/g, '');

    let splittedByDotPropName;
    let propNameExpressionName;

    if (expr.dataType !== 'list') {
      splittedByDotPropName = expr.name.split('.');
      propNameExpressionName = `#${splittedByDotPropName.map(removeSpecialChars).join('.#')}`;
      splittedByDotPropName.forEach(partialName => {
        request.ExpressionAttributeNames[`#${removeSpecialChars(partialName)}`] = partialName;
      });

      if (hasRemoveExpression) {
        removeExpression += `, ${propNameExpressionName}`;
      } else {
        removeExpression += `REMOVE ${propNameExpressionName}`;
        hasRemoveExpression = true;
      }
    } else if (expr.value && expr.value.length === 0) {
      splittedByDotPropName = expr.name.split('.');
      propNameExpressionName = `#${splittedByDotPropName.map(removeSpecialChars).join('.#')}`;
      splittedByDotPropName.forEach(partialName => {
        request.ExpressionAttributeNames[`#${removeSpecialChars(partialName)}`] = partialName;
      });

      if (hasRemoveExpression) {
        removeExpression += `, ${propNameExpressionName}`;
      } else {
        removeExpression += `REMOVE ${propNameExpressionName}`;
        hasRemoveExpression = true;
      }
    }
  });

  // List element updates

  updateList.forEach(expr => {
    const propName = expr.name
      .replace(/&/g, '')
      .replace(/_/g, '')
      .replace(/\[/g, '')
      .replace(/\]/g, '');

    let splittedByDotPropName;
    let propNameExpressionName;
    let propNameExpressionValue;

    if (expr.dataType !== 'list') {
    } else {
      let value = null;
      // Remove any elements that specified in removes json
      if (
        typeof _.get(original, expr.name)[0] === 'object' ||
        typeof _.get(removes, expr.name)[0] === 'object'
      ) {
        if (typeof itemUniqueId === 'undefined' || itemUniqueId == null) {
          console.error('Found object in a list, but no itemUniqueId parameter specified');
          value = _.xorBy(_.get(original, expr.name), _.get(removes, expr.name), 'id');
        } else {
          value = _.xorBy(_.get(original, expr.name), _.get(removes, expr.name), itemUniqueId);
        }
      } else {
        value = _.xor(_.get(original, expr.name), _.get(removes, expr.name));
      }

      splittedByDotPropName = expr.name.split('.');
      propNameExpressionName = `#${splittedByDotPropName.map(removeSpecialChars).join('.#')}`;
      splittedByDotPropName.forEach(partialName => {
        request.ExpressionAttributeNames[`#${removeSpecialChars(partialName)}`] = partialName;
      });
      propNameExpressionValue = `:${removeSpecialChars(propName)}`;

      if (value.length === 0) {
        // Remove
        if (hasRemoveExpression) {
          // subsequent elements
          removeExpression += `, ${propNameExpressionName}`;
        } else {
          // first element
          removeExpression = `REMOVE ${propNameExpressionName}`;
          hasRemoveExpression = true;
        }
      } else {
        // Set/Update
        request.ExpressionAttributeValues[propNameExpressionValue] = value;

        if (hasSetExpression) {
          // Subsequent element
          setExpression += `, ${propNameExpressionName} = ${propNameExpressionValue}`;
        } else {
          setExpression = `SET ${propNameExpressionName} = ${propNameExpressionValue}`;
          hasSetExpression = true;
        }
      }
    }
  });

  if (isEmpty(request.ExpressionAttributeNames)) {
    delete request.ExpressionAttributeNames;
  }

  if (isEmpty(request.ExpressionAttributeValues)) {
    delete request.ExpressionAttributeValues;
  }

  if (hasSetExpression && hasRemoveExpression) {
    request.UpdateExpression = `${removeExpression.trim()} ${setExpression.trim()}`;
  } else if (hasSetExpression) {
    request.UpdateExpression = setExpression.trim();
  } else if (hasRemoveExpression) {
    request.UpdateExpression = removeExpression.trim();
  }

  return request;
};

// make sure the ES5 Array.isArray() method exists
if (!Array.isArray) {
  Array.isArray = function(arg) {
    return Object.prototype.toString.call(arg) === '[object Array]';
  };
}

function emptyArrays(data) {
  for (const key of Object.keys(data)) {
    if (key !== undefined) {
      // console.log("key: ", key);
      const item = data[key];
      if (item !== undefined && Array.isArray(item)) {
        // see if the array is empty
        // remove this item from the parent object
        // console.log("deleting the item:" + JSON.stringify(item));
        data[key] = [];
        // if this item is an object, then recurse into it
        // to remove empty arrays in it too
      } else if (item !== undefined && typeof item === 'object') {
        emptyArrays(item);
      }
    }
  }
}

export function getRemoveExpression(removes, original = {}, itemUniqueId) {
  return removeExpressionGenerator(
    original,
    removes,
    deepDiffMapper.map(removes, original),
    null,
    itemUniqueId,
  );
}

export function getUpdateExpression(updates, original = {}, options) {
  if (options && options.arrayMerge && options.arrayMerge === 'replaceMerge') {
    emptyArrays(original);
    delete options.arrayMerge;
  }

  const merged = merge(original, updates);

  return updateExpressionGenerator(deepDiffMapper.map(original, merged), options, null);
}
