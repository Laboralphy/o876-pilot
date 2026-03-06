/**
 * Convert hex value (number) to a string representation compatible with CSS
 * @param hex integer value
 * @return string value
 */
export function hexstr(hex: number): string {
    return '#' + hex.toString(16).padStart(6, '0');
}
