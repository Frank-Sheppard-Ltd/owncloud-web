<template>
  <div class="oc-mt-xl">
    <div v-if="noGroups" class="oc-flex group-info">
      <oc-icon name="group-2" size="xxlarge" />
      <p v-translate>Select a group to view details</p>
    </div>
    <div v-if="multipleGroups" class="oc-flex group-info">
      <oc-icon name="group-2" size="xxlarge" />
      <p>{{ multipleGroupsSelectedText }}</p>
    </div>
    <div v-if="group">
      <div class="oc-flex group-info oc-mb-l">
        <avatar-image
          class="oc-mb-m"
          :width="80"
          :userid="group.id"
          :user-name="group.displayName"
        />
        <span class="oc-text-muted group-info-display-name" v-text="group.displayName"></span>
      </div>
      <table
        class="details-table"
        :aria-label="$gettext('Overview of the information about the selected group')"
      >
        <tr>
          <th scope="col" class="oc-pr-s" v-text="$gettext('Group name')" />
          <td v-text="group.displayName" />
        </tr>
      </table>
    </div>
  </div>
</template>
<script lang="ts">
import { defineComponent } from 'vue'

export default defineComponent({
  name: 'DetailsPanel',
  props: {
    groups: {
      type: Array,
      required: true
    }
  },
  computed: {
    group() {
      return this.groups.length === 1 ? this.groups[0] : null
    },
    noGroups() {
      return !this.groups.length
    },
    multipleGroups() {
      return this.groups.length > 1
    },
    multipleGroupsSelectedText() {
      return this.$gettext('%{count} groups selected', {
        count: this.groups.length
      })
    }
  }
})
</script>
<style lang="scss">
.group-info {
  align-items: center;
  flex-direction: column;
}
.group-info-display-name {
  font-size: 1.5rem;
}
.details-table {
  text-align: left;

  tr {
    height: 1.5rem;
  }

  th {
    font-weight: 600;
  }
}
</style>
