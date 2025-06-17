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
    response: ResponseDetails | null;
    metadata: {
        timestamp: number;
        duration: number;
        passThrough: boolean;
    };
};

const deepSortObject = (value: any): any => {
    if (Array.isArray(value)) {
        return value.map(deepSortObject);
    } else if (value && typeof value === "object" && value.constructor === Object) {
        return Object.keys(value)
        .sort()
        .reduce((acc, key) => {
            acc[key] = deepSortObject(value[key]);
            return acc;
        }, {} as any);
    }
    return value;
};

export class RequestRecorder {
    private requests = new Map<string, RequestRecording>();
    mode: "record" | "fake" | "real" = "record";

    generateRequestKey(url: string, options: RequestInit = {}) {
        const urlObj = new URL(url, window.location.origin);
        const method = options.method ?? "GET";
        const pathname = urlObj.pathname;
        const query = Object.fromEntries(urlObj.searchParams);
        const body = options.body && typeof options.body === "string" ? JSON.parse(options.body) : null;

        const keyObj = {
            method,
            pathname,
            query,
            body,
        };

        return JSON.stringify(deepSortObject(keyObj));
    };

    async recordRequest(url: string, options: RequestInit = {}, response: Response, responseDuration = 0): Promise<RequestRecording> {
        const requestKey = this.generateRequestKey(url, options);
        const urlObj = new URL(url, window.location.origin);
        const existingRecording = this.requests.get(requestKey);
        const shouldPassThrough = existingRecording?.metadata.passThrough ?? false;

        const body = await response
            .clone()
            .json()
            .catch(() => response.clone().text());

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
                body,
            },
            metadata: {
                timestamp: Date.now(),
                duration: responseDuration,
                passThrough: shouldPassThrough,
                // key: requestKey,
            },
        }

        this.requests.set(requestKey, recording);

        return recording;
    };

    togglePassThrough(requestKey: string): boolean {
        const recording = this.requests.get(requestKey);
        if (recording) {
            const newPassThroughState = !recording.metadata.passThrough;
            recording.metadata.passThrough = newPassThroughState;
            
            return newPassThroughState;
        }

        return false;
    }

    parseBody(body: BodyInit | null): any {
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

    getRequest(key: string) {
        return this.requests.get(key);
    }
};