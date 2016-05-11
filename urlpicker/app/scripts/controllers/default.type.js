var UrlPicker;
(function (UrlPicker) {
    var Controllers;
    (function (Controllers) {
        "use strict";
        var UrlPickerDefaultTypeController = (function () {
            function UrlPickerDefaultTypeController($scope) {
                this.$scope = $scope;
                $scope.model.value = $scope.model.value || "content";
            }
            UrlPickerDefaultTypeController.$inject = ["$scope"];
            return UrlPickerDefaultTypeController;
        }());
        Controllers.UrlPickerDefaultTypeController = UrlPickerDefaultTypeController;
        angular.module("umbraco").controller("UrlPicker.Controllers", UrlPickerDefaultTypeController);
    })(Controllers = UrlPicker.Controllers || (UrlPicker.Controllers = {}));
})(UrlPicker || (UrlPicker = {}));
//# sourceMappingURL=default.type.js.map