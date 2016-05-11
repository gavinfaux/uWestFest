module UrlPicker.Controllers {
    "use strict";

    interface IUrlPickerControllerScope extends ng.IScope {
        model: Umbraco.IEditorModel;
        pickers: Umbraco.Picker[];
        control: any;
        form: ng.IFormController;
        enableTooltip: boolean;
        disableTooltip: boolean;
        switchType(type: string, picker: Umbraco.Picker): void;
        resetType(type: string, picker: Umbraco.Picker): void;
        openTreePicker(type: string, picker: Umbraco.Picker): void;
        setDirty(): void;
        sync(): void;
        getPickerIcon: (picker: any) => string;
        isEmpty(picker: Umbraco.Picker);
        getPickerHeading: (picker: any) => string;
        canSort: () => boolean;
        canDisable: () => boolean;
        showAddButton: () => boolean;
        enableDisable: (picker: any, $event: any) => void;
        canAdd: () => boolean;
        canRemove: () => boolean;
        addItem: (picker: any, $event: any) => void;
        editItem: (picker: any) => void;
        removeItem: (picker: any, $event: any) => void;
        sortableOptions: {
            axis: string;
            cursor: string;
            handle: string;
            cancel: string;
            tolerance: string;
            items: string;
            placeholder: string;
            forcePlaceholderSize: boolean;
            start: (ev: any, ui: any) => void;
            update: (ev: any, ui: any) => void;
            stop: (ev: any, ui: any) => void;
        };
    }


    export class UrlPickerController {
        static $inject = [
            "$scope", "$timeout", "dialogService", "entityResource", "mediaHelper", "angularHelper", "iconHelper",
            "localizationService"
        ];


        constructor(private $scope: IUrlPickerControllerScope,
            $timeout: any,
            dialogService: umbraco.services.IDialogService,
            entityResource: umbraco.resources.IEntityResource,
            mediaHelper: umbraco.services.IMediaHelper,
            angularHelper: umbraco.services.IAngularHelper,
            iconHelper: any,
            localizationService: any
        ) {
            var currentDialog = null;


            init();

            // get a reference to the current form
            $scope.form = $scope.form || angularHelper.getCurrentForm($scope);

            $scope.switchType = (type: string, picker: Umbraco.Picker) => {
                const index = $scope.pickers.indexOf(picker);
                $scope.pickers[index].type = type;
            };
            $scope.resetType = (type: string, picker: Umbraco.Picker) => {
                const index = $scope.pickers.indexOf(picker);
                if (type === "content") {
                    $scope.pickers[index].typeData.contentId = null;
                    $scope.pickers[index].content = null;
                } else if (type === "media") {
                    $scope.pickers[index].typeData.mediaId = null;
                    $scope.pickers[index].media = null;
                } else {
                    $scope.pickers[index].typeData.url = "";
                }
            };
            $scope.openTreePicker = (type: string, picker: Umbraco.Picker) => {

                // ensure the current dialog is cleared before creating another!
                if (currentDialog) {
                    dialogService.close(currentDialog);
                }

                var dialog: umbraco.services.IModal;

                if (type === "media") {
                    dialog = dialogService.mediaPicker({
                        onlyImages: $scope.model.config.mediaImagesOnly,
                        multiPicker: false,
                        callback: (data: any) => {

                            const media = data;
                            console.log("media", media);

                            // only show non-trashed items
                            if (media.parentId >= -1) {

                                if (!media.thumbnail) {
                                    media.thumbnail = mediaHelper.resolveFileFromEntity(media, true);
                                }

                                picker.media = {
                                    "name": media.name,
                                    "thumbnail": media.thumbnail,
                                    "icon": getSafeIcon(media.icon)
                                };
                                picker.typeData.mediaId = media.id;
                            }

                            $scope.sync();
                            $scope.setDirty();
                        }

                    });
                } else {

                    dialog = dialogService.treePicker({
                        section: type,
                        treeAlias: type,
                        startNodeId: getStartNodeId(type),
                        multiPicker: false,
                        callback: (data: any) => {

                            const content = data;

                            picker.content = { "name": content.name, "icon": getSafeIcon(content.icon) };
                            picker.typeData.contentId = content.id;

                            $scope.sync();
                            $scope.setDirty();
                        }
                    });

                }

                // save the currently assigned dialog so it can be removed before a new one is created
                currentDialog = dialog;
            };
            $scope.getPickerIcon = (picker: Umbraco.Picker) => {
                var icon = "icon-anchor";

                if (!$scope.isEmpty(picker)) {
                    if (picker.type === "content" && picker.content && picker.content.icon) {
                        icon = picker.content.icon;
                    }
                    if (picker.type === "media" && picker.media && picker.media.icon) {
                        icon = picker.media.icon;
                    }
                    if (picker.type === "url") {
                        icon = "icon-link";
                    }
                }

                return icon;
            };
            $scope.getPickerHeading = (picker: Umbraco.Picker) => {
                var title = "(no link)";

                if (!$scope.isEmpty(picker) && picker.typeData) {
                    const metaTitle = picker.meta.title;

                    if (picker.type === "content" && picker.content) {
                        title = metaTitle || picker.content.name;
                    }
                    if (picker.type === "media" && picker.media) {
                        title = metaTitle || picker.media.name;
                    }
                    if (picker.type === "url") {
                        title = metaTitle || picker.typeData.url;
                    }
                }

                return title;
            };

            // helper to check if picker is empty
            $scope.isEmpty = (picker: Umbraco.Picker) => {
                if (picker.type === "content") {
                    if (!isNullOrEmpty(picker.typeData.contentId)) {
                        return false;
                    }
                }
                if (picker.type === "media") {
                    if (!isNullOrEmpty(picker.typeData.mediaId)) {
                        return false;
                    }
                }
                if (picker.type === "url") {
                    if (!isNullOrEmpty(picker.typeData.url)) {
                        return false;
                    }
                }
                return true;
            };

            // helper that returns if an item can be sorted
            $scope.canSort = () => (countVisible() > 1);

            // helper that returns if an item can be disabled
            $scope.canDisable = () => $scope.model.config.enableDisabling;

            // helpers for determining if the add button should be shown
            $scope.showAddButton = () => ($scope.model.config.startWithAddButton && countVisible() === 0);
            $scope.enableDisable = (picker: Umbraco.Picker, $event: any) => {
                picker.disabled = !picker.disabled;
                $scope.sync();
                // explicitly set the form as dirty when manipulating the enabled/disabled state of a picker
                $scope.setDirty();

                // on recent browsers, only $event.stopPropagation() is needed
                if ($event.stopPropagation) {
                    $event.stopPropagation();
                }
                if ($event.preventDefault) {
                    $event.preventDefault();
                }
                $event.cancelBubble = true;
                $event.returnValue = false;
            };

            // helpers for determining if a user can do something
            $scope.canAdd = () => {
                if (!$scope.model.config.multipleItems && countVisible() === 1) {
                    return false;
                }
                return ($scope.model.config.maxItems > countVisible());
            };

            // helper that returns if an item can be removed
            $scope.canRemove = () => (countVisible() > 1 || $scope.model.config.startWithAddButton);

            // helper to force the current form into the dirty state
            $scope.setDirty = () => {
                if ($scope.form) {
                    $scope.form.$setDirty();
                }
            };
            $scope.addItem = (picker: Umbraco.Picker, $event: any) => {
                var defaultType = "content";
                if ($scope.model.config.defaultType) {
                    defaultType = $scope.model.config.defaultType;
                }

                const pickerObj = {
                    "type": defaultType,
                    "meta": { "title": "", "newWindow": false },
                    "typeData": { "url": "", "contentId": null, "mediaId": null },
                    "disabled": false
                };

                // collapse other panels
                if ($scope.model.config.oneAtATime) {
                    for (let i = 0; i < $scope.pickers.length; i++) {
                        $scope.pickers[i].active = false;
                    }
                }

                if (picker != null) {
                    const index = $scope.pickers.indexOf(picker);
                    $scope.pickers.splice(index + 1, 0, pickerObj);
                    $scope.pickers[index].active = false;
                    $scope.pickers[index + 1].active = true;
                } else {
                    $scope.pickers.push(pickerObj);
                    $scope.pickers[$scope.pickers.length - 1].active = true;
                }

                console.log("$scope.sync()");
                $scope.sync();

                // explicitly set the form as dirty when manipulating the enabled/disabled state of a picker
                $scope.setDirty();

                // on recent browsers, only $event.stopPropagation() is needed
                if ($event.stopPropagation) {
                    $event.stopPropagation();
                }
                if ($event.preventDefault) {
                    $event.preventDefault();
                }
                $event.cancelBubble = true;
                $event.returnValue = false;
            };
            $scope.editItem = (picker: Umbraco.Picker) => {

                const index = $scope.pickers.indexOf(picker);
                const isActive = $scope.pickers[index].active;

                // collapse other panels
                if ($scope.model.config.oneAtATime) {
                    for (let i = 0; i < $scope.pickers.length; i++) {
                        if (i !== index || isActive) {
                            $scope.pickers[i].active = false;
                        }
                    }
                }

                if (!isActive) {
                    $scope.pickers[index].active = true;
                } else {
                    $scope.pickers[index].active = false;
                }

            };
            $scope.removeItem = (picker: Umbraco.Picker, $event: any) => {
                const index = $scope.pickers.indexOf(picker);
                if (confirm("Are you sure you want to remove this item?")) {
                    $scope.pickers.splice(index, 1);
                    $scope.sync();
                    $scope.setDirty();
                }

                // on recent browsers, only $event.stopPropagation() is needed
                if ($event.stopPropagation) {
                    $event.stopPropagation();
                }
                if ($event.preventDefault) {
                    $event.preventDefault();
                }
                $event.cancelBubble = true;
                $event.returnValue = false;
            };

            // sort config
            $scope.sortableOptions = {
                axis: "y",
                cursor: "move",
                // cursorAt: { top: height / 2, left: width / 2 },
                handle: ".handle",
                cancel: ".no-drag",
                // containment: "parent", // it seems to be an issue to use containment, when sortable items not have same height
                tolerance: "intersect", // 'pointer'
                items: "> li:not(.unsortable)",
                placeholder: "sortable-placeholder",
                forcePlaceholderSize: true,
                start: (ev: any, ui: any) => {
                    // var panelHeight = $(ui.item).find(".panel").height();

                    // ui.placeholder.height(ui.item.height());
                    // ui.placeholder.width(ui.item.width());
                    const height = ui.item.height();
                    const width = ui.item.width();

                    $(ui.helper.item)
                        .draggable("option",
                            "cursorAt",
                            {
                                left: Math.floor(width / 2),
                                top: Math.floor(height / 2)
                            });
                },
                update: () => {
                    $scope.setDirty();
                },
                stop: () => {
                    return;
                }
            };

            // helper to count what is visible
            function countVisible() {
                return $scope.pickers.length;
            }

            // helper to get initial model if none was provided
            function getDefaultModel(config: any) {
                if (config.startWithAddButton) {
                    return [];
                }
                return [
                    {
                        "type": config.defaultType,
                        "meta": { "title": "", "newWindow": false },
                        "typeData": { "url": "", "contentId": null, "mediaId": null },
                        "disabled": false
                    }
                ]; // [getEmptyRenderFieldset(config.fieldsets[0])] };
            }

            function isNullOrEmpty(value: any) {
                return value == null || value === "";
            }

            function getSafeIcon(icon: any) {
                // fix icon if it is a legacy icon
                if (iconHelper.isLegacyIcon(icon)) {
                    return iconHelper.convertFromLegacyIcon(icon);
                }
                return icon;
            }

            function getStartNodeId(type: string) {
                if (type === "content") {
                    return $scope.model.config.contentStartNode;
                } else {
                    return $scope.model.config.mediaStartNode;
                }
            }

            // function getEntityName(id, typeAlias) {
            //    if (!id) {
            //        return "";
            //    }

            //    return entityResource.getById(id, typeAlias).then(function (entity) {
            //        return entity.data.name;
            //    });
            // }

            function isNumeric(n: any) {
                return !isNaN(parseInt(n, 10));
            }

            // setup "render model" & defaults
            function init() {
                var defaultType: string;
                // content start node
                if (!$scope.model.config.contentStartNode) {
                    $scope.model.config.contentStartNode = -1;
                }
                // media start node
                if (!$scope.model.config.mediaStartNode) {
                    $scope.model.config.mediaStartNode = -1;
                }

                // multiple items
                if (!$scope.model.config.multipleItems || $scope.model.config.multipleItems === 0) {
                    $scope.model.config.multipleItems = false;
                } else {
                    $scope.model.config.multipleItems = true;
                }

                // default type
                if ($scope.model.config.defaultType) {
                    defaultType = $scope.model.config.defaultType;
                } else {
                    defaultType = "content";
                }

                // start with add-button
                if (!$scope.model.config.startWithAddButton || $scope.model.config.startWithAddButton === 0) {
                    $scope.model.config.startWithAddButton = false;
                } else {
                    $scope.model.config.startWithAddButton = true;
                }

                // enable/disable pickers
                if (!$scope.model.config.enableDisabling || $scope.model.config.enableDisabling === 0) {
                    $scope.model.config.enableDisabling = false;
                } else {
                    $scope.model.config.enableDisabling = true;
                }

                // one picker open at a time
                if (!$scope.model.config.oneAtATime || $scope.model.config.oneAtATime === 0) {
                    $scope.model.config.oneAtATime = false;
                } else {
                    $scope.model.config.oneAtATime = true;
                }

                // use picker icons
                if (!$scope.model.config.usePickerIcons || $scope.model.config.usePickerIcons === 0) {
                    $scope.model.config.usePickerIcons = false;
                } else {
                    $scope.model.config.usePickerIcons = true;
                }

                // max items
                if (!$scope.model.config.maxItems) {
                    $scope.model.config.maxItems = Number.MAX_VALUE;
                } else {
                    $scope.model.config.maxItems = isNumeric($scope.model.config.maxItems) &&
                        $scope.model.config.maxItems !== 0 &&
                        $scope.model.config.maxItems > 0
                        ? $scope.model.config.maxItems
                        : Number.MAX_VALUE;
                }

                // allow only to select media images
                if (!$scope.model.config.mediaImagesOnly || $scope.model.config.mediaImagesOnly === 0) {
                    $scope.model.config.mediaImagesOnly = false;
                } else {
                    $scope.model.config.mediaImagesOnly = true;
                }

                // use media preview
                if (!$scope.model.config.mediaPreview || $scope.model.config.mediaPreview === 0) {
                    $scope.model.config.mediaPreview = false;
                } else {
                    $scope.model.config.mediaPreview = true;
                }

                $scope.enableTooltip = localizationService.localize("urlPicker_enable");
                $scope.disableTooltip = localizationService.localize("urlPicker_disable");

                $scope.pickers = $scope.model.value
                    ? angular.fromJson($scope.model.value)
                    : getDefaultModel($scope.model.config);

                // init media and content name and icon from typeData id's
                angular.forEach($scope.pickers,
                (obj: any) => {
                    var contentId: number;
                    var mediaId: number;

                    if (obj.typeData) {
                        if (obj.typeData.contentId) {
                            contentId = obj.typeData.contentId;
                        };
                        if (obj.typeData.mediaId) {
                            mediaId = obj.typeData.mediaId;
                        };
                    }

                    if (contentId) {
                        entityResource.getById(contentId, "Document")
                            .then((content: any) => {
                                // only show non-trashed items
                                if (content.data.parentId >= -1) {
                                    obj.content = {
                                        "name": content.data.name,
                                        "icon": getSafeIcon(content.data.icon)
                                    };
                                }
                            });
                    }

                    if (mediaId) {
                        entityResource.getById(mediaId, "Media")
                            .then((media: any) => {
                                // only show non-trashed items
                                if (media.data.parentId >= -1) {

                                    if (!media.data.thumbnail) {
                                        media.data.thumbnail = mediaHelper.resolveFileFromEntity(media, true);
                                    }

                                    obj.media = {
                                        "name": media.data.name,
                                        "thumbnail": media.data.thumbnail,
                                        "icon": getSafeIcon(media.data.icon)
                                    };
                                }
                            });
                        // todo: handle scenario where selected media has been deleted
                    }
                });

            }

            $scope.sync = () => {
                const array = $scope.pickers ? angular.copy($scope.pickers) : [];
                array.forEach((v: any) => {
                    delete v.active;
                    // delete v.disabled;
                    delete v.media;
                    delete v.content;
                });

                $scope.model.value = angular.toJson(array, true);
            };

        }

    }

    angular.module("umbraco").controller("UrlPicker.Controllers", UrlPickerController);
}
