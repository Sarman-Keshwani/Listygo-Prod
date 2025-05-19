import React, { useState } from "react";
import {
  Form,
  TimePicker,
  Checkbox,
  Button,
  Row,
  Col,
  Divider,
  Dropdown,
  Space,
  Menu,
  message,
} from "antd";
import { FiClock, FiSave, FiChevronDown } from "react-icons/fi";
import dayjs from "dayjs";

const daysOfWeek = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
];

const HoursTab = ({
  savedHoursTemplates,
  saveHoursTemplate,
  loadHoursTemplate,
  form,
}) => {
  const [showAllDays, setShowAllDays] = useState(false);
  const [loading, setLoading] = useState(false);

  const getCurrentFormHours = () => {
    const values = form.getFieldsValue(true);
    return values.hours || null;
  };

  const applyTemplate = (templateName) => {
    const template = loadHoursTemplate(templateName);
    if (template) {
      form.setFieldsValue({ hours: template });
      message.success(`Applied ${templateName} hours template`);
    } else {
      message.warning(`No saved ${templateName} template found`);
    }
  };

  const handleSaveTemplate = async (templateName) => {
    setLoading(true);
    try {
      const currentHours = getCurrentFormHours();
      await saveHoursTemplate(templateName, currentHours);
    } catch (error) {
      console.error("Error saving template:", error);
      message.error("Failed to save hours template");
    } finally {
      setLoading(false);
    }
  };

  const copyFromPreviousDay = (day, index) => {
    if (index === 0) return;

    const previousDay = daysOfWeek[index - 1];
    const values = form.getFieldsValue();

    if (values.hours && values.hours[previousDay]) {
      form.setFieldsValue({
        hours: {
          ...values.hours,
          [day]: { ...values.hours[previousDay] },
        },
      });
      message.success(`Copied hours from ${previousDay} to ${day}`);
    } else {
      message.warning(`No hours set for ${previousDay}`);
    }
  };

  const templateMenu = (
    <Menu
      items={[
        {
          key: "standard",
          label: "Standard (9 AM - 5 PM, Mon-Fri)",
          onClick: () => applyTemplate("standard"),
        },
        {
          key: "extended",
          label: "Extended (8 AM - 8 PM, Mon-Sat)",
          onClick: () => applyTemplate("extended"),
        },
        {
          key: "allDay",
          label: "24/7 (All days)",
          onClick: () => applyTemplate("allDay"),
        },
        { type: "divider" },
        {
          key: "lastUsed",
          label: "Last Used Template",
          onClick: () => applyTemplate("lastUsed"),
        },
      ]}
    />
  );

  const saveTemplateMenu = (
    <Menu
      items={[
        {
          key: "standard",
          label: "Save as Standard Hours",
          onClick: () => handleSaveTemplate("standard"),
        },
        {
          key: "extended",
          label: "Save as Extended Hours",
          onClick: () => handleSaveTemplate("extended"),
        },
        {
          key: "allDay",
          label: "Save as 24/7 Hours",
          onClick: () => handleSaveTemplate("allDay"),
        },
      ]}
    />
  );

  return (
    <>
      <div className="flex justify-between items-center mb-4 flex-wrap gap-2">
        <h3 className="text-lg font-medium">Business Hours</h3>

        <div className="flex gap-2 flex-wrap">
          <Dropdown menu={templateMenu} placement="bottomRight">
            <Button>
              <Space>
                Load Template
                <FiChevronDown />
              </Space>
            </Button>
          </Dropdown>

          <Dropdown menu={saveTemplateMenu} placement="bottomRight">
            <Button icon={<FiSave />} loading={loading}>
              <Space>
                Save Template
                <FiChevronDown />
              </Space>
            </Button>
          </Dropdown>
        </div>
      </div>

      <Checkbox
        checked={showAllDays}
        onChange={(e) => setShowAllDays(e.target.checked)}
        className="mb-4"
      >
        Show all days (including weekends)
      </Checkbox>

      <div className="bg-blue-50 p-3 rounded-md mb-4">
        <p className="text-sm text-blue-800 mb-0">
          <FiClock className="inline mr-1" />
          Set the operating hours for this listing. Leave empty for days when
          the business is closed.
        </p>
      </div>

      {daysOfWeek.map((day, index) => {
        // Only show weekends if showAllDays is true
        if (!showAllDays && (day === "Saturday" || day === "Sunday")) {
          return null;
        }

        return (
          <React.Fragment key={day}>
            <Row gutter={16} className="mb-3 items-center">
              <Col span={6} className="text-right">
                <strong>{day}</strong>
              </Col>
              <Col span={7}>
                <Form.Item name={["hours", day, "open"]} noStyle>
                  <TimePicker
                    use12Hours
                    format="h:mm A"
                    placeholder="Opening"
                    className="w-full"
                    minuteStep={15}
                  />
                </Form.Item>
              </Col>
              <Col span={1} className="text-center">
                to
              </Col>
              <Col span={7}>
                <Form.Item name={["hours", day, "close"]} noStyle>
                  <TimePicker
                    use12Hours
                    format="h:mm A"
                    placeholder="Closing"
                    className="w-full"
                    minuteStep={15}
                  />
                </Form.Item>
              </Col>
              <Col span={3}>
                {index > 0 && (
                  <Button
                    size="small"
                    type="link"
                    onClick={() => copyFromPreviousDay(day, index)}
                    title={`Copy from ${daysOfWeek[index - 1]}`}
                  >
                    Copy ↑
                  </Button>
                )}
              </Col>
            </Row>

            {index < daysOfWeek.length - 1 && <Divider className="my-3" />}
          </React.Fragment>
        );
      })}
    </>
  );
};

export default HoursTab;
