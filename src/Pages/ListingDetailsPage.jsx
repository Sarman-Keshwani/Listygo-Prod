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
  InputNumber,
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
  Tooltip,
  message,
  Tabs,
} from "antd";
import {
  ArrowLeftOutlined,
  EnvironmentOutlined,
  CalendarOutlined,
  TagOutlined,
  HomeOutlined,
  CarOutlined,
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
import { FiMaximize2 } from "react-icons/fi";
import dayjs from "dayjs";
import { formatBusinessHours } from "../utils/hourUtils";
import { fetchListingHours } from "../services/adminService";

const { Title, Text, Paragraph } = Typography;
const { TabPane } = Tabs;
const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000/api";

const ListingDetailsPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [listing, setListing] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [imagePreviewVisible, setImagePreviewVisible] = useState(false);
  const [activeImage, setActiveImage] = useState(0);
  const [form] = Form.useForm();
  const carouselRef = useRef(null);
  const [businessHours, setBusinessHours] = useState(null);
  
  useEffect(() => {
    const fetchListing = async () => {
      try {
        setLoading(true);
        const response = await axios.get(`${API_URL}/listings/${id}`);

        if (response.data.success) {
          setListing(response.data.data);
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

  useEffect(() => {
    if (listing && listing._id) {
      // Fetch business hours data
      const getBusinessHours = async () => {
        try {
          const hoursData = await fetchListingHours(listing._id);
          const formattedHours = formatBusinessHours(hoursData);
          setBusinessHours(formattedHours);
        } catch (error) {
          console.error("Error fetching business hours:", error);
        }
      };
      
      getBusinessHours();
    }
  }, [listing]);

  // Handle booking or contact
  const handleContact = async (values) => {
    try {
      // This is just a placeholder - implement actual contact logic
      message.success("Your inquiry has been sent to the owner!");
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
    const iconProps = { size: 18 };
    switch (amenity.toLowerCase()) {
      case "wifi":
        return <MdWifi {...iconProps} />;
      case "air conditioning":
        return <MdAcUnit {...iconProps} />;
      case "tv":
        return <MdTv {...iconProps} />;
      case "kitchen":
        return <MdKitchen {...iconProps} />;
      case "pool":
        return <MdPool {...iconProps} />;
      case "gym":
        return <MdFitnessCenter {...iconProps} />;
      default:
        return <CheckCircleOutlined />;
    }
  };

  // Example of how to render the business hours in the UI
  const renderBusinessHours = () => {
    if (!businessHours || businessHours.length === 0) {
      return (
        <div className="text-gray-500 italic">
          Business hours not available
        </div>
      );
    }

    return (
      <ul className="space-y-2">
        {businessHours.map((item, index) => (
          <li key={index} className="flex justify-between">
            <span className="font-medium">{item.day}</span>
            <span className="text-gray-600">{item.hours}</span>
          </li>
        ))}
      </ul>
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
          <Button type="primary" onClick={() => navigate("/listings")}>
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
              <Breadcrumb.Item>
                <a
                  onClick={() =>
                    navigate(`/listings?category=${listing.category._id}`)
                  }
                >
                  {listing.category.name}
                </a>
              </Breadcrumb.Item>
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
                <Space className="mb-4">
                  <Tag icon={<EnvironmentOutlined />} color="blue">
                    {listing.location}
                  </Tag>
                  <Tag color="purple">{listing.category.name}</Tag>
                  <Rate
                    disabled
                    defaultValue={listing.rating || 4.5}
                    allowHalf
                    className="text-sm"
                  />
                  <Text type="secondary">{listing.rating || 4.5} Rating</Text>
                </Space>
              </div>

              <Badge.Ribbon text={`₹${listing.price}`} color="blue">
                <Card className="mb-4 md:mb-0 bg-white shadow-sm">
                  <div className="text-center">
                    <Title level={4} className="mb-0">
                      ${listing.price}
                    </Title>
                    <Text type="secondary">
                      {listing.category.name === "Hotels"
                        ? "per night"
                        : listing.category.name === "Restaurants"
                        ? "avg price"
                        : ""}
                    </Text>
                  </div>
                </Card>
              </Badge.Ribbon>
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
            <Card bordered={false} className="mt-20 shadow-md rounded-lg">
              <Tabs defaultActiveKey="details">
                <TabPane tab="Details" key="details">
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
                          <CalendarOutlined />
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
                                  <Text strong className="text-gray-700">{item.day}:</Text>
                                  <Text className={item.hours === 'Closed' ? 'text-red-500' : 'text-green-600'}>
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

                  {/* Attributes Section - Only using string format */}
                  {listing.attributes && (
                    <>
                      <Divider orientation="left">
                        <Space>
                          <InfoCircleOutlined />
                          <span>Features</span>
                        </Space>
                      </Divider>

                      <Row gutter={[16, 16]} className="mb-6">
                        {listing.attributes
                          .split(",")
                          .map((attribute, index) => {
                            const cleanAttr = attribute.trim();
                            if (!cleanAttr) return null;

                            return (
                              <Col key={index} xs={12} sm={8} md={6}>
                                <Card className="text-center h-full bg-blue-50 border-0">
                                  <Text strong>
                                    {cleanAttr
                                      .replace(/([A-Z])/g, " $1")
                                      .replace(/^./, (str) =>
                                        str.toUpperCase()
                                      )}
                                  </Text>
                                </Card>
                              </Col>
                            );
                          })}
                      </Row>
                    </>
                  )}

                  {/* Amenities Section */}
                  <Divider orientation="left">
                    <Space>
                      <CheckCircleOutlined />
                      <span>Amenities</span>
                    </Space>
                  </Divider>

                  <Row gutter={[16, 16]} className="pb-2">
                    {listing.amenities && listing.amenities.length > 0 ? (
                      listing.amenities.map((amenity, index) => {
                        // Handle string or nested array formats
                        let cleanAmenity = amenity;

                        // If it's a string that might be JSON
                        if (
                          typeof amenity === "string" &&
                          (amenity.startsWith("[") || amenity.startsWith("{"))
                        ) {
                          try {
                            const parsed = JSON.parse(amenity);
                            cleanAmenity = Array.isArray(parsed)
                              ? parsed[0]
                              : parsed;
                          } catch {
                            // Keep original if parsing fails
                            cleanAmenity = amenity;
                          }
                        }

                        // Ensure it's a string and remove extra quotes/brackets
                        cleanAmenity = String(cleanAmenity)
                          .replace(/\[\]"']/g, "")
                          .trim();

                        if (!cleanAmenity) return null;

                        return (
                          <Col key={index} xs={12} md={8} lg={6}>
                            <div className="bg-blue-50 hover:bg-blue-100 transition-colors rounded-lg p-3 h-full">
                              <Space align="start">
                                <div className="bg-white rounded-full p-2 shadow-sm text-blue-600">
                                  {getAmenityIcon(cleanAmenity)}
                                </div>
                                <Text className="text-gray-700 font-medium">
                                  {cleanAmenity}
                                </Text>
                              </Space>
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
                      <div className="mb-6">
                        {listing.tags.map((tag) => (
                          <Tag
                            key={tag}
                            color="blue"
                            className="mr-2 mb-2 py-1 px-3"
                          >
                            {tag}
                          </Tag>
                        ))}
                      </div>
                    </>
                  )}
                </TabPane>

                {/* Hours Tab */}
                {businessHours && businessHours.length > 0 && (
                  <TabPane tab="Hours" key="hours">
                    <div className="bg-white p-4 rounded">
                      <Title level={5} className="mb-4">
                        Business Hours
                      </Title>
                      <div className="space-y-2">
                        {businessHours.map((item, index) => (
                          <div
                            key={index}
                            className="flex justify-between pb-2 border-b border-gray-100"
                          >
                            <Text strong>{item.day}</Text>
                            <Text>{item.hours}</Text>
                          </div>
                        ))}
                      </div>
                    </div>
                  </TabPane>
                )}

                {/* Location Tab */}
                <TabPane tab="Location" key="location">
                  <div className="bg-white p-4 rounded">
                    <Title level={5} className="mb-4">
                      Location
                    </Title>
                    <div className="mb-4">
                      <EnvironmentOutlined className="text-blue-500 mr-2" />
                      <Text>{listing.location}</Text>
                    </div>

                    {/* Placeholder for map - replace with your actual map component */}
                    <div className="h-64 bg-gray-100 rounded flex items-center justify-center">
                      <Text type="secondary">
                        Map view would be displayed here
                      </Text>
                    </div>
                  </div>
                </TabPane>
              </Tabs>
            </Card>
          </Col>

          {/* Contact Information Sidebar */}
          <Col xs={24} xl={8}>
            <div className="sticky space-y-2 top-24">
              <Card
                bordered={false}
                className="shadow-md rounded-lg"
                title={
                  <Title level={4} className="my-0">
                    Contact Information
                  </Title>
                }
              >
                {/* Owner/Host Information */}
                {listing.owner && (
                  <div className="mb-6">
                    <div className="flex items-start space-x-4">
                      <Avatar
                        size={64}
                        src={
                          listing.owner.image ||
                          "https://randomuser.me/api/portraits/men/32.jpg"
                        }
                      />
                      <div>
                        <Title level={5} className="mb-1">
                          {listing.owner.name}
                        </Title>
                        <div className="space-y-1">
                          {listing.owner.isFeatured && (
                            <Tag color="gold">Featured Host</Tag>
                          )}
                          {listing.owner.responseRate && (
                            <Text type="secondary" className="block">
                              Response rate: {listing.owner.responseRate}%
                            </Text>
                          )}
                        </div>
                      </div>
                    </div>

                    <Divider className="my-4" />

                    <div className="space-y-3">
                      {listing.owner.phone && (
                        <div className="flex items-center">
                          <PhoneOutlined className="text-blue-500 mr-3" />
                          <Text copyable>{listing.owner.phone}</Text>
                        </div>
                      )}

                      {listing.owner.email && (
                        <div className="flex items-center">
                          <MailOutlined className="text-blue-500 mr-3" />
                          <Text copyable>{listing.owner.email}</Text>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Public Contact Information */}
                <div className="space-y-3">
                  {listing.contactPhone && (
                    <div className="flex items-center">
                      <PhoneOutlined className="text-blue-500 mr-3" />
                      <Text copyable>{listing.contactPhone}</Text>
                    </div>
                  )}

                  {listing.contactEmail && (
                    <div className="flex items-center">
                      <MailOutlined className="text-blue-500 mr-3" />
                      <Text copyable>{listing.contactEmail}</Text>
                    </div>
                  )}

                  {listing.website && (
                    <div className="flex items-center">
                      <GlobalOutlined className="text-blue-500 mr-3" />
                      <a
                        href={
                          listing.website.startsWith("http")
                            ? listing.website
                            : `https://${listing.website}`
                        }
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:underline"
                      >
                        {listing.website.replace(/^https?:\/\//i, "")}
                      </a>
                    </div>
                  )}
                </div>

                <Divider />

                {/* Contact Form */}
                <Form form={form} layout="vertical" onFinish={handleContact}>
                  <Form.Item
                    name="message"
                    label="Send a message"
                    rules={[
                      { required: true, message: "Please enter your message!" },
                    ]}
                  >
                    <Input.TextArea
                      rows={4}
                      placeholder="I'm interested in this listing..."
                    />
                  </Form.Item>

                  <Form.Item>
                    <Button
                      type="primary"
                      htmlType="submit"
                      block
                      className="bg-blue-600 hover:bg-blue-700"
                    >
                      Send Inquiry
                    </Button>
                  </Form.Item>
                </Form>
              </Card>

              {/* More From This Category */}
              <Card
                bordered={false}
                className="shadow-md rounded-lg mt-4"
                title={
                  <Title level={5} className="my-0">
                    More {listing.category.name}
                  </Title>
                }
              >
                <div className="space-y-4">
                  <Empty description="Related listings will appear here" />
                  <Button
                    type="link"
                    className="w-full"
                    onClick={() =>
                      navigate(`/listings?category=${listing.category._id}`)
                    }
                  >
                    See all {listing.category.name}
                  </Button>
                </div>
              </Card>
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

export default ListingDetailsPage;
