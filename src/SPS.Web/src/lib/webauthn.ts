/* eslint-disable @typescript-eslint/no-explicit-any -- 這支是解析後端傳來、形狀本來就鬆散的
   FIDO2 JSON（各家瀏覽器/後端實作對 CredentialCreateOptions 的欄位組合不完全一致），刻意用
   any 收，不是偷懶漏標型別；硬套一個型別反而會在 spread/屬性存取的地方連環報錯（試過，見
   git 紀錄）。這個專案目前沒有用到 FIDO2/WebAuthn 登入，這支檔案是參考資料，不在今天的
   串接範圍內。 */

/**
 * WebAuthn helpers: convert between server JSON (base64url) and browser API (ArrayBuffer)
 */

function base64urlToBuffer(base64url: string): ArrayBuffer {
  const base64 = base64url.replace(/-/g, '+').replace(/_/g, '/');
  const pad = base64.length % 4;
  const padded = pad ? base64 + '='.repeat(4 - pad) : base64;
  const binary = atob(padded);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes.buffer;
}

function bufferToBase64url(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (const b of bytes) binary += String.fromCharCode(b);
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

/**
 * Convert server CredentialCreateOptions JSON → browser PublicKeyCredentialCreationOptions
 */
export function toCreationOptions(options: any): PublicKeyCredentialCreationOptions {
  const pubKey = options.publicKey ?? options;
  return {
    ...pubKey,
    challenge: base64urlToBuffer(pubKey.challenge),
    user: {
      ...pubKey.user,
      id: base64urlToBuffer(pubKey.user.id),
    },
    excludeCredentials: (pubKey.excludeCredentials ?? []).map((c: any) => ({
      ...c,
      id: base64urlToBuffer(c.id),
    })),
  };
}

/**
 * Convert server AssertionOptions JSON → browser PublicKeyCredentialRequestOptions
 */
export function toRequestOptions(options: any): PublicKeyCredentialRequestOptions {
  const pubKey = options.publicKey ?? options;
  return {
    ...pubKey,
    challenge: base64urlToBuffer(pubKey.challenge),
    allowCredentials: (pubKey.allowCredentials ?? []).map((c: any) => ({
      ...c,
      id: base64urlToBuffer(c.id),
    })),
  };
}

/**
 * Convert browser AuthenticatorAttestationResponse → server JSON
 */
export function fromAttestationResponse(credential: PublicKeyCredential) {
  const response = credential.response as AuthenticatorAttestationResponse;
  return {
    id: credential.id,
    rawId: bufferToBase64url(credential.rawId),
    type: credential.type,
    response: {
      attestationObject: bufferToBase64url(response.attestationObject),
      clientDataJSON: bufferToBase64url(response.clientDataJSON),
      transports: ('getTransports' in response && typeof response.getTransports === 'function')
        ? (response as any).getTransports()
        : [],
    },
    clientExtensionResults: credential.getClientExtensionResults(),
  };
}

/**
 * Convert browser AuthenticatorAssertionResponse → server JSON
 */
export function fromAssertionResponse(credential: PublicKeyCredential) {
  const response = credential.response as AuthenticatorAssertionResponse;
  return {
    id: credential.id,
    rawId: bufferToBase64url(credential.rawId),
    type: credential.type,
    response: {
      authenticatorData: bufferToBase64url(response.authenticatorData),
      clientDataJSON: bufferToBase64url(response.clientDataJSON),
      signature: bufferToBase64url(response.signature),
      userHandle: response.userHandle ? bufferToBase64url(response.userHandle) : null,
    },
    clientExtensionResults: credential.getClientExtensionResults(),
  };
}
