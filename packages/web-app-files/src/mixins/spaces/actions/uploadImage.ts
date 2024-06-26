import { mapActions, mapGetters, mapMutations, mapState } from 'vuex'
import { Drive } from 'web-client/src/generated'
import { clientService } from 'web-pkg/src/services'
import { eventBus } from 'web-pkg/src/services/eventBus'
import { thumbnailService } from '../../../services'

export default {
  data: function () {
    return {
      $_uploadImage_selectedSpace: null
    }
  },
  computed: {
    ...mapState('Files', ['currentFolder']),
    ...mapGetters(['configuration']),
    $_uploadImage_items() {
      return [
        {
          name: 'upload-space-image',
          icon: 'image-add',
          handler: this.$_uploadImage_trigger,
          label: () => {
            return this.$gettext('Edit image')
          },
          isEnabled: ({ resources }) => {
            if (resources.length !== 1) {
              return false
            }

            return resources[0].canEditImage({ user: this.user })
          },
          componentType: 'button',
          class: 'oc-files-actions-upload-space-image-trigger'
        }
      ]
    }
  },
  methods: {
    ...mapMutations('runtime/spaces', ['UPDATE_SPACE_FIELD']),
    ...mapActions(['showMessage']),
    $_uploadImage_trigger({ resources }) {
      if (resources.length !== 1) {
        return
      }

      this.$data.$_uploadImage_selectedSpace = resources[0]
      this.$refs.spaceImageInput.click()
    },
    $_uploadImage_uploadImageSpace(ev) {
      const accessToken = this.$store.getters['runtime/auth/accessToken']
      const graphClient = clientService.graphAuthenticated(this.configuration.server, accessToken)
      const file = ev.currentTarget.files[0]

      if (!file) {
        return
      }

      if (!thumbnailService.isMimetypeSupported(file.type, true)) {
        return this.showMessage({
          title: this.$gettext('The file type is unsupported'),
          status: 'danger'
        })
      }

      const extraHeaders = {}
      if (file.lastModifiedDate) {
        extraHeaders['X-OC-Mtime'] = '' + file.lastModifiedDate.getTime() / 1000
      } else if (file.lastModified) {
        extraHeaders['X-OC-Mtime'] = '' + file.lastModified / 1000
      }

      return this.$client.files
        .putFileContents(
          `/spaces/${this.$data.$_uploadImage_selectedSpace.id}/.space/${file.name}`,
          file,
          {
            headers: extraHeaders,
            overwrite: true
          }
        )
        .then((image) => {
          return graphClient.drives
            .updateDrive(
              this.$data.$_uploadImage_selectedSpace.id,
              {
                special: [
                  {
                    specialFolder: {
                      name: 'image'
                    },
                    id: image['OC-FileId']
                  }
                ]
              } as Drive,
              {}
            )
            .then(({ data }) => {
              this.UPDATE_SPACE_FIELD({
                id: this.$data.$_uploadImage_selectedSpace.id,
                field: 'spaceImageData',
                value: data.special.find((special) => special.specialFolder.name === 'image')
              })
              this.showMessage({
                title: this.$gettext('Space image was uploaded successfully')
              })
              eventBus.publish('app.files.list.load')
            })
        })
        .catch((error) => {
          console.error(error)
          this.showMessage({
            title: this.$gettext('Failed to upload space image'),
            status: 'danger'
          })
        })
    }
  }
}
