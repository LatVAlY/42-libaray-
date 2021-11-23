const mode = 'development'
const webpackConfig = require('./webpack.config.common.cjs')(mode)

Object.assign(webpackConfig, {
  mode,
  // Override 'browserlist' value (deduced from the presence of a browserslist in package.json)
  // as that disables HMR, see https://github.com/webpack/webpack-dev-server/issues/2758
  target: 'web',
  devtool: 'eval-cheap-module-source-map',
  devServer: require('./dev_server.cjs')
})

module.exports = webpackConfig
