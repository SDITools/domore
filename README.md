Domore - A DOMO Enhancer
========================

A drop-in replacement / wrapper around the DOMO Node SDK to add needed functionality.


Installation
------------

To install this pacakge in another project, use the following:

`npm install @searchdiscovery/domore`


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
