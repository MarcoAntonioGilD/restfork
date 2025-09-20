<template>
    <div class="workspace-container">
        <!-- Área cuando no hay workspaces -->
        <div v-if="workspaces.length === 0" class="empty-state">
            <div class="empty-state-content">
                <div class="empty-state-icon">
                    <i class="fas fa-folder-plus" style="font-size: 4rem; color: var(--text-color-tertiary, #ccc);"></i>
                </div>
                <h2 style="margin: 1rem 0; color: var(--text-color, #333);">No Workspaces Found</h2>
                <p style="margin-bottom: 2rem; color: var(--text-color-secondary, #666);">
                    Create your first workspace to get started with Restfork.
                </p>
                <button 
                    @click="showAddWorkspaceModal = true" 
                    class="button button-primary"
                    style="padding: 0.75rem 1.5rem; font-size: 1rem;"
                >
                    <i class="fas fa-plus" style="margin-right: 0.5rem;"></i>
                    Create Workspace
                </button>
            </div>
        </div>

        <!-- Lista de workspaces existentes -->
        <div v-else>
            <div class="workspace" v-for="workspace in workspaces" @click="setActiveWorkspace(workspace)">
                <div class="workspace-settings-button-container">
                    <div class="workspace-settings-button" @click.stop="handleContextMenu($event, workspace)">
                        <svg width="1em" height="1em" viewBox="0 0 14 3" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path fill-rule="evenodd" clip-rule="evenodd" d="M1.5 3a1.5 1.5 0 100-3 1.5 1.5 0 000 3zM7 3a1.5 1.5 0 100-3 1.5 1.5 0 000 3zM12.5 3a1.5 1.5 0 100-3 1.5 1.5 0 000 3z" fill=""></path>
                        </svg>
                    </div>
                </div>
                <div class="workspace-name">{{ workspace.name }}</div>
                <div class="workspace-timestamp">{{ dateFormat(workspace.createdAt) }}</div>
            </div>
        </div>
        
        <ContextMenu :options="options" v-model:show="showContextMenu" @click="handleContextMenuClick" :element="contextMenuElement" />
        <AddWorkspaceModal v-model:showModal="showAddWorkspaceModal" :workspace="contextMenuWorkspace" :is-electron="flags.isElectron" />
        <DuplicateWorkspaceModal v-model:showModal="showDuplicateWorkspaceModal" :workspace-to-duplicate="workspaceToDuplicate" :is-electron="flags.isElectron" />
        
        <!-- Modal de prueba para autenticación -->
        <AuthModal 
            v-model:showModal="showTestAuthModal"
            @authSuccess="handleTestAuthSuccess"
        />
    </div>
</template>

<script>
import ContextMenu from './ContextMenu.vue'
import AddWorkspaceModal from './modals/AddWorkspaceModal.vue'
import DuplicateWorkspaceModal from './modals/DuplicateWorkspaceModal.vue'
import AuthModal from './modals/AuthModal.vue'
import dayjs from 'dayjs'

export default {
    components: {
        ContextMenu,
        AddWorkspaceModal,
        DuplicateWorkspaceModal,
        AuthModal
    },
    data() {
        return {
            showContextMenu: false,
            contextMenuElement: null,
            contextMenuWorkspace: null,
            showAddWorkspaceModal: false,
            showDuplicateWorkspaceModal: false,
            workspaceToDuplicate: null,
            showTestAuthModal: false
        }
    },
    computed: {
        workspaces() {
            return this.$store.state.workspaces
        },
        flags() {
            return this.$store.state.flags
        },
        options() {
            const options = [
                {
                    'type': 'option',
                    'label': 'Duplicate',
                    'value': 'Duplicate'
                },
                {
                    'type': 'option',
                    'label': 'Delete',
                    'value': 'Delete'
                }
            ]

            if(this.contextMenuWorkspace && this.contextMenuWorkspace._type === 'file') {
                options.splice(
                    4,
                    0,
                    {
                        'type': 'option',
                        'label': 'Close',
                        'value': 'Close'
                    }
                )
            }

            options.push(
                {
                    'type': 'separator'
                },
                {
                    'type': 'option',
                    'label': 'Properties',
                    'value': 'Properties'
                }
            )

            return options
        }
    },
    methods: {
        setActiveWorkspace(workspace) {
            this.$store.commit('setActiveWorkspace', workspace)
        },
        handleContextMenu(event, workspace) {
            this.contextMenuElement = event.target.closest('.workspace-settings-button')
            this.contextMenuWorkspace = workspace
            this.showContextMenu = true
        },
        async handleContextMenuClick(clickedContextMenuItem) {
            if(clickedContextMenuItem === 'Duplicate') {
                this.workspaceToDuplicate = JSON.parse(JSON.stringify(this.contextMenuWorkspace))
                this.showDuplicateWorkspaceModal = true
            }

            if(clickedContextMenuItem === 'Delete') {
                if(await window.createConfirm('Are you sure?')) {
                    this.$store.dispatch('deleteWorkspace', this.contextMenuWorkspace._id)
                }
            }

            if(clickedContextMenuItem === 'Properties') {
                this.showAddWorkspaceModal = true
            }

            if(clickedContextMenuItem === 'Close') {
                if(await window.createConfirm('Are you sure?')) {
                    this.$store.dispatch('closeWorkspace', this.contextMenuWorkspace._id)
                }
            }
        },
        dateFormat(date) {
            return dayjs(date).format('DD-MMM-YY hh:mm A')
        },
        async handleTestAuthSuccess(authData) {
            try {
                await this.$store.dispatch('setCurrentUser', authData.user)
                await this.$store.dispatch('setCurrentSession', authData.session)
                
                this.$toast.success(
                    authData.isNewUser 
                        ? `¡Bienvenido ${authData.user.username}! Tu cuenta ha sido creada.`
                        : `¡Bienvenido de vuelta, ${authData.user.username}!`
                )
            } catch (error) {
                console.error('Error setting user session:', error)
                this.$toast.error('Autenticación exitosa pero hubo un error configurando tu sesión.')
            }
        }
    }
}
</script>

<style scoped>
.workspace-container {
    display: flex;
    flex-wrap: wrap;
    align-content: flex-start;
    gap: 1rem;
    margin: 1rem;
}

.workspace {
    border: 1px solid var(--default-border-color);
    cursor: pointer;
    height: 196px;
    width: 204px;
    border-radius: 4px;
    user-select: none;
    word-break: break-all;
    display: grid;
    grid-template-rows: auto auto 1fr;
}

.workspace:hover {
    border: 1px solid var(--base-color-info);
}

.workspace svg {
    fill: var(--text-color);
    color: var(--text-color);
}

.workspace-settings-button-container {
    text-align: right;
}

.workspace-settings-button {
    display: inline-block;
    padding: 1rem;
}

.workspace-name, .workspace-timestamp {
    padding-left: 1rem;
    padding-right: 1rem;
}

.workspace-timestamp {
    margin-bottom: 1rem;
    display: grid;
    place-items: self-end;
}

.workspace-settings-button:hover {
    background-color: var(--workspace-menu-hover-background-color);
}
</style>
