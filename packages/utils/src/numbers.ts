/**
 * Helper function to check if a string is numeric
 * Performs strict validation - rejects whitespace, Infinity, and non-finite values
 */
export function isNumeric(value: string): boolean {
  if (typeof value !== "string") return false;
  
  // Reject empty string or strings with only whitespace
  if (value.trim() === "") return false;
  
  // Reject strings with leading/trailing whitespace (strict validation)
  if (value !== value.trim()) return false;
  
  // Reject Infinity and NaN literals (not practical for most numeric attributes)
  if (value === "Infinity" || value === "-Infinity" || value === "+Infinity" || value === "NaN") return false;
  
  // Use Number() for strict conversion - it's stricter than parseFloat
  // Number() will return NaN for any string that doesn't represent a complete valid number
  const num = Number(value);
  
  // Check if conversion was successful and result is finite
  return !isNaN(num) && isFinite(num);
}
