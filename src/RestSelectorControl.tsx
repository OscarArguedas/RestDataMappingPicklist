import React, { useState, useEffect } from 'react';
import { Spinner, SpinnerSize } from 'azure-devops-ui/Spinner';
import { FormItem } from 'azure-devops-ui/FormItem';
import './RestSelector.css'; 
import Dropdown from './Dropdown';

type RestSelectorControlProps = {
  items: string[];
  selected: string;
  onSelect: (value: string | undefined) => Promise<void>;
  loading: boolean;
  onExpand: () => void;
  onCollapse: () => void;
};

export const RestSelectorControl: React.FC<RestSelectorControlProps> = ({
  items,
  selected,
  loading,
  onSelect,
  onExpand,
  onCollapse,
}) => {
  const [currentSelected, setCurrentSelected] = useState<string>(selected); // Manage selected state

  // Handle user selection and update the selected value
  const handleSelect = async (value: string | undefined) => {
    if (value) {
      setCurrentSelected(value); // Update local selected state
      await onSelect(value);  // Pass the selected value to the parent
    }
  };

  return (
    <FormItem label="Select an Option">
      {loading ? (
        <Spinner size={SpinnerSize.medium} /> // Spinner shown while loading
      ) : (
        <Dropdown
          items={items}
          selected={currentSelected}
          onSelect={handleSelect}
          onExpand={onExpand}
          onCollapse={onCollapse}
        />
      )}
    </FormItem>
  );
};
