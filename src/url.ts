import * as core from '@actions/core'


export function pathToCLADocument() {
    const pathToCLADocument = core.getInput('path-To-cladocument')
    return pathToCLADocument
}