## ⚙️ Environment Presetup

Before running the project, make sure your environment is properly configured.

### **1. Install Node.js**

This project requires **Node.js version 24 or higher**.

Download from the official website:\
https://nodejs.org/

Check the installed version:

``` bash
node -v
```

### **2. Install Project Dependencies**

After cloning the repository, run:

``` bash
npm install
```

## 🏗️ Build package

Publishing the package, make sure you build it first:

- up package version

``` bash
ng build feato-client
```

## 🚀 Publish package to NPM

``` bash
cd .\dist\feato-client\
npm login
npm publish --access public
```