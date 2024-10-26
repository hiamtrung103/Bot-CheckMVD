const axios = require("axios");
const { baseURL } = require("../index.js");

// Hàm để kiểm tra MVD
const checkMVD = async (trackingList) => {
  try {
    const res = await axios.post(`${baseURL}/api/shopee/trackingList`, {
      trackingList,
    });
    return res.data;
  } catch (err) {
    console.error("Error checking MVD:", err);
    return null;
  }
};


const getOrderDetailsForCookie = async (cookiesArray) => {
  try {
    const res = await axios.post(
      `${baseURL}/api/shopee/getOrderDetailsForCookie`,
      { cookies: cookiesArray }
    );
    return res.data;
  } catch (err) {
    console.error("Error fetching order details for cookies:", err);
    return null;
  }
};

module.exports = {
  checkMVD,
  getOrderDetailsForCookie,
};


//terminal
// const axios = require("axios");
// const { baseURL } = require("../index.js");

// // Hàm để kiểm tra MVD
// const checkMVD = async (trackingList) => {
//   try {
//     const res = await axios.post(`${baseURL}/api/shopee/trackingList`, {
//       trackingList,
//     });
//     return res.data;
//   } catch (err) {
//     console.error("Error checking MVD:", err);
//     return null;
//   }
// };

// // Hàm để lấy thông tin đơn hàng dựa trên cookie
// const getOrderDetailsForCookie = async (cookiesArray) => {
//   try {
//     console.log("Gọi API để lấy thông tin đơn hàng...");

//     const res = await axios.post(
//       `${baseURL}/api/shopee/getOrderDetailsForCookie`,
//       { cookies: cookiesArray }
//     );

//     // console.log("API trả về phản hồi:", res.data);
//     return res.data;
//   } catch (err) {
//     console.error("Lỗi khi gọi API:", err);
//     return null;
//   }
// };

// module.exports = {
//   checkMVD,
//   getOrderDetailsForCookie,
// };
