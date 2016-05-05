angular.module('umbraco').controller('UrlPickerGridController', function($scope, dialogService, entityResource, mediaHelper, $timeout, angularHelper) {

    $scope.title = '';
    var currentDialog = null;

    var alreadyDirty = false;

    $scope.switchType = function(type) {
        $scope.control.value.type = type;

    }

    $scope.resetType = function(type) {
        if (type === 'content') {
            $scope.control.value.typeData.contentId = null;
            $scope.contentName = "";
        } else if (type === "media") {
            $scope.control.value.typeData.mediaId = null;
            $scope.mediaName = "";
            $scope.media = null;
        } else {
            $scope.control.value.typeData.url = "";
        }
    }

    $scope.preview = function(bool) {
        $scope.title = getTitle();
        $scope.previewMode = bool;
    }

    function getTitle() {
        switch ($scope.control.value.type) {
            case "url":
                return $scope.control.value.meta.title !== "" ? $scope.control.value.meta.title : $scope.control.value.typeData.url;
            case "content":
                return $scope.control.value.meta.title !== "" ? $scope.control.value.meta.title : $scope.contentName;
            case "media":
                return $scope.control.value.meta.title !== "" ? $scope.control.value.meta.title : $scope.mediaName;
        }
    };

    function validate() {
        switch ($scope.control.value.type) {
            case "content":
                $scope.controlValid = $scope.control.value.typeData.contentId !== null;
                break;
            case "media":
                $scope.controlValid = $scope.control.value.typeData.mediaId !== null;
                break;
            default:
                $scope.controlValid = $scope.urlPattern.test($scope.control.value.typeData.url) === true;
                break;
        }
        return $scope.controlValid;
    };

    $scope.openTreePicker = function(type) {

        //ensure the current dialog is cleared before creating another!
        if (currentDialog) {
            dialogService.close(currentDialog);
        }

        var dialog;

        if (type === "media") {
            dialog = dialogService.mediaPicker({
                onlyImages: $scope.control.editor.config.mediaImagesOnly,
                multiPicker: false,
                callback: function(data) {

                    var media = data;

                    if (!media.thumbnail) {
                        media.thumbnail = mediaHelper.resolveFileFromEntity(media, true);
                    }

                    $scope.media = media;

                    $scope.control.value.typeData.mediaId = data.id;
                    $scope.mediaName = getEntityName(data.id, "Media");
                }

            });
        } else {

            dialog = dialogService.treePicker({
                section: type,
                treeAlias: type,
                startNodeId: getStartNodeId(type),
                multiPicker: false,
                callback: function(data) {
                    $scope.control.value.typeData.contentId = data.id;
                    $scope.contentName = getEntityName(data.id, "Document");
                }
            });

        }

        //save the currently assigned dialog so it can be removed before a new one is created
        currentDialog = dialog;
    }

    function getStartNodeId(type) {
        if (type === "content") {
            return $scope.control.editor.config.contentStartNode;
        } else {
            return $scope.control.editor.config.mediaStartNode;
        }
    }

    function getEntityName(id, typeAlias) {
        if (!id) {
            return "";
        }

        return entityResource.getById(id, typeAlias).then(function(entity) {
            return entity.name;

        }, function (err) {
            $scope.title = err.errorMsg;
            return err.errorMsg;
        });
    }

    // Setup "render model" & defaults
    function init() {

        $scope.urlPattern = /^https?:\/\/[a-zA-Z0-9-.]+.[a-zA-Z]{2,}$/;

        if (!$scope.control.editor.config.contentStartNode)
            $scope.control.editor.config.contentStartNode = -1;

        if (!$scope.control.editor.config.mediaStartNode)
            $scope.control.editor.config.mediaStartNode = -1;

        if (!$scope.control.editor.config.mediaImagesOnly || $scope.control.editor.config.mediaImagesOnly === 0) {
            $scope.control.editor.config.mediaImagesOnly = false;
        }
        else {
            $scope.control.editor.config.mediaImagesOnly = true;
        }

        if (!$scope.control.editor.config.mediaPreview || $scope.control.editor.config.mediaPreview === 0) {
            $scope.control.editor.config.mediaPreview = false;
        }
        else {
            $scope.control.editor.config.mediaPreview = true;

            var mediaId = $scope.control.value !== null ? $scope.control.value.typeData != null ? $scope.control.value.typeData.mediaId : null : null;

            if (mediaId) {
                entityResource.getById(mediaId, "Media").then(function(media) {
                    if (!media.thumbnail) {
                        media.thumbnail = mediaHelper.resolveFileFromEntity(media, true);
                    }

                    $scope.media = media;
                });
                //Todo: handle scenario where selected media has been deleted
            }
        }

        if (!$scope.control.value || !$scope.control.value.type) {
            var defaultType = "content";

            if ($scope.control.editor.config.defaultType) {
                defaultType = $scope.control.editor.config.defaultType;
            }

            $scope.control.value = { "type": defaultType, "meta": { "title": "", "newWindow": false }, "typeData": { "url": "", "contentId": null, "mediaId": null } };
        }

        if ($scope.control.value.typeData && $scope.control.value.typeData.contentId) {
            $scope.contentName = getEntityName($scope.control.value.typeData.contentId, "Document");
        }

        if ($scope.control.value.typeData && $scope.control.value.typeData.mediaId) {
            $scope.mediaName = getEntityName($scope.control.value.typeData.mediaId, "Media");
        }
        if (validate() === true) {
            $scope.preview(true);
        }
    }

    init();


    $scope.$watch('control.value', function(newval, oldval) {
        validate();

        if (newval !== oldval) {
            //run after DOM is loaded
            $timeout(function() {
                if (!alreadyDirty) {
                    var currForm = angularHelper.getCurrentForm($scope);
                    currForm.$setDirty();
                    alreadyDirty = true;
                }
            }, 0);
        }
    }, true);

});
