/**
 * @description
 *
 * Directive for a login form that is coupled with auth.js
 * Primarily due to it listening for those specific events on
 * the scope.
 *
 * @parameter {string} url - URL to POST login credentials to
 *
 */
angular.module('ben.login.directive', [])

.directive('loginForm', loginForm);


function loginForm($rootScope) {
	return {
		restrict: 'E',
		scope: {
			url: '@'
		},
		transclude: false,
		replace: true,
		templateUrl: 'template/login/login.html',
		controller: LoginCtrl,
		controllerAs: 'login',
		link: function(scope, elem, attr, login) {
			scope.$on('event:auth-loginRequired', function() {
				login.show = true;
			});
			scope.$on('event:auth-loginConfirmed', function() {
				login.show = false;
			});
			/**
			 * This is here to show error messages if a login
			 * is done incorrectly. Not sure if there's a more
			 * semantic way to go about it than setting
			 * custom headers
			 */
			scope.$on('event:auth-loginIncorrect', function() {
				login.error = true;
			});
		}
	};
}
