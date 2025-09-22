<template>
    <div class="user-menu">
        <!-- Usuario no autenticado -->
        <div v-if="!currentUser" class="navbar-item">
            <a href="#" @click.prevent="showAuthModal = true" class="sign-in-link">
                <i class="fas fa-user" style="padding-right: 0.5rem;"></i>
                Sign In
            </a>
        </div>

        <!-- Usuario autenticado -->
        <div v-else class="navbar-item user-authenticated">
            <div class="user-dropdown" @click="toggleUserDropdown" ref="userDropdown">
                <div class="user-info">
                    <i class="fas fa-user-circle user-avatar"></i>
                    <span class="user-name">{{ userDisplayName }}</span>
                    <i class="fas fa-caret-down dropdown-arrow" :class="{ 'rotated': showUserDropdown }"></i>
                </div>
                
                <!-- Dropdown menu -->
                <div v-if="showUserDropdown" class="dropdown-menu">
                    <div class="dropdown-header">
                        <div class="user-display-name">{{ userDisplayName }}</div>
                        <div class="user-username">@{{ currentUser.username }}</div>
                    </div>
                    <div class="dropdown-divider"></div>
                    <button @click="handleSignOut" class="dropdown-item">
                        <i class="fas fa-sign-out-alt"></i>
                        Sign Out
                    </button>
                </div>
            </div>
        </div>

        <!-- Modal de autenticación -->
        <AuthModal 
            :showModal="showAuthModal"
            @update:showModal="showAuthModal = $event"
            @authSuccess="handleAuthSuccess"
        />
    </div>
</template>

<script>
import AuthModal from './modals/AuthModal.vue'

export default {
    name: 'UserMenu',
    components: {
        AuthModal
    },
    data() {
        return {
            showAuthModal: false,
            showUserDropdown: false
        }
    },
    computed: {
        currentUser() {
            return this.$store.state.currentUser
        },
        
        userDisplayName() {
            if (!this.currentUser) return ''
            return this.currentUser.profile?.displayName || this.currentUser.username
        }
    },
    mounted() {
        // Close dropdown when clicking outside
        document.addEventListener('click', this.handleClickOutside)
    },
    beforeUnmount() {
        document.removeEventListener('click', this.handleClickOutside)
    },
    methods: {
        toggleUserDropdown() {
            this.showUserDropdown = !this.showUserDropdown
        },

        handleClickOutside(event) {
            if (this.$refs.userDropdown && !this.$refs.userDropdown.contains(event.target)) {
                this.showUserDropdown = false
            }
        },

        async handleAuthSuccess(authData) {
            try {
                await this.$store.dispatch('setCurrentUser', authData.user)
                await this.$store.dispatch('setCurrentSession', authData.session)
                
                this.$toast.success(
                    authData.isNewUser 
                        ? `Welcome ${authData.user.username}! Your account has been created.`
                        : `Welcome back, ${authData.user.username}!`
                )
                this.showAuthModal = false
            } catch (error) {
                console.error('Error setting user session:', error)
                this.$toast.error('Authentication successful but there was an error setting up your session.')
            }
        },

        async handleSignOut() {
            try {
                await this.$store.dispatch('signOutUser')
                this.$toast.success('You have been signed out successfully')
                this.showUserDropdown = false
            } catch (error) {
                console.error('Error signing out:', error)
                this.$toast.error('Error signing out')
            }
        }
    }
}
</script>

<style scoped>
.user-menu {
    display: flex;
    align-items: center;
    height: 100%;
    position: relative;
}

.sign-in-link {
    color: var(--text-color, #333);
    text-decoration: none;
    padding: 0.5rem;
    border-radius: 4px;
    transition: background-color 0.2s;
    display: flex;
    align-items: center;
}

.sign-in-link:hover {
    background-color: var(--hover-background-color, rgba(0,0,0,0.1));
    color: var(--text-color, #333);
}

.user-dropdown {
    position: relative;
    cursor: pointer;
}

.user-info {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.5rem;
    border-radius: 4px;
    transition: background-color 0.2s;
    min-width: 120px;
}

.user-info:hover {
    background-color: var(--hover-background-color, rgba(0,0,0,0.1));
}

.user-avatar {
    font-size: 1.2rem;
    color: var(--text-color, #333);
}

.user-name {
    font-weight: 500;
    font-size: 0.9rem;
    color: var(--text-color, #333);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    max-width: 100px;
}

.dropdown-arrow {
    font-size: 0.8rem;
    color: var(--text-color, #333);
    transition: transform 0.2s;
}

.dropdown-arrow.rotated {
    transform: rotate(180deg);
}

.dropdown-menu {
    position: absolute;
    top: 100%;
    right: 0;
    background: var(--background-color, white);
    border: 1px solid var(--border-color, #ddd);
    border-radius: 6px;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
    min-width: 200px;
    z-index: 1000;
    overflow: hidden;
    margin-top: 4px;
}

.dropdown-header {
    padding: 12px 16px;
    background: var(--background-color-secondary, #f8f9fa);
    border-bottom: 1px solid var(--border-color, #ddd);
}

.user-display-name {
    font-weight: 600;
    font-size: 0.9rem;
    color: var(--text-color, #333);
    margin-bottom: 2px;
}

.user-username {
    font-size: 0.75rem;
    color: var(--text-color-secondary, #666);
}

.dropdown-divider {
    height: 1px;
    background: var(--border-color, #ddd);
    margin: 0;
}

.dropdown-item {
    width: 100%;
    padding: 12px 16px;
    border: none;
    background: none;
    color: var(--text-color, #333);
    cursor: pointer;
    transition: background-color 0.2s;
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 0.9rem;
}

.dropdown-item:hover {
    background-color: var(--hover-background-color, rgba(0,0,0,0.05));
}

.dropdown-item i {
    width: 16px;
    text-align: center;
}
</style>