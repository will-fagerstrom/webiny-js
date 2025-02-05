import { createWaitUntilHealthy } from "~/utils/waitUntilHealthy";
import { createElasticsearchClient } from "@webiny/project-utils/testing/elasticsearch/createClient";
import { ElasticsearchCatClusterHealthStatus } from "~/operations/types";
import { UnhealthyClusterError } from "~/utils/waitUntilHealthy/UnhealthyClusterError";
import { WaitingHealthyClusterAbortedError } from "~/utils/waitUntilHealthy/WaitingHealthyClusterAbortedError";

describe("wait until healthy", () => {
    const client = createElasticsearchClient();

    it("should wait until the cluster is healthy - single run", async () => {
        const waitUntilHealthy = createWaitUntilHealthy(client, {
            minClusterHealthStatus: ElasticsearchCatClusterHealthStatus.Yellow,
            maxProcessorPercent: 101,
            maxRamPercent: 101,
            maxWaitingTime: 30,
            waitingTimeStep: 5
        });

        const { runs, runningTime } = await waitUntilHealthy.wait();

        expect(runs).toEqual(1);
        expect(runningTime).toBeLessThan(30000);
    });

    it("should wait until the cluster is healthy - no max memory defined", async () => {
        const waitUntilHealthy = createWaitUntilHealthy(client, {
            minClusterHealthStatus: ElasticsearchCatClusterHealthStatus.Yellow,
            maxProcessorPercent: 101,
            maxWaitingTime: 30,
            waitingTimeStep: 5
        });

        const { runs, runningTime } = await waitUntilHealthy.wait();

        expect(runs).toEqual(1);
        expect(runningTime).toBeLessThan(30000);
    });

    it("should wait until the cluster is health - processor - max waiting time hit", async () => {
        expect.assertions(2);
        const waitUntilHealthy = createWaitUntilHealthy(client, {
            minClusterHealthStatus: ElasticsearchCatClusterHealthStatus.Yellow,
            maxProcessorPercent: 1,
            maxRamPercent: 99,
            maxWaitingTime: 3,
            waitingTimeStep: 1
        });

        try {
            await waitUntilHealthy.wait();
        } catch (ex) {
            expect(ex).toBeInstanceOf(UnhealthyClusterError);
            expect(ex.message).toEqual("Cluster did not become healthy in 3 seconds.");
        }
    });

    it("should wait until the cluster is health - memory - max waiting time hit", async () => {
        expect.assertions(2);
        const waitUntilHealthy = createWaitUntilHealthy(client, {
            minClusterHealthStatus: ElasticsearchCatClusterHealthStatus.Yellow,
            maxProcessorPercent: 99,
            maxRamPercent: 1,
            maxWaitingTime: 3,
            waitingTimeStep: 1
        });

        try {
            const { runs } = await waitUntilHealthy.wait();
            expect(runs).toEqual("reaching here would fail the test");
        } catch (ex) {
            expect(ex).toBeInstanceOf(UnhealthyClusterError);
            expect(ex.message).toEqual("Cluster did not become healthy in 3 seconds.");
        }
    });

    it("should trigger onUnhealthy callback - once", async () => {
        expect.assertions(2);
        const waitUntilHealthy = createWaitUntilHealthy(client, {
            minClusterHealthStatus: ElasticsearchCatClusterHealthStatus.Green,
            maxProcessorPercent: 1,
            maxRamPercent: 1,
            maxWaitingTime: 1,
            waitingTimeStep: 3
        });

        const onUnhealthy = jest.fn();

        try {
            const { runs } = await waitUntilHealthy.wait({
                async onUnhealthy() {
                    onUnhealthy();
                }
            });
            expect(runs).toEqual("reaching here would fail the test");
        } catch (ex) {
            expect(ex).toBeInstanceOf(UnhealthyClusterError);
        }

        expect(onUnhealthy).toHaveBeenCalledTimes(1);
    });

    it("should trigger onUnhealthy callback - multiple times", async () => {
        expect.assertions(2);
        const waitUntilHealthy = createWaitUntilHealthy(client, {
            minClusterHealthStatus: ElasticsearchCatClusterHealthStatus.Green,
            maxProcessorPercent: 1,
            maxRamPercent: 1,
            maxWaitingTime: 3,
            waitingTimeStep: 1
        });

        const onUnhealthy = jest.fn();

        try {
            const { runs } = await waitUntilHealthy.wait({
                async onUnhealthy() {
                    onUnhealthy();
                }
            });
            expect(runs).toEqual("reaching here would fail the test");
        } catch (ex) {
            expect(ex).toBeInstanceOf(UnhealthyClusterError);
        }

        expect(onUnhealthy).toHaveBeenCalledTimes(3);
    });

    it("should trigger onTimeout callback - once", async () => {
        expect.assertions(3);
        const waitUntilHealthy = createWaitUntilHealthy(client, {
            minClusterHealthStatus: ElasticsearchCatClusterHealthStatus.Green,
            maxProcessorPercent: 1,
            maxRamPercent: 1,
            maxWaitingTime: 3,
            waitingTimeStep: 1
        });

        const onUnhealthy = jest.fn();
        const onTimeout = jest.fn();

        try {
            const { runs } = await waitUntilHealthy.wait({
                async onUnhealthy() {
                    onUnhealthy();
                },
                async onTimeout() {
                    onTimeout();
                }
            });
            expect(runs).toEqual("reaching here would fail the test");
        } catch (ex) {
            expect(ex).toBeInstanceOf(UnhealthyClusterError);
        }

        expect(onUnhealthy).toHaveBeenCalledTimes(3);
        expect(onTimeout).toHaveBeenCalledTimes(1);
    });

    it("should trigger abort even before the checks start", async () => {
        expect.assertions(3);
        const waitUntilHealthy = createWaitUntilHealthy(client, {
            minClusterHealthStatus: ElasticsearchCatClusterHealthStatus.Green,
            maxProcessorPercent: 1,
            maxRamPercent: 1,
            maxWaitingTime: 1,
            waitingTimeStep: 3
        });

        waitUntilHealthy.abort();

        const onUnhealthy = jest.fn();
        const onTimeout = jest.fn();

        try {
            const { runs } = await waitUntilHealthy.wait({
                async onUnhealthy() {
                    onUnhealthy();
                    waitUntilHealthy.abort();
                },
                async onTimeout() {
                    onTimeout();
                }
            });
            expect(runs).toEqual("reaching here would fail the test");
        } catch (ex) {
            expect(ex).toBeInstanceOf(WaitingHealthyClusterAbortedError);
        }

        expect(onUnhealthy).toHaveBeenCalledTimes(0);
        expect(onTimeout).toHaveBeenCalledTimes(0);
    });

    it("should trigger abort in onUnhealthy callback", async () => {
        expect.assertions(2);
        const waitUntilHealthy = createWaitUntilHealthy(client, {
            minClusterHealthStatus: ElasticsearchCatClusterHealthStatus.Green,
            maxProcessorPercent: 1,
            maxRamPercent: 1,
            maxWaitingTime: 1,
            waitingTimeStep: 3
        });

        const onUnhealthy = jest.fn();

        try {
            const { runs } = await waitUntilHealthy.wait({
                async onUnhealthy() {
                    onUnhealthy();
                    waitUntilHealthy.abort();
                }
            });
            expect(runs).toEqual("reaching here would fail the test");
        } catch (ex) {
            expect(ex).toBeInstanceOf(WaitingHealthyClusterAbortedError);
        }

        expect(onUnhealthy).toHaveBeenCalledTimes(1);
    });
});
