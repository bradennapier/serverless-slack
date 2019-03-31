/* @flow */
/**
 * iterate through vals and remove the value if it starts with it.
 * once the first match is found, return value.
 * @param {*} str
 * @param {*} vals
 */
export function trimLeft(str: string, ...vals: Array<string>): string {
  for (const val of vals) {
    if (str.startsWith(val)) {
      return str.replace(new RegExp(`^${val}`), '');
    }
  }
  return str;
}

export function tryJSONParse<S: string>(str: S) {
  try {
    return JSON.parse(str);
  } catch (e) {
    // do nothing
  }
  return str;
}

export function formatAsUSD(value: number): string {
  return `$${Number(value)
    .toFixed(2)
    .replace(/\d(?=(\d{3})+\.)/g, '$&,')}`;
}
