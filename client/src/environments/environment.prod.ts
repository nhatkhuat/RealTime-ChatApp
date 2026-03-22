const runtimeEnv = (window as any).__env || {};

const normalizeApiBaseUrl = (url?: string): string => {
    if (!url) return 'https://chatapp-api-a3a7ezajhjhhfhf5.southeastasia-01.azurewebsites.net';
    if (url.startsWith('http://') || url.startsWith('https://')) return url;
    return `https://${url}`;
};

export const environment = {
    production: true,
    apiBaseUrl: normalizeApiBaseUrl(runtimeEnv.apiBaseUrl),
};