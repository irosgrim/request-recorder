import type { RequestRecorder, RequestRecording } from "./requestRecorder";
import IndexedDb from "./storage";

interface RecordingData {
    recordings: Array<RequestRecording & { key: string }>;
    exportDate?: string;
  }

export const storage =  new IndexedDb("api-recordings", 1, "recordings");

export class RequestRecordingManager {
    private recorder: RequestRecorder;
    private storageKey = "api-recordings";
    
    constructor(recorder: RequestRecorder) {
        this.recorder = recorder;
    }
  
    saveToStorage(): void {
      const data = Array.from(this.recorder.getRequests().entries());
      storage.set(data);
    }
  
    async loadFromStorage() {
        const stored = await storage.getAll<RequestRecording>();
        if (!stored) return;
        
        try {
        stored.forEach(recording => {
            const [key, requestRecording ] = recording;
            this.recorder.getRequests().set(key, requestRecording);
        });
        } catch (error) {
            console.error("Failed to load request recordings", error);
        }
    }
  
    exportToFile(): void {
        const data: RecordingData = {
            exportDate: new Date().toISOString(),
            recordings: Array.from(this.recorder.getRequests().entries()).map(([key, recording]) => ({
            key,
            ...recording
            }))
        };
        
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${this.storageKey}-${Date.now()}.json`;
        a.click();
        URL.revokeObjectURL(url);
    }
  
    async importFromFile(file: File): Promise<number> {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (e) => {
                try {
                    const data: RecordingData = JSON.parse(e.target?.result as string);
                    data.recordings.forEach(recording => {
                        const { key, ...recordingData } = recording;
                        this.recorder.getRequests().set(key, recordingData as RequestRecording);
                    });
                    resolve(data.recordings.length);
                } catch (error) {
                    reject(error);
                }
            };
            reader.readAsText(file);
        });
    }
  
    getRecordingsByEndpoint(): Record<string, Array<RequestRecording & { key: string }>> {
        const grouped: Record<string, Array<RequestRecording & { key: string }>> = {};
        
        this.recorder.getRequests().forEach((recording, key) => {
            const endpoint = `${recording.request.method} ${recording.request.url}`;
            if (!grouped[endpoint]) {
                grouped[endpoint] = [];
            }
            grouped[endpoint].push({ key, ...recording });
        });
        
        return grouped;
    }
  }