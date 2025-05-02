import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Card, Row, Col, Input, Select, Typography,
  Tag, Empty, Skeleton, Button,
  Badge, Space, Divider, Avatar, Alert, Pagination
} from 'antd';
import {
  SearchOutlined,
  EnvironmentOutlined,
  StarOutlined,
} from '@ant-design/icons';
import { MdBed } from 'react-icons/md';
import { API_URL } from '../utils/constants';

const { Title, Text, Paragraph } = Typography;
const { Option } = Select;

// Animation variants for list container
const listVariants = {
  hidden: { opacity: 0 },
  visible: { 
    opacity: 1,
    transition: { 
      staggerChildren: 0.05,
      when: "beforeChildren" 
    }
  },
  exit: { 
    opacity: 0,
    transition: { 
      duration: 0.2,
      ease: "easeOut"
    }
  }
};

// Animation variants for individual items
const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { 
    opacity: 1, 
    y: 0,
    transition: { 
      type: "spring",
      stiffness: 100,
      damping: 12,
      mass: 0.5
    }
  },
  exit: { 
    opacity: 0,
    transition: { 
      duration: 0.15
    }
  }
};

// Page info animation variants
const pageInfoVariants = {
  hidden: { opacity: 0, y: -10 },
  visible: { 
    opacity: 1, 
    y: 0,
    transition: { duration: 0.3 }
  },
  exit: { 
    opacity: 0, 
    y: 10,
    transition: { duration: 0.2 }
  }
};

const HotelCard = () => {
  // State variables
  const [hotels, setHotels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [priceFilter, setPriceFilter] = useState('all');
  const [page, setPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [listingsPerPage, setListingsPerPage] = useState(10);
  const [isChangingPage, setIsChangingPage] = useState(false);
  const navigate = useNavigate();

  // Memoize fetchHotels to prevent unnecessary re-renders
  const fetchHotels = useCallback(async (pageNum = 1) => {
    try {
      setIsChangingPage(true);
      setLoading(true);
      
      let queryParams = `page=${pageNum}&limit=${listingsPerPage}`;
      
      if (searchQuery) {
        queryParams += `&search=${encodeURIComponent(searchQuery)}`;
      }
      
      if (priceFilter !== 'all') {
        if (priceFilter === 'low') {
          queryParams += '&price[lte]=100';
        } else if (priceFilter === 'medium') {
          queryParams += '&price[gt]=100&price[lte]=300';
        } else if (priceFilter === 'high') {
          queryParams += '&price[gt]=300';
        }
      }
      
      // Add small delay to give time for exit animations
      await new Promise(resolve => setTimeout(resolve, 200));
      
      const response = await axios.get(`${API_URL}/listings?${queryParams}`);
      
      if (response.data.success) {
        setHotels(response.data.data);
        setTotalCount(response.data.totalCount);
        setPage(pageNum);
        
        // Smooth scroll to top with animation rather than jump
        window.scrollTo({
          top: 0,
          behavior: 'smooth'
        });
      } else {
        setError('Failed to fetch hotels');
      }
    } catch (err) {
      console.error('Error fetching hotels:', err);
      setError('An error occurred while fetching hotels.');
    } finally {
      setLoading(false);
      // Allow a small delay for animations to complete
      setTimeout(() => setIsChangingPage(false), 300);
    }
  }, [listingsPerPage, searchQuery, priceFilter]);

  // Fetch hotels on initial load and when filters change
  useEffect(() => {
    setPage(1);
    fetchHotels(1);
  }, [fetchHotels, listingsPerPage, searchQuery, priceFilter]);

  const filteredHotels = hotels;
  const filteredTotal = totalCount;

  const startIndex = (page - 1) * listingsPerPage + 1;
  const endIndex = Math.min(page * listingsPerPage, filteredTotal);

  const handleHotelClick = (id) => navigate(`/listings/${id}`);

  const handlePageChange = (newPage) => {
    setPage(newPage);
    fetchHotels(newPage);
  };

  return (
    <div className="bg-[#f0f7ff] px-4 md:px-10 py-10">
      <div className="max-w-7xl mx-auto">
        {/* Header Section */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <Row gutter={[16, 16]} align="middle" className="mb-8">
            <Col xs={24} md={16}>
              <Title level={2} className="mb-2">
                The very best of our <span className="text-blue-600">Selections</span>
              </Title>
              <Paragraph className="text-gray-600">
                Discover the most exceptional Listings
              </Paragraph>
            </Col>
          </Row>
        </motion.div>

        {/* Search Filters */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
        >
          <Card className="mb-6 shadow-sm">
            <Row gutter={[16, 16]} align="middle">
              <Col xs={24} md={16}>
                <Input
                  placeholder="Search by hotel name or location..."
                  prefix={<SearchOutlined className="text-gray-400" />}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  size="large"
                  className="rounded-md"
                />
              </Col>
              <Col xs={24} md={8}>
                <Space align="center" className="w-full">
                  <Text strong>Price Range:</Text>
                  <Select
                    value={priceFilter}
                    onChange={(value) => setPriceFilter(value)}
                    className="w-full"
                    size="large"
                  >
                    <Option value="all">All Prices</Option>
                    <Option value="low">₹0 - ₹100</Option>
                    <Option value="medium">₹101 - ₹300</Option>
                    <Option value="high">₹300+</Option>
                  </Select>
                </Space>
              </Col>
            </Row>
          </Card>
        </motion.div>

        {/* Error Display */}
        {error && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <Alert message="Error" description={error} type="error" showIcon closable className="mb-6" />
          </motion.div>
        )}

        {/* Page Information */}
        <AnimatePresence mode="wait">
          {!loading && filteredHotels.length > 0 && (
            <motion.div
              key={`page-info-${page}`}
              variants={pageInfoVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              className="mb-4 bg-white rounded-lg shadow-sm p-4"
            >
              <div className="flex flex-wrap justify-between items-center">
                <div className="flex items-center mb-2 sm:mb-0">
                  <div className="flex items-center justify-center w-8 h-8 rounded-full bg-blue-600 text-white font-medium mr-2">
                    {page}
                  </div>
                  <Text strong className="text-gray-700">
                    Page {page} of {Math.max(1, Math.ceil(filteredTotal / listingsPerPage))}
                  </Text>
                </div>
                
                <div>
                  <Text className="text-gray-600">
                    Showing <span className="font-medium">{startIndex}</span>–
                    <span className="font-medium">{endIndex}</span> of 
                    <span className="font-medium"> {filteredTotal}</span> listings
                  </Text>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Loading Skeletons or Content */}
        <AnimatePresence mode="wait">
          {loading ? (
            <motion.div
              key="loading"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
            >
              <Row gutter={[24, 24]}>
                {[1, 2, 3, 4].map((item) => (
                  <Col xs={24} lg={12} key={`skeleton-${item}`}>
                    <Card className="mb-4">
                      <Row gutter={16}>
                        <Col xs={24} sm={10}><Skeleton.Image className="w-full h-40" active /></Col>
                        <Col xs={24} sm={14}><Skeleton active paragraph={{ rows: 3 }} /></Col>
                      </Row>
                    </Card>
                  </Col>
                ))}
              </Row>
            </motion.div>
          ) : filteredHotels.length === 0 ? (
            <motion.div
              key="empty"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="text-center py-12 bg-white rounded-lg shadow-sm"
            >
              <Empty
                description={<span className="text-gray-500">No Listings found matching your criteria</span>}
                className="my-4"
              >
                <Button
                  type="primary"
                  onClick={() => {
                    setSearchQuery('');
                    setPriceFilter('all');
                  }}
                  className="bg-blue-600 hover:bg-blue-700"
                  size="large"
                >
                  Clear filters
                </Button>
              </Empty>
            </motion.div>
          ) : (
            <motion.div
              key={`hotel-list-${page}`}
              variants={listVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
            >
              <Row gutter={[24, 24]}>
                {filteredHotels.map((hotel, index) => (
                  <Col xs={24} lg={12} key={hotel._id}>
                    <motion.div 
                      variants={itemVariants}
                      onClick={() => handleHotelClick(hotel._id)}
                      className="mb-6"
                      whileHover={{ 
                        y: -5,
                        transition: { 
                          duration: 0.2,
                          ease: "easeOut"
                        }
                      }}
                      style={{ willChange: "transform" }}
                    >
                      <Card 
                        hoverable 
                        className="rounded-lg overflow-hidden"
                      >
                        <Badge.Ribbon text={`₹${hotel.price}`} color="blue">
                          <Row gutter={16}>
                            <Col xs={24} sm={10}>
                              <div className="relative rounded-md overflow-hidden">
                                <img
                                  src={Array.isArray(hotel.images) ? hotel.images[0] : hotel.image || 'https://via.placeholder.com/300x200?text=No+Image'}
                                  alt={hotel.name}
                                  className="w-full h-40 object-cover"
                                  onError={(e) => {
                                    e.target.onerror = null;
                                    e.target.src = 'https://via.placeholder.com/300x200?text=Error+Loading+Image';
                                  }}
                                  loading="lazy"
                                />
                                <div className="absolute top-2 right-2">
                                  <Tag color="gold" className="flex items-center">
                                    <StarOutlined className="mr-1" />{hotel.rating || '4.5'}
                                  </Tag>
                                </div>
                              </div>
                            </Col>
                            <Col xs={24} sm={14}>
                              <Title level={4} className="mb-1">{hotel.name}</Title>
                              <Space className="mb-2">
                                <EnvironmentOutlined className="text-blue-500" />
                                <Text type="secondary">{hotel.location}</Text>
                              </Space>
                              <Divider className="my-2" />
                              {hotel.bedrooms && (
                                <Space className="mb-2">
                                  <Avatar size="small" className="bg-blue-50 text-blue-600">
                                    <MdBed />
                                  </Avatar>
                                  <Text>{hotel.bedrooms} Bed{hotel.bedrooms > 1 ? 's' : ''}</Text>
                                </Space>
                              )}
                              <Divider className="my-2" />
                              <div className="flex justify-between items-center">
                                {hotel.addedBy && (
                                  <Text type="secondary" className="text-xs">
                                    Added by {typeof hotel.addedBy === 'object' ? hotel.addedBy.name : 'Admin'}
                                  </Text>
                                )}
                                <Button
                                  type="primary"
                                  size="small"
                                  className="bg-blue-600"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleHotelClick(hotel._id);
                                  }}
                                >
                                  View Details
                                </Button>
                              </div>
                            </Col>
                          </Row>
                        </Badge.Ribbon>
                      </Card>
                    </motion.div>
                  </Col>
                ))}
              </Row>

              {/* Simplified Pagination */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2, duration: 0.4 }}
                className="mt-8 bg-white rounded-lg shadow-sm p-6"
              >
                <div className="flex flex-wrap justify-between items-center mb-4">
                  <h3 className="text-lg font-medium text-gray-800 mb-2 sm:mb-0">
                    Browse Pages
                  </h3>
                  
                  <div className="flex items-center">
                    <span className="text-sm text-gray-500 mr-2">Show:</span>
                    <Select
                      value={listingsPerPage}
                      onChange={(value) => {
                        setListingsPerPage(value);
                        setPage(1);
                        fetchHotels(1);
                      }}
                      className="w-24"
                      size="small"
                      disabled={isChangingPage}
                    >
                      <Option value={8}>8 per page</Option>
                      <Option value={10}>10 per page</Option>
                      <Option value={20}>20 per page</Option>
                      <Option value={40}>40 per page</Option>
                    </Select>
                  </div>
                </div>
                
                <div className="flex justify-center">
                  <Pagination
                    current={page}
                    pageSize={listingsPerPage}
                    total={filteredTotal}
                    onChange={handlePageChange}
                    showSizeChanger={false}
                    showQuickJumper={filteredTotal > 50}
                    simple={filteredTotal > 20}
                    disabled={isChangingPage}
                    className="simplified-pagination"
                  />
                </div>
                
                <div className="mt-4 text-center">
                  <Text className="text-sm text-gray-500">
                    {filteredTotal > 0 ? 
                      `Found ${filteredTotal} Listings` : 
                      'No results'
                    }
                  </Text>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

// Add some styles to optimize performance
const styles = document.createElement('style');
styles.innerHTML = `
  .simplified-pagination .ant-pagination-item,
  .simplified-pagination .ant-pagination-prev,
  .simplified-pagination .ant-pagination-next {
    will-change: transform;
  }
  
  @media (prefers-reduced-motion: reduce) {
    *, ::before, ::after {
      animation-duration: 0.01ms !important;
      animation-iteration-count: 1 !important;
      transition-duration: 0.01ms !important;
      scroll-behavior: auto !important;
    }
  }
`;
document.head.appendChild(styles);

export default HotelCard;
