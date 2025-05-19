import React from "react";
import { Form, Input, Alert } from "antd";

const { TextArea } = Input;

const AttributesTab = ({ attributeString, setAttributeString }) => {
  return (
    <>
      <Alert
        message="Custom Attributes"
        description={
          <span>
            Add custom attributes for the listing in a comma-separated format.
            <br />
            Example: <code>Bedrooms: 3, Bathrooms: 2, Floors: 2</code>
            <br />
            These will be displayed as additional features of the listing.
          </span>
        }
        type="info"
        showIcon
        className="mb-4"
      />

      <Form.Item
        label="Attributes"
        tooltip="Enter comma-separated key-value pairs for custom attributes"
      >
        <TextArea
          rows={4}
          placeholder="Bedrooms: 3, Bathrooms: 2, Area: 1200 sqft, Year Built: 2018"
          value={attributeString}
          onChange={(e) => setAttributeString(e.target.value)}
        />
      </Form.Item>

      <div className="text-gray-500 text-sm mt-2">
        <h4 className="font-medium mb-1">Format Tips:</h4>
        <ul className="list-disc pl-5">
          <li>Use a comma to separate different attributes</li>
          <li>Use a colon or equals sign to separate keys and values</li>
          <li>Avoid using brackets, quotes, or special characters</li>
          <li>Keep keys short and descriptive</li>
        </ul>
      </div>
    </>
  );
};

export default AttributesTab;
