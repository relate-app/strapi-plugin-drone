'use strict';

const { validateContentTypesInput, validateSettings } = require('../validation');

module.exports = ({ strapi }) => {
  return {
    async getSettings(ctx) {
      const { config } = strapi.plugin('drone');
      const sourcePlugin = config('sourcePlugin');
      const pluginStore = strapi.store({ type: 'plugin', name: 'drone' });
      const contentTypes = await pluginStore.get({ key: 'content-types' });
      const settings = await pluginStore.get({ key: 'settings' });

      ctx.body = {
        data: {
          contentTypes,
          settings,
          sourcePlugin,
        },
      };
    },

    async updateContentTypes(ctx) {
      const { body } = ctx.request;
      const pluginStore = strapi.store({ type: 'plugin', name: 'drone' });

      await validateContentTypesInput(strapi)(body);

      await pluginStore.set({ key: 'content-types', value: body });

      ctx.body = { data: body };
    },

    async updateSettings(ctx) {
      const { body } = ctx.request;
      const pluginStore = strapi.store({ type: 'plugin', name: 'drone' });

      await validateSettings(body);

      await pluginStore.set({
        key: 'settings',
        value: {
          enabled: body.enabled || false,
        },
      });

      ctx.body = { data: body };
    },
  };
};
