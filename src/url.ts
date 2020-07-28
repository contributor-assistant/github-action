import * as core from '@actions/core'


export function pathToCLADocument() {
    const pathToCLADocument = core.getInput('path-to-cla-document')
    core.info(`pathToCLADocument ----> ${pathToCLADocument}`)
    return pathToCLADocument
}