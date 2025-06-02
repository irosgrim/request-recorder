import { useEffect, useState } from "react";
import { interceptor, requestManager, type RecorderMode } from "../api/request-recorder/setup";

interface UseRecorderReturn {
    mode: RecorderMode;
    recordingCount: number;
    isRecording: boolean;
    isReal: boolean;
    isFake: boolean;
    setMode: (mode: RecorderMode) => void;
    save: () => void;
    clear: () => void;
    exportRecordings: () => void;
    importRecordings: (file: File) => Promise<void>;
    getEndpoints: () => string[];
}
  
export const useRecorder = (): UseRecorderReturn => {
    const [mode, setModeState] = useState<RecorderMode>(interceptor.getRequestRecorder().mode);
    const [_, setRecordingCount] = useState(0);
  
    useEffect(() => {
      setRecordingCount(interceptor.getRequestRecorder().getRequests().size);
    }, [mode]);
  
    const setMode = (newMode: RecorderMode) => {
      interceptor.getRequestRecorder().mode = newMode;
      localStorage.setItem("recorder-mode", newMode);
      setModeState(newMode);
    };
  
    const save = () => {
      requestManager.saveToLocalStorage();
      setRecordingCount(interceptor.getRequestRecorder().getRequests().size);
    };
  
    const clear = () => {
      interceptor.getRequestRecorder().getRequests().clear();
      localStorage.removeItem("api-recordings");
      setRecordingCount(0);
      setMode("real");
    };
  
    const exportRecordings = () => {
      requestManager.exportToFile();
    };
  
    const importRecordings = async (file: File) => {
      await requestManager.importFromFile(file);
      setRecordingCount(interceptor.getRequestRecorder().getRequests().size);
    };
  
    const getEndpoints = (): string[] => {
      const grouped = requestManager.getRecordingsByEndpoint();
      return Object.keys(grouped);
    };
  
    return {
      mode,
      recordingCount: interceptor.getRequestRecorder().getRequests().size,
      isRecording: mode === "record",
      isReal: mode === "real",
      isFake: mode === "fake",
      setMode,
      save,
      clear,
      exportRecordings,
      importRecordings,
      getEndpoints
    };
  };