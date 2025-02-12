import React from "react";
import { Search } from "@webiny/app-aco";
import { ButtonFilters } from "./ButtonFilters";
import { ButtonsCreate } from "./ButtonsCreate";
import { Title } from "./Title";
import { ActionsColumn, Container, TitleColumn, WrapperActions } from "./styled";

interface HeaderProps {
    title?: string;
    canCreateFolder: boolean;
    canCreateContent: boolean;
    onCreateEntry: (event?: React.SyntheticEvent) => void;
    onCreateFolder: (event?: React.SyntheticEvent) => void;
    searchValue: string;
    onSearchChange: (value: string) => void;
}

export const Header = (props: HeaderProps) => {
    const {
        canCreateFolder,
        canCreateContent,
        onCreateEntry,
        onCreateFolder,
        title,
        searchValue,
        onSearchChange
    } = props;

    return (
        <Container>
            <TitleColumn>
                <Title title={title} />
            </TitleColumn>
            <ActionsColumn>
                <WrapperActions>
                    <Search value={searchValue} onChange={onSearchChange} />
                    <ButtonFilters />
                    <ButtonsCreate
                        canCreateFolder={canCreateFolder}
                        canCreateContent={canCreateContent}
                        onCreateFolder={onCreateFolder}
                        onCreateEntry={onCreateEntry}
                    />
                </WrapperActions>
            </ActionsColumn>
        </Container>
    );
};
