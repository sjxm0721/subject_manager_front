export interface DuplicateCheckVO {
    id:string
    sourceId:string
    targetId:string
    sourceName:string
    targetName:string
    similarity:number
    briefValue:number
    backgroundValue:number
    systemDesignValue:number
    wordValue:number
    pdfValue:number
    sourceValue:number
}
