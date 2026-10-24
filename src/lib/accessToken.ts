import type { User, UserRole } from '../types/user.types.ts';

interface AccessTokenPayload {
  sub?: string;
  userId?: number | string;
  name?: string;
  role?: UserRole;
  careRegNo?: string | null;
  exp?: number;
}

// JWT는 base64url이므로 atob가 읽는 base64로 바꾼 뒤 UTF-8로 해석한다.
function decodeBase64UrlUnicode(encoded: string): string {
  const base64 = encoded.replace(/-/g, '+').replace(/_/g, '/');
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let index = 0; index < binary.length; index++) {
    bytes[index] = binary.charCodeAt(index);
  }
  return new TextDecoder('utf-8').decode(bytes);
}

// 서명은 서버가 검증한다. 브라우저는 화면 표시와 만료 판단에 필요한 값만 읽는다.
function readAccessTokenPayload(accessToken: string): AccessTokenPayload | null {
  const encodedPayload = accessToken.split('.')[1];
  if (!encodedPayload) {
    return null;
  }
  try {
    const payload: unknown = JSON.parse(decodeBase64UrlUnicode(encodedPayload));
    if (typeof payload !== 'object' || payload === null) {
      return null;
    }
    return payload as AccessTokenPayload;
  } catch {
    return null;
  }
}

export function readUserFromAccessToken(accessToken: string): User | null {
  const payload = readAccessTokenPayload(accessToken);
  const userId = Number(payload?.userId);
  if (!payload || !Number.isFinite(userId)) {
    return null;
  }
  return {
    id: userId,
    email: payload.sub ?? '',
    name: payload.name || '',
    role: payload.role || 'ROLE_USER',
    careRegNo: payload.careRegNo,
    createdAt: new Date().toISOString(),
  };
}

// 만료 시각을 알 수 없는 토큰은 null을 돌려준다. 판단은 서버 응답에 맡긴다.
export function readAccessTokenExpiresAt(accessToken: string): number | null {
  const expiresAtSeconds = readAccessTokenPayload(accessToken)?.exp;
  if (typeof expiresAtSeconds !== 'number') {
    return null;
  }
  return expiresAtSeconds * 1000;
}

export function isAccessTokenExpiringWithin(accessToken: string, withinMilliseconds: number, now = Date.now()): boolean {
  const expiresAt = readAccessTokenExpiresAt(accessToken);
  if (expiresAt === null) {
    return false;
  }
  return expiresAt - now <= withinMilliseconds;
}

export function isAccessTokenValidFor(accessToken: string, forMilliseconds: number, now = Date.now()): boolean {
  const expiresAt = readAccessTokenExpiresAt(accessToken);
  if (expiresAt === null) {
    return false;
  }
  return expiresAt - now > forMilliseconds;
}
