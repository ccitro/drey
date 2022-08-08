import { Container, Title } from "@mantine/core";
import equal from "fast-deep-equal/react";
import { useCallback, useEffect, useState } from "react";
import { useDispatch } from "react-redux";
import { useAppSelector } from "store/store";

import { importEditorConfig } from "../../store/configEditorSlice";
import { ChangeAlert } from "./ChangeAlert";
import { ConfigEditorForm } from "./ConfigEditorForm";
import { EditorControls } from "./EditorControls";
import { ImportDialog } from "./ImportDialog";

interface ConfigEditorProps {
    onSaveRequest: (newConfigJson: string) => Promise<boolean>;
}

export default function ConfigEditor({ onSaveRequest }: ConfigEditorProps) {
    const dispatch = useDispatch();
    const editorConfig = useAppSelector((s) => s.configEditor.dreyConfig);
    const liveConfig = useAppSelector((s) => s.liveConfig.dreyConfig);
    const [initialConfig, setInitialConfig] = useState<DreyConfig>(JSON.parse(JSON.stringify(editorConfig)));
    const [showingImport, setShowingImport] = useState(false);

    // detect when the config is changed by another source (tab, user, etc)
    // if this editor doesn't have any unsaved changes, then immediately update it with the new config
    useEffect(() => {
        if (!equal(liveConfig, initialConfig) && equal(editorConfig, initialConfig)) {
            dispatch(importEditorConfig(liveConfig));
            setInitialConfig(liveConfig);
        }
    }, [editorConfig, liveConfig, initialConfig, dispatch]);

    const onSaveClick = useCallback(async () => {
        if (await onSaveRequest(JSON.stringify(editorConfig))) {
            setInitialConfig(editorConfig);
        }
    }, [editorConfig, onSaveRequest]);

    const onDiscardClick = useCallback(() => {
        setInitialConfig(liveConfig);
        dispatch(importEditorConfig(liveConfig));
    }, [liveConfig, dispatch]);

    const onImportClick = async (c: string) => setShowingImport(!(await onSaveRequest(c)));
    const configChanged = !equal(editorConfig, initialConfig);
    const remoteChanged = configChanged && !equal(liveConfig, initialConfig);

    return (
        <Container size="sm" my="lg">
            <Title order={3}>Config Editor</Title>
            {remoteChanged && <ChangeAlert />}
            <ImportDialog opened={showingImport} onClose={() => setShowingImport(false)} onSave={onImportClick} />

            <EditorControls
                config={editorConfig}
                configChanged={configChanged}
                onSaveClick={onSaveClick}
                onDiscardClick={onDiscardClick}
                onImportClick={() => setShowingImport(true)}
            />

            <ConfigEditorForm />
        </Container>
    );
}
