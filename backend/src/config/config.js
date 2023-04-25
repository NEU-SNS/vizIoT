/**
 * Default config for all environment types
 * @type {{db: string, apiPort: number}}
 */
const defaultConfig = {
  apiPort: process.env.PORT || 3000,
  db: process.env['MONGO_URI'],
  ip: process.env['LOCAL_IP']
}

/**
 * Enviroment specific configuration
 * @type {{prod: {}, dev: {}, test: {apiPort: number}}}
 */
const envConfig = {
  production: {},
  development: {},
  test: {
    apiPort: 3100,
  },
}

/**
 * Loads config based on the current environment
 * @returns {*}
 */
function loadConfig() {
  const env = process.env.NODE_ENV || 'development'

  if (!envConfig[env]) {
    throw new Error(
      `Environment config for environment '${env}' not found. process.env.NODE_ENV must be one of '${Object.keys(
        envConfig,
      )}'`,
    )
  }

  console.log('[INFO] config loaded for environment: ', env)

  // merge default config with environment specific config
  return Object.assign({}, defaultConfig, envConfig[env])
}

module.exports = loadConfig()
