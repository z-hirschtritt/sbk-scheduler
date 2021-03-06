import feathersVuex from 'feathers-vuex';
import feathersClient from '../feathersClient';

// the plugin requires that a unique id field be returned in any response from server
const servicePath = 'members';

const { service } = feathersVuex(feathersClient, { idField: 'id' });
const servicePlugin = service(servicePath, {
  actions: {
    async renewMembership({ dispatch }, { memberId, startDate }) {
      // this is a hack that couples with a member service hook that looks for the
      // string: 'renewMembership' and calls the service method registered
      await dispatch('create', {
        method: 'renewMembership',
        arguments: [memberId, startDate]
      });
    }
  }
});

export default servicePlugin;
