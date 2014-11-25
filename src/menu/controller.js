angular.module('ben.menu.controller', [])

.controller('TopMenuCtrl', TopMenuCtrl);

function TopMenuCtrl($state, menuItems, loginService) {
	this.$state = $state;
	this.menu = menuItems.menu;
	this.loginService = loginService;
}	

/**
 * @description
 *
 * Uses the loginService to logout and $state to reload page
 *
 */
TopMenuCtrl.prototype.logout = function() {
	var _this = this;
	_this.loginService.logout().then(function(resp) {
		_this.$state.reload();
	});
};
