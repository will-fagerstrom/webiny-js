import React from "react";
import dotProp from "dot-prop-immutable";
import {
    CmsModelFieldRendererPlugin,
    CmsModelFieldRendererProps
} from "@webiny/app-headless-cms/types";
import { i18n } from "@webiny/app/i18n";
import { FileManager } from "@webiny/app-admin/components";
import styled from "@emotion/styled";
import { imageWrapperStyles } from "./utils";
import { File } from "./File";
import { EditFileUsingUrl } from "~/components/EditFileUsingUrl";
import { FormElementMessage } from "@webiny/ui/FormElementMessage";

const t = i18n.ns("app-headless-cms/admin/fields/file");

const FileUploadWrapper = styled("div")({
    position: "relative",
    ".disabled": {
        opacity: 0.75,
        pointerEvents: "none"
    },
    ".mdc-text-field-helper-text": {
        color: "var(--mdc-theme-text-secondary-on-background)"
    }
});

const InnerImageFieldWrapper = styled("div")({
    background: "repeating-conic-gradient(#efefef 0% 25%, transparent 0% 50%) 50%/25px 25px",
    boxSizing: "border-box",
    border: "1px solid var(--mdc-theme-background)",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    flexBasis: "100%",
    padding: "30px",
    height: "220px"
});

const Gallery = styled.div`
    display: flex;
    flex-wrap: wrap;
    justify-content: flex-start;
    gap: 10px;
    > div {
        flex: 1 1 21%;
        max-width: 25%;
        > img {
            padding: 15px;
        }
    }
`;

const FieldRenderer = ({ getBind, Label, field }: CmsModelFieldRendererProps) => {
    const Bind = getBind();

    const imagesOnly = field.settings && field.settings.imagesOnly;

    return (
        <EditFileUsingUrl>
            {({ editFile }) => (
                <Bind>
                    {bind => {
                        const { onChange, validation } = bind;

                        // We need to make sure the value is an array, since this is a multi-value component.
                        const value: string[] = (
                            Array.isArray(bind.value) ? bind.value : [bind.value]
                        ).filter(Boolean);

                        return (
                            <FileUploadWrapper className={imageWrapperStyles}>
                                <FileManager
                                    multiple
                                    images={imagesOnly}
                                    render={({ showFileManager }) => {
                                        const selectFiles = (index = -1) => {
                                            showFileManager(files => {
                                                const urls = files.map(f => f.src);
                                                if (index === -1) {
                                                    onChange([...value, ...urls]);
                                                } else {
                                                    onChange([
                                                        ...value.slice(0, index),
                                                        ...urls,
                                                        ...value.slice(index + 1)
                                                    ]);
                                                }
                                            });
                                        };
                                        return (
                                            <>
                                                <Label>{field.label}</Label>

                                                <Gallery>
                                                    {value.map((url: string, index: number) => (
                                                        <InnerImageFieldWrapper key={url}>
                                                            <File
                                                                url={url}
                                                                showFileManager={() =>
                                                                    selectFiles(index)
                                                                }
                                                                onEdit={() => editFile(url)}
                                                                onRemove={() =>
                                                                    onChange(
                                                                        dotProp.delete(value, index)
                                                                    )
                                                                }
                                                                placeholder={t`Select a file"`}
                                                                data-testid={`fr.input.file.${field.label}.${index}`}
                                                            />
                                                        </InnerImageFieldWrapper>
                                                    ))}
                                                    <InnerImageFieldWrapper>
                                                        <File
                                                            url={""}
                                                            onRemove={() => {
                                                                return void 0;
                                                            }}
                                                            {...bind}
                                                            showFileManager={() => selectFiles()}
                                                            placeholder={t`Select a file"`}
                                                            data-testid={`fr.input.file.${field.label}`}
                                                        />
                                                    </InnerImageFieldWrapper>
                                                </Gallery>

                                                {validation.isValid === false && (
                                                    <FormElementMessage error>
                                                        {validation.message || "Invalid value."}
                                                    </FormElementMessage>
                                                )}
                                                {validation.isValid !== false && field.helpText && (
                                                    <FormElementMessage>
                                                        {field.helpText}
                                                    </FormElementMessage>
                                                )}
                                            </>
                                        );
                                    }}
                                />
                            </FileUploadWrapper>
                        );
                    }}
                </Bind>
            )}
        </EditFileUsingUrl>
    );
};

export const multipleFiles: CmsModelFieldRendererPlugin = {
    type: "cms-editor-field-renderer",
    name: "cms-editor-field-renderer-files",
    renderer: {
        rendererName: "file-inputs",
        name: t`File Inputs`,
        description: t`Enables selecting multiple files via File Manager.`,
        canUse({ field }) {
            return field.type === "file" && !!field.multipleValues;
        },
        render(props) {
            return <FieldRenderer {...props} />;
        }
    }
};
