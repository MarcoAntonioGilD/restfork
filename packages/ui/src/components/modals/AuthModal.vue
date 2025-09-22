<template>
    <div v-if="showModalComp">
        <modal :title="isRegistering ? 'Create Account' : 'Sign In'" v-model="showModalComp" width="450px">
            <!-- Toggle entre Login y Register -->
            <div class="auth-toggle" style="text-align: center; margin-bottom: 1.5rem;">
                <button 
                    type="button"
                    class="button"
                    :class="{ 'button-primary': !isRegistering }"
                    @click="isRegistering = false"
                    style="margin-right: 0.5rem;"
                >
                    Sign In
                </button>
                <button 
                    type="button"
                    class="button"
                    :class="{ 'button-primary': isRegistering }"
                    @click="isRegistering = true"
                >
                    Register
                </button>
            </div>

            <!-- Formulario de Login/Registro -->
            <form @submit.prevent="handleSubmit">
                <!-- Username -->
                <div style="margin-bottom: 1rem;">
                    <label style="margin-bottom: var(--label-margin-bottom); display: block;">Username</label>
                    <input 
                        type="text" 
                        v-model="formData.username"
                        class="full-width-input"
                        placeholder="Enter your username"
                        required
                        :disabled="isLoading"
                        autocomplete="username"
                    >
                    <div v-if="errors.username" class="error-message">{{ errors.username }}</div>
                </div>

                <!-- Email (solo para registro) -->
                <div v-if="isRegistering" style="margin-bottom: 1rem;">
                    <label style="margin-bottom: var(--label-margin-bottom); display: block;">Email (Optional)</label>
                    <input 
                        type="email" 
                        v-model="formData.email"
                        class="full-width-input"
                        placeholder="Enter your email"
                        :disabled="isLoading"
                        autocomplete="email"
                    >
                    <div v-if="errors.email" class="error-message">{{ errors.email }}</div>
                </div>

                <!-- Password -->
                <div style="margin-bottom: 1rem;">
                    <label style="margin-bottom: var(--label-margin-bottom); display: block;">Password</label>
                    <input 
                        type="password" 
                        v-model="formData.password"
                        class="full-width-input"
                        placeholder="Enter your password"
                        required
                        :disabled="isLoading"
                        :autocomplete="isRegistering ? 'new-password' : 'current-password'"
                    >
                    <div v-if="errors.password" class="error-message">{{ errors.password }}</div>
                </div>

                <!-- Confirm Password (solo para registro) -->
                <div v-if="isRegistering" style="margin-bottom: 1rem;">
                    <label style="margin-bottom: var(--label-margin-bottom); display: block;">Confirm Password</label>
                    <input 
                        type="password" 
                        v-model="formData.confirmPassword"
                        class="full-width-input"
                        placeholder="Confirm your password"
                        required
                        :disabled="isLoading"
                        autocomplete="new-password"
                    >
                    <div v-if="errors.confirmPassword" class="error-message">{{ errors.confirmPassword }}</div>
                </div>

                <!-- Display Name (solo para registro) -->
                <div v-if="isRegistering" style="margin-bottom: 1rem;">
                    <label style="margin-bottom: var(--label-margin-bottom); display: block;">Display Name (Optional)</label>
                    <input 
                        type="text" 
                        v-model="formData.displayName"
                        class="full-width-input"
                        placeholder="How should we call you?"
                        :disabled="isLoading"
                        autocomplete="name"
                    >
                </div>

                <!-- Error general -->
                <div v-if="errors.general" class="error-message" style="margin-bottom: 1rem; text-align: center;">
                    {{ errors.general }}
                </div>

                <!-- Botones -->
                <div style="display: flex; gap: 0.5rem; justify-content: flex-end; margin-top: 1.5rem;">
                    <button 
                        type="button" 
                        class="button" 
                        @click="closeModal"
                        :disabled="isLoading"
                    >
                        Cancel
                    </button>
                    <button 
                        type="submit" 
                        class="button button-primary"
                        :disabled="isLoading || !isFormValid"
                    >
                        <span v-if="isLoading">{{ isRegistering ? 'Creating...' : 'Signing in...' }}</span>
                        <span v-else>{{ isRegistering ? 'Create Account' : 'Sign In' }}</span>
                    </button>
                </div>
            </form>

            <!-- Info adicional -->
            <div style="margin-top: 1.5rem; padding-top: 1rem; border-top: 1px solid var(--border-color); font-size: 0.9rem; color: var(--text-color-secondary);">
                <div style="margin-bottom: 0.5rem;">
                    <i class="fa fa-shield-alt" style="margin-right: 0.5rem;"></i>
                    Your data is stored locally and encrypted on your device.
                </div>
                <div>
                    <i class="fa fa-info-circle" style="margin-right: 0.5rem;"></i>
                    {{ isRegistering ? 'Already have an account? Click "Sign In" above.' : 'Need an account? Click "Register" above.' }}
                </div>
            </div>
        </modal>
    </div>
</template>

<script>
import Modal from '../Modal.vue'
import { 
    createUserData, 
    verifyPassword, 
    createSessionData,
    isValidUsername,
    isValidPassword,
    isValidEmail
} from '../../utils/auth-utils'
import {
    createUser,
    getUserByUsername,
    getUserByEmail,
    createSession
} from '../../db'

export default {
    name: 'AuthModal',
    components: {
        Modal
    },
    props: {
        showModal: {
            type: Boolean,
            default: false
        }
    },
    emits: ['update:showModal', 'authSuccess'],
    data() {
        return {
            isRegistering: false,
            isLoading: false,
            formData: {
                username: '',
                email: '',
                password: '',
                confirmPassword: '',
                displayName: ''
            },
            errors: {}
        }
    },
    computed: {
        showModalComp: {
            get() {
                return this.showModal
            },
            set(value) {
                this.$emit('update:showModal', value)
            }
        },
        isFormValid() {
            if (this.isRegistering) {
                return this.formData.username && 
                       this.formData.password && 
                       this.formData.confirmPassword &&
                       this.formData.password === this.formData.confirmPassword
            }
            return this.formData.username && this.formData.password
        }
    },
    watch: {
        showModal(newVal) {
            if (newVal) {
                this.resetForm()
            }
        },
        isRegistering() {
            this.clearErrors()
        }
    },
    methods: {
        resetForm() {
            this.formData = {
                username: '',
                email: '',
                password: '',
                confirmPassword: '',
                displayName: ''
            }
            this.errors = {}
            this.isLoading = false
            this.isRegistering = false
        },

        clearErrors() {
            this.errors = {}
        },

        validateForm() {
            this.errors = {}

            // Validar username
            const usernameValidation = isValidUsername(this.formData.username)
            if (!usernameValidation.valid) {
                this.errors.username = usernameValidation.message
            }

            // Validar email (si se proporcionó)
            if (this.formData.email && !isValidEmail(this.formData.email)) {
                this.errors.email = 'Please enter a valid email address'
            }

            // Validar password
            const passwordValidation = isValidPassword(this.formData.password)
            if (!passwordValidation.valid) {
                this.errors.password = passwordValidation.message
            }

            // Validar confirmación de password (solo en registro)
            if (this.isRegistering && this.formData.password !== this.formData.confirmPassword) {
                this.errors.confirmPassword = 'Passwords do not match'
            }

            return Object.keys(this.errors).length === 0
        },

        async handleSubmit() {
            if (!this.validateForm()) {
                return
            }

            this.isLoading = true
            this.clearErrors()

            try {
                if (this.isRegistering) {
                    await this.handleRegister()
                } else {
                    await this.handleLogin()
                }
            } catch (error) {
                console.error('Auth error:', error)
                this.errors.general = error.message || 'An unexpected error occurred'
            } finally {
                this.isLoading = false
            }
        },

        async handleRegister() {
            // Verificar si el usuario ya existe
            const existingUserByUsername = await getUserByUsername(this.formData.username)
            if (existingUserByUsername) {
                this.errors.username = 'Username already exists'
                return
            }

            // Verificar si el email ya existe (si se proporcionó)
            if (this.formData.email) {
                const existingUserByEmail = await getUserByEmail(this.formData.email)
                if (existingUserByEmail) {
                    this.errors.email = 'Email already registered'
                    return
                }
            }

            // Crear nuevo usuario
            const userData = await createUserData(
                this.formData.username,
                this.formData.password,
                this.formData.email || undefined,
                this.formData.displayName ? { displayName: this.formData.displayName } : undefined
            )

            await createUser(userData)

            // Crear sesión automáticamente
            const sessionData = createSessionData(userData._id)
            await createSession(sessionData)

            // Emitir evento de éxito
            this.$emit('authSuccess', {
                user: userData,
                session: sessionData,
                isNewUser: true
            })

            this.closeModal()
        },

        async handleLogin() {
            // Buscar usuario
            const user = await getUserByUsername(this.formData.username)
            if (!user) {
                this.errors.general = 'Invalid username or password'
                return
            }

            // Verificar contraseña
            const isPasswordValid = await verifyPassword(
                this.formData.password,
                user.passwordHash,
                user.salt
            )

            if (!isPasswordValid) {
                this.errors.general = 'Invalid username or password'
                return
            }

            if (!user.isActive) {
                this.errors.general = 'Account is deactivated'
                return
            }

            // Crear nueva sesión
            const sessionData = createSessionData(user._id)
            await createSession(sessionData)

            // Emitir evento de éxito
            this.$emit('authSuccess', {
                user,
                session: sessionData,
                isNewUser: false
            })

            this.closeModal()
        },

        closeModal() {
            this.showModalComp = false
        }
    }
}
</script>

<style scoped>
.auth-toggle {
    background: var(--background-color);
    border-radius: 4px;
    padding: 4px;
    display: inline-flex;
}

.error-message {
    color: #e74c3c;
    font-size: 0.85rem;
    margin-top: 0.25rem;
}

.button:disabled {
    opacity: 0.6;
    cursor: not-allowed;
}

.button-primary {
    background-color: var(--primary-color, #007bff);
    color: white;
}

.button-primary:hover:not(:disabled) {
    background-color: var(--primary-hover-color, #0056b3);
}
</style>