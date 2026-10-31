# Ứng dụng Di động Đặt lịch Khám bệnh (Clinic Booking Mobile)

Ứng dụng di động được xây dựng bằng **React Native** và **Expo SDK 58 (TypeScript)**, kết nối trực tiếp đến hệ thống Backend Spring Boot & AI Gemini/Qdrant của phòng khám.

---

## 📱 Các tính năng chính

1. **Trang chủ (`HomeScreen`)**:
   - Banner chào mừng và nút đặt lịch nhanh.
   - Danh sách chuyên khoa trực quan.
   - Đội ngũ bác sĩ nổi bật.
   - Lối tắt nhanh tới các tiện ích (Đặt lịch, Trợ lý AI, Lịch sử khám).

2. **Tìm kiếm Bác sĩ (`DoctorsScreen` & `DoctorDetailScreen`)**:
   - Lọc bác sĩ theo chuyên khoa dạng chip.
   - Tìm kiếm theo tên hoặc khoa khám.
   - Xem hồ sơ chi tiết bác sĩ: trình độ, kinh nghiệm, thông tin liên hệ.
   - Đặt lịch khám trực tiếp với bác sĩ đã chọn.

3. **Luồng Đặt lịch khám 4 bước (`BookingScreen`)**:
   - **Bước 1**: Chọn Chuyên khoa & Bác sĩ.
   - **Bước 2**: Chọn Ngày khám & Ca trực (Sáng / Chiều / Tối). Hỗ trợ chọn hình thức (Tại phòng khám / Tư vấn Online).
   - **Bước 3**: Nhập thông tin bệnh nhân (Họ tên, SĐT, giới tính, triệu chứng).
   - **Bước 4**: Xem lại tóm tắt & Xác nhận hoàn tất.

4. **Quản lý Lịch hẹn (`AppointmentsScreen`)**:
   - Phân loại lịch: **Sắp tới** và **Lịch sử**.
   - Hiển thị trạng thái màu sắc trực quan: Chờ duyệt, Đã xác nhận, Hoàn tất, Đã hủy.
   - Cho phép người bệnh hủy lịch hẹn khi có việc bận.

5. **Trợ lý Y tế AI (`ChatbotScreen`)**:
   - Tích hợp mô hình AI **Gemini** kết hợp cơ sở tri thức **Qdrant Vector Database (RAG)**.
   - Giao diện trò chuyện thời gian thực, có gợi ý câu hỏi mẫu.

6. **Hồ sơ & Cấu hình máy chủ (`ProfileScreen`)**:
   - Thông tin tài khoản người bệnh.
   - **Tính năng đổi IP Server Backend trực tiếp trong App**: Giúp máy thật dễ dàng kết nối tới IP mạng LAN của máy tính đang chạy Spring Boot mà không cần sửa code.

---

## 🚀 Hướng dẫn khởi chạy ứng dụng

### 1. Chuẩn bị
Đảm bảo bạn đang ở trong thư mục `mobile`:
```bash
cd clinic-booking-system-final-v3/clinic-booking-system-final/mobile
```

### 2. Khởi chạy máy chủ Expo Metro Bundler
```bash
npx expo start
```
hoặc:
```bash
npm start
```

### 3. Trải nghiệm trên thiết bị:
* **Trên điện thoại thật (Android / iOS):**
  1. Cài đặt ứng dụng **Expo Go** từ Google Play Store hoặc Apple App Store.
  2. Quét mã QR hiển thị trên Terminal bằng camera (iOS) hoặc tính năng quét trong app Expo Go (Android).
  3. Vào tab **Hồ sơ** -> Cập nhật IP Backend thành IP máy tính của bạn (VD: `http://192.168.1.15:8080`).

* **Trên máy ảo Android:**
  - Nhấn phím `a` trên Terminal sau khi chạy `npm start`.
  - Mặc định app sẽ trỏ về `http://10.0.2.2:8080`.

* **Trên máy ảo iOS (macOS):**
  - Nhấn phím `i` trên Terminal.
