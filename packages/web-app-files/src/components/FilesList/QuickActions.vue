<template>
  <div class="oc-flex">
    <oc-button
      v-for="action in filteredActions"
      :key="action.label($gettext)"
      v-oc-tooltip="action.label($gettext)"
      :aria-label="action.label($gettext)"
      appearance="raw"
      class="oc-mr-xs quick-action-button oc-p-xs"
      :class="`files-quick-action-${action.id}`"
      @click="action.handler({ ...$language, item, client: $client, store: $store })"
    >
      <oc-icon :name="action.icon" fill-type="line" />
    </oc-button>
  </div>
</template>

<script lang="ts">
import pickBy from 'lodash-es/pickBy'
import { defineComponent } from 'vue'

export default defineComponent({
  name: 'QuickActions',

  props: {
    actions: {
      type: Object,
      required: true
    },
    item: {
      type: Object,
      required: true
    }
  },

  computed: {
    filteredActions() {
      return pickBy(this.actions, (action) => action.displayed(this.item, this.$store) === true)
    }
  }
})
</script>

<style lang="scss">
.quick-action-button {
  &:hover {
    background-color: var(--oc-color-background-secondary) !important;
  }
}
</style>
