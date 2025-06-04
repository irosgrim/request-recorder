import { RequestRecorder, type RequestDetails } from "./requestRecorder";


export class RequestInterceptor {
    private originalFetch: typeof window.fetch;
    private requestRecorder: RequestRecorder;

    constructor() {
        this.requestRecorder = new RequestRecorder();
        this.originalFetch = window.fetch.bind(window);
    }

    init() {
        const fakeRequest = async (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
            const url = new URL(input instanceof Request ? input.url : input).toString();
            const options = init || {};
            const startTime = Date.now();
            const urlObj = new URL(url, window.location.origin);

            const requestDetails: RequestDetails = {
                method: options.method ?? "GET",
                url: url,
                pathname: urlObj.pathname,
                query: Object.fromEntries(urlObj.searchParams),
                body: options.body ? this.requestRecorder.parseBody(options.body) : null,
            };

            switch (this.requestRecorder.mode) {
                case "real":
                    return this.originalFetch(input, init);

                case "fake":
                    const recording = this.requestRecorder.findRequest(url, options);
                    if (recording) {
                        console.log("[FAKE] response for:", requestDetails);
                        const delay = recording.metadata.duration || 200;
                        await new Promise((resolve) => setTimeout(resolve, delay));
                        return new Response(JSON.stringify(recording.response.body), {
                            status: recording.response.status,
                            statusText: recording.response.statusText,
                        });
                    } else {
                        console.warn("[FAKE] no request found for:", requestDetails);
                        throw new Error(`[FAKE] no request found for: ${url}`);
                    }

                case "record":
                    try {
                        const response = await this.originalFetch(url, options);
                        const duration = Date.now() - startTime;
                        const recording = await this.requestRecorder.recordRequest(url, options, response);
                        recording.metadata.duration = duration;
                        console.log("[FAKE] Recorded: ", requestDetails);
                        return response;
                    } catch (error) {
                        console.error("Network error: ", error);
                        throw error;
                    }

                default:
                    return this.originalFetch(input, init);
            }
        };

        window.fetch = fakeRequest;
    }

    getRequestRecorder(): RequestRecorder {
        return this.requestRecorder;
    }

    unfake() {
        window.fetch = this.originalFetch;
    }
}