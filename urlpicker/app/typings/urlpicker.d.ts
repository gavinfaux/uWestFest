declare namespace urlpicker {
  interface editor {
    config: config
    value: any
  }

  interface config {
    defaultType: string
    contentStartNode : number
    mediaStartNode : number
    multipleItems : boolean
    startWithAddButton : boolean
    enableDisabling : boolean
    oneAtATime : boolean
    usePickerIcons : boolean
    maxItems : number
    mediaImagesOnly: boolean
    mediaPreview: boolean
    
  }
  
  interface scope {
    enableTooltip : boolean
    disableTooltip: boolean
    pickers : UrlPicker[]
  }
  
  
  interface model {
    value: any
    config: config
    pickers: UrlPicker[]
  }

  interface typeData {
    url: string
    contentId: number
    mediaId: number
  }

  interface meta {
    title: string
    newWindow: boolean
  }

  interface UrlPicker {
    type: UrlPickerTypes
    meta: meta
    typeData: typeData
    url: string
    urlAbsolute: string
    name: string
    disabled: boolean

  }
  enum UrlPickerTypes { Url, Content, Media }
}