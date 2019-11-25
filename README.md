# react-webmapjs

# Install environment

To run and develop react-webmapjs you need npm. The easiest way to install npm is via nvm. Please visit https://nvm.sh/ and follow the instructions. When nvm is installed, please do the following command:

```
nvm install 8
```

After that you need to install its dependencies, do inside the react-webmapjs folder:
```
npm install
```

To start the storybook do:
```
npm run storybook
```



# Usage
To also use the styling, one should import the stylesheet from the dist folder:
```
import '@adaguc/react-webmapjs/dist/main.css';
```

# Development
## Inspecting the components with storybook
Storybook can be used to view the components.
If you run `npm run storybook` a storybook server will start in which you can see all the components for which stories
are written.

## Writing a new story
Stories live in the stories folder. 
Here is the documentation on the syntax for adding new stories: 
https://storybook.js.org/docs/basics/writing-stories/

## Deploying a static version of your storybook

The storybook can be compiled to a static version via `npm run build-storybook`. The static contents is then placed in the folder storybook-react-webmapjs.

## Tests
Test can be run by the following command:
`npm test`
This will run all the tests specified in the stories without starting a browser.
Currently only the mounting of components is tested, no interaction testing is implemented yet.

## Testing the package in another project
To test the package in another project without publishing it, you can follow these steps:
1. `npm run build`
2. `npm pack`
3. `cd <path/to/your/project>`
4. `npm install <absolute path/to/tar/created/by/npm pack>`

# Setting up CI/CD
## Creating an authentication token
To be able to publish to npm CI/CD requires an authentication token.

To create a token, see:
https://docs.npmjs.com/creating-and-viewing-authentication-tokens

As soon as you've created the token, go to GitLab and:
1. Click on Settings --> CI/CD --> Variables
2. Change or create the NPM_TOKEN variable to the created authentication token.

# To create a new package:

1. Adjust version number in package.json
2. Adjust version numberin WMJSMap.js
3. Publish: 
```
npm run clean && npm install && npm run build && npm publish
```
