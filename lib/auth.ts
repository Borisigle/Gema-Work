import { SignJWT, jwtVerify } from 'jose';
import { cookies } from 'next/headers';
import { getTeacherByUsername } from './data';

const SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || 'dance-studio-fallback-secret'
);

export interface SessionPayload {
  teacherId: string;
  teacherName: string;
  username: string;
}

// Teacher credentials from environment variables
const TEACHER_CREDENTIALS: Record<string, { id: string; name: string; pass: string }> = {
  [process.env.TEACHER_CAMI_USER || 'cami']: {
    id: 'cami',
    name: 'Cami',
    pass: process.env.TEACHER_CAMI_PASS || 'cami2026',
  },
  [process.env.TEACHER_ANI_USER || 'ani']: {
    id: 'ani',
    name: 'Ani',
    pass: process.env.TEACHER_ANI_PASS || 'ani2026',
  },
  [process.env.TEACHER_NASYA_USER || 'nasya']: {
    id: 'nasya',
    name: 'Nasya',
    pass: process.env.TEACHER_NASYA_PASS || 'nasya2026',
  },
  [process.env.TEACHER_LULU_USER || 'lulu']: {
    id: 'lulu',
    name: 'Lulu',
    pass: process.env.TEACHER_LULU_PASS || 'lulu2026',
  },
  [process.env.TEACHER_LUCAS_USER || 'lucas']: {
    id: 'lucas',
    name: 'Lucas',
    pass: process.env.TEACHER_LUCAS_PASS || 'lucas2026',
  },
  [process.env.TEACHER_MARIAN_USER || 'marian']: {
    id: 'marian',
    name: 'Marian',
    pass: process.env.TEACHER_MARIAN_PASS || 'marian2026',
  },
};

export function validateCredentials(
  username: string,
  password: string
): { id: string; name: string } | null {
  const cred = TEACHER_CREDENTIALS[username.toLowerCase()];
  if (!cred) return null;
  if (cred.pass !== password) return null;
  return { id: cred.id, name: cred.name };
}

export async function createSession(payload: SessionPayload): Promise<string> {
  const token = await new SignJWT(payload as unknown as Record<string, unknown>)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('7d')
    .sign(SECRET);
  return token;
}

export async function verifySession(token: string): Promise<SessionPayload | null> {
  try {
    const { payload } = await jwtVerify(token, SECRET);
    return payload as unknown as SessionPayload;
  } catch {
    return null;
  }
}

export async function getSession(): Promise<SessionPayload | null> {
  const cookieStore = cookies();
  const token = cookieStore.get('ds-session')?.value;
  if (!token) return null;
  return verifySession(token);
}
