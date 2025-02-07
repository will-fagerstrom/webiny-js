import { Plugin } from "@webiny/plugins/Plugin";
import { createTenancyContext, createTenancyGraphQL } from "@webiny/api-tenancy";
import { createSecurityContext, createSecurityGraphQL } from "@webiny/api-security";
import {
    SecurityIdentity,
    SecurityPermission,
    SecurityStorageOperations
} from "@webiny/api-security/types";
import { ContextPlugin } from "@webiny/api";
import { BeforeHandlerPlugin } from "@webiny/handler";
import { Context } from "~tests/types";
import { getStorageOps } from "@webiny/project-utils/testing/environment";
import { TenancyStorageOperations, Tenant } from "@webiny/api-tenancy/types";

interface Config {
    setupGraphQL?: boolean;
    permissions: SecurityPermission[];
    identity?: SecurityIdentity | null;
}

export const defaultIdentity: SecurityIdentity = {
    id: "id-12345678",
    type: "admin",
    displayName: "John Doe"
};

export const createTenancyAndSecurity = ({
    setupGraphQL,
    permissions,
    identity
}: Config): Plugin[] => {
    const tenancyStorage = getStorageOps<TenancyStorageOperations>("tenancy");
    const securityStorage = getStorageOps<SecurityStorageOperations>("security");

    return [
        new ContextPlugin<Context>(async context => {
            const original = context.wcp.canUseFeature;
            context.wcp.canUseFeature = feature => {
                if (feature === "multiTenancy") {
                    return true;
                }
                return original(feature);
            };
        }),
        createTenancyContext({ storageOperations: tenancyStorage.storageOperations }),
        setupGraphQL ? createTenancyGraphQL() : null,
        createSecurityContext({ storageOperations: securityStorage.storageOperations }),
        setupGraphQL ? createSecurityGraphQL() : null,
        new ContextPlugin<Context>(context => {
            context.tenancy.setCurrentTenant({
                id: context.request.headers["x-tenant"] || "root",
                name: context.request.headers["x-tenant"] || "Root",
                webinyVersion: context.WEBINY_VERSION
            } as unknown as Tenant);

            context.security.addAuthenticator(async () => {
                return identity || defaultIdentity;
            });

            context.security.addAuthorizer(async () => {
                const { headers = {} } = context.request || {};
                if (headers["authorization"]) {
                    return null;
                }

                return permissions || [{ name: "*" }];
            });
        }),
        new BeforeHandlerPlugin<Context>(context => {
            const { headers = {} } = context.request || {};
            if (headers["authorization"]) {
                return context.security.authenticate(headers["authorization"]);
            }

            return context.security.authenticate("");
        })
    ].filter(Boolean) as Plugin[];
};
