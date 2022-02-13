import React, { createContext, useContext } from "react";

type TagsContext = Record<string, string | boolean>;

const TagsContext = createContext<TagsContext>({});
TagsContext.displayName = "TagsContext";

interface TagsProps {
    tags: Record<string, string | boolean>;
    children: React.ReactNode;
}

export const Tags: React.FC<TagsProps> = ({ tags, children }) => {
    return <TagsContext.Provider value={tags}>{children}</TagsContext.Provider>;
};

export const useTags = () => {
    return useContext(TagsContext);
};
