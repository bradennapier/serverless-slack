/* @flow */

/**
 * Resolves an array of values sequentially rather than
 * simultaneously.
 *
 * @author Braden Napier
 * @date 2018-10-10
 * @export
 * @param {Array<any>} arr
 * @returns
 */
export default function resolveSequentially(arr: Array<Function>) {
  let r = Promise.resolve();
  return Promise.all(
    arr.reduce((p, c) => {
      r = r.then(() => (typeof c === 'function' ? c() : c));
      p.push(r);
      return p;
    }, []),
  );
}
