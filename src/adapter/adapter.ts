import {AdapterRequest, AdapterResponse} from "../config.js";

// Define the interface for an Adapter that can send requests to a language model and receive responses
export interface Adapter {
    sendRequest(request: AdapterRequest): Promise<AdapterResponse>;
}