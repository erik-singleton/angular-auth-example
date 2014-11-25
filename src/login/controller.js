/**
 * @description
 *
 * Controller used by ben.login.directive
 *
 */
angular.module('ben.login.controller', [])

.controller('LoginCtrl', LoginCtrl);



function LoginCtrl($scope, authService, loginService) {
	// this.x exposes these variables to the scope
	this.authService = authService;
	this.loginService = loginService;
	this.url = $scope.url; // Pull URL from dom attribute
	this.show = false;
}

/**
 * @description
 *
 * POSTs the login information to {$scope.url}. On success
 * call the authService.loginConfirmed() method, on rejection
 * set error flag to true.
 *
 */
LoginCtrl.prototype.postForm = function() {
	var _this = this;
	var options = {
		data: {
			username: _this.user,
			password: _this.password
		}
	};
	_this.loginService.login(options).then(function(resp) {
		if (resp.status >= 200 && resp.status < 400) {
			_this.authService.loginConfirmed()
		}
	}, function(rejection) {
		if (rejection.status >= 400) {
			_this.error = true;
		}
	});
};

LoginCtrl.prototype.logout = function() {
	var _this = this;
	_this.loginService.logout();
};
