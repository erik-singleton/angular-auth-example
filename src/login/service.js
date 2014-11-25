angular.module('ben.login.service', [])

.provider('loginService', loginServiceProvider);



function loginServiceProvider() {
	var defaults = {
		loginUrl: 'api/login',
		logoutUrl: 'api/logout'
	};
	return {
		defaults: defaults,
		$get: function($http) {
			return {
				login: function(options) {
					var options = options || {};
					var url = options.url || defaults.loginUrl;
					var data = options.data || {};
					return $http.post(url, data);
				},
				logout: function(options) {
					var options = options || {};
					var url = options.url || defaults.logoutUrl;
					return $http.post(url);
				}
			};
		}
	};
}
