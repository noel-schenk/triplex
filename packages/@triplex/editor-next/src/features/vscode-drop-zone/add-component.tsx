/**
 * Copyright (c) 2022—present Michael Dougall. All rights reserved.
 *
 * This repository utilizes multiple licenses across different directories. To
 * see this files license find the nearest LICENSE file up the source tree.
 */
import { useEvent } from "@triplex/lib";
import { Dialog } from "@triplex/ux";
import { useEffect, useState } from "react";
import { useLazySubscription } from "../../hooks/ws";
import { sendVSCE } from "../../util/bridge";
import { useSceneContext } from "../app-root/context";

export function AddComponentToScene({
  fileUri,
  onComplete,
}: {
  fileUri: string;
  onComplete: () => void;
}) {
  const { exportName, path } = useSceneContext();
  const components = useLazySubscription("/scene/:path", { path: fileUri });
  const onCompleteEvent = useEvent(onComplete);
  const state =
    components.exports.length === 0
      ? "abort"
      : components.exports.length > 1
        ? "select-first"
        : "ready";
  const [selectedExportName, setSelectedExportName] = useState<string>();

  useEffect(() => {
    if (state === "abort") {
      onCompleteEvent();
      return;
    }

    if (state === "ready" || (state === "select-first" && selectedExportName)) {
      const insertingExportName = components.exports.at(0)!.exportName!;

      sendVSCE("component-insert", {
        exportName,
        insertingExportName,
        insertingPath: fileUri,
        path,
      });

      onCompleteEvent();
    }
  }, [
    components,
    exportName,
    fileUri,
    onCompleteEvent,
    path,
    selectedExportName,
    state,
  ]);

  if (state === "select-first") {
    return (
      <Dialog onDismiss={onCompleteEvent}>
        <select
          autoFocus
          className="text-input invalid:border-danger bg-input border-input placeholder:text-input-placeholder w-full border p-1.5 [color-scheme:light_dark] focus:outline-none"
          onChange={(e) => {
            setSelectedExportName(e.target.value);
          }}
        >
          <option>Select component</option>
          {components.exports.map((exp) => (
            <option key={exp.exportName} value={exp.exportName}>
              {exp.name ?? exp.exportName}
            </option>
          ))}
        </select>
      </Dialog>
    );
  }

  return null;
}
