import React, { useState, useEffect, useMemo } from "react";
import axios from "axios";
import { useNavigate, useSearchParams } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Card,
  Row,
  Col,
  Input,
  Select,
  Typography,
  Tag,
  Rate,
  Empty,
  Spin,
  Button,
  Badge,
  Space,
  Divider,
  Drawer,
  Cascader,
  Alert,
  Slider,
  Radio,
  Checkbox,
  notification,
  Pagination,
} from "antd";
import {
  SearchOutlined,
  EnvironmentOutlined,
  StarOutlined,
  FilterOutlined,
  AppstoreOutlined,
  BarsOutlined,
  ReloadOutlined,
} from "@ant-design/icons";
import { MdBed, MdBathroom, MdCarRental } from "react-icons/md";
import { FiMaximize2 } from "react-icons/fi";

const { Title, Text, Paragraph } = Typography;
const { Option } = Select;
const API_URL = import.meta.env.VITE_API_URL || "https://api.pathsuchi.com/api";

const ListingsPage = () => {
  const [listings, setListings] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();

  // Add pagination state
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 12,
    total: 0,
  });

  // filter states
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [priceRange, setPriceRange] = useState([0, 1000]);
  const [ratingFilter, setRatingFilter] = useState(0);
  const [sortBy, setSortBy] = useState("createdAt_desc");
  const [amenities, setAmenities] = useState([]);
  const [selectedLocation, setSelectedLocation] = useState([]);
  const [viewMode, setViewMode] = useState("grid");
  const [filtersDrawerVisible, setFiltersDrawerVisible] = useState(false);

  // dynamic location cascader
  const [locations, setLocations] = useState([]);
  useEffect(() => {
    // load countries
    axios
      .get(`${API_URL}/countries`, {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      })
      .then((res) => {
        setLocations(
          res.data.data.map((c) => ({
            value: c._id,
            label: c.name,
            isLeaf: false,
          }))
        );
      })
      .catch(() => notification.error({ message: "Failed to load countries" }));
  }, []);

  const loadLocationData = (selectedOptions) => {
    const target = selectedOptions[selectedOptions.length - 1];
    target.loading = true;
    let endpoint = "";
    if (selectedOptions.length === 1)
      endpoint = `/states?country=${target.value}`;
    else if (selectedOptions.length === 2)
      endpoint = `/cities?state=${target.value}`;
    else endpoint = `/areas?city=${target.value}`;
    axios
      .get(API_URL + endpoint, {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      })
      .then((res) => {
        target.children = (res.data.data || []).map((item) => ({
          value: item._id,
          label: item.name,
          isLeaf: selectedOptions.length === 3,
        }));
        setLocations((orig) => [...orig]);
      })
      .catch(() => notification.error({ message: "Failed to load regions" }))
      .finally(() => {
        target.loading = false;
      });
  };

  // fetch categories & listings
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const resp = await axios.get(`${API_URL}/categories`);
        setCategories(resp.data.data || []);
      } catch {
        setError("Failed to load categories.");
      }
    };

    const fetchListings = async () => {
      setLoading(true);
      try {
        const params = {};
        ["category", "search"].forEach((k) => {
          const v = searchParams.get(k);
          if (v) params[k] = v;
        });
        const minP = searchParams.get("minPrice"),
          maxP = searchParams.get("maxPrice");
        if (minP) params["price[gte]"] = minP;
        if (maxP) params["price[lte]"] = maxP;
        const rating = searchParams.get("rating");
        if (rating) params["rating[gte]"] = rating;
        const am = searchParams.get("amenities");
        if (am) params.amenities = am;
        const sort = searchParams.get("sort");
        if (sort) params.sort = sort;
        const loc = searchParams.get("location");

        // Add pagination parameters - explicitly set defaults
        const page = searchParams.get("page") || 1;
        const limit = searchParams.get("limit") || 40; // Increased limit to show more items per page
        params.page = page;
        params.limit = limit;

        const query = new URLSearchParams(params).toString();
        console.log(`Fetching listings with query: ${query}`);

        // Enable verbose logging for debugging
        console.log(`API URL: ${API_URL}/listings?${query}`);
        console.log(
          `MongoDB connection: mongodb+srv://cyberia2k24:*****@cluster0.d4mpd1e.mongodb.net/listygo`
        );

        const resp = await axios.get(`${API_URL}/listings?${query}`);
        console.log("API response:", resp.data);

        let data = resp.data.data || [];

        // Update pagination state with data from API response
        // Make sure to use the total count from the response
        setPagination({
          current: parseInt(page),
          pageSize: parseInt(limit),
          total: resp.data.count || 0, // Try to use count directly
        });

        console.log(
          `Retrieved ${data.length} listings out of total ${resp.data.count}`
        );

        if (loc) {
          const codes = loc.split(",");
          const target = codes[codes.length - 1].toLowerCase();
          data = data.filter((item) =>
            item.location?.toLowerCase().includes(target)
          );
        }
        setListings(data);
      } catch (err) {
        console.error("Error fetching listings:", err);
        setError("Failed to load listings.");
      } finally {
        setLoading(false);
      }
    };
    fetchCategories();
    fetchListings();
  }, [searchParams]);

  // Add a function to clear pagination and start fresh
  const resetAndFetchAllListings = () => {
    // Clear all existing params but keep essential ones
    const essentialParams = {};
    if (selectedCategory) essentialParams.category = selectedCategory;
    if (searchQuery) essentialParams.search = searchQuery;

    // Set page 1 with a large limit
    setSearchParams({
      ...essentialParams,
      page: 1,
      limit: 40, // Show more items per page
    });
  };

  // Render listings logic
  const renderListings = () => {
    if (loading) {
      return (
        <div className="w-full flex justify-center items-center py-20">
          <Spin size="large" />
        </div>
      );
    }

    if (error) {
      return (
        <Alert
          message="Error"
          description={error}
          type="error"
          showIcon
          className="mb-4"
        />
      );
    }

    if (listings.length === 0) {
      return (
        <Empty
          description="No listings found"
          className="py-20"
          image={Empty.PRESENTED_IMAGE_SIMPLE}
        />
      );
    }

    return (
      <div className="mb-8">
        {viewMode === "grid" ? (
          <Row gutter={[16, 16]}>
            {listings.map((listing) => (
              <Col xs={24} sm={12} md={8} lg={6} key={listing._id}>
                {renderGridItem(listing)}
              </Col>
            ))}
          </Row>
        ) : (
          <div className="space-y-4">
            {listings.map((listing) => renderListItem(listing))}
          </div>
        )}

        {/* Add total count display and debug button */}
        <div className="my-4 text-center">
          <Text type="secondary">
            Showing {listings.length} of {pagination.total} total listings
          </Text>
          <br />
          <Button onClick={resetAndFetchAllListings} className="mt-2">
            Reset and Show All
          </Button>
        </div>

        {/* Pagination component */}
        <div className="mt-8 flex justify-center">
          <Pagination
            current={pagination.current}
            pageSize={pagination.pageSize}
            total={pagination.total}
            onChange={handlePaginationChange}
            showSizeChanger
            pageSizeOptions={["12", "24", "36", "48"]}
            showTotal={(total, range) =>
              `${range[0]}-${range[1]} of ${total} listings`
            }
          />
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-7xl mx-auto">
        <Card className="mb-6">
          <Row gutter={16} className="mb-4">
            <Col span={8}>
              <Input
                placeholder="Search..."
                prefix={<SearchOutlined />}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onPressEnter={applyFilters}
              />
            </Col>
            <Col span={8}>
              <Select
                placeholder="Category"
                value={selectedCategory || undefined}
                onChange={setSelectedCategory}
                allowClear
                style={{ width: "100%" }}
              >
                {categories.map((c) => (
                  <Option key={c._id} value={c._id}>
                    {c.name}
                  </Option>
                ))}
              </Select>
            </Col>
            {/* <Col span={8}>
              <Cascader
                options={locations}
                loadData={loadLocationData}
                value={selectedLocation}
                onChange={setSelectedLocation}
                changeOnSelect
                placeholder="Country / State / City / Area"
                style={{ width: "100%" }}
              />
            </Col> */}
          </Row>
          <Space>
            <Button
              icon={<FilterOutlined />}
              onClick={() => setFiltersDrawerVisible(true)}
            >
              More Filters{" "}
              {activeFiltersCount > 0 ? `(${activeFiltersCount})` : ""}
            </Button>
            {activeFiltersCount > 0 && (
              <Button icon={<ReloadOutlined />} onClick={resetFilters}>
                Reset
              </Button>
            )}
          </Space>
        </Card>

        {renderListings()}

        <Drawer
          title="Filter Listings"
          visible={filtersDrawerVisible}
          onClose={() => setFiltersDrawerVisible(false)}
          width={300}
          footer={
            <Space style={{ float: "right" }}>
              <Button onClick={resetFilters}>Reset</Button>
              <Button type="primary" onClick={applyFilters}>
                Apply
              </Button>
            </Space>
          }
        >
          <Divider>Price</Divider>
          <Slider
            range
            min={0}
            max={1000}
            value={priceRange}
            onChange={setPriceRange}
          />
          <Divider>Rating</Divider>
          <Rate allowHalf value={ratingFilter} onChange={setRatingFilter} />
          <Divider>Amenities</Divider>
          <Checkbox.Group
            options={["WiFi", "Pool", "Gym", "Parking"]}
            value={amenities}
            onChange={setAmenities}
          />
          <Divider>Sort By</Divider>
          <Radio.Group
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
          >
            <Radio value="createdAt_desc">Newest First</Radio>
            <Radio value="price_asc">Price: Low to High</Radio>
            <Radio value="price_desc">Price: High to Low</Radio>
          </Radio.Group>
        </Drawer>

        {error && <Alert message={error} type="error" showIcon />}
      </div>
    </div>
  );
};

export default ListingsPage;
