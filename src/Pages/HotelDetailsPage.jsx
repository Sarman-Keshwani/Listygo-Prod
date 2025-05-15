import React, { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import {
  Row,
  Col,
  Card,
  Button,
  Spin,
  Typography,
  Tag,
  Form,
  Input,
  Carousel,
  Rate,
  Image,
  Divider,
  Empty,
  Result,
  Badge,
  Space,
  Breadcrumb,
  Avatar,
  message,
  Tabs,
} from "antd";
import {
  ArrowLeftOutlined,
  EnvironmentOutlined,
  TagOutlined,
  HomeOutlined,
  TeamOutlined,
  InfoCircleOutlined,
  FullscreenOutlined,
  CheckCircleOutlined,
  PhoneOutlined,
  MailOutlined,
  GlobalOutlined,
} from "@ant-design/icons";
import {
  MdBed,
  MdBathtub,
  MdWifi,
  MdAcUnit,
  MdTv,
  MdKitchen,
  MdPool,
  MdFitnessCenter,
} from "react-icons/md";
import { FiMaximize2, FiClock, FiUser } from "react-icons/fi";

const { Title, Text, Paragraph } = Typography;
const { TabPane } = Tabs;
const API_URL = import.meta.env.VITE_API_URL || "https://api.pathsuchi.com/api";

const HotelDetailsPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [listing, setListing] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [imagePreviewVisible, setImagePreviewVisible] = useState(false);
  const [activeImage, setActiveImage] = useState(0);
  const [form] = Form.useForm();
  const carouselRef = useRef(null);
  const [relatedListings, setRelatedListings] = useState([]);
  const [mapLoading, setMapLoading] = useState(true);
  const [mapError, setMapError] = useState(false);
  const [coordinates, setCoordinates] = useState(null);

  useEffect(() => {
    const fetchListing = async () => {
      try {
        setLoading(true);
        const response = await axios.get(`${API_URL}/listings/${id}`);

        if (response.data.success) {
          setListing(response.data.data);
          // After getting listing, fetch related listings from same category
          if (response.data.data.category && response.data.data.category._id) {
            fetchRelatedListings(response.data.data.category._id);
          }

          // Get coordinates for the location if available
          if (response.data.data.location) {
            fetchCoordinates(response.data.data.location);
          }
        } else {
          setError("Failed to fetch listing details");
        }
      } catch (err) {
        console.error("Error fetching listing details:", err);
        setError(
          "An error occurred while fetching listing details. Please try again later."
        );
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchListing();
    }
  }, [id]);

  const fetchCoordinates = async (locationString) => {
    try {
      setMapLoading(true);
      // Using OpenStreetMap Nominatim API for geocoding (free and doesn't require API key)
      const encodedLocation = encodeURIComponent(locationString);
      const response = await axios.get(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodedLocation}`
      );

      if (response.data && response.data.length > 0) {
        const { lat, lon } = response.data[0];
        setCoordinates({ lat, lng: lon });
      } else {
        setMapError(true);
      }
    } catch (error) {
      console.error("Error fetching coordinates:", error);
      setMapError(true);
    } finally {
      setMapLoading(false);
    }
  };

  const fetchRelatedListings = async (categoryId) => {
    try {
      const response = await axios.get(
        `${API_URL}/listings?category=${categoryId}&limit=3&exclude=${id}`
      );
      if (response.data.success) {
        setRelatedListings(response.data.data || []);
      }
    } catch (error) {
      console.error("Error fetching related listings:", error);
    }
  };

  // Handle contact form submission
  const handleContact = async (values) => {
    try {
      // This is just a placeholder - implement actual contact logic
      message.success("Your inquiry has been sent successfully!");
      form.resetFields();
    } catch (error) {
      message.error("Failed to process request");
      console.error("Contact error:", error);
    }
  };

  // Prepare images
  const getImages = () => {
    if (!listing) return [];
    return Array.isArray(listing.images) && listing.images.length > 0
      ? listing.images
      : listing.image
      ? [listing.image]
      : [];
  };

  const images = getImages();

  const handleThumbnailClick = (index) => {
    setActiveImage(index);
    if (carouselRef.current) {
      carouselRef.current.goTo(index);
    }
  };

  const getAmenityIcon = (amenity) => {
    if (!amenity) return <CheckCircleOutlined />;

    // Clean amenity name first
    const sanitizedAmenity =
      typeof amenity === "string"
        ? amenity
            .trim()
            .replace(/^\/+|\/+$/g, "")
            .toLowerCase()
        : "";

    const iconSize = 20;

    // Map common amenities to icons
    const amenityIcons = {
      wifi: <MdWifi size={iconSize} />,
      "free wifi": <MdWifi size={iconSize} />,
      "air conditioning": <MdAcUnit size={iconSize} />,
      ac: <MdAcUnit size={iconSize} />,
      tv: <MdTv size={iconSize} />,
      television: <MdTv size={iconSize} />,
      kitchen: <MdKitchen size={iconSize} />,
      pool: <MdPool size={iconSize} />,
      "swimming pool": <MdPool size={iconSize} />,
      gym: <MdFitnessCenter size={iconSize} />,
      "fitness center": <MdFitnessCenter size={iconSize} />,
      parking: <EnvironmentOutlined style={{ fontSize: iconSize }} />,
      restaurant: <InfoCircleOutlined style={{ fontSize: iconSize }} />,
      "pet friendly": <InfoCircleOutlined style={{ fontSize: iconSize }} />,
    };

    return (
      amenityIcons[sanitizedAmenity] || (
        <CheckCircleOutlined style={{ fontSize: iconSize - 2 }} />
      )
    );
  };

  // Format business hours display
  const formatBusinessHours = () => {
    if (!listing || !listing.hours) return null;

    const days = [
      "monday",
      "tuesday",
      "wednesday",
      "thursday",
      "friday",
      "saturday",
      "sunday",
    ];
    const formattedHours = [];

    // Check if we have any hours data
    const hasHoursData = Object.values(listing.hours).some(
      (dayHours) => dayHours && dayHours.open && dayHours.close
    );

    if (!hasHoursData) return null;

    // Format each day's hours
    for (const day of days) {
      if (
        listing.hours[day] &&
        listing.hours[day].open &&
        listing.hours[day].close
      ) {
        // Format time to be more readable
        const formatTime = (timeStr) => {
          // If it's already in a readable format, return as is
          if (timeStr.includes(":")) {
            const [hours, minutes] = timeStr.split(":");
            const h = parseInt(hours);
            return `${h % 12 === 0 ? 12 : h % 12}:${minutes} ${
              h >= 12 ? "PM" : "AM"
            }`;
          }
          return timeStr;
        };

        formattedHours.push({
          day: day.charAt(0).toUpperCase() + day.slice(1),
          hours: `${formatTime(listing.hours[day].open)} - ${formatTime(
            listing.hours[day].close
          )}`,
        });
      }
    }

    return formattedHours.length > 0 ? formattedHours : null;
  };

  const businessHours = formatBusinessHours();

  const MapComponent = ({ coordinates, name, location }) => {
    const [mapHeight] = useState(300); // Fixed height for the map

    // Create a simpler and more reliable OpenStreetMap implementation
    if (mapLoading) {
      return (
        <div className="h-[300px] bg-gray-100 flex items-center justify-center">
          <Spin tip="Loading map..." />
        </div>
      );
    }

    if (mapError || !coordinates) {
      return (
        <div className="h-[300px] bg-gray-100 flex flex-col items-center justify-center">
          <Text type="secondary">Unable to load map for this location</Text>
          {location && (
            <a
              href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                location
              )}`}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-2 text-blue-600 hover:underline"
            >
              View on Google Maps
            </a>
          )}
        </div>
      );
    }

    // Use OpenStreetMap with proper zoom level and marker
    const openStreetMapUrl = `https://www.openstreetmap.org/export/embed.html?bbox=${
      parseFloat(coordinates.lng) - 0.01
    },${parseFloat(coordinates.lat) - 0.01},${
      parseFloat(coordinates.lng) + 0.01
    },${parseFloat(coordinates.lat) + 0.01}&layer=mapnik&marker=${
      coordinates.lat
    },${coordinates.lng}`;

    return (
      <div className="h-[300px] border rounded overflow-hidden">
        <iframe
          title="Location Map"
          width="100%"
          height="100%"
          frameBorder="0"
          scrolling="no"
          marginHeight="0"
          marginWidth="0"
          src={openStreetMapUrl}
        ></iframe>
        <div className="py-1 text-center">
          <a
            href={`https://www.openstreetmap.org/?mlat=${coordinates.lat}&mlon=${coordinates.lng}#map=15/${coordinates.lat}/${coordinates.lng}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-blue-600 hover:underline"
          >
            View larger map
          </a>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen pt-20">
        <Spin size="large" tip="Loading listing details..." />
      </div>
    );
  }

  if (error || !listing) {
    return (
      <Result
        status="error"
        title="Something went wrong"
        subTitle={
          error ||
          "We couldn't find this listing. It might have been removed or there was a connection error."
        }
        extra={
          <Button
            type="primary"
            onClick={() => navigate("/listings")}
            className="bg-blue-600 hover:bg-blue-700"
          >
            Back to Listings
          </Button>
        }
      />
    );
  }

  return (
    <div className="bg-[#f0f7ff] pb-20 min-h-screen pt-10 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Breadcrumb and Header */}
        <Row gutter={[16, 16]} className="mb-4">
          <Col span={24}>
            <Breadcrumb className="">
              <Breadcrumb.Item>
                <a onClick={() => navigate("/")}>
                  <HomeOutlined /> Home
                </a>
              </Breadcrumb.Item>
              <Breadcrumb.Item>
                <a onClick={() => navigate("/listings")}>Listings</a>
              </Breadcrumb.Item>
              {listing.category && (
                <Breadcrumb.Item>
                  <a
                    onClick={() =>
                      navigate(`/listings?category=${listing.category._id}`)
                    }
                  >
                    {listing.category.name}
                  </a>
                </Breadcrumb.Item>
              )}
              <Breadcrumb.Item>{listing.name}</Breadcrumb.Item>
            </Breadcrumb>

            <Button
              type="link"
              icon={<ArrowLeftOutlined />}
              onClick={() => navigate(-1)}
              className="mb-4 px-0 flex items-center"
            >
              Back to listings
            </Button>

            <div className="flex justify-between items-center flex-wrap">
              <div>
                <Title level={2} className="mb-2">
                  {listing.name}
                </Title>
                <Space className="mb-4 flex-wrap">
                  {listing.location && (
                    <Tag icon={<EnvironmentOutlined />} color="blue">
                      {listing.location}
                    </Tag>
                  )}
                  {listing.category && (
                    <Tag color="purple">{listing.category.name}</Tag>
                  )}
                  <Rate
                    disabled
                    defaultValue={listing.rating || 4.5}
                    allowHalf
                    className="text-sm"
                  />
                  <Text type="secondary">{listing.rating || 4.5} Rating</Text>
                </Space>
              </div>

              {listing.price && (
                <Badge.Ribbon text={`₹${listing.price}`} color="blue">
                  <Card className="mb-4 md:mb-0 bg-white shadow-sm">
                    <div className="text-center">
                      <Title level={4} className="mb-0">
                        ₹{listing.price}
                      </Title>
                      <Text type="secondary">
                        {listing.category?.name === "Restaurants"
                          ? "avg price"
                          : ""}
                      </Text>
                    </div>
                  </Card>
                </Badge.Ribbon>
              )}
            </div>
          </Col>
        </Row>

        {/* Image Gallery and Details Section */}
        <Row gutter={[24, 24]}>
          <Col xs={24} xl={16}>
            <Card
              bordered={false}
              className="shadow-md rounded-lg overflow-hidden"
            >
              <div className="relative">
                <Carousel
                  effect="fade"
                  autoplay
                  dots={true}
                  afterChange={(current) => setActiveImage(current)}
                  className="listing-carousel"
                  ref={carouselRef}
                >
                  {images.length > 0 ? (
                    images.map((image, index) => (
                      <div
                        key={index}
                        className="h-[400px] rounded-lg overflow-hidden"
                      >
                        <img
                          src={image}
                          alt={`${listing.name} - View ${index + 1}`}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            e.target.onerror = null;
                            e.target.src =
                              "https://via.placeholder.com/800x400?text=No+Image+Available";
                          }}
                        />
                      </div>
                    ))
                  ) : (
                    <div className="h-[400px] bg-gray-100 flex items-center justify-center">
                      <Empty description="No images available" />
                    </div>
                  )}
                </Carousel>

                {images.length > 0 && (
                  <Button
                    icon={<FullscreenOutlined />}
                    className="absolute right-4 top-4 bg-white/70 backdrop-blur-sm hover:bg-white"
                    shape="circle"
                    size="large"
                    onClick={() => setImagePreviewVisible(true)}
                  />
                )}
              </div>

              {/* Thumbnail Row */}
              {images.length > 1 && (
                <Row gutter={8} className="mt-4">
                  {images.slice(0, 5).map((img, index) => (
                    <Col span={4} key={index}>
                      <div
                        className={`cursor-pointer rounded-md overflow-hidden h-16 border-2 ${
                          activeImage === index
                            ? "border-blue-500"
                            : "border-transparent"
                        }`}
                        onClick={() => handleThumbnailClick(index)}
                      >
                        <img
                          src={img}
                          alt={`Thumbnail ${index + 1}`}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            e.target.onerror = null;
                            e.target.src =
                              "https://via.placeholder.com/100?text=Error";
                          }}
                        />
                      </div>
                    </Col>
                  ))}
                  {images.length > 5 && (
                    <Col span={4}>
                      <div
                        className="cursor-pointer rounded-md overflow-hidden h-16 bg-black/70 flex items-center justify-center"
                        onClick={() => setImagePreviewVisible(true)}
                      >
                        <Text className="text-white">
                          +{images.length - 5} more
                        </Text>
                      </div>
                    </Col>
                  )}
                </Row>
              )}
            </Card>

            {/* Listing Details Tabs */}
            <Card
              bordered={false}
              className="mt-6 shadow-md rounded-lg"
              title={<Title level={4}>Listing Details</Title>}
            >
              <Tabs defaultActiveKey="details">
                <TabPane tab="Details" key="details">
                  {/* Attributes Section - Now handles string format */}
                  {listing.attributes && (
                    <>
                      <Divider orientation="left">
                        <Space>
                          <InfoCircleOutlined />
                          <span>Features & Attributes</span>
                        </Space>
                      </Divider>

                      <Row gutter={[16, 16]} className="mb-6">
                        {(() => {
                          // Handle case where attributes might be a character-by-character object
                          let attributeString = "";

                          if (
                            typeof listing.attributes === "object" &&
                            !Array.isArray(listing.attributes)
                          ) {
                            // Check if it's a numbered-key object (character by character)
                            const keys = Object.keys(listing.attributes);
                            const isCharByChar = keys.every(
                              (k) => !isNaN(parseInt(k))
                            );

                            if (isCharByChar) {
                              // Reconstruct the string from individual characters
                              attributeString = keys
                                .sort((a, b) => parseInt(a) - parseInt(b))
                                .map((k) => listing.attributes[k])
                                .join("");
                            } else {
                              // It's a normal object, convert to comma-separated string
                              attributeString = Object.keys(
                                listing.attributes
                              ).join(", ");
                            }
                          } else {
                            // It's already a string
                            attributeString = String(listing.attributes || "");
                          }

                          // Map of attribute keywords to icons
                          const iconMap = {
                            bedrooms: (
                              <MdBed size={28} className="text-blue-600" />
                            ),
                            bathrooms: (
                              <MdBathtub size={28} className="text-blue-600" />
                            ),
                            maxGuests: (
                              <TeamOutlined
                                style={{ fontSize: "24px" }}
                                className="text-blue-600"
                              />
                            ),
                            wifi: (
                              <MdWifi size={28} className="text-blue-600" />
                            ),
                            pool: (
                              <MdPool size={28} className="text-blue-600" />
                            ),
                            kitchen: (
                              <MdKitchen size={28} className="text-blue-600" />
                            ),
                            gym: (
                              <MdFitnessCenter
                                size={28}
                                className="text-blue-600"
                              />
                            ),
                            parking: (
                              <EnvironmentOutlined
                                style={{ fontSize: "24px" }}
                                className="text-blue-600"
                              />
                            ),
                            restaurant: (
                              <InfoCircleOutlined
                                style={{ fontSize: "24px" }}
                                className="text-blue-600"
                              />
                            ),
                            // Add more mappings as needed
                          };

                          // Now split the string and render attributes
                          return attributeString
                            .split(",")
                            .map((attribute, index) => {
                              const cleanAttr = attribute.trim().toLowerCase();
                              if (!cleanAttr) return null;

                              // Find matching icon or use default
                              const icon = Object.keys(iconMap).find((key) =>
                                cleanAttr.includes(key.toLowerCase())
                              );

                              return (
                                <Col xs={12} sm={6} key={index}>
                                  <Card className="text-center h-full bg-blue-50 border-0">
                                    <div className="flex flex-col items-center">
                                      <Avatar
                                        size={48}
                                        className="bg-blue-100 flex items-center justify-center mb-2"
                                      >
                                        {icon ? (
                                          iconMap[icon]
                                        ) : (
                                          <InfoCircleOutlined
                                            style={{ fontSize: "24px" }}
                                            className="text-blue-600"
                                          />
                                        )}
                                      </Avatar>
                                      <Text strong>
                                        {cleanAttr
                                          .replace(/([A-Z])/g, " $1")
                                          .replace(/^./, (str) =>
                                            str.toUpperCase()
                                          )}
                                      </Text>
                                    </div>
                                  </Card>
                                </Col>
                              );
                            });
                        })()}
                      </Row>
                    </>
                  )}

                  <Divider orientation="left">
                    <Space>
                      <InfoCircleOutlined />
                      <span>Description</span>
                    </Space>
                  </Divider>

                  <Paragraph className="text-gray-600">
                    {listing.description || "No description available."}
                  </Paragraph>

                  {/* Business Hours Section */}
                  {businessHours && businessHours.length > 0 && (
                    <>
                      <Divider orientation="left">
                        <Space>
                          <FiClock className="text-blue-600" />
                          <span>Business Hours</span>
                        </Space>
                      </Divider>

                      <div className="mb-6 bg-blue-50 p-4 rounded-lg">
                        <Row gutter={[16, 16]}>
                          {businessHours.map((item, index) => (
                            <Col xs={24} sm={12} md={8} key={index}>
                              <Card
                                size="small"
                                className="border-0 bg-transparent shadow-none h-full"
                              >
                                <div className="flex justify-between items-center">
                                  <Text strong className="text-gray-700">
                                    {item.day}:
                                  </Text>
                                  <Text
                                    className={
                                      item.hours === "Closed"
                                        ? "text-red-500"
                                        : "text-green-600"
                                    }
                                  >
                                    {item.hours}
                                  </Text>
                                </div>
                              </Card>
                            </Col>
                          ))}
                        </Row>
                      </div>
                    </>
                  )}

                  {/* Amenities Section */}
                  <Divider orientation="left">
                    <Space>
                      <CheckCircleOutlined />
                      <span>Amenities & Features</span>
                    </Space>
                  </Divider>

                  <Row gutter={[16, 16]} className="pb-4">
                    {listing.amenities && listing.amenities.length > 0 ? (
                      listing.amenities.map((amenity, index) => {
                        // Clean the amenity text
                        const cleanAmenity =
                          typeof amenity === "string"
                            ? amenity.trim().replace(/^\/+|\/+$/g, "")
                            : "";

                        if (!cleanAmenity) return null;

                        return (
                          <Col key={index} xs={12} md={8} lg={6}>
                            <div className="bg-blue-50 hover:bg-blue-100 transition-colors rounded-lg p-3 h-full flex items-center">
                              <div className="bg-white rounded-full p-2 shadow-sm text-blue-600 mr-3">
                                {getAmenityIcon(cleanAmenity)}
                              </div>
                              <Text className="text-gray-700 font-medium">
                                {cleanAmenity}
                              </Text>
                            </div>
                          </Col>
                        );
                      })
                    ) : (
                      <Col span={24}>
                        <Empty description="No amenities listed" />
                      </Col>
                    )}
                  </Row>

                  {/* Tags Section */}
                  {listing.tags && listing.tags.length > 0 && (
                    <>
                      <Divider orientation="left">
                        <Space>
                          <TagOutlined />
                          <span>Tags</span>
                        </Space>
                      </Divider>
                      <div className="mb-6 flex flex-wrap gap-2">
                        {listing.tags.map((tag) => {
                          // Clean the tag text to remove unwanted characters
                          const cleanTag =
                            typeof tag === "string"
                              ? tag.trim().replace(/^\/+|\/+$|\[\]]/g, "")
                              : "";

                          if (!cleanTag) return null;

                          return (
                            <Tag
                              key={cleanTag}
                              color="blue"
                              className="mr-0 mb-0 py-1.5 px-3 text-sm rounded-full"
                            >
                              {cleanTag}
                            </Tag>
                          );
                        })}
                      </div>
                    </>
                  )}
                </TabPane>

                {/* Hours Tab */}
                {businessHours && businessHours.length > 0 && (
                  <TabPane tab="Hours" key="hours" className="pb-4">
                    <div className="bg-white rounded-lg overflow-hidden">
                      <div className="p-4 border-b bg-blue-50">
                        <Title level={5} className="mb-0 flex items-center">
                          <FiClock className="mr-2 text-blue-600" /> Business
                          Hours
                        </Title>
                      </div>
                      <div className="p-4">
                        <div className="space-y-3">
                          {businessHours.map((item, index) => (
                            <div
                              key={index}
                              className={`flex justify-between pb-2 ${
                                index < businessHours.length - 1
                                  ? "border-b border-gray-100"
                                  : ""
                              }`}
                            >
                              <Text strong className="capitalize">
                                {item.day}
                              </Text>
                              <Text className="font-medium text-blue-600">
                                {item.hours}
                              </Text>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </TabPane>
                )}
              </Tabs>
            </Card>
          </Col>

          {/* Sidebar */}
          <Col xs={24} xl={8}>
            <div className="sticky space-y-4 top-24">
              {/* Listing Info Card */}
              <Card
                bordered={false}
                className="shadow-md rounded-lg"
                title={
                  <Title level={4} className="my-0">
                    Listing Details
                  </Title>
                }
              >
                <div className="p-1">
                  <div className="flex justify-between items-center mb-3">
                    <Text className="text-gray-600">Category:</Text>
                    <Text strong>
                      {listing.category?.name || "Uncategorized"}
                    </Text>
                  </div>

                  <div className="flex justify-between items-center mb-3">
                    <Text className="text-gray-600">Price:</Text>
                    <Text strong className="text-lg text-blue-600">
                      ₹{listing.price || "Contact for pricing"}
                    </Text>
                  </div>

                  <div className="flex justify-between items-center mb-3">
                    <Text className="text-gray-600">Rating:</Text>
                    <Space>
                      <Rate
                        disabled
                        defaultValue={listing.rating || 4.5}
                        allowHalf
                        className="text-sm"
                      />
                      <Text type="secondary">{listing.rating || 4.5}</Text>
                    </Space>
                  </div>

                  {listing.location && (
                    <div className="mb-3">
                      <div className="flex justify-between items-center mb-2">
                        <Text className="text-gray-600">Location:</Text>
                        <Text strong>{listing.location}</Text>
                      </div>
                      <div className="flex flex-wrap gap-2 mt-1">
                        {listing.locationLink && (
                          <a
                            href={
                              listing.locationLink.startsWith("http")
                                ? listing.locationLink
                                : `https://${listing.locationLink}`
                            }
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:underline flex items-center text-sm"
                          >
                            <EnvironmentOutlined className="mr-1" /> Location
                            Map
                          </a>
                        )}
                        {!listing.locationLink && (
                          <a
                            href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                              listing.location
                            )}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:underline flex items-center text-sm"
                          >
                            <EnvironmentOutlined className="mr-1" /> Google Maps
                          </a>
                        )}
                      </div>
                    </div>
                  )}

                  {listing.isFeatured && (
                    <div className="mb-3">
                      <Tag color="gold" className="w-full text-center py-1">
                        Featured Listing
                      </Tag>
                    </div>
                  )}

                  <Divider className="my-4" />

                  <div className="mb-4">
                    <Text strong className="block mb-2">
                      Quick Actions
                    </Text>
                    <Button
                      type="primary"
                      block
                      className="bg-blue-600 hover:bg-blue-700 mb-2"
                      onClick={() => {
                        form.setFieldsValue({
                          message: `I'm interested in "${listing.name}" and would like more information.`,
                        });
                        document
                          .getElementById("contact-form")
                          ?.scrollIntoView({ behavior: "smooth" });
                      }}
                    >
                      Request Information
                    </Button>

                    {listing.contactPhone && (
                      <Button
                        block
                        onClick={() => {
                          window.location.href = `tel:${listing.contactPhone}`;
                          message.info(`Calling ${listing.contactPhone}`);
                        }}
                      >
                        Call Now
                      </Button>
                    )}
                  </div>
                </div>
              </Card>

              {/* Contact Information Card */}
              <Card
                bordered={false}
                className="shadow-md rounded-lg"
                title={
                  <Title level={4} className="my-0 flex items-center">
                    <MailOutlined className="mr-2 text-blue-500" />
                    Contact Information
                  </Title>
                }
              >
                {/* Public Contact Information */}
                <div className="space-y-4 p-2">
                  {listing.contactPhone && (
                    <div className="flex items-center bg-blue-50 p-3 rounded-lg hover:bg-blue-100 transition-colors">
                      <div className="bg-white p-2 rounded-full mr-3 shadow-sm">
                        <PhoneOutlined className="text-blue-600 text-lg" />
                      </div>
                      <div>
                        <Text type="secondary" className="block text-xs">
                          Phone
                        </Text>
                        <Text copyable className="font-medium">
                          {listing.contactPhone}
                        </Text>
                      </div>
                    </div>
                  )}

                  {listing.contactEmail && (
                    <div className="flex items-center bg-blue-50 p-3 rounded-lg hover:bg-blue-100 transition-colors">
                      <div className="bg-white p-2 rounded-full mr-3 shadow-sm">
                        <MailOutlined className="text-blue-600 text-lg" />
                      </div>
                      <div>
                        <Text type="secondary" className="block text-xs">
                          Email
                        </Text>
                        <Text copyable className="font-medium">
                          {listing.contactEmail}
                        </Text>
                      </div>
                    </div>
                  )}

                  {listing.website && (
                    <div className="flex items-center bg-blue-50 p-3 rounded-lg hover:bg-blue-100 transition-colors">
                      <div className="bg-white p-2 rounded-full mr-3 shadow-sm">
                        <GlobalOutlined className="text-blue-600 text-lg" />
                      </div>
                      <div>
                        <Text type="secondary" className="block text-xs">
                          Website
                        </Text>
                        <a
                          href={
                            listing.website.startsWith("http")
                              ? listing.website
                              : `https://${listing.website}`
                          }
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:underline font-medium"
                        >
                          {listing.website.replace(/^https?:\/\//i, "")}
                        </a>
                      </div>
                    </div>
                  )}
                </div>

                {/* Owner Information Section - Enhanced styling */}
                {listing.owner && (
                  <>
                    <Divider orientation="left">
                      <span className="flex items-center">
                        <FiUser className="mr-2 text-blue-500" /> Owner/Host
                        Information
                      </span>
                    </Divider>
                    <div className="bg-gradient-to-br from-blue-50 to-indigo-50 p-5 rounded-xl shadow-sm border border-blue-100">
                      <div className="flex items-center space-x-4">
                        <div className="relative">
                          <Avatar
                            size={70}
                            icon={<FiUser />}
                            className="bg-gradient-to-r from-blue-500 to-indigo-600 shadow-md"
                          />
                          {(typeof listing.owner === "object" &&
                            listing.owner.isFeatured) ||
                          (typeof listing.owner === "string" &&
                            JSON.parse(listing.owner).isFeatured) ? (
                            <div className="absolute -top-2 -right-2">
                              <Badge.Ribbon text="Featured" color="gold" />
                            </div>
                          ) : null}
                        </div>
                        <div className="flex-1">
                          <h3 className="text-xl font-semibold text-gray-800 mb-1">
                            {typeof listing.owner === "object"
                              ? listing.owner.name
                              : typeof listing.owner === "string"
                              ? JSON.parse(listing.owner).name
                              : "Owner"}
                          </h3>

                          <div className="space-y-2 mt-2">
                            {(typeof listing.owner === "object" &&
                              listing.owner.email) ||
                            (typeof listing.owner === "string" &&
                              JSON.parse(listing.owner).email) ? (
                              <div className="flex items-center text-gray-600">
                                <div className="bg-white p-1 rounded-full shadow-sm mr-2">
                                  <MailOutlined className="text-blue-500" />
                                </div>
                                <Text copyable className="text-gray-800">
                                  {typeof listing.owner === "object"
                                    ? listing.owner.email
                                    : typeof listing.owner === "string"
                                    ? JSON.parse(listing.owner).email
                                    : ""}
                                </Text>
                              </div>
                            ) : null}

                            {(typeof listing.owner === "object" &&
                              listing.owner.phone) ||
                            (typeof listing.owner === "string" &&
                              JSON.parse(listing.owner).phone) ? (
                              <div className="flex items-center text-gray-600">
                                <div className="bg-white p-1 rounded-full shadow-sm mr-2">
                                  <PhoneOutlined className="text-blue-500" />
                                </div>
                                <Text copyable className="text-gray-800">
                                  {typeof listing.owner === "object"
                                    ? listing.owner.phone
                                    : typeof listing.owner === "string"
                                    ? JSON.parse(listing.owner).phone
                                    : ""}
                                </Text>
                              </div>
                            ) : null}
                          </div>
                        </div>
                      </div>
                    </div>
                  </>
                )}

                <Divider />

                {/* Contact Form - Enhanced styling */}
                <Form
                  id="contact-form"
                  form={form}
                  layout="vertical"
                  onFinish={handleContact}
                >
                  <Form.Item
                    name="message"
                    label={
                      <span className="flex items-center">
                        <MailOutlined className="mr-2 text-blue-500" /> Send
                        Message
                      </span>
                    }
                    rules={[
                      { required: true, message: "Please enter your message!" },
                    ]}
                  >
                    <Input.TextArea
                      rows={4}
                      placeholder="I'm interested in this listing..."
                      className="rounded-lg"
                    />
                  </Form.Item>

                  <Form.Item>
                    <Button
                      type="primary"
                      block
                      className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 h-10 rounded-lg shadow-md"
                      onClick={() => {
                        // Get form message value
                        const message = form.getFieldValue("message");

                        // Format phone number for WhatsApp - remove non-numeric characters
                        const phoneNumber = listing.contactPhone?.replace(
                          /\D/g,
                          ""
                        );

                        if (!phoneNumber) {
                          message.error("No contact phone number available");
                          return;
                        }

                        // Create WhatsApp URL with phone and message
                        const whatsappUrl = `https://wa.me/91${phoneNumber}?text=${encodeURIComponent(
                          message || ""
                        )}`;

                        // Open WhatsApp in new tab
                        window.open(whatsappUrl, "_blank");

                        // Optional: Still show success message in the UI
                        message.success(
                          "Opening WhatsApp to contact the listing owner!"
                        );
                      }}
                    >
                      Contact via WhatsApp
                    </Button>
                  </Form.Item>
                </Form>
              </Card>

              {/* Related Listings Card - Uncomment if needed */}
              {/* <Card 
                bordered={false} 
                className="shadow-md rounded-lg"
                title={<Title level={5} className="my-0">More {listing.category?.name || 'Listings'}</Title>}
              >
                <div className="space-y-4">
                  {relatedListings.map(item => (
                    <div key={item._id} className="flex border-b pb-3 cursor-pointer" onClick={() => navigate(`/listings/${item._id}`)}>
                      <div className="w-20 h-16 mr-3 overflow-hidden rounded">
                        <img 
                          src={item.images?.[0] || 'https://via.placeholder.com/80x60?text=No+Image'} 
                          alt={item.name}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            e.target.onerror = null;
                            e.target.src = 'https://via.placeholder.com/80x60?text=No+Image';
                          }}
                        />
                      </div>
                      <div>
                        <Text strong className="line-clamp-1 hover:text-blue-600">{item.name}</Text>
                        {item.location && (
                          <Space className="text-xs text-gray-500">
                            <EnvironmentOutlined /> {item.location?.split(',')[0]}
                          </Space>
                        )}
                        {item.price && <div className="text-blue-600 font-medium">₹{item.price}</div>}
                      </div>
                    </div>
                  ))}
                </div>
              </Card> */}
            </div>
          </Col>
        </Row>

        {/* Image Gallery Preview */}
        {imagePreviewVisible && (
          <Image.PreviewGroup
            preview={{
              visible: imagePreviewVisible,
              onVisibleChange: (visible) => setImagePreviewVisible(visible),
              current: activeImage,
            }}
          >
            {images.map((img, index) => (
              <Image key={index} src={img} style={{ display: "none" }} />
            ))}
          </Image.PreviewGroup>
        )}
      </div>
    </div>
  );
};

export default HotelDetailsPage;
