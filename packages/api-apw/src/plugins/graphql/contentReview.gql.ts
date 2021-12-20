import { GraphQLSchemaPlugin } from "@webiny/handler-graphql/plugins";
import { ErrorResponse, ListResponse } from "@webiny/handler-graphql";
import { CmsEntryListParams } from "@webiny/api-headless-cms/types";
import { ApwContext } from "~/types";
import { generateFieldResolvers } from "~/utils/fieldResolver";
import resolve from "~/utils/resolve";

const fields = ["steps", "content", "status"];

const contentReviewSchema = new GraphQLSchemaPlugin<ApwContext>({
    typeDefs: /* GraphQL */ `
        type ApwContentReviewListItem {
            # System generated fields
            id: ID
            pid: ID
            publishedOn: DateTime
            locked: Boolean
            version: Int
            savedOn: DateTime
            createdFrom: ID
            createdOn: DateTime
            createdBy: ApwCreatedBy
            # ContentReview specific fields
            #            changeRequested: [ApwContentReviewChangeRequested]
            steps: [ApwContentReviewStep]
            content: ApwContentReviewContent
            status: ApwContentReviewStatus
        }

        type ApwListContentReviewsResponse {
            data: [ApwContentReviewListItem]
            error: ApwError
            meta: ApwMeta
        }

        type ApwContentReviewReviewer {
            id: ID
            displayName: String
        }

        type ApwContentReviewComment {
            body: JSON
            author: String
        }

        type ApwContentReviewChangeRequested {
            title: String
            body: JSON
            media: JSON
            step: String
            resolved: Boolean
            comments: [ApwContentReviewComment]
        }

        enum ApwContentReviewStepStatus {
            done
            active
            inactive
        }

        enum ApwContentReviewStatus {
            underReview
            readyToBePublished
            published
        }

        type ApwContentReviewStep {
            status: ApwContentReviewStepStatus
            slug: String
            pendingChangeRequests: Int
            signOffProvidedOn: DateTime
            signOffProvidedBy: ApwCreatedBy
        }

        type ApwContentReview {
            # System generated fields
            id: ID
            pid: ID
            publishedOn: DateTime
            locked: Boolean
            version: Int
            savedOn: DateTime
            createdFrom: ID
            createdOn: DateTime
            createdBy: ApwCreatedBy
            # ContentReview specific fields
            # changeRequested: [ApwContentReviewChangeRequested]
            steps: [ApwContentReviewStep]
            content: ApwContentReviewContent
            workflow: ID
            status: ApwContentReviewStatus
        }

        type ApwContentReviewResponse {
            data: ApwContentReview
            error: ApwError
        }

        type ApwDeleteContentReviewResponse {
            data: Boolean
            error: ApwError
        }

        enum ApwListContentReviewsSort {
            id_ASC
            id_DESC
            savedOn_ASC
            savedOn_DESC
            createdOn_ASC
            createdOn_DESC
            publishedOn_ASC
            publishedOn_DESC
            title_ASC
            title_DESC
        }

        input ApwContentReviewReviewerInput {
            id: ID
        }

        input ApwContentReviewScopeInput {
            type: String
            options: JSON
            # More fields will come later on.
        }

        input ApwContentReviewCommentInput {
            body: JSON
            author: String
        }

        input ApwContentReviewChangeRequestedInput {
            title: String
            body: JSON
            media: JSON
            step: String
            resolved: Boolean
            comments: [ApwContentReviewCommentInput]
        }

        enum ApwContentReviewContentTypes {
            page
            cms_entry
        }

        type ApwContentReviewContent {
            id: ID
            type: ApwContentReviewContentTypes
            settings: String
        }

        input ApwContentReviewContentInput {
            id: ID!
            type: ApwContentReviewContentTypes!
            settings: String
        }

        input ApwCreateContentReviewInput {
            #            workflow: ID!
            content: ApwContentReviewContentInput!
        }

        input ApwUpdateContentReviewInput {
            changeRequested: [ApwContentReviewChangeRequestedInput]
        }

        input ApwListContentReviewsWhereInput {
            id: ID
        }

        input ApwListContentReviewsSearchInput {
            # By specifying "query", the search will be performed against workflow' "title" field.
            query: String
        }

        type ApwProvideSignOffResponse {
            data: Boolean
            error: ApwError
        }

        extend type ApwQuery {
            getContentReview(id: ID!): ApwContentReviewResponse

            listContentReviews(
                where: ApwListContentReviewsWhereInput
                limit: Int
                after: String
                sort: [ApwListContentReviewsSort!]
                search: ApwListContentReviewsSearchInput
            ): ApwListContentReviewsResponse
        }

        extend type ApwMutation {
            createContentReview(data: ApwCreateContentReviewInput!): ApwContentReviewResponse

            updateContentReview(
                id: ID!
                data: ApwUpdateContentReviewInput!
            ): ApwContentReviewResponse

            deleteContentReview(id: ID!): ApwDeleteContentReviewResponse

            provideSignOff(id: ID!, step: String!): ApwProvideSignOffResponse

            retractSignOff(id: ID!, step: String!): ApwProvideSignOffResponse
        }
    `,
    resolvers: {
        ApwContentReview: {
            ...generateFieldResolvers(fields)
        },
        ApwContentReviewListItem: {
            ...generateFieldResolvers(fields)
        },
        ApwQuery: {
            getContentReview: async (_, args, context) => {
                return resolve(() => context.apw.contentReview.get(args.id));
            },
            listContentReviews: async (_, args: CmsEntryListParams, context) => {
                try {
                    const [entries, meta] = await context.apw.contentReview.list(args);
                    return new ListResponse(entries, meta);
                } catch (e) {
                    return new ErrorResponse(e);
                }
            }
        },
        ApwMutation: {
            createContentReview: async (_, args, context) => {
                return resolve(() => context.apw.contentReview.create(args.data));
            },
            updateContentReview: async (_, args, context) => {
                return resolve(() => context.apw.contentReview.update(args.id, args.data));
            },
            deleteContentReview: async (_, args, context) => {
                return resolve(() => context.apw.contentReview.delete(args.id));
            },
            provideSignOff: async (_, args, context) => {
                return resolve(() => context.apw.contentReview.provideSignOff(args.id, args.step));
            },
            retractSignOff: async (_, args, context) => {
                return resolve(() => context.apw.contentReview.retractSignOff(args.id, args.step));
            }
        }
    }
});

export default contentReviewSchema;
