import React from "react";
import { Form, message, Input, Select, InputNumber, Rate, Switch } from "antd";
import { FiHome, FiDollarSign, FiMapPin } from "react-icons/fi";
import countries from "../../../components/countries.json";
import states from "../../../components/states.json";
import cities from "../../../components/cities.json";

const { Option } = Select;
const { TextArea } = Input;

const BasicInfoTab = ({
  categories,
  selectedCountry,
  setSelectedCountry,
  selectedState,
  setSelectedState,
  filteredStates,
  setFilteredStates,
  filteredCities,
  setFilteredCities,
  form, // Add form to props
}) => {
  const handleCountryChange = (countryId) => {
    setSelectedCountry(countryId);
    setSelectedState(null);
    form.setFieldsValue({ state: undefined, city: undefined }); // Use form instance

    const statesInCountry = states.filter(
      (state) => state.country_id === countryId
    );
    setFilteredStates(statesInCountry);
    setFilteredCities([]);
  };

  const validateRequiredFields = () => {
    const fieldsToCheck = ["country", "state", "city"];
    const values = form.getFieldsValue();
    const missingFields = fieldsToCheck.filter((field) => !values[field]);

    if (missingFields.length > 0) {
      message.warning(
        `Please complete required fields: ${missingFields.join(", ")}`
      );
      return false;
    }

    return true;
  };
  const handleStateChange = (stateId) => {
    setSelectedState(stateId);
    form.setFieldsValue({ city: undefined }); // Use form instance
    const citiesInState = cities.filter((city) => city.state_id === stateId);
    setFilteredCities(citiesInState);
  };

  return (
    <>
      <Form.Item
        name="name"
        label="Listing Name"
        rules={[
          {
            required: true,
            message: "Please enter the listing name",
          },
        ]}
      >
        <Input prefix={<FiHome />} placeholder="Name" />
      </Form.Item>

      <Form.Item
        name="category"
        label="Category"
        rules={[{ required: true, message: "Please select a category" }]}
      >
        <Select placeholder="Select a category">
          {categories.map((category) => (
            <Option key={category._id} value={category._id}>
              {category.name}
            </Option>
          ))}
        </Select>
      </Form.Item>

      <Form.Item name="country" label="Country" rules={[{ required: true }]}>
        <Select
          showSearch
          placeholder="Select a country"
          onChange={handleCountryChange}
          optionFilterProp="children"
        >
          {countries.map((country) => (
            <Option key={country.id} value={country.id}>
              {country.name}
            </Option>
          ))}
        </Select>
      </Form.Item>

      <Form.Item name="state" label="State" rules={[{ required: true }]}>
        <Select
          showSearch
          placeholder="Select a state"
          onChange={handleStateChange}
          value={selectedState}
          optionFilterProp="children"
          disabled={!filteredStates.length}
        >
          {filteredStates.map((state) => (
            <Option key={state.id} value={state.id}>
              {state.name}
            </Option>
          ))}
        </Select>
      </Form.Item>

      <Form.Item name="city" label="City" rules={[{ required: true }]}>
        <Select
          showSearch
          placeholder="Select a city"
          disabled={!filteredCities.length}
          optionFilterProp="children"
        >
          {filteredCities.map((city) => (
            <Option key={city.id} value={city.name}>
              {city.name}
            </Option>
          ))}
        </Select>
      </Form.Item>

      <Form.Item
        name="area"
        label="Area"
        tooltip="Specify the area, neighborhood, or locality within the city"
      >
        <Input
          placeholder="Enter area or neighborhood (optional)"
          prefix={<FiMapPin />}
        />
      </Form.Item>

      <Form.Item
        name="price"
        label="Price"
        rules={[{ required: true, message: "Please enter the price" }]}
      >
        <InputNumber
          prefix={<FiDollarSign />}
          placeholder="Price"
          min={0}
          className="w-full"
        />
      </Form.Item>

      <Form.Item
        name="rating"
        label="Rating"
        rules={[{ required: true, message: "Please enter the rating" }]}
      >
        <Rate allowHalf />
      </Form.Item>

      <Form.Item
        name="description"
        label="Description"
        rules={[{ required: true, message: "Please enter a description" }]}
      >
        <TextArea rows={4} placeholder="Describe the listing..." />
      </Form.Item>

      <Form.Item
        name="isFeatured"
        label="Featured Listing"
        valuePropName="checked"
      >
        <Switch />
      </Form.Item>

      <Form.Item name="tags" label="Tags">
        <Select
          mode="tags"
          style={{ width: "100%" }}
          placeholder="Add tags"
          tokenSeparators={[","]}
        />
      </Form.Item>
    </>
  );
};

export default BasicInfoTab;
