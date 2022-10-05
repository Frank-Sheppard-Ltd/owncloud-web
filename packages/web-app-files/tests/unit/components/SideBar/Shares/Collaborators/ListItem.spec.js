import { createLocalVue, mount } from '@vue/test-utils'
import Vuex from 'vuex'
import ListItem from '@files/src/components/SideBar/Shares/Collaborators/ListItem.vue'
import stubs from '@/tests/unit/stubs'
import GetTextPlugin from 'vue-gettext'
import Users from '@/__fixtures__/users'
import { peopleRoleViewerFolder, ShareTypes } from 'web-client/src/helpers/share'

jest.mock('uuid', () => ({
  v4: () => {
    return '00000000-0000-0000-0000-000000000000'
  }
}))

const localVue = createLocalVue()
localVue.use(Vuex)
localVue.use(GetTextPlugin, {
  translations: 'does-not-matter.json',
  silent: true
})

const selectors = {
  userAvatarImage: 'avatar-image-stub.files-collaborators-collaborator-indicator',
  notUserAvatar: 'oc-avatar-item-stub.files-collaborators-collaborator-indicator',
  collaboratorAdditionalInfo: '.files-collaborators-collaborator-additional-info',
  collaboratorName: '.files-collaborators-collaborator-name',
  accessDetailsButton: '.files-collaborators-collaborator-access-details-button',
  collaboratorRole: '.files-collaborators-collaborator-role',
  collaboratorEdit: '.files-collaborators-collaborator-edit',
  shareInheritanceIndicators: '.oc-resource-indicators'
}

describe('Collaborator ListItem component', () => {
  describe('displays the correct image/icon according to the shareType', () => {
    describe('user share type', () => {
      it('should display a users avatar', () => {
        const wrapper = createWrapper({ shareType: ShareTypes.user.value })
        expect(wrapper.find(selectors.userAvatarImage).exists()).toBeTruthy()
        expect(wrapper.find(selectors.notUserAvatar).exists()).toBeFalsy()
      })
      it('sets user info on the avatar', () => {
        const wrapper = createWrapper()
        expect(wrapper.find(selectors.userAvatarImage).attributes('userid')).toEqual('brian')
        expect(wrapper.find(selectors.userAvatarImage).attributes('user-name')).toEqual(
          'Brian Murphy'
        )
      })
    })
    describe('non-user share types', () => {
      it.each(
        ShareTypes.all.filter(
          (shareType) => ![ShareTypes.user, ShareTypes.space].includes(shareType)
        )
      )('should display an oc-avatar-item for any non-user share types', (shareType) => {
        const wrapper = createWrapper({ shareType: shareType.value })
        expect(wrapper.find(selectors.userAvatarImage).exists()).toBeFalsy()
        expect(wrapper.find(selectors.notUserAvatar).exists()).toBeTruthy()
        expect(wrapper.find(selectors.notUserAvatar).attributes().name).toEqual(shareType.key)
      })
    })
  })
  describe('share info', () => {
    it('shows the collaborator display name', () => {
      const wrapper = createWrapper()
      expect(wrapper.find(selectors.collaboratorName).text()).toEqual('Brian Murphy')
    })
  })
  describe('modifiable property', () => {
    it('shows interactive elements when modifiable', () => {
      const wrapper = createWrapper({ modifiable: true })
      expect(wrapper.find(selectors.collaboratorRole).exists()).toBeTruthy()
    })
    it('hides interactive elements when not modifiable', () => {
      const wrapper = createWrapper({ modifiable: false })
      expect(wrapper.find(selectors.collaboratorRole).exists()).toBeFalsy()
    })
  })
  describe('share inheritance indicators', () => {
    it('show when sharedParentRoute is given', () => {
      const wrapper = createWrapper({
        sharedParentRoute: { params: { driveAliasAndItem: '/folder' } }
      })
      expect(wrapper.find(selectors.shareInheritanceIndicators).exists()).toBeTruthy()
      expect(wrapper).toMatchSnapshot()
    })
    it('do not show when sharedParentRoute is not given', () => {
      const wrapper = createWrapper()
      expect(wrapper.find(selectors.shareInheritanceIndicators).exists()).toBeFalsy()
    })
  })
})

function createWrapper({
  shareType = ShareTypes.user.value,
  collaborator = {
    name: 'brian',
    displayName: 'Brian Murphy',
    additionalInfo: 'brian@owncloud.com'
  },
  owner = {
    name: 'marie',
    displayName: 'Marie Curie',
    additionalInfo: 'marie@owncloud.com'
  },
  role = peopleRoleViewerFolder,
  modifiable = true,
  sharedParentRoute = null
} = {}) {
  return mount(ListItem, {
    store: new Vuex.Store({
      state: {
        user: Users.alice
      },
      modules: {
        Files: {
          namespaced: true,
          getters: {
            highlightedFile: function () {
              return { type: 'folder', isFolder: true }
            }
          }
        }
      }
    }),
    propsData: {
      share: {
        id: 'asdf',
        collaborator,
        owner,
        shareType,
        role
      },
      modifiable,
      sharedParentRoute
    },
    localVue,
    stubs: {
      ...stubs,
      'oc-table-simple': true,
      'oc-tr': true,
      'oc-td': true,
      'oc-tag': true,
      'oc-pagination': true,
      'oc-avatar-item': true,
      'role-dropdown': true,
      'edit-dropdown': true,
      translate: false
    },
    directives: {
      'oc-tooltip': jest.fn()
    }
  })
}
