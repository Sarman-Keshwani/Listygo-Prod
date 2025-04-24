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
const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000/api";

const ListingsPage = () => {
  const [listings, setListings] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();

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

        const query = new URLSearchParams(params).toString();
        const resp = await axios.get(`${API_URL}/listings?${query}`);
        let data = resp.data.data || [];
        if (loc) {
          const codes = loc.split(",");
          const target = codes[codes.length - 1].toLowerCase();
          data = data.filter((item) =>
            item.location?.toLowerCase().includes(target)
          );
        }
        setListings(data);
      } catch {
        setError("Failed to load listings.");
      } finally {
        setLoading(false);
      }
    };
    fetchCategories();
    fetchListings();
  }, [searchParams]);

  const applyFilters = () => {
    const params = new URLSearchParams();
    if (selectedCategory) params.set("category", selectedCategory);
    if (searchQuery) params.set("search", searchQuery);
    if (priceRange[0] > 0) params.set("minPrice", priceRange[0]);
    if (priceRange[1] < 1000) params.set("maxPrice", priceRange[1]);
    if (ratingFilter > 0) params.set("rating", ratingFilter);
    if (sortBy) params.set("sort", sortBy);
    if (selectedLocation.length)
      params.set("location", selectedLocation.join(","));
    if (amenities.length) params.set("amenities", amenities.join(","));
    setSearchParams(params);
    setFiltersDrawerVisible(false);
  };

  const resetFilters = () => {
    setSearchQuery("");
    setSelectedCategory("");
    setPriceRange([0, 1000]);
    setRatingFilter(0);
    setSortBy("createdAt_desc");
    setAmenities([]);
    setSelectedLocation([]);
    setSearchParams({});
  };

  const activeFiltersCount = useMemo(() => {
    let c = 0;
    if (selectedCategory) c++;
    if (searchQuery) c++;
    if (priceRange[0] > 0 || priceRange[1] < 1000) c++;
    if (ratingFilter > 0) c++;
    if (selectedLocation.length) c++;
    if (amenities.length) c++;
    return c;
  }, [
    selectedCategory,
    searchQuery,
    priceRange,
    ratingFilter,
    selectedLocation,
    amenities,
  ]);

  const handleListingClick = (id) => navigate(`/listings/${id}`);

  const renderGridItem = (listing) => (
    <motion.div whileHover={{ y: -5 }} key={listing._id} className="mb-5">
      <Badge.Ribbon text={`$${listing.price}`} color="blue">
        <Card
          hoverable
          onClick={() => handleListingClick(listing._id)}
          cover={
            <img
              src={listing.images?.[0]}
              alt=""
              className="h-48 w-full object-cover"
            />
          }
        >
          <Tag>{listing.category.name}</Tag>
          <Title level={5}>{listing.name}</Title>
          <Space>
            <EnvironmentOutlined />
            {listing.location}
          </Space>
        </Card>
      </Badge.Ribbon>
    </motion.div>
  );

  const renderListItem = (listing) => (
    <Card
      hoverable
      key={listing._id}
      className="mb-4"
      onClick={() => handleListingClick(listing._id)}
    >
      <Row gutter={16}>
        <Col xs={24} sm={8}>
          <img
            src={listing.images?.[0]}
            alt=""
            className="h-40 w-full object-cover rounded"
          />
        </Col>
        <Col xs={24} sm={16}>
          <Title level={4}>{listing.name}</Title>
          <Space>
            <EnvironmentOutlined />
            {listing.location}
          </Space>
          <Paragraph className="line-clamp-2">{listing.description}</Paragraph>
        </Col>
      </Row>
    </Card>
  );

  return (
    <div className="bg-[#f0f7ff] p-6 min-h-screen">
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

      {loading ? (
        <Spin tip="Loading..." />
      ) : listings.length === 0 ? (
        <Empty description="No results" />
      ) : (
        <div
          className={
            viewMode === "grid"
              ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
              : "space-y-4"
          }
        >
          {listings.map((l) =>
            viewMode === "grid" ? renderGridItem(l) : renderListItem(l)
          )}
        </div>
      )}

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
        <Radio.Group value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
          <Radio value="createdAt_desc">Newest First</Radio>
          <Radio value="price_asc">Price: Low to High</Radio>
          <Radio value="price_desc">Price: High to Low</Radio>
        </Radio.Group>
      </Drawer>

      {error && <Alert message={error} type="error" showIcon />}
    </div>
  );
  try {
    return (
      <div className="bg-[#f0f7ff] min-h-screen py-8 px-4">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <Row gutter={[16, 16]} align="middle" className="mb-8">
            <Col xs={24} md={16}>
              <Title level={2} className="mb-2">
                Find the perfect <span className="text-blue-600">listing</span>{" "}
                for you
              </Title>
              <Paragraph className="text-gray-600">
                Explore our diverse collection of listings across multiple
                categories
              </Paragraph>
            </Col>
          </Row>

          {/* Main Search and Category Filter */}
          <Card className="mb-6 shadow-sm">
            <Row gutter={[16, 16]} align="middle">
              <Col xs={24} md={8}>
                <Input
                  placeholder="Search listings..."
                  prefix={<SearchOutlined className="text-gray-400" />}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  size="large"
                  className="rounded-md"
                  onPressEnter={applyFilters}
                />
              </Col>
              <Col xs={24} md={8}>
                <Select
                  placeholder="Select Category"
                  value={selectedCategory || undefined}
                  onChange={handleCategoryChange}
                  className="w-full"
                  size="large"
                  allowClear
                >
                  {categories.map((category) => (
                    <Option key={category._id} value={category._id}>
                      {category.name}
                    </Option>
                  ))}
                </Select>
              </Col>
              <Col xs={24} md={8}>
                <Cascader
                  placeholder="Select Location"
                  options={locations}
                  value={selectedLocation || []}
                  onChange={(value) => {
                    console.log("Selected location:", value);
                    setSelectedLocation(Array.isArray(value) ? value : []);
                  }}
                  size="large"
                  className="w-full"
                  expandTrigger="hover"
                  maxTagCount={2}
                  showSearch={{
                    filter: (inputValue, path) => {
                      return path.some(
                        (option) =>
                          option.label
                            .toLowerCase()
                            .indexOf(inputValue.toLowerCase()) > -1
                      );
                    },
                  }}
                  displayRender={(labels) => labels.join(" > ")}
                  changeOnSelect
                />
              </Col>
            </Row>

            <Divider className="my-4" />

            <Row gutter={[16, 16]} align="middle">
              <Col xs={24} md={16}>
                <Space wrap>
                  <Select
                    value={sortBy}
                    onChange={setSortBy}
                    className="w-40"
                    size="middle"
                  >
                    <Option value="createdAt_desc">Newest First</Option>
                    <Option value="price_asc">Price: Low to High</Option>
                    <Option value="price_desc">Price: High to Low</Option>
                    <Option value="rating_desc">Highest Rated</Option>
                    <Option value="name_asc">Name A-Z</Option>
                  </Select>

                  <Button
                    icon={<FilterOutlined />}
                    onClick={() => setFiltersDrawerVisible(true)}
                    size="middle"
                  >
                    More Filters{" "}
                    {activeFiltersCount > 0 && `(${activeFiltersCount})`}
                  </Button>

                  {activeFiltersCount > 0 && (
                    <Button
                      icon={<ReloadOutlined />}
                      onClick={resetFilters}
                      size="middle"
                    >
                      Reset
                    </Button>
                  )}
                </Space>
              </Col>
              <Col xs={24} md={8} className="flex justify-end">
                <Space>
                  <Text className="mr-2">View:</Text>
                  <Radio.Group
                    value={viewMode}
                    onChange={(e) => setViewMode(e.target.value)}
                    buttonStyle="solid"
                  >
                    <Radio.Button value="grid">
                      <AppstoreOutlined />
                    </Radio.Button>
                    <Radio.Button value="list">
                      <BarsOutlined />
                    </Radio.Button>
                  </Radio.Group>
                </Space>
              </Col>
            </Row>
          </Card>

          {/* Location display if selected */}

          {Array.isArray(selectedLocation) && selectedLocation.length > 0 && (
            <div className="mb-4 mt-3 ms-2">
              <Tag
                icon={<EnvironmentOutlined />}
                color="blue"
                className="text-md px-3 py-1"
              >
                Location: {getLocationDisplayString(selectedLocation)}
              </Tag>
              <Button
                type="text"
                size="small"
                className="ml-2 text-blue-500 hover:text-blue-700"
                onClick={() => {
                  setSelectedLocation([]);
                  const newParams = new URLSearchParams(searchParams);
                  newParams.delete("location");
                  setSearchParams(newParams);
                }}
              >
                Clear location
              </Button>
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="mb-6 mt-5">
              <Alert
                message="Error"
                description={error}
                type="error"
                showIcon
                closable
              />
            </div>
          )}

          {/* Results summary - FIXED VERSION */}
          <div className="mb-4">
            <Text className="text-gray-500">
              {loading ? "Searching..." : `Found ${listings.length} listings`}
              {listings.length > 0 &&
                selectedCategory &&
                categories.find((c) => c._id === selectedCategory) &&
                ` in ${
                  categories.find((c) => c._id === selectedCategory).name
                }`}
              {listings.length > 0 &&
                searchQuery &&
                ` matching "${searchQuery}"`}
              {listings.length > 0 &&
                selectedLocation &&
                selectedLocation.length > 0 &&
                ` in ${getLocationDisplayString(selectedLocation)}`}
              {listings.length === 0 &&
                selectedLocation &&
                selectedLocation.length > 0 &&
                ` - No listings found in "${getLocationDisplayString(
                  selectedLocation
                )}"`}
            </Text>

            {/* Debug section - help identify what's happening */}
            <div className="text-xs text-gray-400 mt-1">
              Available locations: {listings.map((l) => l.location).join(" | ")}
            </div>
          </div>

          {/* Listings Grid/List */}
          {loading ? (
            <div className="flex justify-center items-center py-20">
              <Spin size="large" tip="Loading listings..." />
            </div>
          ) : listings.length === 0 ? (
            <div className="text-center py-16">
              <Empty
                description={
                  <span className="text-gray-500">
                    No listings found matching your criteria
                  </span>
                }
              >
                <Button
                  type="primary"
                  onClick={resetFilters}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  Clear filters
                </Button>
              </Empty>
            </div>
          ) : (
            <div
              className={
                viewMode === "grid"
                  ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
                  : "space-y-4"
              }
            >
              {listings.map((listing) => (
                <React.Fragment key={listing._id}>
                  {viewMode === "grid"
                    ? renderGridItem(listing)
                    : renderListItem(listing)}
                </React.Fragment>
              ))}
            </div>
          )}
        </div>

        {/* Filters Drawer */}
        <Drawer
          title="Filter Listings"
          placement="right"
          onClose={() => setFiltersDrawerVisible(false)}
          visible={filtersDrawerVisible}
          width={320}
          footer={
            <div className="flex justify-between">
              <Button onClick={resetFilters}>Reset</Button>
              <Button
                type="primary"
                onClick={applyFilters}
                className="bg-blue-600"
              >
                Apply Filters
              </Button>
            </div>
          }
        >
          <div className="space-y-6">
            <div>
              <Title level={5}>Price Range</Title>
              <Slider
                range
                min={0}
                max={1000}
                value={priceRange}
                onChange={setPriceRange}
                tipFormatter={(value) => `$${value}`}
              />
              <div className="flex justify-between text-gray-500 text-sm mt-1">
                <span>${priceRange[0]}</span>
                <span>${priceRange[1]}</span>
              </div>
            </div>

            <div>
              <Title level={5}>Rating</Title>
              <Rate allowHalf value={ratingFilter} onChange={setRatingFilter} />
              <div className="text-gray-500 text-sm mt-1">
                {ratingFilter > 0
                  ? `${ratingFilter} stars & above`
                  : "Any rating"}
              </div>
            </div>

            <div>
              <Title level={5}>Location</Title>
              <Cascader
                placeholder="Select Location"
                options={locations}
                value={selectedLocation || []}
                onChange={(value) => {
                  console.log("Selected location:", value);
                  setSelectedLocation(Array.isArray(value) ? value : []);
                }}
                className="w-full"
                expandTrigger="hover"
                showSearch={{
                  filter: (inputValue, path) => {
                    return path.some(
                      (option) =>
                        option.label
                          .toLowerCase()
                          .indexOf(inputValue.toLowerCase()) > -1
                    );
                  },
                }}
                displayRender={(labels) => labels.join(" > ")}
                changeOnSelect
              />
            </div>

            <div>
              <Title level={5}>Amenities</Title>
              <Checkbox.Group
                options={commonAmenities}
                value={amenities}
                onChange={setAmenities}
                className="flex flex-col space-y-2"
              />
            </div>

            <div>
              <Title level={5}>Sort By</Title>
              <Radio.Group
                onChange={(e) => setSortBy(e.target.value)}
                value={sortBy}
                className="flex flex-col space-y-2"
              >
                <Radio value="createdAt_desc">Newest First</Radio>
                <Radio value="price_asc">Price: Low to High</Radio>
                <Radio value="price_desc">Price: High to Low</Radio>
                <Radio value="rating_desc">Highest Rated</Radio>
                <Radio value="name_asc">Name A-Z</Radio>
              </Radio.Group>
            </div>
          </div>
        </Drawer>
      </div>
    );
  } catch (err) {
    console.error("Error rendering ListingsPage:", err);
    return (
      <div className="bg-[#f0f7ff] min-h-screen py-8 px-4 flex justify-center items-center">
        <Alert
          message="Something went wrong"
          description="There was an error loading the listings page. Please try refreshing the page."
          type="error"
          showIcon
          action={
            <Button onClick={() => window.location.reload()}>
              Refresh Page
            </Button>
          }
        />
      </div>
    );
  }
};

export default ListingsPage;
