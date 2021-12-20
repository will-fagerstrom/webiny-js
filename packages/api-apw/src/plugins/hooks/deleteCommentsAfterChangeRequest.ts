import { ContextPlugin } from "@webiny/handler/plugins/ContextPlugin";
import { ApwContext } from "~/types";

const deleteCommentsAfterChangeRequest = () =>
    new ContextPlugin<ApwContext>(async context => {
        context.cms.onAfterEntryDelete.subscribe(async ({ model, entry }) => {
            const changeRequestedModel = await context.apw.changeRequest.getModel();
            /**
             * If deleted entry is of "changeRequested" model, also delete all associated comments.
             */
            if (model.modelId === changeRequestedModel.modelId) {
                let meta = {
                    hasMoreItems: true,
                    cursor: null
                };
                let comments = [];
                /**
                 * Paginate through comments.
                 */
                while (meta.hasMoreItems) {
                    /**
                     * Get all comments.
                     */
                    try {
                        [comments, meta] = await context.apw.comment.list({
                            where: {
                                changeRequest: {
                                    id: entry.id
                                }
                            },
                            after: meta.cursor
                        });
                    } catch (e) {
                        meta.hasMoreItems = false;
                        if (e.message !== "index_not_found_exception") {
                            throw e;
                        }
                    }

                    /**
                     * Delete comments one by one.
                     */
                    for (const comment of comments) {
                        await context.apw.comment.delete(comment.id);
                    }
                }
            }
        });
    });

export default () => deleteCommentsAfterChangeRequest();
