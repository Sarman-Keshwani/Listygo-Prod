import dayjs from 'dayjs';

/**
 * Format business hours for display
 * @param {Object} hoursData - The hours data from the API
 * @returns {Array} Formatted hours for display
 */
export const formatBusinessHours = (hoursData) => {
  if (!hoursData) return null;

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
  const hasHoursData = Object.values(hoursData).some(
    (dayHours) => dayHours && dayHours.open && dayHours.close
  );

  if (!hasHoursData) return null;

  for (const day of days) {
    if (
      hoursData[day] &&
      hoursData[day].open &&
      hoursData[day].close
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
        hours: `${formatTime(hoursData[day].open)} - ${formatTime(
          hoursData[day].close
        )}`,
      });
    }
  }

  return formattedHours.length > 0 ? formattedHours : null;
};

/**
 * Helper function to prepare hours data for submission to the API
 * @param {Object} formValues - Form values containing hours data with dayjs objects
 * @returns {Object} Formatted hours object for API submission
 */
export const prepareHoursForSubmission = (formValues) => {
  if (!formValues.hours) return null;
  
  const formattedHours = {};
  Object.entries(formValues.hours).forEach(([day, times]) => {
    if (times?.open && times?.close) {
      formattedHours[day] = {
        open: times.open.format("HH:mm"),
        close: times.close.format("HH:mm"),
      };
    }
  });
  
  return Object.keys(formattedHours).length > 0 ? formattedHours : null;
};
