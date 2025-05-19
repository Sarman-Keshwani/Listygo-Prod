import React from "react";
import { Form, Input, Button, Tag, Tooltip } from "antd";
import { FiPlus } from "react-icons/fi";

const AmenitiesTab = ({ amenities, setAmenities }) => {
  const [inputValue, setInputValue] = React.useState("");

  const handleInputChange = (e) => {
    setInputValue(e.target.value);
  };

  const handleAddAmenity = () => {
    if (inputValue.trim()) {
      // Clean up the input value, removing brackets and quotes
      const cleanValue = inputValue.replace(/[[\]\\/"']/g, "").trim();
      setAmenities([...amenities, cleanValue]);
      setInputValue("");
    }
  };

  const handleRemove = (amenity) => {
    const newAmenities = amenities.filter((item) => item !== amenity);
    setAmenities(newAmenities);
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleAddAmenity();
    }
  };

  return (
    <>
      <Form.Item
        label="Amenities"
        tooltip="Add features and facilities available in this listing"
      >
        <div className="flex mb-2">
          <Input
            placeholder="Add an amenity (e.g., WiFi, Parking)"
            value={inputValue}
            onChange={handleInputChange}
            onKeyPress={handleKeyPress}
            className="mr-2"
          />
          <Button
            type="primary"
            icon={<FiPlus />}
            onClick={handleAddAmenity}
            className="bg-blue-600 hover:bg-blue-700"
          >
            Add
          </Button>
        </div>

        <div className="mt-3">
          {amenities.length === 0 ? (
            <div className="text-gray-500">No amenities added yet</div>
          ) : (
            <div className="flex flex-wrap gap-2">
              {amenities.map((amenity, index) => (
                <Tag
                  key={index}
                  className="py-1 px-2"
                  closable
                  onClose={() => handleRemove(amenity)}
                >
                  {amenity}
                </Tag>
              ))}
            </div>
          )}
        </div>
      </Form.Item>

      <div className="mb-6">
        <h4 className="text-sm font-medium text-gray-700 mb-1">
          Suggested Amenities
        </h4>
        <div className="flex flex-wrap gap-2">
          {[
            "WiFi",
            "Parking",
            "Air Conditioning",
            "Swimming Pool",
            "Restaurant",
            "Room Service",
            "Conference Room",
            "Gym",
            "Pet Friendly",
          ].map((suggestion, i) => (
            <Tooltip title={`Add ${suggestion}`} key={i}>
              <Tag
                className="cursor-pointer py-1"
                onClick={() => {
                  if (!amenities.includes(suggestion)) {
                    setAmenities([...amenities, suggestion]);
                  }
                }}
              >
                {suggestion}
              </Tag>
            </Tooltip>
          ))}
        </div>
      </div>
    </>
  );
};

export default AmenitiesTab;
