const runtimeEnv = (window as any).__env || {};

const normalizeApiBaseUrl = (url?: string): string => {
    if (!url) return 'http://localhost:5000';
    if (url.startsWith('http://') || url.startsWith('https://')) return url;
    return `https://${url}`;
};

export const environment = {
    production: false,
    apiBaseUrl: normalizeApiBaseUrl(runtimeEnv.apiBaseUrl),
};