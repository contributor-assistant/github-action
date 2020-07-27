import * as core from '@actions/core'


export function pathToCLADocument() {
    const pathToCLADocument = core.getInput('path-to-cla-document')
    return pathToCLADocument
}