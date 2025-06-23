
// Basic utility functions test
describe('Basic Utility Tests', () => {
  test('string manipulation works correctly', () => {
    const testString = 'Hello World';
    expect(testString.toLowerCase()).toBe('hello world');
    expect(testString.split(' ')).toEqual(['Hello', 'World']);
    expect(testString.length).toBe(11);
  });

  test('array operations work correctly', () => {
    const testArray = [1, 2, 3, 4, 5];
    expect(testArray.length).toBe(5);
    expect(testArray.includes(3)).toBe(true);
    expect(testArray.filter(n => n > 3)).toEqual([4, 5]);
  });

  test('object manipulation works correctly', () => {
    const testObj = { name: 'Test', count: 42 };
    expect(testObj.name).toBe('Test');
    expect(Object.keys(testObj)).toEqual(['name', 'count']);
    expect({ ...testObj, updated: true }).toEqual({
      name: 'Test',
      count: 42,
      updated: true
    });
  });

  test('promise handling works correctly', async () => {
    const asyncFunction = async () => {
      return new Promise(resolve => {
        setTimeout(() => resolve('success'), 10);
      });
    };

    const result = await asyncFunction();
    expect(result).toBe('success');
  });
});
