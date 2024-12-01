import "../../js/parser.js";

describe("Converting fraction text to number", () => {
  it("handles simple inputs", () => {
    expect(Parser.fractionTextToNumber("one-quarter")).toEqual(0.25);
    expect(Parser.fractionTextToNumber("half an")).toEqual(0.5);
  });
  it("handles 'of a' in the fraction", () => {
    expect(Parser.fractionTextToNumber("three-fifths of an")).toEqual(3/5);
    expect(Parser.fractionTextToNumber("a quarter of a")).toEqual(0.25);
  });
  it("returns NaN if the input cannot be converted", () => {
    expect(Parser.fractionTextToNumber("")).toBeNaN();
    expect(Parser.fractionTextToNumber(" ")).toBeNaN();
    expect(Parser.fractionTextToNumber("one-tenth")).toBeNaN();
    expect(Parser.fractionTextToNumber("half a foot")).toBeNaN();
    expect(Parser.fractionTextToNumber("1/2")).toBeNaN();
  });
});