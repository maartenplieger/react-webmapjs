# react-webmapjs

# Inspecting the components with storybook
Storbyook can be used to view the components.
If you run `npm run storybook` a storbook server will start in which you can see all the components for which stories
are written.

## Writing a new story
Stories live in the stories folder. Here is the documentation on the syntax for adding new stories: 
https://storybook.js.org/docs/basics/writing-stories/

# Setting up CI/CD
## Creating an authentication token
To be able to publish to npm CI/CD requires an authentication token.

To create a token, see:
https://docs.npmjs.com/creating-and-viewing-authentication-tokens

As soon as you've created the token, go to GitLab and:
1. Click on Settings --> CI/CD --> Variables
2. Change or create the NPM_AUTHENTICATION_TOKEN variable to the created authentication token.

