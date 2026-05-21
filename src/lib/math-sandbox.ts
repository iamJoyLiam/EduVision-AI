import { Parser } from "expr-eval-fork";

const parser = new Parser({
  operators: {
    add: true,
    subtract: true,
    multiply: true,
    divide: true,
    power: true,
    remainder: true,
    comparison: true,
    logical: true,
    conditional: true,
    assignment: false,
    in: false,
  },
});

/**
 * Safely evaluate a math expression with variable substitution.
 * Returns 0 on any error (division by zero, NaN, Infinity, parse error).
 */
function evaluate(
  expr: string,
  variables: Record<string, number>,
): number {
  try {
    const sanitized = expr
      .replace(/\\pi/g, "PI")
      .replace(/\\e/g, "E")
      .replace(/π/g, "PI")
      .trim();

    const compiled = parser.parse(sanitized);
    const result = compiled.evaluate(variables);

    if (typeof result !== "number" || isNaN(result) || !isFinite(result)) {
      return 0;
    }
    return result;
  } catch {
    return 0;
  }
}

export const localMathSandbox = { evaluate };
