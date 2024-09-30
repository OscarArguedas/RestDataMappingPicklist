import * as SDK from 'azure-devops-extension-sdk';
import React from 'react';
import ReactDOM from 'react-dom';
import { ObservableValue } from 'azure-devops-ui/Core/Observable';
import { WorkItemTrackingServiceIds, IWorkItemFormService } from 'azure-devops-extension-api/WorkItemTracking/WorkItemTrackingServices';
import { RestServiceData } from './RestServiceData'; 
import Dropdown from './Dropdown'; 

export class SelectorEvents {
    public readonly fieldName = SDK.getConfiguration().witInputs.FieldName;
    public readonly keyFieldName = SDK.getConfiguration().witInputs.RestServiceKeyField;

    private readonly _container = document.getElementById('CustomDropdrown') as HTMLElement;
    private readonly valueObservable = new ObservableValue<string>('');
    private readonly messageObservable = new ObservableValue<string>('');
    private updatedViaSet = 0;
    private fieldMap: any = null;
    private serviceData: RestServiceData = new RestServiceData();
    private items: string[] = [];
    private isLoading: boolean = true; // Initial loading state

    // Refresh method that re-renders the dropdown
    public async refresh(selected?: string): Promise<void> {
        this.isLoading = true; // Set loading to true before fetching

        const formService = await SDK.getService<IWorkItemFormService>(
            WorkItemTrackingServiceIds.WorkItemFormService
        );

        // Get the fields and friendly name
        let fields = await formService.getFields();
        let friendlyName = fields.find((f) => f.referenceName === this.fieldName)?.name;

        // Get the selected field value
        this.valueObservable.value = await this._getSelected();

        // Fetch the items (dropdown options) from the API
        this.items = await this.serviceData.getSuggestedValues(); // Fetch items from the API

        this.isLoading = false; // Set loading to false after the items are fetched

        // Parse field mapping from the configuration, if available
        let fieldMapString = SDK.getConfiguration().witInputs.FieldMap;
        if (fieldMapString) {
            try {
                this.fieldMap = JSON.parse(fieldMapString);
            } catch (e) {
                console.info('Error parsing the field map:', e);
                this.fieldMap = null; // Reset if parsing fails
            }
        }

        // Subscribe to changes in valueObservable
        this.valueObservable.subscribe((value) => this._setSelected(value));

        // Render the Dropdown component inside the container
        ReactDOM.render(
            <Dropdown
                items={this.items} // Pass the fetched items from the API
                selected={this.valueObservable.value} // Pass the observable value
                onSelect={this._handleSelect} // Handle selection changes
                onExpand={this._expand}
                onCollapse={this._collapse}
            />,
            this._container
        );
    }

    // Fetch the currently selected value from the work item
    private async _getSelected(): Promise<string> {
        const formService = await SDK.getService<IWorkItemFormService>(
            WorkItemTrackingServiceIds.WorkItemFormService
        );
        const value = await formService.getFieldValue(this.fieldName, { returnOriginalValue: false });
        return typeof value === 'string' ? value : '';
    }

    // Update the selected value on the work item
    private _setSelected = async (value: string): Promise<void> => {
        this.updatedViaSet++;
        const formService = await SDK.getService<IWorkItemFormService>(
            WorkItemTrackingServiceIds.WorkItemFormService
        );
        await formService.setFieldValue(this.fieldName, value);

        // Use the value to update field mappings if necessary
        const restDataRow = this.serviceData.data.find((e) => e[this.keyFieldName] === value);
        if (!restDataRow) {
            this.messageObservable.value = SDK.getConfiguration().witInputs.ErrorMessage || 'Value not found';
        } else {
            this.messageObservable.value = '';
            if (this.fieldMap) {
                for (const [key, mapValue] of Object.entries(this.fieldMap)) {
                    if (typeof mapValue === 'string' && restDataRow[mapValue]) {
                        await formService.setFieldValue(key, restDataRow[mapValue] as string);
                    }
                }
            }
        }
    };

    // Expand the dropdown (could include resizing behavior)
    private _expand = (): void => {
        SDK.resize(void 0, 220);
    };

    // Collapse the dropdown (could include resizing behavior)
    private _collapse = (): void => {
        SDK.resize(void 0, 50);
    };

    // Handle the selection in the dropdown
    private _handleSelect = async (value: string | undefined): Promise<void> => {
        console.log('Selected value in parent:', value); // Debugging
        if (value) {
            this.valueObservable.value = value; // Update the observable value

            // Get the WorkItemFormService
            const formService = await SDK.getService<IWorkItemFormService>(
                WorkItemTrackingServiceIds.WorkItemFormService
            );

            // Set the field value in the work item
            await formService.setFieldValue(this.fieldName, value);
        }
    };

    // The update method to handle changes without exceeding one field update
    public async update(): Promise<void> {
        this.updatedViaSet--;
        if (this.updatedViaSet < 1) {
            this.valueObservable.value = await this._getSelected();
        }
    }
}
