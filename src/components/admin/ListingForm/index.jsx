import React, { useState, useEffect } from "react";
import { Form, Button, Tabs, Divider, message } from "antd";
import { createListingAPI, updateListingAPI } from "../../../utils/api";
import BasicInfoTab from "./BasicInfoTab";
import ImagesTab from "./ImagesTab";
import AmenitiesTab from "./AmenitiesTab";
import ContactTab from "./ContactTab";
import HoursTab from "./HoursTab";
import AttributesTab from "./AttributesTab";
import { prepareHoursForSubmission } from "../../../utils/hourUtils";
import dayjs from "dayjs";

const { TabPane } = Tabs;

const ListingForm = ({
  editingListingId,
  onClose,
  onSuccess,
  categories,
  listingData = null,
  countries = [],
}) => {
  const [form] = Form.useForm();
  const [formLoading, setFormLoading] = useState(false);
  const [formImages, setFormImages] = useState([""]);
  const [activeImagePreview, setActiveImagePreview] = useState(0);
  const [amenities, setAmenities] = useState([]);
  const [attributeString, setAttributeString] = useState("");
  const [selectedCountry, setSelectedCountry] = useState(null);
  const [selectedState, setSelectedState] = useState(null);
  const [filteredStates, setFilteredStates] = useState([]);
  const [filteredCities, setFilteredCities] = useState([]);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [previewUrls, setPreviewUrls] = useState([]);
  const [activeTab, setActiveTab] = useState("basic"); // Add this line to track active tab

  // For business hours templates
  const [savedHoursTemplates, setSavedHoursTemplates] = useState(() => {
    try {
      const saved = localStorage.getItem("savedBusinessHours");
      return saved
        ? JSON.parse(saved)
        : {
            standard: null,
            extended: null,
            allDay: null,
            lastUsed: null,
          };
    } catch (e) {
      console.error("Error loading saved hours:", e);
      return {
        standard: null,
        extended: null,
        allDay: null,
        lastUsed: null,
      };
    }
  });

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

  // Initialize form with listing data (when editing)
  useEffect(() => {
    if (listingData) {
      populateFormWithListingData(listingData);
    }
  }, [listingData, form]);

  const parseAmenities = (amenities) => {
    if (!amenities || !Array.isArray(amenities)) return [];
    return amenities
      .map((amenity) => {
        if (typeof amenity !== "string") {
          return String(amenity).trim();
        }
        return amenity.trim();
      })
      .filter(Boolean);
  };

  const parseAttributes = (attributes) => {
    if (!attributes) return "";
    if (typeof attributes === "string") return attributes;
    if (typeof attributes === "object") {
      try {
        return JSON.stringify(attributes);
      } catch (e) {
        console.error("Error parsing attributes:", e);
        return "";
      }
    }
    return String(attributes);
  };

  const populateFormWithListingData = (listing) => {
    // Basic form field values
    form.setFieldsValue({
      name: listing.name,
      category: listing.category._id,
      price: listing.price || 0,
      rating: listing.rating || 4.5,
      description: listing.description || "",
      isFeatured: listing.isFeatured || false,
      contactPhone: listing.contactPhone || "",
      contactEmail: listing.contactEmail || "",
      website: listing.website || "",
      tags: listing.tags || [],
    });

    // Owner information
    if (listing.owner) {
      try {
        const ownerData =
          typeof listing.owner === "string"
            ? JSON.parse(listing.owner)
            : listing.owner;

        form.setFieldsValue({
          owner: {
            name: ownerData.name || "",
            phone: ownerData.phone || "",
            email: ownerData.email || "",
            isFeatured: ownerData.isFeatured || false,
          },
        });
      } catch (error) {
        console.error("Failed to parse owner data:", error);
      }
    }

    // Parse location fields
    if (listing.location) {
      try {
        const locationParts = listing.location
          .split(",")
          .map((part) => part.trim());

        // Set location details - this is simplified, you'd need to enhance this
        // with proper country/state/city selection logic
        // ...

        // Set images
        const listingImages =
          listing.images && listing.images.length > 0 ? listing.images : [""];

        setFormImages(listingImages);
        setActiveImagePreview(0);

        // Parse amenities
        if (listing.amenities && Array.isArray(listing.amenities)) {
          setAmenities(parseAmenities(listing.amenities));
        }

        // Parse attributes
        if (listing.attributes) {
          setAttributeString(parseAttributes(listing.attributes));
        }

        // Set business hours
        if (listing.hours) {
          const hours = {};
          Object.keys(listing.hours).forEach((day) => {
            const dayHours = listing.hours[day];
            if (dayHours?.open && dayHours?.close) {
              hours[day] = {
                open: dayjs(dayHours.open, "HH:mm"),
                close: dayjs(dayHours.close, "HH:mm"),
              };
            }
          });
          form.setFieldsValue({ hours });
        }
      } catch (error) {
        console.error("Error parsing listing data:", error);
      }
    }
  };

  const saveHoursTemplate = (templateName, hours) => {
    if (!hours) {
      message.warning("There are no hours to save as template.");
      return;
    }

    const newSavedTemplates = {
      ...savedHoursTemplates,
      [templateName]: hours,
      lastUsed: hours,
    };

    setSavedHoursTemplates(newSavedTemplates);

    try {
      localStorage.setItem(
        "savedBusinessHours",
        JSON.stringify(newSavedTemplates)
      );
      message.success("Business hours template has been saved.");
    } catch (error) {
      console.error("Error saving hours template:", error);
      message.error("There was an error saving your business hours template.");
    }
  };

  const loadHoursTemplate = (templateName) => {
    if (savedHoursTemplates && savedHoursTemplates[templateName]) {
      return savedHoursTemplates[templateName];
    }
    return null;
  };

  const handleFormSubmit = async (values) => {
    setFormLoading(true);
    try {
      const fd = new FormData();

      // Add location field by combining city, area, state, country
      if (values.city) {
        const selectedStateObj = filteredStates.find(
          (state) => state.id === selectedState
        );
        const selectedCountryObj = countries.find(
          (country) => country.id === selectedCountry
        );

        const location = [
          values.city,
          values.area,
          selectedStateObj?.name,
          selectedCountryObj?.name,
        ]
          .filter(Boolean)
          .join(", ");

        fd.append("location", location);
      }

      // Set image replacement strategy
      fd.append("replaceImages", editingListingId ? "false" : "true");

      // Add basic fields
      const fieldsToAdd = [
        "name",
        "category",
        "price",
        "rating",
        "description",
        "isFeatured",
        "contactPhone",
        "contactEmail",
        "website",
      ];

      fieldsToAdd.forEach((field) => {
        if (values[field] !== undefined && values[field] !== null) {
          fd.append(field, values[field]);
        }
      });

      // Handle locationLink specially
      fd.append("locationLink", values.locationLink || "");

      // Add tags
      if (values.tags && values.tags.length > 0) {
        const sanitizedTags = values.tags
          .map((tag) => (typeof tag === "string" ? tag.trim() : ""))
          .filter(Boolean);
        fd.append("tags", JSON.stringify(sanitizedTags));
      }

      // Add amenities
      if (amenities.length > 0) {
        const cleanAmenities = amenities
          .map((amenity) => {
            if (typeof amenity !== "string") {
              return String(amenity).trim();
            }
            return amenity.replace(/[[\]\\/"']/g, "").trim();
          })
          .filter(Boolean);

        cleanAmenities.forEach((amenity) => {
          fd.append("amenities[]", amenity);
        });
      }

      // Add attributeString
      if (attributeString.trim()) {
        fd.append("attributes", attributeString.trim());
      }

      // Add owner information
      if (values.owner) {
        fd.append("owner[name]", values.owner.name || "Owner");
        fd.append("owner[phone]", values.owner.phone || "");
        fd.append("owner[email]", values.owner.email || "");
        fd.append("owner[isFeatured]", values.owner.isFeatured || false);
      }

      // Add hours
      const formattedHours = prepareHoursForSubmission(values);
      if (formattedHours) {
        fd.append("hours", JSON.stringify(formattedHours));
      }

      // Handle images
      const filteredImages = formImages.filter((img) => img && img.trim());

      const dataUrls = filteredImages.filter((i) => i.startsWith("data:"));
      const urls = filteredImages.filter((i) => !i.startsWith("data:"));

      if (urls.length) {
        fd.append("imageUrls", JSON.stringify(urls));
      }

      // Convert data URLs to blobs
      for (let i = 0; i < dataUrls.length; i++) {
        try {
          const blob = await fetch(dataUrls[i]).then((r) => r.blob());
          fd.append("images", blob, `img${i}.jpg`);
        } catch (err) {
          console.error(`Error processing image ${i}:`, err);
        }
      }

      // Send request
      if (editingListingId) {
        await updateListingAPI(editingListingId, fd);
        message.success(`${values.name} has been updated.`);
      } else {
        await createListingAPI(fd);
        message.success(`${values.name} has been created.`);
      }

      onSuccess();
      onClose();
    } catch (err) {
      console.error("Error saving listing:", err);
      message.error(
        err.response?.data?.message || err.message || "Failed to save listing"
      );
    } finally {
      setFormLoading(false);
    }
  };

  // Add this function to handle tab changes
  const handleTabChange = (key) => {
    console.log(`Trying to switch to tab: ${key} from ${activeTab}`);

    // Only validate when switching from basic to another tab
    if (activeTab === "basic" && key !== "basic") {
      // Customize fields to check based on whether we're editing or creating
      const basicFields = ["name", "category"];
      const locationFields = editingListingId
        ? []
        : ["country", "state", "city"];
      const fieldsToCheck = [...basicFields, ...locationFields];

      // Get form values
      const values = form.getFieldsValue();
      console.log("Current form values:", values);

      // Find missing required fields
      const missingFields = fieldsToCheck.filter(
        (field) => !values[field] || values[field] === ""
      );

      if (missingFields.length > 0) {
        // Use message.warning as requested
        message.warning(
          `Please complete these required fields: ${missingFields.join(", ")}`
        );

        // Highlight the fields with errors
        form.validateFields(missingFields).catch((info) => {
          console.log("Validation failed:", info);
        });

        return; // Don't change tab
      }
    }

    // Allow tab change if validation passes
    setActiveTab(key);
  };

  return (
    <Form
      form={form}
      layout="vertical"
      onFinish={handleFormSubmit}
      initialValues={{
        rating: 4.5,
        isFeatured: false,
      }}
    >
      <Tabs activeKey={activeTab} onChange={handleTabChange}>
        <TabPane tab="Basic Info" key="basic">
          <BasicInfoTab
            categories={categories}
            selectedCountry={selectedCountry}
            setSelectedCountry={setSelectedCountry}
            selectedState={selectedState}
            setSelectedState={setSelectedState}
            filteredStates={filteredStates}
            setFilteredStates={setFilteredStates}
            filteredCities={filteredCities}
            setFilteredCities={setFilteredCities}
            form={form} // Pass the form instance here
          />
        </TabPane>

        <TabPane tab="Images" key="images">
          <ImagesTab
            images={formImages}
            setImages={setFormImages}
            activeImagePreview={activeImagePreview}
            setActiveImagePreview={setActiveImagePreview}
            previewUrl={previewUrl}
            setPreviewUrl={setPreviewUrl}
            previewUrls={previewUrls}
            setPreviewUrls={setPreviewUrls}
            editingListingId={editingListingId}
          />
        </TabPane>

        <TabPane tab="Amenities" key="amenities">
          <AmenitiesTab amenities={amenities} setAmenities={setAmenities} />
        </TabPane>

        <TabPane tab="Contact & Owner" key="contact">
          <ContactTab />
        </TabPane>

        <TabPane tab="Hours" key="hours">
          <HoursTab
            savedHoursTemplates={savedHoursTemplates}
            saveHoursTemplate={saveHoursTemplate}
            loadHoursTemplate={loadHoursTemplate}
            form={form}
          />
        </TabPane>

        <TabPane tab="Attributes" key="attributes">
          <AttributesTab
            attributeString={attributeString}
            setAttributeString={setAttributeString}
          />
        </TabPane>
      </Tabs>

      <Divider />

      <Form.Item>
        <div className="flex justify-end gap-2">
          <Button onClick={onClose}>Cancel</Button>
          <Button
            type="primary"
            htmlType="submit"
            loading={formLoading}
            className="bg-blue-600 hover:bg-blue-700"
          >
            {editingListingId ? "Update" : "Create"} Listing
          </Button>
        </div>
      </Form.Item>
    </Form>
  );
};

export default ListingForm;
