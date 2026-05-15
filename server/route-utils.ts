/**
 * Route utilities
 * Helper functions for working with Express routes
 */

/**
 * Get a single string parameter from Express req.params
 * Express types params as string | string[] to account for repeated params
 * This helper ensures we always get a string
 */
export function getParam(param: string | string[] | undefined): string {
  if (Array.isArray(param)) {
    return param[0] || '';
  }
  return param || '';
}

/**
 * Get a required parameter, throws if missing
 */
export function getRequiredParam(param: string | string[] | undefined, name: string): string {
  const value = getParam(param);
  if (!value) {
    throw new Error(`Missing required parameter: ${name}`);
  }
  return value;
}
