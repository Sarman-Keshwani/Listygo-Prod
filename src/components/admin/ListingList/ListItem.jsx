import React from "react";
import { Card, Tag, Button, Rate } from "antd";
import { FiEdit, FiTrash2, FiMapPin, FiImage } from "react-icons/fi";
import { getCategoryName } from "../../../utils/listingUtils";

const ListItem = ({ listing, categories, onEdit, onDelete }) => {
  return (
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
                {listing.category
                  ? getCategoryName(listing.category, categories)
                  : "Uncategorized"}
              </Tag>
              <h3 className="font-semibold text-lg mb-1 text-blue-700">
                {listing.name}
              </h3>
            </div>
            <div className="flex gap-2">
              <Button
                type="primary"
                icon={<FiEdit />}
                onClick={onEdit}
                className="bg-blue-600 hover:bg-blue-700"
              >
                Edit
              </Button>
              <Button danger icon={<FiTrash2 />} onClick={onDelete}>
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
};

export default ListItem;
