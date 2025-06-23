
// Jest global type declarations
declare global {
  var jest: typeof import('@jest/globals').jest;
  var expect: typeof import('@jest/globals').expect;
  var describe: typeof import('@jest/globals').describe;
  var it: typeof import('@jest/globals').it;
  var beforeEach: typeof import('@jest/globals').beforeEach;
  var afterEach: typeof import('@jest/globals').afterEach;
  var beforeAll: typeof import('@jest/globals').beforeAll;
  var afterAll: typeof import('@jest/globals').afterAll;
  var test: typeof import('@jest/globals').test;
}

export {};
