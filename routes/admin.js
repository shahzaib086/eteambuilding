const express = require("express");
const router = express.Router();

const {
  dashboard,
} = require("../controllers/admin/adminHomeController");

const {
  adminUserListing,
  adminUserListingFetch,
  createAdminUser,
  storeAdminUser,
  editAdminUser,
  updateAdminUser,
  changePasswordAdminUser,
  updatePasswordAdminUser,
} = require("../controllers/admin/adminUserController");

const {
  roleListing,
  roleListingFetch,
  createRole,
  storeRole,
  editRole,
  updateRole,
} = require("../controllers/admin/adminRolePermissionController");

const {
  customerListing,
  customerListingFetch,
  editCustomer,
  updateCustomer,
  showCustomer,
  customerDropdownData,
} = require("../controllers/admin/adminCustomerController");


// Dashboard
router.get("/dashboard", dashboard);

//Admin change password
router.get("/change-password", changePasswordAdminUser);
router.post("/update-password", updatePasswordAdminUser);

// Admin Users Management
router.get("/users", adminUserListing);
router.post("/users/fetch", adminUserListingFetch);
router.get("/user/create", createAdminUser);
router.post("/user/store", storeAdminUser);
router.get("/user/edit/:encId", editAdminUser);
router.post("/user/update/:encId", updateAdminUser);

// Roles Management
router.get("/roles", roleListing);
router.post("/roles/fetch", roleListingFetch);
router.get("/role/create", createRole);
router.post("/role/store", storeRole);
router.get("/role/edit/:encId", editRole);
router.post("/role/update/:encId", updateRole);

// Customer Management
router.get("/customers", customerListing);
router.post("/customers/fetch", customerListingFetch);
// router.get("/customer/create", createRole);
// router.post("/customer/store", storeRole);
router.get("/customer/edit/:encId", editCustomer);
router.post("/customer/update/:encId", updateCustomer);
router.get("/customer/show/:encId", showCustomer);
router.get("/customers/dropdown", customerDropdownData);



module.exports = router;