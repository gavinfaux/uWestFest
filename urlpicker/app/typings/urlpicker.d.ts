declare namespace UrlPicker.Umbraco {
    interface editor {
        config: config;
        value: any;
    }


    interface scope {
        enableTooltip: boolean;
        disableTooltip: boolean;
        pickers: Picker[];
    }


    interface IEditorModel {
        value: any;
        config: config;
    }


    interface config {
        defaultType: string;
        contentStartNode: number;
        mediaStartNode: number;
        multipleItems: any;
        startWithAddButton: any;
        enableDisabling: any;
        oneAtATime: any;
        usePickerIcons: any;
        maxItems: number;
        mediaImagesOnly: any;
        mediaPreview: any;
    }

    interface typeData {
        url: string;
        contentId: number;
        mediaId: number;
    }

    interface meta {
        title: string;
        newWindow: boolean;
    }

    interface Picker {
        type: string;
        meta?: meta;
        typeData: typeData;
        disabled: boolean;
        content?: any;
        media?: any;
        active?: boolean;
    }

 
}