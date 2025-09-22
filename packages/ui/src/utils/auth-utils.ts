import { nanoid } from 'nanoid'
import type { User, UserSession } from '../global'

/**
 * Genera un salt aleatorio para hash de contraseña
 */
export function generateSalt(): string {
    return nanoid(32)
}

/**
 * Genera un token de sesión único
 */
export function generateSessionToken(): string {
    return nanoid(64)
}

/**
 * Hash simple de contraseña usando Web Crypto API
 * Nota: Para producción se recomendaría usar bcrypt o similar
 */
export async function hashPassword(password: string, salt: string): Promise<string> {
    const encoder = new TextEncoder()
    const data = encoder.encode(password + salt)
    const hashBuffer = await crypto.subtle.digest('SHA-256', data)
    const hashArray = Array.from(new Uint8Array(hashBuffer))
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('')
}

/**
 * Genera salt y hash para una contraseña nueva
 */
export async function hashPasswordWithSalt(password: string): Promise<{ hash: string; salt: string }> {
    const salt = generateSalt()
    const hash = await hashPassword(password, salt)
    return { hash, salt }
}

/**
 * Verifica si una contraseña coincide con el hash almacenado
 */
export async function verifyPassword(password: string, storedHash: string, salt: string): Promise<boolean> {
    const passwordHash = await hashPassword(password, salt)
    return passwordHash === storedHash
}

/**
 * Crea un nuevo usuario con contraseña hasheada
 */
export async function createUserData(
    username: string,
    password: string,
    email?: string,
    profile?: { displayName?: string; avatar?: string }
): Promise<User> {
    const salt = generateSalt()
    const passwordHash = await hashPassword(password, salt)
    const now = Date.now()

    return {
        _id: nanoid(),
        username,
        email,
        passwordHash,
        salt,
        createdAt: now,
        updatedAt: now,
        isActive: true,
        profile
    }
}

/**
 * Crea una nueva sesión de usuario
 */
export function createSessionData(userId: string, expirationHours: number = 24 * 7): UserSession {
    const now = Date.now()
    const expiresAt = now + (expirationHours * 60 * 60 * 1000) // Convertir horas a ms

    return {
        _id: nanoid(),
        userId,
        token: generateSessionToken(),
        createdAt: now,
        expiresAt,
        isActive: true,
        lastActivity: now
    }
}

/**
 * Crea datos básicos de sesión para login (simplificado)
 */
export function createLoginSessionData(username: string): { token: string; expiresAt: number } {
    const now = Date.now()
    const expiresAt = now + (7 * 24 * 60 * 60 * 1000) // 7 días en ms
    
    return {
        token: generateSessionToken(),
        expiresAt
    }
}

/**
 * Valida que una sesión esté activa y no haya expirado
 */
export function isSessionValid(session: UserSession): boolean {
    const now = Date.now()
    return session.isActive && session.expiresAt > now
}

/**
 * Valida formato de email
 */
export function isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return emailRegex.test(email)
}

/**
 * Valida fortaleza de contraseña
 */
export function isValidPassword(password: string): { valid: boolean; message?: string } {
    if (password.length < 6) {
        return { valid: false, message: 'Password must be at least 6 characters long' }
    }
    
    if (password.length > 128) {
        return { valid: false, message: 'Password must be less than 128 characters' }
    }
    
    // Opcional: agregar más validaciones (mayúsculas, números, símbolos)
    return { valid: true }
}

/**
 * Valida nombre de usuario
 */
export function isValidUsername(username: string): { valid: boolean; message?: string } {
    if (username.length < 3) {
        return { valid: false, message: 'Username must be at least 3 characters long' }
    }
    
    if (username.length > 30) {
        return { valid: false, message: 'Username must be less than 30 characters' }
    }
    
    if (!/^[a-zA-Z0-9_-]+$/.test(username)) {
        return { valid: false, message: 'Username can only contain letters, numbers, underscores and hyphens' }
    }
    
    return { valid: true }
}

/**
 * Función de test para verificar que el hashing funciona correctamente
 */
export async function testPasswordHashing() {
    const testPassword = "123456"
    const { hash, salt } = await hashPasswordWithSalt(testPassword)
    
    console.log('Password hash test:', {
        password: testPassword,
        hash,
        salt
    })
    
    // Test verification
    const isValid = await verifyPassword(testPassword, hash, salt)
    const isInvalid = await verifyPassword("wrongpassword", hash, salt)
    
    console.log('Verification test:', {
        correctPassword: isValid,     // Should be true
        wrongPassword: isInvalid      // Should be false
    })
    
    return { isValid, isInvalid }
}

/**
 * Actualiza la última actividad de una sesión
 */
export async function updateSessionActivity(sessionId: string) {
    const { updateSession } = await import('../db')
    await updateSession(sessionId, { lastActivity: Date.now() })
}