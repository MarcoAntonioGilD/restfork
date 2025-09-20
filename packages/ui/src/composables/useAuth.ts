import { computed } from 'vue'
import { useStore } from 'vuex'

/**
 * Composable para manejar autenticación en componentes Vue
 */
export function useAuth() {
    const store = useStore()

    // Estados computados
    const isAuthenticated = computed(() => store.state.isAuthenticated)
    const currentUser = computed(() => store.state.currentUser)
    const currentSession = computed(() => store.state.currentSession)
    const authInitialized = computed(() => store.state.authInitialized)

    // Información del usuario
    const userDisplayName = computed(() => {
        if (!currentUser.value) return ''
        return currentUser.value.profile?.displayName || currentUser.value.username
    })

    const userEmail = computed(() => currentUser.value?.email || '')
    const userId = computed(() => currentUser.value?._id || null)

    // Métodos de autenticación
    const signOut = async () => {
        await store.dispatch('signOutUser')
    }

    const updateSessionActivity = async () => {
        await store.dispatch('updateSessionActivity')
    }

    const initializeAuth = async () => {
        await store.dispatch('initializeAuth')
    }

    // Guards para proteger funcionalidades
    const requireAuth = (callback?: () => void) => {
        if (!isAuthenticated.value) {
            // TODO: Mostrar modal de login o mensaje
            console.warn('Authentication required')
            return false
        }
        if (callback) callback()
        return true
    }

    const requireGuest = (callback?: () => void) => {
        if (isAuthenticated.value) {
            console.warn('Guest access required (user is authenticated)')
            return false
        }
        if (callback) callback()
        return true
    }

    // Verificar permisos (placeholder para futuras funcionalidades)
    const hasPermission = (permission: string) => {
        if (!isAuthenticated.value) return false
        // TODO: Implementar sistema de permisos más robusto
        return true
    }

    const canAccessWorkspace = (workspaceId: string) => {
        if (!isAuthenticated.value) return true // Permitir acceso sin auth por ahora
        // TODO: Implementar permisos por workspace cuando sea necesario
        return true
    }

    const canModifyWorkspace = (workspaceId: string) => {
        if (!isAuthenticated.value) return true // Permitir modificación sin auth por ahora
        // TODO: Implementar permisos de modificación por workspace
        return true
    }

    return {
        // Estados
        isAuthenticated,
        currentUser,
        currentSession,
        authInitialized,
        userDisplayName,
        userEmail,
        userId,

        // Métodos
        signOut,
        updateSessionActivity,
        initializeAuth,

        // Guards
        requireAuth,
        requireGuest,
        hasPermission,
        canAccessWorkspace,
        canModifyWorkspace
    }
}

/**
 * Guard para proteger funcionalidades que requieren autenticación
 */
export function withAuthGuard<T extends (...args: any[]) => any>(
    fn: T,
    options: {
        showLoginModal?: boolean
        onAuthRequired?: () => void
        fallback?: () => any
    } = {}
): T {
    return ((...args: Parameters<T>) => {
        const { isAuthenticated } = useAuth()
        
        if (!isAuthenticated.value) {
            if (options.onAuthRequired) {
                options.onAuthRequired()
            } else if (options.showLoginModal) {
                // TODO: Trigger login modal
                console.warn('Authentication required - should show login modal')
            }
            
            return options.fallback ? options.fallback() : undefined
        }
        
        return fn(...args)
    }) as T
}

/**
 * Decorator para métodos de clase que requieren autenticación
 */
export function RequireAuth(
    options: {
        showLoginModal?: boolean
        onAuthRequired?: () => void
    } = {}
) {
    return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
        const originalMethod = descriptor.value

        descriptor.value = function (...args: any[]) {
            const { isAuthenticated } = useAuth()
            
            if (!isAuthenticated.value) {
                if (options.onAuthRequired) {
                    options.onAuthRequired()
                } else if (options.showLoginModal) {
                    // TODO: Trigger login modal
                    console.warn('Authentication required - should show login modal')
                }
                return
            }
            
            return originalMethod.apply(this, args)
        }

        return descriptor
    }
}

/**
 * Middleware para interceptar acciones que requieren autenticación
 */
export class AuthMiddleware {
    private static instance: AuthMiddleware
    private authCallbacks: Map<string, () => void> = new Map()

    static getInstance(): AuthMiddleware {
        if (!AuthMiddleware.instance) {
            AuthMiddleware.instance = new AuthMiddleware()
        }
        return AuthMiddleware.instance
    }

    /**
     * Registra una callback para cuando se requiere autenticación
     */
    onAuthRequired(key: string, callback: () => void) {
        this.authCallbacks.set(key, callback)
    }

    /**
     * Remueve una callback registrada
     */
    removeAuthCallback(key: string) {
        this.authCallbacks.delete(key)
    }

    /**
     * Ejecuta callbacks cuando se requiere autenticación
     */
    triggerAuthRequired() {
        this.authCallbacks.forEach(callback => callback())
    }

    /**
     * Intercepta una función y verifica autenticación
     */
    intercept<T extends (...args: any[]) => any>(
        fn: T,
        options: {
            requireAuth?: boolean
            requireGuest?: boolean
            onAuthRequired?: () => void
        } = {}
    ): T {
        return ((...args: Parameters<T>) => {
            const { isAuthenticated } = useAuth()
            
            if (options.requireAuth && !isAuthenticated.value) {
                if (options.onAuthRequired) {
                    options.onAuthRequired()
                } else {
                    this.triggerAuthRequired()
                }
                return
            }
            
            if (options.requireGuest && isAuthenticated.value) {
                console.warn('Guest access required (user is authenticated)')
                return
            }
            
            return fn(...args)
        }) as T
    }
}

// Instancia global del middleware
export const authMiddleware = AuthMiddleware.getInstance()

/**
 * Utility para verificar si una acción debe mostrar el modal de login
 */
export function shouldShowAuthModal(action: string): boolean {
    const sensitiveActions = [
        'create-workspace',
        'delete-workspace',
        'export-data',
        'import-data',
        'modify-settings',
        'create-backup'
    ]
    
    return sensitiveActions.includes(action)
}

/**
 * Mensajes de ayuda para diferentes acciones que requieren autenticación
 */
export const authMessages = {
    'create-workspace': 'Sign in to create and sync your workspaces across devices',
    'delete-workspace': 'Authentication required to delete workspaces',
    'export-data': 'Sign in to access advanced export features',
    'import-data': 'Authentication required for secure data import',
    'modify-settings': 'Sign in to save your personalized settings',
    'create-backup': 'Authentication required to create secure backups',
    'default': 'Sign in to access this feature'
}

export function getAuthMessage(action: string): string {
    return authMessages[action as keyof typeof authMessages] || authMessages.default
}