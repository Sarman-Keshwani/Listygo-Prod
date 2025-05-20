import React from "react";
import { Button, Empty, Spin } from "antd";
import GridItem from "./GridItem";
import ListItem from "./ListItem";

const ListingList = ({
  listings,
  loading,
  loadingMore,
  hasMore,
  viewMode,
  setViewMode,
  loadMoreListings,
  handleEdit,
  handleDelete,
  categories,
  onAddNew,
}) => {
  // View mode toggle
  const toggleViewMode = (mode) => {
    setViewMode(mode);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-20">
        <Spin size="large" />
      </div>
    );
  }

  if (!listings || listings.length === 0) {
    return (
      <Empty
        description={
          <span>
            No listings found. <a onClick={onAddNew}>Add a new listing</a>
          </span>
        }
        className="py-16"
      />
    );
  }

  return (
    <>
      <div className="flex justify-end mb-4">
        <div className="flex items-center gap-2">
          <span className="text-gray-600">View:</span>
          <Button
            type={viewMode === "grid" ? "primary" : "default"}
            onClick={() => toggleViewMode("grid")}
          >
            Grid
          </Button>
          <Button
            type={viewMode === "list" ? "primary" : "default"}
            onClick={() => toggleViewMode("list")}
          >
            List
          </Button>
        </div>
      </div>

      <div
        className={
          viewMode === "grid"
            ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 gap-4 md:gap-6"
            : "space-y-4"
        }
      >
        {viewMode === "grid"
          ? listings.map((listing) => (
              <GridItem
                key={listing._id}
                listing={listing}
                categories={categories}
                onEdit={() => handleEdit(listing)}
                onDelete={() => handleDelete(listing._id)}
              />
            ))
          : listings.map((listing) => (
              <ListItem
                key={listing._id}
                listing={listing}
                categories={categories}
                onEdit={() => handleEdit(listing)}
                onDelete={() => handleDelete(listing._id)}
              />
            ))}
      </div>

      {hasMore && (
        <div className="mt-8 text-center">
          <Button
            type="primary"
            size="large"
            loading={loadingMore}
            onClick={loadMoreListings}
            className="bg-blue-600 hover:bg-blue-700 px-8 h-12"
          >
            Load More Listings
          </Button>
        </div>
      )}
    </>
  );
};

export default ListingList;
