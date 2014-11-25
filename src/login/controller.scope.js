angular.module('ben.login.controller', [])

/**
 * It doesn't look so bad here because the controller is so
 * small, but every instantiation of LoginCtrl (were it used
 * multiple times) would create $scope.postForm every time
 * which is why the real example uses a named function with 
 * prototypes.
 *
 * A better example of ugly ugly $scope with a giant controller
 * is my first app:
 *
 * http://dev.eriksingleton.com/aplus/scripts/app/controllers/ContentCtrl.js
 *
 * Holy shit $scope and $scope.$watch everywhere
 *
 *
 * An example of my current controllers is:
 *
 * http://dev.eriksingleton.com/ces/schedule/src/ces/controller.js
 *
 * Which I think looks much cleaner.
 *
 */
.controller('LoginCtrl', function($http, $scope, authService, loginService) {
	$scope.show = false;
	$scope.error = false;
	$scope.postForm = function() {
		var options = {
			data = {
				email: $scope.email,
				password: $scope.password
			}
		};
		loginService(options).then(function(resp) {
			if (resp.status >= 200 && resp.status < 400) {
				authService.loginConfirmed()
			}
		}, function(rejection) {
			if (rejection.status >= 400) {
				$scope.error = true;
			}
		});
	};
});
