export interface FormState {
    id: string
    title: string
    subjectId: string | number
    subjectType: number
    brief: string
    hardwareTech: string
    softwareTech: string
    background: string
    systemDesign: string
    attachmentWord: string
    attachmentPdf: string
    attachmentSource: string
    attachmentMp4: string
}

export interface FileList {
    word: FileItem[]
    pdf: FileItem[]
    source: FileItem[]
    mp4: FileItem[]
}

export interface FileItem {
    name: string
    url: string
}
