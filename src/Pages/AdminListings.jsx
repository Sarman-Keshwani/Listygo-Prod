import React, { useState, useEffect } from "react";
import axios from "axios";
import countries from "../components/countries.json";
import states from "../components/states.json";
import cities from "../components/cities.json";
import { useNavigate, useLocation } from "react-router-dom";
import {
  FiHome,
  FiDollarSign,
  FiStar,
  FiMapPin,
  FiImage,
  FiFileText,
  FiX,
  FiSave,
  FiPlus,
  FiTrash2,
  FiEdit,
  FiList,
  FiFilter,
  FiChevronDown,
  FiGrid,
  FiTag,
  FiClock,
  FiUser,
  FiPhone,
  FiMail,
  FiGlobe,
  FiCheck,
  FiPackage,
  FiUsers,
  FiWifi,
  FiSquare,
  FiWind,
  FiMonitor,
  FiDroplet,
  FiActivity,
  FiShoppingBag,
  FiHeart,
} from "react-icons/fi";
import { motion, AnimatePresence } from "framer-motion";
import {
  Form,
  Input,
  Button,
  Select,
  InputNumber,
  Upload,
  Rate,
  Switch,
  Divider,
  Tabs,
  Card,
  Empty,
  Spin,
  Tag,
  notification,
  Tooltip,
  Drawer,
  TimePicker,
  Typography,
  message,
} from "antd";
import dayjs from "dayjs";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000/api";
const { Option } = Select;
const { TextArea } = Input;
const { TabPane } = Tabs;

const AdminListings = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);
  const categoryFilter = queryParams.get("category");

  const [form] = Form.useForm();

  // Destructure Text from Typography
  const { Text } = Typography;
  const [listings, setListings] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [formLoading, setFormLoading] = useState(false);
  const [editingListingId, setEditingListingId] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState(
    categoryFilter || null
  );
  const [images, setImages] = useState([""]);
  const [activeImagePreview, setActiveImagePreview] = useState(0);
  const [showForm, setShowForm] = useState(false);
  const [viewMode, setViewMode] = useState("grid"); // 'grid' or 'list'
  const [amenities, setAmenities] = useState([]);
  const [newAmenity, setNewAmenity] = useState("");
  const [attributeKeys, setAttributeKeys] = useState([]);
  const [newAttributeKey, setNewAttributeKey] = useState("");
  const [newAttributeValue, setNewAttributeValue] = useState("");
  const [attributeValues, setAttributeValues] = useState({});
  const [selectedCountry, setSelectedCountry] = useState(null);
  const [selectedState, setSelectedState] = useState(null);
  const [filteredStates, setFilteredStates] = useState([]);
  const [filteredCities, setFilteredCities] = useState([]);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [previewUrls, setPreviewUrls] = useState([]); // Added for multiple image uploads
  const [attributeString, setAttributeString] = useState(""); // New state for comma-separated list

  const ALLOWED_FILE_TYPES = ["image/jpeg", "image/jpg", "image/png"];
  const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

  // Fetch categories and listings
  useEffect(() => {
    const token = localStorage.getItem("token");
    const isAuthenticated = localStorage.getItem("isAuthenticated");
    const userRole = localStorage.getItem("userRole");

    if (
      !token ||
      !isAuthenticated ||
      (userRole !== "admin" && userRole !== "super-admin")
    ) {
      navigate("/admin/login");
    } else {
      fetchCategories();
      fetchListings();
    }
  }, [navigate, selectedCategory]);

  const fetchCategories = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await axios.get(`${API_URL}/categories`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setCategories(response.data.data);

      // If category filter is set but not in state, set it now
      if (categoryFilter && !selectedCategory) {
        setSelectedCategory(categoryFilter);
      }
    } catch (error) {
      console.error("Error fetching categories:", error);
      notification.error({
        message: "Error",
        description: "Failed to load categories. Please try again.",
      });
    }
  };

  // Replace the handleDeleteImage function with this updated version:

  const handleDeleteImage = async (imageUrl, index) => {
    try {
      console.log("Deleting image:", imageUrl, "at index:", index);

      // If we're editing an existing listing and it's a stored image (not a data URL)
      if (editingListingId && imageUrl && !imageUrl.startsWith("data:")) {
        const token = localStorage.getItem("token");

        // Show confirmation dialog
        if (!window.confirm("Are you sure you want to delete this image?")) {
          return;
        }

        try {
          // Call the API to delete the image
          await axios({
            method: "delete",
            url: `${API_URL}/listings/${editingListingId}/images`,
            data: { imageUrl },
            headers: {
              Authorization: `Bearer ${token}`,
            },
          });

          message.success("Image deleted successfully from server!");
        } catch (apiError) {
          console.error("API error when deleting image:", apiError);
          message.error(apiError.response?.data?.message);

          // Continue with local deletion even if server deletion fails
        }
      }

      // Remove the image from the local state
      // This is critical to prevent re-uploading deleted images
      let newImages = [...images];

      // Properly remove the image at the specified index
      newImages.splice(index, 1);

      // If no images left, add an empty placeholder to maintain the UI
      if (newImages.length === 0) {
        newImages = [""];
      }

      // Remove any empty strings except one placeholder if needed
      newImages = newImages.filter(
        (img, i) =>
          img.trim() !== "" ||
          (img.trim() === "" && i === 0 && newImages.length === 1)
      );

      console.log("Images array after deletion:", newImages);
      setImages(newImages);

      // Clear preview URL if it's showing the deleted image
      if (previewUrl === imageUrl) {
        setPreviewUrl(null);
      }

      // Update the active preview if needed
      if (activeImagePreview >= newImages.length) {
        setActiveImagePreview(Math.max(0, newImages.length - 1));
      }
    } catch (err) {
      console.error("Error in handleDeleteImage:", err);
      notification.error({
        message: "Error",
        description: "Failed to delete image. Please try again.",
      });
    }
  };
  // 1) Image upload & preview helper
  const handleFileUpload = (file) => {
    if (!ALLOWED_FILE_TYPES.includes(file.type) || file.size > MAX_FILE_SIZE) {
      notification.error({
        message: "Invalid file",
        description: "Only JPG/PNG under 10MB allowed",
      });
      return false;
    }
    const reader = new FileReader();
    reader.onload = (e) => {
      setPreviewUrl(e.target.result);
      setImages((prev) => [...prev.filter(Boolean), e.target.result]);
      setActiveImagePreview(images.length);
    };
    reader.readAsDataURL(file);
    return false; // prevent Upload auto
  };

  // Add new function for multiple file uploads
  const handleMultipleFileUpload = ({ fileList }) => {
    const newUrls = [];
    const promises = [];

    fileList.forEach((file) => {
      if (!file.originFileObj) return;

      if (
        !ALLOWED_FILE_TYPES.includes(file.originFileObj.type) ||
        file.originFileObj.size > MAX_FILE_SIZE
      ) {
        notification.error({
          message: "Invalid file",
          description: `${file.name}: Only JPG/PNG under 10MB allowed`,
        });
        return;
      }

      const promise = new Promise((resolve) => {
        const reader = new FileReader();
        reader.onload = (e) => {
          newUrls.push(e.target.result);
          resolve();
        };
        reader.readAsDataURL(file.originFileObj);
      });

      promises.push(promise);
    });

    Promise.all(promises).then(() => {
      setPreviewUrls(newUrls);
      setImages((prev) => [...prev.filter(Boolean), ...newUrls]);
      if (newUrls.length > 0) {
        setActiveImagePreview(images.filter(Boolean).length);
      }
      notification.success({
        message: "Success",
        description: `${newUrls.length} images uploaded successfully`,
      });
    });
  };

  // Handle country and state selection
  const handleCountryChange = (countryId) => {
    setSelectedCountry(countryId);
    setSelectedState(null);
    form.setFieldsValue({ state: undefined, city: undefined });

    const statesInCountry = states.filter(
      (state) => state.country_id === countryId
    );
    setFilteredStates(statesInCountry);
    setFilteredCities([]);
  };

  const handleStateChange = (stateId) => {
    setSelectedState(stateId);
    form.setFieldsValue({ city: undefined });
    const citiesInState = cities.filter((city) => city.state_id === stateId);
    setFilteredCities(citiesInState);
  };

  const fetchListings = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      let url = `${API_URL}/listings`;

      if (selectedCategory) {
        url = `${API_URL}/listings/category/${selectedCategory}`;
      }

      const response = await axios.get(url, {
        headers: { Authorization: `Bearer ${token}` },
      });

      setListings(response.data.data);
    } catch (error) {
      console.error("Error fetching listings:", error);
      notification.error({
        message: "Error",
        description: "Failed to load listings. Please try again.",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCategoryChange = (categoryId) => {
    setSelectedCategory(categoryId);
    // Update URL with category parameter without reloading the page
    const newUrl = categoryId
      ? `${location.pathname}?category=${categoryId}`
      : location.pathname;
    window.history.pushState({}, "", newUrl);
  };

  const handleAddImage = () => {
    setImages([...images, ""]);
  };

  const handleRemoveImage = (index) => {
    if (images.length <= 1) {
      notification.warning({
        message: "Warning",
        description: "At least one image URL is required.",
      });
      return;
    }
    const newImages = images.filter((_, i) => i !== index);
    setImages(newImages);
    if (activeImagePreview >= newImages.length) {
      setActiveImagePreview(Math.max(0, newImages.length - 1));
    }
  };

  const handleImageChange = (index, value) => {
    const newImages = [...images];
    newImages[index] = value;
    setImages(newImages);
  };

  // Fix the handleFormSubmit function to properly format data
  const handleFormSubmit = async (values) => {
    setFormLoading(true);
    try {
      const token = localStorage.getItem("token");
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

      // Add basic fields - simple values
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

      // Add tags
      if (values.tags && values.tags.length > 0) {
        const sanitizedTags = values.tags
          .map((tag) => (typeof tag === "string" ? tag.trim() : ""))
          .filter(Boolean);
        fd.append("tags", JSON.stringify(sanitizedTags));
      }

      // Add amenities as direct array (not JSON string)
      if (amenities.length > 0) {
        // Clean amenities to ensure proper format
        const cleanAmenities = amenities
          .map((amenity) => {
            // If it's not a string, convert to string
            if (typeof amenity !== "string") {
              return String(amenity).trim();
            }
            // Remove any quotes, brackets, etc.
            return amenity?.replace(/[\\]"'\\]/g, "").trim();
          })
          .filter(Boolean);

        console.log("Clean amenities being sent:", cleanAmenities);

        // IMPORTANT: Don't stringify - pass as direct form field array
        // FormData can handle arrays with the same key multiple times
        cleanAmenities.forEach((amenity) => {
          fd.append("amenities[]", amenity);
        });
      }

      // IMPORTANT: Add attributeString (using the comma-separated approach)
      if (attributeString.trim()) {
        fd.append("attributes", attributeString.trim());
      }

      // Add owner information
      if (values.owner) {
        // Directly pass the owner object instead of stringifying it
        fd.append("owner[name]", values.owner.name || "Owner");
        fd.append("owner[phone]", values.owner.phone || "");
        fd.append("owner[email]", values.owner.email || "");
        fd.append("owner[isFeatured]", values.owner.isFeatured || false);
      }

      // Add hours
      if (values.hours) {
        const formattedHours = {};
        Object.entries(values.hours).forEach(([day, times]) => {
          if (times?.open && times?.close) {
            formattedHours[day] = {
              open: times.open.format("HH:mm"),
              close: times.close.format("HH:mm"),
            };
          }
        });
        if (Object.keys(formattedHours).length > 0) {
          fd.append("hours", JSON.stringify(formattedHours));
        }
      }

      // Handle images - ensure we only process valid images
      const filteredImages = images.filter((img) => img && img.trim());
      console.log("Filtered images for submission:", filteredImages);

      const dataUrls = filteredImages.filter((i) => i.startsWith("data:"));
      const urls = filteredImages.filter((i) => !i.startsWith("data:"));

      if (urls.length) {
        fd.append("imageUrls", JSON.stringify(urls));
      }

      // Convert data URLs to blobs for upload
      for (let i = 0; i < dataUrls.length; i++) {
        try {
          const blob = await fetch(dataUrls[i]).then((r) => r.blob());
          fd.append("images", blob, `img${i}.jpg`);
        } catch (err) {
          console.error(`Error processing image ${i}:`, err);
        }
      }

      // Debug - log FormData entries
      console.log("Form data entries:");
      for (let [key, value] of fd.entries()) {
        console.log(`${key}: ${value.toString().substring(0, 100)}`);
      }

      // Send the request
      const method = editingListingId ? "put" : "post";
      const url = editingListingId
        ? `${API_URL}/listings/${editingListingId}`
        : `${API_URL}/listings`;

      const response = await axios({
        method,
        url,
        data: fd,
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "multipart/form-data",
        },
      });

      notification.success({
        message: `Listing ${
          editingListingId ? "updated" : "created"
        } successfully!`,
        description: `${values.name} has been ${
          editingListingId ? "updated" : "created"
        }.`,
      });

      resetForm();
      fetchListings();
      setShowForm(false);
    } catch (err) {
      console.error("Error creating/updating listing:", err);
      notification.error({
        message: "Error",
        description:
          err.response?.data?.message ||
          err.message ||
          "Failed to save listing",
      });
    } finally {
      setFormLoading(false);
    }
  };

  // Update the handleEdit function
  const handleEdit = (listing) => {
    setEditingListingId(listing._id);

    // Reset form first to clear any previous values
    form.resetFields();

    // Set form values for basic fields
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

    // Set owner information if available
    if (listing.owner) {
      try {
        // Parse owner if it's a JSON string
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

    // Parse location for country, state, city, area
    if (listing.location) {
      const locationParts = listing.location
        .split(",")
        .map((part) => part.trim());
      const city = locationParts[0] || "";
      const area = locationParts.length > 3 ? locationParts[1] : "";

      // Find the country by name
      const country = countries.find(
        (c) => c.name === locationParts[locationParts.length - 1]
      );

      if (country) {
        setSelectedCountry(country.id);
        form.setFieldsValue({ country: country.id });

        // Get states in this country
        const statesInCountry = states.filter(
          (s) => s.country_id === country.id
        );
        setFilteredStates(statesInCountry);

        // Find state by name
        const state = statesInCountry.find(
          (s) => s.name === locationParts[locationParts.length - 2]
        );

        if (state) {
          setSelectedState(state.id);
          form.setFieldsValue({ state: state.id });

          // Get cities in this state
          const citiesInState = cities.filter((c) => c.state_id === state.id);
          setFilteredCities(citiesInState);

          // Set city and area
          form.setFieldsValue({
            city: city,
            area: area,
          });
        }
      }
    }

    // Set images
    const listingImages =
      listing.images && listing.images.length > 0 ? listing.images : [""];

    setImages(listingImages);
    setActiveImagePreview(0);

    // FIXED: Parse amenities properly
    if (listing.amenities && Array.isArray(listing.amenities)) {
      const cleanAmenities = parseAmenities(listing.amenities);
      console.log("Parsed amenities:", cleanAmenities);
      setAmenities(cleanAmenities);
    } else {
      setAmenities([]);
    }

    // FIXED: Parse attributes properly
    if (listing.attributes) {
      let attrString = "";

      // Handle different attribute formats: object, string or stringified object
      if (typeof listing.attributes === "object") {
        // If it's already an object with keys
        attrString = Object.keys(listing.attributes).join(", ");
      } else if (typeof listing.attributes === "string") {
        // If it's already a comma-separated string, use it directly
        if (listing.attributes.includes(",")) {
          attrString = listing.attributes;
        } else {
          // Try to parse it as JSON if it starts with {
          try {
            if (listing.attributes.trim().startsWith("{")) {
              const parsed = JSON.parse(listing.attributes);
              attrString = Object.keys(parsed).join(", ");
            } else {
              // Single attribute
              attrString = listing.attributes;
            }
          } catch {
            attrString = listing.attributes;
          }
        }
      }

      console.log("Parsed attribute string:", attrString);
      setAttributeString(attrString);
    }

    // Set business hours if available
    if (listing.hours) {
      console.log("Loading hours data:", listing.hours);
      const hours = {};

      // Process each day's hours from the listing data
      Object.keys(listing.hours).forEach((day) => {
        const dayHours = listing.hours[day];
        if (dayHours?.open && dayHours?.close) {
          hours[day] = {
            open: dayjs(dayHours.open, "HH:mm"),
            close: dayjs(dayHours.close, "HH:mm"),
          };
        }
      });

      // Set the hours in the form
      form.setFieldsValue({ hours });
    }

    setShowForm(true);

    // Scroll to form
    window.scrollTo({ top: 0, behavior: "smooth" });
  };
  const handleDelete = async (listingId) => {
    if (!window.confirm("Are you sure you want to delete this listing?"))
      return;

    try {
      const token = localStorage.getItem("token");
      await axios.delete(`${API_URL}/listings/${listingId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      notification.success({
        message: "Success",
        description: "Listing deleted successfully!",
      });

      // Refresh listings
      fetchListings();
    } catch (error) {
      console.error("Error deleting listing:", error);
      notification.error({
        message: "Error",
        description:
          error.response?.data?.message ||
          "Failed to delete listing. Please try again.",
      });
    }
  };

  // Add this function to your component to parse attributes from backend
  // Replace your current parseAttributes function with this one
  // Replace the parseAttributes function with this improved version
  const parseAttributes = (attributesString) => {
    if (!attributesString) return {};

    try {
      // Try parsing the string to an object
      let parsed = attributesString;

      // Handle potentially multiple levels of JSON stringification
      while (typeof parsed === "string") {
        try {
          const nextLevel = JSON.parse(parsed);
          if (
            typeof nextLevel === "string" &&
            (nextLevel.startsWith("{") || nextLevel.startsWith("["))
          ) {
            parsed = nextLevel;
          } else {
            parsed = nextLevel;
            break;
          }
        } catch {
          // If we can't parse further, use what we have
          break;
        }
      }

      // Check if we ended up with an object with numeric keys (0-10 characters)
      if (typeof parsed === "object" && !Array.isArray(parsed)) {
        // Check if this looks like a character-by-character object (keys are consecutive numbers)
        const keys = Object.keys(parsed);
        const isCharacterByCharacter =
          keys.length > 0 && keys.every((k, i) => k === String(i));

        if (isCharacterByCharacter) {
          // Reconstruct the original string and try one more parse
          const reconstructed = keys.map((k) => parsed[k]).join("");
          try {
            return JSON.parse(reconstructed);
          } catch {
            // If that fails too, return the best we have
            return { value: reconstructed };
          }
        }
      }

      return typeof parsed === "object" ? parsed : { value: String(parsed) };
    } catch (error) {
      console.error("Error parsing attributes:", error);
      return {};
    }
  };

  // Add this function to parse amenities from backend
  const parseAmenities = (amenitiesArray) => {
    if (!amenitiesArray || !Array.isArray(amenitiesArray)) return [];

    return amenitiesArray
      .map((amenity) => {
        if (!amenity) return "";

        // Handle string wrapped in quotes and brackets like ["Car"]
        if (typeof amenity === "string") {
          try {
            // If it looks like JSON, try to parse it
            if (
              amenity.trim().startsWith("[") &&
              amenity.trim().endsWith("]")
            ) {
              const parsed = JSON.parse(amenity);
              if (Array.isArray(parsed) && parsed.length > 0) {
                return parsed[0];
              }
            }
            // Otherwise just return the string itself, cleaned up
            return amenity?.replace(/[\\]"']/g, "").trim();
          } catch {
            return amenity?.replace(/[\\]"']/g, "").trim();
          }
        }
        return String(amenity);
      })
      .filter(Boolean);
  };
  const resetForm = () => {
    form.resetFields();
    setImages([""]);
    setActiveImagePreview(0);
    setEditingListingId(null);
    setAmenities([]);
    setAttributeKeys([]);
    setAttributeValues({});
    setNewAttributeKey("");
    setNewAttributeValue("");
    setNewAmenity("");
    setSelectedCountry(null);
    setSelectedState(null);
    setFilteredStates([]);
    setFilteredCities([]);
    setPreviewUrl(null);
  };

  // Get human-readable category name
  const getCategoryName = (categoryId) => {
    const category = categories.find((c) => c._id === categoryId);
    return category ? category.name : "Unknown";
  };

  // Render grid view item
  const renderGridItem = (listing) => (
    <Card
      key={listing._id}
      hoverable
      className="overflow-hidden h-full flex flex-col"
      cover={
        <div className="h-40 sm:h-48 overflow-hidden">
          {listing.images && listing.images.length > 0 ? (
            <img
              alt={listing.name}
              src={listing.images[0]}
              className="w-full h-full object-cover"
              onError={(e) => {
                e.target.onerror = null;
                e.target.src =
                  "https://via.placeholder.com/300x200?text=No+Image";
              }}
            />
          ) : (
            <div className="h-full bg-gray-200 flex items-center justify-center">
              <FiImage size={32} className="text-gray-500" />
            </div>
          )}
        </div>
      }
      actions={[
        <Button
          type="text"
          icon={<FiEdit />}
          onClick={() => handleEdit(listing)}
        >
          Edit
        </Button>,
        <Button
          type="text"
          danger
          icon={<FiTrash2 />}
          onClick={() => handleDelete(listing._id)}
        >
          Delete
        </Button>,
      ]}
    >
      <div className="mb-2">
        <Tag color="blue">{getCategoryName(listing.category._id)}</Tag>
      </div>
      <h3 className="font-semibold text-lg mb-1 text-blue-700 line-clamp-1">
        {listing.name}
      </h3>
      <div className="flex items-center text-gray-500 mb-1">
        <FiMapPin size={14} className="mr-1 flex-shrink-0" />
        <span className="text-sm line-clamp-1">{listing.location}</span>
      </div>
      <div className="flex justify-between items-center mt-auto">
        <div className="font-semibold text-blue-600">₹{listing.price}</div>
        <div className="flex items-center">
          <FiStar size={14} className="text-yellow-500 mr-1" />
          <span>{listing.rating}</span>
        </div>
      </div>
    </Card>
  );

  // Fix the renderListItem function to include the complete rating component
  const renderListItem = (listing) => (
    <Card key={listing._id} className="mb-4">
      <div className="flex flex-col md:flex-row">
        <div className="w-full md:w-1/4 h-40 md:h-auto mb-4 md:mb-0 md:mr-4 overflow-hidden">
          {listing.images && listing.images.length > 0 ? (
            <img
              alt={listing.name}
              src={listing.images[0]}
              className="w-full h-full object-cover rounded"
              onError={(e) => {
                e.target.onerror = null;
                e.target.src =
                  "https://via.placeholder.com/300x200?text=No+Image";
              }}
            />
          ) : (
            <div className="h-full bg-gray-200 flex items-center justify-center rounded">
              <FiImage size={32} className="text-gray-500" />
            </div>
          )}
        </div>

        <div className="flex-1">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-2 gap-2">
            <div>
              <Tag color="blue" className="mb-2">
                {getCategoryName(listing.category._id)}
              </Tag>
              <h3 className="font-semibold text-lg mb-1 text-blue-700">
                {listing.name}
              </h3>
            </div>
            <div className="flex gap-2">
              <Button
                type="primary"
                icon={<FiEdit />}
                onClick={() => handleEdit(listing)}
                className="bg-blue-600 hover:bg-blue-700"
              >
                Edit
              </Button>
              <Button
                danger
                icon={<FiTrash2 />}
                onClick={() => handleDelete(listing._id)}
              >
                Delete
              </Button>
            </div>
          </div>

          <div className="flex items-center text-gray-500 mb-2">
            <FiMapPin size={14} className="mr-1" />
            <span className="text-sm">{listing.location}</span>
          </div>

          <p className="text-gray-600 line-clamp-2 mb-3">
            {listing.description}
          </p>

          <div className="flex justify-between items-center text-sm">
            <div className="font-semibold text-blue-600 text-lg">
              ₹{listing.price}
            </div>
            <div className="flex items-center">
              <Rate
                disabled
                defaultValue={listing.rating}
                allowHalf
                className="text-sm"
              />
              <span className="ml-1 text-gray-500">({listing.rating})</span>
            </div>
          </div>
        </div>
      </div>
    </Card>
  );

  // Fix the return statement structure
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Admin Header */}
      <div className="bg-blue-800 text-white p-4 shadow-md">
        <div className="container mx-auto px-4">
          <div className="flex justify-between items-center flex-wrap gap-2">
            <h1 className="text-2xl font-bold">ListyGo Admin</h1>
            <div className="flex items-center gap-4">
              <span>{localStorage.getItem("userName") || "Admin"}</span>
              <button
                className="px-3 py-1 bg-blue-700 hover:bg-blue-900 rounded"
                onClick={() => {
                  localStorage.removeItem("token");
                  localStorage.removeItem("isAuthenticated");
                  localStorage.removeItem("userRole");
                  navigate("/admin/login");
                }}
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 gap-4">
          <div>
            <h2 className="text-2xl font-bold text-gray-800">
              Manage Listings
            </h2>
            <p className="text-gray-600">
              Add, edit and delete listings across all categories
            </p>
          </div>
          <div className="flex gap-2 flex-wrap">
            <Button
              className="px-4 py-2 bg-gray-200 text-gray-700 rounded flex items-center gap-1 hover:bg-gray-300"
              onClick={() => navigate("/admin/dashboard")}
            >
              Dashboard
            </Button>
            <Button
              type="primary"
              icon={<FiPlus />}
              className="bg-blue-600 hover:bg-blue-700"
              onClick={() => {
                resetForm();
                setShowForm(true);
              }}
            >
              Add New Listing
            </Button>
          </div>
        </div>

        {/* Category Filter */}
        <Card className="mb-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex-1">
              <h3 className="font-semibold mb-2 text-gray-700">
                Filter by Category
              </h3>
              <Select
                placeholder="Select a category"
                className="w-full"
                onChange={handleCategoryChange}
                value={selectedCategory || undefined}
                allowClear
                showSearch
                filterOption={(input, option) =>
                  option.children.toLowerCase().indexOf(input.toLowerCase()) >=
                  0
                }
              >
                {categories.map((category) => (
                  <Option key={category._id} value={category._id}>
                    {category.name}
                  </Option>
                ))}
              </Select>
            </div>
            <div className="flex flex-col gap-2">
              <div className="flex items-center gap-2 justify-end">
                <span className="text-gray-600">View Mode:</span>
                <Button
                  type={viewMode === "grid" ? "primary" : "default"}
                  icon={<FiGrid />}
                  onClick={() => setViewMode("grid")}
                  className={viewMode === "grid" ? "bg-blue-600" : ""}
                />
                <Button
                  type={viewMode === "list" ? "primary" : "default"}
                  icon={<FiList />}
                  onClick={() => setViewMode("list")}
                  className={viewMode === "list" ? "bg-blue-600" : ""}
                />
              </div>
              <div className="text-right text-gray-500 text-sm">
                {listings.length} listing{listings.length !== 1 ? "s" : ""}{" "}
                found
              </div>
            </div>
          </div>
        </Card>

        {/* Add/Edit Listing Form */}
        <Drawer
          title={editingListingId ? "Edit Listing" : "Add New Listing"}
          placement="right"
          size="large"
          visible={showForm}
          onClose={() => setShowForm(false)}
          extra={<Button onClick={() => setShowForm(false)}>Cancel</Button>}
        >
          <Form
            form={form}
            layout="vertical"
            onFinish={handleFormSubmit}
            initialValues={{
              rating: 4.5,
              isFeatured: false,
            }}
          >
            <Tabs defaultActiveKey="basic">
              <TabPane tab="Basic Info" key="basic">
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
                  rules={[
                    { required: true, message: "Please select a category" },
                  ]}
                >
                  <Select
                    placeholder="Select a category"
                    onChange={(value) => {
                      // Clear and adjust attributes when category changes
                      form.setFieldsValue({ attributes: {} });
                      setAttributeKeys([]);
                      setAttributeValues({});
                    }}
                  >
                    {categories.map((category) => (
                      <Option key={category._id} value={category._id}>
                        {category.name}
                      </Option>
                    ))}
                  </Select>
                </Form.Item>

                {/* <Form.Item
                  name="location"
                  label="Location"
                  rules={[{ required: true, message: "Please enter the location" }]}
                >
                  <Input prefix={<FiMapPin />} placeholder="City, Country" />
                </Form.Item> */}

                {/* Country selector */}
                <Form.Item
                  name="country"
                  label="Country"
                  rules={[{ required: true }]}
                >
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

                {/* State selector */}
                <Form.Item
                  name="state"
                  label="State"
                  rules={[{ required: true }]}
                >
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

                {/* City selector */}
                <Form.Item
                  name="city"
                  label="City"
                  rules={[{ required: true }]}
                >
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

                {/* Area input field */}
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
                  rules={[
                    { required: true, message: "Please enter the price" },
                  ]}
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
                  rules={[
                    { required: true, message: "Please enter the rating" },
                  ]}
                >
                  <Rate allowHalf />
                </Form.Item>

                <Form.Item
                  name="description"
                  label="Description"
                  rules={[
                    { required: true, message: "Please enter a description" },
                  ]}
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
              </TabPane>

              {/* 2) In your <Form> ↴ Add this TabPane for Images: */}
              <TabPane tab="Images" key="images">
                <Form.Item
                  label="Images"
                  required
                  rules={[
                    {
                      validator: () => {
                        if (images.filter((i) => i?.trim()).length === 0) {
                          return Promise.reject(
                            "At least one image is required"
                          );
                        }
                        return Promise.resolve();
                      },
                    },
                  ]}
                >
                  <Upload
                    accept=".jpg,.jpeg,.png"
                    showUploadList={false}
                    beforeUpload={handleFileUpload}
                  >
                    <Button icon={<FiPlus />}>Upload</Button>
                  </Upload>
                  {/* <Button
                    type="dashed"
                    onClick={() => setImages([...images, ""])}
                    className="mt-2"
                  >
                    Add URL Field
                  </Button> */}

                  {/* URL inputs */}
                  {images.map((url, i) => (
                    <div key={i} className="relative mt-2">
                      <Input
                        className="pr-12" // Add padding for the delete button
                        value={url}
                        placeholder={`Image URL #${i + 1}`}
                        onChange={(e) => {
                          const next = [...images];
                          next[i] = e.target.value;
                          setImages(next);
                        }}
                      />
                      <Tooltip title="Delete image">
                        <Button
                          type="text"
                          danger
                          icon={<FiTrash2 />}
                          className="absolute right-1 top-1"
                          onClick={() => handleDeleteImage(url, i)}
                        />
                      </Tooltip>
                    </div>
                  ))}

                  {/* Preview */}
                  <div className="mt-4 relative">
                    <div className="h-48 flex items-center justify-center bg-gray-100">
                      {previewUrl || images[activeImagePreview]?.trim() ? (
                        <div className="relative w-full h-full">
                          <img
                            src={previewUrl || images[activeImagePreview]}
                            alt="Preview"
                            className="max-h-full mx-auto object-contain"
                            onError={(e) =>
                              (e.currentTarget.src =
                                "https://via.placeholder.com/400x200?text=Invalid")
                            }
                          />
                          <Button
                            type="primary"
                            danger
                            icon={<FiTrash2 />}
                            shape="circle"
                            size="small"
                            className="absolute top-2 right-2 opacity-80 hover:opacity-100"
                            onClick={() =>
                              handleDeleteImage(
                                images[activeImagePreview],
                                activeImagePreview
                              )
                            }
                          />
                        </div>
                      ) : (
                        <span className="text-gray-500">No preview</span>
                      )}
                    </div>

                    {/* Image thumbnails if there are multiple */}
                    {images.length > 1 && (
                      <div className="flex mt-2 gap-2 overflow-x-auto py-2">
                        {images.map((img, idx) => (
                          <div
                            key={idx}
                            className={`relative cursor-pointer border-2 rounded overflow-hidden ${
                              idx === activeImagePreview
                                ? "border-blue-500"
                                : "border-gray-200"
                            }`}
                            onClick={() => setActiveImagePreview(idx)}
                          >
                            <div className="h-16 w-16">
                              <img
                                src={img}
                                alt={`Thumbnail ${idx + 1}`}
                                className="h-full w-full object-cover"
                                onError={(e) => {
                                  e.currentTarget.src =
                                    "https://via.placeholder.com/80?text=Invalid";
                                }}
                              />
                            </div>
                            {/* Fixed delete button with proper event handler */}
                            <Button
                              type="text"
                              danger
                              icon={<FiX />}
                              size="small"
                              className="absolute top-0 right-0 bg-white/70 hover:bg-white"
                              onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                handleDeleteImage(img, idx);
                              }}
                            />
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </Form.Item>
              </TabPane>

              <TabPane
                tab={
                  <span className="flex items-center gap-2">
                    <FiList /> Amenities
                  </span>
                }
                key="amenities"
              >
                <Card className="shadow-sm bg-white">
                  <div className="mb-4">
                    <div className="flex items-center gap-2 mb-4">
                      <Input
                        placeholder="Add new amenity"
                        value={newAmenity}
                        onChange={(e) => setNewAmenity(e.target.value)}
                        onPressEnter={() => {
                          if (newAmenity.trim()) {
                            // Sanitize the amenity before adding
                            const sanitizedAmenity = newAmenity
                              .trim()
                              .replace(/^\/+|\/+$/g, "");
                            if (
                              !amenities.some(
                                (a) =>
                                  a?.toLowerCase() ===
                                  sanitizedAmenity.toLowerCase()
                              )
                            ) {
                              setAmenities([...amenities, sanitizedAmenity]);
                            }
                            setNewAmenity("");
                          }
                        }}
                        prefix={<FiPlus className="text-gray-400" />}
                      />
                      <Button
                        type="primary"
                        icon={<FiPlus />}
                        onClick={() => {
                          if (newAmenity.trim()) {
                            // Sanitize the amenity before adding
                            const sanitizedAmenity = newAmenity
                              .trim()
                              .replace(/^\/+|\/+$/g, "");
                            if (
                              !amenities.some(
                                (a) =>
                                  a?.toLowerCase() ===
                                  sanitizedAmenity.toLowerCase()
                              )
                            ) {
                              setAmenities([...amenities, sanitizedAmenity]);
                            }
                            setNewAmenity("");
                          }
                        }}
                        className="bg-blue-600 hover:bg-blue-700"
                      >
                        Add
                      </Button>
                    </div>

                    <div className="mb-2 bg-blue-50 p-4 rounded-lg">
                      <h4 className="font-medium mb-2 flex items-center text-gray-700">
                        <FiCheck className="mr-2 text-blue-600" /> Current
                        Amenities
                      </h4>
                      <div className="flex flex-wrap gap-2">
                        {amenities.map((amenity, index) => {
                          // Make sure amenity is a string before using string methods
                          const amenityStr =
                            typeof amenity === "string"
                              ? amenity
                              : String(amenity);

                          // Now it's safe to call replace()
                          const cleanAmenity = amenityStr
                            .replace(/^\/+|\/+$/g, "")
                            .trim();

                          return (
                            <Tag
                              key={index}
                              closable
                              onClose={() => {
                                const newAmenities = [...amenities];
                                newAmenities.splice(index, 1);
                                setAmenities(newAmenities);
                              }}
                              className="py-1.5 px-3 bg-white border border-blue-200 text-blue-700 flex items-center rounded-md"
                            >
                              {cleanAmenity}
                            </Tag>
                          );
                        })}
                        {amenities.length === 0 && (
                          <Typography.Text type="secondary" className="italic">
                            No amenities added yet
                          </Typography.Text>
                        )}
                      </div>
                    </div>

                    <Divider className="my-5">
                      <span className="text-gray-500 text-sm flex items-center">
                        <FiList className="mr-2" /> POPULAR AMENITIES
                      </span>
                    </Divider>

                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                      {[
                        { name: "WiFi", icon: <FiWifi /> },
                        { name: "Parking", icon: <FiSquare /> },
                        { name: "Air Conditioning", icon: <FiWind /> },
                        { name: "TV", icon: <FiMonitor /> },
                        { name: "Pool", icon: <FiDroplet /> },
                        { name: "Gym", icon: <FiActivity /> },
                        { name: "Restaurant", icon: <FiShoppingBag /> },
                        { name: "Pet Friendly", icon: <FiHeart /> },
                      ].map((item) => {
                        // Fix: Ensure we're safely comparing string values
                        const isAdded = amenities.some(
                          (a) =>
                            typeof a === "string" &&
                            a.toLowerCase() === item.name.toLowerCase()
                        );

                        return (
                          <Tag
                            key={item.name}
                            className={`py-2 px-3 cursor-pointer flex items-center justify-between hover:bg-blue-50 transition-colors ${
                              isAdded
                                ? "bg-blue-100 text-blue-700 border-blue-300"
                                : "bg-gray-50"
                            }`}
                            onClick={() => {
                              if (
                                !amenities.some(
                                  (a) =>
                                    typeof a === "string" &&
                                    a.toLowerCase() === item.name.toLowerCase()
                                )
                              ) {
                                setAmenities([...amenities, item.name]);
                              } else {
                                // If already added, remove it
                                setAmenities(
                                  amenities.filter(
                                    (a) =>
                                      typeof a !== "string" ||
                                      a.toLowerCase() !==
                                        item.name.toLowerCase()
                                  )
                                );
                              }
                            }}
                          >
                            <span className="flex items-center">
                              <span className="mr-2">{item.icon}</span>
                              {item.name}
                            </span>
                            {isAdded && (
                              <FiCheck className="ml-2 text-green-500" />
                            )}
                          </Tag>
                        );
                      })}
                    </div>
                  </div>
                </Card>
              </TabPane>

              <TabPane tab="Contact & Owner" key="contact">
                <Card title="Owner Information" className="mb-4">
                  <Form.Item name={["owner", "name"]} label="Owner/Host Name">
                    <Input
                      prefix={<FiUser />}
                      placeholder="Name of owner/host"
                    />
                  </Form.Item>

                  <Form.Item name={["owner", "phone"]} label="Contact Phone">
                    <Input prefix={<FiPhone />} placeholder="Phone number" />
                  </Form.Item>

                  <Form.Item name={["owner", "email"]} label="Contact Email">
                    <Input prefix={<FiMail />} placeholder="Email address" />
                  </Form.Item>

                  <Form.Item
                    name={["owner", "isFeatured"]}
                    label="Featured Host/Superhost"
                    valuePropName="checked"
                  >
                    <Switch />
                  </Form.Item>
                </Card>

                <Card title="Business Contact Info">
                  <Form.Item name="contactPhone" label="Contact Phone">
                    <Input prefix={<FiPhone />} placeholder="phone number" />
                  </Form.Item>

                  <Form.Item name="contactEmail" label="Contact Email">
                    <Input prefix={<FiMail />} placeholder="email address" />
                  </Form.Item>

                  <Form.Item name="website" label="Website">
                    <Input prefix={<FiGlobe />} placeholder="Website URL" />
                  </Form.Item>
                </Card>
              </TabPane>

              {/* Update the Hours TabPane with autofill functionality */}
              <TabPane tab="Hours" key="hours">
                <Card title="Business Hours">
                  <div className="mb-4">
                    <div className="flex flex-wrap gap-2 mb-4">
                      <Button
                        type="default"
                        icon={<FiClock />}
                        onClick={() => {
                          // Standard business hours (9 AM to 5 PM)
                          const businessHours = {
                            monday: {
                              open: dayjs("09:00", "HH:mm"),
                              close: dayjs("17:00", "HH:mm"),
                            },
                            tuesday: {
                              open: dayjs("09:00", "HH:mm"),
                              close: dayjs("17:00", "HH:mm"),
                            },
                            wednesday: {
                              open: dayjs("09:00", "HH:mm"),
                              close: dayjs("17:00", "HH:mm"),
                            },
                            thursday: {
                              open: dayjs("09:00", "HH:mm"),
                              close: dayjs("17:00", "HH:mm"),
                            },
                            friday: {
                              open: dayjs("09:00", "HH:mm"),
                              close: dayjs("17:00", "HH:mm"),
                            },
                            saturday: {
                              open: dayjs("10:00", "HH:mm"),
                              close: dayjs("15:00", "HH:mm"),
                            },
                            sunday: { open: null, close: null },
                          };
                          form.setFieldsValue({ hours: businessHours });
                        }}
                      >
                        Standard Hours (9-5)
                      </Button>

                      <Button
                        type="default"
                        onClick={() => {
                          // Extended hours (8 AM to 8 PM)
                          const extendedHours = {
                            monday: {
                              open: dayjs("08:00", "HH:mm"),
                              close: dayjs("20:00", "HH:mm"),
                            },
                            tuesday: {
                              open: dayjs("08:00", "HH:mm"),
                              close: dayjs("20:00", "HH:mm"),
                            },
                            wednesday: {
                              open: dayjs("08:00", "HH:mm"),
                              close: dayjs("20:00", "HH:mm"),
                            },
                            thursday: {
                              open: dayjs("08:00", "HH:mm"),
                              close: dayjs("20:00", "HH:mm"),
                            },
                            friday: {
                              open: dayjs("08:00", "HH:mm"),
                              close: dayjs("20:00", "HH:mm"),
                            },
                            saturday: {
                              open: dayjs("09:00", "HH:mm"),
                              close: dayjs("18:00", "HH:mm"),
                            },
                            sunday: {
                              open: dayjs("10:00", "HH:mm"),
                              close: dayjs("16:00", "HH:mm"),
                            },
                          };
                          form.setFieldsValue({ hours: extendedHours });
                        }}
                      >
                        Extended Hours (8-8)
                      </Button>

                      <Button
                        type="default"
                        onClick={() => {
                          // 24/7 operation
                          const allDayHours = {
                            monday: {
                              open: dayjs("00:00", "HH:mm"),
                              close: dayjs("23:59", "HH:mm"),
                            },
                            tuesday: {
                              open: dayjs("00:00", "HH:mm"),
                              close: dayjs("23:59", "HH:mm"),
                            },
                            wednesday: {
                              open: dayjs("00:00", "HH:mm"),
                              close: dayjs("23:59", "HH:mm"),
                            },
                            thursday: {
                              open: dayjs("00:00", "HH:mm"),
                              close: dayjs("23:59", "HH:mm"),
                            },
                            friday: {
                              open: dayjs("00:00", "HH:mm"),
                              close: dayjs("23:59", "HH:mm"),
                            },
                            saturday: {
                              open: dayjs("00:00", "HH:mm"),
                              close: dayjs("23:59", "HH:mm"),
                            },
                            sunday: {
                              open: dayjs("00:00", "HH:mm"),
                              close: dayjs("23:59", "HH:mm"),
                            },
                          };
                          form.setFieldsValue({ hours: allDayHours });
                        }}
                      >
                        24/7 Hours
                      </Button>

                      <Button
                        type="default"
                        danger
                        onClick={() => {
                          // Clear all hours
                          const emptyHours = {
                            monday: { open: null, close: null },
                            tuesday: { open: null, close: null },
                            wednesday: { open: null, close: null },
                            thursday: { open: null, close: null },
                            friday: { open: null, close: null },
                            saturday: { open: null, close: null },
                            sunday: { open: null, close: null },
                          };
                          form.setFieldsValue({ hours: emptyHours });
                        }}
                      >
                        Clear All
                      </Button>
                    </div>

                    <div className="mb-3">
                      <Text type="secondary">
                        Quick tip: You can also set custom hours for specific
                        days below
                      </Text>
                    </div>
                  </div>

                  {[
                    "monday",
                    "tuesday",
                    "wednesday",
                    "thursday",
                    "friday",
                    "saturday",
                    "sunday",
                  ].map((day) => (
                    <Form.Item
                      label={
                        <div className="flex justify-between w-full">
                          <span>
                            {day.charAt(0).toUpperCase() + day.slice(1)}
                          </span>
                          <Button
                            type="link"
                            size="small"
                            onClick={() => {
                              // Apply current day's time to all weekdays
                              const dayValues = form.getFieldValue([
                                "hours",
                                day,
                              ]);
                              if (dayValues?.open && dayValues?.close) {
                                const weekdays = [
                                  "monday",
                                  "tuesday",
                                  "wednesday",
                                  "thursday",
                                  "friday",
                                ];
                                const updatedHours = {};
                                weekdays.forEach((weekday) => {
                                  updatedHours[weekday] = {
                                    open: dayValues.open,
                                    close: dayValues.close,
                                  };
                                });
                                form.setFieldsValue({
                                  hours: {
                                    ...form.getFieldValue("hours"),
                                    ...updatedHours,
                                  },
                                });
                              }
                            }}
                          >
                            Apply to weekdays
                          </Button>
                        </div>
                      }
                      key={day}
                    >
                      <Input.Group compact>
                        <Form.Item name={["hours", day, "open"]} noStyle>
                          <TimePicker
                            format="HH:mm"
                            placeholder="Opening time"
                            style={{ width: "50%" }}
                          />
                        </Form.Item>
                        <Form.Item name={["hours", day, "close"]} noStyle>
                          <TimePicker
                            format="HH:mm"
                            placeholder="Closing time"
                            style={{ width: "50%" }}
                          />
                        </Form.Item>
                      </Input.Group>
                    </Form.Item>
                  ))}
                </Card>
              </TabPane>

              <TabPane tab="Attributes" key="attributes">
                <Card title="Listing Attributes" className="mb-4">
                  <Form.Item
                    label="Attributes"
                    help="Comma-separated list of attributes (e.g. cuisine, bedrooms, wifi)"
                  >
                    <Input.TextArea
                      rows={3}
                      value={attributeString}
                      onChange={(e) => setAttributeString(e.target.value)}
                      placeholder="cuisine, seatingCapacity, hasOutdoorSeating, servesAlcohol..."
                    />
                  </Form.Item>

                  <div className="mt-4">
                    <h4 className="font-medium mb-2">Common Attributes</h4>
                    <div className="flex flex-wrap gap-2 mb-4">
                      {[
                        "bedrooms",
                        "bathrooms",
                        "wifi",
                        "parking",
                        "pool",
                        "cuisine",
                        "seatingCapacity",
                        "hasOutdoorSeating",
                        "servesAlcohol",
                        "priceRange",
                        "reservationRequired",
                      ].map((attr) => (
                        <Tag
                          key={attr}
                          className="py-1 px-2 cursor-pointer"
                          onClick={() => {
                            // Check if attribute already exists
                            const currentAttrs = attributeString.split(/,\s*/);
                            if (!currentAttrs.includes(attr)) {
                              // Add to the list with comma if needed
                              setAttributeString((prev) => {
                                const newValue = prev.trim()
                                  ? `${prev}, ${attr}`
                                  : attr;
                                return newValue;
                              });
                            }
                          }}
                        >
                          {attr}
                        </Tag>
                      ))}
                    </div>

                    {attributeString && (
                      <div className="bg-blue-50 p-4 rounded-lg mt-4">
                        <h4 className="font-medium mb-2">Current Attributes</h4>
                        <div className="flex flex-wrap gap-2">
                          {attributeString
                            .split(/,\s*/)
                            .filter(Boolean)
                            .map((attr, i) => (
                              <Tag
                                key={i}
                                closable
                                onClose={() => {
                                  // Remove this attribute
                                  const attrs = attributeString
                                    .split(/,\s*/)
                                    .filter((a) => a !== attr);
                                  setAttributeString(attrs.join(", "));
                                }}
                              >
                                {attr}
                              </Tag>
                            ))}
                        </div>
                      </div>
                    )}
                  </div>
                </Card>
              </TabPane>
            </Tabs>

            <Divider />

            <Form.Item>
              <div className="flex justify-end gap-2">
                <Button
                  onClick={() => {
                    resetForm();
                    setShowForm(false);
                  }}
                >
                  Cancel
                </Button>
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
        </Drawer>

        {/* Listings Display */}
        {loading ? (
          <div className="flex justify-center items-center py-20">
            <Spin size="large" />
          </div>
        ) : listings.length > 0 ? (
          <div
            className={
              viewMode === "grid"
                ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 gap-4 md:gap-6"
                : "space-y-4"
            }
          >
            {viewMode === "grid"
              ? listings.map((listing) => renderGridItem(listing))
              : listings.map((listing) => renderListItem(listing))}
          </div>
        ) : (
          <Empty
            description={
              <span>
                No listings found.{" "}
                {selectedCategory ? "Try a different category or " : ""}
                <a
                  onClick={() => {
                    resetForm();
                    setShowForm(true);
                  }}
                >
                  add a new listing
                </a>
              </span>
            }
            className="py-16"
          />
        )}
      </div>
    </div>
  );
};

export default AdminListings;
