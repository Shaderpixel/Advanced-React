import formatMoney from '../lib/formatMoney';

describe('formatMoney Function', () => {
  it('should work with fractional dollars', () => {
    expect(formatMoney(1)).toEqual('$0.01');
    expect(formatMoney(10)).toEqual('$0.10');
    expect(formatMoney(9)).toEqual('$0.09');
    expect(formatMoney(120)).toEqual('$1.20');
  });

  it('should leave cents off whole dollars', () => {
    expect(formatMoney(100)).toEqual('$1');
    expect(formatMoney(1000)).toEqual('$10');
    expect(formatMoney(33000)).toEqual('$330');
    expect(formatMoney(333000)).toEqual('$3,330');
  });

  it('should works with whole and fractional dollars', () => {
    expect(formatMoney(5012)).toEqual('$50.12');
    expect(formatMoney(101)).toEqual('$1.01');
    expect(formatMoney(101423479)).toEqual('$1,014,234.79');
  });
});
