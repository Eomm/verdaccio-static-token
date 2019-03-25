# verdaccio-static-token

This plugin for Verdaccio npm registry let you to use custom authentication tokens with verdaccio.

DISCALIMER: this is a **quick and dirty** plugin to archive my needs. You **MUST** understand how it
works because it could be a potential security issue for your registry.
The settings of this plugin are not encripted in the `verdaccio/config.yaml`, so the server must have an
access policy.

If you want/need encripted strings in config file send a PR or wait for Verdaccio 4.0.

# Installation

```sh
npm install verdaccio
npm install verdaccio-static-token
```


## How it works

This plugins is composed of two components:

+ middleware: it modify the `authorization` header injecting a valid auth token encripted in `aes192` using the [Verdaccio secret](https://github.com/verdaccio/website/blob/master/docs/dev-plugins.md#api-2)
+ authorization: it will approve the used tokens and any additional `user`s login, **eventually skipping** the next auth-plugin configured


# Usage

There are some type of usage:

| Type | Description |
|------|-------------|
| middleware-only          | This inject a valid auth token in the `authorization` header and it is up to the auth plugins configure to manage the login
| authorization-only       | With this setting you can define an "allowList" of users that will skip all the auth plugins and will automatically return a login ok
| middleware+authorization | You can comine these two types giving the access only to a defined set of tokens, so users will continue to use others auth plugins configured


## middleware-only

```yaml
middlewares:
  static-token:
    - token: mySecureToken
      user: systemUser
      password: systemPassword
    - token: ABCD1234
      user: uncle
      password: tom
```

If a request have the header `Authorization: Bearer mySecureToken`, it will be replace at runtime with a token
that act as `systemUser`.
All the auth plugins configured in Verdacco will receive the user and password you have setted.

Whenever you configure the `token` field value use **long** and **random** strings.

NB: if the user you have set require the 2FA, the authentication will fail. So it is up to you to configure a
static application-user.


## authorization-only

```yaml
auth:
  static-token:
    - doo
    - foo
    - bar
  ldap:
    ...
  other-auth-plugin:
    ...
```

This configuration will skip the all the auth plugins that comes after the `static-token` plugin. In this
example the users `doo`, `foo` and `bar` can access **without a valid password**.

Of course use this feature with caution!


## middleware+authorization

```yaml
auth:
  static-token:
  ldap:
    ...
middlewares:
  static-token:
    - token: mySecureToken
    - token: ABCD1234
```

**The best setting** of this plugin is to combine the two possible uses, in this way it gives access to the
Verdaccio registry only to a list of tokens.

The tokens will not act as other users and the `static-token` auth plugin will authorize only the tokens,
so all the others users must login in as usual.

NB: if the `static-token` auth plugin isn't the first of the list, the token will be rejected!
As before, the `token` value must **long** and **random**!


## Where I have to set the token in my `npm` client?

To set the token in your npm client you have to add it to your user config.

This command will append a valid setting:

```sh
# view where the file is located
npm config get userconfig

# append a login access
echo '//localhost:4873/:_authToken="mySecureToken"' >> `npm config get userconfig`
```

The pattern of the string appended is: `//<url of the registry>/:_authToken="<static-token>"`


## License

Copyright [Manuel Spigolon](https://github.com/Eomm), Licensed under [MIT](./LICENSE).
