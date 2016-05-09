# Url Picker

Url Picker Property Editor from uWestFest

Install via NuGet or the Umbraco Package Installer: https://github.com/imulus/uWestFest/releases

## Setup

### Install Dependencies

```bash
npm install -g grunt-cli
npm install
```

### Build

```bash
grunt
```

### Watch

```bash
grunt watch
```

### TypeScript

**wip**

* not --save-dev yet
* tsc step not needed if using grunt task

```bash
npm install grunt-ts
npm install typescript
npm install tslint
npm install typings
typings install angular --ambient --save
typings install jquery --ambient --save
tsc -p ./app
```

tsconfig.json -   "listFiles": true for debugging

tsc issues? get rid of C:\Program Files (x86)\Microsoft SDKs\TypeScript\1.0 from path

force build

```bash
grunt --force
```