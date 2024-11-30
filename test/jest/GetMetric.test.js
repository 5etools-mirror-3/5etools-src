import "../../js/parser.js";
import "../../js/utils.js";

describe("Getting metric quantity", () => {
  it('handles simple input', () => {
    expect(Parser.quantity.getMetric({ value: "5", unit: "ft" })).toEqual({ value: 1.5, unit: "m" });
    expect(Parser.quantity.getMetric({ value: "7", unit: "ft" })).toEqual({ value: 2.1, unit: "m" });
    expect(Parser.quantity.getMetric({ value: "0", unit: "ft" })).toEqual({ value: 0, unit: "m" });
    expect(Parser.quantity.getMetric({ value: "-5", unit: "ft" })).toEqual({ value: -1.5, unit: "m" });
    expect(Parser.quantity.getMetric({ value: "1,000", unit: "ft" })).toEqual({ value: 300, unit: "m" });
    expect(Parser.quantity.getMetric({ value: 5, unit: "ft" })).toEqual({ value: 1.5, unit: "m" });
    expect(Parser.quantity.getMetric({ value: 12.5, unit: "ft" })).toEqual({ value: 3.75, unit: "m" });
    expect(Parser.quantity.getMetric({ value: "12.5", unit: "ft" })).toEqual({ value: 3.75, unit: "m" });
  });

  it('handle fractions', () => {
    expect(Parser.quantity.getMetric({ value: "1/4", unit: "lb" })).toEqual({ value: 0.125, unit: "kg" });
    expect(Parser.quantity.getMetric({ value: "1/10", unit: "lb" })).toEqual({ value: 0.05, unit: "kg" });
  })
  
  it('handles ranges', () => {
    expect(Parser.quantity.getMetric({ value: "10/30", unit: "ft" })).toEqual({ value: "3/9", unit: "m" });
    expect(Parser.quantity.getMetric({ value: "5/10", unit: "ft" })).toEqual({ value: "1.5/3", unit: "m" });
    expect(Parser.quantity.getMetric({ value: "5-7", unit: "ft" })).toEqual({ value: "1.5-2.1", unit: "m" });
    expect(Parser.quantity.getMetric({ value: "5 to 7", unit: "ft" })).toEqual({ value: "1.5 to 2.1", unit: "m" });
  });

  it('correctly convert the unit to plural form', () => {
    expect(Parser.quantity.getMetric({ value: "1", unit: "mile" })).toEqual({ value: 1.5, unit: "kilometers" });
    expect(Parser.quantity.getMetric({ value: "1", unit: "mile" }, true)).toEqual({ value: 1.5, unit: "kilometer" });
  });

  it('convert the unit to singular form', () => {
    expect(Parser.quantity.getMetric({ value: 2, unit: "pounds" })).toEqual({ value: 1, unit: "kilogram" });
  });

  it('returns original quantity if conversion is not possible', () => {
    expect(Parser.quantity.getMetric({ value: "5", unit: "cups" })).toEqual({ value: "5", unit: "cups" });
    expect(Parser.quantity.getMetric({ value: "a", unit: "ft" })).toEqual({ value: "a", unit: "ft" });
    expect(Parser.quantity.getMetric({ value: "", unit: "ft" })).toEqual({ value: "", unit: "ft" });
    expect(Parser.quantity.getMetric({ value: " ", unit: "ft" })).toEqual({ value: " ", unit: "ft" });
    expect(Parser.quantity.getMetric({ value: undefined, unit: "ft" })).toEqual({ value: undefined, unit: "ft" });
    expect(Parser.quantity.getMetric({ value: {}, unit: "ft" })).toEqual({ value: {}, unit: "ft" });
    expect(Parser.quantity.getMetric({ value: [], unit: "ft" })).toEqual({ value: [], unit: "ft" });
    expect(Parser.quantity.getMetric({ value: true, unit: "ft" })).toEqual({ value: true, unit: "ft" });
  });
});