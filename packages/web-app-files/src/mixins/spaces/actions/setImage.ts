import { isLocationSpacesActive } from '../../../router'
import { clientService } from 'web-pkg/src/services'
import { mapMutations, mapActions, mapGetters, mapState } from 'vuex'
import { thumbnailService } from '../../../services'

export default {
  computed: {
    ...mapGetters(['configuration']),
    ...mapState(['user']),
    $_setSpaceImage_items() {
      return [
        {
          name: 'set-space-image',
          icon: 'image-edit',
          handler: this.$_setSpaceImage_trigger,
          label: () => {
            return this.$gettext('Set as space image')
          },
          isEnabled: ({ resources }) => {
            if (resources.length !== 1) {
              return false
            }
            if (!resources[0].mimeType) {
              return false
            }
            if (!thumbnailService.isMimetypeSupported(resources[0].mimeType, true)) {
              return false
            }

            if (!isLocationSpacesActive(this.$router, 'files-spaces-generic')) {
              return false
            }
            if (!this.space) {
              return false
            }

            return this.space.canEditImage({ user: this.user })
          },
          canBeDefault: false,
          componentType: 'button',
          class: 'oc-files-actions-set-space-image-trigger'
        }
      ]
    }
  },
  methods: {
    ...mapMutations('runtime/spaces', ['UPDATE_SPACE_FIELD']),
    ...mapActions(['showMessage']),
    async $_setSpaceImage_trigger({ resources }) {
      const accessToken = this.$store.getters['runtime/auth/accessToken']
      const graphClient = clientService.graphAuthenticated(this.configuration.server, accessToken)
      const storageId = this.space?.id
      const sourcePath = resources[0].path
      const destinationPath = `/.space/${resources[0].name}`
      const { copyFiles, getFileInfo } = this.$clientService.webdav

      try {
        if (sourcePath !== destinationPath) {
          await copyFiles(
            this.space,
            { path: sourcePath },
            this.space,
            { path: destinationPath },
            { overwrite: true }
          )
        }
        const file = await getFileInfo(this.space, { path: destinationPath })
        const { data } = await graphClient.drives.updateDrive(
          storageId,
          {
            name: this.space.name,
            special: [
              {
                specialFolder: {
                  name: 'image'
                },
                id: file.id
              }
            ]
          },
          {}
        )

        this.UPDATE_SPACE_FIELD({
          id: storageId,
          field: 'spaceImageData',
          value: data.special.find((special) => special.specialFolder.name === 'image')
        })

        this.showMessage({
          title: this.$gettext('Space image was set successfully')
        })
      } catch (error) {
        console.error(error)
        this.showMessage({
          title: this.$gettext('Failed to set space image'),
          status: 'danger'
        })
      }
    }
  }
}
