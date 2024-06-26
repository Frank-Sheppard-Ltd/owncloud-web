<template>
  <date-picker ref="datePicker" class="oc-datepicker" v-bind="$attrs">
    <template #default="args">
      <!-- @slot Default slot to use as the popover anchor for datepicker -->
      <!-- args is undefined during initial render, hence we check it here -->
      <slot
        v-if="args"
        :input-value="args.inputValue"
        :toggle-popover="args.togglePopover"
        :hide-popover="args.hidePopover"
      />
    </template>
  </date-picker>
</template>

<script lang="ts">
import { defineComponent } from 'vue'

import { DatePicker } from 'v-calendar'
import 'v-calendar/dist/style.css'

/**
 * Datepicker component based on [v-calendar](https://vcalendar.io/). For detailed documentation, please visit https://vcalendar.io/vue-3.html
 */
export default defineComponent({
  name: 'OcDatepicker',
  status: 'ready',
  release: '1.0.0',

  components: { DatePicker },

  inheritAttrs: true,

  mounted() {
    this.$el.__datePicker = this.$refs.datePicker
  }
})
</script>

<style lang="scss">
.vc-pane-layout {
  color: var(--oc-color-text-default) !important;
  background-color: var(--oc-color-background-default) !important;
}
.vc-arrow svg path {
  fill: var(--oc-color-text-default) !important;
}
.vc-title {
  color: var(--oc-color-text-default) !important;
}
.vc-weekday {
  color: var(--oc-color-text-muted) !important;
}
.vc-day {
  color: var(--oc-color-text-default) !important;
}

.vc-highlights {
  .vc-highlight {
    background-color: var(--oc-color-swatch-primary-default) !important;
  }
  + span {
    color: var(--oc-color-text-inverse) !important;
  }
}

.vc-day-content.is-disabled {
  color: var(--oc-color-text-muted) !important;
}
</style>
<docs>
```js
<template>
<div>
  <oc-datepicker v-model="date">
    <template #default="{ togglePopover }">
      <oc-button @click="togglePopover">Open datepicker</oc-button>
    </template>
  </oc-datepicker>
  <p v-if="date" v-text="date" />
</div>
</template>
<script>
export default {
  data: () => ({ date: null })
}
</script>
```
</docs>
