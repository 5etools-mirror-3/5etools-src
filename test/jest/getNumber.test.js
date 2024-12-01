import "../../js/parser.js";

describe("Getting number from string", () => {
  it('handles simple input', () => {
    expect(Parser.quantity.getNumber("2")).toEqual(2);
    expect(Parser.quantity.getNumber("5.8")).toEqual(5.8);
    expect(Parser.quantity.getNumber("0")).toEqual(0);
    expect(Parser.quantity.getNumber("-5")).toEqual(-5);
    expect(Parser.quantity.getNumber("1,000")).toEqual(1000);
    expect(Parser.quantity.getNumber("1 000")).toEqual(1000);
  })
  it('handles numbers as text', () => {
    expect(Parser.quantity.getNumber("two")).toEqual(2);
    expect(Parser.quantity.getNumber("Two")).toEqual(2);
    expect(Parser.quantity.getNumber("five hundred")).toEqual(500);
    expect(Parser.quantity.getNumber("zero")).toEqual(0);
    expect(Parser.quantity.getNumber("a")).toEqual(1);
  })
  it('handles fractions as text', () => {
    expect(Parser.quantity.getNumber("one-quarter")).toEqual(0.25);
    expect(Parser.quantity.getNumber("Half an")).toEqual(0.5);
    expect(Parser.quantity.getNumber("one-quarter of an")).toEqual(0.25);
  });
  it('handles fractions as "n/m"', () => {
    expect(Parser.quantity.getNumber("1/4")).toEqual(0.25);
    expect(Parser.quantity.getNumber("1/4 of a")).toEqual(0.25);
    expect(Parser.quantity.getNumber("5/10")).toEqual(0.5);
    expect(Parser.quantity.getNumber("5/0")).toBeNaN();
  });
  it('handles fractions as vulgar glyphes', () => {
    expect(Parser.quantity.getNumber("½")).toEqual(0.5);
    expect(Parser.quantity.getNumber("2½")).toEqual(2.5);
    expect(Parser.quantity.getNumber("¾ of an")).toEqual(0.75);
  });
  it('returns NaN if the input cannot be converted', () => {
    expect(Parser.quantity.getNumber("")).toBeNaN();
    expect(Parser.quantity.getNumber(" ")).toBeNaN();
    expect(Parser.quantity.getNumber("abc")).toBeNaN();
    expect(Parser.quantity.getNumber("several hundreds")).toBeNaN();
    expect(Parser.quantity.getNumber("a few")).toBeNaN();
  });
});