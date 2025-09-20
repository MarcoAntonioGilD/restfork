<template>
    <div class="outer-container">
        <div class="inner-container">
            <div class="workspace-overview">
                <img src="/favicon.png" alt="Restfox Logo" class="logo" />
            </div>

            <div class="create-request">
                <p>Create a new request</p>
                <div class="icons">
                    <img :src="`images/${constants.REQUESTS[key].type}-icon.png`" :alt="constants.REQUESTS[key].alt" :title="constants.REQUESTS[key].title" @click="createRequest(constants.REQUESTS[key].type)" v-for="key in Object.keys(constants.REQUESTS)">
                </div>
            </div>
        </div>
    </div>
    <AddRequestModal v-model:showModal="addRequestModalShow" :parent-id="addRequestModalParentId" />
    <AddGraphQLRequestModal v-model:showModal="addGraphQLRequestModalShow" :parent-id="addRequestModalParentId" />
    <AddSocketModal v-model:showModal="addSocketModalShow" :parent-id="addSocketModalParentId" />
</template>

<script>
import AddRequestModal from '@/components/modals/AddRequestModal.vue'
import AddGraphQLRequestModal from '@/components/modals/AddGraphQLRequestModal.vue'
import AddSocketModal from '@/components/modals/AddSocketModal.vue'
import constants from '@/constants'

export default {
    computed: {
        constants() {
            return constants
        }
    },
    data() {
        return {
            addRequestModalShow: false,
            addRequestModalParentId: null,
            addGraphQLRequestModalShow: false,
            addSocketModalShow: false,
            addSocketModalParentId: null,
        }
    },
    components: {
        AddSocketModal,
        AddGraphQLRequestModal,
        AddRequestModal
    },
    methods: {
        createRequest(type) {
            if(type === constants.REQUESTS.http.type) {
                this.addRequestModalParentId = this.activeSidebarItemForContextMenu ? this.activeSidebarItemForContextMenu._id : null
                this.addRequestModalShow = true
            }
            if(type === constants.REQUESTS.graphql.type) {
                this.addGraphQLRequestModalShow = this.activeSidebarItemForContextMenu ? this.activeSidebarItemForContextMenu._id : null
                this.addGraphQLRequestModalShow = true
            }

            if(type === constants.REQUESTS.websocket.type) {
                this.addRequestModalParentId = this.activeSidebarItemForContextMenu ? this.activeSidebarItemForContextMenu._id : null
                this.addSocketModalShow = true
            }
        }
    }
}
</script>

<style scoped>
.outer-container {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 100%;
    height: 100%;
    padding: 40px;
    box-sizing: border-box;
}

.inner-container {
    text-align: center;
    max-width: 500px;
    width: 100%;
}

.workspace-overview {
    margin-bottom: 32px;
}

.logo {
    width: 200px;
    height: 200px;
    background-color: var(--background-color);
    margin: 0 auto 16px;
    display: block;
}

.create-request p {
    margin-bottom: 20px;
    font-size: 16px;
    color: var(--text-color, #666);
    font-weight: 400;
}

.icons {
    display: flex;
    justify-content: center;
    gap: 16px;
    flex-wrap: wrap;
}

.icons img {
    width: 3rem;
    height: 3rem;
    cursor: pointer;
    background: var(--background-color);
    border-radius: 6px;
    padding: 8px;
    transition: all 0.2s ease;
    border: 1px solid var(--border-color, #e5e5e5);
}

.icons img:hover {
    background: var(--primary-color, #6366f1);
    border-color: var(--primary-color, #6366f1);
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(99, 102, 241, 0.3);
}
</style>
