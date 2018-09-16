import Vue from 'vue';
import Vuex from 'vuex';
import feathersVuex from 'feathers-vuex';
import feathersClient from './feathersClient';

const { FeathersVuex } = feathersVuex(feathersClient, { idField: 'id' });

Vue.use(Vuex);
Vue.use(FeathersVuex);

const requireModule = require.context(
  // The relative path holding the service modules
  './feathersServices',
  // Whether to look in subfolders
  false,
  // Only include .js files (prevents duplicate imports)
  /.js$/,
);
const servicePlugins = requireModule.keys().map(modulePath => requireModule(modulePath).default);

export default new Vuex.Store({
  state: {
    cancelShiftDialog: false,
  },
  mutations: {},
  actions: {
    toggleCancelShiftDialog({ state, commit }) {
      commit('notifications/addItem', { id: 1 });
      commit('notifications/setCurrent', 1);
      state.cancelShiftDialog = !state.cancelShiftDialog;
    },
  },
  plugins: [
    ...servicePlugins,
  ],
});
