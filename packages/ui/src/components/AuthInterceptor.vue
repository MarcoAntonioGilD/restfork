<template>
    <div>
        <!-- El contenido del slot se renderiza normalmente -->
        <slot />
        
        <!-- Modal de autenticación que se muestra cuando se requiere -->
        <AuthModal 
            v-model:showModal="showAuthModal"
            @authSuccess="handleAuthSuccess"
        />
        
        <!-- Modal de información sobre autenticación requerida -->
        <modal 
            v-if="showAuthInfoModal" 
            title="Authentication Required" 
            v-model="showAuthInfoModal" 
            width="400px"
        >
            <div style="text-align: center; padding: 1rem;">
                <div style="font-size: 3rem; color: var(--primary-color, #007bff); margin-bottom: 1rem;">
                    <i class="fas fa-shield-alt"></i>
                </div>
                <h3 style="margin: 0 0 1rem 0;">Sign In Required</h3>
                <p style="margin-bottom: 1.5rem; color: var(--text-color-secondary); line-height: 1.5;">
                    {{ authMessage }}
                </p>
                <div style="display: flex; gap: 0.5rem; justify-content: center;">
                    <button 
                        type="button" 
                        class="button" 
                        @click="showAuthInfoModal = false"
                    >
                        Cancel
                    </button>
                    <button 
                        type="button" 
                        class="button button-primary"
                        @click="openSignIn"
                    >
                        Sign In
                    </button>
                </div>
            </div>
        </modal>
    </div>
</template>

<script>
import { ref, onMounted, onUnmounted } from 'vue'
import { useStore } from 'vuex'
import AuthModal from './modals/AuthModal.vue'
import Modal from './Modal.vue'
import { authMiddleware, getAuthMessage } from '../composables/useAuth'

export default {
    name: 'AuthInterceptor',
    components: {
        AuthModal,
        Modal
    },
    setup() {
        const store = useStore()
        const showAuthModal = ref(false)
        const showAuthInfoModal = ref(false)
        const authMessage = ref('')
        const pendingAction = ref(null)

        // Registrar callback para cuando se requiere autenticación
        const handleAuthRequired = (action = 'default', callback = null) => {
            authMessage.value = getAuthMessage(action)
            pendingAction.value = callback
            
            // Mostrar modal de información primero
            showAuthInfoModal.value = true
        }

        // Abrir modal de sign in
        const openSignIn = () => {
            showAuthInfoModal.value = false
            showAuthModal.value = true
        }

        // Manejar éxito de autenticación
        const handleAuthSuccess = (authData) => {
            showAuthModal.value = false
            
            // Si había una acción pendiente, ejecutarla
            if (pendingAction.value && typeof pendingAction.value === 'function') {
                try {
                    pendingAction.value()
                } catch (error) {
                    console.error('Error executing pending action:', error)
                }
                pendingAction.value = null
            }
        }

        // Registrar el interceptor globalmente
        onMounted(() => {
            authMiddleware.onAuthRequired('global-interceptor', handleAuthRequired)
        })

        onUnmounted(() => {
            authMiddleware.removeAuthCallback('global-interceptor')
        })

        return {
            showAuthModal,
            showAuthInfoModal,
            authMessage,
            handleAuthSuccess,
            openSignIn
        }
    }
}
</script>

<style scoped>
.button-primary {
    background-color: var(--primary-color, #007bff);
    color: white;
}

.button-primary:hover {
    background-color: var(--primary-hover-color, #0056b3);
}
</style>