export function formatLogMessage(message) {
    const timestamp = new Date().toISOString();
    return `[${timestamp}] ${message}`;
}
