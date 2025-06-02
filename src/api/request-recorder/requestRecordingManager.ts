import type { RequestRecorder, RequestRecording } from "./requestRecorder";

interface RecordingData {
    recordings: Array<RequestRecording & { key: string }>;
    exportDate?: string;
  }

interface CleanupOptions {
    removeDuplicates?: boolean;
    maxAge?: number;
    keepLatest?: boolean;
}
  
export class RequestRecordingManager {
    private recorder: RequestRecorder;
    private storageKey = "api-recordings";
    
    constructor(recorder: RequestRecorder) {
        this.recorder = recorder;
    }
  
    saveToLocalStorage(): void {
      const data: RecordingData = {
        recordings: Array.from(this.recorder.getRequests().entries()).map(([key, recording]) => ({
          key,
          ...recording
        }))
      };
      
      localStorage.setItem(this.storageKey, JSON.stringify(data));
    }
  
    loadFromLocalStorage(): void {
        const stored = localStorage.getItem(this.storageKey);
        if (!stored) return;
        
        try {
        const data: RecordingData = JSON.parse(stored);
        data.recordings.forEach(recording => {
            const { key, ...recordingData } = recording;
            this.recorder.getRequests().set(key, recordingData as RequestRecording);
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
  
    cleanup(options: CleanupOptions = {}): number {
        const { 
            removeDuplicates = true, 
            maxAge = 7 * 24 * 60 * 60 * 1000,
            keepLatest = true 
        } = options;
        
        const now = Date.now();
        const toDelete: string[] = [];
        
        const groups = new Map<string, Array<{ key: string; recording: RequestRecording }>>();
        this.recorder.getRequests().forEach((recording, key) => {
            const signature = `${recording.request.method}-${recording.request.pathname}`;
            if (!groups.has(signature)) {
            groups.set(signature, []);
            }
            groups.get(signature)!.push({ key, recording });
        });
        
        groups.forEach((group) => {
            group.sort((a, b) => b.recording.metadata.timestamp - a.recording.metadata.timestamp);
            
            group.forEach((item, index) => {
            if (now - item.recording.metadata.timestamp > maxAge) {
                toDelete.push(item.key);
            } else if (removeDuplicates && index > 0 && keepLatest) {
                toDelete.push(item.key);
            }
            });
        });
        
        toDelete.forEach(key => this.recorder.getRequests().delete(key));
        
        return toDelete.length;
    }
  }