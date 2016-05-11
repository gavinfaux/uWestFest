module UrlPicker.Controllers {
    "use strict";

    interface IDefaultTypeModel {
        value: string;
    }

    interface IDefaultTypeControllerScope extends ng.IScope {
        model: IDefaultTypeModel;
    }

    export class UrlPickerDefaultTypeController {
        static $inject = ["$scope"];


        constructor(private $scope: IDefaultTypeControllerScope) {
            $scope.model.value = $scope.model.value || "content";
        }
    }

    angular.module("umbraco").controller("UrlPicker.Controllers", UrlPickerDefaultTypeController);
}
