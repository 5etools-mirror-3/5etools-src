import "../../js/parser.js";

describe("Getting number from text", () => {
  it('handles simple input', () => {
    expect(Parser.textToNumber("zero")).toEqual(0);
    expect(Parser.textToNumber("a")).toEqual(1);
    expect(Parser.textToNumber("five")).toEqual(5);
    expect(Parser.textToNumber("forty-two")).toEqual(42);
    expect(Parser.textToNumber("one hundred")).toEqual(100);
    expect(Parser.textToNumber("a hundred")).toEqual(100);
    expect(Parser.textToNumber("one hundred thirty-two")).toEqual(132);
    expect(Parser.textToNumber("one thousand")).toEqual(1000);
    expect(Parser.textToNumber("one thousand two hundred")).toEqual(1200);
    expect(Parser.textToNumber("one thousand two hundred thirty-four")).toEqual(1234);
    expect(Parser.textToNumber("one thousand three")).toEqual(1003);
  })

  it('handles "and" in the number', () => {
    expect(Parser.textToNumber("one hundred and five")).toEqual(105);
    expect(Parser.textToNumber("one thousand and one")).toEqual(1001);
  });

  it('return the number if the string can be cast to a number', () => {
    expect(Parser.textToNumber("5")).toEqual(5);
    expect(Parser.textToNumber("0")).toEqual(0);
    expect(Parser.textToNumber("1.5")).toEqual(1.5);
    expect(Parser.textToNumber("-5")).toEqual(-5);
  });
  
  it('returns NaN if the input is not supported', () => {
    expect(Parser.textToNumber("")).toBeNaN();
    expect(Parser.textToNumber(" ")).toBeNaN();
    expect(Parser.textToNumber("a million")).toBeNaN();
    expect(Parser.textToNumber("seventy-two feet")).toBeNaN();
    expect(Parser.textToNumber("several hundred")).toBeNaN();
    expect(Parser.textToNumber("1 000")).toBeNaN();
    expect(Parser.textToNumber("1,000")).toBeNaN();
  });
});