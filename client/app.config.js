require('dotenv').config();

/** @type {(ctx: { config: import('expo/config').ExpoConfig }) => any} */
module.exports = ({ config }) => ({
  ...config,
  extra: {
    ...config.extra,
    ASSEMBLYAI_API_KEY:
      process.env.ASSEMBLYAI_API_KEY ?? config.extra?.ASSEMBLYAI_API_KEY,
  },
});
