<template>
    <div v-if="showModalComp">
        <modal title="User Profile" v-model="showModalComp" width="500px">
            <form @submit.prevent="handleSave">
                <!-- Avatar section (placeholder for future) -->
                <div style="text-align: center; margin-bottom: 1.5rem;">
                    <div class="profile-avatar">
                        <i class="fas fa-user-circle" style="font-size: 4rem; color: var(--primary-color, #007bff);"></i>
                    </div>
                    <div style="margin-top: 0.5rem; font-size: 0.9rem; color: var(--text-color-secondary);">
                        Avatar customization coming soon
                    </div>
                </div>

                <!-- User information -->
                <div style="margin-bottom: 1rem;">
                    <label style="margin-bottom: var(--label-margin-bottom); display: block; font-weight: 500;">Username</label>
                    <input 
                        type="text" 
                        :value="user?.username"
                        class="full-width-input"
                        disabled
                        style="background-color: var(--background-color-secondary); color: var(--text-color-secondary);"
                    >
                    <div style="font-size: 0.8rem; color: var(--text-color-secondary); margin-top: 0.25rem;">
                        Username cannot be changed
                    </div>
                </div>

                <!-- Display Name -->
                <div style="margin-bottom: 1rem;">
                    <label style="margin-bottom: var(--label-margin-bottom); display: block;">Display Name</label>
                    <input 
                        type="text" 
                        v-model="formData.displayName"
                        class="full-width-input"
                        placeholder="How should we call you?"
                        :disabled="isLoading"
                        autocomplete="name"
                    >
                    <div v-if="errors.displayName" class="error-message">{{ errors.displayName }}</div>
                </div>

                <!-- Email -->
                <div style="margin-bottom: 1rem;">
                    <label style="margin-bottom: var(--label-margin-bottom); display: block;">Email</label>
                    <input 
                        type="email" 
                        v-model="formData.email"
                        class="full-width-input"
                        placeholder="Your email address"
                        :disabled="isLoading"
                        autocomplete="email"
                    >
                    <div v-if="errors.email" class="error-message">{{ errors.email }}</div>
                </div>

                <!-- Account Information -->
                <div style="margin-bottom: 1.5rem; padding: 1rem; background-color: var(--background-color-secondary); border-radius: 4px;">
                    <h4 style="margin: 0 0 0.5rem 0; font-size: 0.9rem;">Account Information</h4>
                    <div style="font-size: 0.8rem; color: var(--text-color-secondary); line-height: 1.4;">
                        <div><strong>Account created:</strong> {{ formatDate(user?.createdAt) }}</div>
                        <div style="margin-top: 0.25rem;"><strong>Last updated:</strong> {{ formatDate(user?.updatedAt) }}</div>
                        <div style="margin-top: 0.25rem;"><strong>Status:</strong> 
                            <span :style="{ color: user?.isActive ? '#28a745' : '#dc3545' }">
                                {{ user?.isActive ? 'Active' : 'Inactive' }}
                            </span>
                        </div>
                    </div>
                </div>

                <!-- Error general -->
                <div v-if="errors.general" class="error-message" style="margin-bottom: 1rem; text-align: center;">
                    {{ errors.general }}
                </div>

                <!-- Botones -->
                <div style="display: flex; gap: 0.5rem; justify-content: flex-end;">
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
                        :disabled="isLoading || !hasChanges"
                    >
                        <span v-if="isLoading">Saving...</span>
                        <span v-else>Save Changes</span>
                    </button>
                </div>
            </form>
        </modal>
    </div>
</template>

<script>
import Modal from '../Modal.vue'
import { isValidEmail } from '../../utils/auth-utils'
import { updateUser } from '../../db'

export default {
    name: 'UserProfileModal',
    components: {
        Modal
    },
    props: {
        showModal: {
            type: Boolean,
            default: false
        },
        user: {
            type: Object,
            default: null
        }
    },
    emits: ['update:showModal', 'profileUpdated'],
    data() {
        return {
            isLoading: false,
            formData: {
                displayName: '',
                email: ''
            },
            errors: {},
            originalData: {}
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
        hasChanges() {
            return this.formData.displayName !== this.originalData.displayName ||
                   this.formData.email !== this.originalData.email
        }
    },
    watch: {
        showModal(newVal) {
            if (newVal && this.user) {
                this.initializeForm()
            }
        },
        user: {
            handler(newUser) {
                if (newUser && this.showModal) {
                    this.initializeForm()
                }
            },
            deep: true
        }
    },
    methods: {
        initializeForm() {
            this.formData = {
                displayName: this.user?.profile?.displayName || '',
                email: this.user?.email || ''
            }
            this.originalData = { ...this.formData }
            this.errors = {}
            this.isLoading = false
        },

        validateForm() {
            this.errors = {}

            // Validar email (si se proporcionó)
            if (this.formData.email && !isValidEmail(this.formData.email)) {
                this.errors.email = 'Please enter a valid email address'
            }

            // Validar display name (opcional, pero si se proporciona debe ser válido)
            if (this.formData.displayName && this.formData.displayName.length > 50) {
                this.errors.displayName = 'Display name must be less than 50 characters'
            }

            return Object.keys(this.errors).length === 0
        },

        async handleSave() {
            if (!this.validateForm()) {
                return
            }

            this.isLoading = true
            this.errors = {}

            try {
                // Preparar datos actualizados
                const updatedData = {
                    email: this.formData.email || undefined,
                    profile: {
                        ...this.user.profile,
                        displayName: this.formData.displayName || undefined
                    },
                    updatedAt: Date.now()
                }

                // Actualizar en la base de datos
                await updateUser(this.user._id, updatedData)

                // Crear objeto usuario actualizado para emitir
                const updatedUser = {
                    ...this.user,
                    ...updatedData
                }

                // Emitir evento de actualización
                this.$emit('profileUpdated', updatedUser)

                this.closeModal()
            } catch (error) {
                console.error('Error updating profile:', error)
                this.errors.general = 'Failed to update profile. Please try again.'
            } finally {
                this.isLoading = false
            }
        },

        formatDate(timestamp) {
            if (!timestamp) return 'Unknown'
            return new Date(timestamp).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            })
        },

        closeModal() {
            this.showModalComp = false
        }
    }
}
</script>

<style scoped>
.profile-avatar {
    margin-bottom: 0.5rem;
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