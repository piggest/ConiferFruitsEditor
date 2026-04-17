export type EditRequest = { action: 'edit'; path: string };
export type AuthStatus = { authenticated: boolean; login?: string };
export type FileContent = { content: string; sha: string };
