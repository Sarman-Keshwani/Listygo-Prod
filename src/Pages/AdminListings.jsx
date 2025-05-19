import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Card, Select, Button, Drawer, message } from "antd";
import { FiPlus, FiGrid, FiList } from "react-icons/fi";

import ListingForm from "../components/admin/ListingForm";
import ListingList from "../components/admin/ListingList";
import {
  fetchCategoriesAPI,
  fetchListingsAPI,
  deleteListingAPI,
} from "../utils/api";

const { Option } = Select;

const AdminListings = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);
  const categoryFilter = queryParams.get("category");

  // State
  const [listings, setListings] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [editingListingId, setEditingListingId] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState(
    categoryFilter || null
  );
  const [showForm, setShowForm] = useState(false);
  const [viewMode, setViewMode] = useState("grid"); // 'grid' or 'list'
  const [currentEditingListing, setCurrentEditingListing] = useState(null);

  // Authentication check
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

  // Fetch categories
  const fetchCategories = async () => {
    try {
      const response = await fetchCategoriesAPI();
      setCategories(response.data);

      // If category filter is set but not in state, set it now
      if (categoryFilter && !selectedCategory) {
        setSelectedCategory(categoryFilter);
      }
    } catch (error) {
      console.error("Error fetching categories:", error);
      message.error("Failed to load categories. Please try again.");
    }
  };

  // Fetch listings
  const fetchListings = async (pageNum = 1, append = false) => {
    if (pageNum === 1) {
      setLoading(true);
    } else {
      setLoadingMore(true);
    }

    try {
      const response = await fetchListingsAPI(pageNum, selectedCategory);
      const newListings = response.data;

      if (newListings.length === 0) {
        setHasMore(false);
      } else {
        if (append) {
          setListings((prev) => [...prev, ...newListings]);
        } else {
          setListings(newListings);
        }
        setPage(pageNum);
      }
    } catch (error) {
      console.error("Error fetching listings:", error);
      message.error("Failed to load listings. Please try again.");
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  // Load more listings
  const loadMoreListings = () => {
    if (!loadingMore && hasMore) {
      fetchListings(page + 1, true);
    }
  };

  // Handle category filter change
  const handleCategoryChange = (categoryId) => {
    setSelectedCategory(categoryId);
    setPage(1);
    setHasMore(true);
    // Update URL with category parameter without reloading
    const newUrl = categoryId
      ? `${location.pathname}?category=${categoryId}`
      : location.pathname;
    window.history.pushState({}, "", newUrl);
  };

  // Handle edit listing
  const handleEdit = (listing) => {
    setEditingListingId(listing._id);
    setCurrentEditingListing(listing);
    setShowForm(true);
  };

  // Handle delete listing
  const handleDelete = async (listingId) => {
    if (!window.confirm("Are you sure you want to delete this listing?"))
      return;

    try {
      await deleteListingAPI(listingId);
      message.success("Listing deleted successfully!");
      fetchListings(); // Refresh listings
    } catch (error) {
      console.error("Error deleting listing:", error);
      message.error(
        error.response?.data?.message || "Failed to delete listing"
      );
    }
  };

  // Reset form and close drawer
  const resetForm = () => {
    setEditingListingId(null);
    setCurrentEditingListing(null);
    setShowForm(false);
  };

  // Handle form success
  const handleFormSuccess = () => {
    fetchListings();
    resetForm();
  };

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
          open={showForm}
          onClose={() => setShowForm(false)}
          extra={<Button onClick={() => setShowForm(false)}>Cancel</Button>}
        >
          <ListingForm
            editingListingId={editingListingId}
            onClose={() => setShowForm(false)}
            onSuccess={handleFormSuccess}
            categories={categories}
            listingData={currentEditingListing}
          />
        </Drawer>

        {/* Listings Display */}
        <ListingList
          listings={listings}
          loading={loading}
          loadingMore={loadingMore}
          hasMore={hasMore}
          viewMode={viewMode}
          setViewMode={setViewMode}
          loadMoreListings={loadMoreListings}
          handleEdit={handleEdit}
          handleDelete={handleDelete}
          categories={categories}
          onAddNew={() => {
            resetForm();
            setShowForm(true);
          }}
        />
      </div>
    </div>
  );
};

export default AdminListings;
