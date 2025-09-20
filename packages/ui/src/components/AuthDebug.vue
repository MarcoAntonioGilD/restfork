<template>
    <div class="auth-debug" v-if="showDebug">
        <div class="auth-debug-header">
            🔐 Auth Debug
            <button @click="toggleDebug" class="debug-close">×</button>
        </div>
        <div class="auth-debug-content">
            <div><strong>Current User:</strong> {{ currentUser ? currentUser.username : 'None' }}</div>
            <div><strong>Is Authenticated:</strong> {{ isAuthenticated ? 'Yes' : 'No' }}</div>
            <div><strong>Session:</strong> {{ currentSession ? 'Active' : 'None' }}</div>
            <div><strong>Modal State:</strong> {{ showAuthModal ? 'Open' : 'Closed' }}</div>
            <button @click="openAuthModal" class="debug-button">Open Auth Modal</button>
        </div>
    </div>
    <button v-else @click="toggleDebug" class="debug-toggle">🔐 Debug</button>
    
    <AuthModal 
        v-model:showModal="showAuthModal"
        @authSuccess="handleAuthSuccess"
    />
    
    <!-- Simple test modal -->
    <div v-if="showAuthModal" class="test-modal-overlay" @click="closeAuthModal">
        <div class="test-modal-content" @click.stop>
            <h3>Test Modal Working!</h3>
            <p>Modal State: {{ showAuthModal }}</p>
            <button @click="closeAuthModal">Close Modal</button>
        </div>
    </div>
</template>

<script>
import { mapState } from 'vuex'
import AuthModal from './modals/AuthModal.vue'

export default {
    name: 'AuthDebug',
    components: {
        AuthModal
    },
    data() {
        return {
            showDebug: false,
            showAuthModal: false
        }
    },
    computed: {
        ...mapState(['currentUser', 'currentSession']),
        isAuthenticated() {
            return !!this.currentUser && !!this.currentSession
        }
    },
    methods: {
        toggleDebug() {
            this.showDebug = !this.showDebug
        },
        openAuthModal() {
            console.log('Opening auth modal...')
            this.showAuthModal = true
            console.log('showAuthModal is now:', this.showAuthModal)
        },
        closeAuthModal() {
            console.log('Closing auth modal...')
            this.showAuthModal = false
        },
        async handleAuthSuccess(authData) {
            try {
                await this.$store.dispatch('setCurrentUser', authData.user)
                await this.$store.dispatch('setCurrentSession', authData.session)
                
                this.$toast.success(
                    authData.isNewUser 
                        ? `¡Bienvenido ${authData.user.username}! Tu cuenta ha sido creada.`
                        : `¡Bienvenido de vuelta, ${authData.user.username}!`
                )
                this.showAuthModal = false
            } catch (error) {
                console.error('Error setting user session:', error)
                this.$toast.error('Autenticación exitosa pero hubo un error configurando tu sesión.')
            }
        }
    }
}
</script>

<style scoped>
.debug-toggle {
    position: fixed;
    bottom: 20px;
    right: 20px;
    z-index: 10000;
    background: #007acc;
    color: white;
    border: none;
    padding: 8px 12px;
    border-radius: 4px;
    cursor: pointer;
    font-size: 12px;
    box-shadow: 0 2px 8px rgba(0,0,0,0.2);
}

.auth-debug {
    position: fixed;
    bottom: 20px;
    right: 20px;
    z-index: 10000;
    background: white;
    border: 2px solid #007acc;
    border-radius: 8px;
    padding: 12px;
    min-width: 250px;
    box-shadow: 0 4px 12px rgba(0,0,0,0.15);
    font-size: 12px;
}

.auth-debug-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 8px;
    font-weight: bold;
    color: #007acc;
}

.debug-close {
    background: none;
    border: none;
    font-size: 16px;
    cursor: pointer;
    color: #999;
}

.auth-debug-content div {
    margin-bottom: 4px;
}

.debug-button {
    background: #007acc;
    color: white;
    border: none;
    padding: 4px 8px;
    border-radius: 4px;
    cursor: pointer;
    font-size: 11px;
    margin-top: 8px;
}

.debug-button:hover {
    background: #005a9e;
}

.test-modal-overlay {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(255, 0, 0, 0.5);
    display: flex;
    align-items: flex-end;
    justify-content: flex-end;
    z-index: 999999;
    padding: 20px;
}

.test-modal-content {
    background: white;
    padding: 20px;
    border-radius: 8px;
    border: 3px solid red;
    text-align: center;
    margin-bottom: 80px;
    margin-right: 0;
}
</style>