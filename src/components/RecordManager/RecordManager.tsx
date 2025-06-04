import { useState, useEffect } from "react";
import "./RecordManager.css";
import { useRecorder } from "../../hooks/useRecorder";

export const RecordManager = () => {
    const {
        mode,
        recordingCount,
        isRecording,
        isFake,
        setMode,
        save,
        clear,
        exportRecordings,
        importRecordings,
        getEndpoints,
    } = useRecorder();

    const [showEndpoints, setShowEndpoints] = useState(false);
    const [isMinimized, setIsMinimized] = useState(false);
    const [loading, setIsLoading] = useState(true);

    useEffect(() => {
        setIsLoading(true);
        const stored = localStorage.getItem("recorderIsMinimized");
        setIsMinimized(stored === "true");
        setIsLoading(false)
    }, []);

    const handleSetIsMinimized = (val: boolean) => {
        setIsMinimized(val);
        localStorage.setItem("recorderIsMinimized", String(val));
    };

    const handleFileImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            await importRecordings(file);
            e.target.value = "";
        }
    };

    if (isMinimized) {
        return (
            <div className="recorder-devtools-minimized">
                <button onClick={() => handleSetIsMinimized(false)}>
                    ::{mode}::
                </button>
            </div>
        );
    }

    if (loading) {
        return <></>;
    }


    return (
        <div className="recorder-devtools">
            <div className="recorder-devtools-header">
                <h3 className="recorder-devtools-title">API Recorder</h3>
                <button
                    onClick={() => handleSetIsMinimized(true)}
                    className="recorder-devtools-minimize"
                >
                    _
                </button>
            </div>

            <div className="recorder-devtools-content">
                <div className="recorder-devtools-row">
                    <span className="recorder-devtools-label">Mode:</span>
                    <span className={`recorder-devtools-mode ${mode}`}>
                        {mode}
                    </span>
                </div>

                <div className="recorder-devtools-row">
                    <span className="recorder-devtools-label">Recorded requests:</span>
                    <span className="recorder-devtools-count">{recordingCount}</span>
                </div>

                <div className="recorder-devtools-button-group three-columns">
                    <button
                        onClick={() => setMode("record")}
                        className={`recorder-devtools-button ${isRecording ? "active-record" : "default"
                            }`}
                    >
                        Record requests
                    </button>
                    <button
                        onClick={() => setMode("fake")}
                        className={`recorder-devtools-button ${isFake ? "active-fake" : "default"
                            }`}
                    >
                        Fake
                    </button>
                    <button
                        onClick={() => setMode("real")}
                        className={`recorder-devtools-button ${mode === "real" ? "active-real" : "default"
                            }`}
                    >
                        Real
                    </button>
                </div>

                <div className="recorder-devtools-button-group two-columns">
                    <button
                        onClick={save}
                        className="recorder-devtools-button default"
                    >
                        💾 Save
                    </button>
                    <button
                        onClick={clear}
                        className="recorder-devtools-button default"
                    >
                        🗑️ Clear
                    </button>
                </div>

                <div className="recorder-devtools-button-group two-columns">
                    <button
                        onClick={exportRecordings}
                        className="recorder-devtools-button default"
                    >
                        📤 Export
                    </button>
                    <label className="recorder-devtools-file-label">
                        📥 Import
                        <input
                            type="file"
                            accept=".json"
                            onChange={handleFileImport}
                            className="recorder-devtools-file-input"
                        />
                    </label>
                </div>

                <button
                    onClick={() => setShowEndpoints(!showEndpoints)}
                    className="recorder-devtools-button default full-width"
                >
                    {showEndpoints ? "Hide" : "Show"} recorded requests ({getEndpoints().length})
                </button>

                {showEndpoints && (
                    <ul className="recorder-devtools-endpoints">
                        {getEndpoints().map((endpoint, i) => (
                            <li key={i} className="recorder-devtools-endpoint">
                                {endpoint}
                            </li>
                        ))}
                    </ul>
                )}
            </div>
        </div>
    );
};