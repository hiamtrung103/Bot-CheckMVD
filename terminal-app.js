const fs = require('fs');
const readline = require('readline');
const { getOrderDetailsForCookie } = require('./Api/checkmvd');

// Tạo giao diện dòng lệnh để người dùng nhập cookie
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// Hàm đọc cookie từ file .txt
const readCookieFromFile = async (filePath) => {
  try {
    const fileData = fs.readFileSync(filePath, 'utf8');
    const cookiesArray = fileData.split('\n').map((cookie) => cookie.trim());
    return cookiesArray;
  } catch (err) {
    console.error("Lỗi khi đọc file:", err);
    return null;
  }
};

// Hàm xử lý và hiển thị thông tin đơn hàng từ cookies
const processCookies = async (cookiesArray) => {
  const orderDetails = await getOrderDetailsForCookie(cookiesArray);

  if (orderDetails && orderDetails.allOrderDetails.length > 0) {
    orderDetails.allOrderDetails.forEach((order) => {
      const orderInfo = order.orderDetails[0]; // Chọn đơn hàng đầu tiên (có thể là mảng nếu có nhiều đơn hàng)

      const trackingNumber = orderInfo.tracking_number || "Chưa có";
      const trackingDescription = orderInfo.tracking_info_description || "Không có mô tả";
      const shippingName = orderInfo.address.shipping_name || "Không có tên";
      const shippingPhone = orderInfo.address.shipping_phone || "Không có số điện thoại";
      const productName = orderInfo.product_info.length > 0 ? orderInfo.product_info[0].name : "Không có sản phẩm";
      const shippingAddress = orderInfo.address.shipping_address || "Không có địa chỉ";

      console.log("Thông tin đơn hàng:");
      console.log(`Mã vận đơn: ${trackingNumber}`);
      console.log(`Mô tả theo dõi: ${trackingDescription}`);
      console.log(`Tên: ${shippingName}`);
      console.log(`Số điện thoại: ${shippingPhone}`);
      console.log(`Sản phẩm: ${productName}`);
      console.log(`Địa chỉ giao hàng: ${shippingAddress}`);
      console.log("\n------------------------------------------\n");
    });
  } else {
    console.error("Lỗi khi lấy chi tiết đơn hàng.");
  }
};

// Hàm chính để chọn cách nhập cookie
const main = () => {
  rl.question("Bạn muốn nhập cookie thủ công hay qua file? (nhập '1' cho thủ công, '2' cho file): ", (answer) => {
    if (answer === '1') {
      // Nhập cookie thủ công qua terminal
      rl.question("Vui lòng nhập cookie của bạn (mỗi cookie cách nhau bằng dấu xuống dòng):\n", async (cookies) => {
        const cookiesArray = cookies.split('\n').map((cookie) => cookie.trim());
        await processCookies(cookiesArray);
        rl.close();
      });
    } else if (answer === '2') {
      // Nhập cookie qua file .txt
      rl.question("Vui lòng nhập đường dẫn đến file .txt chứa cookie: ", async (filePath) => {
        const cookiesArray = await readCookieFromFile(filePath);
        if (cookiesArray) {
          await processCookies(cookiesArray);
        }
        rl.close();
      });
    } else {
      console.log("Lựa chọn không hợp lệ.");
      rl.close();
    }
  });
};

main();
