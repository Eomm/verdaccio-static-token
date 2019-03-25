'use strict'

const crypto = require('crypto')

const allowList = []

module.exports = function (config, stuff) {
  stuff.logger.info('Configuring verdaccio-static-token');

  (config || []).forEach(_ => { allowList.push(_.token || _) })

  return {
    authenticate: function (user, password, callback) {
      if (allowList.includes(user)) {
        stuff.logger.warn(`Allowing access to: ${user}`)
        callback(null, [user])
        return
      }

      // do nothing: go to next auth plugin configured
      callback(null, null)
    },
    register_middlewares: function (app, authInstance, storageInstance) {
      console.log('middy register_middlewares')

      // RFC6750 says Bearer must be case sensitive
      const accessTokens = new Map((config || [])
        .map(_ => `Bearer ${_.token}`)
        .map((authHeader, i) => [authHeader, config[i]]))

      const verdaccioSecret = storageInstance.config.secret
      // I can't use createCipheriv since Verdaccio 3.x use createDecipher
      const cipher = crypto.createCipher('aes192', verdaccioSecret) // eslint-disable-line node/no-deprecated-api

      app.use(function (req, res, next) {
        if (req.headers && req.headers.authorization && accessTokens.has(req.headers.authorization)) {
          const overwrite = accessTokens.get(req.headers.authorization)
          stuff.logger.warn('Applying custom token')
          req.headers.authorization = buildAesAuthToken(overwrite.user || req.headers.authorization.substr(7), overwrite.password || '')
        }

        next()
      })

      function buildAesAuthToken (user, password) {
        const part = cipher.update(Buffer.from(`${user}:${password}`, 'utf8'))
        const encripted = Buffer.concat([part, cipher.final()])
        return `Bearer ${encripted.toString('base64')}`
      }
    }
  }
}
