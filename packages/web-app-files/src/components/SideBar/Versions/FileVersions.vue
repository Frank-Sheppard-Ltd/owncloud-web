<template>
  <div id="oc-file-versions-sidebar">
    <oc-loader v-if="loading" />
    <oc-table-simple v-if="!loading && hasVersion">
      <oc-tbody>
        <oc-tr v-for="(item, index) in versions" :key="index" class="file-row">
          <oc-td width="shrink" data-testid="file-versions-file-icon">
            <oc-resource-icon :resource="resource" size="medium" />
          </oc-td>
          <oc-td
            width="shrink"
            class="oc-text-muted oc-text-nowrap"
            data-testid="file-versions-file-last-modified-date"
          >
            {{ formatVersionDate(item) }}
          </oc-td>
          <oc-td class="oc-text-muted oc-text-nowrap" data-testid="file-versions-file-size">
            {{ formatVersionFileSize(item) }}
          </oc-td>
          <oc-td v-if="isRevertable" width="shrink">
            <oc-button
              v-oc-tooltip="$gettext('Restore older version')"
              data-testid="file-versions-revert-button"
              appearance="raw"
              :aria-label="$gettext('Restore older version')"
              @click="revertVersion(item)"
            >
              <oc-icon name="restart" fill-type="line" />
            </oc-button>
          </oc-td>
          <oc-td width="shrink">
            <oc-button
              v-oc-tooltip="$gettext('Download older version')"
              data-testid="file-versions-download-button"
              appearance="raw"
              :aria-label="$gettext('Download older version')"
              @click="downloadVersion(item)"
            >
              <oc-icon name="download-cloud" fill-type="line" />
            </oc-button>
          </oc-td>
        </oc-tr>
      </oc-tbody>
    </oc-table-simple>
    <div v-else>
      <p v-translate data-testid="file-versions-no-versions">No Versions available for this file</p>
    </div>
  </div>
</template>
<script lang="ts">
import { mapActions, mapGetters, mapMutations } from 'vuex'
import { DavPermission, DavProperty } from 'web-client/src/webdav/constants'
import { formatRelativeDateFromHTTP, formatFileSize } from 'web-pkg/src/helpers'
import { WebDAV } from 'web-client/src/webdav'
import { defineComponent, inject, ref } from 'vue'
import { isShareSpaceResource, Resource, SpaceResource } from 'web-client/src/helpers'
import { SharePermissions } from 'web-client/src/helpers/share'

export default defineComponent({
  name: 'FileVersions',
  setup() {
    const loading = ref(false)

    return {
      space: inject<SpaceResource>('space'),
      resource: inject<Resource>('resource'),
      loading
    }
  },
  computed: {
    ...mapGetters('Files', ['versions']),
    hasVersion() {
      return this.versions.length > 0
    },
    isRevertable() {
      if ((this.space && isShareSpaceResource(this.space)) || this.resource.isReceivedShare()) {
        if (this.resource.permissions !== undefined) {
          return this.resource.permissions.includes(DavPermission.Updateable)
        }

        if (this.resource.share?.role) {
          return this.resource.share.role.hasPermission(SharePermissions.update)
        }
      }

      return true
    }
  },
  watch: {
    resource() {
      this.fetchFileVersions()
    }
  },
  mounted() {
    this.fetchFileVersions()
  },
  methods: {
    ...mapActions('Files', ['loadVersions']),
    ...mapMutations('Files', ['UPDATE_RESOURCE_FIELD']),
    currentVersionId(file) {
      const etag = file.name.split('/')
      return etag[etag.length - 1]
    },
    async fetchFileVersions() {
      this.loading = true
      await this.loadVersions({ client: this.$client, fileId: this.resource.fileId })
      this.loading = false
    },
    async revertVersion(file) {
      const { fileId, id, path } = this.resource
      await this.$client.fileVersions.restoreFileVersion(fileId, this.currentVersionId(file), path)
      const resource = await (this.$clientService.webdav as WebDAV).getFileInfo(
        this.space,
        this.resource
      )

      const fieldsToUpdate = ['size', 'mdate']
      for (const field of fieldsToUpdate) {
        if (this.resource[field]) {
          this.UPDATE_RESOURCE_FIELD({ id, field, value: resource[field] })
        }
      }

      this.fetchFileVersions()
    },
    downloadVersion(file) {
      const version = this.currentVersionId(file)
      return this.downloadFile(this.resource, version)
    },
    formatVersionDate(file) {
      return formatRelativeDateFromHTTP(
        file.fileInfo[DavProperty.LastModifiedDate],
        this.$language.current
      )
    },
    formatVersionFileSize(file) {
      return formatFileSize(file.fileInfo[DavProperty.ContentLength], this.$language.current)
    }
  }
})
</script>
