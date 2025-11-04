import { useState } from "react";
import type { RequestRecording } from "../../api/request-recorder/requestRecorder";
import { useRecorder } from "../../hooks/useRecorder";
import { SchemaExtractor } from "../../utils/schemaExtractor";
import "./SchemaTree.css";
import { EditRecording } from "./EditRecording";

const SchemaTree = ({ schema, level = 0 }: { schema: any; level?: number }) => {
    const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});

    const toggleCollapse = (path: string) => {
        setCollapsed(prev => ({ ...prev, [path]: !prev[path] }));
    };

    const getTypeClassName = (type: string) => {
        switch (type) {
            case "object": return "schema-type-object";
            case "array": return "schema-type-array";
            case "string": return "schema-type-string";
            case "number": return "schema-type-number";
            case "boolean": return "schema-type-boolean";
            case "null": return "schema-type-null";
            default: return "schema-type-string";
        }
    };

    const renderProperty = (key: string, value: any, path = key) => {
        const levelClass = `schema-level-${Math.min(level, 9)}`;

        if (value.type === "object" && value.properties) {
            const isCollapsed = collapsed[path];
            return (
                <div key={path} className={`schema-property ${levelClass}`}>
                    <div
                        className="schema-property-content schema-property-clickable"
                        onClick={() => toggleCollapse(path)}
                    >
                        <span className="schema-collapse-icon">
                            {isCollapsed ? "▶" : "▼"}
                        </span>
                        <span className="schema-key">{key}</span>
                        <span className={`schema-type ${getTypeClassName("object")}`}>
                            object
                        </span>
                    </div>
                    {!isCollapsed && (
                        <div className="schema-children">
                            {Object.entries(value.properties).map(([propKey, propValue]) =>
                                renderProperty(propKey, propValue, `${path}.${propKey}`)
                            )}
                        </div>
                    )}
                </div>
            );
        }

        if (value.type === "array") {
            return (
                <div key={path} className={`schema-property ${levelClass}`}>
                    <div className="schema-property-content">
                        <span className="schema-key">{key}</span>
                        <span className={`schema-type ${getTypeClassName("array")}`}>
                            array
                        </span>
                    </div>
                    {value.items && (
                        <div className="schema-array-items">
                            <span className="schema-items-label">items:</span>
                            {value.items.type ? (
                                <>
                                    <span className={`schema-type ${getTypeClassName(value.items.type)}`}>
                                        {value.items.type}
                                    </span>
                                    {value.items.properties && Object.keys(value.items.properties).length > 0 && (
                                        <div className="schema-children">
                                            {Object.entries(value.items.properties).map(([propKey, propValue]) =>
                                                renderProperty(propKey, propValue, `${path}.items.${propKey}`)
                                            )}
                                        </div>
                                    )}
                                </>
                            ) : (
                                <span className="schema-type schema-type-null">empty</span>
                            )}
                        </div>
                    )}
                </div>
            );
        }

        return (
            <div key={path} className={`schema-property ${levelClass}`}>
                <div className="schema-property-content">
                    <span className="schema-key">{key}</span>
                    <span className={`schema-type ${getTypeClassName(value.type)}`}>
                        {value.type}
                    </span>
                    {value.format && (
                        <span className="schema-format">({value.format})</span>
                    )}
                </div>
            </div>
        );
    };

    return (
        <>
            <div className="schema-tree">
                {schema.properties && Object.keys(schema.properties).length > 0 ? (
                    Object.entries(schema.properties).map(([key, value]) =>
                        renderProperty(key, value, key)
                    )
                ) : (
                    <div className="schema-no-properties">No properties found</div>
                )}
            </div>
        </>
    );
};


export const EndpointInfo = ({ requestKey, recording }: { requestKey: string; recording: RequestRecording }) => {
    const [_, setPassThrough] = useState(recording.metadata.passThrough);

    const {
        togglePassThrough,
    } = useRecorder();
    const [showResponseSchema, setShowResponseSchema] = useState<any | null>(null);
    const [showEdit, setShowEdit] = useState(false);

    const handleTogglePassThrough = (requestKey: string) => {
        const toggle = togglePassThrough(requestKey);
        setPassThrough(toggle);
    }

    const showSchema = (obj: any) => {
        setShowEdit(false);
        if (showResponseSchema) {
            setShowResponseSchema(null);
            return;
        }

        const s = SchemaExtractor.toJSONSchema(obj);
        setShowResponseSchema(s);
    }

    const handleEdit = () => {
        setShowEdit(!showEdit);
        setShowResponseSchema(null);
    };

    return (
        <div
            className="recorder-devtools-endpoint"
        >
            <div
                className={`${recording.metadata.passThrough ? "passthrough-enabled" : ""}`}
                style={{
                    display: "flex",
                    padding: "0.5rem"
                }}
            >
                <div className="recording-info">
                    <div className="recording-endpoint">
                        <div className={`method ${recording.request.method}`}>
                            {recording.request.method}
                        </div>
                        <div
                            className="path"
                            title={recording.request.pathname}
                        >
                            <span>
                                {recording.request.pathname}
                            </span>
                        </div>

                    </div>

                    <div className="recording-meta">
                        <div>
                            <button className="transparent schema" onClick={() => showSchema(recording.response?.body)}>{showResponseSchema ? "Hide" : "Show"} schema</button>
                            <button className="transparent edit" onClick={() => handleEdit()}>Edit request</button>
                        </div>
                    </div>
                </div>

                <button
                    onClick={() => handleTogglePassThrough(requestKey)}
                    className={`passthrough-toggle ${recording.metadata.passThrough ? "active-passthrough" : ""}`}
                    title={recording.metadata.passThrough ? "Disable pass-through" : "Enable pass-through"}
                >
                    {recording.metadata.passThrough ? "Pass-through ON" : "Pass-through OFF"}
                </button>
            </div>

            <div>
                {
                    showResponseSchema && <SchemaTree schema={showResponseSchema} />
                }
                {
                    showEdit && <EditRecording recording={recording} />
                }
            </div>

        </div>
    )
};