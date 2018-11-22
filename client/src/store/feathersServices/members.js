import feathersVuex from 'feathers-vuex';
import feathersClient from '../feathersClient';

const { service } = feathersVuex(feathersClient, { idField: 'id' });

const servicePath = 'members';

const servicePlugin = service(servicePath, {
  actions: {
    setCurrentByName({ commit, getters }, memberName) {
      const [member] = getters.find({ query: { name: memberName.toLowerCase() } }).data;

      commit('setCurrent', member);
    },
  },
});

export default servicePlugin;