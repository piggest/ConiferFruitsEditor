import keytar from 'keytar';

export const SERVICE = 'DocMDTest-desktop';
export const ACCOUNT = 'github-token';

export class CredentialStore {
  async saveToken(token: string): Promise<void> {
    await keytar.setPassword(SERVICE, ACCOUNT, token);
  }
  async getToken(): Promise<string | null> {
    return keytar.getPassword(SERVICE, ACCOUNT);
  }
  async clearToken(): Promise<void> {
    await keytar.deletePassword(SERVICE, ACCOUNT);
  }
}
