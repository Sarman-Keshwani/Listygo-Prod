import React from "react";
import { Form, Input, Switch, Divider } from "antd";
import { FiPhone, FiMail, FiGlobe, FiMap } from "react-icons/fi";

const ContactTab = () => {
  return (
    <>
      <h3 className="text-lg font-medium mb-4">Contact Information</h3>
      <Form.Item
        name="contactPhone"
        label="Phone Number"
        tooltip="Primary phone number for the listing"
      >
        <Input prefix={<FiPhone />} placeholder="E.g., +91 9876543210" />
      </Form.Item>

      <Form.Item
        name="contactEmail"
        label="Email Address"
        rules={[
          {
            type: "email",
            message: "Please enter a valid email address",
          },
        ]}
      >
        <Input prefix={<FiMail />} placeholder="E.g., contact@business.com" />
      </Form.Item>

      <Form.Item name="website" label="Website">
        <Input
          prefix={<FiGlobe />}
          placeholder="E.g., https://www.business.com"
        />
      </Form.Item>

      <Form.Item
        name="locationLink"
        label="Google Maps Link"
        tooltip="Share a Google Maps link for precise directions"
      >
        <Input
          prefix={<FiMap />}
          placeholder="E.g., https://goo.gl/maps/example"
        />
      </Form.Item>

      <Divider />

      <h3 className="text-lg font-medium mb-4">Owner Information</h3>

      <Form.Item
        name={["owner", "name"]}
        label="Owner Name"
        tooltip="Name of the business or property owner"
      >
        <Input placeholder="E.g., John Smith" />
      </Form.Item>

      <Form.Item name={["owner", "phone"]} label="Owner Phone">
        <Input prefix={<FiPhone />} placeholder="E.g., +91 9876543210" />
      </Form.Item>

      <Form.Item
        name={["owner", "email"]}
        label="Owner Email"
        rules={[
          {
            type: "email",
            message: "Please enter a valid email address",
          },
        ]}
      >
        <Input prefix={<FiMail />} placeholder="E.g., owner@business.com" />
      </Form.Item>

      <Form.Item
        name={["owner", "isFeatured"]}
        label="Featured Owner"
        valuePropName="checked"
        tooltip="Highlight this owner on the website"
      >
        <Switch />
      </Form.Item>
    </>
  );
};

export default ContactTab;
