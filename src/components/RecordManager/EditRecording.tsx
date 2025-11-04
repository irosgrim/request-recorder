import type { RequestRecording } from "../../api/request-recorder/requestRecorder";

export const EditRecording = ({ recording }: { recording: RequestRecording }) => {
    return (
        <div>
            <p>Request:</p>
            <div>
                <div>
                    URL:
                    <input type="text" value={recording.request.pathname} />
                </div>
                <div>
                    Body:
                    <div>
                        {recording.request.body}
                    </div>
                </div>
            </div>
            <p>Response:</p>
            <div>
                Status:
                {recording.response?.status}
            </div>
            <div>
                Body:
                <textarea value={JSON.stringify(recording.response?.body)}></textarea>
            </div>

        </div>
    );
};