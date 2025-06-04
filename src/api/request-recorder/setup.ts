import { RequestInterceptor } from "./requestInterceptor";
import { RequestRecordingManager } from "./requestRecordingManager";

export const interceptor = new RequestInterceptor();
export const requestManager = new RequestRecordingManager(interceptor.getRequestRecorder());
export type RecorderMode = "record" | "fake" | "real";

export const initializeRecorder = async () => {
  interceptor.init();
  await requestManager.loadFromStorage();
  const savedMode = localStorage.getItem("recorder-mode") as RecorderMode;

  if (savedMode) {
      interceptor.getRequestRecorder().mode = savedMode;
  } else {
      interceptor.getRequestRecorder().mode = "real";
      localStorage.setItem("recorder-mode", "real");
  }

  console.log(`API requests recorder initialized. ` + `\n${interceptor.getRequestRecorder().getRequests().size} recordings loaded.`);
};
