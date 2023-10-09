# Strapi Plugin Drone

The straight-forward plugin to integrate Strapi with Drone CI

## Features

This plugin does:

- Manage configuration for Drone and trigger builds on changes in a controlled fashion.
- Trigger builds in Drone when a content type was created, changed or removed.

## Installation

### Using yarn

```sh
yarn add strapi-plugin-drone
```

### Using npm

```sh
npm install --save strapi-plugin-drone
```

## Configuration

In the Settings page enable the build on all the Content Types that are used in your application and configure the drone settings in your plugins.js file.

```js
module.exports = ({ env }) => ({
  ...
  drone: {
    enabled: true,
    config: {
      // URL to your drone server (without trailing slash).
      droneServer: 'https://cloud.drone.io',
      personalAccessToken: env('PERSONAL_ACCESS_TOKEN'),
      // Repository details i.e. gitlab.com/owner/name.
      repoOwner: 'owner',
      repoName: 'name',
      // Which branch to trigger builds on.
      branch: env('BRANCH'),
      headers: {},
    },
  },
  ...
};
```

You can also configure headers for the request to Drone in the config. All requests made to Drone will have the personal access token applied already so no need to add it in the headers.
