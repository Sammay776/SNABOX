// A very simple utility function.
// In a real project, this file would likely have more functions.
export function formatLogMessage(message) {
    const timestamp = new Date().toISOString();
    return `[${timestamp}] ${message}`;
}
