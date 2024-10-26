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

// Hàm để tạo QR code
const generateQRCode = async () => {
  try {
    const res = await axios.get(`${baseURL}/api/shopee/generate-qr-code`);
    return res.data.data;
  } catch (err) {
    console.error("Error generating QR code:", err);
    return null;
  }
};

const checkQRCode = async (qrcodeId) => {
  try {
    const res = await axios.get(
      `${baseURL}/api/shopee/check-qr-status?qrcode_id=${encodeURIComponent(
        qrcodeId
      )}`
    );
    return res.data.data;
  } catch (err) {
    console.error("Error checking QR code status:", err);
    return null;
  }
};

const loginQRCode = async (qrcodeToken) => {
  try {
    const res = await axios.post(`${baseURL}/api/shopee/login-qr`, {
      qrcodeToken,
    });
    return res.data;
  } catch (err) {
    console.error("Error checking QR code status:", err);
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

const saveVoucher = async (cookie) => {
  try {
    const res = await axios.post(
      `https://us-central1-auto-pee.cloudfunctions.net/app/v2/api/shopee/saveVoucher7`,
      {
        cookie,
      }
    );
    return res.data;
  } catch (err) {
    console.error("Error addAddress:", err);
    return null;
  }
};

const loginWithPassword = async (username, password, spc_f) => {
  try {
    const res = await axios.post(`${baseURL}/api/shopee/loginWithPassword`, {
      username,
      password,
      spc_f,
    });
    return res.data;
  } catch (err) {
    console.error("Error fetching loginWithPassword:", err);
    return null;
  }
};

const getOrderDetail = async (order_sn, cookiesArray) => {
  try {
    const url = "https://partner.shopeemobile.com/api/v2/order/get_order_detail";
    
    // Sử dụng cookiesArray để tạo chuỗi cookie
    const cookieString = cookiesArray.join('; ');

    const headers = {
      'Cookie': cookieString, // Truyền cookie trong header
      'Content-Type': 'application/json'
    };

    const res = await axios.post(
      url, 
      {
        order_sn: order_sn // Mã đơn hàng
        // Có thể cần thêm các tham số khác tùy vào yêu cầu của Shopee API
      },
      { headers } // Gửi cookie trong phần headers
    );

    return res.data.response.order_list[0]; // Lấy đơn hàng đầu tiên trong danh sách
  } catch (err) {
    console.error("Error fetching order details:", err);
    return null;
  }
};

module.exports = {
  checkMVD,
  generateQRCode,
  checkQRCode,
  loginQRCode,
  getOrderDetailsForCookie,
  saveVoucher,
  loginWithPassword,
  getOrderDetail,
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
