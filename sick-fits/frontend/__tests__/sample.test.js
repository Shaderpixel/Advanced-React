describe('sample test 101', () => {
  it('works as expected', () => {
    const age = 100;
    expect(1).toEqual(1);
    expect(age).toEqual(100);
  });

  it.skip('handle ranges just fine', () => {
    // same as xit
    const age = 200;
    expect(age).toBeGreaterThan(100);
  });

  it.only('make a list of dog names', () => {
    // same as fit aka focus it
    const dogs = ['snickers', 'hugo'];
    expect(dogs).toEqual(dogs);
    expect(dogs).toContain('snickers');
  });
});
