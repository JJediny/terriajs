# Deploying a Terria Map

If you run into problems, check [TerriaJS's Problems and Solutions](https://github.com/TerriaJS/terriajs/wiki/Problems-and-Solutions).

Instructions are given for Ubuntu. Steps will be slightly different on other platforms.

Command | Comment
--------|--------
`sudo apt-get install -y git-core`|Install Git, so you can get the code.
`sudo apt-get install -y gdal-bin`|(Optional) Install GDAL, a large geospatial conversion library used to provide server-side support for a wider range of files types.
`sudo apt-get install -y nodejs-legacy npm` |Install NodeJS, used to build Terria, and run TerriaJS-Server. On Windows, download and install the MSI from the npm web site. On Mac OS X, install it via Homebrew.|
`sudo npm install -g gulp`| Install Gulp, which is the actual build tool. Install it system-wide, as administrator (Windows 8+) or sudo (Ubuntu / Mac OS X). See also: [Install npm packages globally without sudo on OS X and Linux](https://github.com/sindresorhus/guides/blob/master/npm-global-without-sudo.md).
`git clone https://github.com/TerriaJS/Map.git` | Get the code
`cd Map`|
`npm install` | Install the dependencies. This may take a while. [TerriaJS-Server](https://github.com/TerriaJS/terriajs-server) is installed to `node_modules/terriajs-server`.
`gulp` | Build it, using Gulp. This compiles all the code into just a couple of big JavaScript files and moves other assets into `wwwroot/`.
`npm start` | Start the server.

You can access your instance at [[http://localhost:3001]] in a web browser.

# Configuring

Location | Purpose
---------|---------
`wwwroot/config.json` | Client-side configuration. Configures catalog (init) files to load, attribution, keys for Bing Maps and Google Analytics, the name of your application.
`wwwroot/terria.json` | A sample catalog (init) file. You can add new datasets here.
`devserverconfig.json` | Server-side configuration. Configures which domains the server will proxy for, and special locations of init files.
`index.js`| Some "configuration-like" aspects are controlled through JavaScript in this file, such as the choices of base map. We try to progressively move these into the above files.

## Making changes

Want to start tweaking? Proceed to the [[Developers' Handbook]].