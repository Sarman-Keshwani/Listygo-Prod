import React from "react";
import { Card, Tag, Button } from "antd";
import { FiEdit, FiTrash2, FiMapPin, FiStar, FiImage } from "react-icons/fi";
import { getCategoryName } from "../../../utils/listingUtils";

const GridItem = ({ listing, categories, onEdit, onDelete }) => {
  return (
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
        <Button type="text" icon={<FiEdit />} onClick={onEdit}>
          Edit
        </Button>,
        <Button type="text" danger icon={<FiTrash2 />} onClick={onDelete}>
          Delete
        </Button>,
      ]}
    >
      <div className="mb-2">
        <Tag color="blue">
          {listing.category
            ? getCategoryName(listing.category, categories)
            : "Uncategorized"}
        </Tag>
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
};

export default GridItem;
