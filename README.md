Domore - A Domo Enhancer
========================

A drop-in replacement for the domo-sdk that adds additional much-needed functionality.


Installation
------------

To install this pacakge in another project, use the following:

`npm install @searchdiscovery/domore`

However, since this is a private npm package, `npm install` will most likely fail when you try to install this package.

You will need to add the following line to your ~/.npmrc file:

`//registry.npmjs.org/:_authToken=get-the-token-from-1password`

**Important!!** You will also need to set up this token for any production environments that also will need to install the package (ie. Heroku). There is [documentation](https://medium.com/@oscargodson/npm-private-modules-with-heroku-25a171ce022e) on how to do this.


Usage
-----

    const domore = require('domore');
    const domo = new DomoreClient(clientId, clientSecret, scopes);

    // Has all the existing domo-sdk functionality
    let users = domo.users.get(userId);

    // Plus some funky new stuff
    let allUsers = domo.users.getAll();


Legacy
------

This library is based on some utility functions that grew organically over time. We've been updating as we go, but a lot of the code in
the `lib` directory is still legacy. It may be there just as an example of how to use the actual Domo API. In that case, by all means
please update that code to match the rest of this module.