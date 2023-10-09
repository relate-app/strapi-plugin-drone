'use strict';
const fetch = require('cross-fetch');
const throttle = require('throttle-debounce').throttle;

const triggerBuild = throttle(
  1000,
  async strapi => {
    const { config } = strapi.plugin('drone');
    const headers = config('headers');
    const pluginStore = strapi.store({ type: 'plugin', name: 'drone' });
    const settings = (await pluginStore.get({ key: 'settings' })) || {};
    const droneServer = config('droneServer');
    const personalAccessToken = config('personalAccessToken');
    const repoOwner = config('repoOwner');
    const repoName = config('repoName');
    const branch = config('branch');

    if (settings.enabled) {
      // Get builds.
      const url = `${droneServer}/api/repos/${repoOwner}/${repoName}/builds`;
      const builds = await fetch(url, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${personalAccessToken}`,
          ...headers,
        },
      }).then(res => res.json());
      // Get running builds.
      const runningBuilds = builds
        .filter(
          build =>
            ['pending', 'running'].includes(build.status) &&
            build.event === 'custom' &&
            build.ref === `refs/heads/${branch}`
        )
        .map(build => build.number);
      // Cancel running builds.
      await Promise.all(
        runningBuilds.map(async buildNumber => {
          await fetch(`${url}/${buildNumber}`, {
            method: 'DELETE',
            headers: {
              Authorization: `Bearer ${personalAccessToken}`,
              ...headers,
            },
          });
        })
      );
      // Trigger a new build.
      await fetch(url, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${personalAccessToken}`,
          ...headers,
        },
        body: JSON.stringify({
          ref: `refs/heads/${branch}`,
        }),
      });
    }
  },
  { noLeading: true }
);

module.exports = async ({ strapi }) => {
  // bootstrap phase
  const pluginStore = strapi.store({ type: 'plugin', name: 'drone' });
  await initContentType(pluginStore, strapi);

  strapi.db.lifecycles.subscribe(async event => {
    switch (event.action) {
      case 'afterCreate':
      case 'afterCreateMany':
      case 'afterUpdate':
      case 'afterUpdateMany':
      case 'afterDelete':
      case 'afterDeleteMany': {
        const uid = event.model.uid;
        const contentTypes = (await pluginStore.get({ key: 'content-types' })) || {};
        if (contentTypes[uid].build) {
          triggerBuild(strapi);
        }
        break;
      }

      default:
        break;
    }
  });
};

const initContentType = async (pluginStore, strapi) => {
  const KEY = 'content-types';

  const storedEnabledContentTypes = (await pluginStore.get({ key: KEY })) || {};

  const contentTypes = Object.keys(strapi.contentTypes).reduce((acc, uid) => {
    acc[uid] = storedEnabledContentTypes[uid] || { build: false };

    return acc;
  }, {});

  await pluginStore.set({ key: KEY, value: contentTypes });
};
