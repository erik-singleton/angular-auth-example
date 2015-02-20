# angular-auth-example
Example front and back end of angular authentication, with and without $scope

## Structure
The structure is loosely based off of multiple sources that demonstrate angular apps.  Everything is as modularized as it can be (though login and auth services are tied together; I need to refactor out the multiple login detection)

*src
**core
***auth.core.js
***controller.js
***constants.js
***etc
**login
***auth.login.js
***controller.js
***etc

# Back end
Simple flask app that just listens to a few endpoints
