# Module Tổ chức

## Module dùng để làm gì
Thiết lập khung vận hành: pháp nhân, chi nhánh, cơ cấu phòng ban, vai trò & phân quyền, chuẩn cấu hình (tiền tệ, thuế, template, tích hợp).

## Dành cho ai
- Quản trị hệ thống (Admin): thiết lập mặc định và quyền truy cập.
- Chủ doanh nghiệp/Operations: cấu hình chi nhánh, quy ước kinh doanh.

## Làm như nào (các bước thao tác)
1) Tạo tổ chức & chi nhánh
   - Vào Tổ chức > Tạo mới: tên pháp nhân, mã số thuế, địa chỉ.
   - Thêm chi nhánh/đơn vị trực thuộc; gán người quản lý tại chỗ.
2) Cơ cấu & quyền hạn
   - Tạo phòng ban, chức danh, sơ đồ báo cáo.
   - Thiết lập vai trò (Role) và quyền (Permission) theo nguyên tắc ít quyền nhất.
3) Cấu hình chuẩn
   - Thiết lập tiền tệ mặc định, thuế suất, ngôn ngữ, múi giờ.
   - Tùy biến mẫu tài liệu (hóa đơn, hợp đồng, email), branding (logo, màu sắc).
4) Tích hợp & bảo mật
   - Kết nối cổng thanh toán, email, SSO, kế toán (nếu dùng).
   - Bật xác thực 2 lớp (2FA), chính sách mật khẩu; nhật ký hoạt động (audit log).
5) Dữ liệu nền
   - Danh mục sản phẩm/dịch vụ, thẻ/tag, lý do trạng thái, pipeline.
   - Quy định SLA, KPI chung cho toàn tổ chức.

Mẹo vận hành
- Lập văn bản quy trình (SOP) cho từng cấu hình quan trọng để dễ nhân rộng/khôi phục.
- Phân quyền theo vai trò (RBAC) thay vì gán quyền cho từng người để dễ quản lý.
- Sao lưu cấu hình định kỳ, đặc biệt trước khi thay đổi lớn.
- Kiểm tra nhật ký audit log để phát hiện hành vi bất thường hoặc vi phạm chính sách.

