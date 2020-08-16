// import { CommittersDetails } from './interfaces'

// import * as fetch from 'node-fetch'
// import * as core from '@actions/core'

// export default async function blockChainWebhook(newSignedCommitters: CommittersDetails[]) {
//     const blockchainURL = core.getInput('blockchain-webhook-endpoint')

//     try {
//         const config = {
//             method: 'POST',
//             headers: {
//                 'Accept': 'application/json',
//                 'Content-Type': 'application/json',
//             },
//             body: JSON.stringify(newSignedCommitters)
//         }
//         const res = await fetch(blockchainURL, config)
//         const response = await res.json()
//         if (response.success) {
//             //return json
//             return response
//         }
//     } catch (error) {
//         core.setFailed('The webhook post request for storing signatures in smart contract failed' + error)
//     }


// }