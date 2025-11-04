# Module Bán hàng

## Module dùng để làm gì
Quản lý đầu-cuối quy trình doanh thu: từ khách hàng/lead → cơ hội (deal/opportunity) → báo giá (estimate) → hợp đồng → hóa đơn (invoice) → thanh toán (payment) → công nợ → báo cáo. Mục tiêu là chuẩn hóa quy trình bán hàng, tăng tỷ lệ chốt, rút ngắn vòng quay tiền và giảm sai sót.

## Dành cho ai
- Nhân viên kinh doanh (Sales/Account): tạo và theo dõi lead/deal, lập báo giá, chốt hợp đồng.
- Kế toán/Tài chính: phát hành hóa đơn, ghi nhận thanh toán, đối soát công nợ.
- Quản lý/Ban lãnh đạo: giám sát pipeline, doanh thu, hiệu suất đội ngũ, tỷ lệ chuyển đổi.

## Làm như nào (các bước thao tác)

### 1) Thiết lập nền tảng (một lần/định kỳ)
   - **Cấu hình tổ chức**: Vào Settings > Organization để thiết lập:
     - Tiền tệ mặc định, thuế suất, ngôn ngữ, múi giờ
     - Mẫu hóa đơn, điều khoản thanh toán, chữ ký/branding (logo, màu sắc)
     - Thông tin pháp nhân, mã số thuế, địa chỉ
   - **Khai báo sản phẩm/dịch vụ**: Vào Settings > Products/Services:
     - Tạo danh mục: mã, tên, mô tả, đơn giá, đơn vị tính, thuế áp dụng
   - **Thiết lập Pipeline**: Vào Sales > Pipelines > Tạo mới:
     - Đặt tên pipeline (ví dụ: "B2B Sales", "B2C Sales")
     - Tạo các giai đoạn (stages): Lead → Qualified → Proposal → Negotiation → Closed Won/Closed Lost
     - Gán xác suất chốt (%) cho từng giai đoạn

### 2) Quản lý khách hàng/lead
   - Vào Contacts > Organization Contacts > Add:
     - Chọn loại: Customer (Khách hàng), Lead (Tiềm năng), Client (Khách hàng thân thiết)
     - Nhập thông tin pháp nhân: tên công ty, mã số thuế, địa chỉ, website
     - Thêm người liên hệ chính: họ tên, email, điện thoại, chức vụ
     - Gắn tags (nhãn), phân nhóm theo nguồn (Referral, Ads, Event, Cold Call) để đánh giá ROI
   - Cập nhật ghi chú, lịch sử tương tác, tài liệu liên quan

### 3) Tạo và theo dõi Deal/Cơ hội (Opportunity)
   - Vào Sales > Deals > Add Deal:
     - Nhập tên deal, chọn khách hàng/lead liên quan
     - Giá trị ước tính, ngày dự kiến chốt
     - Gán vào giai đoạn Pipeline (stage), chọn người phụ trách (owner)
   - **Cập nhật tiến độ**:
     - Ghi chú hoạt động: cuộc gọi, email, meeting, demo
     - Kéo thả deal giữa các giai đoạn khi tiến triển
     - Cập nhật xác suất chốt khi có thay đổi
   - **Thiết lập nhắc việc**: reminder cho follow-up, demo, review proposal

### 4) Lập báo giá/đề xuất (Estimate/Proposal)
   - Từ Deal, chọn "Create Estimate" hoặc vào Sales > Estimates > Add:
     - Chọn khách hàng, ngày báo giá, hạn hiệu lực (due date)
     - Thêm hạng mục chi tiết:
       - Sản phẩm/dịch vụ từ danh mục hoặc nhập tự do
       - Số lượng, đơn giá, chiết khấu (% hoặc số tiền cố định)
       - Thuế (Tax 1, Tax 2): % hoặc flat value
     - Chọn **loại báo giá**:
       - BY_PRODUCTS: theo sản phẩm
       - BY_EMPLOYEE_HOURS: theo giờ làm việc của nhân viên
       - BY_PROJECT_HOURS: theo giờ dự án
       - BY_TASK_HOURS: theo giờ nhiệm vụ
       - BY_EXPENSES: theo chi phí phát sinh
       - DETAILED_ITEMS: chi tiết từng mục tùy chỉnh
   - **Gửi và theo dõi**:
     - Gửi qua email từ hệ thống (kèm PDF)
     - Theo dõi trạng thái: **Draft** → **Sent** → **Viewed** → **Accepted** / **Rejected** / **Void**
     - Nhận thông báo khi khách hàng mở email/xem báo giá

### 5) Chuyển báo giá thành hợp đồng (tùy chọn) và/hoặc hóa đơn
   - Khi báo giá **Accepted**:
     - Chuyển thành hợp đồng (Contract) nếu cần ký kết pháp lý
     - Tạo lịch thanh toán: một lần (lump sum) hoặc nhiều đợt (milestone-based)
   - Hoặc tạo thẳng **Invoice** từ Estimate để phát hành thu tiền

### 6) Phát hành hóa đơn (Invoice)
   - Vào Sales > Invoices > Add Invoice (hoặc "Convert from Estimate"):
     - Kiểm tra thông tin: khách hàng, số hóa đơn, ngày phát hành, hạn thanh toán
     - Chọn **loại hóa đơn** (tương tự Estimate):
       - BY_EMPLOYEE_HOURS, BY_PROJECT_HOURS, BY_TASK_HOURS
       - BY_PRODUCTS, BY_EXPENSES, DETAILED_ITEMS
     - Xác nhận tổng tiền, thuế, chiết khấu
   - **Gửi hóa đơn**:
     - Gửi qua email kèm PDF, tùy chọn thêm liên kết thanh toán online
     - Cấu hình tự động gửi nhắc nhở khi sắp/quá hạn
   - **Theo dõi trạng thái**:
     - **Draft**: Nháp, chưa gửi
     - **Sent**: Đã gửi cho khách hàng
     - **Viewed**: Khách hàng đã xem
     - **Partially Paid**: Thanh toán một phần
     - **Fully Paid**: Thanh toán đủ
     - **Overpaid**: Thanh toán thừa
     - **Void**: Hủy bỏ

### 7) Ghi nhận thanh toán (Payment) và xử lý công nợ
   - Khi nhận tiền: vào Invoice > Add Payment:
     - Chọn **phương thức thanh toán**:
       - Bank Transfer (chuyển khoản ngân hàng)
       - Cash (tiền mặt)
       - Credit Card (thẻ tín dụng)
       - Debit Card (thẻ ghi nợ)
       - Cheque (séc)
       - Online Payment (cổng thanh toán online: Stripe, PayPal, v.v.)
     - Nhập số tiền thực nhận, ngày thanh toán, ghi chú (số giao dịch, mã tham chiếu)
   - **Hệ thống tự động**:
     - Cập nhật trạng thái hóa đơn: Partially Paid / Fully Paid / Overpaid
     - Tính công nợ còn lại (Amount Due) theo khách hàng
     - Ghi nhận vào sổ kế toán (nếu tích hợp)
   - **Xử lý đặc biệt**:
     - Hoàn tiền: tạo Credit Note (phiếu ghi có)
     - Hóa đơn điều chỉnh: tạo Invoice mới liên kết với hóa đơn gốc
     - Nợ xấu: đánh dấu Void và ghi nhận vào báo cáo rủi ro

### 8) Theo dõi chỉ số và báo cáo
   - **Pipeline metrics**:
     - Số deal theo giai đoạn, giá trị pipeline tổng
     - Tỷ lệ chuyển đổi giữa các giai đoạn
     - Thời gian trung bình ở mỗi giai đoạn (sales velocity)
   - **Doanh thu**:
     - Doanh thu theo kỳ (ngày/tuần/tháng/quý/năm)
     - Phân tích theo: khách hàng, sản phẩm, nhân viên, kênh, nguồn
     - So sánh kế hoạch vs thực tế
   - **Công nợ**:
     - Tổng công nợ phải thu (Accounts Receivable)
     - DSO (Days Sales Outstanding): số ngày trung bình để thu tiền
     - Nợ quá hạn theo độ tuổi: 0-30, 31-60, 61-90, >90 ngày
   - **Hiệu suất**:
     - Doanh thu/nhân viên, tỷ lệ chốt/nhân viên
     - Win rate (% deal thắng/tổng deal)
     - Average deal size, sales cycle length

## Mẹo vận hành

1. **Chuẩn hóa quy trình**
   - Thiết lập template báo giá/hóa đơn chuẩn để giảm sai sót
   - Quy ước đặt tên deal, số hóa đơn theo format thống nhất (ví dụ: INV-2025-0001)
   - Xây dựng playbook cho từng giai đoạn pipeline

2. **Tối ưu chuyển đổi**
   - Gắn tag/nguồn cho mỗi lead/deal để đo ROI từng kênh marketing
   - Phân tích giai đoạn có tỷ lệ rớt cao nhất để cải thiện
   - A/B test mẫu báo giá, điều khoản thanh toán

3. **Tự động hóa**
   - Thiết lập reminder tự động cho:
     - Deal sắp quá hạn follow-up
     - Báo giá sắp hết hạn hiệu lực
     - Hóa đơn sắp/quá hạn thanh toán
   - Tích hợp email marketing để nurture lead tự động
   - Webhook/Zapier để đồng bộ với CRM/ERP bên ngoài

4. **Quản lý rủi ro**
   - Thiết lập chính sách tín dụng: hạn mức công nợ, thời hạn thanh toán theo từng khách hàng
   - Phê duyệt đa cấp cho deal/hóa đơn giá trị lớn
   - Theo dõi chặt chẽ nợ quá hạn, có kế hoạch thu hồi
   - Sao lưu chứng từ (hóa đơn, hợp đồng, chứng từ thanh toán) định kỳ

5. **Đào tạo & kiểm soát**
   - Onboarding cho nhân viên mới về cách sử dụng module
   - Review định kỳ pipeline, dọn dẹp deal cũ/ngừng hoạt động
   - Audit log để theo dõi ai đã sửa/xóa hóa đơn, thanh toán

