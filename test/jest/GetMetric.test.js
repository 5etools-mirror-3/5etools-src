import "../../js/parser.js";
import "../../js/utils.js";

describe("Getting metric quantity", () => {
  it('handles simple input', () => {
    expect(Parser.metric.getMetric({ value: "5", unit: "ft" })).toEqual({ value: 1.5, unit: "m" });
    expect(Parser.metric.getMetric({ value: "7", unit: "ft" })).toEqual({ value: 2.1, unit: "m" });
    expect(Parser.metric.getMetric({ value: "0", unit: "ft" })).toEqual({ value: 0, unit: "m" });
    expect(Parser.metric.getMetric({ value: "-5", unit: "ft" })).toEqual({ value: -1.5, unit: "m" });
    expect(Parser.metric.getMetric({ value: "1,000", unit: "ft" })).toEqual({ value: 300, unit: "m" });
    expect(Parser.metric.getMetric({ value: 5, unit: "ft" })).toEqual({ value: 1.5, unit: "m" });
    expect(Parser.metric.getMetric({ value: 12.5, unit: "ft" })).toEqual({ value: 3.75, unit: "m" });
    expect(Parser.metric.getMetric({ value: "12.5", unit: "ft" })).toEqual({ value: 3.75, unit: "m" });
  });

  it('handle fractions', () => {
    expect(Parser.metric.getMetric({ value: "1/4", unit: "lb" })).toEqual({ value: 0.125, unit: "kg" });
    expect(Parser.metric.getMetric({ value: "1/10", unit: "lb" })).toEqual({ value: 0.05, unit: "kg" });
  })
  
  it('handles ranges', () => {
    expect(Parser.metric.getMetric({ value: "10/30", unit: "ft" })).toEqual({ value: "3/9", unit: "m" });
    expect(Parser.metric.getMetric({ value: "5/10", unit: "ft" })).toEqual({ value: "1.5/3", unit: "m" });
    expect(Parser.metric.getMetric({ value: "5-7", unit: "ft" })).toEqual({ value: "1.5-2.1", unit: "m" });
    expect(Parser.metric.getMetric({ value: "5 to 7", unit: "ft" })).toEqual({ value: "1.5 to 2.1", unit: "m" });
  });

  it('returns original quantity if conversion is not possible', () => {
    expect(Parser.metric.getMetric({ value: "5", unit: "cups" })).toEqual({ value: "5", unit: "cups" });
    expect(Parser.metric.getMetric({ value: "a", unit: "ft" })).toEqual({ value: "a", unit: "ft" });
    expect(Parser.metric.getMetric({ value: "", unit: "ft" })).toEqual({ value: "", unit: "ft" });
    expect(Parser.metric.getMetric({ value: " ", unit: "ft" })).toEqual({ value: " ", unit: "ft" });
    expect(Parser.metric.getMetric({ value: undefined, unit: "ft" })).toEqual({ value: undefined, unit: "ft" });
    expect(Parser.metric.getMetric({ value: {}, unit: "ft" })).toEqual({ value: {}, unit: "ft" });
    expect(Parser.metric.getMetric({ value: [], unit: "ft" })).toEqual({ value: [], unit: "ft" });
    expect(Parser.metric.getMetric({ value: true, unit: "ft" })).toEqual({ value: true, unit: "ft" });
  });
});