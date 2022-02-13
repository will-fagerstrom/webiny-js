import React, { useEffect } from "react";
/**
 * Package @webiny/telemetry is not a typescript project.
 */
// @ts-ignore
import { sendEvent } from "@webiny/telemetry/react";

let eventSent = false;

export const createTelemetryProvider =
    () =>
    (Component: React.FC): React.FC => {
        return function TelemetryProvider({ children }) {
            useEffect(() => {
                if (eventSent) {
                    return;
                }

                eventSent = true;
                sendEvent("app-start");
            }, []);

            return <Component>{children}</Component>;
        };
    };
