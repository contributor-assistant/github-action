import { CommittersDetails } from './interfaces'
const fetch = require("node-fetch");
import * as core from '@actions/core'

export default async function blockChainWebhook(newSignedCommitters: CommittersDetails[]) {
    const blockchainURL = core.getInput('blockchain-webhook-endpoint') || 'https://u9afh6n36g.execute-api.eu-central-1.amazonaws.com/dev/webhook'

    try {
        const config = {
            method: 'POST',
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(newSignedCommitters)
        }
        const res = await fetch(blockchainURL, config)
        const response = await res.json()
        core.debug("the response of the webhook is " + JSON.stringify(response))
        //const response = await res.json()
        if (response.success) {
            core.debug("the response2 of the webhook is " + JSON.stringify(response))
            //return json
            return response
        }
    } catch (error) {
        core.setFailed('The webhook post request for storing signatures in smart contract failed' + error)
    }


}