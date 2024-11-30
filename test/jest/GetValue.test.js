import "../../js/parser.js";

describe("Getting value object", () => {
  it('returns null if input does not represent value', () => {
    expect(Parser.quantity.getValue({})).toBeNull();
    expect(Parser.quantity.getValue([])).toBeNull();
    expect(Parser.quantity.getValue(false)).toBeNull();
    expect(Parser.quantity.getValue(true)).toBeNull();
    expect(Parser.quantity.getValue(null)).toBeNull();
    expect(Parser.quantity.getValue(undefined)).toBeNull();
    expect(Parser.quantity.getValue("")).toBeNull();
    expect(Parser.quantity.getValue(" ")).toBeNull();
    expect(Parser.quantity.getValue("a")).toBeNull();
  });

  it('handles number input', () => {
    expect(Parser.quantity.getValue(42)).toEqual({ nums: [42] });
    expect(Parser.quantity.getValue(42.13)).toEqual({ nums: [42.13] });
    expect(Parser.quantity.getValue(0)).toEqual({ nums: [0] });
    expect(Parser.quantity.getValue(-42)).toEqual({ nums: [-42] });
  });

  it('handles numberic string input', () => {
    expect(Parser.quantity.getValue("42")).toEqual({ nums: [42] });
    expect(Parser.quantity.getValue("42.13")).toEqual({ nums: [42.13] });
    expect(Parser.quantity.getValue("0")).toEqual({ nums: [0] });
    expect(Parser.quantity.getValue("-42")).toEqual({ nums: [-42] });
    expect(Parser.quantity.getValue("1,000")).toEqual({ nums: [1000] });
  });

  it('handles fractions', () => {
    expect(Parser.quantity.getValue("1/4")).toEqual({ nums: [0.25] });
    expect(Parser.quantity.getValue("1/10")).toEqual({ nums: [0.1] });
  });
  
  it('handles ranges', () => {
    expect(Parser.quantity.getValue("5/10")).toEqual({ nums: [5, 10], sep: "/" });
    expect(Parser.quantity.getValue("200/1,000")).toEqual({ nums: [200, 1000], sep: "/" });
    expect(Parser.quantity.getValue("5-7")).toEqual({ nums: [5, 7], sep: "-" });
    expect(Parser.quantity.getValue("5 to 7")).toEqual({ nums: [5, 7], sep: " to " });
  });
});
