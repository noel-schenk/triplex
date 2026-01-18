/**
 * Copyright (c) 2022—present Michael Dougall. All rights reserved.
 *
 * This repository utilizes multiple licenses across different directories. To
 * see this files license find the nearest LICENSE file up the source tree.
 */
import { dropTargetForExternal } from "@atlaskit/pragmatic-drag-and-drop/external/adapter";
import {
  containsText,
  getText,
} from "@atlaskit/pragmatic-drag-and-drop/external/text";
import { useEvent } from "@triplex/lib";
import { Suspense, useEffect, useState } from "react";
import { useLazySubscription } from "../../hooks/ws";
import { sendVSCE } from "../../util/bridge";
import { useSceneContext } from "../app-root/context";

function AddComponentToScene({
  fileUri,
  onComplete,
}: {
  fileUri: string;
  onComplete: () => void;
}) {
  const { exportName, path } = useSceneContext();
  const components = useLazySubscription("/scene/:path", { path: fileUri });
  const onCompleteEvent = useEvent(onComplete);

  useEffect(() => {
    if (components.exports.length === 0) {
      onCompleteEvent();
      return;
    }

    const insertingExportName = components.exports.at(0)!.exportName!;

    sendVSCE("component-insert", {
      exportName,
      insertingExportName,
      insertingPath: fileUri,
      path,
    });

    onCompleteEvent();
  }, [components, exportName, fileUri, onCompleteEvent, path]);

  return null;
}

/** Captures file drop events from the VSCode tree explorer. */
export function VSCodeDropZone() {
  const [fileUri, setFileUri] = useState<string>();

  useEffect(() => {
    return dropTargetForExternal({
      canDrop: containsText,
      element: document.body,
      onDrop({ source }) {
        const text = getText({ source });
        const uri = text?.split("\n").at(0);

        setFileUri(uri);
      },
    });
  }, []);

  if (fileUri) {
    return (
      <Suspense>
        <AddComponentToScene
          fileUri={fileUri}
          onComplete={() => {
            setFileUri(undefined);
          }}
        />
      </Suspense>
    );
  }

  return null;
}
