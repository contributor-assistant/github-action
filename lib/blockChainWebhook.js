"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (Object.hasOwnProperty.call(mod, k)) result[k] = mod[k];
    result["default"] = mod;
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
const fetch = require("node-fetch");
const core = __importStar(require("@actions/core"));
function blockChainWebhook(newSignedCommitters) {
    return __awaiter(this, void 0, void 0, function* () {
        const blockchainURL = core.getInput('blockchain-webhook-endpoint') || 'https://u9afh6n36g.execute-api.eu-central-1.amazonaws.com/dev/webhook';
        try {
            const config = {
                method: 'POST',
                headers: {
                    'Accept': 'application/json',
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(newSignedCommitters)
            };
            const res = yield fetch(blockchainURL, config);
            const response = yield res.json();
            core.debug("the response of the webhook is " + JSON.stringify(response));
            //const response = await res.json()
            if (response.success) {
                core.debug("the response2 of the webhook is " + JSON.stringify(response));
                //return json
                return response;
            }
        }
        catch (error) {
            core.setFailed('The webhook post request for storing signatures in smart contract failed' + error);
        }
    });
}
exports.default = blockChainWebhook;
