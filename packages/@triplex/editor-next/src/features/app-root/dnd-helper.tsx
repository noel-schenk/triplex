/**
 * Copyright (c) 2022—present Michael Dougall. All rights reserved.
 *
 * This repository utilizes multiple licenses across different directories. To
 * see this files license find the nearest LICENSE file up the source tree.
 */
import { on } from "@triplex/bridge/host";
import { useDND } from "@triplex/lib";
import { Dialog } from "@triplex/ux";
import { useEffect, useState } from "react";
import {
  type UseDNDReturn,
  type UseDNDReturnError,
} from "../../../../../lib/src/use-dnd";
import { preloadSubscription } from "../../hooks/ws";
import {
  handleVSCERequestResponse,
  onVSCE,
  requestVSCE,
  type ToVSCodeEvent,
} from "../../util/bridge";
import { useSceneContext } from "./context";

export function FileDNDHelper({ children }: { children: React.ReactNode }) {
  const context = useSceneContext();

  const [errorData, setErrorData] = useState<UseDNDReturnError>();
  const [retryData, setRetryData] =
    useState<ToVSCodeEvent["component-insert"]>();

  const handleComponentInsert = async (
    _: string,
    data: ToVSCodeEvent["component-insert"],
  ) => {
    const result = await requestVSCE<UseDNDReturn, "component-insert">(
      "component-insert",
      data,
    );
    if (!result.success) {
      setErrorData(result.error);
      setRetryData(data);
    } else {
      setErrorData(undefined);
      setRetryData(undefined);
    }
  };

  const { bindingsDND } = useDND(
    handleComponentInsert,
    context.exportName,
    context.path,
  );

  useEffect(() => {
    return on("component-insert", (data) => {
      handleComponentInsert("component-insert", data);
    });
  }, []);

  useEffect(() => {
    return onVSCE("request-response", (data) => {
      handleVSCERequestResponse(data);
    });
  }, []);

  const onDismissError = () => {
    setErrorData(undefined);
    setRetryData(undefined);
  };
  const onSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    const selectedExportName = (event.currentTarget as HTMLFormElement)
      .elements[0] as HTMLSelectElement;
    const exportName = selectedExportName.value;
    if (retryData) {
      handleComponentInsert("component-insert", { ...retryData, exportName });
    }
    setErrorData(undefined);
    setRetryData(undefined);
  };

  return (
    <div className="fixed inset-0 flex select-none" {...bindingsDND}>
      {errorData && errorData.type === "unknown" && (
        <Dialog onDismiss={onDismissError}>
          <div className="flex flex-col gap-4 p-4">
            <span className="text-heading select-none font-medium">
              An error occurred while adding the component.
            </span>
            <span className="break-all text-sm text-gray-600">
              {errorData.message}
            </span>
            <div className="flex justify-end">
              <button
                className="rounded bg-blue-600 px-4 py-2 text-white"
                onClick={onDismissError}
                type="button"
              >
                Dismiss
              </button>
            </div>
          </div>
        </Dialog>
      )}
      {errorData && errorData.type === "multiple-exports" && (
        <Dialog onDismiss={onDismissError}>
          <form className="flex flex-col gap-2.5 p-2.5" onSubmit={onSubmit}>
            <span className="text-heading select-none font-medium">
              Which component do you want to add?
            </span>
            <select>
              {errorData.multipleExports.map((name) => (
                <option key={name} value={name}>
                  {name}
                </option>
              ))}
              {errorData.multipleExports.map((name) => (
                <option key={name} value={name}>
                  {name}
                </option>
              ))}
            </select>
            <div className="flex flex-col gap-1.5">
              <button
                className="rounded bg-blue-600 px-4 py-2 text-white"
                type="submit"
              >
                Add Component
              </button>
              <button
                className="rounded px-4 py-2 text-gray-600"
                onClick={onDismissError}
                type="button"
              >
                Cancel
              </button>
            </div>
          </form>
        </Dialog>
      )}
      {children}
    </div>
  );
}

preloadSubscription("/scene/:path/:exportName", {
  exportName: window.triplex.initialState.exportName,
  path: window.triplex.initialState.path,
});
