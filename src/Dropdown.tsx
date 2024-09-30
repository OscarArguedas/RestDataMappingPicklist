import React, { useState, useEffect, useRef } from 'react';
import { ListSelection, ScrollableList, ListItem, IListItemDetails } from 'azure-devops-ui/List';
import { ArrayItemProvider } from 'azure-devops-ui/Utilities/Provider';
import { TextField } from 'azure-devops-ui/TextField';
import * as SDK from 'azure-devops-extension-sdk';

type DropdownProps = {
    items: string[];
    selected: string;
    onSelect: (value: string | undefined) => void;
    onExpand: () => void;
    onCollapse: () => void;
};

const Dropdown = (props: DropdownProps): JSX.Element => {
    const [expanded, setExpanded] = useState(false);
    const [searchQuery, setSearchQuery] = useState(props.selected);  // Initialize search query with selected value
    const [position, setPosition] = useState({ top: 0, left: 0, width: 0 });
    const selection = new ListSelection({ selectOnFocus: true });
    const dropdownRef = useRef<HTMLDivElement>(null);

    // Filter items based on search query
    const filteredItems = props.items.filter(item =>
        item.toLowerCase().includes(searchQuery.toLowerCase())  // Simple case-insensitive search
    );

    // Toggle dropdown expansion
    const toggleExpanded = () => {
        setExpanded(!expanded);
        if (!expanded && dropdownRef.current) {
            const rect = dropdownRef.current.getBoundingClientRect();
            setPosition({
                top: rect.top + rect.height,
                left: rect.left,
                width: rect.width,
            });
            SDK.resize(void 0, 220); // Resize iframe when expanded
        } else {
            SDK.resize(void 0, 50); // Resize iframe when collapsed
        }
    };

    // Render individual list items
    const renderListItem = (
        index: number,
        item: string,
        details: IListItemDetails<string>,
        key?: string
    ) => (
        <ListItem
            key={key || 'list-item' + index}
            index={index}
            details={details}
            className='od-list-item'
        >
            <div className='od-content'>{item}</div>
        </ListItem>
    );

    return (
        <div className={`dropdown ${expanded ? 'expanded' : ''}`} ref={dropdownRef}>
            {/* TextField to handle search */}
            <TextField
                value={searchQuery}  // Bind search query to the TextField
                onClick={toggleExpanded}  // Trigger dropdown expansion on click
                onChange={(_, newValue) => setSearchQuery(newValue || '')}  // Update search query as the user types
                suffixIconProps={{
                    iconName: 'ChevronDown',
                    onClick: toggleExpanded,  // Allow the dropdown arrow to toggle expansion as well
                }}
                className='od-textfield'
            />
            {expanded && filteredItems.length > 0 && (
                <div
                    className='od-list-wrapper'
                    style={{
                        position: 'fixed',
                        top: `${position.top}px`,
                        left: `${position.left}px`,
                        width: `${position.width}px`,
                    }}
                >
                    <ScrollableList
                        width='100%'
                        itemProvider={new ArrayItemProvider(filteredItems)}  // Use filtered items
                        selection={selection}
                        onSelect={(_, row) => {
                            const selectedValue = row.data?.toString();
                            if (selectedValue) {
                                props.onSelect(selectedValue);  // Pass the selected value up
                                setSearchQuery(selectedValue);  // Set the selected value in the search box
                                setExpanded(false);  // Close dropdown
                                SDK.resize(void 0, 50);  // Resize iframe after collapse
                            }
                        }}
                        renderRow={renderListItem}
                    />
                </div>
            )}
        </div>
    );
};

export default Dropdown;
