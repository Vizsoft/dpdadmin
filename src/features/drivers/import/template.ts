export const DRIVER_IMPORT_HEADERS = [
  "Full Name",
  "Phone (+965)",
  "Civil ID",
  "Employee ID",
  "Partner",
  "Zone",
  "Vehicle",
  "Restaurants (comma-separated)",
] as const;

export const DRIVER_IMPORT_SAMPLE_ROW = [
  "Ahmed Ali",
  "+96599123456",
  "281010100001",
  "12345",
  "Talabat",
  "Salmiya",
  "BIKE-1024",
  "Pizza Hut Salmiya, KFC Hawally",
] as const;

export const DRIVER_IMPORT_TEMPLATE_PATH = "/api/drivers/import-template.xlsx";
