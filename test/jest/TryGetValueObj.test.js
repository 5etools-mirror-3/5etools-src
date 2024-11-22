import "../../js/parser.js";

describe("Getting value object", () => {
  it('returns null if input does not represent value', () => {
    expect(Parser.tryGetValueObj({})).toBeNull();
    expect(Parser.tryGetValueObj([])).toBeNull();
    expect(Parser.tryGetValueObj(false)).toBeNull();
    expect(Parser.tryGetValueObj(true)).toBeNull();
    expect(Parser.tryGetValueObj(null)).toBeNull();
    expect(Parser.tryGetValueObj(undefined)).toBeNull();
    expect(Parser.tryGetValueObj("")).toBeNull();
    expect(Parser.tryGetValueObj(" ")).toBeNull();
    expect(Parser.tryGetValueObj("a")).toBeNull();
  });

  it('handles number input', () => {
    expect(Parser.tryGetValueObj(42)).toEqual({ nums: [42] });
    expect(Parser.tryGetValueObj(42.13)).toEqual({ nums: [42.13] });
    expect(Parser.tryGetValueObj(0)).toEqual({ nums: [0] });
    expect(Parser.tryGetValueObj(-42)).toEqual({ nums: [-42] });
  });

  it('handles numberic string input', () => {
    expect(Parser.tryGetValueObj("42")).toEqual({ nums: [42] });
    expect(Parser.tryGetValueObj("42.13")).toEqual({ nums: [42.13] });
    expect(Parser.tryGetValueObj("0")).toEqual({ nums: [0] });
    expect(Parser.tryGetValueObj("-42")).toEqual({ nums: [-42] });
    expect(Parser.tryGetValueObj("1,000")).toEqual({ nums: [1000] });
  });

  it('handles fractions', () => {
    expect(Parser.tryGetValueObj("1/4")).toEqual({ nums: [0.25] });
    expect(Parser.tryGetValueObj("1/10")).toEqual({ nums: [0.1] });
  });
  
  it('handles ranges', () => {
    expect(Parser.tryGetValueObj("5/10")).toEqual({ nums: [5, 10], sep: "/" });
    expect(Parser.tryGetValueObj("200/1,000")).toEqual({ nums: [200, 1000], sep: "/" });
    expect(Parser.tryGetValueObj("5-7")).toEqual({ nums: [5, 7], sep: "-" });
    expect(Parser.tryGetValueObj("5 to 7")).toEqual({ nums: [5, 7], sep: " to " });
  });
});
