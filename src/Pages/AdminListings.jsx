import React, { useState, useEffect } from "react";
import axios from "axios";
import countries from "../components/countries.json";
import states from "../components/states.json";
import cities from "../components/cities.json";
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

  // 1) Image upload & preview helper
  const handleFileUpload = (file) => {
    if (!ALLOWED_FILE_TYPES.includes(file.type) || file.size > MAX_FILE_SIZE) {
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

      if (!ALLOWED_FILE_TYPES.includes(file.originFileObj.type) || file.originFileObj.size > MAX_FILE_SIZE) {
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

  // 3) Simplified submit handler ↴
  // 3) Simplified submit handler ↴
  const handleFormSubmit = async (values) => {
    setFormLoading(true);
    try {
      const token = localStorage.getItem("token");
      const fd = new FormData();
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
          values.area, // Add area to location
          selectedStateObj?.name,
          selectedCountryObj?.name,
        ]
          .filter(Boolean)
          .join(", ");

        fd.append("location", location);
      }

      // basic fields
      Object.entries(values).forEach(([k, v]) => {
        if (v != null && k !== "hours" && !k.startsWith("owner.")) {
          fd.append(k, v);
        }
      });

      // Add amenities
      if (amenities.length > 0) {
        fd.append("amenities", JSON.stringify(amenities));
      }

      // Add attributes
      if (attributeKeys.length > 0) {
        fd.append("attributes", JSON.stringify(attributeValues));
      }

      // Add owner information if available
      if (values.owner) {
        Object.entries(values.owner).forEach(([k, v]) => {
          if (v != null) {
            fd.append(`owner[${k}]`, v);
          }
        });
      }

      // Add hours information if available
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
        fd.append("hours", JSON.stringify(formattedHours));
      }

      // images: data URLs → blobs, URLs → JSON
      const dataUrls = images.filter((i) => i && i.startsWith("data:"));
      const urls = images.filter((i) => i && !i.startsWith("data:") && i.trim());
      if (urls.length) fd.append("imageUrls", JSON.stringify(urls));
      for (let i = 0; i < dataUrls.length; i++) {
        const blob = await fetch(dataUrls[i]).then((r) => r.blob());
        fd.append("images", blob, `img${i}.jpg`);
      }
      fd.append("replaceImages", editingListingId ? "false" : "true");

      const method = editingListingId ? "put" : "post";
      const url = editingListingId
        ? `${API_URL}/listings/${editingListingId}`
        : `${API_URL}/listings`;

      // For debugging
      console.log("Form submission data:", {
        method,
        url,
        editingListingId,
        amenities,
        attributeValues,
        images: images.length,
      });

      await axios({
        method,
        url,
        data: fd,
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "multipart/form-data",
        },
      });

      notification.success({
        message: `Listing ${editingListingId ? "updated" : "created"}!`,
        message: `Listing ${editingListingId ? "updated" : "created"}!`,
      });
      resetForm();
      fetchListings();
      setShowForm(false);
    } catch (err) {
      console.error("Error creating/updating listing:", err);
      notification.error({
        message: "Error",
        description: err.response?.data?.message || err.message,
      });
    } finally {
      setFormLoading(false);
    }
  };

  const handleEdit = (listing) => {
    setEditingListingId(listing._id);

    // Set form values for basic fields
    form.setFieldsValue({
      name: listing.name,
      category: listing.category._id,
      price: listing.price,
      rating: listing.rating,
      description: listing.description,
      isFeatured: listing.isFeatured || false,
      contactPhone: listing.contactPhone,
      contactEmail: listing.contactEmail,
      website: listing.website,
      tags: listing.tags || [],
    });

    // Parse location for country, state, city, area
    if (listing.location) {
      const locationParts = listing.location.split(",").map((part) =>
        part.trim()
      );
      const city = locationParts[0];
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
    setImages(
      listing.images && listing.images.length > 0 ? listing.images : [""]
    );
    setActiveImagePreview(0);

    // Set amenities
    setAmenities(listing.amenities || []);

    // Set business hours if available
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
      form.setFieldValue("hours", hours);
    }

    // Set owner information
    if (listing.owner) {
      form.setFieldsValue({
        "owner.name": listing.owner.name,
        "owner.phone": listing.owner.phone,
        "owner.email": listing.owner.email,
        "owner.image": listing.owner.image,
        "owner.isFeatured": listing.owner.isFeatured,
      });
    }

    // Set dynamic attributes
    if (listing.attributes) {
      const attributeObj = listing.attributes;
      const keys = Object.keys(attributeObj);

      setAttributeKeys(keys);
      setAttributeValues(attributeObj);
    } else {
      setAttributeKeys([]);
      setAttributeValues({});
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
      className="overflow-hidden"
      cover={
        <div className="h-48 overflow-hidden">
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
      <h3 className="font-semibold text-lg mb-1 text-blue-700">
        {listing.name}
      </h3>
      <div className="flex items-center text-gray-500 mb-1">
        <FiMapPin size={14} className="mr-1" />
        <span className="text-sm">{listing.location}</span>
      </div>
      <div className="flex justify-between items-center">
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
        <div className="md:w-1/4 h-40 md:h-auto mr-4 mb-4 md:mb-0 overflow-hidden">
          {listing.images && listing.images.length > 0 ? (
            <img
              alt={listing.name}
              src={listing.images[0]}
              className="w-full h-full object-cover rounded"
              onError={(e) => {
                e.target.onerror = null;
                e.target.src = "https://via.placeholder.com/300x200?text=No+Image";
              }}
            />
          ) : (
            <div className="h-full bg-gray-200 flex items-center justify-center rounded">
              <FiImage size={32} className="text-gray-500" />
            </div>
          )}
        </div>

        <div className="flex-1">
          <div className="flex items-center justify-between">
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
              <Rate disabled defaultValue={listing.rating} allowHalf className="text-sm" />
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
        <div className="container mx-auto flex justify-between items-center">
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

      <div className="container mx-auto p-4">
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
                  option.children.toLowerCase().indexOf(input.toLowerCase()) >= 0
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
                {listings.length} listing{listings.length !== 1 ? "s" : ""} found
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
                  rules={[{ required: true, message: "Please select a category" }]}
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
                    beforeUpload={handleFileUpload}
                  >
                    <Button icon={<FiPlus />}>Upload</Button>
                  </Upload>
                  <Button
                    type="dashed"
                    onClick={() => setImages([...images, ""])}
                    className="mt-2"
                  >
                    Add URL Field
                  </Button>

                  {/* URL inputs */}
                  {images.map((url, i) => (
                    <Input
                      key={i}
                      className="mt-2"
                      value={url}
                      placeholder={`Image URL #${i + 1}`}
                      onChange={(e) => {
                        const next = [...images];
                        next[i] = e.target.value;
                        setImages(next);
                      }}
                    />
                  ))}

                  {/* Preview */}
                  <div className="mt-4 h-48 flex items-center justify-center bg-gray-100">
                    {previewUrl || images[activeImagePreview]?.trim() ? (
                      <img
                        src={previewUrl || images[activeImagePreview]}
                        alt="Preview"
                        className="max-h-full"
                        onError={(e) =>
                          (e.currentTarget.src =
                            "https://via.placeholder.com/400x200?text=Invalid")
                        }
                      />
                    ) : (
                      <span className="text-gray-500">No preview</span>
                    )}
                  </div>
                </Form.Item>
                    <Button icon={<FiPlus />}>Upload</Button>
                  </Upload>
                  <Button
                    type="dashed"
                    onClick={() => setImages([...images, ""])}
                    className="mt-2"
                  >
                    Add URL Field
                  </Button>

                  {/* URL inputs */}
                  {images.map((url, i) => (
                    <Input
                      key={i}
                      className="mt-2"
                      value={url}
                      placeholder={`Image URL #${i + 1}`}
                      onChange={(e) => {
                        const next = [...images];
                        next[i] = e.target.value;
                        setImages(next);
                      }}
                    />
                  ))}

                  {/* Preview */}
                  <div className="mt-4 h-48 flex items-center justify-center bg-gray-100">
                    {previewUrl || images[activeImagePreview]?.trim() ? (
                      <img
                        src={previewUrl || images[activeImagePreview]}
                        alt="Preview"
                        className="max-h-full"
                        onError={(e) =>
                          (e.currentTarget.src =
                            "https://via.placeholder.com/400x200?text=Invalid")
                        }
                      />
                    ) : (
                      <span className="text-gray-500">No preview</span>
                    )}
                  </div>
                </Form.Item>
              </TabPane>

              <TabPane tab="Amenities" key="amenities">
                <div className="mb-4">
                  <div className="flex items-center gap-2 mb-4">
                    <Input
                      placeholder="Add new amenity"
                      value={newAmenity}
                      onChange={(e) => setNewAmenity(e.target.value)}
                      onPressEnter={() => {
                        if (newAmenity.trim()) {
                          setAmenities([...amenities, newAmenity.trim()]);
                          setNewAmenity("");
                        }
                      }}
                    />
                    <Button
                      type="primary"
                      icon={<FiPlus />}
                      onClick={() => {
                        if (newAmenity.trim()) {
                          setAmenities([...amenities, newAmenity.trim()]);
                          setNewAmenity("");
                        }
                      }}
                      className="bg-blue-600 hover:bg-blue-700"
                    >
                      Add
                    </Button>
                  </div>

                  <div className="mb-2">
                    <h4 className="font-medium mb-2">Current Amenities</h4>
                    <div className="flex flex-wrap gap-2">
                      {amenities.map((amenity, index) => (
                        <Tag
                          key={index}
                          closable
                          onClose={() => {
                            const newAmenities = [...amenities];
                            newAmenities.splice(index, 1);
                            setAmenities(newAmenities);
                          }}
                          className="py-1 px-3"
                        >
                          {amenity}
                        </Tag>
                      ))}
                      {amenities.length === 0 && (
                        <Typography.Text type="secondary">
                          No amenities added yet
                        </Typography.Text>
                      )}
                    </div>
                  </div>

                  <Divider />

                  <h4 className="font-medium mb-2">Common Amenities</h4>
                  <div className="flex flex-wrap gap-2">
                    {[
                      "WiFi",
                      "Parking",
                      "Air Conditioning",
                      "TV",
                      "Pool",
                      "Gym",
                      "Restaurant",
                    ].map((item) => (
                      <Tag
                        key={item}
                        className="py-1 px-3 cursor-pointer"
                        onClick={() => {
                          if (!amenities.includes(item)) {
                            setAmenities([...amenities, item]);
                          }
                        }}
                      >
                        {item} <FiPlus size={12} />
                      </Tag>
                    ))}
                  </div>
                </div>
              </TabPane>

              <TabPane tab="Contact & Owner" key="contact">
                <Card title="Owner Information" className="mb-4">
                  <Form.Item name="owner.name" label="Owner/Host Name">
                    <Input
                      prefix={<FiUser />}
                      placeholder="Name of owner/host"
                    />
                  </Form.Item>

                  <Form.Item name="owner.phone" label="Contact Phone">
                    <Input prefix={<FiPhone />} placeholder="Phone number" />
                  </Form.Item>

                  <Form.Item name="owner.email" label="Contact Email">
                    <Input prefix={<FiMail />} placeholder="Email address" />
                  </Form.Item>

                  <Form.Item name="owner.image" label="Owner Image URL">
                    <Input
                      prefix={<FiImage />}
                      placeholder="URL to owner/host image"
                    />
                  </Form.Item>

                  <Form.Item
                    name="owner.isFeatured"
                    label="Featured Host/Superhost"
                    valuePropName="checked"
                  >
                    <Switch />
                  </Form.Item>
                </Card>

                <Card title="Additional Contact Info">
                  <Form.Item name="website" label="Website">
                    <Input prefix={<FiGlobe />} placeholder="Website URL" />
                  </Form.Item>

                  <Form.Item name="contactPhone" label="Public Contact Phone">
                    <Input
                      prefix={<FiPhone />}
                      placeholder="Public phone number"
                    />
                  </Form.Item>

                  <Form.Item name="contactEmail" label="Public Contact Email">
                    <Input
                      prefix={<FiMail />}
                      placeholder="Public email address"
                    />
                  </Form.Item>
                </Card>
              </TabPane>

              <TabPane tab="Hours" key="hours">
                <Card title="Business Hours">
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
                      label={day.charAt(0).toUpperCase() + day.slice(1)}
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
                <Card title="Custom Attributes" className="mb-4">
                  <div className="flex items-center gap-2 mb-4">
                    <Input
                      placeholder="Attribute name"
                      value={newAttributeKey}
                      onChange={(e) => setNewAttributeKey(e.target.value)}
                      style={{ width: "40%" }}
                    />
                    <Input
                      placeholder="Attribute value"
                      value={newAttributeValue}
                      onChange={(e) => setNewAttributeValue(e.target.value)}
                      style={{ width: "40%" }}
                      onPressEnter={() => {
                        if (
                          newAttributeKey.trim() &&
                          newAttributeValue.trim()
                        ) {
                          const updatedValues = { ...attributeValues };
                          updatedValues[newAttributeKey.trim()] =
                            newAttributeValue.trim();
                          setAttributeValues(updatedValues);

                          if (!attributeKeys.includes(newAttributeKey.trim())) {
                            setAttributeKeys([
                              ...attributeKeys,
                              newAttributeKey.trim(),
                            ]);
                          }

                          setNewAttributeKey("");
                          setNewAttributeValue("");
                        }
                      }}
                    />
                    <Button
                      type="primary"
                      icon={<FiPlus />}
                      onClick={() => {
                        if (
                          newAttributeKey.trim() &&
                          newAttributeValue.trim()
                        ) {
                          const updatedValues = { ...attributeValues };
                          updatedValues[newAttributeKey.trim()] =
                            newAttributeValue.trim();
                          setAttributeValues(updatedValues);

                          if (!attributeKeys.includes(newAttributeKey.trim())) {
                            setAttributeKeys([
                              ...attributeKeys,
                              newAttributeKey.trim(),
                            ]);
                          }

                          setNewAttributeKey("");
                          setNewAttributeValue("");
                        }
                      }}
                      className="bg-blue-600 hover:bg-blue-700"
                    >
                      Add
                    </Button>
                  </div>

                  <div className="mb-2">
                    <h4 className="font-medium mb-2">Current Attributes</h4>
                    {attributeKeys.length > 0 ? (
                      <div className="space-y-2">
                        {attributeKeys.map((key) => (
                          <div
                            key={key}
                            className="flex items-center justify-between border rounded p-2"
                          >
                            <div className="flex items-center gap-2">
                              <FiPackage className="text-blue-500" />
                              <div>
                                <div className="font-medium">{key}</div>
                                <div className="text-sm text-gray-500">
                                  {attributeValues[key]}
                                </div>
                              </div>
                            </div>
                            <Button
                              type="text"
                              danger
                              icon={<FiTrash2 />}
                              onClick={() => {
                                const newKeys = attributeKeys.filter(
                                  (k) => k !== key
                                );
                                const newValues = { ...attributeValues };
                                delete newValues[key];
                                setAttributeKeys(newKeys);
                                setAttributeValues(newValues);
                              }}
                            />
                          </div>
                        ))}
                      </div>
                    ) : (
                      <Empty
                        description="No custom attributes"
                        image={Empty.PRESENTED_IMAGE_SIMPLE}
                      />
                    )}
                  </div>

                  <Divider />

                  <h4 className="font-medium mb-2">Common Attributes</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <Card
                      size="small"
                      hoverable
                      onClick={() => {
                        setNewAttributeKey("bedrooms");
                        setNewAttributeValue("1");
                      }}
                    >
                      <div className="flex items-center gap-2">
                        <FiHome className="text-blue-500" />
                        <div>Bedrooms</div>
                      </div>
                    </Card>

                    <Card
                      size="small"
                      hoverable
                      onClick={() => {
                        setNewAttributeKey("bathrooms");
                        setNewAttributeValue("1");
                      }}
                    >
                      <div className="flex items-center gap-2">
                        <FiHome className="text-blue-500" />
                        <div>Bathrooms</div>
                      </div>
                    </Card>

                    <Card
                      size="small"
                      hoverable
                      onClick={() => {
                        setNewAttributeKey("maxGuests");
                        setNewAttributeValue("2");
                      }}
                    >
                      <div className="flex items-center gap-2">
                        <FiUsers className="text-blue-500" />
                        <div>Max Guests</div>
                      </div>
                    </Card>

                    <Card
                      size="small"
                      hoverable
                      onClick={() => {
                        setNewAttributeKey("size");
                        setNewAttributeValue("0");
                      }}
                    >
                      <div className="flex items-center gap-2">
                        <FiHome className="text-blue-500" />
                        <div>Size (sq ft)</div>
                      </div>
                    </Card>
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
                ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
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
