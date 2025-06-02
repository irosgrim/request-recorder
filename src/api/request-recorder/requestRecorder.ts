export interface RequestDetails {
    method: string;
    url: string;
    pathname: string;
    query: Record<string, string>;
    body: any;
  }
  
export interface ResponseDetails {
    status: number;
    statusText: string;
    body: any;
  }
  
export interface RequestRecording {
    request: RequestDetails;
    response: ResponseDetails;
    metadata: {
        timestamp: number;
        duration: number;
        key: string;
    };
};

export class RequestRecorder {
    private requests = new Map<string, RequestRecording>();
    mode: "record" | "fake" | "real" = "record";
    generateRequestKey (url: string, options: RequestInit = {}) {
        const urlObj = new URL(url, window.location.origin);
        const method = options.method ?? "GET";
        const pathname = urlObj.pathname;
        const query = Object.fromEntries(urlObj.searchParams);
        const body = options.body && typeof options.body === "string" ? JSON.parse(options.body) : null;

        const keyObj = {
            method,
            pathname,
            query,
            body
        };

        return JSON.stringify(keyObj, Object.keys(keyObj).sort());
    };

    async recordRequest(url: string, options: RequestInit = {}, response: Response, responseDuration = 0): Promise<RequestRecording> {
        const requestKey = this.generateRequestKey(url, options);
        const urlObj = new URL(url, window.location.origin);
        const body = await response.clone().json().catch(() => response.clone().text());

        const recording: RequestRecording = {
            request: {
                method: options.method ?? "GET",
                url,
                pathname: urlObj.pathname,
                query: Object.fromEntries(urlObj.searchParams),
                body: options.body ? this.parseBody(options.body) : null,
            },
            response: {
                status: response.status,
                statusText: response.statusText,
                body
            },
            metadata: {
                timestamp: Date.now(),
                duration: responseDuration,
                key: requestKey,
            }
        }

        this.requests.set(requestKey, recording);

        return recording;
    };

    parseBody(body: BodyInit |null): any {
        if (!body) return null;

        if (typeof body === "string") {
            try {
                return JSON.parse(body);
            } catch {
                return body;
            }
        };

        return body;
    };

    findRequest(url: string, options: RequestInit = {}): RequestRecording | null {
        const requestKey = this.generateRequestKey(url, options);
        const request = this.requests.get(requestKey);
        return request ?? null;
    }

    getRequests() {
        return this.requests;
    }
};