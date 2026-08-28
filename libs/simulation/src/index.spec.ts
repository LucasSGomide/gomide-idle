describe('@gomide/simulation', () => {
  it('loads as an ESM module', async () => {
    const mod = await import('./index.js');
    expect(mod).toBeDefined();
  });
});
